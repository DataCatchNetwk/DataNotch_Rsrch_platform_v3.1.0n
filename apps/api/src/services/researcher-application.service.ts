import fs from 'node:fs';
import path from 'node:path';
import { prisma } from '../db/prisma.js';
import { hashPassword } from '../utils/password.js';
import { HttpError } from '../utils/errors.js';
import type { ApplicationReviewStatus, ResearcherType } from '@prisma/client';
import { logAdminAuditEvent } from './audit.service.js';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CreateApplicationInput {
  // Account info
  firstName: string;
  lastName: string;
  email: string;
  institutionEmail?: string;
  phoneCode: string;
  mobileNumber: string;
  password: string;
  dateOfBirth: string;
  referralCode?: string;
  // Institutional info
  researcherType: string;
  institution: string;
  department: string;
  roleTitle: string;
  country: string;
  city: string;
  yearsOfExperience: string;
  // Research
  researchArea: string;
  shortBio: string;
  researchInterests: string;
  platformPurpose: string;
  expectedDatasets: string;
  collaborationType: string;
  featureNeeds: string | string[];
  // Compliance
  usesSensitiveData: string;
  irbRequired: string;
  irbProtocolNumber?: string;
  dataSensitivityLevel: string;
  fundingSource?: string;
  supervisorName: string;
  supervisorEmail: string;
}

export interface UploadedFiles {
  cvFile?: Express.Multer.File[];
  affiliationProofFile?: Express.Multer.File[];
  irbDocumentFile?: Express.Multer.File[];
}

export interface ReviewInput {
  decision: 'APPROVE' | 'REJECT';
  notes?: string;
}

export interface RequestMoreInfoInput {
  notes: string;
  dueDate?: string;
}

export interface ListApplicationsQuery {
  page?: number;
  limit?: number;
  search?: string;
  reviewStatus?: string;
  sortDirection?: 'asc' | 'desc';
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function parseBooleanField(value: string | boolean | undefined): boolean {
  if (typeof value === 'boolean') return value;
  return value === 'true' || value === '1' || value === 'yes';
}

function parseStringArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String);
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads', 'applications');

function saveUploadedFile(file: Express.Multer.File, subfolder: string): string {
  const dir = path.join(UPLOAD_DIR, subfolder);
  fs.mkdirSync(dir, { recursive: true });
  const ext = path.extname(file.originalname);
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
  const dest = path.join(dir, filename);
  fs.writeFileSync(dest, file.buffer);
  return `/uploads/applications/${subfolder}/${filename}`;
}

function uploadFiles(
  applicantEmail: string,
  files: UploadedFiles,
): { cvFileUrl?: string; affiliationProofUrl?: string; irbDocumentUrl?: string } {
  const subfolder = applicantEmail.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  return {
    cvFileUrl: files.cvFile?.[0] ? saveUploadedFile(files.cvFile[0], subfolder) : undefined,
    affiliationProofUrl: files.affiliationProofFile?.[0]
      ? saveUploadedFile(files.affiliationProofFile[0], subfolder)
      : undefined,
    irbDocumentUrl: files.irbDocumentFile?.[0]
      ? saveUploadedFile(files.irbDocumentFile[0], subfolder)
      : undefined,
  };
}

// ─── Service functions ───────────────────────────────────────────────────────

