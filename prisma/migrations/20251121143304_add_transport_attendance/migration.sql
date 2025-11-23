-- CreateEnum
CREATE TYPE "TransportAttendanceType" AS ENUM ('BOARDING', 'ALIGHTING');

-- CreateEnum
CREATE TYPE "TransportAttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE');

-- CreateTable
CREATE TABLE "transport_attendance" (
    "id" TEXT NOT NULL,
    "studentRouteId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "stopName" TEXT NOT NULL,
    "attendanceType" "TransportAttendanceType" NOT NULL,
    "status" "TransportAttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedBy" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transport_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transport_attendance_studentRouteId_date_idx" ON "transport_attendance"("studentRouteId", "date");

-- CreateIndex
CREATE INDEX "transport_attendance_date_status_idx" ON "transport_attendance"("date", "status");

-- CreateIndex
CREATE UNIQUE INDEX "transport_attendance_studentRouteId_date_stopName_attendanc_key" ON "transport_attendance"("studentRouteId", "date", "stopName", "attendanceType");

-- AddForeignKey
ALTER TABLE "transport_attendance" ADD CONSTRAINT "transport_attendance_studentRouteId_fkey" FOREIGN KEY ("studentRouteId") REFERENCES "student_routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
