import { ImportJobStatus, ProcessedStatus } from '@prisma/client';
import { prisma } from '../db/prisma.js';

type DashboardStat = {
  title: string;
  value: number;
  trend: string;
};

type DashboardChartPoint = {
  date: string;
  studies: number;
  datasets: number;
};

type DashboardActivityItem = {
  id: string;
  type: 'upload' | 'dataset' | 'audit';
  action: string;
  title: string;
  time: string;
  createdAt: string;
};

type DashboardTableRow = {
  id: string;
  name: string;
  domain: string;
  source: string;
  year: number;
  updatedAt: string;
  status: 'Processed' | 'Pending' | 'Failed';
};

export type UserDashboardResponse = {
  stats: DashboardStat[];
  activityChart: DashboardChartPoint[];
  activityFeed: DashboardActivityItem[];
  table: DashboardTableRow[];
};

type AdminChartPoint = {
  date: string;
  logins: number;
  audits: number;
};

type AdminAuditLog = {
  user: string;
  action: string;
  time: string;
  detail: string;
};

export type AdminOverviewResponse = {
  stats: {
    totalUsers: number;
    activeStudies: number;
    newLogs: number;
    alerts: number;
  };
  activityData: AdminChartPoint[];
  auditLogs: AdminAuditLog[];
};

const bucketFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

function timeAgo(input: Date) {
  const deltaMs = Date.now() - input.getTime();
  const minuteMs = 60_000;
  const hourMs = 60 * minuteMs;
  const dayMs = 24 * hourMs;

  if (deltaMs < hourMs) {
    const minutes = Math.max(1, Math.floor(deltaMs / minuteMs));
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }

  if (deltaMs < dayMs) {
    const hours = Math.max(1, Math.floor(deltaMs / hourMs));
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }

  const days = Math.max(1, Math.floor(deltaMs / dayMs));
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function buildChartData(healthDataDates: Date[], uploadDates: Date[]) {
  const bucketSizeMs = 7 * 24 * 60 * 60 * 1000;
  const now = new Date();
  const start = new Date(now.getTime() - bucketSizeMs * 7);
  start.setHours(0, 0, 0, 0);

  const buckets = Array.from({ length: 8 }, (_, index) => {
    const bucketStart = new Date(start.getTime() + index * bucketSizeMs);
    return {
      start: bucketStart,
      end: new Date(bucketStart.getTime() + bucketSizeMs),
      date: bucketFormatter.format(bucketStart),
      studies: 0,
      datasets: 0,
    };
  });

  for (const createdAt of healthDataDates) {
    const bucket = buckets.find((entry) => createdAt >= entry.start && createdAt < entry.end);
    if (bucket) bucket.studies += 1;
  }

  for (const createdAt of uploadDates) {
    const bucket = buckets.find((entry) => createdAt >= entry.start && createdAt < entry.end);
    if (bucket) bucket.datasets += 1;
  }

  return buckets.map(({ date, studies, datasets }) => ({ date, studies, datasets }));
}

function mapProcessedStatus(status: ProcessedStatus): DashboardTableRow['status'] {
  if (status === ProcessedStatus.PROCESSED) return 'Processed';
  if (status === ProcessedStatus.FAILED) return 'Failed';
  return 'Pending';
}

function describeAuditAction(action: string, entity: string) {
  const normalizedAction = action.replace(/_/g, ' ').toLowerCase();
  return `${normalizedAction.charAt(0).toUpperCase()}${normalizedAction.slice(1)} ${entity.toLowerCase()}`;
}

function buildAdminAuditChart(loginDates: Date[], auditDates: Date[]) {
  const bucketSizeMs = 7 * 24 * 60 * 60 * 1000;
  const now = new Date();
  const start = new Date(now.getTime() - bucketSizeMs * 7);
  start.setHours(0, 0, 0, 0);

  const buckets = Array.from({ length: 8 }, (_, index) => {
    const bucketStart = new Date(start.getTime() + index * bucketSizeMs);
    return {
      start: bucketStart,
      end: new Date(bucketStart.getTime() + bucketSizeMs),
      date: bucketFormatter.format(bucketStart),
      logins: 0,
      audits: 0,
    };
  });

  for (const createdAt of loginDates) {
    const bucket = buckets.find((entry) => createdAt >= entry.start && createdAt < entry.end);
    if (bucket) bucket.logins += 1;
  }

  for (const createdAt of auditDates) {
    const bucket = buckets.find((entry) => createdAt >= entry.start && createdAt < entry.end);
    if (bucket) bucket.audits += 1;
  }

  return buckets.map(({ date, logins, audits }) => ({ date, logins, audits }));
}

export async function getUserDashboard(userId: string): Promise<UserDashboardResponse> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    distinctTitles,
    healthDataCount,
    teamAccessCount,
    myUploadCount,
    pendingImportCount,
    recentHealthData,
    healthDataForChart,
    recentUploads,
    uploadsForChart,
    recentAuditLogs,
  ] = await prisma.$transaction([
    prisma.healthData.findMany({ distinct: ['title'], select: { title: true } }),
    prisma.healthData.count(),
    prisma.user.count(),
    prisma.uploadBatch.count({ where: { createdById: userId } }),
    prisma.importJob.count({
      where: {
        createdById: userId,
        status: { in: [ImportJobStatus.PENDING, ImportJobStatus.RUNNING] },
      },
    }),
    prisma.healthData.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: {
        domain: true,
        dataSource: true,
      },
    }),
    prisma.healthData.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
    }),
    prisma.uploadBatch.findMany({
      where: { createdById: userId },
      orderBy: { createdAt: 'desc' },
      take: 4,
      select: { id: true, originalName: true, createdAt: true },
    }),
    prisma.uploadBatch.findMany({
      where: { createdById: userId, createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
    }),
    prisma.auditLog.findMany({
      where: {
        OR: [{ userId }, { userId: null }],
      },
      orderBy: { createdAt: 'desc' },
      take: 4,
      select: { id: true, action: true, entity: true, entityId: true, createdAt: true },
    }),
  ]);

  const stats: DashboardStat[] = [
    {
      title: 'Active Studies',
      value: distinctTitles.length,
      trend: `${healthDataForChart.length} records updated in 30 days`,
    },
    {
      title: 'My Datasets',
      value: healthDataCount,
      trend: `${myUploadCount} personal uploads logged`,
    },
    {
      title: 'Pending Requests',
      value: pendingImportCount,
      trend: pendingImportCount > 0 ? 'Awaiting processing' : 'All caught up',
    },
    {
      title: 'Team Access',
      value: teamAccessCount,
      trend: `${Math.max(teamAccessCount - 1, 0)} collaborators in workspace`,
    },
  ];

  const activityFeed = [
    ...recentUploads.map<DashboardActivityItem>((upload) => ({
      id: `upload-${upload.id}`,
      type: 'upload',
      action: 'Dataset uploaded',
      title: upload.originalName,
      time: timeAgo(upload.createdAt),
      createdAt: upload.createdAt.toISOString(),
    })),
    ...recentHealthData.map<DashboardActivityItem>((record) => ({
      id: `dataset-${record.id}`,
      type: 'dataset',
      action: 'Health data refreshed',
      title: record.title,
      time: timeAgo(record.updatedAt),
      createdAt: record.updatedAt.toISOString(),
    })),
    ...recentAuditLogs.map<DashboardActivityItem>((entry) => ({
      id: `audit-${entry.id}`,
      type: 'audit',
      action: describeAuditAction(entry.action, entry.entity),
      title: entry.entityId ?? 'Workspace event',
      time: timeAgo(entry.createdAt),
      createdAt: entry.createdAt.toISOString(),
    })),
  ]
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, 6);

  const table = recentHealthData.map<DashboardTableRow>((record) => ({
    id: record.id,
    name: record.title,
    domain: record.domain.name,
    source: record.dataSource.name,
    year: record.dataYear,
    updatedAt: timeAgo(record.updatedAt),
    status: mapProcessedStatus(record.processedStatus),
  }));

  const activityChart = buildChartData(
    healthDataForChart.map((entry) => entry.createdAt),
    uploadsForChart.map((entry) => entry.createdAt),
  );

  return {
    stats,
    activityChart,
    activityFeed,
    table,
  };
}

