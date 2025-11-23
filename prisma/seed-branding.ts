import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedBranding() {
  console.log("Seeding school branding...");

  // Check if branding already exists
  const existingBranding = await prisma.schoolBranding.findFirst({
    where: { isActive: true },
  });

  if (existingBranding) {
    console.log("Active branding already exists, skipping seed");
    return;
  }

  // Create default branding
  const branding = await prisma.schoolBranding.create({
    data: {
      schoolName: "Demo School",
      tagline: "Excellence in Education",
      primaryColor: "#3b82f6",
      secondaryColor: "#8b5cf6",
      address: "123 Education Street\nCity, State 12345",
      phone: "+1 (555) 123-4567",
      email: "info@demoschool.edu",
      website: "https://www.demoschool.edu",
      emailFooter: "This is an automated email from Demo School. Please do not reply to this email.",
      emailSignature: "Best regards,\nDemo School Administration",
      letterheadText: "Excellence in Education Since 2000",
      documentFooter: "Demo School - Empowering Future Leaders",
      isActive: true,
    },
  });

  console.log("Created default branding:", branding.schoolName);
}

seedBranding()
  .catch((e) => {
    console.error("Error seeding branding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
