import { AccessRequestStatus, AccountStatus, AnalysisJobStatus, ApplicationReviewStatus, ImportJobStatus } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { HttpError } from '../utils/errors.js';
import { reviewApplication } from './researcher-application.service.js';

type AdminRole = 'USER' | 'REVIEWER' | 'STAFF' | 'ADMIN' | 'SUPER_ADMIN';
type AdminStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED';

function timeAgo(input: Date | null) {
  if (!input) return 'Never';
  const deltaMs = Date.now() - input.getTime();
  const minuteMs = 60_000;
  const hourMs = 60 * minuteMs;
  const dayMs = 24 * hourMs;
  if (deltaMs < hourMs) return `${Math.max(1, Math.floor(deltaMs / minuteMs))} min ago`;
  if (deltaMs < dayMs) return `${Math.max(1, Math.floor(deltaMs / hourMs))} hr ago`;
  return `${Math.max(1, Math.floor(deltaMs / dayMs))} day ago`;
}

function formatTimestamp(input: Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(input);
}

function mapRoleNames(roleNames: string[]): AdminRole {
  if (roleNames.includes('SUPER_ADMIN')) return 'SUPER_ADMIN';
  if (roleNames.includes('ADMIN')) return 'ADMIN';
  if (roleNames.includes('REVIEWER')) return 'REVIEWER';
  if (roleNames.includes('STAFF')) return 'STAFF';
  return 'USER';
}

function mapAccountStatus(status: AccountStatus): AdminStatus {
  if (status === AccountStatus.SUSPENDED || status === AccountStatus.REJECTED) return 'SUSPENDED';
  if (status === AccountStatus.PENDING_APPROVAL) return 'PENDING';
  return 'ACTIVE';
}

function mapSeverity(action: string): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (/DELETE|REJECT|SUSPEND|FAIL/i.test(action)) return 'HIGH';
  if (/APPROVE|UPDATE|ROLE|STATUS|REGISTER/i.test(action)) return 'MEDIUM';
  return 'LOW';
}

async function ensureRole(name: string) {
  return prisma.role.upsert({
    where: { name },
    update: {},
    create: { name, description: `${name} role` },
  });
}

export async function getAdminOverview() {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [
    totalUsers,
    activeSessionCount,
    totalDatasets,
    runningAnalysisJobs,
    runningImportJobs,
    pendingApprovals,
    failedJobs,
  ] = await prisma.$transaction([
    prisma.user.count(),
    prisma.auditLog.count({ where: { action: 'LOGIN', createdAt: { gte: yesterday } } }),
    prisma.healthData.count(),
    prisma.analysisJob.count({ where: { status: AnalysisJobStatus.RUNNING } }),
    prisma.importJob.count({ where: { status: ImportJobStatus.RUNNING } }),
    prisma.accessRequest.count({ where: { status: AccessRequestStatus.PENDING } }),
    prisma.importJob.count({ where: { status: ImportJobStatus.FAILED } }),
  ]);

  const runningJobs = runningAnalysisJobs + runningImportJobs;
  const systemHealth = failedJobs > 0 ? 'Warning' : runningJobs > 25 ? 'Critical' : 'Healthy';

  return {
    totalUsers,
    activeSessions: activeSessionCount,
    totalDatasets,
    runningJobs,
    pendingApprovals,
    systemHealth,
  };
}

export async function getAdminUsers() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: { roles: { include: { role: true } } },
  });

  return users.map((user) => {
    const roleNames = user.roles.map((entry) => entry.role.name);
    return {
      id: user.id,
      fullName: `${user.firstname} ${user.surname}`.trim(),
      email: user.email,
      role: mapRoleNames(roleNames),
      status: mapAccountStatus(user.accountStatus),
      institution: user.institution ?? 'Not set',
      lastLogin: timeAgo(user.lastLoginAt),
    };
  });
}

export async function updateAdminUserRole(userId: string, role: AdminRole) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new HttpError(404, `User ${userId} not found`);

  const targetRoleName = role === 'USER' ? 'ANALYST' : role;
  const targetRole = await ensureRole(targetRoleName);

  await prisma.$transaction([
    prisma.userRole.deleteMany({ where: { userId } }),
    prisma.userRole.create({ data: { userId, roleId: targetRole.id } }),
    prisma.auditLog.create({
      data: {
        userId,
        action: 'ROLE_UPDATED',
        entity: 'User',
        entityId: userId,
        metadata: { role: targetRoleName },
      },
    }),
  ]);

  const [updated] = await Promise.all([getAdminUsers()]);
  const target = updated.find((item) => item.id === userId);
  if (!target) throw new HttpError(404, `User ${userId} not found`);
  return target;
}

