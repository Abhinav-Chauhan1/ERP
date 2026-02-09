# API Reference

## Overview

SikshaMitra ERP provides RESTful APIs and Server Actions for all system operations. All APIs require authentication and follow consistent patterns for requests and responses.

## Authentication

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "role": "ADMIN",
    "name": "John Doe"
  },
  "token": "jwt_token"
}
```

### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "password123",
  "name": "New User",
  "role": "STUDENT"
}
```

### Two-Factor Authentication
```http
POST /api/auth/2fa/verify
Content-Type: application/json

{
  "userId": "user_id",
  "code": "123456"
}
```

## User Management

### Get Users
```http
GET /api/users?role=STUDENT&page=1&limit=20
Authorization: Bearer {token}
```

### Create User
```http
POST /api/users
Authorization: Bearer {token}
Content-Type: application/json

{
  "email": "student@example.com",
  "name": "Student Name",
  "role": "STUDENT",
  "phone": "+911234567890"
}
```

### Update User
```http
PUT /api/users/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Updated Name",
  "phone": "+919876543210"
}
```

### Delete User
```http
DELETE /api/users/{id}
Authorization: Bearer {token}
```

## Academic Management

### Classes

#### Get Classes
```http
GET /api/academic/classes?academicYearId={id}
Authorization: Bearer {token}
```

#### Create Class
```http
POST /api/academic/classes
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Grade 10",
  "academicYearId": "year_id",
  "sections": [
    { "name": "A", "capacity": 40 },
    { "name": "B", "capacity": 40 }
  ]
}
```

### Subjects

#### Get Subjects
```http
GET /api/academic/subjects
Authorization: Bearer {token}
```

#### Create Subject
```http
POST /api/academic/subjects
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Mathematics",
  "code": "MATH101",
  "departmentId": "dept_id"
}
```

### Timetable

#### Get Timetable
```http
GET /api/academic/timetable?classId={id}&sectionId={id}
Authorization: Bearer {token}
```

#### Create Timetable
```http
POST /api/academic/timetable
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Term 1 Timetable",
  "classId": "class_id",
  "sectionId": "section_id",
  "slots": [...]
}
```

## Examination

### Exams

#### Get Exams
```http
GET /api/exams?classId={id}&termId={id}
Authorization: Bearer {token}
```

#### Create Exam
```http
POST /api/exams
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Mid-term Exam",
  "examTypeId": "type_id",
  "subjectId": "subject_id",
  "classId": "class_id",
  "date": "2026-03-15T10:00:00Z",
  "totalMarks": 100,
  "passingMarks": 40
}
```

### Results

#### Get Results
```http
GET /api/exams/{examId}/results
Authorization: Bearer {token}
```

#### Submit Results
```http
POST /api/exams/{examId}/results
Authorization: Bearer {token}
Content-Type: application/json

{
  "results": [
    {
      "studentId": "student_id",
      "marksObtained": 85,
      "grade": "A",
      "remarks": "Excellent"
    }
  ]
}
```

### Online Exams

#### Create Online Exam
```http
POST /api/exams/online
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Physics Quiz",
  "subjectId": "subject_id",
  "classId": "class_id",
  "duration": 60,
  "totalMarks": 50,
  "startTime": "2026-03-20T10:00:00Z",
  "endTime": "2026-03-20T11:00:00Z",
  "questions": ["q1_id", "q2_id", "q3_id"]
}
```

#### Submit Exam Attempt
```http
POST /api/exams/online/{examId}/submit
Authorization: Bearer {token}
Content-Type: application/json

{
  "answers": {
    "q1_id": "answer1",
    "q2_id": "answer2"
  }
}
```

## Attendance

### Mark Attendance
```http
POST /api/attendance/students
Authorization: Bearer {token}
Content-Type: application/json

{
  "sectionId": "section_id",
  "date": "2026-02-09",
  "attendance": [
    { "studentId": "s1", "status": "PRESENT" },
    { "studentId": "s2", "status": "ABSENT" }
  ]
}
```

### Get Attendance Report
```http
GET /api/attendance/students/report?studentId={id}&startDate=2026-01-01&endDate=2026-01-31
Authorization: Bearer {token}
```

### Teacher Attendance
```http
POST /api/attendance/teachers
Authorization: Bearer {token}
Content-Type: application/json

{
  "teacherId": "teacher_id",
  "date": "2026-02-09",
  "status": "PRESENT"
}
```

## Finance

### Fee Structure

