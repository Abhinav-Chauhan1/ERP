# School ERP Mobile Application Documentation

## Overview

This document provides comprehensive documentation for the mobile application designed for students and parents to access the School ERP system. The mobile app provides a native mobile experience with full feature parity to the web portal.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Features](#features)
4. [API Integration](#api-integration)
5. [Authentication & Security](#authentication--security)
6. [User Roles](#user-roles)
7. [Installation & Setup](#installation--setup)
8. [Development Guide](#development-guide)

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────┐
│           Mobile Application Layer              │
│  ┌──────────────┐        ┌──────────────┐      │
│  │   Student    │        │    Parent    │      │
│  │     App      │        │     App      │      │
│  └──────────────┘        └──────────────┘      │
└─────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│              API Gateway Layer                  │
│         (Next.js API Routes + REST)             │
└─────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│           Business Logic Layer                  │
│    (Server Actions + Service Layer)             │
└─────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│            Data Access Layer                    │
│         (Prisma ORM + PostgreSQL)               │
└─────────────────────────────────────────────────┘
```


## Technology Stack

### Mobile Framework Options

#### Option 1: React Native (Recommended)
- **Framework**: React Native with Expo
- **Language**: TypeScript
- **State Management**: React Query + Zustand
- **Navigation**: React Navigation
- **UI Components**: React Native Paper / NativeBase
- **Authentication**: Clerk React Native SDK
- **Push Notifications**: Expo Notifications
- **File Upload**: Expo Image Picker + Cloudinary
- **Offline Support**: React Query Persistence + AsyncStorage

**Advantages**:
- Code sharing with existing Next.js web app
- Large ecosystem and community
- Hot reload for faster development
- Single codebase for iOS and Android
- Expo managed workflow simplifies deployment

#### Option 2: Flutter
- **Framework**: Flutter
- **Language**: Dart
- **State Management**: Riverpod / Bloc
- **UI**: Material Design / Cupertino
- **Authentication**: Custom integration with Clerk
- **Push Notifications**: Firebase Cloud Messaging

**Advantages**:
- High performance
- Beautiful native UI
- Strong typing with Dart
- Growing ecosystem

### Backend Integration
- **API**: RESTful API endpoints (Next.js API routes)
- **Database**: PostgreSQL via Prisma ORM
- **Authentication**: Clerk (with mobile SDK support)
- **File Storage**: Cloudinary
- **Real-time**: WebSocket for notifications
- **Caching**: Redis (Upstash)


---

## Features

### Student App Features

#### 1. Dashboard
- **Overview Cards**
  - Today's schedule
  - Pending assignments
  - Upcoming exams
  - Attendance summary
  - Recent announcements
- **Quick Actions**
  - View timetable
  - Submit assignment
  - Check results
  - Pay fees

#### 2. Academics
- **Timetable**
  - Daily/weekly class schedule
  - Subject-wise schedule
  - Teacher information
  - Room numbers
- **Subjects**
  - Subject list with details
  - Syllabus access
  - Learning materials
  - Teacher contact
- **Curriculum**
  - Syllabus units
  - Lesson plans
  - Study materials
  - Video lectures (LMS integration)
- **Schedule**
  - Class timings
  - Break times
  - Special events

#### 3. Assessments
- **Assignments**
  - View assignments
  - Submit work (text/file upload)
  - Track submission status
  - View grades and feedback
  - Due date reminders
- **Exams**
  - Exam schedule
  - Exam details (date, time, venue)
  - Syllabus for exams
  - Online exam access
- **Results**
  - Exam results
  - Subject-wise marks
  - Grade analysis
  - Historical performance
- **Report Cards**
  - Term-wise report cards
  - Download PDF
  - Teacher remarks
  - Attendance summary

#### 4. Attendance
- **Overview**
  - Monthly attendance percentage
  - Subject-wise attendance
  - Attendance calendar view
  - Absent/present/late status
- **Leave Application**
  - Apply for leave
  - Upload supporting documents
  - Track application status
  - Leave history
- **Reports**
  - Attendance trends
  - Comparison with class average


#### 5. Communication
- **Messages**
  - Inbox/sent messages
  - Compose new message
  - Reply to messages
  - Attach files
  - Message search
- **Announcements**
  - School announcements
  - Class announcements
  - Important notices
  - Push notifications
- **Notifications**
  - Real-time notifications
  - Notification history
  - Notification preferences
  - Mark as read/unread

#### 6. Fees
- **Overview**
  - Total fees
  - Paid amount
  - Pending amount
  - Payment history
- **Payment**
  - Online payment integration (Razorpay)
  - Payment receipts
  - Download invoices
- **Due Fees**
  - Upcoming due dates
  - Overdue alerts
  - Payment reminders
- **Scholarships**
  - Applied scholarships
  - Scholarship status
  - Scholarship details

#### 7. Performance
- **Overview**
  - Overall performance metrics
  - GPA/percentage
  - Subject-wise performance
  - Performance trends
- **Subject Analysis**
  - Strengths and weaknesses
  - Improvement suggestions
  - Comparison with class average
- **Rank**
  - Class rank
  - Section rank
  - Historical rank trends
- **Trends**
  - Performance graphs
  - Progress over time
  - Predictive analytics

#### 8. LMS (Learning Management)
- **Courses**
  - Enrolled courses
  - Course materials
  - Video lectures
  - Course progress
- **Lessons**
  - Lesson viewer
  - Interactive content
  - Downloadable resources
- **Quizzes**
  - Online quizzes
  - Quiz attempts
  - Quiz results
  - Practice tests
- **Discussions**
  - Course discussions
  - Ask questions
  - Peer interaction


#### 9. Documents
- **Personal Documents**
  - ID card (digital)
  - Certificates
  - Transfer certificate
  - Character certificate
- **Academic Documents**
  - Report cards
  - Mark sheets
  - Attendance certificates
- **Policies**
  - School policies
  - Code of conduct
  - Rules and regulations

#### 10. Events
- **Upcoming Events**
  - School events
  - Sports events
  - Cultural activities
  - Holidays
- **Event Details**
  - Event information
  - Date, time, venue
  - RSVP functionality
  - Event reminders
- **Event History**
  - Past events
  - Event photos
  - Participation records

#### 11. Profile
- **Personal Information**
  - Student details
  - Contact information
  - Emergency contacts
  - Profile photo
- **Academic Information**
  - Class and section
  - Roll number
  - Admission details
  - Academic year
- **Parent Information**
  - Parent/guardian details
  - Contact information

#### 12. Settings
- **Notifications**
  - Push notification preferences
  - Email notifications
  - SMS notifications
  - Notification categories
- **Appearance**
  - Theme (Light/Dark/System)
  - Color theme
  - Language
  - Font size
- **Privacy**
  - Profile visibility
  - Data sharing preferences
- **Security**
  - Change password
  - Two-factor authentication
  - Biometric login
  - Session management
- **About**
  - App version
  - Terms of service
  - Privacy policy
  - Help & support


---

### Parent App Features

#### 1. Dashboard
- **Children Overview**
  - List of all children
  - Quick stats for each child
  - Switch between children
- **Summary Cards**
  - Attendance summary
  - Academic performance
  - Pending fees
  - Upcoming events
  - Recent announcements
- **Quick Actions**
  - View child's timetable
  - Check attendance
  - Pay fees
  - Contact teacher
  - Apply for leave

#### 2. Children Management
- **Child Selection**
  - Switch between multiple children
  - View individual profiles
- **Overview**
  - Academic performance
  - Attendance
  - Behavior reports
  - Health records
- **Comparison**
  - Compare performance between children
  - Comparative analytics
- **Progress Tracking**
  - Academic progress
  - Skill development
  - Extracurricular activities

#### 3. Academics
- **Timetable**
  - View child's schedule
  - Subject-wise timetable
  - Teacher information
- **Subjects**
  - Subject details
  - Syllabus
  - Learning materials
- **Homework**
  - Assigned homework
  - Submission status
  - Due dates
  - Teacher feedback
- **Curriculum**
  - Syllabus coverage
  - Learning objectives
  - Study materials

#### 4. Attendance
- **Overview**
  - Monthly attendance
  - Subject-wise attendance
  - Attendance trends
  - Alerts for low attendance
- **Calendar View**
  - Daily attendance status
  - Leave records
  - Holiday calendar
- **Leave Management**
  - Apply for leave on behalf of child
  - Upload medical certificates
  - Track leave applications
  - Leave balance


#### 5. Performance
- **Academic Results**
  - Exam results
  - Subject-wise marks
  - Grade analysis
  - Rank information
- **Report Cards**
  - Term-wise report cards
  - Download PDF
  - Teacher remarks
  - Principal comments
- **Progress Reports**
  - Performance trends
  - Improvement areas
  - Strengths analysis
  - Comparison with peers
- **Analytics**
  - Performance graphs
  - Subject-wise analysis
  - Historical data
  - Predictive insights

#### 6. Fees
- **Overview**
  - Total fees structure
  - Paid amount
  - Pending dues
  - Payment deadlines
- **Payment**
  - Online payment (Razorpay)
  - Multiple payment methods
  - Payment receipts
  - Transaction history
- **History**
  - Payment records
  - Download receipts
  - Fee structure details
- **Reminders**
  - Due date notifications
  - Overdue alerts
  - Payment confirmations

#### 7. Communication
- **Messages**
  - Inbox/sent messages
  - Compose to teachers/admin
  - Reply to messages
  - Attach documents
  - Message templates
- **Announcements**
  - School announcements
  - Class announcements
  - Important notices
  - Emergency alerts
- **Notifications**
  - Real-time notifications
  - Notification center
  - Notification preferences
  - Priority alerts

#### 8. Meetings
- **Schedule Meeting**
  - Request parent-teacher meeting
  - Select preferred time slots
  - Add meeting agenda
- **Upcoming Meetings**
  - Scheduled meetings
  - Meeting details
  - Join virtual meetings
  - Meeting reminders
- **Meeting History**
  - Past meetings
  - Meeting notes
  - Action items
  - Follow-up tasks


#### 9. Documents
- **Child Documents**
  - Birth certificate
  - ID card
  - Report cards
  - Certificates
  - Medical records
- **School Documents**
  - Admission documents
  - Fee receipts
  - Transfer certificates
  - Bonafide certificates
- **Policies**
  - School policies
  - Parent handbook
  - Code of conduct

#### 10. Events
- **School Events**
  - Upcoming events
  - Event calendar
  - Event details
  - RSVP for events
- **Event Participation**
  - Child's participation
  - Event photos
  - Certificates/awards
- **Event Reminders**
  - Push notifications
  - Calendar integration
  - Event updates

#### 11. Settings
- **Account Settings**
  - Profile information
  - Contact details
  - Emergency contacts
  - Update profile photo
- **Children Management**
  - Add/remove children
  - Update child information
  - Link multiple children
- **Notifications**
  - Push notifications
  - Email notifications
  - SMS notifications
  - Notification frequency (immediate/daily/weekly digest)
- **Communication Preferences**
  - Preferred contact method
  - Language preference
  - Time zone
- **Privacy**
  - Profile visibility
  - Data sharing
  - Privacy settings
- **Security**
  - Change password
  - Two-factor authentication
  - Biometric login
  - Active sessions
- **Appearance**
  - Theme (Light/Dark/System)
  - Color theme
  - Font size
  - Language


---

## API Integration

### API Architecture

The mobile app communicates with the backend through RESTful API endpoints built with Next.js API routes.

### Base URL
```
Production: https://your-school-erp.com/api
Development: http://localhost:3000/api
```

### Authentication

All API requests require authentication using Clerk JWT tokens.

**Headers:**
```
Authorization: Bearer <clerk_jwt_token>
Content-Type: application/json
```

### API Endpoints

#### Authentication APIs

```typescript
// Login
POST /api/auth/login
Body: { email: string, password: string }
Response: { token: string, user: User }

// Logout
POST /api/auth/logout
Response: { success: boolean }

// Refresh Token
POST /api/auth/refresh
Response: { token: string }

// Two-Factor Authentication
POST /api/auth/2fa/enable
POST /api/auth/2fa/verify
POST /api/auth/2fa/disable
```

#### Student APIs

```typescript
// Dashboard
GET /api/student/dashboard
Response: {
  attendance: AttendanceSummary,
  assignments: Assignment[],
  exams: Exam[],
  announcements: Announcement[]
}

// Profile
GET /api/student/profile
PUT /api/student/profile
Body: { firstName, lastName, phone, avatar, ... }

// Academics
GET /api/student/timetable?date=YYYY-MM-DD
GET /api/student/subjects
GET /api/student/syllabus/:subjectId
GET /api/student/lessons/:lessonId

// Assignments
GET /api/student/assignments?status=pending&page=1&limit=10
GET /api/student/assignments/:id
POST /api/student/assignments/:id/submit
Body: { content: string, attachments: string[] }

// Exams
GET /api/student/exams?upcoming=true
GET /api/student/exams/:id
GET /api/student/exam-results?termId=xxx

// Attendance
GET /api/student/attendance?month=1&year=2024
GET /api/student/attendance/summary
POST /api/student/leave-application
Body: { fromDate, toDate, reason, attachments }

// Fees
GET /api/student/fees/overview
GET /api/student/fees/payments
POST /api/student/fees/pay
Body: { amount, paymentMethod, feeStructureId }

// Messages
GET /api/student/messages?type=inbox&page=1
GET /api/student/messages/:id
POST /api/student/messages
Body: { recipientId, subject, content, attachments }

// Notifications
GET /api/student/notifications?unread=true
PUT /api/student/notifications/:id/read
DELETE /api/student/notifications/:id

// Documents
GET /api/student/documents
GET /api/student/documents/:id/download

// Events
GET /api/student/events?upcoming=true
POST /api/student/events/:id/rsvp
Body: { status: 'attending' | 'not_attending' }

// Settings
GET /api/student/settings
PUT /api/student/settings
Body: { notifications, appearance, privacy }
```


#### Parent APIs

```typescript
// Dashboard
GET /api/parent/dashboard
Response: {
  children: Child[],
  summary: ParentDashboardSummary
}

// Children
GET /api/parent/children
GET /api/parent/children/:id
GET /api/parent/children/:id/attendance
GET /api/parent/children/:id/performance
GET /api/parent/children/compare

// Academics
GET /api/parent/children/:id/timetable
GET /api/parent/children/:id/subjects
GET /api/parent/children/:id/homework
GET /api/parent/children/:id/syllabus/:subjectId

// Attendance
GET /api/parent/children/:id/attendance?month=1&year=2024
POST /api/parent/children/:id/leave-application
Body: { fromDate, toDate, reason, attachments }

// Performance
GET /api/parent/children/:id/results
GET /api/parent/children/:id/report-cards
GET /api/parent/children/:id/performance/trends

// Fees
GET /api/parent/children/:id/fees/overview
GET /api/parent/children/:id/fees/payments
POST /api/parent/children/:id/fees/pay
Body: { amount, paymentMethod, feeStructureId }

// Communication
GET /api/parent/messages
POST /api/parent/messages
Body: { recipientId, subject, content, childId }
GET /api/parent/announcements

// Meetings
GET /api/parent/meetings
POST /api/parent/meetings/request
Body: { teacherId, childId, preferredDates, agenda }
GET /api/parent/meetings/:id

// Documents
GET /api/parent/children/:id/documents
GET /api/parent/documents/:id/download

// Events
GET /api/parent/events
POST /api/parent/events/:id/rsvp
Body: { childId, status }

// Settings
GET /api/parent/settings
PUT /api/parent/settings
Body: { notifications, communication, appearance }
```

### API Response Format

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": { ... }
  }
}
```

### Pagination

For list endpoints, use pagination parameters:
```
?page=1&limit=20&sortBy=createdAt&order=desc
```

Response includes pagination metadata:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```


### Rate Limiting

API endpoints are rate-limited to prevent abuse:
- **Authentication**: 5 requests per minute
- **Read Operations**: 100 requests per minute
- **Write Operations**: 30 requests per minute
- **File Uploads**: 10 requests per minute

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

### Caching Strategy

- **Static Data**: Cache for 1 hour (timetable, subjects)
- **Dynamic Data**: Cache for 5 minutes (dashboard, notifications)
- **Real-time Data**: No caching (messages, live updates)

Use `Cache-Control` headers and implement client-side caching with React Query.

---

## Authentication & Security

### Clerk Integration

The mobile app uses Clerk for authentication, providing:
- Email/password authentication
- Social login (Google, Apple)
- Two-factor authentication
- Biometric authentication (Face ID, Touch ID)
- Session management

### Implementation (React Native)

```typescript
// Install Clerk React Native
npm install @clerk/clerk-expo

// App.tsx
import { ClerkProvider } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';

const tokenCache = {
  async getToken(key: string) {
    return SecureStore.getItemAsync(key);
  },
  async saveToken(key: string, value: string) {
    return SecureStore.setItemAsync(key, value);
  },
};

export default function App() {
  return (
    <ClerkProvider
      publishableKey={process.env.CLERK_PUBLISHABLE_KEY}
      tokenCache={tokenCache}
    >
      <AppNavigator />
    </ClerkProvider>
  );
}
```


### Security Best Practices

1. **Token Storage**: Store JWT tokens in secure storage (Keychain/Keystore)
2. **SSL Pinning**: Implement certificate pinning for API calls
3. **Biometric Authentication**: Support Face ID/Touch ID for quick access
4. **Session Management**: Auto-logout after inactivity
5. **Data Encryption**: Encrypt sensitive data at rest
6. **Secure Communication**: Use HTTPS for all API calls
7. **Input Validation**: Validate all user inputs
8. **Error Handling**: Don't expose sensitive information in errors

### Two-Factor Authentication

```typescript
// Enable 2FA
const enable2FA = async () => {
  const response = await fetch('/api/auth/2fa/enable', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  const { qrCode, secret } = await response.json();
  // Display QR code for user to scan
};

// Verify 2FA code
const verify2FA = async (code: string) => {
  const response = await fetch('/api/auth/2fa/verify', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  });
  return response.json();
};
```

---

## User Roles

### Student Role
- Access to personal academic information
- View and submit assignments
- Check attendance and results
- Communicate with teachers
- Pay fees online
- Access learning materials

### Parent Role
- Monitor multiple children
- View children's academic performance
- Track attendance
- Communicate with teachers and admin
- Pay fees for children
- Schedule parent-teacher meetings
- Receive notifications about children

### Role-Based Access Control

```typescript
// Check user role
const checkRole = (user: User, requiredRole: UserRole) => {
  return user.role === requiredRole;
};

// Protect routes
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user } = useAuth();
  
  if (!user || user.role !== requiredRole) {
    return <Navigate to="/unauthorized" />;
  }
  
  return children;
};
```


---

## Installation & Setup

### Prerequisites

- Node.js 18+ and npm/yarn
- React Native development environment
- Expo CLI (for Expo projects)
- iOS: Xcode 14+ and CocoaPods
- Android: Android Studio and JDK 11+
- Clerk account for authentication
- Cloudinary account for file uploads

### Project Setup (React Native with Expo)

```bash
# Create new Expo project
npx create-expo-app school-erp-mobile --template

# Navigate to project
cd school-erp-mobile

# Install dependencies
npm install @clerk/clerk-expo
npm install @tanstack/react-query
npm install @react-navigation/native
npm install @react-navigation/native-stack
npm install @react-navigation/bottom-tabs
npm install react-native-paper
npm install zustand
npm install axios
npm install date-fns
npm install react-hook-form
npm install zod
npm install expo-image-picker
npm install expo-document-picker
npm install expo-notifications
npm install expo-secure-store
npm install expo-file-system
npm install react-native-pdf
npm install react-native-chart-kit
npm install @react-native-async-storage/async-storage

# Install Expo dependencies
npx expo install expo-dev-client
```

### Environment Configuration

Create `.env` file:
```env
# API Configuration
API_BASE_URL=https://your-school-erp.com/api
API_TIMEOUT=30000

# Clerk Configuration
CLERK_PUBLISHABLE_KEY=pk_test_xxxxx

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_UPLOAD_PRESET=your-preset

# App Configuration
APP_NAME=School ERP
APP_VERSION=1.0.0
```


### Project Structure

```
school-erp-mobile/
├── src/
│   ├── api/                    # API client and endpoints
│   │   ├── client.ts
│   │   ├── auth.ts
│   │   ├── student.ts
│   │   └── parent.ts
│   ├── components/             # Reusable components
│   │   ├── common/
│   │   ├── student/
│   │   └── parent/
│   ├── screens/                # Screen components
│   │   ├── auth/
│   │   ├── student/
│   │   └── parent/
│   ├── navigation/             # Navigation configuration
│   │   ├── AppNavigator.tsx
│   │   ├── StudentNavigator.tsx
│   │   └── ParentNavigator.tsx
│   ├── hooks/                  # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useStudent.ts
│   │   └── useParent.ts
│   ├── store/                  # State management (Zustand)
│   │   ├── authStore.ts
│   │   ├── studentStore.ts
│   │   └── parentStore.ts
│   ├── utils/                  # Utility functions
│   │   ├── date.ts
│   │   ├── validation.ts
│   │   └── formatting.ts
│   ├── types/                  # TypeScript types
│   │   ├── api.ts
│   │   ├── student.ts
│   │   └── parent.ts
│   ├── constants/              # Constants
│   │   ├── colors.ts
│   │   ├── routes.ts
│   │   └── config.ts
│   └── services/               # Services
│       ├── notification.ts
│       ├── storage.ts
│       └── analytics.ts
├── assets/                     # Images, fonts, etc.
├── app.json                    # Expo configuration
├── package.json
└── tsconfig.json
```

### Running the App

```bash
# Start development server
npx expo start

# Run on iOS simulator
npx expo run:ios

# Run on Android emulator
npx expo run:android

# Run on physical device
# Scan QR code with Expo Go app
```


---

## Development Guide

### API Client Setup

```typescript
// src/api/client.ts
import axios from 'axios';
import { useAuth } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.API_BASE_URL;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('clerk_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle token expiration
      await AsyncStorage.removeItem('clerk_token');
      // Navigate to login
    }
    return Promise.reject(error);
  }
);
```

### React Query Setup

```typescript
// src/api/queryClient.ts
import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

// App.tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';

export default function App() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister }}
    >
      <AppNavigator />
    </PersistQueryClientProvider>
  );
}
```


### Custom Hooks Examples

```typescript
// src/hooks/useStudent.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/api/client';

