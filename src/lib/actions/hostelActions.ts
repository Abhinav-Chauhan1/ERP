"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { db as prisma } from "@/lib/db";
import {
  HostelType,
  RoomType,
  AllocationStatus,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  PaymentMethod,
  PaymentStatus,
} from "@prisma/client";
import { requireSchoolAccess, withSchoolScope, withSchoolId } from "@/lib/auth/tenant";

// ============================================
// HOSTEL MANAGEMENT
// ============================================

export async function createHostel(data: {
  name: string;
  address?: string;
  capacity: number;
  wardenId?: string;
  wardenName?: string;
  wardenPhone?: string;
  type: HostelType;
}) {
  try {
    const { schoolId } = await requireSchoolAccess();

    const hostel = await prisma.hostel.create({
      data: withSchoolId({
        name: data.name,
        address: data.address,
        capacity: data.capacity,
        wardenId: data.wardenId,
        wardenName: data.wardenName,
        wardenPhone: data.wardenPhone,
        type: data.type,
      }, schoolId),
    });

    revalidatePath("/admin/hostel");
    return { success: true, data: hostel };
  } catch (error) {
    console.error("Error creating hostel:", error);
    return { success: false, error: "Failed to create hostel" };
  }
}

export async function updateHostel(
  id: string,
  data: {
    name?: string;
    address?: string;
    capacity?: number;
    wardenId?: string;
    wardenName?: string;
    wardenPhone?: string;
    type?: HostelType;
    status?: string;
  }
) {
  try {
    const { schoolId } = await requireSchoolAccess();

    // Verify ownership
    const existing = await prisma.hostel.findFirst({
      where: { id, schoolId },
    });

    if (!existing) {
      return { success: false, error: "Hostel not found" };
    }

    const hostel = await prisma.hostel.update({
      where: { id },
      data,
    });

    revalidatePath("/admin/hostel");
    return { success: true, data: hostel };
  } catch (error) {
    console.error("Error updating hostel:", error);
    return { success: false, error: "Failed to update hostel" };
  }
}

