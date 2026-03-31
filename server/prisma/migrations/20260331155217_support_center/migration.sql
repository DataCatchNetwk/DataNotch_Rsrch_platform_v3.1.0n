-- CreateEnum
CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN', 'TRIAGED', 'IN_PROGRESS', 'WAITING_FOR_USER', 'RESOLVED', 'CLOSED', 'SPAM');

-- CreateEnum
CREATE TYPE "SupportTicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "SupportTicketCategory" AS ENUM ('LOGIN', 'BILLING', 'TECHNICAL', 'DATASET', 'ACCESS', 'ACCOUNT', 'SECURITY', 'OTHER');

-- CreateEnum
CREATE TYPE "SupportTicketSource" AS ENUM ('LOGIN_PAGE', 'USER_DASHBOARD', 'ADMIN_CREATED', 'EMAIL_INGEST', 'API');

-- CreateEnum
CREATE TYPE "SupportMessageAuthorType" AS ENUM ('USER', 'ADMIN', 'AI', 'SYSTEM');

-- CreateTable
CREATE TABLE "support_tickets" (
    "id" VARCHAR(30) NOT NULL,
    "ticket_number" VARCHAR(50) NOT NULL,
    "subject" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "requester_email" VARCHAR(191) NOT NULL,
    "requester_name" VARCHAR(191),
    "category" "SupportTicketCategory" NOT NULL,
    "status" "SupportTicketStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "SupportTicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "source" "SupportTicketSource" NOT NULL DEFAULT 'LOGIN_PAGE',
    "tags" TEXT[],
    "sentiment_score" DOUBLE PRECISION,
    "spam_score" DOUBLE PRECISION,
    "urgency_score" DOUBLE PRECISION,
    "ai_summary" TEXT,
    "ai_suggested_reply" TEXT,
    "ai_triage_reason" TEXT,
    "ai_last_analyzed_at" TIMESTAMP(3),
    "attachment_url" VARCHAR(500),
    "attachment_name" VARCHAR(255),
    "assigned_to_id" VARCHAR(30),
    "created_by_user_id" VARCHAR(30),
    "first_response_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_messages" (
    "id" VARCHAR(30) NOT NULL,
    "ticket_id" VARCHAR(30) NOT NULL,
    "author_type" "SupportMessageAuthorType" NOT NULL,
    "author_user_id" VARCHAR(30),
    "body" TEXT NOT NULL,
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "attachment_url" VARCHAR(500),
    "attachment_name" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_activities" (
    "id" VARCHAR(30) NOT NULL,
    "ticket_id" VARCHAR(30) NOT NULL,
    "actor_user_id" VARCHAR(30),
    "type" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "meta_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "support_tickets_ticket_number_key" ON "support_tickets"("ticket_number");

-- CreateIndex
CREATE INDEX "support_tickets_status_priority_created_at_idx" ON "support_tickets"("status", "priority", "created_at");

-- CreateIndex
CREATE INDEX "support_tickets_assigned_to_id_status_idx" ON "support_tickets"("assigned_to_id", "status");

-- CreateIndex
CREATE INDEX "support_tickets_requester_email_idx" ON "support_tickets"("requester_email");

-- CreateIndex
CREATE INDEX "support_messages_ticket_id_created_at_idx" ON "support_messages"("ticket_id", "created_at");

-- CreateIndex
CREATE INDEX "support_activities_ticket_id_created_at_idx" ON "support_activities"("ticket_id", "created_at");

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_activities" ADD CONSTRAINT "support_activities_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_activities" ADD CONSTRAINT "support_activities_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
