-- CreateEnum
CREATE TYPE "HostelType" AS ENUM ('BOYS', 'GIRLS', 'MIXED');

-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('SINGLE', 'DOUBLE', 'SHARED');

-- CreateEnum
CREATE TYPE "AllocationStatus" AS ENUM ('ACTIVE', 'VACATED', 'TRANSFERRED');

-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACKS');

-- CreateEnum
CREATE TYPE "ComplaintCategory" AS ENUM ('ROOM_MAINTENANCE', 'MESS_FOOD', 'CLEANLINESS', 'ELECTRICITY', 'WATER_SUPPLY', 'SECURITY', 'NOISE', 'OTHER');

-- CreateEnum
CREATE TYPE "ComplaintPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED');

-- CreateTable
CREATE TABLE "hostels" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "capacity" INTEGER NOT NULL,
    "wardenId" TEXT,
    "wardenName" TEXT,
    "wardenPhone" TEXT,
    "type" "HostelType" NOT NULL DEFAULT 'BOYS',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hostels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hostel_rooms" (
    "id" TEXT NOT NULL,
    "hostelId" TEXT NOT NULL,
    "roomNumber" TEXT NOT NULL,
    "floor" INTEGER,
    "roomType" "RoomType" NOT NULL DEFAULT 'SHARED',
    "capacity" INTEGER NOT NULL,
    "currentOccupancy" INTEGER NOT NULL DEFAULT 0,
    "amenities" TEXT,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "monthlyFee" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hostel_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hostel_room_allocations" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "bedNumber" TEXT,
    "allocatedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vacatedDate" TIMESTAMP(3),
    "status" "AllocationStatus" NOT NULL DEFAULT 'ACTIVE',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hostel_room_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hostel_mess_attendance" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "mealType" "MealType" NOT NULL,
    "isPresent" BOOLEAN NOT NULL DEFAULT true,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedBy" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hostel_mess_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hostel_visitors" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "visitorName" TEXT NOT NULL,
    "visitorPhone" TEXT,
    "visitorRelation" TEXT,
    "purpose" TEXT,
    "checkInTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkOutTime" TIMESTAMP(3),
    "idProofType" TEXT,
    "idProofNumber" TEXT,
    "approvedBy" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hostel_visitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hostel_fee_payments" (
    "id" TEXT NOT NULL,
    "allocationId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "roomFee" DOUBLE PRECISION NOT NULL,
    "messFee" DOUBLE PRECISION NOT NULL,
    "otherCharges" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balance" DOUBLE PRECISION NOT NULL,
    "paymentDate" TIMESTAMP(3),
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "transactionId" TEXT,
    "receiptNumber" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hostel_fee_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hostel_complaints" (
    "id" TEXT NOT NULL,
    "hostelId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "category" "ComplaintCategory" NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "ComplaintPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "ComplaintStatus" NOT NULL DEFAULT 'PENDING',
    "assignedTo" TEXT,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "attachments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hostel_complaints_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hostels_status_idx" ON "hostels"("status");

-- CreateIndex
CREATE INDEX "hostels_type_idx" ON "hostels"("type");

-- CreateIndex
CREATE INDEX "hostel_rooms_hostelId_status_idx" ON "hostel_rooms"("hostelId", "status");

-- CreateIndex
CREATE INDEX "hostel_rooms_roomType_idx" ON "hostel_rooms"("roomType");

-- CreateIndex
CREATE UNIQUE INDEX "hostel_rooms_hostelId_roomNumber_key" ON "hostel_rooms"("hostelId", "roomNumber");

-- CreateIndex
CREATE INDEX "hostel_room_allocations_studentId_status_idx" ON "hostel_room_allocations"("studentId", "status");

-- CreateIndex
CREATE INDEX "hostel_room_allocations_roomId_status_idx" ON "hostel_room_allocations"("roomId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "hostel_room_allocations_roomId_studentId_allocatedDate_key" ON "hostel_room_allocations"("roomId", "studentId", "allocatedDate");

-- CreateIndex
CREATE INDEX "hostel_mess_attendance_studentId_date_idx" ON "hostel_mess_attendance"("studentId", "date");

-- CreateIndex
CREATE INDEX "hostel_mess_attendance_date_mealType_idx" ON "hostel_mess_attendance"("date", "mealType");

-- CreateIndex
CREATE UNIQUE INDEX "hostel_mess_attendance_studentId_date_mealType_key" ON "hostel_mess_attendance"("studentId", "date", "mealType");

-- CreateIndex
CREATE INDEX "hostel_visitors_studentId_checkInTime_idx" ON "hostel_visitors"("studentId", "checkInTime");

-- CreateIndex
CREATE INDEX "hostel_visitors_checkInTime_idx" ON "hostel_visitors"("checkInTime");

-- CreateIndex
CREATE INDEX "hostel_fee_payments_allocationId_status_idx" ON "hostel_fee_payments"("allocationId", "status");

-- CreateIndex
CREATE INDEX "hostel_fee_payments_status_dueDate_idx" ON "hostel_fee_payments"("status", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "hostel_fee_payments_allocationId_month_year_key" ON "hostel_fee_payments"("allocationId", "month", "year");

-- CreateIndex
CREATE INDEX "hostel_complaints_hostelId_status_idx" ON "hostel_complaints"("hostelId", "status");

-- CreateIndex
CREATE INDEX "hostel_complaints_studentId_status_idx" ON "hostel_complaints"("studentId", "status");

-- CreateIndex
CREATE INDEX "hostel_complaints_status_priority_idx" ON "hostel_complaints"("status", "priority");

-- CreateIndex
CREATE INDEX "hostel_complaints_createdAt_idx" ON "hostel_complaints"("createdAt");

-- AddForeignKey
ALTER TABLE "hostel_rooms" ADD CONSTRAINT "hostel_rooms_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "hostels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_room_allocations" ADD CONSTRAINT "hostel_room_allocations_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "hostel_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_room_allocations" ADD CONSTRAINT "hostel_room_allocations_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_mess_attendance" ADD CONSTRAINT "hostel_mess_attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_visitors" ADD CONSTRAINT "hostel_visitors_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_fee_payments" ADD CONSTRAINT "hostel_fee_payments_allocationId_fkey" FOREIGN KEY ("allocationId") REFERENCES "hostel_room_allocations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_complaints" ADD CONSTRAINT "hostel_complaints_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "hostels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_complaints" ADD CONSTRAINT "hostel_complaints_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
