"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { currentUser } from "@/lib/auth-helpers";
import { requireSchoolAccess } from "@/lib/auth/tenant";

// Get messages for a user (inbox, sent, archive)
export async function getMessages(folder: "inbox" | "sent" | "archive" = "inbox") {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    // M-13: scope messages to the current school
    const { schoolId } = await requireSchoolAccess();

    let messages: any[];

    if (folder === "inbox") {
      messages = await db.message.findMany({
        where: {
          schoolId,
          recipientId: dbUser.id,
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
              role: true,
            },
          },
          recipient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } else if (folder === "sent") {
      messages = await db.message.findMany({
        where: {
          schoolId,
          senderId: dbUser.id,
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
              role: true,
            },
          },
          recipient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } else {
      // Archive - for now, just return empty array
      // In a real app, you'd have an isArchived field
      messages = [];
    }

    return { success: true, data: messages };
  } catch (error) {
    console.error("Error fetching messages:", error);
    return { success: false, error: "Failed to fetch messages" };
  }
}

// Get single message by ID
export async function getMessageById(id: string) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    const { schoolId } = await requireSchoolAccess();

    const message = await db.message.findFirst({
      where: { id, schoolId },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        recipient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!message) {
      return { success: false, error: "Message not found" };
    }

    // Check if user is sender or recipient
    if (message.senderId !== dbUser.id && message.recipientId !== dbUser.id) {
      return { success: false, error: "Unauthorized to view this message" };
    }

    return { success: true, data: message };
  } catch (error) {
    console.error("Error fetching message:", error);
    return { success: false, error: "Failed to fetch message" };
  }
}


// Send new message
export async function sendMessage(data: any) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    // Get schoolId from current user context
    const { schoolId } = await requireSchoolAccess();

    const message = await db.message.create({
      data: {
        senderId: dbUser.id,
        recipientId: data.recipientId,
        subject: data.subject || null,
        content: data.content,
        attachments: data.attachments || null,
        schoolId: schoolId || "",
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        recipient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    revalidatePath("/admin/communication/messages");

    // Create notification for recipient
    await db.notification.create({
      data: {
        userId: data.recipientId,
        title: "New Message",
        message: `You have a new message from ${dbUser.firstName} ${dbUser.lastName}${data.subject ? `: ${data.subject}` : ""}`,
        type: "MESSAGE",
        link: `/communication/messages/${message.id}`,
        isRead: false,
        schoolId: schoolId || "",
      },
    });

    return { success: true, data: message };
  } catch (error) {
    console.error("Error sending message:", error);
    return { success: false, error: "Failed to send message" };
  }
}

// Reply to message
export async function replyToMessage(messageId: string, content: string) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    // Get schoolId from current user context
    const { schoolId } = await requireSchoolAccess();

    // Get original message
    const originalMessage = await db.message.findUnique({
      where: { id: messageId, schoolId },
      select: { id: true, senderId: true, recipientId: true, subject: true },
    });

    if (!originalMessage) {
      return { success: false, error: "Original message not found" };
    }

    // L-10: only sender or recipient may reply
    if (originalMessage.recipientId !== dbUser.id && originalMessage.senderId !== dbUser.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Create reply
    const reply = await db.message.create({
      data: {
        senderId: dbUser.id,
        recipientId: originalMessage.senderId,
        subject: originalMessage.subject
          ? `Re: ${originalMessage.subject}`
          : null,
        content: content,
        schoolId: schoolId || "",
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        recipient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    revalidatePath("/admin/communication/messages");

    // Create notification for recipient
    await db.notification.create({
      data: {
        userId: originalMessage.senderId,
        title: "New Reply",
        message: `${dbUser.firstName} ${dbUser.lastName} replied: ${originalMessage.subject || "(No Subject)"}`,
        type: "MESSAGE",
        link: `/communication/messages/${reply.id}`,
        isRead: false,
        schoolId: schoolId || "",
      },
    });

    return { success: true, data: reply };
  } catch (error) {
    console.error("Error replying to message:", error);
    return { success: false, error: "Failed to reply to message" };
  }
}

// Forward message
export async function forwardMessage(messageId: string, recipientId: string) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    // Get schoolId from current user context
    const { schoolId } = await requireSchoolAccess();

    // Get original message — scoped to school
    const originalMessage = await db.message.findFirst({
      where: { id: messageId, schoolId },
    });

    if (!originalMessage) {
      return { success: false, error: "Original message not found" };
    }

    // Create forwarded message
    const forwarded = await db.message.create({
      data: {
        senderId: dbUser.id,
        recipientId: recipientId,
        subject: originalMessage.subject
          ? `Fwd: ${originalMessage.subject}`
          : null,
        content: `\n\n--- Forwarded Message ---\n${originalMessage.content}`,
        schoolId: schoolId || "",
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        recipient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    revalidatePath("/admin/communication/messages");

    // Create notification for recipient
    await db.notification.create({
      data: {
        userId: recipientId,
        title: "Forwarded Message",
        message: `${dbUser.firstName} ${dbUser.lastName} forwarded a message to you`,
        type: "MESSAGE",
        link: `/communication/messages/${forwarded.id}`,
        isRead: false,
        schoolId: schoolId || "",
      },
    });

    return { success: true, data: forwarded };
  } catch (error) {
    console.error("Error forwarding message:", error);
    return { success: false, error: "Failed to forward message" };
  }
}

// Delete message
export async function deleteMessage(id: string) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    const { schoolId } = await requireSchoolAccess();

    const message = await db.message.findFirst({
      where: { id, schoolId },
    });

    if (!message) {
      return { success: false, error: "Message not found" };
    }

    if (message.senderId !== dbUser.id && message.recipientId !== dbUser.id) {
      return { success: false, error: "Unauthorized to delete this message" };
    }

    await db.message.delete({
      where: { id },
    });

    revalidatePath("/admin/communication/messages");
    return { success: true };
  } catch (error) {
    console.error("Error deleting message:", error);
    return { success: false, error: "Failed to delete message" };
  }
}

// Mark message as read
export async function markAsRead(id: string) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    const { schoolId } = await requireSchoolAccess();

    const message = await db.message.findFirst({
      where: { id, schoolId },
    });

    if (!message) {
      return { success: false, error: "Message not found" };
    }

    // Only recipient can mark as read
    if (message.recipientId !== dbUser.id) {
      return { success: false, error: "Unauthorized" };
    }

    const updated = await db.message.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    revalidatePath("/admin/communication/messages");
    return { success: true, data: updated };
  } catch (error) {
    console.error("Error marking message as read:", error);
    return { success: false, error: "Failed to mark message as read" };
  }
}

