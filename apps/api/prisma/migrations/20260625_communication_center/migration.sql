-- Communication center schema.
-- Idempotent because existing development databases may already contain these objects.

DO $$ BEGIN
  CREATE TYPE "CommunicationRoomType" AS ENUM ('DIRECT', 'GROUP', 'CHANNEL', 'CALL_ROOM');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CommunicationVisibility" AS ENUM ('PRIVATE', 'WORKSPACE', 'ORG');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CommunicationParticipantRole" AS ENUM ('OWNER', 'MODERATOR', 'MEMBER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CommunicationMessageKind" AS ENUM ('TEXT', 'SYSTEM', 'FILE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CommunicationCallMode" AS ENUM ('AUDIO', 'VIDEO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CommunicationCallSessionStatus" AS ENUM ('WAITING', 'ACTIVE', 'ENDED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CommunicationPresenceStatus" AS ENUM ('ONLINE', 'AWAY', 'OFFLINE', 'IN_CALL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "communication_rooms" (
  "id" VARCHAR(30) PRIMARY KEY,
  "name" VARCHAR(191) NOT NULL,
  "slug" VARCHAR(191),
  "type" "CommunicationRoomType" NOT NULL,
  "visibility" "CommunicationVisibility" NOT NULL DEFAULT 'PRIVATE',
  "workspace_id" VARCHAR(30),
  "created_by_id" VARCHAR(30) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "communication_participants" (
  "id" VARCHAR(30) PRIMARY KEY,
  "room_id" VARCHAR(30) NOT NULL,
  "user_id" VARCHAR(30) NOT NULL,
  "role" "CommunicationParticipantRole" NOT NULL DEFAULT 'MEMBER',
  "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_seen_at" TIMESTAMP(3),
  "muted" BOOLEAN NOT NULL DEFAULT false,
  "camera_enabled" BOOLEAN NOT NULL DEFAULT false,
  "mic_enabled" BOOLEAN NOT NULL DEFAULT true,
  "is_online" BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS "communication_message_threads" (
  "id" VARCHAR(30) PRIMARY KEY,
  "room_id" VARCHAR(30) NOT NULL,
  "subject" VARCHAR(191),
  "created_by_id" VARCHAR(30) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "communication_messages" (
  "id" VARCHAR(30) PRIMARY KEY,
  "thread_id" VARCHAR(30) NOT NULL,
  "room_id" VARCHAR(30) NOT NULL,
  "sender_id" VARCHAR(30) NOT NULL,
  "sender_name" VARCHAR(191) NOT NULL,
  "body" TEXT NOT NULL,
  "kind" "CommunicationMessageKind" NOT NULL DEFAULT 'TEXT',
  "attachment_url" VARCHAR(500),
  "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "edited_at" TIMESTAMP(3),
  "deleted_at" TIMESTAMP(3)
);

CREATE TABLE IF NOT EXISTS "communication_call_sessions" (
  "id" VARCHAR(30) PRIMARY KEY,
  "room_id" VARCHAR(30) NOT NULL,
  "mode" "CommunicationCallMode" NOT NULL,
  "status" "CommunicationCallSessionStatus" NOT NULL DEFAULT 'WAITING',
  "started_by_id" VARCHAR(30) NOT NULL,
  "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ended_at" TIMESTAMP(3),
  "signal_key" VARCHAR(191) NOT NULL
);

CREATE TABLE IF NOT EXISTS "communication_presence_heartbeats" (
  "id" VARCHAR(30) PRIMARY KEY,
  "user_id" VARCHAR(30) NOT NULL,
  "socket_id" VARCHAR(191) NOT NULL,
  "status" "CommunicationPresenceStatus" NOT NULL DEFAULT 'ONLINE',
  "last_heartbeat_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "communication_audit_logs" (
  "id" VARCHAR(30) PRIMARY KEY,
  "actor_user_id" VARCHAR(30),
  "room_id" VARCHAR(30),
  "call_session_id" VARCHAR(30),
  "action" VARCHAR(120) NOT NULL,
  "metadata_json" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "communication_rooms_created_by_id_idx" ON "communication_rooms"("created_by_id");
CREATE INDEX IF NOT EXISTS "communication_rooms_workspace_id_idx" ON "communication_rooms"("workspace_id");
CREATE INDEX IF NOT EXISTS "communication_rooms_type_idx" ON "communication_rooms"("type");
CREATE INDEX IF NOT EXISTS "communication_rooms_created_at_idx" ON "communication_rooms"("created_at");

CREATE UNIQUE INDEX IF NOT EXISTS "communication_participants_room_id_user_id_key" ON "communication_participants"("room_id", "user_id");
CREATE INDEX IF NOT EXISTS "communication_participants_user_id_idx" ON "communication_participants"("user_id");
CREATE INDEX IF NOT EXISTS "communication_participants_role_idx" ON "communication_participants"("role");

CREATE INDEX IF NOT EXISTS "communication_message_threads_room_id_idx" ON "communication_message_threads"("room_id");
CREATE INDEX IF NOT EXISTS "communication_messages_room_id_sent_at_idx" ON "communication_messages"("room_id", "sent_at");
CREATE INDEX IF NOT EXISTS "communication_messages_sender_id_idx" ON "communication_messages"("sender_id");

CREATE INDEX IF NOT EXISTS "communication_call_sessions_room_id_status_idx" ON "communication_call_sessions"("room_id", "status");
CREATE INDEX IF NOT EXISTS "communication_call_sessions_started_by_id_idx" ON "communication_call_sessions"("started_by_id");

CREATE UNIQUE INDEX IF NOT EXISTS "communication_presence_heartbeats_user_id_socket_id_key" ON "communication_presence_heartbeats"("user_id", "socket_id");
CREATE INDEX IF NOT EXISTS "communication_presence_heartbeats_status_idx" ON "communication_presence_heartbeats"("status");

CREATE INDEX IF NOT EXISTS "communication_audit_logs_actor_user_id_idx" ON "communication_audit_logs"("actor_user_id");
CREATE INDEX IF NOT EXISTS "communication_audit_logs_room_id_idx" ON "communication_audit_logs"("room_id");
CREATE INDEX IF NOT EXISTS "communication_audit_logs_created_at_idx" ON "communication_audit_logs"("created_at");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'communication_rooms_created_by_id_fkey') THEN
    ALTER TABLE "communication_rooms" ADD CONSTRAINT "communication_rooms_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'communication_participants_room_id_fkey') THEN
    ALTER TABLE "communication_participants" ADD CONSTRAINT "communication_participants_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "communication_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'communication_participants_user_id_fkey') THEN
    ALTER TABLE "communication_participants" ADD CONSTRAINT "communication_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'communication_message_threads_room_id_fkey') THEN
    ALTER TABLE "communication_message_threads" ADD CONSTRAINT "communication_message_threads_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "communication_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'communication_message_threads_created_by_id_fkey') THEN
    ALTER TABLE "communication_message_threads" ADD CONSTRAINT "communication_message_threads_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'communication_messages_thread_id_fkey') THEN
    ALTER TABLE "communication_messages" ADD CONSTRAINT "communication_messages_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "communication_message_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'communication_messages_room_id_fkey') THEN
    ALTER TABLE "communication_messages" ADD CONSTRAINT "communication_messages_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "communication_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'communication_messages_sender_id_fkey') THEN
    ALTER TABLE "communication_messages" ADD CONSTRAINT "communication_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'communication_call_sessions_room_id_fkey') THEN
    ALTER TABLE "communication_call_sessions" ADD CONSTRAINT "communication_call_sessions_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "communication_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'communication_call_sessions_started_by_id_fkey') THEN
    ALTER TABLE "communication_call_sessions" ADD CONSTRAINT "communication_call_sessions_started_by_id_fkey" FOREIGN KEY ("started_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'communication_presence_heartbeats_user_id_fkey') THEN
    ALTER TABLE "communication_presence_heartbeats" ADD CONSTRAINT "communication_presence_heartbeats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'communication_audit_logs_actor_user_id_fkey') THEN
    ALTER TABLE "communication_audit_logs" ADD CONSTRAINT "communication_audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'communication_audit_logs_room_id_fkey') THEN
    ALTER TABLE "communication_audit_logs" ADD CONSTRAINT "communication_audit_logs_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "communication_rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;