export const useStudentDashboard = () => {
  return useQuery({
    queryKey: ['student', 'dashboard'],
    queryFn: async () => {
      const response = await apiClient.get('/student/dashboard');
      return response.data;
    },
  });
};

export const useStudentAttendance = (month: number, year: number) => {
  return useQuery({
    queryKey: ['student', 'attendance', month, year],
    queryFn: async () => {
      const response = await apiClient.get(
        `/student/attendance?month=${month}&year=${year}`
      );
      return response.data;
    },
  });
};

export const useSubmitAssignment = () => {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiClient.post(`/student/assignments/${id}/submit`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['student', 'assignments']);
    },
  });
};

// src/hooks/useParent.ts
export const useParentChildren = () => {
  return useQuery({
    queryKey: ['parent', 'children'],
    queryFn: async () => {
      const response = await apiClient.get('/parent/children');
      return response.data;
    },
  });
};

export const useChildAttendance = (childId: string, month: number, year: number) => {
  return useQuery({
    queryKey: ['parent', 'child', childId, 'attendance', month, year],
    queryFn: async () => {
      const response = await apiClient.get(
        `/parent/children/${childId}/attendance?month=${month}&year=${year}`
      );
      return response.data;
    },
    enabled: !!childId,
  });
};
```


### Navigation Setup

```typescript
// src/navigation/AppNavigator.tsx
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '@clerk/clerk-expo';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { isSignedIn, user } = useAuth();

  if (!isSignedIn) {
    return <AuthNavigator />;
  }

  // Route based on user role
  if (user?.publicMetadata?.role === 'STUDENT') {
    return <StudentNavigator />;
  } else if (user?.publicMetadata?.role === 'PARENT') {
    return <ParentNavigator />;
  }

  return <UnauthorizedScreen />;
}

