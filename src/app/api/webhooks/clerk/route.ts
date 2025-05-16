import { WebhookEvent } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";

// Specify Node.js runtime for Prisma compatibility
export const runtime = 'nodejs';

export async function POST(req: Request) {
  // Get the SVIX_WEBHOOK_SECRET from environment variables
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  
  if (!WEBHOOK_SECRET) {
    console.error("Missing CLERK_WEBHOOK_SECRET!");
    return new NextResponse("Missing webhook secret", { status: 500 });
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no SVIX headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new NextResponse("Error occurred -- missing svix headers", { status: 400 });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new SVIX instance with the secret
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new NextResponse("Error occurred", { status: 400 });
  }

  const eventType = evt.type;

  if (eventType === "user.created") {
    const { id, email_addresses, first_name, last_name, image_url, phone_numbers } = evt.data;
    
    const email = email_addresses?.[0]?.email_address;
    const phoneNumber = phone_numbers?.[0]?.phone_number;
    
    if (!email) {
      return new NextResponse("Missing email address", { status: 400 });
    }

    try {
      // Create the user in the database with default role
      const newUser = await db.user.create({
        data: {
          clerkId: id,
          email: email,
          firstName: first_name || "Unknown",
          lastName: last_name || "User",
          avatar: image_url,
          phone: phoneNumber,
          role: UserRole.STUDENT, // Default role, can be changed later
        },
      });

      return NextResponse.json({ message: "User created successfully", user: newUser });
    } catch (error) {
      console.error("Error creating user:", error);
      return new NextResponse("Error creating user", { status: 500 });
    }
  }

  if (eventType === "user.updated") {
    const { id, email_addresses, first_name, last_name, image_url, phone_numbers } = evt.data;
    
    const email = email_addresses?.[0]?.email_address;
    const phoneNumber = phone_numbers?.[0]?.phone_number;
    
    try {
      // Update the user in the database
      const updatedUser = await db.user.update({
        where: { clerkId: id },
        data: {
          ...(email && { email }),
          ...(first_name && { firstName: first_name }),
          ...(last_name && { lastName: last_name }),
          ...(image_url && { avatar: image_url }),
          ...(phoneNumber && { phone: phoneNumber }),
        },
      });

      return NextResponse.json({ message: "User updated successfully", user: updatedUser });
    } catch (error) {
      console.error("Error updating user:", error);
      return new NextResponse("Error updating user", { status: 500 });
    }
  }

  if (eventType === "user.deleted") {
    const { id } = evt.data;
    
    try {
      // Delete the user from the database
      await db.user.delete({
        where: { clerkId: id },
      });

      return NextResponse.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      return new NextResponse("Error deleting user", { status: 500 });
    }
  }

  return NextResponse.json({ message: "Webhook received", eventType });
}
