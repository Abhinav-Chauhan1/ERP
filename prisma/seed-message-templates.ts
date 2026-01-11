import { PrismaClient, MessageType } from "@prisma/client";

const prisma = new PrismaClient();

async function seedMessageTemplates() {
  console.log("Seeding message templates...");

  // Get or create an admin user for the templates
  const adminUser = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (!adminUser) {
    console.log("No admin user found. Skipping message template seeding.");
    return;
  }

  const templates = [
    {
      name: "Fee Payment Reminder",
      description: "Remind parents about pending fee payments",
      type: MessageType.BOTH,
      category: "Fees",
      subject: "Fee Payment Reminder - {{schoolName}}",
      body: `Dear {{parentName}},

This is a friendly reminder that the fee payment for {{studentName}} ({{className}}) is due on {{dueDate}}.

Amount Due: {{feeAmount}}
Outstanding Balance: {{balance}}

Please make the payment at your earliest convenience to avoid any late fees.

Thank you,
{{schoolName}}`,
      variables: JSON.stringify([
        "parentName",
        "studentName",
        "className",
        "dueDate",
        "feeAmount",
        "balance",
        "schoolName",
      ]),
      isActive: true,
      isDefault: true,
      createdBy: adminUser.id,
    },
    {
      name: "Attendance Alert",
      description: "Notify parents about student absence",
      type: MessageType.SMS,
      category: "Attendance",
      subject: null,
      body: `Dear {{parentName}}, {{studentName}} was marked absent on {{attendanceDate}}. If this is unexpected, please contact the school. - {{schoolName}}`,
      variables: JSON.stringify([
        "parentName",
        "studentName",
        "attendanceDate",
        "schoolName",
      ]),
      isActive: true,
      isDefault: true,
      createdBy: adminUser.id,
    },
    {
      name: "Exam Schedule Notification",
      description: "Inform students about upcoming exams",
      type: MessageType.EMAIL,
      category: "Exams",
      subject: "Upcoming Exam Schedule - {{examName}}",
      body: `Dear {{studentName}},

This is to inform you about the upcoming {{examName}} scheduled on {{examDate}} at {{examTime}}.

Subject: {{subject}}
Duration: 2 hours
Venue: School Examination Hall

Please arrive 15 minutes before the exam starts and bring your admit card.

Best wishes for your preparation!

{{schoolName}}`,
      variables: JSON.stringify([
        "studentName",
        "examName",
        "examDate",
        "examTime",
        "subject",
        "schoolName",
      ]),
      isActive: true,
      isDefault: true,
      createdBy: adminUser.id,
    },
    {
      name: "Admission Confirmation",
      description: "Confirm admission application submission",
      type: MessageType.EMAIL,
      category: "Admission",
      subject: "Admission Application Received - {{schoolName}}",
      body: `Dear {{parentName}},

Thank you for submitting the admission application for {{studentName}}.

Your Application Number: {{applicationNumber}}
Applied Class: {{className}}
Submission Date: {{date}}

We have received your application and all required documents. Our admissions team will review your application and contact you within 7-10 business days.

You can track your application status using the application number provided above.

If you have any questions, please feel free to contact our admissions office.

Best regards,
Admissions Team
{{schoolName}}
{{schoolPhone}}
{{schoolEmail}}`,
      variables: JSON.stringify([
        "parentName",
        "studentName",
        "applicationNumber",
        "className",
        "date",
        "schoolName",
        "schoolPhone",
        "schoolEmail",
      ]),
      isActive: true,
      isDefault: true,
      createdBy: adminUser.id,
    },
    {
      name: "Parent Meeting Reminder",
      description: "Remind parents about scheduled meetings",
      type: MessageType.BOTH,
      category: "Meetings",
      subject: "Parent-Teacher Meeting Reminder",
      body: `Dear {{parentName}},

This is a reminder about your scheduled meeting with {{teacherName}} regarding {{studentName}}'s progress.

Date: {{date}}
Time: {{time}}
Venue: {{schoolName}}

Please arrive on time. If you need to reschedule, please contact us at least 24 hours in advance.

Looking forward to meeting you.

Best regards,
{{schoolName}}`,
      variables: JSON.stringify([
        "parentName",
        "teacherName",
        "studentName",
        "date",
        "time",
        "schoolName",
      ]),
      isActive: true,
      isDefault: true,
      createdBy: adminUser.id,
    },
    {
      name: "Event Announcement",
      description: "Announce school events to parents and students",
      type: MessageType.EMAIL,
      category: "Events",
      subject: "Upcoming Event: {{eventName}}",
      body: `Dear Parents and Students,

We are excited to announce an upcoming event at {{schoolName}}!

Event: {{eventName}}
Date: {{date}}
Time: {{time}}
Venue: {{schoolAddress}}

{{eventDescription}}

We encourage all students to participate. For more details, please contact the school office.

Best regards,
{{schoolName}}`,
      variables: JSON.stringify([
        "eventName",
        "date",
        "time",
        "schoolName",
        "schoolAddress",
        "eventDescription",
      ]),
      isActive: true,
      isDefault: true,
      createdBy: adminUser.id,
    },
    {
      name: "Exam Results Published",
      description: "Notify students that exam results are available",
      type: MessageType.BOTH,
      category: "Exams",
      subject: "{{examName}} Results Published",
      body: `Dear {{studentName}},

Your {{examName}} results have been published.

Subject: {{subject}}
Marks Obtained: {{marks}}/{{totalMarks}}
Grade: {{grade}}

You can view your detailed results by logging into the student portal.

Keep up the good work!

{{schoolName}}`,
      variables: JSON.stringify([
        "studentName",
        "examName",
        "subject",
        "marks",
        "totalMarks",
        "grade",
        "schoolName",
      ]),
      isActive: true,
      isDefault: true,
      createdBy: adminUser.id,
    },
    {
      name: "Low Attendance Warning",
      description: "Warn parents about low attendance percentage",
      type: MessageType.EMAIL,
      category: "Attendance",
      subject: "Attendance Alert - {{studentName}}",
      body: `Dear {{parentName}},

This is to inform you that {{studentName}}'s attendance has fallen below the required threshold.

Current Attendance: {{attendancePercentage}}%
Required Minimum: 75%

Regular attendance is crucial for academic success. We request you to ensure {{studentName}} attends school regularly.

If there are any concerns or issues affecting attendance, please contact us so we can work together to address them.

Best regards,
{{schoolName}}
{{schoolPhone}}`,
      variables: JSON.stringify([
        "parentName",
        "studentName",
        "attendancePercentage",
        "schoolName",
        "schoolPhone",
      ]),
      isActive: true,
      isDefault: true,
      createdBy: adminUser.id,
    },
    // Promotion and Alumni Templates
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

  for (const template of templates) {
    try {
      // Check if template already exists
      const existing = await prisma.messageTemplate.findUnique({
        where: { name: template.name },
      });

      if (existing) {
        console.log(`Template "${template.name}" already exists, skipping...`);
        continue;
      }

      await prisma.messageTemplate.create({
        data: template,
      });

      console.log(`Created template: ${template.name}`);
    } catch (error) {
      console.error(`Error creating template "${template.name}":`, error);
    }
  }

  console.log("Message template seeding completed!");
}

seedMessageTemplates()
  .catch((e) => {
    console.error("Error seeding message templates:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
