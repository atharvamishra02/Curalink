/*
  Warnings:

  - A unique constraint covering the columns `[userId,externalId,externalType]` on the table `Favorite` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ResearcherProfile" ADD COLUMN     "meetingSchedule" TEXT;

-- CreateTable
CREATE TABLE "TrialInquiry" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "trialId" TEXT,
    "trialTitle" TEXT NOT NULL,
    "trialNctId" TEXT,
    "trialLocation" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "patientName" TEXT,
    "patientEmail" TEXT,
    "patientCondition" TEXT,
    "patientAge" INTEGER,
    "patientGender" TEXT,
    "patientLocation" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrialInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrialInquiry_patientId_idx" ON "TrialInquiry"("patientId");

-- CreateIndex
CREATE INDEX "TrialInquiry_trialId_idx" ON "TrialInquiry"("trialId");

-- CreateIndex
CREATE INDEX "TrialInquiry_status_idx" ON "TrialInquiry"("status");

-- CreateIndex
CREATE INDEX "TrialInquiry_createdAt_idx" ON "TrialInquiry"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_externalId_externalType_key" ON "Favorite"("userId", "externalId", "externalType");

-- AddForeignKey
ALTER TABLE "TrialInquiry" ADD CONSTRAINT "TrialInquiry_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
