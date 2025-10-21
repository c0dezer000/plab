-- CreateEnum
CREATE TYPE "public"."TrackerStage" AS ENUM ('SOCIAL_PREPS', 'CFT', 'CFW', 'FFW', 'CFT_SUSTAINABILITY', 'COMPLETED');

-- CreateEnum
CREATE TYPE "public"."CompensationType" AS ENUM ('CASH', 'FOOD', 'NONE');

-- CreateTable
CREATE TABLE "public"."ProjectTrackerBeneficiaryEnrollment" (
    "id" TEXT NOT NULL,
    "projectTrackerId" TEXT NOT NULL,
    "beneficiaryId" TEXT NOT NULL,
    "stage" "public"."TrackerStage" NOT NULL DEFAULT 'SOCIAL_PREPS',
    "stageStartedAt" TIMESTAMP(3),
    "stageCompletedAt" TIMESTAMP(3),
    "attendanceCount" INTEGER,
    "attendanceNotes" TEXT,
    "compensationType" "public"."CompensationType",
    "compensationAmount" DECIMAL(12,2),
    "payoutDate" TIMESTAMP(3),
    "documents" JSONB,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectTrackerBeneficiaryEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectTrackerBeneficiaryEnrollment_projectTrackerId_idx" ON "public"."ProjectTrackerBeneficiaryEnrollment"("projectTrackerId");

-- CreateIndex
CREATE INDEX "ProjectTrackerBeneficiaryEnrollment_beneficiaryId_idx" ON "public"."ProjectTrackerBeneficiaryEnrollment"("beneficiaryId");

-- CreateIndex
CREATE INDEX "ProjectTrackerBeneficiaryEnrollment_stage_idx" ON "public"."ProjectTrackerBeneficiaryEnrollment"("stage");

-- AddForeignKey
ALTER TABLE "public"."ProjectTrackerBeneficiaryEnrollment" ADD CONSTRAINT "ProjectTrackerBeneficiaryEnrollment_projectTrackerId_fkey" FOREIGN KEY ("projectTrackerId") REFERENCES "public"."ProjectTracker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProjectTrackerBeneficiaryEnrollment" ADD CONSTRAINT "ProjectTrackerBeneficiaryEnrollment_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "public"."Beneficiary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