#### Get Fee Structures
```http
GET /api/finance/fee-structures?academicYearId={id}
Authorization: Bearer {token}
```

#### Create Fee Structure
```http
POST /api/finance/fee-structures
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Annual Fee 2026",
  "academicYearId": "year_id",
  "applicableClasses": "10,11,12",
  "validFrom": "2026-04-01",
  "items": [
    {
      "feeTypeId": "tuition_id",
      "amount": 50000,
      "dueDate": "2026-05-01"
    }
  ]
}
```

### Payments

#### Record Payment
```http
POST /api/finance/payments
Authorization: Bearer {token}
Content-Type: application/json

{
  "studentId": "student_id",
  "amount": 50000,
  "paymentMethod": "ONLINE",
  "transactionId": "txn_123456"
}
```

#### Get Payment History
```http
GET /api/finance/payments?studentId={id}
Authorization: Bearer {token}
```

### Scholarships

#### Create Scholarship
```http
POST /api/finance/scholarships
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Merit Scholarship",
  "amount": 10000,
  "criteria": "Top 10% students",
  "validFrom": "2026-04-01",
  "validTo": "2027-03-31"
}
```

## Communication

### Messages

#### Send Message
```http
POST /api/messages
Authorization: Bearer {token}
Content-Type: application/json

{
  "recipientId": "user_id",
  "subject": "Important Notice",
  "content": "Message content here",
  "attachments": ["file_url"]
}
```

#### Get Messages
```http
GET /api/messages?type=inbox&page=1&limit=20
Authorization: Bearer {token}
```

### Announcements

#### Create Announcement
```http
POST /api/announcements
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "School Holiday",
  "content": "School will be closed on...",
  "targetAudience": ["STUDENTS", "PARENTS"],
  "startDate": "2026-02-09",
  "endDate": "2026-02-15"
}
```

### Bulk Messaging

#### Send Bulk SMS
```http
POST /api/communication/bulk/sms
Authorization: Bearer {token}
Content-Type: application/json

{
  "recipients": ["student_id1", "student_id2"],
  "message": "Reminder: Exam on Monday",
  "templateId": "template_id"
}
```

#### Send Bulk Email
```http
POST /api/communication/bulk/email
Authorization: Bearer {token}
Content-Type: application/json

{
  "recipients": ["parent_id1", "parent_id2"],
  "subject": "Parent-Teacher Meeting",
  "body": "Email content here",
  "templateId": "template_id"
}
```

## Library

### Books

#### Get Books
```http
GET /api/library/books?category={category}&available=true
Authorization: Bearer {token}
```

#### Issue Book
```http
POST /api/library/books/issue
Authorization: Bearer {token}
Content-Type: application/json

{
  "bookId": "book_id",
  "studentId": "student_id",
  "dueDate": "2026-03-09"
}
```

#### Return Book
```http
POST /api/library/books/return
Authorization: Bearer {token}
Content-Type: application/json

{
  "issueId": "issue_id",
  "fine": 0
}
```

## Transport

### Routes

#### Get Routes
```http
GET /api/transport/routes
Authorization: Bearer {token}
```

#### Create Route
```http
POST /api/transport/routes
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Route A",
  "vehicleId": "vehicle_id",
  "fee": 5000,
  "stops": [
    { "name": "Stop 1", "sequence": 1, "arrivalTime": "07:00" },
    { "name": "Stop 2", "sequence": 2, "arrivalTime": "07:15" }
  ]
}
```

### Transport Attendance
```http
POST /api/transport/attendance
Authorization: Bearer {token}
Content-Type: application/json

{
  "routeId": "route_id",
  "date": "2026-02-09",
  "attendance": [
    { "studentId": "s1", "status": "PRESENT", "stopId": "stop1" }
  ]
}
```

## Hostel

### Rooms

#### Get Available Rooms
```http
GET /api/hostel/rooms?hostelId={id}&status=AVAILABLE
Authorization: Bearer {token}
```

#### Allocate Room
```http
POST /api/hostel/rooms/allocate
Authorization: Bearer {token}
Content-Type: application/json

{
  "roomId": "room_id",
  "studentId": "student_id",
  "bedNumber": "B1",
  "allocationDate": "2026-04-01"
}
```

### Complaints

#### Submit Complaint
```http
POST /api/hostel/complaints
Authorization: Bearer {token}
Content-Type: application/json

{
  "category": "ROOM_MAINTENANCE",
  "description": "AC not working",
  "priority": "HIGH"
}
```

## LMS

### Courses