// src/navigation/StudentNavigator.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

export function StudentNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') iconName = 'home';
          else if (route.name === 'Academics') iconName = 'book';
          else if (route.name === 'Attendance') iconName = 'calendar';
          else if (route.name === 'Messages') iconName = 'mail';
          else if (route.name === 'Profile') iconName = 'person';
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Dashboard" component={StudentDashboard} />
      <Tab.Screen name="Academics" component={StudentAcademics} />
      <Tab.Screen name="Attendance" component={StudentAttendance} />
      <Tab.Screen name="Messages" component={StudentMessages} />
      <Tab.Screen name="Profile" component={StudentProfile} />
    </Tab.Navigator>
  );
}
```


### Push Notifications

```typescript
// src/services/notification.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications() {
  let token;

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }

    token = (await Notifications.getExpoPushTokenAsync()).data;
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
}

// Register token with backend
export async function savePushToken(token: string) {
  await apiClient.post('/notifications/register-device', {
    token,
    platform: Platform.OS,
  });
}

// Listen for notifications
export function useNotificationListener() {
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
      }
    );

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification tapped:', response);
        // Navigate to relevant screen
      }
    );

    return () => {
      subscription.remove();
      responseSubscription.remove();
    };
  }, []);
}
```


### File Upload (Cloudinary)

```typescript
// src/services/upload.ts
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