export async function updateAdminUserStatus(userId: string, status: AdminStatus) {
  const targetStatus =
    status === 'ACTIVE'
      ? AccountStatus.ACTIVE
      : status === 'PENDING'
        ? AccountStatus.PENDING_APPROVAL
        : AccountStatus.SUSPENDED;

  await prisma.user.update({ where: { id: userId }, data: { accountStatus: targetStatus } });
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'STATUS_UPDATED',
      entity: 'User',
      entityId: userId,
      metadata: { status: targetStatus },
    },
  });

  const users = await getAdminUsers();
  const user = users.find((item) => item.id === userId);
  if (!user) throw new HttpError(404, `User ${userId} not found`);
  return user;
}

export async function getRegistrations() {
  const items = await prisma.researcherApplication.findMany({
    orderBy: { createdAt: 'desc' },
    include: { user: true },
  });

  return items.map((item) => ({
    id: item.id,
    fullName: `${item.user.firstname} ${item.user.surname}`.trim(),
    email: item.user.email,
    institution: item.institution,
    requestedRole: 'USER',
    submittedAt: formatTimestamp(item.createdAt),
    status: item.reviewStatus === ApplicationReviewStatus.APPROVED
      ? 'APPROVED'
      : item.reviewStatus === ApplicationReviewStatus.REJECTED
        ? 'REJECTED'
        : 'PENDING',
  }));
}

export async function approveRegistration(requestId: string, reviewerUserId: string) {
  await reviewApplication(requestId, { decision: 'APPROVE' }, reviewerUserId);
  const items = await getRegistrations();
  const item = items.find((entry) => entry.id === requestId);
  if (!item) throw new HttpError(404, `Registration ${requestId} not found`);
  return item;
}

export async function rejectRegistration(requestId: string, reviewerUserId: string) {
  await reviewApplication(requestId, { decision: 'REJECT' }, reviewerUserId);
  const items = await getRegistrations();
  const item = items.find((entry) => entry.id === requestId);
  if (!item) throw new HttpError(404, `Registration ${requestId} not found`);
  return item;
}

export async function getAccessSummary() {
  const [admins, reviewers, suspendedUsers, pendingAccessRequests] = await prisma.$transaction([
    prisma.userRole.count({ where: { role: { name: { in: ['ADMIN', 'SUPER_ADMIN'] } } } }),
    prisma.userRole.count({ where: { role: { name: 'REVIEWER' } } }),
    prisma.user.count({ where: { accountStatus: AccountStatus.SUSPENDED } }),
    prisma.accessRequest.count({ where: { status: AccessRequestStatus.PENDING } }),
  ]);

  return {
    totalAdmins: admins,
    totalReviewers: reviewers,
    totalSuspendedUsers: suspendedUsers,
    pendingAccessRequests,
  };
}

export async function getAuditEvents() {
  const events = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { user: { select: { firstname: true, surname: true, email: true } } },
  });

  return events.map((event) => ({
    id: event.id,
    action: event.action,
    actor: event.user ? `${event.user.firstname} ${event.user.surname}`.trim() || event.user.email : 'System',
    target: event.entityId ?? event.entity,
    createdAt: formatTimestamp(event.createdAt),
    severity: mapSeverity(event.action),
  }));
}

export async function getMonitoring() {
  const [queuedImports, runningImports, failedImports, queuedAnalysis, runningAnalysis] = await prisma.$transaction([
    prisma.importJob.count({ where: { status: ImportJobStatus.PENDING } }),
    prisma.importJob.count({ where: { status: ImportJobStatus.RUNNING } }),
    prisma.importJob.count({ where: { status: ImportJobStatus.FAILED } }),
    prisma.analysisJob.count({ where: { status: AnalysisJobStatus.QUEUED } }),
    prisma.analysisJob.count({ where: { status: AnalysisJobStatus.RUNNING } }),
  ]);

  const totalJobs = queuedImports + runningImports + failedImports + queuedAnalysis + runningAnalysis;
  const failureRate = totalJobs === 0 ? 0 : Number(((failedImports / totalJobs) * 100).toFixed(1));
  const queueDepth = queuedImports + queuedAnalysis + runningImports + runningAnalysis;

  return {
    apiLatencyMs: 118,
    workerStatus: failureRate > 10 ? 'Offline' : queueDepth > 20 ? 'Degraded' : 'Online',
    queueDepth,
    failureRate,
    cpuLoad: Math.min(95, 25 + runningAnalysis * 4 + runningImports * 3),
    memoryUsage: Math.min(94, 40 + queueDepth * 2),
  };
}