export async function getHostels() {
  try {
    const { schoolId } = await requireSchoolAccess();

    const hostels = await prisma.hostel.findMany({
      where: { schoolId },
      include: {
        rooms: {
          select: {
            id: true,
            currentOccupancy: true,
            capacity: true,
            status: true,
          },
        },
        _count: {
          select: {
            rooms: true,
            complaints: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return { success: true, data: hostels };
  } catch (error) {
    console.error("Error fetching hostels:", error);
    return { success: false, error: "Failed to fetch hostels" };
  }
}

export async function getHostelById(id: string) {
  try {
    const { schoolId } = await requireSchoolAccess();

    const hostel = await prisma.hostel.findFirst({
      where: { id, schoolId },
      include: {
        rooms: {
          include: {
            allocations: {
              where: { status: AllocationStatus.ACTIVE },
              include: {
                student: {
                  include: {
                    user: {
                      select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        complaints: {
          where: {
            status: {
              in: [ComplaintStatus.PENDING, ComplaintStatus.IN_PROGRESS],
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    return { success: true, data: hostel };
  } catch (error) {
    console.error("Error fetching hostel:", error);
    return { success: false, error: "Failed to fetch hostel" };
  }
}

export async function deleteHostel(id: string) {
  try {
    const { schoolId } = await requireSchoolAccess();

    // Verify ownership
    const existing = await prisma.hostel.findFirst({
      where: { id, schoolId },
    });

    if (!existing) {
      return { success: false, error: "Hostel not found" };
    }

    await prisma.hostel.delete({
      where: { id },
    });

    revalidatePath("/admin/hostel");
    return { success: true };
  } catch (error) {
    console.error("Error deleting hostel:", error);
    return { success: false, error: "Failed to delete hostel" };
  }
}

// ============================================
// ROOM MANAGEMENT
// ============================================

export async function createHostelRoom(data: {
  hostelId: string;
  roomNumber: string;
  floor?: number;
  roomType: RoomType;
  capacity: number;
  amenities?: string;
  monthlyFee: number;
}) {
  try {
    const { schoolId } = await requireSchoolAccess();

    // Verify hostel belongs to school
    const hostel = await prisma.hostel.findFirst({
      where: { id: data.hostelId, schoolId },
    });

    if (!hostel) {
      return { success: false, error: "Hostel not found" };
    }

    const room = await prisma.hostelRoom.create({
      data: withSchoolId({
        hostelId: data.hostelId,
        roomNumber: data.roomNumber,
        floor: data.floor,
        roomType: data.roomType,
        capacity: data.capacity,
        amenities: data.amenities,
        monthlyFee: data.monthlyFee,
      }, schoolId),
    });

    revalidatePath("/admin/hostel");
    return { success: true, data: room };
  } catch (error) {
    console.error("Error creating room:", error);
    return { success: false, error: "Failed to create room" };
  }
}

export async function updateHostelRoom(
  id: string,
  data: {
    roomNumber?: string;
    floor?: number;
    roomType?: RoomType;
    capacity?: number;
    amenities?: string;
    monthlyFee?: number;
    status?: string;
  }
) {
  try {
    const { schoolId } = await requireSchoolAccess();

    // Verify room ownership via schoolId
    const existing = await prisma.hostelRoom.findFirst({
      where: { id, schoolId },
    });

    if (!existing) {
      return { success: false, error: "Room not found" };
    }

    const room = await prisma.hostelRoom.update({
      where: { id },
      data,
    });

    revalidatePath("/admin/hostel");
    return { success: true, data: room };
  } catch (error) {
    console.error("Error updating room:", error);
    return { success: false, error: "Failed to update room" };
  }
}

export async function getHostelRooms(hostelId: string) {
  try {
    const { schoolId } = await requireSchoolAccess();

    const rooms = await prisma.hostelRoom.findMany({
      where: {
        hostelId,
        schoolId // Redundant if hostelId is checked but safe
      },
      include: {
        allocations: {
          where: { status: AllocationStatus.ACTIVE },
          include: {
            student: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [{ floor: "asc" }, { roomNumber: "asc" }],
    });

    return { success: true, data: rooms };
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return { success: false, error: "Failed to fetch rooms" };
  }
}

export async function deleteHostelRoom(id: string) {
  try {
    const { schoolId } = await requireSchoolAccess();

    const existing = await prisma.hostelRoom.findFirst({
      where: { id, schoolId },
    });

    if (!existing) {
      return { success: false, error: "Room not found" };
    }

    await prisma.hostelRoom.delete({
      where: { id },
    });

    revalidatePath("/admin/hostel");
    return { success: true };
  } catch (error) {
    console.error("Error deleting room:", error);
    return { success: false, error: "Failed to delete room" };
  }
}

// ============================================
// ROOM ALLOCATION
// ============================================

export async function allocateRoom(data: {
  roomId: string;
  studentId: string;
  bedNumber?: string;
  remarks?: string;
}) {
  try {
    const { schoolId, user } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required" };
    const userId = user.id;

    // Check if room has capacity
    const room = await prisma.hostelRoom.findUnique({
      where: { id: data.roomId },
    });

    if (!room) {
      return { success: false, error: "Room not found" };
    }

    if (room.currentOccupancy >= room.capacity) {
      return { success: false, error: "Room is at full capacity" };
    }

    // Check if student already has an active allocation
    const existingAllocation = await prisma.hostelRoomAllocation.findFirst({
      where: {
        studentId: data.studentId,
        status: AllocationStatus.ACTIVE,
      },
    });

    if (existingAllocation) {
      return {
        success: false,
        error: "Student already has an active room allocation",
      };
    }

    // Create allocation
    const allocation = await prisma.hostelRoomAllocation.create({
      data: {
        schoolId,
        roomId: data.roomId,
        studentId: data.studentId,
        bedNumber: data.bedNumber,
        remarks: data.remarks,
      },
    });

    // Update room occupancy
    await prisma.hostelRoom.update({
      where: { id: data.roomId },
      data: {
        currentOccupancy: { increment: 1 },
        status: room.currentOccupancy + 1 >= room.capacity ? "OCCUPIED" : room.status,
      },
    });

    revalidatePath("/admin/hostel");
    return { success: true, data: allocation };
  } catch (error) {
    console.error("Error allocating room:", error);
    return { success: false, error: "Failed to allocate room" };
  }
}

export async function vacateRoom(allocationId: string, remarks?: string) {
  try {
    const { schoolId, user } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required" };
    const userId = user.id;

    const allocation = await prisma.hostelRoomAllocation.findUnique({
      where: { id: allocationId },
      include: { room: true },
    });

    if (!allocation) {
      return { success: false, error: "Allocation not found" };
    }

    // Update allocation
    await prisma.hostelRoomAllocation.update({
      where: { id: allocationId },
      data: {
        status: AllocationStatus.VACATED,
        vacatedDate: new Date(),
        remarks: remarks || allocation.remarks,
      },
    });

    // Update room occupancy
    await prisma.hostelRoom.update({
      where: { id: allocation.roomId },
      data: {
        currentOccupancy: { decrement: 1 },
        status: "AVAILABLE",
      },
    });

    revalidatePath("/admin/hostel");
    return { success: true };
  } catch (error) {
    console.error("Error vacating room:", error);
    return { success: false, error: "Failed to vacate room" };
  }
}

export async function getRoomAllocations(roomId: string) {
  try {
    const allocations = await prisma.hostelRoomAllocation.findMany({
      where: { roomId },
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: { allocatedDate: "desc" },
    });

    return { success: true, data: allocations };
  } catch (error) {
    console.error("Error fetching allocations:", error);
    return { success: false, error: "Failed to fetch allocations" };
  }
}

export async function getStudentAllocation(studentId: string) {
  try {
    const allocation = await prisma.hostelRoomAllocation.findFirst({
      where: {
        studentId,
        status: AllocationStatus.ACTIVE,
      },
      include: {
        room: {
          include: {
            hostel: true,
          },
        },
      },
    });

    return { success: true, data: allocation };
  } catch (error) {
    console.error("Error fetching student allocation:", error);
    return { success: false, error: "Failed to fetch allocation" };
  }
}

// ============================================
// VISITOR MANAGEMENT
// ============================================

export async function logVisitorEntry(data: {
  studentId: string;
  visitorName: string;
  visitorPhone?: string;
  visitorRelation?: string;
  purpose?: string;
  idProofType?: string;
  idProofNumber?: string;
  approvedBy?: string;
  remarks?: string;
}) {
  try {
    const { schoolId, user } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required" };
    const userId = user.id;

    const visitor = await prisma.hostelVisitor.create({
      data: {
        schoolId,
        studentId: data.studentId,
        visitorName: data.visitorName,
        visitorPhone: data.visitorPhone,
        visitorRelation: data.visitorRelation,
        purpose: data.purpose,
        idProofType: data.idProofType,
        idProofNumber: data.idProofNumber,
        approvedBy: data.approvedBy || userId,
        remarks: data.remarks,
      },
    });

    revalidatePath("/admin/hostel/visitors");
    return { success: true, data: visitor };
  } catch (error) {
    console.error("Error logging visitor:", error);
    return { success: false, error: "Failed to log visitor" };
  }
}

export async function logVisitorExit(visitorId: string) {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required" };

    const visitor = await prisma.hostelVisitor.update({
      where: { id: visitorId, schoolId },
      data: {
        checkOutTime: new Date(),
      },
    });

    revalidatePath("/admin/hostel/visitors");
    return { success: true, data: visitor };
  } catch (error) {
    console.error("Error logging visitor exit:", error);
    return { success: false, error: "Failed to log exit" };
  }
}

export async function getVisitors(studentId?: string, date?: Date) {
  try {
    const where: any = {};
    if (studentId) {
      where.studentId = studentId;
    }
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      where.checkInTime = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const visitors = await prisma.hostelVisitor.findMany({
      where,
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            hostelRoomAllocations: {
              where: { status: AllocationStatus.ACTIVE },
              include: {
                room: {
                  include: {
                    hostel: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { checkInTime: "desc" },
    });

    return { success: true, data: visitors };
  } catch (error) {
    console.error("Error fetching visitors:", error);
    return { success: false, error: "Failed to fetch visitors" };
  }
}

// ============================================
// FEE MANAGEMENT
// ============================================

export async function generateHostelFee(data: {
  allocationId: string;
  month: number;
  year: number;
  roomFee: number;
  messFee: number;
  otherCharges?: number;
  dueDate: Date;
}) {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required" };

    // Verify allocation belongs to school
    const allocation = await prisma.hostelRoomAllocation.findFirst({
      where: { id: data.allocationId, schoolId }
    });
    if (!allocation) return { success: false, error: "Allocation not found or access denied" };

    const totalAmount =
      data.roomFee + data.messFee + (data.otherCharges || 0);

    const fee = await prisma.hostelFeePayment.create({
      data: {
        allocationId: data.allocationId,
        month: data.month,
        year: data.year,
        roomFee: data.roomFee,
        messFee: data.messFee,
        otherCharges: data.otherCharges || 0,
        totalAmount,
        balance: totalAmount,
        dueDate: data.dueDate,
      },
    });

    revalidatePath("/admin/hostel/fees");
    return { success: true, data: fee };
  } catch (error) {
    console.error("Error generating hostel fee:", error);
    return { success: false, error: "Failed to generate fee" };
  }
}

export async function recordHostelFeePayment(
  feeId: string,
  data: {
    paidAmount: number;
    paymentDate: Date;
    paymentMethod: PaymentMethod;
    transactionId?: string;
    receiptNumber?: string;
    remarks?: string;
  }
) {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required" };

    const fee = await prisma.hostelFeePayment.findUnique({
      where: { id: feeId },
      include: { allocation: true }
    });

    // Check school access via allocation
    if (fee && fee.allocation.schoolId !== schoolId) {
      return { success: false, error: "Access denied" };
    }

    if (!fee) {
      return { success: false, error: "Fee record not found" };
    }

    const newPaidAmount = fee.paidAmount + data.paidAmount;
    const newBalance = fee.totalAmount - newPaidAmount;
    const newStatus =
      newBalance <= 0
        ? PaymentStatus.COMPLETED
        : newPaidAmount > 0
          ? PaymentStatus.PARTIAL
          : PaymentStatus.PENDING;

    const updatedFee = await prisma.hostelFeePayment.update({
      where: { id: feeId },
      data: {
        paidAmount: newPaidAmount,
        balance: newBalance,
        paymentDate: data.paymentDate,
        paymentMethod: data.paymentMethod,
        transactionId: data.transactionId,
        receiptNumber: data.receiptNumber,
        status: newStatus,
        remarks: data.remarks,
      },
    });

    revalidatePath("/admin/hostel/fees");
    return { success: true, data: updatedFee };
  } catch (error) {
    console.error("Error recording payment:", error);
    return { success: false, error: "Failed to record payment" };
  }
}

export async function getHostelFees(allocationId?: string, status?: PaymentStatus) {
  try {
    const { schoolId } = await requireSchoolAccess();
    const where: any = {
      allocation: { schoolId }
    };
    if (allocationId) {
      where.allocationId = allocationId;
    }
    if (status) {
      where.status = status;
    }

    const fees = await prisma.hostelFeePayment.findMany({
      where,
      include: {
        allocation: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
            room: {
              include: {
                hostel: true,
              },
            },
          },
        },
      },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    return { success: true, data: fees };
  } catch (error) {
    console.error("Error fetching hostel fees:", error);
    return { success: false, error: "Failed to fetch fees" };
  }
}

// ============================================
// COMPLAINT MANAGEMENT
// ============================================

export async function createHostelComplaint(data: {
  hostelId: string;
  studentId: string;
  category: ComplaintCategory;
  subject: string;
  description: string;
  priority?: ComplaintPriority;
  attachments?: string;
}) {
  try {
    const { schoolId, user } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required" };
    const userId = user.id;

    const complaint = await prisma.hostelComplaint.create({
      data: {
        schoolId,
        hostelId: data.hostelId,
        studentId: data.studentId,
        category: data.category,
        subject: data.subject,
        description: data.description,
        priority: data.priority || ComplaintPriority.MEDIUM,
        attachments: data.attachments,
      },
    });

    revalidatePath("/admin/hostel/complaints");
    return { success: true, data: complaint };
  } catch (error) {
    console.error("Error creating complaint:", error);
    return { success: false, error: "Failed to create complaint" };
  }
}

export async function updateComplaintStatus(
  complaintId: string,
  data: {
    status: ComplaintStatus;
    assignedTo?: string;
    resolvedBy?: string;
    resolution?: string;
  }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const updateData: any = {
      status: data.status,
    };

    if (data.assignedTo) {
      updateData.assignedTo = data.assignedTo;
    }

    if (data.status === ComplaintStatus.RESOLVED || data.status === ComplaintStatus.CLOSED) {
      updateData.resolvedBy = data.resolvedBy || userId;
      updateData.resolvedAt = new Date();
      if (data.resolution) {
        updateData.resolution = data.resolution;
      }
    }

    const complaint = await prisma.hostelComplaint.update({
      where: { id: complaintId },
      data: updateData,
    });

    revalidatePath("/admin/hostel/complaints");
    return { success: true, data: complaint };
  } catch (error) {
    console.error("Error updating complaint:", error);
    return { success: false, error: "Failed to update complaint" };
  }
}

export async function getHostelComplaints(
  hostelId?: string,
  status?: ComplaintStatus,
  studentId?: string
) {
  try {
    const where: any = {};
    if (hostelId) {
      where.hostelId = hostelId;
    }
    if (status) {
      where.status = status;
    }
    if (studentId) {
      where.studentId = studentId;
    }

    const complaints = await prisma.hostelComplaint.findMany({
      where,
      include: {
        hostel: {
          select: {
            name: true,
          },
        },
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });

    return { success: true, data: complaints };
  } catch (error) {
    console.error("Error fetching complaints:", error);
    return { success: false, error: "Failed to fetch complaints" };
  }
}

export async function getComplaintById(complaintId: string) {
  try {
    const complaint = await prisma.hostelComplaint.findUnique({
      where: { id: complaintId },
      include: {
        hostel: true,
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
            hostelRoomAllocations: {
              where: { status: AllocationStatus.ACTIVE },
              include: {
                room: true,
              },
            },
          },
        },
      },
    });

    return { success: true, data: complaint };
  } catch (error) {
    console.error("Error fetching complaint:", error);
    return { success: false, error: "Failed to fetch complaint" };
  }
}