export async function pickImage() {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  
  if (status !== 'granted') {
    alert('Sorry, we need camera roll permissions!');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });

  if (!result.canceled) {
    return result.assets[0];
  }
  return null;
}

export async function pickDocument() {
  const result = await DocumentPicker.getDocumentAsync({
    type: '*/*',
    copyToCacheDirectory: true,
  });

  if (result.type === 'success') {
    return result;
  }
  return null;
}

export async function uploadToCloudinary(file: any) {
  const formData = new FormData();
  formData.append('file', {
    uri: file.uri,
    type: file.mimeType || 'image/jpeg',
    name: file.name || 'upload.jpg',
  } as any);
  formData.append('upload_preset', process.env.CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  const data = await response.json();
  return data.secure_url;
}

// Usage in component
const handleUpload = async () => {
  const image = await pickImage();
  if (image) {
    const url = await uploadToCloudinary(image);
    // Use the URL
  }
};
```


### Offline Support

```typescript
// src/utils/offline.ts
import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';

// Setup online manager
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected);
  });
});

// Custom hook for network status
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(!!state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  return isOnline;
}

// Offline indicator component
export function OfflineIndicator() {
  const isOnline = useNetworkStatus();

  if (isOnline) return null;

  return (
    <View style={styles.offlineContainer}>
      <Text style={styles.offlineText}>No Internet Connection</Text>
    </View>
  );
}

