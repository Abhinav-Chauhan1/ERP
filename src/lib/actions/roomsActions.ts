"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { RoomFormValues, RoomUpdateFormValues } from "../schemaValidation/roomsSchemaValidation";

// Get all rooms with usage information
export async function getRooms() {
  try {
    // Get all rooms
    const rooms = await db.classRoom.findMany({
      orderBy: {
        name: 'asc',
      },
      include: {
        timetableSlots: {
          include: {
            class: true,
            section: true,
          },
          where: {
            timetable: {
              isActive: true
            }
          },
          take: 1
        },
        assignedSection: {
          include: {
            class: true
          }
        }
      }
    });

    // Format the response with additional information
    const formattedRooms = rooms.map(room => {
      // Check if the room is currently in use
      const isInUse = room.timetableSlots.length > 0;
      const currentClass = isInUse ?
        `${room.timetableSlots[0].class.name}${room.timetableSlots[0].section ? ' - ' + room.timetableSlots[0].section.name : ''}`
        : (room.assignedSection ? `${room.assignedSection.class.name} - ${room.assignedSection.name}` : null);

      // Extract features from description or other fields
      let features = [];
      if (room.description) {
        // Extract features based on certain keywords in description
        if (room.description.toLowerCase().includes('projector')) features.push('Projector');
        if (room.description.toLowerCase().includes('smart') && room.description.toLowerCase().includes('board')) features.push('Smart Board');
        if (room.description.toLowerCase().includes('ac') || room.description.toLowerCase().includes('air conditioning')) features.push('AC');
      }

      // Determine room type based on name or description
      let type = 'Classroom';
      if (room.name.toLowerCase().includes('lab')) type = 'Laboratory';
      else if (room.name.toLowerCase().includes('audi')) type = 'Auditorium';
      else if (room.name.toLowerCase().includes('library')) type = 'Library';
      else if (room.name.toLowerCase().includes('conf')) type = 'Conference Room';

      // Extract building and floor info if available
      const building = room.building || extractBuilding(room.name);
      const floor = room.floor || extractFloor(room.name);

      return {
        id: room.id,
        name: room.name,
        building: building,
        floor: floor,
        type: type,
        capacity: room.capacity || 30,
        features: features,
        description: room.description || "",
        status: isInUse ? "In Use" : "Available",
        currentClass: currentClass,
        hasProjector: features.includes("Projector"),
        hasSmartBoard: features.includes("Smart Board"),
        hasAC: features.includes("AC"),
        assignedSectionId: room.assignedSection?.id,
      };
    });

    return { success: true, data: formattedRooms };
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch rooms"
    };
  }
}

// Helper function to extract building info from room name
function extractBuilding(name: string): string {
  // Attempt to extract building info from names like "Science Block - 101"
  const parts = name.split('-');
  if (parts.length > 1) {
    return parts[0].trim();
  }

  // Default buildings based on keywords
  if (name.toLowerCase().includes('science')) return 'Science Block';
  if (name.toLowerCase().includes('art')) return 'Arts Block';
  if (name.toLowerCase().includes('commerce')) return 'Commerce Block';
  if (name.toLowerCase().includes('library')) return 'Main Block';
  if (name.toLowerCase().includes('comp')) return 'Computer Block';

  return 'Main Block';
}

// Helper function to extract floor info from room name
function extractFloor(name: string): string {
  // Look for room numbers that indicate floor
  const match = name.match(/\d+/);
  if (match && match[0]) {
    const roomNumber = parseInt(match[0]);
    if (roomNumber < 100) return 'Ground Floor';
    if (roomNumber < 200) return '1st Floor';
    if (roomNumber < 300) return '2nd Floor';
    if (roomNumber < 400) return '3rd Floor';
    return '4th Floor';
  }

  if (name.toLowerCase().includes('ground')) return 'Ground Floor';
  if (name.toLowerCase().includes('first')) return '1st Floor';
  if (name.toLowerCase().includes('second')) return '2nd Floor';

  return 'Ground Floor';
}