export async function createApplication(dto: CreateApplicationInput, files: UploadedFiles) {
  const emailLower = dto.email.toLowerCase();

  // Check uniqueness
  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { email: emailLower },
        ...(dto.institutionEmail
          ? [{ email: dto.institutionEmail.toLowerCase() }]
          : []),
      ],
    },
  });
  if (existing) {
    throw new HttpError(409, 'An account with this email already exists.');
  }

  // Validate IRB
  const irbRequired = parseBooleanField(dto.irbRequired);
  if (irbRequired && !dto.irbProtocolNumber?.trim()) {
    throw new HttpError(400, 'IRB protocol number is required when IRB is required.');
  }

  const passwordHash = await hashPassword(dto.password);
  const uploaded = uploadFiles(emailLower, files);
  const featureNeeds = parseStringArray(dto.featureNeeds);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        firstname: dto.firstName,
        surname: dto.lastName,
        email: emailLower,
        countryCode: dto.phoneCode,
        mobileNumber: dto.mobileNumber,
        passwordHash,
        dateOfBirth: new Date(dto.dateOfBirth),
        accountStatus: 'PENDING_APPROVAL',
        referralCode: dto.referralCode || null,
      },
    });

    const application = await tx.researcherApplication.create({
      data: {
        userId: user.id,
        researcherType: dto.researcherType as ResearcherType,
        institution: dto.institution,
        department: dto.department,
        roleTitle: dto.roleTitle,
        country: dto.country,
        city: dto.city,
        yearsOfExperience: parseInt(dto.yearsOfExperience, 10) || 0,
        researchArea: dto.researchArea,
        shortBio: dto.shortBio,
        researchInterests: dto.researchInterests,
        platformPurpose: dto.platformPurpose,
        expectedDatasets: dto.expectedDatasets,
        collaborationType: dto.collaborationType,
        featureNeedsJson: featureNeeds,
        usesSensitiveData: parseBooleanField(dto.usesSensitiveData),
        irbRequired,
        irbProtocolNumber: dto.irbProtocolNumber || null,
        dataSensitivityLevel: dto.dataSensitivityLevel,
        fundingSource: dto.fundingSource || null,
        supervisorName: dto.supervisorName,
        supervisorEmail: dto.supervisorEmail.toLowerCase(),
        cvFileUrl: uploaded.cvFileUrl,
        affiliationProofUrl: uploaded.affiliationProofUrl,
        irbDocumentUrl: uploaded.irbDocumentUrl,
        reviewStatus: 'PENDING',
      },
    });

    await tx.accessRequest.create({
      data: {
        requesterId: user.id,
        requestedRole: 'USER',
        justification: dto.platformPurpose,
        status: 'PENDING',
      },
    });

    await tx.notification.create({
      data: {
        userId: user.id,
        type: 'APPLICATION_SUBMITTED',
        title: 'Application submitted',
        description:
          'Your researcher application has been submitted and is pending admin review.',
        severity: 'INFO',
      },
    });

    return { user, application };
  });

  // No-op placeholders for queue / mailer — swap with real implementations later
  console.info('[application-queue] enqueueNewSubmission', {
    applicationId: result.application.id,
    userId: result.user.id,
    email: result.user.email,
    institution: result.application.institution,
  });
  console.info('[application-mailer] sendSubmissionReceivedEmail', {
    to: result.user.email,
    applicantName: `${result.user.firstname} ${result.user.surname}`,
    applicationId: result.application.id,
    institution: result.application.institution,
  });

  return {
    success: true,
    applicationId: result.application.id,
    accountStatus: result.user.accountStatus,
    reviewStatus: result.application.reviewStatus,
    reviewEta: '2-5 business days',
  };
}

export async function listApplicationsForAdmin(query: ListApplicationsQuery) {
  const page = query.page ?? 1;
  const limit = Math.min(query.limit ?? 20, 100);
  const skip = (page - 1) * limit;

  const where = {
    ...(query.reviewStatus
      ? { reviewStatus: query.reviewStatus as ApplicationReviewStatus }
      : {}),
    ...(query.search
      ? {
          OR: [
            { institution: { contains: query.search, mode: 'insensitive' as const } },
            { researchArea: { contains: query.search, mode: 'insensitive' as const } },
            {
              user: {
                OR: [
                  { firstname: { contains: query.search, mode: 'insensitive' as const } },
                  { surname: { contains: query.search, mode: 'insensitive' as const } },
                  { email: { contains: query.search, mode: 'insensitive' as const } },
                ],
              },
            },
          ],
        }
      : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.researcherApplication.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: query.sortDirection === 'asc' ? 'asc' : 'desc' },
      include: {
        user: {
          select: {
            id: true,
            firstname: true,
            surname: true,
            email: true,
            accountStatus: true,
            createdAt: true,
          },
        },
      },
    }),
    prisma.researcherApplication.count({ where }),
  ]);

  return {
    items,
    meta: {
      page,
      limit,
      total,
      pageCount: Math.ceil(total / limit),
    },
  };
}

export async function getApplicationDetail(applicationId: string) {
  const application = await prisma.researcherApplication.findUnique({
    where: { id: applicationId },
    include: { user: true },
  });
  if (!application) throw new HttpError(404, 'Researcher application not found');
  return application;
}