export async function getAdminOverview(): Promise<AdminOverviewResponse> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    distinctTitles,
    newLogs,
    alerts,
    loginAuditDates,
    auditDates,
    recentAuditLogs,
  ] = await prisma.$transaction([
    prisma.user.count(),
    prisma.healthData.findMany({ distinct: ['title'], select: { title: true } }),
    prisma.auditLog.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.importJob.count({ where: { status: ImportJobStatus.FAILED } }),
    prisma.auditLog.findMany({
      where: {
        action: 'LOGIN',
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { createdAt: true },
    }),
    prisma.auditLog.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: {
        user: {
          select: {
            firstname: true,
            surname: true,
          },
        },
      },
    }),
  ]);

  const activityData = buildAdminAuditChart(
    loginAuditDates.map((entry) => entry.createdAt),
    auditDates.map((entry) => entry.createdAt),
  );

  const auditLogs: AdminAuditLog[] = recentAuditLogs.map((entry) => ({
    user: entry.user ? `${entry.user.firstname} ${entry.user.surname}` : 'System',
    action: describeAuditAction(entry.action, entry.entity),
    time: timeAgo(entry.createdAt),
    detail: entry.entityId ?? '',
  }));

  return {
    stats: {
      totalUsers,
      activeStudies: distinctTitles.length,
      newLogs,
      alerts,
    },
    activityData,
    auditLogs,
  };
}