# Database Seeding Guide

This guide explains how to seed your database with sample data for the School ERP system.

## Prerequisites

1. Make sure your database is set up and the connection string is configured in `.env`
2. Run migrations to create the database schema:
   ```bash
   npx prisma migrate dev
   ```

## Installing Dependencies

First, install the required dependencies:

```bash
npm install
```

This will install `tsx` and `ts-node` which are needed to run the TypeScript seed file.

## Running the Seed

You can seed the database using either of these commands:

```bash
# Using npm script
npm run db:seed

# Or using Prisma directly
npx prisma db seed
```

## What Gets Seeded

The seed file creates comprehensive sample data including:

### System Configuration
- System settings with school information

### Academic Structure
- 1 Academic Year (2024-2025)
- 2 Terms (Fall & Spring Semester)
- 5 Departments (Math, Science, Languages, Social Studies, Arts)
- 2 Classes (Grade 10 & 11)
- 3 Sections
- 5 Subjects with teacher assignments

### Users
- **1 Administrator**: John Administrator (admin@springfieldhigh.edu)
- **5 Teachers**: Math, Physics, English, Chemistry, and History teachers
- **6 Students**: Enrolled in Grade 10 and 11
- **4 Parents**: Linked to students

### Academic Data
- Class enrollments for all students
- 3 Exam types (Mid-term, Final, Quiz)
- 3 Exams with results
- Grade scale (A+ to F)
- 3 Assignments with submissions
- Syllabus and lessons for Mathematics
- Report cards for students

### Attendance
- Student attendance records
- Teacher attendance records
- Leave applications

### Finance
- Fee types (Tuition, Library, Sports, Lab)
- Fee structure for 2024-2025
- Fee payments (completed, partial, pending)
- Scholarships and recipients
- Budget and expenses
- Payroll records for teachers

### Communication
- Messages between users
- Announcements
- Notifications
- Parent-teacher meetings scheduled

### Other
- Document types and documents
- Events (Sports Day, Science Fair)
- Event participants
- Classrooms
- User settings (Student & Parent preferences)

## Sample Login Credentials

After seeding, you can use these Clerk IDs to test different user roles:

### Admin
- Clerk ID: `clerk_admin_001`
- Email: admin@springfieldhigh.edu

### Teachers
- Clerk ID: `clerk_teacher_001` - Sarah Johnson (Math)
- Clerk ID: `clerk_teacher_002` - Michael Chen (Physics)
- Clerk ID: `clerk_teacher_003` - Emily Rodriguez (English)
- Clerk ID: `clerk_teacher_004` - David Williams (Chemistry)
- Clerk ID: `clerk_teacher_005` - Lisa Anderson (History)

### Students
- Clerk ID: `clerk_student_001` - Alex Smith (Grade 10A)
- Clerk ID: `clerk_student_002` - Emma Smith (Grade 10A)
- Clerk ID: `clerk_student_003` - Noah Brown (Grade 10B)
- Clerk ID: `clerk_student_004` - Sophia Garcia (Grade 10B)
- Clerk ID: `clerk_student_005` - Liam Johnson (Grade 11A)
- Clerk ID: `clerk_student_006` - Olivia Martinez (Grade 11A)

### Parents
- Clerk ID: `clerk_parent_001` - Robert Smith
- Clerk ID: `clerk_parent_002` - Jennifer Smith
- Clerk ID: `clerk_parent_003` - James Brown
- Clerk ID: `clerk_parent_004` - Maria Garcia

## Resetting the Database

To clear all data and reseed:

```bash
# Reset the database (WARNING: This deletes all data)
npx prisma migrate reset

# This will automatically run the seed after reset
```

## Troubleshooting

### Error: Cannot find module 'tsx'
Run `npm install` to install all dependencies.

### Error: Database connection failed
Check your `DATABASE_URL` in the `.env` file.

### Error: Unique constraint violation
The database might already have data. Use `npx prisma migrate reset` to start fresh.

## Customizing the Seed Data

You can modify `prisma/seed.ts` to:
- Add more users, classes, or subjects
- Change school information
- Adjust academic year dates
- Add custom data specific to your needs

After making changes, run the seed command again to apply them.
