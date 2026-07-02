-- CreateTable
CREATE TABLE "PlatformHandoff" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT,
    "datasetId" TEXT,
    "sourceStage" TEXT NOT NULL,
    "targetStage" TEXT NOT NULL,
    "artifactType" TEXT NOT NULL,
    "artifactId" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformHandoff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovernanceAuditEvent" (
    "id" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "objectId" TEXT NOT NULL,
    "objectType" TEXT,
    "stage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GovernanceAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovernanceLineageEvent" (
    "id" TEXT NOT NULL,
    "fromStage" TEXT NOT NULL,
    "toStage" TEXT NOT NULL,
    "sourceObject" TEXT NOT NULL,
    "targetObject" TEXT NOT NULL,
    "relationType" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GovernanceLineageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemJob" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "artifactId" TEXT,
    "payload" JSONB,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformStorageObject" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT,
    "path" TEXT NOT NULL,
    "objectType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL DEFAULT 0,
    "checksum" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformStorageObject_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlatformHandoff_sourceStage_idx" ON "PlatformHandoff"("sourceStage");

-- CreateIndex
CREATE INDEX "PlatformHandoff_targetStage_idx" ON "PlatformHandoff"("targetStage");

-- CreateIndex
CREATE INDEX "PlatformHandoff_artifactId_idx" ON "PlatformHandoff"("artifactId");

-- CreateIndex
CREATE INDEX "PlatformHandoff_createdAt_idx" ON "PlatformHandoff"("createdAt");

-- CreateIndex
CREATE INDEX "GovernanceAuditEvent_action_idx" ON "GovernanceAuditEvent"("action");

-- CreateIndex
CREATE INDEX "GovernanceAuditEvent_stage_idx" ON "GovernanceAuditEvent"("stage");

-- CreateIndex
CREATE INDEX "GovernanceAuditEvent_createdAt_idx" ON "GovernanceAuditEvent"("createdAt");

-- CreateIndex
CREATE INDEX "GovernanceLineageEvent_fromStage_idx" ON "GovernanceLineageEvent"("fromStage");

-- CreateIndex
CREATE INDEX "GovernanceLineageEvent_toStage_idx" ON "GovernanceLineageEvent"("toStage");

-- CreateIndex
CREATE INDEX "GovernanceLineageEvent_relationType_idx" ON "GovernanceLineageEvent"("relationType");

-- CreateIndex
CREATE INDEX "GovernanceLineageEvent_createdAt_idx" ON "GovernanceLineageEvent"("createdAt");

-- CreateIndex
CREATE INDEX "SystemJob_stage_idx" ON "SystemJob"("stage");

-- CreateIndex
CREATE INDEX "SystemJob_status_idx" ON "SystemJob"("status");

-- CreateIndex
CREATE INDEX "SystemJob_createdAt_idx" ON "SystemJob"("createdAt");

-- CreateIndex
CREATE INDEX "SystemNotification_userId_idx" ON "SystemNotification"("userId");

-- CreateIndex
CREATE INDEX "SystemNotification_severity_idx" ON "SystemNotification"("severity");

-- CreateIndex
CREATE INDEX "SystemNotification_createdAt_idx" ON "SystemNotification"("createdAt");

-- CreateIndex
CREATE INDEX "PlatformStorageObject_workspaceId_idx" ON "PlatformStorageObject"("workspaceId");

-- CreateIndex
CREATE INDEX "PlatformStorageObject_objectType_idx" ON "PlatformStorageObject"("objectType");

-- CreateIndex
CREATE INDEX "PlatformStorageObject_createdAt_idx" ON "PlatformStorageObject"("createdAt");