// Queue mutations for offline
export function useOfflineMutation() {
  const isOnline = useNetworkStatus();

  return useMutation({
    mutationFn: async (data) => {
      if (!isOnline) {
        // Queue the mutation
        await AsyncStorage.setItem(
          `offline_mutation_${Date.now()}`,
          JSON.stringify(data)
        );
        throw new Error('Queued for when online');
      }
      return apiClient.post('/endpoint', data);
    },
  });
}
```


### Theme Support

```typescript
// src/theme/theme.ts
import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { useColorScheme } from 'react-native';

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    background: '#ffffff',
    surface: '#f3f4f6',
    error: '#ef4444',
    text: '#1f2937',
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#60a5fa',
    secondary: '#a78bfa',
    background: '#111827',
    surface: '#1f2937',
    error: '#f87171',
    text: '#f9fafb',
  },
};

// Theme provider
export function ThemeProvider({ children }) {
  const colorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState(colorScheme);

  const theme = themeMode === 'dark' ? darkTheme : lightTheme;

  return (
    <PaperProvider theme={theme}>
      <ThemeContext.Provider value={{ themeMode, setThemeMode }}>
        {children}
      </ThemeContext.Provider>
    </PaperProvider>
  );
}

// Usage
const { themeMode, setThemeMode } = useTheme();
```

### Error Handling

```typescript
// src/utils/errorHandler.ts
export class AppError extends Error {
  constructor(
    public message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleApiError(error: any) {
  if (error.response) {
    // Server responded with error
    const { status, data } = error.response;
    
    if (status === 401) {
      return new AppError('Unauthorized', 'AUTH_ERROR', 401);
    } else if (status === 403) {
      return new AppError('Forbidden', 'PERMISSION_ERROR', 403);
    } else if (status === 404) {
      return new AppError('Not found', 'NOT_FOUND', 404);
    } else if (status >= 500) {
      return new AppError('Server error', 'SERVER_ERROR', status);
    }
    
    return new AppError(
      data.error?.message || 'An error occurred',
      data.error?.code || 'UNKNOWN_ERROR',
      status
    );
  } else if (error.request) {
    // Request made but no response
    return new AppError('Network error', 'NETWORK_ERROR');
  } else {
    // Something else happened
    return new AppError(error.message, 'UNKNOWN_ERROR');
  }
}

// Error boundary
export class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught:', error, errorInfo);
    // Log to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return <ErrorScreen error={this.state.error} />;
    }
    return this.props.children;
  }
}
```


### Testing

```typescript
// __tests__/StudentDashboard.test.tsx
import { render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import StudentDashboard from '@/screens/student/Dashboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

describe('StudentDashboard', () => {
  it('renders dashboard correctly', async () => {
    const { getByText } = render(<StudentDashboard />, { wrapper });
    
    await waitFor(() => {
      expect(getByText('Dashboard')).toBeTruthy();
    });
  });

  it('displays attendance summary', async () => {
    const { getByText } = render(<StudentDashboard />, { wrapper });
    
    await waitFor(() => {
      expect(getByText(/Attendance/i)).toBeTruthy();
    });
  });
});
```

### Performance Optimization

```typescript
// Memoization
const MemoizedComponent = React.memo(({ data }) => {
  return <View>{/* render data */}</View>;
});

// useMemo for expensive calculations
const sortedData = useMemo(() => {
  return data.sort((a, b) => a.date - b.date);
}, [data]);

// useCallback for functions
const handlePress = useCallback(() => {
  // handle press
}, [dependencies]);

// FlatList optimization
<FlatList
  data={items}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  initialNumToRender={10}
  maxToRenderPerBatch={10}
  windowSize={5}
  removeClippedSubviews={true}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>

// Image optimization
import { Image } from 'expo-image';

<Image
  source={{ uri: imageUrl }}
  contentFit="cover"
  transition={200}
  cachePolicy="memory-disk"
/>
```


---

## Deployment

### iOS Deployment

1. **Configure app.json**
```json
{
  "expo": {
    "name": "School ERP",
    "slug": "school-erp",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.yourschool.erp",
      "buildNumber": "1",
      "supportsTablet": true,
      "infoPlist": {
        "NSCameraUsageDescription": "Allow access to camera for profile photos",
        "NSPhotoLibraryUsageDescription": "Allow access to photos for uploads"
      }
    }
  }
}
```

2. **Build for iOS**
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build for iOS
eas build --platform ios

# Submit to App Store
eas submit --platform ios
```

