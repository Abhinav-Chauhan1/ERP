import { PrismaClient, MessageType } from "@prisma/client";

const prisma = new PrismaClient();

async function seedPromotionAlumniTemplates() {
  console.log("Seeding promotion and alumni message templates...");

  // Get or create an admin user for the templates
  const adminUser = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (!adminUser) {
    console.log("No admin user found. Skipping template seeding.");
    return;
  }

  const templates = [
    {
      name: "Student Promotion Notification",
      description: "Notify students and parents about successful promotion to next class",
      type: MessageType.BOTH,
      category: "Promotion",
      subject: "Promotion Notification - {{studentName}}",
      body: `Dear {{parentName}},

Congratulations! We are pleased to inform you that {{studentName}} has been successfully promoted to {{targetClass}} {{targetSection}} for the academic year {{targetAcademicYear}}.

Previous Class: {{sourceClass}} {{sourceSection}}
New Class: {{targetClass}} {{targetSection}}
Academic Year: {{targetAcademicYear}}
Roll Number: {{rollNumber}}

The new academic session will begin on {{sessionStartDate}}. Please ensure {{studentName}} reports to the new class on the first day.

We look forward to {{studentName}}'s continued success in the upcoming academic year.

Best regards,
{{schoolName}}
{{schoolPhone}}`,
      variables: JSON.stringify([
        "parentName",
        "studentName",
        "sourceClass",
        "sourceSection",
        "targetClass",
        "targetSection",
        "targetAcademicYear",
        "rollNumber",
        "sessionStartDate",
        "schoolName",
        "schoolPhone",
      ]),
      isActive: true,
      isDefault: true,
      createdBy: adminUser.id,
    },
    {
      name: "Graduation Ceremony Notification",
      description: "Notify students and parents about graduation ceremony details",
      type: MessageType.EMAIL,
      category: "Graduation",
      subject: "Graduation Ceremony Invitation - {{studentName}}",
      body: `Dear {{parentName}} and {{studentName}},

Congratulations on completing your academic journey at {{schoolName}}!

We are delighted to invite you to the Graduation Ceremony:

Date: {{ceremonyDate}}
Time: {{ceremonyTime}}
Venue: {{ceremonyVenue}}
Chief Guest: {{chiefGuest}}

Graduation Details:
Student Name: {{studentName}}
Final Class: {{finalClass}} {{finalSection}}
Graduation Date: {{graduationDate}}

Please arrive 30 minutes before the ceremony begins. Graduates should wear formal attire. Each graduate is allowed to bring up to 4 family members.

Certificates and awards will be distributed during the ceremony. Light refreshments will be served after the event.

We are proud of {{studentName}}'s achievements and look forward to celebrating this milestone together.

Best wishes for a bright future!

Warm regards,
{{schoolName}}
{{schoolPhone}}
{{schoolEmail}}`,
      variables: JSON.stringify([
        "parentName",
        "studentName",
        "ceremonyDate",
        "ceremonyTime",
        "ceremonyVenue",
        "chiefGuest",
        "finalClass",
        "finalSection",
        "graduationDate",
        "schoolName",
        "schoolPhone",
        "schoolEmail",
      ]),
      isActive: true,
      isDefault: true,
      createdBy: adminUser.id,
    },
    {
      name: "Graduation Congratulations",
      description: "Send congratulatory message to graduated students",
      type: MessageType.BOTH,
      category: "Graduation",
      subject: "Congratulations on Your Graduation! - {{schoolName}}",
      body: `Dear {{studentName}},

Congratulations on your graduation from {{schoolName}}!

We are incredibly proud of your achievements and the dedication you have shown throughout your academic journey. Your hard work, perseverance, and commitment have brought you to this significant milestone.

Graduation Details:
Final Class: {{finalClass}} {{finalSection}}
Graduation Date: {{graduationDate}}
Academic Year: {{academicYear}}

As you embark on the next chapter of your life, remember that you will always be a valued member of the {{schoolName}} family. We wish you success in all your future endeavors.

Stay connected with us through our alumni portal and continue to be part of our growing community.

Once again, congratulations and best wishes for a bright future!

With pride and best wishes,
{{schoolName}}
{{schoolPhone}}
{{schoolEmail}}`,
      variables: JSON.stringify([
        "studentName",
        "finalClass",
        "finalSection",
        "graduationDate",
        "academicYear",
        "schoolName",
        "schoolPhone",
        "schoolEmail",
      ]),
      isActive: true,
      isDefault: true,
      createdBy: adminUser.id,
    },
    {
      name: "Alumni Welcome Message",
      description: "Welcome message for newly created alumni profiles",
      type: MessageType.EMAIL,
      category: "Alumni",
      subject: "Welcome to {{schoolName}} Alumni Network",
      body: `Dear {{alumniName}},

Welcome to the {{schoolName}} Alumni Network!

We are delighted to have you as part of our growing alumni community. Your alumni profile has been created, and you now have access to exclusive alumni benefits and services.

Your Alumni Details:
Graduation Year: {{graduationYear}}
Final Class: {{finalClass}}
Admission ID: {{admissionId}}

Alumni Portal Access:
You can now log in to the alumni portal using your existing credentials. Through the portal, you can:
- Update your current occupation and contact information
- Connect with fellow alumni
- Stay informed about school news and events
- Access your academic records and certificates
- Participate in alumni events and reunions

Alumni Portal: {{portalUrl}}

We encourage you to keep your profile updated so we can stay connected and celebrate your achievements. Your success stories inspire our current students and strengthen our alumni community.

If you have any questions or need assistance accessing the portal, please don't hesitate to contact us.

Welcome aboard, and we look forward to staying connected!

Best regards,
Alumni Relations Team
{{schoolName}}
{{schoolPhone}}
{{schoolEmail}}`,
      variables: JSON.stringify([
        "alumniName",
        "graduationYear",
        "finalClass",
        "admissionId",
        "portalUrl",
        "schoolName",
        "schoolPhone",
        "schoolEmail",
      ]),
      isActive: true,
      isDefault: true,
      createdBy: adminUser.id,
    },
    {
      name: "Alumni Event Invitation",
      description: "Invite alumni to school events and reunions",
      type: MessageType.EMAIL,
      category: "Alumni",
      subject: "Alumni Event Invitation - {{eventName}}",
      body: `Dear {{alumniName}},

We hope this message finds you well!

We are excited to invite you to an upcoming alumni event:

Event: {{eventName}}
Date: {{eventDate}}
Time: {{eventTime}}
Venue: {{eventVenue}}

{{eventDescription}}

This is a wonderful opportunity to reconnect with your classmates, meet fellow alumni, and revisit your alma mater. We would love to hear about your journey since graduation and celebrate your achievements.

RSVP Details:
Please confirm your attendance by {{rsvpDeadline}}
RSVP Link: {{rsvpLink}}
Contact: {{contactPerson}} - {{contactPhone}}

We look forward to seeing you at the event!

Best regards,
Alumni Relations Team
{{schoolName}}
{{schoolPhone}}
{{schoolEmail}}`,
      variables: JSON.stringify([
        "alumniName",
        "eventName",
        "eventDate",
        "eventTime",
        "eventVenue",
        "eventDescription",
        "rsvpDeadline",
        "rsvpLink",
        "contactPerson",
        "contactPhone",
        "schoolName",
        "schoolPhone",
        "schoolEmail",
      ]),
      isActive: true,
      isDefault: true,
      createdBy: adminUser.id,
    },
    {
      name: "Alumni Profile Update Reminder",
      description: "Remind alumni to update their profile information",
      type: MessageType.EMAIL,
      category: "Alumni",
      subject: "Update Your Alumni Profile - {{schoolName}}",
      body: `Dear {{alumniName}},

We hope you are doing well!

We noticed that your alumni profile hasn't been updated recently. Keeping your profile current helps us:
- Stay connected with you
- Share relevant opportunities and news
- Celebrate your achievements
- Build a stronger alumni network

Your Current Profile:
Last Updated: {{lastUpdated}}
Graduation Year: {{graduationYear}}
Current Occupation: {{currentOccupation}}

Please take a few minutes to update your profile with:
- Current occupation and employer
- Contact information
- Higher education details
- Recent achievements and awards
- Professional profile links (LinkedIn, etc.)

Update Your Profile: {{profileUrl}}

Your updated information helps us maintain an accurate alumni directory and enables better networking opportunities within our community.

Thank you for staying connected!

Best regards,
Alumni Relations Team
{{schoolName}}
{{schoolEmail}}`,
      variables: JSON.stringify([
        "alumniName",
        "lastUpdated",
        "graduationYear",
        "currentOccupation",
        "profileUrl",
        "schoolName",
        "schoolEmail",
      ]),
      isActive: true,
      isDefault: true,
      createdBy: adminUser.id,
    },
  ];

  let createdCount = 0;
  let skippedCount = 0;

  for (const template of templates) {
    try {
      // Check if template already exists
      const existing = await prisma.messageTemplate.findUnique({
        where: { name: template.name },
      });

      if (existing) {
        console.log(`✓ Template "${template.name}" already exists, skipping...`);
        skippedCount++;
        continue;
      }

      await prisma.messageTemplate.create({
        data: template,
      });

      console.log(`✓ Created template: ${template.name}`);
      createdCount++;
    } catch (error) {
      console.error(`✗ Error creating template "${template.name}":`, error);
    }
  }

  console.log(`\n✅ Template seeding completed!`);
  console.log(`   Created: ${createdCount} templates`);
  console.log(`   Skipped: ${skippedCount} templates (already exist)`);
}

seedPromotionAlumniTemplates()
  .catch((e) => {
    console.error("Error seeding promotion and alumni templates:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
