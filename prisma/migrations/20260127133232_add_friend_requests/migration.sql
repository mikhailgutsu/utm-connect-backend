/*
  Warnings:

  - The `friends` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "friendRequestsReceived" TEXT[],
ADD COLUMN     "friendRequestsSent" TEXT[],
DROP COLUMN "friends",
ADD COLUMN     "friends" TEXT[];