### Android Deployment

1. **Configure app.json**
```json
{
  "expo": {
    "android": {
      "package": "com.yourschool.erp",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "NOTIFICATIONS"
      ]
    }
  }
}
```

2. **Build for Android**
```bash
# Build APK
eas build --platform android --profile preview

# Build AAB for Play Store
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android
```

### Over-the-Air (OTA) Updates

```bash
# Publish update
eas update --branch production --message "Bug fixes"

# Configure auto-updates in app.json
{
  "expo": {
    "updates": {
      "enabled": true,
      "checkAutomatically": "ON_LOAD",
      "fallbackToCacheTimeout": 0
    }
  }
}
```


---

## Additional Features

### Biometric Authentication

```typescript
import * as LocalAuthentication from 'expo-local-authentication';

export async function authenticateWithBiometrics() {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();

  if (!hasHardware || !isEnrolled) {
    return false;
  }

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Authenticate to access School ERP',
    fallbackLabel: 'Use passcode',
  });

  return result.success;
}
```

### Deep Linking

```typescript
// app.json
{
  "expo": {
    "scheme": "schoolerp",
    "ios": {
      "associatedDomains": ["applinks:your-school-erp.com"]
    },
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [
            {
              "scheme": "https",
              "host": "your-school-erp.com"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}

// Handle deep links
import * as Linking from 'expo-linking';

const linking = {
  prefixes: ['schoolerp://', 'https://your-school-erp.com'],
  config: {
    screens: {
      StudentDashboard: 'student/dashboard',
      Assignment: 'student/assignments/:id',
      ExamResult: 'student/results/:id',
    },
  },
};

<NavigationContainer linking={linking}>
  {/* navigation */}
</NavigationContainer>
```

