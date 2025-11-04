-- Add external fields to Favorite table
ALTER TABLE "Favorite" ADD COLUMN IF NOT EXISTS "externalId" TEXT;
ALTER TABLE "Favorite" ADD COLUMN IF NOT EXISTS "externalType" TEXT;
ALTER TABLE "Favorite" ADD COLUMN IF NOT EXISTS "externalData" JSONB;
