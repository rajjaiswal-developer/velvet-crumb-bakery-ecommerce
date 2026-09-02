/*
  Warnings:

  - You are about to drop the column `sentAt` on the `NotificationOutbox` table. All the data in the column will be lost.
  - The `status` column on the `NotificationOutbox` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `recipient` to the `NotificationOutbox` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `NotificationOutbox` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "AuditLog" ALTER COLUMN "details" SET DEFAULT '{}';

-- AlterTable
ALTER TABLE "NotificationOutbox" DROP COLUMN "sentAt",
ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastError" TEXT,
ADD COLUMN     "recipient" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "items" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "reservationExpiry" TIMESTAMP(3),
ALTER COLUMN "orderStatus" DROP NOT NULL,
ALTER COLUMN "orderStatus" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ShopSettings" ADD COLUMN     "shopLatitude" DOUBLE PRECISION,
ADD COLUMN     "shopLongitude" DOUBLE PRECISION;

-- DropEnum
DROP TYPE "OutboxStatus";