### Analytics

```typescript
// src/services/analytics.ts
import * as Analytics from 'expo-firebase-analytics';

export const logEvent = async (eventName: string, params?: object) => {
  await Analytics.logEvent(eventName, params);
};

export const logScreenView = async (screenName: string) => {
  await Analytics.logEvent('screen_view', {
    screen_name: screenName,
  });
};

// Usage
useEffect(() => {
  logScreenView('StudentDashboard');
}, []);

logEvent('assignment_submitted', {
  assignment_id: assignmentId,
  subject: 'Mathematics',
});
```


### Localization

```typescript
// src/i18n/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import en from './locales/en.json';
import hi from './locales/hi.json';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
  },
  lng: Localization.locale.split('-')[0],
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;

// Usage
import { useTranslation } from 'react-i18next';

function Component() {
  const { t } = useTranslation();
  return <Text>{t('welcome')}</Text>;
}
```

### Accessibility

```typescript
// Accessible components
<TouchableOpacity
  accessible={true}
  accessibilityLabel="Submit assignment"
  accessibilityHint="Double tap to submit your assignment"
  accessibilityRole="button"
>
  <Text>Submit</Text>
</TouchableOpacity>

<Image
  source={imageSource}
  accessible={true}
  accessibilityLabel="Student profile photo"
/>

// Screen reader announcements
import { AccessibilityInfo } from 'react-native';

AccessibilityInfo.announceForAccessibility('Assignment submitted successfully');
```

