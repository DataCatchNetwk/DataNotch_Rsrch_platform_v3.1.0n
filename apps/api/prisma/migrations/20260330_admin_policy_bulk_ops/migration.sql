-- CreateEnum
CREATE TYPE "ApprovalDecisionReasonType" AS ENUM ('APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "approval_decision_reasons" (
    "id" VARCHAR(30) NOT NULL,
    "access_request_id" VARCHAR(30) NOT NULL,
    "actor_user_id" VARCHAR(30),
    "decision_type" "ApprovalDecisionReasonType" NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_decision_reasons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "approval_decision_reasons_access_request_id_idx" ON "approval_decision_reasons"("access_request_id");

-- CreateIndex
CREATE INDEX "approval_decision_reasons_actor_user_id_idx" ON "approval_decision_reasons"("actor_user_id");

-- CreateIndex
CREATE INDEX "approval_decision_reasons_created_at_idx" ON "approval_decision_reasons"("created_at");

-- AddForeignKey
ALTER TABLE "approval_decision_reasons" ADD CONSTRAINT "approval_decision_reasons_access_request_id_fkey" FOREIGN KEY ("access_request_id") REFERENCES "access_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_decision_reasons" ADD CONSTRAINT "approval_decision_reasons_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
