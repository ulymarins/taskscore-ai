-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "rationale" TEXT,
ADD COLUMN     "resources" JSONB,
ADD COLUMN     "useCases" TEXT;