#### Get Courses
```http
GET /api/lms/courses?classId={id}
Authorization: Bearer {token}
```

#### Enroll Student
```http
POST /api/lms/courses/{courseId}/enroll
Authorization: Bearer {token}
Content-Type: application/json

{
  "studentId": "student_id"
}
```

#### Update Progress
```http
POST /api/lms/lessons/{lessonId}/progress
Authorization: Bearer {token}
Content-Type: application/json

{
  "completed": true,
  "timeSpent": 1800
}
```

## Admission

### Applications

#### Submit Application
```http
POST /api/admission/applications
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "2010-05-15",
  "gender": "MALE",
  "email": "parent@example.com",
  "phone": "+911234567890",
  "classAppliedFor": "Grade 6"
}
```

#### Get Applications
```http
GET /api/admission/applications?status=SUBMITTED
Authorization: Bearer {token}
```

#### Update Application Status
```http
PUT /api/admission/applications/{id}/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "ACCEPTED",
  "remarks": "Accepted based on merit"
}
```

### Merit Lists

#### Generate Merit List
```http
POST /api/admission/merit-lists
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Grade 6 Merit List 2026",
  "classId": "class_id",
  "academicYearId": "year_id",
  "criteria": [
    { "field": "previousMarks", "weight": 0.7 },
    { "field": "entranceScore", "weight": 0.3 }
  ]
}
```

## Certificates

### Generate Certificate
```http
POST /api/certificates/generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "templateId": "template_id",
  "recipientId": "student_id",
  "recipientName": "John Doe",
  "data": {
    "course": "Mathematics",
    "grade": "A+",
    "date": "2026-02-09"
  }
}
```

### Verify Certificate
```http
GET /api/certificates/verify/{verificationCode}
```

## Reports

### Generate Report
```http
POST /api/reports/generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "reportType": "STUDENT_PERFORMANCE",
  "filters": {
    "classId": "class_id",
    "termId": "term_id"
  },
  "format": "PDF"
}
```

### Schedule Report
```http
POST /api/reports/schedule
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Monthly Attendance Report",
  "reportType": "ATTENDANCE",
  "frequency": "MONTHLY",
  "recipients": ["admin@school.com"],
  "format": "EXCEL"
}
```

## File Upload

### Upload File
```http
POST /api/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [binary data]
folder: "documents"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://storage.example.com/file.pdf",
    "publicId": "file_id",
    "format": "pdf",
    "size": 1024000
  }
}
```

## Super Admin APIs

### Schools

#### Get All Schools
```http
GET /api/super-admin/schools?status=ACTIVE&page=1&limit=20
Authorization: Bearer {token}
```

#### Create School
```http
POST /api/super-admin/schools
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "ABC School",
  "code": "ABC001",
  "subdomain": "abc-school",
  "email": "admin@abcschool.com",
  "phone": "+911234567890",
  "address": "123 School Street",
  "planId": "plan_id"
}
```

#### Suspend School
```http
POST /api/super-admin/schools/{id}/suspend
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "Payment overdue"
}
```

### Analytics

#### Get Dashboard Analytics
```http
GET /api/super-admin/analytics/dashboard
Authorization: Bearer {token}
```

#### Get Revenue Analytics
```http
GET /api/super-admin/analytics/revenue?startDate=2026-01-01&endDate=2026-12-31
Authorization: Bearer {token}
```

### Billing

#### Get Subscriptions
```http
GET /api/super-admin/billing/subscriptions?status=ACTIVE
Authorization: Bearer {token}
```

#### Process Payment
```http
POST /api/super-admin/billing/payments
Authorization: Bearer {token}
Content-Type: application/json

{
  "schoolId": "school_id",
  "amount": 50000,
  "planId": "plan_id"
}
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

## Rate Limiting

All APIs are rate-limited:
- **Authentication**: 3 requests per 5 minutes
- **Payment**: 5 requests per 10 seconds
- **File Upload**: 5 requests per minute
- **Messaging**: 10 requests per minute
- **General**: 30 requests per minute

Rate limit headers:
```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 25
X-RateLimit-Reset: 1707484800
```

## Error Codes

- `AUTH_REQUIRED`: Authentication required
- `INVALID_TOKEN`: Invalid or expired token
- `PERMISSION_DENIED`: Insufficient permissions
- `VALIDATION_ERROR`: Input validation failed
- `NOT_FOUND`: Resource not found
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `SERVER_ERROR`: Internal server error

---

**Last Updated**: February 2026  
**Version**: 2.0.0
