-- CreateEnum
CREATE TYPE "BlockFormat" AS ENUM ('STANDARD', 'SUPERSET', 'INTERVALS', 'AMRAP', 'FOR_TIME', 'EMOM');

-- DropForeignKey
ALTER TABLE "SessionExercise" DROP CONSTRAINT "SessionExercise_sessionId_fkey";

-- DropIndex
DROP INDEX "SessionExercise_sessionId_position_key";

-- AlterTable
ALTER TABLE "SessionExercise" DROP COLUMN "sessionId",
ADD COLUMN     "blockId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "SessionBlock" (
    "id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "format" "BlockFormat" NOT NULL DEFAULT 'STANDARD',
    "title" TEXT,
    "rounds" INTEGER,
    "durationSec" INTEGER,
    "restSec" INTEGER,
    "notes" TEXT,
    "resultTimeSec" INTEGER,
    "resultRounds" INTEGER,
    "resultExtraReps" INTEGER,
    "resultRpe" INTEGER,
    "resultNotes" TEXT,
    "sessionId" TEXT NOT NULL,

    CONSTRAINT "SessionBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SessionBlock_sessionId_position_key" ON "SessionBlock"("sessionId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "SessionExercise_blockId_position_key" ON "SessionExercise"("blockId", "position");

-- AddForeignKey
ALTER TABLE "SessionBlock" ADD CONSTRAINT "SessionBlock_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TrainingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionExercise" ADD CONSTRAINT "SessionExercise_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "SessionBlock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