---

## Troubleshooting

### Common Issues

**Issue: API calls failing**
- Check network connectivity
- Verify API base URL in .env
- Check authentication token
- Review API endpoint paths

**Issue: Push notifications not working**
- Verify device permissions
- Check Expo push token registration
- Test on physical device (not simulator)
- Review notification payload format

**Issue: Images not loading**
- Check Cloudinary configuration
- Verify image URLs
- Check network connectivity
- Review image caching settings

**Issue: App crashes on startup**
- Clear cache: `npx expo start -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check for syntax errors
- Review error logs

### Debug Tools

```bash
# View logs
npx expo start

# Debug on device
npx expo start --dev-client

# Clear cache
npx expo start -c

# Check bundle size
npx expo export --dump-sourcemap
```


---

## Best Practices

### Code Organization
- Use TypeScript for type safety
- Follow React Native best practices
- Implement proper error boundaries
- Use custom hooks for reusable logic
- Keep components small and focused

### Performance
- Implement pagination for large lists
- Use FlatList instead of ScrollView for long lists
- Optimize images (compress, use appropriate formats)
- Implement lazy loading
- Cache API responses with React Query
- Use React.memo for expensive components

### Security
- Never store sensitive data in AsyncStorage unencrypted
- Use Secure Store for tokens and credentials
- Implement SSL pinning for production
- Validate all user inputs
- Use environment variables for secrets
- Implement proper session management

### User Experience
- Provide loading states
- Show error messages clearly
- Implement pull-to-refresh
- Add skeleton loaders
- Support offline mode
- Provide haptic feedback
- Implement smooth animations

### Testing
- Write unit tests for utilities
- Test API integration
- Test navigation flows
- Test error scenarios
- Perform accessibility testing
- Test on multiple devices

---

## Support & Resources

### Documentation
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Expo Docs](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/docs/getting-started)
- [React Query](https://tanstack.com/query/latest/docs/react/overview)
- [Clerk React Native](https://clerk.com/docs/quickstarts/expo)

### Community
- React Native Discord
- Expo Discord
- Stack Overflow
- GitHub Issues

### Contact
For technical support or questions about the mobile app:
- Email: support@yourschool.com
- Documentation: https://docs.yourschool.com
- GitHub: https://github.com/yourschool/erp-mobile

---

## Changelog

### Version 1.0.0 (Initial Release)
- Student portal with full feature set
- Parent portal with child monitoring
- Push notifications
- Offline support
- Biometric authentication
- File uploads
- Real-time messaging
- Performance analytics
- Multi-language support

### Roadmap
- [ ] Video conferencing integration
- [ ] AI-powered study recommendations
- [ ] Gamification features
- [ ] Social features for students
- [ ] Advanced analytics dashboard
- [ ] Voice commands
- [ ] AR/VR learning experiences

---

## License

Copyright © 2024 Your School Name. All rights reserved.

This documentation is proprietary and confidential.

