"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db as prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";

/**
 * Get the active school branding settings
 */
export async function getSchoolBranding() {
  try {
    const branding = await prisma.schoolBranding.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: branding };
  } catch (error) {
    console.error("Error fetching school branding:", error);
    return { success: false, error: "Failed to fetch school branding" };
  }
}

/**
 * Create or update school branding settings
 * Only admins can perform this action
 */
export async function upsertSchoolBranding(data: {
  schoolName: string;
  tagline?: string;
  logo?: string;
  favicon?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  emailLogo?: string;
  emailFooter?: string;
  emailSignature?: string;
  letterheadLogo?: string;
  letterheadText?: string;
  documentFooter?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  instagramUrl?: string;
}) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    });

    if (!user || user.role !== UserRole.ADMIN) {
      return { success: false, error: "Only administrators can update branding" };
    }

    // Deactivate all existing branding
    await prisma.schoolBranding.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Create new branding
    const branding = await prisma.schoolBranding.create({
      data: {
        ...data,
        isActive: true,
      },
    });

    // Revalidate all pages to reflect new branding
    revalidatePath("/", "layout");

    return { success: true, data: branding };
  } catch (error) {
    console.error("Error upserting school branding:", error);
    return { success: false, error: "Failed to update school branding" };
  }
}

/**
 * Update specific branding fields
 * Only admins can perform this action
 */
export async function updateSchoolBranding(
  id: string,
  data: Partial<{
    schoolName: string;
    tagline: string;
    logo: string;
    favicon: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    emailLogo: string;
    emailFooter: string;
    emailSignature: string;
    letterheadLogo: string;
    letterheadText: string;
    documentFooter: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    facebookUrl: string;
    twitterUrl: string;
    linkedinUrl: string;
    instagramUrl: string;
  }>
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    });

    if (!user || user.role !== UserRole.ADMIN) {
      return { success: false, error: "Only administrators can update branding" };
    }

    const branding = await prisma.schoolBranding.update({
      where: { id },
      data,
    });

    // Revalidate all pages to reflect new branding
    revalidatePath("/", "layout");

    return { success: true, data: branding };
  } catch (error) {
    console.error("Error updating school branding:", error);
    return { success: false, error: "Failed to update school branding" };
  }
}

/**
 * Delete school branding
 * Only admins can perform this action
 */
export async function deleteSchoolBranding(id: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    });

    if (!user || user.role !== UserRole.ADMIN) {
      return { success: false, error: "Only administrators can delete branding" };
    }

    await prisma.schoolBranding.delete({
      where: { id },
    });

    // Revalidate all pages
    revalidatePath("/", "layout");

    return { success: true };
  } catch (error) {
    console.error("Error deleting school branding:", error);
    return { success: false, error: "Failed to delete school branding" };
  }
}