export async function reviewApplication(
  applicationId: string,
  dto: ReviewInput,
  reviewerUserId: string,
) {
  const application = await prisma.researcherApplication.findUnique({
    where: { id: applicationId },
    include: { user: true },
  });
  if (!application) throw new HttpError(404, 'Researcher application not found');
  if (application.reviewStatus === 'APPROVED') {
    throw new HttpError(400, 'This application has already been approved');
  }

  const nextReviewStatus: ApplicationReviewStatus =
    dto.decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
  const nextAccountStatus = dto.decision === 'APPROVE' ? 'APPROVED_2FA_PENDING' : 'REJECTED';

  const notificationType = nextReviewStatus === 'APPROVED'
    ? 'APPLICATION_APPROVED' as const
    : 'APPLICATION_REJECTED' as const;

  const updated = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: application.userId },
      data: { accountStatus: nextAccountStatus },
    });

    const updatedApplication = await tx.researcherApplication.update({
      where: { id: application.id },
      data: {
        reviewStatus: nextReviewStatus,
        adminReviewNotes: dto.notes || null,
        reviewedByAdminId: reviewerUserId,
        reviewedAt: new Date(),
      },
    });

    await tx.accessRequest.updateMany({
      where: { requesterId: application.userId, status: 'PENDING' },
      data: {
        status: nextReviewStatus === 'APPROVED' ? 'APPROVED' : 'REJECTED',
        reviewedById: reviewerUserId,
        reviewedAt: new Date(),
      },
    });

    await tx.notification.create({
      data: {
        userId: application.userId,
        type: notificationType,
        title:
          nextReviewStatus === 'APPROVED'
            ? 'Application approved'
            : 'Application rejected',
        description:
          nextReviewStatus === 'APPROVED'
            ? 'Your researcher application has been approved. Please complete 2FA setup to activate your account.'
            : 'Your researcher application has been rejected.',
        severity: nextReviewStatus === 'APPROVED' ? 'SUCCESS' : 'WARNING',
      },
    });

    return { updatedUser, updatedApplication };
  });

  // No-op placeholder
  await logAdminAuditEvent({
    actorUserId: reviewerUserId,
    action: nextReviewStatus === 'APPROVED' ? 'ACCESS_REQUEST_APPROVED' : 'ACCESS_REQUEST_REJECTED',
    targetType: 'ResearcherApplication',
    targetId: application.id,
    severity: nextReviewStatus === 'APPROVED' ? 'MEDIUM' : 'HIGH',
    metadata: { reviewStatus: nextReviewStatus, accountStatus: updated.updatedUser.accountStatus },
  });

  console.info('[application-queue] enqueueReviewCompleted', {
    applicationId: application.id,
    userId: application.userId,
    reviewStatus: nextReviewStatus,
  });
  console.info('[application-mailer] sendReviewDecisionEmail', {
    to: application.user.email,
    applicantName: `${application.user.firstname} ${application.user.surname}`,
    applicationId: application.id,
    reviewStatus: nextReviewStatus,
    notes: dto.notes,
  });

  return {
    success: true,
    applicationId: application.id,
    reviewStatus: updated.updatedApplication.reviewStatus,
    accountStatus: updated.updatedUser.accountStatus,
  };
}

export async function requestMoreInfo(
  applicationId: string,
  dto: RequestMoreInfoInput,
  reviewerUserId: string,
) {
  const application = await prisma.researcherApplication.findUnique({
    where: { id: applicationId },
    include: { user: true },
  });
  if (!application) throw new HttpError(404, 'Researcher application not found');

  const updated = await prisma.$transaction(async (tx) => {
    const updatedApplication = await tx.researcherApplication.update({
      where: { id: application.id },
      data: {
        reviewStatus: 'NEEDS_MORE_INFO',
        adminReviewNotes: dto.notes,
        reviewedByAdminId: reviewerUserId,
        reviewedAt: new Date(),
      },
    });

    await tx.notification.create({
      data: {
        userId: application.userId,
        type: 'APPLICATION_NEEDS_MORE_INFO',
        title: 'Additional information requested',
        description: `The admin has requested more information about your application: ${dto.notes}`,
        severity: 'WARNING',
      },
    });

    await tx.adminAuditEvent.create({
      data: {
        actorUserId: reviewerUserId,
        action: 'ACCESS_REQUEST_MORE_INFO',
        targetType: 'ResearcherApplication',
        targetId: application.id,
        severity: 'MEDIUM',
        metadataJson: { notes: dto.notes, dueDate: dto.dueDate },
      },
    });

    return updatedApplication;
  });

  console.info('[application-mailer] sendNeedsMoreInfoEmail', {
    to: application.user.email,
    applicantName: `${application.user.firstname} ${application.user.surname}`,
    applicationId: application.id,
    notes: dto.notes,
  });

  return {
    success: true,
    applicationId: application.id,
    reviewStatus: updated.reviewStatus,
  };
}
