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
