"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { TimetableConfigFormValues } from "../schemaValidation/timetableConfigSchemaValidation";

// Get the current timetable configuration
export async function getTimetableConfig() {
  try {
    // Get the active configuration or create a default one if none exists
    let config = await db.timetableConfig.findFirst({
      where: { isActive: true },
      include: {
        periods: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    });
    
    // If no active config exists, return default values
    if (!config) {
      return { 
        success: true, 
        data: {
          id: null,
          name: "Default Configuration",
          daysOfWeek: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
          periods: [
            { id: 'default1', name: 'Period 1', startTime: '09:00', endTime: '09:45', order: 1 },
            { id: 'default2', name: 'Period 2', startTime: '09:50', endTime: '10:35', order: 2 },
            { id: 'default3', name: 'Period 3', startTime: '10:40', endTime: '11:25', order: 3 },
            { id: 'default4', name: 'Period 4', startTime: '11:45', endTime: '12:30', order: 4 },
            { id: 'default5', name: 'Period 5', startTime: '13:15', endTime: '14:00', order: 5 },
            { id: 'default6', name: 'Period 6', startTime: '14:05', endTime: '14:50', order: 6 },
            { id: 'default7', name: 'Period 7', startTime: '14:55', endTime: '15:40', order: 7 },
          ]
        }
      };
    }
    
    // Format the data for easier consumption
    const formattedData = {
      id: config.id,
      name: config.name,
      daysOfWeek: config.daysOfWeek,
      periods: config.periods.map(period => ({
        id: period.id,
        name: period.name,
        startTime: formatTimeString(period.startTime),
        endTime: formatTimeString(period.endTime),
        order: period.order
      }))
    };
    
    return { success: true, data: formattedData };
  } catch (error) {
    console.error("Error fetching timetable configuration:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch timetable configuration" 
    };
  }
}

// Save/update timetable configuration
export async function saveTimetableConfig(data: TimetableConfigFormValues) {
  console.log("Server received data:", data);
  
  try {
    // Validate input
    if (!data.name) {
      return { success: false, error: "Configuration name is required" };
    }
    
    if (!data.periods || data.periods.length === 0) {
      return { success: false, error: "At least one period is required" };
    }
    
    // If updating an existing config
    if (data.id) {
      try {
        // First, delete all existing periods
        await db.timetablePeriod.deleteMany({
          where: { configId: data.id }
        });
        
        // Update the config
        const config = await db.timetableConfig.update({
          where: { id: data.id },
          data: {
            name: data.name,
            daysOfWeek: data.daysOfWeek,
            isActive: true,
            periods: {
              create: data.periods.map((period, index) => ({
                name: period.name,
                startTime: new Date(`1970-01-01T${period.startTime}:00`),
                endTime: new Date(`1970-01-01T${period.endTime}:00`),
                order: index + 1
              }))
            }
          }
        });
        
        console.log("Updated config:", config);
        revalidatePath("/admin/teaching/timetable");
        return { success: true, data: config };
      } catch (error) {
        console.error("Error updating config:", error);
        return { success: false, error: "Failed to update timetable configuration" };
      }
    } 
    // Creating a new config
    else {
      try {
        // First set all existing configs to inactive
        await db.timetableConfig.updateMany({
          where: { isActive: true },
          data: { isActive: false }
        });
        
        // Create new config
        const config = await db.timetableConfig.create({
          data: {
            name: data.name,
            daysOfWeek: data.daysOfWeek,
            isActive: true,
          }
        });
        
        // Create periods one by one to avoid potential issues
        for (const period of data.periods) {
          await db.timetablePeriod.create({
            data: {
              name: period.name,
              startTime: new Date(`1970-01-01T${period.startTime}:00`),
              endTime: new Date(`1970-01-01T${period.endTime}:00`),
              order: period.order || data.periods.indexOf(period) + 1,
              configId: config.id
            }
          });
        }
        
        console.log("Created new config:", config);
        revalidatePath("/admin/teaching/timetable");
        return { success: true, data: config };
      } catch (error) {
        console.error("Error creating config:", error);
        return { success: false, error: "Failed to create timetable configuration" };
      }
    }
  } catch (error) {
    console.error("Server error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Server error" 
    };
  }
}

// Helper function to format time from Date to string (HH:MM)
function formatTimeString(time: Date): string {
  return time.toISOString().slice(11, 16);
}