// Get a single room by ID
export async function getRoomById(id: string) {
  try {
    const room = await db.classRoom.findUnique({
      where: { id },
      include: {
        timetableSlots: {
          include: {
            class: true,
            section: true,
            timetable: true,
            subjectTeacher: {
              include: {
                subject: true,
                teacher: {
                  include: {
                    user: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!room) {
      return { success: false, error: "Room not found" };
    }

    return { success: true, data: room };
  } catch (error) {
    console.error("Error fetching room:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch room"
    };
  }
}

// Create a new room
export async function createRoom(data: RoomFormValues) {
  try {
    // Check if room name already exists
    const existingRoom = await db.classRoom.findFirst({
      where: {
        name: {
          equals: data.name,
          mode: 'insensitive' // Case insensitive search 
        }
      }
    });

    if (existingRoom) {
      return { success: false, error: "A classroom with this name already exists" };
    }

    // Combine features into description
    let description = data.description || '';
    if (data.features && data.features.length > 0) {
      if (description) description += '. ';
      description += `Features: ${data.features.join(', ')}`;
    }

    const room = await db.classRoom.create({
      data: {
        name: data.name,
        building: data.building,
        floor: data.floor,
        capacity: data.capacity,
        description: description,
      }
    });

    revalidatePath("/admin/classes/rooms");
    return { success: true, data: room };
  } catch (error) {
    console.error("Error creating classroom:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create classroom"
    };
  }
}

// Update an existing room
export async function updateRoom(data: RoomUpdateFormValues) {
  try {
    // Check if room exists
    const existingRoom = await db.classRoom.findUnique({
      where: { id: data.id }
    });

    if (!existingRoom) {
      return { success: false, error: "Classroom not found" };
    }

    // Check if updated name would conflict with another room
    const nameConflict = await db.classRoom.findFirst({
      where: {
        name: {
          equals: data.name,
          mode: 'insensitive'
        },
        id: { not: data.id }
      }
    });

    if (nameConflict) {
      return { success: false, error: "Another classroom with this name already exists" };
    }

    // Combine features into description
    let description = data.description || '';
    if (data.features && data.features.length > 0) {
      if (description) description += '. ';
      description += `Features: ${data.features.join(', ')}`;
    }

    const room = await db.classRoom.update({
      where: { id: data.id },
      data: {
        name: data.name,
        building: data.building,
        floor: data.floor,
        capacity: data.capacity,
        description: description,
      }
    });

    revalidatePath("/admin/classes/rooms");
    revalidatePath(`/admin/classes/rooms/${data.id}`);
    return { success: true, data: room };
  } catch (error) {
    console.error("Error updating classroom:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update classroom"
    };
  }
}

// Delete a room
export async function deleteRoom(id: string) {
  try {
    // Check if room has any timetable slots
    const hasTimeTableSlots = await db.timetableSlot.findFirst({
      where: { roomId: id }
    });

    if (hasTimeTableSlots) {
      return {
        success: false,
        error: "Cannot delete this classroom because it is being used in timetables. Please remove the timetable entries first."
      };
    }

    const room = await db.classRoom.delete({
      where: { id }
    });

    revalidatePath("/admin/classes/rooms");
    return { success: true, data: room };
  } catch (error) {
    console.error("Error deleting classroom:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete classroom"
    };
  }
}

// Get room usage statistics
export async function getRoomUsageStats() {
  try {
    const roomCount = await db.classRoom.count();

    const inUseCount = await db.classRoom.count({
      where: {
        timetableSlots: {
          some: {
            timetable: {
              isActive: true
            }
          }
        }
      }
    });

    const stats = {
      total: roomCount,
      inUse: inUseCount,
      available: roomCount - inUseCount,
      utilizationRate: roomCount > 0 ? (inUseCount / roomCount) * 100 : 0
    };

    return { success: true, data: stats };
  } catch (error) {
    console.error("Error getting room usage stats:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get room usage statistics"
    };
  }
}

// Get all classes and sections for assignment
export async function getClassesAndSections() {
  try {
    const classes = await db.class.findMany({
      include: {
        sections: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return { success: true, data: classes };
  } catch (error) {
    console.error("Error fetching classes:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch classes"
    };
  }
}

// Assign a room to a class section
export async function assignRoomToSection(roomId: string, sectionId: string) {
  try {
    // Check if room is already assigned
    const room = await db.classRoom.findUnique({
      where: { id: roomId },
      include: { assignedSection: true }
    });

    if (!room) {
      return { success: false, error: "Room not found" };
    }

    if (room.assignedSection && room.assignedSection.id !== sectionId) {
      return { success: false, error: "Room is already assigned to another section" };
    }

    // Check if section already has a room
    const section = await db.classSection.findUnique({
      where: { id: sectionId },
      include: { homeRoom: true }
    });

    if (!section) {
      return { success: false, error: "Section not found" };
    }

    if (section.homeRoom && section.homeRoom.id !== roomId) {
      return { success: false, error: "This section already has a home room assigned" };
    }

    // Assign
    await db.classSection.update({
      where: { id: sectionId },
      data: {
        homeRoomId: roomId
      }
    });

    revalidatePath("/admin/classes/rooms");
    return { success: true };
  } catch (error) {
    console.error("Error assigning room:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to assign room"
    };
  }
}

// Unassign a room
export async function unassignRoom(roomId: string) {
  try {
    const room = await db.classRoom.findUnique({
      where: { id: roomId },
      include: { assignedSection: true }
    });

    if (!room) {
      return { success: false, error: "Room not found" };
    }

    if (!room.assignedSection) {
      return { success: false, error: "Room is not assigned to any section" };
    }

    // Unassign
    await db.classSection.update({
      where: { id: room.assignedSection.id },
      data: {
        homeRoomId: null
      }
    });

    revalidatePath("/admin/classes/rooms");
    return { success: true };
  } catch (error) {
    console.error("Error unassigning room:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to unassign room"
    };
  }
}
