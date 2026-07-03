-- CreateEnum
CREATE TYPE "InboxThreadStatus" AS ENUM ('OPEN', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "InboxThreadParticipantRole" AS ENUM ('OWNER', 'MEMBER');

-- CreateEnum
CREATE TYPE "InboxMessageType" AS ENUM ('TEXT', 'MEETING_INVITATION', 'ANNOUNCEMENT', 'SUPPORT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "InboxMessageCategory" AS ENUM ('USER_MESSAGE', 'ADMIN_MESSAGE', 'STUDY_REQUEST', 'DATASET_REQUEST', 'REVIEW_REQUEST', 'APPROVAL_REQUEST', 'SUPPORT_TICKET', 'MEETING_INVITATION', 'SYSTEM_ALERT', 'ANNOUNCEMENT', 'BROADCAST');

-- CreateEnum
CREATE TYPE "EmailLogStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- AlterTable
ALTER TABLE "support_tickets" ADD COLUMN     "thread_id" VARCHAR(30),
ADD COLUMN     "user_id" VARCHAR(30);

-- CreateTable
CREATE TABLE "inbox_threads" (
    "id" VARCHAR(30) NOT NULL,
    "subject" VARCHAR(255) NOT NULL,
    "category" "InboxMessageCategory" NOT NULL,
    "asset_type" VARCHAR(50),
    "asset_id" VARCHAR(30),
    "status" "InboxThreadStatus" NOT NULL DEFAULT 'OPEN',
    "created_by" VARCHAR(30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inbox_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inbox_participants" (
    "id" VARCHAR(30) NOT NULL,
    "thread_id" VARCHAR(30) NOT NULL,
    "user_id" VARCHAR(30) NOT NULL,
    "participant_role" "InboxThreadParticipantRole" NOT NULL DEFAULT 'MEMBER',
    "last_read_at" TIMESTAMP(3),
    "is_archived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "inbox_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inbox_messages" (
    "id" VARCHAR(30) NOT NULL,
    "thread_id" VARCHAR(30) NOT NULL,
    "sender_id" VARCHAR(30) NOT NULL,
    "body" TEXT NOT NULL,
    "message_type" "InboxMessageType" NOT NULL DEFAULT 'TEXT',
    "attachment_url" TEXT,
    "email_copy_sent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inbox_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_logs" (
    "id" VARCHAR(30) NOT NULL,
    "recipient_email" VARCHAR(150) NOT NULL,
    "sender_id" VARCHAR(30),
    "subject" VARCHAR(255),
    "body" TEXT,
    "status" "EmailLogStatus" NOT NULL DEFAULT 'PENDING',
    "provider_response" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inbox_threads_created_by_idx" ON "inbox_threads"("created_by");

-- CreateIndex
CREATE INDEX "inbox_threads_category_updated_at_idx" ON "inbox_threads"("category", "updated_at");

-- CreateIndex
CREATE INDEX "inbox_threads_status_updated_at_idx" ON "inbox_threads"("status", "updated_at");

-- CreateIndex
CREATE INDEX "inbox_participants_user_id_is_archived_idx" ON "inbox_participants"("user_id", "is_archived");

-- CreateIndex
CREATE UNIQUE INDEX "inbox_participants_thread_id_user_id_key" ON "inbox_participants"("thread_id", "user_id");

-- CreateIndex
CREATE INDEX "inbox_messages_thread_id_created_at_idx" ON "inbox_messages"("thread_id", "created_at");

-- CreateIndex
CREATE INDEX "inbox_messages_sender_id_created_at_idx" ON "inbox_messages"("sender_id", "created_at");

-- CreateIndex
CREATE INDEX "email_logs_recipient_email_created_at_idx" ON "email_logs"("recipient_email", "created_at");

-- CreateIndex
CREATE INDEX "email_logs_sender_id_idx" ON "email_logs"("sender_id");

-- CreateIndex
CREATE INDEX "support_tickets_thread_id_idx" ON "support_tickets"("thread_id");

-- CreateIndex
CREATE INDEX "support_tickets_user_id_idx" ON "support_tickets"("user_id");

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "inbox_threads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inbox_threads" ADD CONSTRAINT "inbox_threads_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inbox_participants" ADD CONSTRAINT "inbox_participants_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "inbox_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inbox_participants" ADD CONSTRAINT "inbox_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inbox_messages" ADD CONSTRAINT "inbox_messages_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "inbox_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inbox_messages" ADD CONSTRAINT "inbox_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
