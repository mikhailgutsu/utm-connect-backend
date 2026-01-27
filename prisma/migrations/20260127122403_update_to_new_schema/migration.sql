/*
  Warnings:

  - You are about to drop the column `description` on the `Group` table. All the data in the column will be lost.
  - You are about to drop the column `content` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `group` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Campaign` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Friend` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GroupMember` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Link` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Photo` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `userId` to the `LinkAnalytic` table without a default value. This is not possible if the table is not empty.
  - Added the required column `comments` to the `Post` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Campaign" DROP CONSTRAINT "Campaign_userId_fkey";

-- DropForeignKey
ALTER TABLE "Friend" DROP CONSTRAINT "Friend_friendId_fkey";

-- DropForeignKey
ALTER TABLE "Friend" DROP CONSTRAINT "Friend_userId_fkey";

-- DropForeignKey
ALTER TABLE "GroupMember" DROP CONSTRAINT "GroupMember_groupId_fkey";

-- DropForeignKey
ALTER TABLE "GroupMember" DROP CONSTRAINT "GroupMember_userId_fkey";

-- DropForeignKey
ALTER TABLE "Link" DROP CONSTRAINT "Link_campaignId_fkey";

-- DropForeignKey
ALTER TABLE "Link" DROP CONSTRAINT "Link_userId_fkey";

-- DropForeignKey
ALTER TABLE "LinkAnalytic" DROP CONSTRAINT "LinkAnalytic_linkId_fkey";

-- DropForeignKey
ALTER TABLE "Photo" DROP CONSTRAINT "Photo_userId_fkey";

-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_userId_fkey";

-- DropIndex
DROP INDEX "Group_name_key";

-- DropIndex
DROP INDEX "Post_userId_idx";

-- AlterTable
ALTER TABLE "Group" DROP COLUMN "description",
ADD COLUMN     "userIds" TEXT[];

-- AlterTable
ALTER TABLE "LinkAnalytic" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Post" DROP COLUMN "content",
DROP COLUMN "userId",
ADD COLUMN     "comments" JSONB NOT NULL,
ADD COLUMN     "imageUrls" TEXT[],
ADD COLUMN     "likes" TEXT[];

-- AlterTable
ALTER TABLE "User" DROP COLUMN "group",
ADD COLUMN     "friends" TEXT,
ADD COLUMN     "groupIds" TEXT[],
ADD COLUMN     "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "photoUrl" TEXT,
ADD COLUMN     "postIds" TEXT[],
ADD COLUMN     "primaryPhotoUrl" TEXT,
ADD COLUMN     "universityGroup" TEXT;

-- DropTable
DROP TABLE "Campaign";

-- DropTable
DROP TABLE "Friend";

-- DropTable
DROP TABLE "GroupMember";

-- DropTable
DROP TABLE "Link";

-- DropTable
DROP TABLE "Photo";

-- CreateIndex
CREATE INDEX "LinkAnalytic_userId_idx" ON "LinkAnalytic"("userId");

-- AddForeignKey
ALTER TABLE "LinkAnalytic" ADD CONSTRAINT "LinkAnalytic_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
