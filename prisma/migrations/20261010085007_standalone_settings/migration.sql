/*
  Warnings:

  - You are about to drop the column `raffleId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `raffleId` on the `Prize` table. All the data in the column will be lost.
  - You are about to drop the column `raffleId` on the `Ticket` table. All the data in the column will be lost.
  - You are about to drop the column `raffleId` on the `Winner` table. All the data in the column will be lost.
  - You are about to drop the `Raffle` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[number]` on the table `Ticket` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_raffleId_fkey";

-- DropForeignKey
ALTER TABLE "Prize" DROP CONSTRAINT "Prize_raffleId_fkey";

-- DropForeignKey
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_raffleId_fkey";

-- DropForeignKey
ALTER TABLE "Winner" DROP CONSTRAINT "Winner_raffleId_fkey";

-- DropIndex
DROP INDEX "Ticket_raffleId_number_key";

-- DropIndex
DROP INDEX "Winner_raffleId_key";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "raffleId";

-- AlterTable
ALTER TABLE "Prize" DROP COLUMN "raffleId";

-- AlterTable
ALTER TABLE "Ticket" DROP COLUMN "raffleId";

-- AlterTable
ALTER TABLE "Winner" DROP COLUMN "raffleId";

-- DropTable
DROP TABLE "Raffle";

-- DropEnum
DROP TYPE "RaffleStatus";

-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "ticketPrice" INTEGER NOT NULL DEFAULT 0,
    "closesAt" TIMESTAMP(3),
    "nextTicketNumber" INTEGER NOT NULL DEFAULT 1501,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_number_key" ON "Ticket"("number");
