-- AlterTable
ALTER TABLE "StudentSettings" ADD COLUMN     "whatsappNotifications" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "whatsappOptIn" BOOLEAN NOT NULL DEFAULT false;
