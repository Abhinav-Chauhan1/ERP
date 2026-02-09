# Mobile App API Reference

Complete API reference for the School ERP Mobile Application.

## Base Configuration

```
Base URL: https://your-school-erp.com/api
API Version: v1
Content-Type: application/json
Authentication: Bearer Token (Clerk JWT)
```

## Authentication Headers

All authenticated requests must include:
```
Authorization: Bearer <clerk_jwt_token>
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "timestamp": "2024-11-26T10:00:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": { ... }
  },
  "timestamp": "2024-11-26T10:00:00Z"
}
```

---

## Student Endpoints

### Dashboard

#### GET /api/student/dashboard
Get student dashboard overview with key metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "attendance": {
      "percentage": 92.5,
      "present": 185,
      "absent": 15,
      "total": 200
    },
    "pendingAssignments": 5,
    "upcomingExams": [
      {
        "id": "exam_123",
        "title": "Mathematics Mid-term",
        "subject": "Mathematics",
        "date": "2024-12-01T09:00:00Z",
        "duration": 120
      }
    ],
    "recentAnnouncements": [
      {
        "id": "ann_456",
        "title": "Sports Day",
        "content": "Annual sports day on Dec 15",
        "date": "2024-11-25T10:00:00Z"
      }
    ],
    "todaySchedule": [
      {
        "period": 1,
        "subject": "Mathematics",
        "teacher": "Mr. Smith",
        "room": "101",
        "startTime": "09:00",
        "endTime": "10:00"
      }
    ]
  }
}
```


### Timetable

#### GET /api/student/timetable
Get student's class timetable.

**Query Parameters:**
- `date` (optional): YYYY-MM-DD format, defaults to today
- `view` (optional): 'day' | 'week', defaults to 'day'

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2024-11-26",
    "schedule": [
      {
        "period": 1,
        "subject": "Mathematics",
        "subjectCode": "MATH101",
        "teacher": {
          "id": "teacher_123",
          "name": "Mr. John Smith",
          "avatar": "https://..."
        },
        "room": "Room 101",
        "startTime": "09:00",
        "endTime": "10:00",
        "type": "lecture"
      }
    ]
  }
}
```

### Assignments

#### GET /api/student/assignments
Get list of assignments.

**Query Parameters:**
- `status`: 'pending' | 'submitted' | 'graded' | 'all'
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `subjectId`: Filter by subject

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "assign_123",
      "title": "Algebra Problems Set 1",
      "subject": {
        "id": "sub_456",
        "name": "Mathematics",
        "code": "MATH101"
      },
      "description": "Solve problems 1-20 from chapter 5",
      "assignedDate": "2024-11-20T10:00:00Z",
      "dueDate": "2024-11-27T23:59:59Z",
      "totalMarks": 50,
      "attachments": ["https://..."],
      "status": "pending",
      "submission": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

#### POST /api/student/assignments/:id/submit
Submit an assignment.

**Request Body:**
```json
{
  "content": "My solution to the problems...",
  "attachments": [
    "https://cloudinary.com/..."
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "submissionId": "sub_789",
    "submittedAt": "2024-11-26T15:30:00Z",
    "status": "submitted"
  },
  "message": "Assignment submitted successfully"
}
```


### Attendance

#### GET /api/student/attendance
Get attendance records.

**Query Parameters:**
- `month`: Month number (1-12)
- `year`: Year (YYYY)

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalDays": 20,
      "present": 18,
      "absent": 2,
      "late": 0,
      "percentage": 90.0
    },
    "records": [
      {
        "date": "2024-11-01",
        "status": "PRESENT",
        "markedAt": "2024-11-01T09:05:00Z"
      },
      {
        "date": "2024-11-02",
        "status": "ABSENT",
        "reason": "Sick leave",
        "markedAt": "2024-11-02T09:05:00Z"
      }
    ],
    "subjectWise": [
      {
        "subject": "Mathematics",
        "present": 18,
        "total": 20,
        "percentage": 90.0
      }
    ]
  }
}
```

#### POST /api/student/leave-application
Apply for leave.

**Request Body:**
```json
{
  "fromDate": "2024-12-01",
  "toDate": "2024-12-03",
  "reason": "Family function",
  "attachments": ["https://cloudinary.com/medical-cert.pdf"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "applicationId": "leave_123",
    "status": "PENDING",
    "submittedAt": "2024-11-26T10:00:00Z"
  },
  "message": "Leave application submitted successfully"
}
```

### Exam Results

#### GET /api/student/exam-results
Get exam results.

**Query Parameters:**
- `termId` (optional): Filter by term
- `subjectId` (optional): Filter by subject

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "result_123",
      "exam": {
        "id": "exam_456",
        "title": "Mid-term Examination",
        "type": "Mid-term",
        "date": "2024-11-15"
      },
      "subject": {
        "id": "sub_789",
        "name": "Mathematics",
        "code": "MATH101"
      },
      "marks": 85,
      "totalMarks": 100,
      "grade": "A",
      "percentage": 85.0,
      "rank": 5,
      "classAverage": 72.5,
      "remarks": "Excellent performance"
    }
  ]
}
```


### Fees

#### GET /api/student/fees/overview
Get fee overview and payment status.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalFees": 50000,
    "paidAmount": 30000,
    "pendingAmount": 20000,
    "dueDate": "2024-12-31",
    "breakdown": [
      {
        "feeType": "Tuition Fee",
        "amount": 30000,
        "paid": 20000,
        "pending": 10000,
        "dueDate": "2024-12-31"
      },
      {
        "feeType": "Library Fee",
        "amount": 5000,
        "paid": 5000,
        "pending": 0,
        "dueDate": "2024-12-31"
      }
    ],
    "scholarships": [
      {
        "name": "Merit Scholarship",
        "amount": 5000,
        "status": "Active"
      }
    ]
  }
}
```

#### POST /api/student/fees/pay
Initiate fee payment.

**Request Body:**
```json
{
  "amount": 10000,
  "feeStructureId": "fee_123",
  "paymentMethod": "ONLINE_PAYMENT"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentId": "pay_456",
    "orderId": "order_789",
    "amount": 10000,
    "currency": "INR",
    "razorpayKey": "rzp_test_...",
    "status": "initiated"
  }
}
```

### Messages

#### GET /api/student/messages
Get messages.

**Query Parameters:**
- `type`: 'inbox' | 'sent'
- `page`: Page number
- `limit`: Items per page
- `unread`: true | false

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "msg_123",
      "subject": "Assignment Feedback",
      "content": "Great work on your assignment...",
      "sender": {
        "id": "user_456",
        "name": "Mr. John Smith",
        "role": "TEACHER",
        "avatar": "https://..."
      },
      "recipient": {
        "id": "user_789",
        "name": "Student Name"
      },
      "attachments": [],
      "isRead": false,
      "sentAt": "2024-11-26T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

#### POST /api/student/messages
Send a message.

**Request Body:**
```json
{
  "recipientId": "user_456",
  "subject": "Question about assignment",
  "content": "I have a question about problem 5...",
  "attachments": ["https://cloudinary.com/..."]
}
```

