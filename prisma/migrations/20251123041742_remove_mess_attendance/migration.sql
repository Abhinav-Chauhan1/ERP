/*
  Warnings:

  - You are about to drop the `hostel_mess_attendance` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "hostel_mess_attendance" DROP CONSTRAINT "hostel_mess_attendance_studentId_fkey";

-- DropTable
DROP TABLE "hostel_mess_attendance";

-- DropEnum
DROP TYPE "MealType";
