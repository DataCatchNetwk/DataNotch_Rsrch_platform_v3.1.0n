import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateResearcherApplicationDto } from './dto/create-researcher-application.dto';
import { QueryResearcherApplicationsDto } from './dto/query-researcher-applications.dto';
import { RequestMoreInfoDto } from './dto/request-more-info.dto';
import { ReviewResearcherApplicationDto } from './dto/review-researcher-application.dto';
import {
  APPLICATION_MAILER_PORT,
  ApplicationMailerPort,
} from './ports/application-mailer.port';
import {
  APPLICATION_QUEUE_PORT,
  ApplicationQueuePort,
} from './ports/application-queue.port';
import {
  FILE_STORAGE_PORT,
  FileStoragePort,
} from './ports/file-storage.port';
import {
  AccountStatus,
  ApplicationReviewDecision,
  ApplicationReviewStatus,
} from './types/researcher-application.types';

interface UploadedFilesMap {
  cvFile?: Express.Multer.File[];
  affiliationProofFile?: Express.Multer.File[];
  irbDocumentFile?: Express.Multer.File[];
}

@Injectable()
export class ResearcherApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(FILE_STORAGE_PORT)
    private readonly storage: FileStoragePort,
    @Inject(APPLICATION_MAILER_PORT)
    private readonly mailer: ApplicationMailerPort,
    @Inject(APPLICATION_QUEUE_PORT)
    private readonly queue: ApplicationQueuePort,
  ) {}

  async createApplication(
    dto: CreateResearcherApplicationDto,
    files: UploadedFilesMap,
  ) {
    await this.ensureUniqueApplicant(dto.email, dto.institutionEmail);
    this.validateInstitutionEmailRules(dto);
    this.validateIrbRules(dto);

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });

    const uploaded = await this.uploadSupportingFiles(dto.email, files);

    const created = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email.toLowerCase(),
          institutionEmail: dto.institutionEmail?.toLowerCase() || null,
          phoneCode: dto.phoneCode,
          mobileNumber: dto.mobileNumber,
          passwordHash,
          dateOfBirth: new Date(dto.dateOfBirth),
          role: 'USER',
          accountStatus: AccountStatus.PENDING_APPROVAL,
        },
      });

      const application = await tx.researcherApplication.create({
        data: {
          userId: user.id,
          researcherType: dto.researcherType,
          institution: dto.institution,
          department: dto.department,
          roleTitle: dto.roleTitle,
          country: dto.country,
          city: dto.city,
          yearsOfExperience: dto.yearsOfExperience,
          researchArea: dto.researchArea,
          shortBio: dto.shortBio,
          researchInterests: dto.researchInterests,
          platformPurpose: dto.platformPurpose,
          expectedDatasets: dto.expectedDatasets,
          collaborationType: dto.collaborationType,
          featureNeedsJson: dto.featureNeeds,
          usesSensitiveData: dto.usesSensitiveData,
          irbRequired: dto.irbRequired,
          irbProtocolNumber: dto.irbProtocolNumber || null,
          dataSensitivityLevel: dto.dataSensitivityLevel,
          fundingSource: dto.fundingSource || null,
          supervisorName: dto.supervisorName,
          supervisorEmail: dto.supervisorEmail.toLowerCase(),
          cvFileUrl: uploaded.cvFileUrl,
          affiliationProofUrl: uploaded.affiliationProofUrl,
          irbDocumentUrl: uploaded.irbDocumentUrl,
          reviewStatus: ApplicationReviewStatus.PENDING,
        },
      });

      await tx.notification.create({
        data: {
          userId: user.id,
          type: 'APPLICATION_SUBMITTED',
          title: 'Application submitted',
          body: 'Your researcher application has been submitted and is pending admin review.',
          metadataJson: {
            applicationId: application.id,
          },
        },
      });

      return { user, application };
    });

    await Promise.all([
      this.queue.enqueueNewSubmission({
        applicationId: created.application.id,
        userId: created.user.id,
        email: created.user.email,
        institution: created.application.institution,
      }),
      this.mailer.sendSubmissionReceivedEmail({
        to: created.user.email,
        applicantName: `${created.user.firstName} ${created.user.lastName}`,
        applicationId: created.application.id,
        institution: created.application.institution,
      }),
    ]);

    return {
      success: true,
      applicationId: created.application.id,
      accountStatus: created.user.accountStatus,
      reviewStatus: created.application.reviewStatus,
      reviewEta: '2-5 business days',
    };
  }

  async listForAdmin(query: QueryResearcherApplicationsDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const where = {
      ...(query.reviewStatus ? { reviewStatus: query.reviewStatus } : {}),
      ...(query.search
        ? {
            OR: [
              { institution: { contains: query.search, mode: 'insensitive' as const } },
              { researchArea: { contains: query.search, mode: 'insensitive' as const } },
              {
                user: {
                  OR: [
                    { firstName: { contains: query.search, mode: 'insensitive' as const } },
                    { lastName: { contains: query.search, mode: 'insensitive' as const } },
                    { email: { contains: query.search, mode: 'insensitive' as const } },
                  ],
                },
              },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.researcherApplication.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: query.sortDirection === 'asc' ? 'asc' : 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              accountStatus: true,
              createdAt: true,
            },
          },
        },
      }),
      this.prisma.researcherApplication.count({ where }),
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

  async getAdminDetail(applicationId: string) {
    const application = await this.prisma.researcherApplication.findUnique({
      where: { id: applicationId },
      include: {
        user: true,
      },
    });

    if (!application) {
      throw new NotFoundException('Researcher application not found');
    }

    return application;
  }

  async reviewApplication(
    applicationId: string,
    dto: ReviewResearcherApplicationDto,
    reviewerUserId: string,
  ) {
    const application = await this.prisma.researcherApplication.findUnique({
      where: { id: applicationId },
      include: { user: true },
    });

    if (!application) {
      throw new NotFoundException('Researcher application not found');
    }

    if (application.reviewStatus === ApplicationReviewStatus.APPROVED) {
      throw new BadRequestException('This application has already been approved');
    }

    const nextReviewStatus =
      dto.decision === ApplicationReviewDecision.APPROVE
        ? ApplicationReviewStatus.APPROVED
        : ApplicationReviewStatus.REJECTED;

    const nextAccountStatus =
      dto.decision === ApplicationReviewDecision.APPROVE
        ? AccountStatus.APPROVED_2FA_PENDING
        : AccountStatus.REJECTED;

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: application.userId },
        data: {
          accountStatus: nextAccountStatus,
          ...(dto.requestedRole ? { role: dto.requestedRole as never } : {}),
        },
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

      await tx.notification.create({
        data: {
          userId: application.userId,
          type:
            nextReviewStatus === ApplicationReviewStatus.APPROVED
              ? 'APPLICATION_APPROVED'
              : 'APPLICATION_REJECTED',
          title:
            nextReviewStatus === ApplicationReviewStatus.APPROVED
              ? 'Application approved'
              : 'Application rejected',
          body:
            nextReviewStatus === ApplicationReviewStatus.APPROVED
              ? 'Your researcher application has been approved.'
              : 'Your researcher application has been rejected.',
          metadataJson: {
            applicationId: application.id,
            reviewStatus: nextReviewStatus,
          },
        },
      });

      return { updatedUser, updatedApplication };
    });

    await Promise.all([
      this.queue.enqueueReviewCompleted({
        applicationId: application.id,
        userId: application.userId,
        reviewStatus: nextReviewStatus,
      }),
      this.mailer.sendReviewDecisionEmail({
        to: application.user.email,
        applicantName: `${application.user.firstName} ${application.user.lastName}`,
        applicationId: application.id,
        reviewStatus: nextReviewStatus,
        notes: dto.notes || null,
      }),
    ]);

    return {
      success: true,
      applicationId: application.id,
      reviewStatus: updated.updatedApplication.reviewStatus,
      accountStatus: updated.updatedUser.accountStatus,
    };
  }

  async requestMoreInfo(
    applicationId: string,
    dto: RequestMoreInfoDto,
    reviewerUserId: string,
  ) {
    const application = await this.prisma.researcherApplication.findUnique({
      where: { id: applicationId },
      include: { user: true },
    });

    if (!application) {
      throw new NotFoundException('Researcher application not found');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedApplication = await tx.researcherApplication.update({
        where: { id: applicationId },
        data: {
          reviewStatus: ApplicationReviewStatus.NEEDS_MORE_INFO,
          adminReviewNotes: dto.notes,
          reviewedByAdminId: reviewerUserId,
          reviewedAt: new Date(),
        },
      });

      await tx.notification.create({
        data: {
          userId: application.userId,
          type: 'APPLICATION_NEEDS_MORE_INFO',
          title: 'More information requested',
          body: 'An administrator requested additional information for your application.',
          metadataJson: {
            applicationId,
            dueDate: dto.dueDate || null,
          },
        },
      });

      return updatedApplication;
    });

    await this.mailer.sendNeedsMoreInfoEmail({
      to: application.user.email,
      applicantName: `${application.user.firstName} ${application.user.lastName}`,
      applicationId,
      notes: dto.notes,
    });

    return {
      success: true,
      applicationId,
      reviewStatus: updated.reviewStatus,
    };
  }

  private async ensureUniqueApplicant(email: string, institutionEmail?: string) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          ...(institutionEmail ? [{ institutionEmail: institutionEmail.toLowerCase() }] : []),
        ],
      },
      select: {
        id: true,
        email: true,
      },
    });

    if (existing) {
      throw new ConflictException('An account already exists for this email');
    }
  }

  private validateInstitutionEmailRules(dto: CreateResearcherApplicationDto) {
    const primaryEmail = dto.email.toLowerCase();
    const hasInstitutionalPrimary =
      primaryEmail.endsWith('.edu') || primaryEmail.includes('.ac.');

    if (!hasInstitutionalPrimary && !dto.institutionEmail) {
      throw new BadRequestException(
        'Provide an institutional email when the primary email is not institutional',
      );
    }
  }

  private validateIrbRules(dto: CreateResearcherApplicationDto) {
    if (dto.irbRequired === 'yes' && !dto.irbProtocolNumber) {
      throw new BadRequestException(
        'IRB protocol number is required when IRB approval is needed',
      );
    }
  }

  private async uploadSupportingFiles(email: string, files: UploadedFilesMap) {
    const folder = `researcher-applications/${this.slugify(email)}`;
    const cv = files.cvFile?.[0];
    const affiliation = files.affiliationProofFile?.[0];
    const irb = files.irbDocumentFile?.[0];

    const [cvUpload, affiliationUpload, irbUpload] = await Promise.all([
      cv
        ? this.storage.upload({
            folder,
            filename: `cv-${Date.now()}-${cv.originalname}`,
            buffer: cv.buffer,
            contentType: cv.mimetype,
          })
        : Promise.resolve(null),
      affiliation
        ? this.storage.upload({
            folder,
            filename: `affiliation-${Date.now()}-${affiliation.originalname}`,
            buffer: affiliation.buffer,
            contentType: affiliation.mimetype,
          })
        : Promise.resolve(null),
      irb
        ? this.storage.upload({
            folder,
            filename: `irb-${Date.now()}-${irb.originalname}`,
            buffer: irb.buffer,
            contentType: irb.mimetype,
          })
        : Promise.resolve(null),
    ]);

    return {
      cvFileUrl: cvUpload?.url ?? null,
      affiliationProofUrl: affiliationUpload?.url ?? null,
      irbDocumentUrl: irbUpload?.url ?? null,
    };
  }

  private slugify(value: string) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }
}