// Get all users for recipient selection (contacts)
export async function getContacts() {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    // C-9: Scope contacts to the same school only
    const { schoolId } = await requireSchoolAccess();

    const schoolUserIds = await db.userSchool.findMany({
      where: { schoolId, isActive: true },
      select: { userId: true },
    });

    const users = await db.user.findMany({
      where: {
        id: {
          in: schoolUserIds.map((u) => u.userId),
          not: dbUser.id,
        },
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
        role: true,
      },
      orderBy: {
        firstName: "asc",
      },
    });

    return { success: true, data: users };
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return { success: false, error: "Failed to fetch contacts" };
  }
}

// Get message statistics
export async function getMessageStats() {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    const { schoolId } = await requireSchoolAccess();

    const [totalReceived, unreadCount, totalSent] = await Promise.all([
      db.message.count({
        where: { recipientId: dbUser.id, schoolId },
      }),
      db.message.count({
        where: {
          recipientId: dbUser.id,
          isRead: false,
          schoolId,
        },
      }),
      db.message.count({
        where: { senderId: dbUser.id, schoolId },
      }),
    ]);

    return {
      success: true,
      data: {
        totalReceived,
        unreadCount,
        totalSent,
      },
    };
  } catch (error) {
    console.error("Error fetching message stats:", error);
    return { success: false, error: "Failed to fetch statistics" };
  }
}

// Get weekly communication stats (messages and announcements)
export async function getWeeklyCommunicationStats() {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 6); // Last 7 days including today
    startDate.setHours(0, 0, 0, 0);

    const { schoolId } = await requireSchoolAccess();

    // Fetch messages sent/received in last 7 days
    const messages = await db.message.findMany({
      where: {
        schoolId,
        OR: [
          { senderId: dbUser.id },
          { recipientId: dbUser.id }
        ],
        createdAt: {
          gte: startDate,
        }
      },
      select: {
        createdAt: true,
        senderId: true,
        recipientId: true,
      }
    });

    // Initialize daily data
    const dailyData: Record<string, { date: string, sent: number, received: number }> = {};
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Create entries for last 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = days[date.getDay()];
      dailyData[dateStr] = { date: dayName, sent: 0, received: 0 };
    }

    // Populate data
    messages.forEach(msg => {
      const dateStr = msg.createdAt.toISOString().split('T')[0];
      if (dailyData[dateStr]) {
        if (msg.senderId === dbUser.id) {
          dailyData[dateStr].sent++;
        }
        if (msg.recipientId === dbUser.id) {
          dailyData[dateStr].received++;
        }
      }
    });

    return {
      success: true,
      data: Object.values(dailyData)
    };
  } catch (error) {
    console.error("Error fetching weekly communication stats:", error);
    return { success: false, error: "Failed to fetch weekly stats" };
  }
}
