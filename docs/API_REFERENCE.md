# API Reference

Complete API documentation for SikshaMitra ERP. All APIs require authentication unless specified.

## Base URL
```
Production: https://yourdomain.com/api
Development: http://localhost:3000/api
```

## Authentication

All authenticated requests require a valid session token in cookies or Authorization header.

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name",
  "role": "STUDENT"
}
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message"
}
```

## Rate Limiting

- Authentication: 3 requests per 5 minutes
- Payment: 5 requests per 10 seconds
- File Upload: 5 requests per minute
- Messaging: 10 requests per minute
- General: 30 requests per minute

## Core APIs

### Users
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Students
- `GET /api/students` - List students
- `POST /api/students` - Create student
- `GET /api/students/:id` - Get student details
- `PUT /api/students/:id` - Update student

### Academic
- `GET /api/academic/classes` - List classes
- `POST /api/academic/classes` - Create class
- `GET /api/academic/subjects` - List subjects
- `GET /api/academic/timetable` - Get timetable

### Exams
- `GET /api/exams` - List exams
- `POST /api/exams` - Create exam
- `GET /api/exams/:id/results` - Get exam results
- `POST /api/exams/:id/results` - Submit results

### Attendance
- `POST /api/attendance/students` - Mark attendance
- `GET /api/attendance/students/report` - Get attendance report

### Finance
- `GET /api/finance/fee-structures` - List fee structures
- `POST /api/finance/payments` - Record payment
- `GET /api/finance/payments` - Get payment history

### Communication
- `POST /api/messages` - Send message
- `GET /api/messages` - Get messages
- `POST /api/announcements` - Create announcement
- `POST /api/communication/bulk/sms` - Send bulk SMS
- `POST /api/communication/bulk/email` - Send bulk email

### Library
- `GET /api/library/books` - List books
- `POST /api/library/books/issue` - Issue book
- `POST /api/library/books/return` - Return book

### Transport
- `GET /api/transport/routes` - List routes
- `POST /api/transport/routes` - Create route
- `POST /api/transport/attendance` - Mark transport attendance

### Super Admin
- `GET /api/super-admin/schools` - List all schools
- `POST /api/super-admin/schools` - Create school
- `GET /api/super-admin/analytics/dashboard` - Get analytics
- `GET /api/super-admin/billing/subscriptions` - Get subscriptions

## Error Codes

- `AUTH_REQUIRED` - Authentication required
- `INVALID_TOKEN` - Invalid or expired token
- `PERMISSION_DENIED` - Insufficient permissions
- `VALIDATION_ERROR` - Input validation failed
- `NOT_FOUND` - Resource not found
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `SERVER_ERROR` - Internal server error

---

**Last Updated**: February 2026  
**Version**: 2.0.0
