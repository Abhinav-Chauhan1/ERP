"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";

// Get messages for a user (inbox, sent, archive)
export async function getMessages(folder: "inbox" | "sent" | "archive" = "inbox") {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    let messages;

    if (folder === "inbox") {
      messages = await db.message.findMany({
        where: {
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
      where: { clerkId: user.id },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    const message = await db.message.findUnique({
      where: { id },
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
      where: { clerkId: user.id },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    const message = await db.message.create({
      data: {
        senderId: dbUser.id,
        recipientId: data.recipientId,
        subject: data.subject || null,
        content: data.content,
        attachments: data.attachments || null,
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
      where: { clerkId: user.id },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    // Get original message
    const originalMessage = await db.message.findUnique({
      where: { id: messageId },
    });

    if (!originalMessage) {
      return { success: false, error: "Original message not found" };
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
      where: { clerkId: user.id },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    // Get original message
    const originalMessage = await db.message.findUnique({
      where: { id: messageId },
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
      where: { clerkId: user.id },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    // Check if user is sender or recipient
    const message = await db.message.findUnique({
      where: { id },
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
      where: { clerkId: user.id },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    const message = await db.message.findUnique({
      where: { id },
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
      where: { clerkId: user.id },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    // Get all users except current user
    const users = await db.user.findMany({
      where: {
        id: {
          not: dbUser.id,
        },
        active: true,
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
      where: { clerkId: user.id },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    const [totalReceived, unreadCount, totalSent] = await Promise.all([
      db.message.count({
        where: { recipientId: dbUser.id },
      }),
      db.message.count({
        where: {
          recipientId: dbUser.id,
          isRead: false,
        },
      }),
      db.message.count({
        where: { senderId: dbUser.id },
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
