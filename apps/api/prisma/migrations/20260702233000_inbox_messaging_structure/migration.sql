-- Safe additive rollout for inbox messaging structure

DO $$ BEGIN
  CREATE TYPE "InboxThreadStatus" AS ENUM ('OPEN', 'CLOSED', 'ARCHIVED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "InboxThreadParticipantRole" AS ENUM ('OWNER', 'MEMBER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "InboxMessageType" AS ENUM ('TEXT', 'MEETING_INVITATION', 'ANNOUNCEMENT', 'SUPPORT', 'SYSTEM');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "InboxMessageCategory" AS ENUM (
    'USER_MESSAGE',
    'ADMIN_MESSAGE',
    'STUDY_REQUEST',
    'DATASET_REQUEST',
    'REVIEW_REQUEST',
    'APPROVAL_REQUEST',
    'SUPPORT_TICKET',
    'MEETING_INVITATION',
    'SYSTEM_ALERT',
    'ANNOUNCEMENT',
    'BROADCAST'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "EmailLogStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "inbox_threads" (
  "id" VARCHAR(30) PRIMARY KEY,
  "subject" VARCHAR(255) NOT NULL,
  "category" "InboxMessageCategory" NOT NULL,
  "asset_type" VARCHAR(50),
  "asset_id" VARCHAR(30),
  "status" "InboxThreadStatus" NOT NULL DEFAULT 'OPEN',
  "created_by" VARCHAR(30) NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "inbox_participants" (
  "id" VARCHAR(30) PRIMARY KEY,
  "thread_id" VARCHAR(30) NOT NULL,
  "user_id" VARCHAR(30) NOT NULL,
  "participant_role" "InboxThreadParticipantRole" NOT NULL DEFAULT 'MEMBER',
  "last_read_at" TIMESTAMPTZ,
  "is_archived" BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS "inbox_messages" (
  "id" VARCHAR(30) PRIMARY KEY,
  "thread_id" VARCHAR(30) NOT NULL,
  "sender_id" VARCHAR(30) NOT NULL,
  "body" TEXT NOT NULL,
  "message_type" "InboxMessageType" NOT NULL DEFAULT 'TEXT',
  "attachment_url" TEXT,
  "email_copy_sent" BOOLEAN NOT NULL DEFAULT FALSE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "email_logs" (
  "id" VARCHAR(30) PRIMARY KEY,
  "recipient_email" VARCHAR(150) NOT NULL,
  "sender_id" VARCHAR(30),
  "subject" VARCHAR(255),
  "body" TEXT,
  "status" "EmailLogStatus" NOT NULL DEFAULT 'PENDING',
  "provider_response" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "thread_id" VARCHAR(30);
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "user_id" VARCHAR(30);

DO $$ BEGIN
  ALTER TABLE "inbox_threads"
    ADD CONSTRAINT "inbox_threads_created_by_fkey"
    FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "inbox_participants"
    ADD CONSTRAINT "inbox_participants_thread_id_fkey"
    FOREIGN KEY ("thread_id") REFERENCES "inbox_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "inbox_participants"
    ADD CONSTRAINT "inbox_participants_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "inbox_messages"
    ADD CONSTRAINT "inbox_messages_thread_id_fkey"
    FOREIGN KEY ("thread_id") REFERENCES "inbox_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "inbox_messages"
    ADD CONSTRAINT "inbox_messages_sender_id_fkey"
    FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "email_logs"
    ADD CONSTRAINT "email_logs_sender_id_fkey"
    FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "support_tickets"
    ADD CONSTRAINT "support_tickets_thread_id_fkey"
    FOREIGN KEY ("thread_id") REFERENCES "inbox_threads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "support_tickets"
    ADD CONSTRAINT "support_tickets_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "inbox_participants_thread_id_user_id_key" ON "inbox_participants" ("thread_id", "user_id");
CREATE INDEX IF NOT EXISTS "inbox_threads_category_updated_at_idx" ON "inbox_threads" ("category", "updated_at");
CREATE INDEX IF NOT EXISTS "inbox_threads_status_updated_at_idx" ON "inbox_threads" ("status", "updated_at");
CREATE INDEX IF NOT EXISTS "inbox_participants_user_id_is_archived_idx" ON "inbox_participants" ("user_id", "is_archived");
CREATE INDEX IF NOT EXISTS "inbox_messages_thread_id_created_at_idx" ON "inbox_messages" ("thread_id", "created_at");
CREATE INDEX IF NOT EXISTS "inbox_messages_sender_id_created_at_idx" ON "inbox_messages" ("sender_id", "created_at");
CREATE INDEX IF NOT EXISTS "email_logs_recipient_email_created_at_idx" ON "email_logs" ("recipient_email", "created_at");
CREATE INDEX IF NOT EXISTS "support_tickets_thread_id_idx" ON "support_tickets" ("thread_id");
CREATE INDEX IF NOT EXISTS "support_tickets_user_id_idx" ON "support_tickets" ("user_id");
