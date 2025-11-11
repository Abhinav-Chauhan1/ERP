import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";

// Specify Node.js runtime for Prisma compatibility
export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    // Check if current user is admin
    const currentUser = await db.user.findUnique({
      where: { clerkId: userId }
    });
    
    if (!currentUser || currentUser.role !== UserRole.ADMIN) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    
    const { id } = await params;
    const user = await db.user.findUnique({
      where: { id }
    });
    
    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    // Check if current user is admin
    const currentUser = await db.user.findUnique({
      where: { clerkId: userId }
    });
    
    if (!currentUser || currentUser.role !== UserRole.ADMIN) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    
    const body = await req.json();
    const { role } = body;
    
    if (!Object.values(UserRole).includes(role)) {
      return new NextResponse("Invalid role", { status: 400 });
    }
    
    const user = await db.user.findUnique({
      where: { id: params.id }
    });
    
    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }
    
    // Update user role in database
    const updatedUser = await db.user.update({
      where: { id: params.id },
      data: { role }
    });
    
    // Update user role in Clerk
    const clerk = await clerkClient();
    await clerk.users.updateUser(user.clerkId, {
      publicMetadata: { role }
    });
    
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
