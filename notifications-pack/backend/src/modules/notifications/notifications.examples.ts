import { NotificationsService } from './notifications.service';

export async function sendDatasetProcessedNotification(
  notifications: NotificationsService,
  userId: string,
  datasetId: string,
  datasetName: string,
) {
  return notifications.create({
    userId,
    title: 'Dataset processing completed',
    message: `Your dataset "${datasetName}" finished preprocessing and is ready for analysis.`,
    category: 'DATASET',
    priority: 'NORMAL',
    actionLabel: 'Open dataset',
    actionUrl: `/datasets/${datasetId}`,
    entityType: 'Dataset',
    entityId: datasetId,
    icon: 'database',
    metadata: {
      datasetId,
      datasetName,
      event: 'dataset.processed',
    },
  });
}

export async function sendWorkspaceInviteNotification(
  notifications: NotificationsService,
  userId: string,
  actorId: string,
  workspaceId: string,
  workspaceName: string,
) {
  return notifications.create({
    userId,
    actorId,
    title: 'New workspace invitation',
    message: `You were invited to collaborate in ${workspaceName}.`,
    category: 'WORKSPACE',
    priority: 'HIGH',
    actionLabel: 'Review invite',
    actionUrl: `/workspaces/${workspaceId}`,
    entityType: 'Workspace',
    entityId: workspaceId,
    icon: 'users',
  });
}

export async function sendAnalysisFailedNotification(
  notifications: NotificationsService,
  userId: string,
  analysisJobId: string,
  jobName: string,
) {
  return notifications.create({
    userId,
    title: 'Analysis job failed',
    message: `The analysis job "${jobName}" failed and needs review.`,
    category: 'ANALYSIS',
    priority: 'CRITICAL',
    actionLabel: 'Inspect job',
    actionUrl: `/analysis/jobs/${analysisJobId}`,
    entityType: 'AnalysisJob',
    entityId: analysisJobId,
    icon: 'triangle-alert',
  });
}
