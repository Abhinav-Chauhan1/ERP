/**
 * Permission Defaults Configuration
 * 
 * This file contains all default permission definitions and role mappings.
 * No database seeding required - these defaults are used when DB permissions don't exist.
 */

import { PermissionAction, UserRole } from '@prisma/client';

/**
 * Permission categories for organization
 */
export const PERMISSION_CATEGORIES = {
    USER_MANAGEMENT: 'USER_MANAGEMENT',
    ACADEMIC: 'ACADEMIC',
    FINANCE: 'FINANCE',
    COMMUNICATION: 'COMMUNICATION',
    LIBRARY: 'LIBRARY',
    TRANSPORT: 'TRANSPORT',
    ADMISSION: 'ADMISSION',
    REPORTS: 'REPORTS',
    SYSTEM: 'SYSTEM',
    HOSTEL: 'HOSTEL',
} as const;

/**
 * Resource types that can have permissions
 */
export const RESOURCES = {
    USER: 'USER',
    STUDENT: 'STUDENT',
    TEACHER: 'TEACHER',
    PARENT: 'PARENT',
    CLASS: 'CLASS',
    SECTION: 'SECTION',
    SUBJECT: 'SUBJECT',
    DEPARTMENT: 'DEPARTMENT',
    EXAM: 'EXAM',
    MARKS: 'MARKS',
    RESULT: 'RESULT',
    ASSIGNMENT: 'ASSIGNMENT',
    ATTENDANCE: 'ATTENDANCE',
    FEE: 'FEE',
    PAYMENT: 'PAYMENT',
    ANNOUNCEMENT: 'ANNOUNCEMENT',
    MESSAGE: 'MESSAGE',
    DOCUMENT: 'DOCUMENT',
    REPORT: 'REPORT',
    BOOK: 'BOOK',
    VEHICLE: 'VEHICLE',
    ROUTE: 'ROUTE',
    DRIVER: 'DRIVER',
    APPLICATION: 'APPLICATION',
    CERTIFICATE: 'CERTIFICATE',
    BACKUP: 'BACKUP',
    SETTINGS: 'SETTINGS',
    PROMOTION: 'PROMOTION',
    GRADUATION: 'GRADUATION',
    ALUMNI: 'ALUMNI',
    ALUMNI_PORTAL: 'ALUMNI_PORTAL',
    HOSTEL: 'HOSTEL',
    TIMETABLE: 'TIMETABLE',
    SYLLABUS: 'SYLLABUS',
    CALENDAR: 'CALENDAR',
    EVENT: 'EVENT',
    SCHOLARSHIP: 'SCHOLARSHIP',
    PAYROLL: 'PAYROLL',
    BUDGET: 'BUDGET',
    EXPENSE: 'EXPENSE',
} as const;

export type ResourceType = typeof RESOURCES[keyof typeof RESOURCES];

/**
 * Permission definition interface
 */
export interface PermissionDefinition {
    name: string;
    resource: string;
    action: PermissionAction;
    category: string;
    description: string;
}

/**
 * All default permissions in the system
 */
export const DEFAULT_PERMISSIONS: PermissionDefinition[] = [
    // User Management
    { name: 'CREATE_USER', resource: RESOURCES.USER, action: 'CREATE', category: PERMISSION_CATEGORIES.USER_MANAGEMENT, description: 'Create new users' },
    { name: 'READ_USER', resource: RESOURCES.USER, action: 'READ', category: PERMISSION_CATEGORIES.USER_MANAGEMENT, description: 'View user details' },
    { name: 'UPDATE_USER', resource: RESOURCES.USER, action: 'UPDATE', category: PERMISSION_CATEGORIES.USER_MANAGEMENT, description: 'Update user information' },
    { name: 'DELETE_USER', resource: RESOURCES.USER, action: 'DELETE', category: PERMISSION_CATEGORIES.USER_MANAGEMENT, description: 'Delete users' },
    { name: 'EXPORT_USER', resource: RESOURCES.USER, action: 'EXPORT', category: PERMISSION_CATEGORIES.USER_MANAGEMENT, description: 'Export user data' },
    { name: 'IMPORT_USER', resource: RESOURCES.USER, action: 'IMPORT', category: PERMISSION_CATEGORIES.USER_MANAGEMENT, description: 'Import user data' },

    // Student Management
    { name: 'CREATE_STUDENT', resource: RESOURCES.STUDENT, action: 'CREATE', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Create new students' },
    { name: 'READ_STUDENT', resource: RESOURCES.STUDENT, action: 'READ', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'View student details' },
    { name: 'UPDATE_STUDENT', resource: RESOURCES.STUDENT, action: 'UPDATE', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Update student information' },
    { name: 'DELETE_STUDENT', resource: RESOURCES.STUDENT, action: 'DELETE', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Delete students' },
    { name: 'EXPORT_STUDENT', resource: RESOURCES.STUDENT, action: 'EXPORT', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Export student data' },
    { name: 'IMPORT_STUDENT', resource: RESOURCES.STUDENT, action: 'IMPORT', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Import student data' },

    // Teacher Management
    { name: 'CREATE_TEACHER', resource: RESOURCES.TEACHER, action: 'CREATE', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Create new teachers' },
    { name: 'READ_TEACHER', resource: RESOURCES.TEACHER, action: 'READ', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'View teacher details' },
    { name: 'UPDATE_TEACHER', resource: RESOURCES.TEACHER, action: 'UPDATE', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Update teacher information' },
    { name: 'DELETE_TEACHER', resource: RESOURCES.TEACHER, action: 'DELETE', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Delete teachers' },
    { name: 'EXPORT_TEACHER', resource: RESOURCES.TEACHER, action: 'EXPORT', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Export teacher data' },

    // Parent Management
    { name: 'CREATE_PARENT', resource: RESOURCES.PARENT, action: 'CREATE', category: PERMISSION_CATEGORIES.USER_MANAGEMENT, description: 'Create new parents' },
    { name: 'READ_PARENT', resource: RESOURCES.PARENT, action: 'READ', category: PERMISSION_CATEGORIES.USER_MANAGEMENT, description: 'View parent details' },
    { name: 'UPDATE_PARENT', resource: RESOURCES.PARENT, action: 'UPDATE', category: PERMISSION_CATEGORIES.USER_MANAGEMENT, description: 'Update parent information' },
    { name: 'DELETE_PARENT', resource: RESOURCES.PARENT, action: 'DELETE', category: PERMISSION_CATEGORIES.USER_MANAGEMENT, description: 'Delete parents' },

    // Class Management
    { name: 'CREATE_CLASS', resource: RESOURCES.CLASS, action: 'CREATE', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Create new classes' },
    { name: 'READ_CLASS', resource: RESOURCES.CLASS, action: 'READ', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'View class details' },
    { name: 'UPDATE_CLASS', resource: RESOURCES.CLASS, action: 'UPDATE', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Update class information' },
    { name: 'DELETE_CLASS', resource: RESOURCES.CLASS, action: 'DELETE', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Delete classes' },

    // Section Management
    { name: 'CREATE_SECTION', resource: RESOURCES.SECTION, action: 'CREATE', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Create new sections' },
    { name: 'READ_SECTION', resource: RESOURCES.SECTION, action: 'READ', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'View section details' },
    { name: 'UPDATE_SECTION', resource: RESOURCES.SECTION, action: 'UPDATE', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Update section information' },
    { name: 'DELETE_SECTION', resource: RESOURCES.SECTION, action: 'DELETE', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Delete sections' },

    // Subject Management
    { name: 'CREATE_SUBJECT', resource: RESOURCES.SUBJECT, action: 'CREATE', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Create new subjects' },
    { name: 'READ_SUBJECT', resource: RESOURCES.SUBJECT, action: 'READ', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'View subject details' },
    { name: 'UPDATE_SUBJECT', resource: RESOURCES.SUBJECT, action: 'UPDATE', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Update subject information' },
    { name: 'DELETE_SUBJECT', resource: RESOURCES.SUBJECT, action: 'DELETE', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Delete subjects' },

    // Department Management
    { name: 'CREATE_DEPARTMENT', resource: RESOURCES.DEPARTMENT, action: 'CREATE', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Create new departments' },
    { name: 'READ_DEPARTMENT', resource: RESOURCES.DEPARTMENT, action: 'READ', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'View department details' },
    { name: 'UPDATE_DEPARTMENT', resource: RESOURCES.DEPARTMENT, action: 'UPDATE', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Update department information' },
    { name: 'DELETE_DEPARTMENT', resource: RESOURCES.DEPARTMENT, action: 'DELETE', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Delete departments' },

    // Exam Management
    { name: 'CREATE_EXAM', resource: RESOURCES.EXAM, action: 'CREATE', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Create new exams' },
    { name: 'READ_EXAM', resource: RESOURCES.EXAM, action: 'READ', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'View exam details' },
    { name: 'UPDATE_EXAM', resource: RESOURCES.EXAM, action: 'UPDATE', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Update exam information' },
    { name: 'DELETE_EXAM', resource: RESOURCES.EXAM, action: 'DELETE', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Delete exams' },
    { name: 'PUBLISH_EXAM', resource: RESOURCES.EXAM, action: 'PUBLISH', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Publish exam results' },

    // Marks Management
    { name: 'CREATE_MARKS', resource: RESOURCES.MARKS, action: 'CREATE', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Enter student marks' },
    { name: 'READ_MARKS', resource: RESOURCES.MARKS, action: 'READ', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'View student marks' },
    { name: 'UPDATE_MARKS', resource: RESOURCES.MARKS, action: 'UPDATE', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Update student marks' },
    { name: 'DELETE_MARKS', resource: RESOURCES.MARKS, action: 'DELETE', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Delete student marks' },
    { name: 'EXPORT_MARKS', resource: RESOURCES.MARKS, action: 'EXPORT', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Export marks data' },
    { name: 'IMPORT_MARKS', resource: RESOURCES.MARKS, action: 'IMPORT', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Import marks data' },

    // Result Management
    { name: 'CREATE_RESULT', resource: RESOURCES.RESULT, action: 'CREATE', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Generate results' },
    { name: 'READ_RESULT', resource: RESOURCES.RESULT, action: 'READ', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'View results' },
    { name: 'PUBLISH_RESULT', resource: RESOURCES.RESULT, action: 'PUBLISH', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Publish results' },

    // Assignment Management
    { name: 'CREATE_ASSIGNMENT', resource: RESOURCES.ASSIGNMENT, action: 'CREATE', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Create new assignments' },
    { name: 'READ_ASSIGNMENT', resource: RESOURCES.ASSIGNMENT, action: 'READ', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'View assignment details' },
    { name: 'UPDATE_ASSIGNMENT', resource: RESOURCES.ASSIGNMENT, action: 'UPDATE', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Update assignment information' },
    { name: 'DELETE_ASSIGNMENT', resource: RESOURCES.ASSIGNMENT, action: 'DELETE', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Delete assignments' },

    // Attendance Management
    { name: 'CREATE_ATTENDANCE', resource: RESOURCES.ATTENDANCE, action: 'CREATE', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Mark attendance' },
    { name: 'READ_ATTENDANCE', resource: RESOURCES.ATTENDANCE, action: 'READ', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'View attendance records' },
    { name: 'UPDATE_ATTENDANCE', resource: RESOURCES.ATTENDANCE, action: 'UPDATE', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Update attendance records' },
    { name: 'EXPORT_ATTENDANCE', resource: RESOURCES.ATTENDANCE, action: 'EXPORT', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Export attendance data' },

    // Fee Management
    { name: 'CREATE_FEE', resource: RESOURCES.FEE, action: 'CREATE', category: PERMISSION_CATEGORIES.FINANCE, description: 'Create fee structures' },
    { name: 'READ_FEE', resource: RESOURCES.FEE, action: 'READ', category: PERMISSION_CATEGORIES.FINANCE, description: 'View fee details' },
    { name: 'UPDATE_FEE', resource: RESOURCES.FEE, action: 'UPDATE', category: PERMISSION_CATEGORIES.FINANCE, description: 'Update fee structures' },
    { name: 'DELETE_FEE', resource: RESOURCES.FEE, action: 'DELETE', category: PERMISSION_CATEGORIES.FINANCE, description: 'Delete fee structures' },

    // Payment Management
    { name: 'CREATE_PAYMENT', resource: RESOURCES.PAYMENT, action: 'CREATE', category: PERMISSION_CATEGORIES.FINANCE, description: 'Record payments' },
    { name: 'READ_PAYMENT', resource: RESOURCES.PAYMENT, action: 'READ', category: PERMISSION_CATEGORIES.FINANCE, description: 'View payment records' },
    { name: 'UPDATE_PAYMENT', resource: RESOURCES.PAYMENT, action: 'UPDATE', category: PERMISSION_CATEGORIES.FINANCE, description: 'Update payment records' },
    { name: 'DELETE_PAYMENT', resource: RESOURCES.PAYMENT, action: 'DELETE', category: PERMISSION_CATEGORIES.FINANCE, description: 'Delete payment records' },
    { name: 'APPROVE_PAYMENT', resource: RESOURCES.PAYMENT, action: 'APPROVE', category: PERMISSION_CATEGORIES.FINANCE, description: 'Approve payments' },
    { name: 'EXPORT_PAYMENT', resource: RESOURCES.PAYMENT, action: 'EXPORT', category: PERMISSION_CATEGORIES.FINANCE, description: 'Export payment data' },

    // Announcement Management
    { name: 'CREATE_ANNOUNCEMENT', resource: RESOURCES.ANNOUNCEMENT, action: 'CREATE', category: PERMISSION_CATEGORIES.COMMUNICATION, description: 'Create announcements' },
    { name: 'READ_ANNOUNCEMENT', resource: RESOURCES.ANNOUNCEMENT, action: 'READ', category: PERMISSION_CATEGORIES.COMMUNICATION, description: 'View announcements' },
    { name: 'UPDATE_ANNOUNCEMENT', resource: RESOURCES.ANNOUNCEMENT, action: 'UPDATE', category: PERMISSION_CATEGORIES.COMMUNICATION, description: 'Update announcements' },
    { name: 'DELETE_ANNOUNCEMENT', resource: RESOURCES.ANNOUNCEMENT, action: 'DELETE', category: PERMISSION_CATEGORIES.COMMUNICATION, description: 'Delete announcements' },
    { name: 'PUBLISH_ANNOUNCEMENT', resource: RESOURCES.ANNOUNCEMENT, action: 'PUBLISH', category: PERMISSION_CATEGORIES.COMMUNICATION, description: 'Publish announcements' },

    // Message Management
    { name: 'CREATE_MESSAGE', resource: RESOURCES.MESSAGE, action: 'CREATE', category: PERMISSION_CATEGORIES.COMMUNICATION, description: 'Send messages' },
    { name: 'READ_MESSAGE', resource: RESOURCES.MESSAGE, action: 'READ', category: PERMISSION_CATEGORIES.COMMUNICATION, description: 'Read messages' },
    { name: 'DELETE_MESSAGE', resource: RESOURCES.MESSAGE, action: 'DELETE', category: PERMISSION_CATEGORIES.COMMUNICATION, description: 'Delete messages' },

    // Document Management
    { name: 'CREATE_DOCUMENT', resource: RESOURCES.DOCUMENT, action: 'CREATE', category: PERMISSION_CATEGORIES.SYSTEM, description: 'Upload documents' },
    { name: 'READ_DOCUMENT', resource: RESOURCES.DOCUMENT, action: 'READ', category: PERMISSION_CATEGORIES.SYSTEM, description: 'View documents' },
    { name: 'UPDATE_DOCUMENT', resource: RESOURCES.DOCUMENT, action: 'UPDATE', category: PERMISSION_CATEGORIES.SYSTEM, description: 'Update documents' },
    { name: 'DELETE_DOCUMENT', resource: RESOURCES.DOCUMENT, action: 'DELETE', category: PERMISSION_CATEGORIES.SYSTEM, description: 'Delete documents' },

    // Reports
    { name: 'CREATE_REPORT', resource: RESOURCES.REPORT, action: 'CREATE', category: PERMISSION_CATEGORIES.REPORTS, description: 'Create reports' },
    { name: 'READ_REPORT', resource: RESOURCES.REPORT, action: 'READ', category: PERMISSION_CATEGORIES.REPORTS, description: 'View reports' },
    { name: 'EXPORT_REPORT', resource: RESOURCES.REPORT, action: 'EXPORT', category: PERMISSION_CATEGORIES.REPORTS, description: 'Export reports' },

    // Library Management
    { name: 'CREATE_BOOK', resource: RESOURCES.BOOK, action: 'CREATE', category: PERMISSION_CATEGORIES.LIBRARY, description: 'Add books to library' },
    { name: 'READ_BOOK', resource: RESOURCES.BOOK, action: 'READ', category: PERMISSION_CATEGORIES.LIBRARY, description: 'View book details' },
    { name: 'UPDATE_BOOK', resource: RESOURCES.BOOK, action: 'UPDATE', category: PERMISSION_CATEGORIES.LIBRARY, description: 'Update book information' },
    { name: 'DELETE_BOOK', resource: RESOURCES.BOOK, action: 'DELETE', category: PERMISSION_CATEGORIES.LIBRARY, description: 'Delete books' },

    // Transport - Vehicle Management
    { name: 'CREATE_VEHICLE', resource: RESOURCES.VEHICLE, action: 'CREATE', category: PERMISSION_CATEGORIES.TRANSPORT, description: 'Add vehicles' },
    { name: 'READ_VEHICLE', resource: RESOURCES.VEHICLE, action: 'READ', category: PERMISSION_CATEGORIES.TRANSPORT, description: 'View vehicle details' },
    { name: 'UPDATE_VEHICLE', resource: RESOURCES.VEHICLE, action: 'UPDATE', category: PERMISSION_CATEGORIES.TRANSPORT, description: 'Update vehicle information' },
    { name: 'DELETE_VEHICLE', resource: RESOURCES.VEHICLE, action: 'DELETE', category: PERMISSION_CATEGORIES.TRANSPORT, description: 'Delete vehicles' },

    // Transport - Route Management
    { name: 'CREATE_ROUTE', resource: RESOURCES.ROUTE, action: 'CREATE', category: PERMISSION_CATEGORIES.TRANSPORT, description: 'Create routes' },
    { name: 'READ_ROUTE', resource: RESOURCES.ROUTE, action: 'READ', category: PERMISSION_CATEGORIES.TRANSPORT, description: 'View route details' },
    { name: 'UPDATE_ROUTE', resource: RESOURCES.ROUTE, action: 'UPDATE', category: PERMISSION_CATEGORIES.TRANSPORT, description: 'Update route information' },
    { name: 'DELETE_ROUTE', resource: RESOURCES.ROUTE, action: 'DELETE', category: PERMISSION_CATEGORIES.TRANSPORT, description: 'Delete routes' },

    // Transport - Driver Management
    { name: 'CREATE_DRIVER', resource: RESOURCES.DRIVER, action: 'CREATE', category: PERMISSION_CATEGORIES.TRANSPORT, description: 'Add drivers' },
    { name: 'READ_DRIVER', resource: RESOURCES.DRIVER, action: 'READ', category: PERMISSION_CATEGORIES.TRANSPORT, description: 'View driver details' },
    { name: 'UPDATE_DRIVER', resource: RESOURCES.DRIVER, action: 'UPDATE', category: PERMISSION_CATEGORIES.TRANSPORT, description: 'Update driver information' },
    { name: 'DELETE_DRIVER', resource: RESOURCES.DRIVER, action: 'DELETE', category: PERMISSION_CATEGORIES.TRANSPORT, description: 'Delete drivers' },

    // Admission Management
    { name: 'CREATE_APPLICATION', resource: RESOURCES.APPLICATION, action: 'CREATE', category: PERMISSION_CATEGORIES.ADMISSION, description: 'Create admission applications' },
    { name: 'READ_APPLICATION', resource: RESOURCES.APPLICATION, action: 'READ', category: PERMISSION_CATEGORIES.ADMISSION, description: 'View admission applications' },
    { name: 'UPDATE_APPLICATION', resource: RESOURCES.APPLICATION, action: 'UPDATE', category: PERMISSION_CATEGORIES.ADMISSION, description: 'Update admission applications' },
    { name: 'DELETE_APPLICATION', resource: RESOURCES.APPLICATION, action: 'DELETE', category: PERMISSION_CATEGORIES.ADMISSION, description: 'Delete admission applications' },
    { name: 'APPROVE_APPLICATION', resource: RESOURCES.APPLICATION, action: 'APPROVE', category: PERMISSION_CATEGORIES.ADMISSION, description: 'Approve admission applications' },
    { name: 'REJECT_APPLICATION', resource: RESOURCES.APPLICATION, action: 'REJECT', category: PERMISSION_CATEGORIES.ADMISSION, description: 'Reject admission applications' },

    // Certificate Management
    { name: 'CREATE_CERTIFICATE', resource: RESOURCES.CERTIFICATE, action: 'CREATE', category: PERMISSION_CATEGORIES.SYSTEM, description: 'Generate certificates' },
    { name: 'READ_CERTIFICATE', resource: RESOURCES.CERTIFICATE, action: 'READ', category: PERMISSION_CATEGORIES.SYSTEM, description: 'View certificates' },
    { name: 'UPDATE_CERTIFICATE', resource: RESOURCES.CERTIFICATE, action: 'UPDATE', category: PERMISSION_CATEGORIES.SYSTEM, description: 'Update certificates' },
    { name: 'DELETE_CERTIFICATE', resource: RESOURCES.CERTIFICATE, action: 'DELETE', category: PERMISSION_CATEGORIES.SYSTEM, description: 'Delete certificates' },

    // Backup Management
    { name: 'CREATE_BACKUP', resource: RESOURCES.BACKUP, action: 'CREATE', category: PERMISSION_CATEGORIES.SYSTEM, description: 'Create backups' },
    { name: 'READ_BACKUP', resource: RESOURCES.BACKUP, action: 'READ', category: PERMISSION_CATEGORIES.SYSTEM, description: 'View backup details' },
    { name: 'DELETE_BACKUP', resource: RESOURCES.BACKUP, action: 'DELETE', category: PERMISSION_CATEGORIES.SYSTEM, description: 'Delete backups' },

    // System Settings
    { name: 'READ_SETTINGS', resource: RESOURCES.SETTINGS, action: 'READ', category: PERMISSION_CATEGORIES.SYSTEM, description: 'View system settings' },
    { name: 'UPDATE_SETTINGS', resource: RESOURCES.SETTINGS, action: 'UPDATE', category: PERMISSION_CATEGORIES.SYSTEM, description: 'Update system settings' },

    // Student Promotion Management
    { name: 'CREATE_PROMOTION', resource: RESOURCES.PROMOTION, action: 'CREATE', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Execute student promotions' },
    { name: 'READ_PROMOTION', resource: RESOURCES.PROMOTION, action: 'READ', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'View promotion history' },
    { name: 'DELETE_PROMOTION', resource: RESOURCES.PROMOTION, action: 'DELETE', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Rollback promotions' },

    // Graduation Management
    { name: 'CREATE_GRADUATION', resource: RESOURCES.GRADUATION, action: 'CREATE', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Mark students as graduated' },
    { name: 'READ_GRADUATION', resource: RESOURCES.GRADUATION, action: 'READ', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'View graduation records' },

    // Alumni Management
    { name: 'CREATE_ALUMNI', resource: RESOURCES.ALUMNI, action: 'CREATE', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Create alumni profiles' },
    { name: 'READ_ALUMNI', resource: RESOURCES.ALUMNI, action: 'READ', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'View alumni directory' },
    { name: 'UPDATE_ALUMNI', resource: RESOURCES.ALUMNI, action: 'UPDATE', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Update alumni profiles' },
    { name: 'DELETE_ALUMNI', resource: RESOURCES.ALUMNI, action: 'DELETE', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Delete alumni profiles' },
    { name: 'EXPORT_ALUMNI', resource: RESOURCES.ALUMNI, action: 'EXPORT', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Export alumni data' },

    // Alumni Portal
    { name: 'READ_ALUMNI_PORTAL', resource: RESOURCES.ALUMNI_PORTAL, action: 'READ', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Access alumni portal' },
    { name: 'UPDATE_ALUMNI_PORTAL', resource: RESOURCES.ALUMNI_PORTAL, action: 'UPDATE', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Update own alumni profile' },

    // Hostel Management
    { name: 'CREATE_HOSTEL', resource: RESOURCES.HOSTEL, action: 'CREATE', category: PERMISSION_CATEGORIES.HOSTEL, description: 'Create hostel records' },
    { name: 'READ_HOSTEL', resource: RESOURCES.HOSTEL, action: 'READ', category: PERMISSION_CATEGORIES.HOSTEL, description: 'View hostel details' },
    { name: 'UPDATE_HOSTEL', resource: RESOURCES.HOSTEL, action: 'UPDATE', category: PERMISSION_CATEGORIES.HOSTEL, description: 'Update hostel information' },
    { name: 'DELETE_HOSTEL', resource: RESOURCES.HOSTEL, action: 'DELETE', category: PERMISSION_CATEGORIES.HOSTEL, description: 'Delete hostel records' },

    // Timetable Management
    { name: 'CREATE_TIMETABLE', resource: RESOURCES.TIMETABLE, action: 'CREATE', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Create timetables' },
    { name: 'READ_TIMETABLE', resource: RESOURCES.TIMETABLE, action: 'READ', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'View timetables' },
    { name: 'UPDATE_TIMETABLE', resource: RESOURCES.TIMETABLE, action: 'UPDATE', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Update timetables' },
    { name: 'DELETE_TIMETABLE', resource: RESOURCES.TIMETABLE, action: 'DELETE', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Delete timetables' },

    // Syllabus Management
    { name: 'CREATE_SYLLABUS', resource: RESOURCES.SYLLABUS, action: 'CREATE', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Create syllabus' },
    { name: 'READ_SYLLABUS', resource: RESOURCES.SYLLABUS, action: 'READ', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'View syllabus' },
    { name: 'UPDATE_SYLLABUS', resource: RESOURCES.SYLLABUS, action: 'UPDATE', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Update syllabus' },
    { name: 'DELETE_SYLLABUS', resource: RESOURCES.SYLLABUS, action: 'DELETE', category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Delete syllabus' },

    // Calendar/Event Management
    { name: 'CREATE_CALENDAR', resource: RESOURCES.CALENDAR, action: 'CREATE', category: PERMISSION_CATEGORIES.SYSTEM, description: 'Create calendar entries' },
    { name: 'READ_CALENDAR', resource: RESOURCES.CALENDAR, action: 'READ', category: PERMISSION_CATEGORIES.SYSTEM, description: 'View calendar' },
    { name: 'UPDATE_CALENDAR', resource: RESOURCES.CALENDAR, action: 'UPDATE', category: PERMISSION_CATEGORIES.SYSTEM, description: 'Update calendar entries' },
    { name: 'DELETE_CALENDAR', resource: RESOURCES.CALENDAR, action: 'DELETE', category: PERMISSION_CATEGORIES.SYSTEM, description: 'Delete calendar entries' },

    // Event Management
    { name: 'CREATE_EVENT', resource: RESOURCES.EVENT, action: 'CREATE', category: PERMISSION_CATEGORIES.COMMUNICATION, description: 'Create events' },
    { name: 'READ_EVENT', resource: RESOURCES.EVENT, action: 'READ', category: PERMISSION_CATEGORIES.COMMUNICATION, description: 'View events' },
    { name: 'UPDATE_EVENT', resource: RESOURCES.EVENT, action: 'UPDATE', category: PERMISSION_CATEGORIES.COMMUNICATION, description: 'Update events' },
    { name: 'DELETE_EVENT', resource: RESOURCES.EVENT, action: 'DELETE', category: PERMISSION_CATEGORIES.COMMUNICATION, description: 'Delete events' },

    // Scholarship Management
    { name: 'CREATE_SCHOLARSHIP', resource: RESOURCES.SCHOLARSHIP, action: 'CREATE', category: PERMISSION_CATEGORIES.FINANCE, description: 'Create scholarships' },
    { name: 'READ_SCHOLARSHIP', resource: RESOURCES.SCHOLARSHIP, action: 'READ', category: PERMISSION_CATEGORIES.FINANCE, description: 'View scholarships' },
    { name: 'UPDATE_SCHOLARSHIP', resource: RESOURCES.SCHOLARSHIP, action: 'UPDATE', category: PERMISSION_CATEGORIES.FINANCE, description: 'Update scholarships' },
    { name: 'DELETE_SCHOLARSHIP', resource: RESOURCES.SCHOLARSHIP, action: 'DELETE', category: PERMISSION_CATEGORIES.FINANCE, description: 'Delete scholarships' },
    { name: 'APPROVE_SCHOLARSHIP', resource: RESOURCES.SCHOLARSHIP, action: 'APPROVE', category: PERMISSION_CATEGORIES.FINANCE, description: 'Approve scholarship applications' },

    // Payroll Management
    { name: 'CREATE_PAYROLL', resource: RESOURCES.PAYROLL, action: 'CREATE', category: PERMISSION_CATEGORIES.FINANCE, description: 'Create payroll entries' },
    { name: 'READ_PAYROLL', resource: RESOURCES.PAYROLL, action: 'READ', category: PERMISSION_CATEGORIES.FINANCE, description: 'View payroll' },
    { name: 'UPDATE_PAYROLL', resource: RESOURCES.PAYROLL, action: 'UPDATE', category: PERMISSION_CATEGORIES.FINANCE, description: 'Update payroll' },
    { name: 'DELETE_PAYROLL', resource: RESOURCES.PAYROLL, action: 'DELETE', category: PERMISSION_CATEGORIES.FINANCE, description: 'Delete payroll entries' },
    { name: 'APPROVE_PAYROLL', resource: RESOURCES.PAYROLL, action: 'APPROVE', category: PERMISSION_CATEGORIES.FINANCE, description: 'Approve payroll' },

    // Budget Management
    { name: 'CREATE_BUDGET', resource: RESOURCES.BUDGET, action: 'CREATE', category: PERMISSION_CATEGORIES.FINANCE, description: 'Create budgets' },
    { name: 'READ_BUDGET', resource: RESOURCES.BUDGET, action: 'READ', category: PERMISSION_CATEGORIES.FINANCE, description: 'View budgets' },
    { name: 'UPDATE_BUDGET', resource: RESOURCES.BUDGET, action: 'UPDATE', category: PERMISSION_CATEGORIES.FINANCE, description: 'Update budgets' },
    { name: 'DELETE_BUDGET', resource: RESOURCES.BUDGET, action: 'DELETE', category: PERMISSION_CATEGORIES.FINANCE, description: 'Delete budgets' },

    // Expense Management
    { name: 'CREATE_EXPENSE', resource: RESOURCES.EXPENSE, action: 'CREATE', category: PERMISSION_CATEGORIES.FINANCE, description: 'Create expenses' },
    { name: 'READ_EXPENSE', resource: RESOURCES.EXPENSE, action: 'READ', category: PERMISSION_CATEGORIES.FINANCE, description: 'View expenses' },
    { name: 'UPDATE_EXPENSE', resource: RESOURCES.EXPENSE, action: 'UPDATE', category: PERMISSION_CATEGORIES.FINANCE, description: 'Update expenses' },
    { name: 'DELETE_EXPENSE', resource: RESOURCES.EXPENSE, action: 'DELETE', category: PERMISSION_CATEGORIES.FINANCE, description: 'Delete expenses' },
    { name: 'APPROVE_EXPENSE', resource: RESOURCES.EXPENSE, action: 'APPROVE', category: PERMISSION_CATEGORIES.FINANCE, description: 'Approve expenses' },
];

/**
 * Default permissions for each role
 * ADMIN has all permissions (handled separately via bypass)
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, string[]> = {
    ADMIN: ['*'], // Wildcard - handled by admin bypass in hasPermission

    TEACHER: [
        // View access
        'READ_USER', 'READ_STUDENT', 'READ_TEACHER', 'READ_PARENT',
        'READ_CLASS', 'READ_SECTION', 'READ_SUBJECT', 'READ_DEPARTMENT',
        'READ_TIMETABLE', 'READ_SYLLABUS', 'READ_CALENDAR', 'READ_EVENT',

        // Student data (limited)
        'EXPORT_STUDENT',

        // Exam & Assessment (full control for their classes)
        'CREATE_EXAM', 'READ_EXAM', 'UPDATE_EXAM', 'DELETE_EXAM', 'PUBLISH_EXAM',
        'CREATE_MARKS', 'READ_MARKS', 'UPDATE_MARKS', 'EXPORT_MARKS', 'IMPORT_MARKS',
        'READ_RESULT', 'PUBLISH_RESULT',

        // Assignments (full control)
        'CREATE_ASSIGNMENT', 'READ_ASSIGNMENT', 'UPDATE_ASSIGNMENT', 'DELETE_ASSIGNMENT',

        // Attendance (full control for their classes)
        'CREATE_ATTENDANCE', 'READ_ATTENDANCE', 'UPDATE_ATTENDANCE', 'EXPORT_ATTENDANCE',

        // View financial info
        'READ_FEE', 'READ_PAYMENT',

        // Communication
        'CREATE_ANNOUNCEMENT', 'READ_ANNOUNCEMENT',
        'CREATE_MESSAGE', 'READ_MESSAGE', 'DELETE_MESSAGE',

        // Documents
        'CREATE_DOCUMENT', 'READ_DOCUMENT', 'UPDATE_DOCUMENT', 'DELETE_DOCUMENT',

        // Reports
        'CREATE_REPORT', 'READ_REPORT', 'EXPORT_REPORT',

        // Library (view)
        'READ_BOOK',

        // Alumni (view)
        'READ_ALUMNI',
    ],

    STUDENT: [
        // View own data
        'READ_STUDENT', 'READ_CLASS', 'READ_SECTION', 'READ_SUBJECT',
        'READ_TIMETABLE', 'READ_SYLLABUS', 'READ_CALENDAR', 'READ_EVENT',

        // Exam & Results (view only)
        'READ_EXAM', 'READ_MARKS', 'READ_RESULT',

        // Assignments (view and submit)
        'READ_ASSIGNMENT',

        // Attendance (view own)
        'READ_ATTENDANCE',

        // Fees & Payments (view own)
        'READ_FEE', 'READ_PAYMENT',

        // Communication
        'READ_ANNOUNCEMENT',
        'CREATE_MESSAGE', 'READ_MESSAGE', 'DELETE_MESSAGE',

        // Documents (view own)
        'READ_DOCUMENT',

        // Library
        'READ_BOOK',

        // Certificates
        'READ_CERTIFICATE',

        // Alumni portal (after graduation)
        'READ_ALUMNI_PORTAL', 'UPDATE_ALUMNI_PORTAL',
    ],

    PARENT: [
        // View children's data
        'READ_STUDENT', 'READ_CLASS', 'READ_SECTION', 'READ_SUBJECT',
        'READ_TIMETABLE', 'READ_CALENDAR', 'READ_EVENT',

        // Exam & Results (view children's)
        'READ_EXAM', 'READ_MARKS', 'READ_RESULT',

        // Assignments (view children's)
        'READ_ASSIGNMENT',

        // Attendance (view children's)
        'READ_ATTENDANCE',

        // Fees & Payments (view and pay)
        'READ_FEE', 'READ_PAYMENT', 'CREATE_PAYMENT',

        // Communication
        'READ_ANNOUNCEMENT',
        'CREATE_MESSAGE', 'READ_MESSAGE', 'DELETE_MESSAGE',

        // Documents (view children's)
        'READ_DOCUMENT',
    ],
};

/**
 * Check if a role has a specific default permission
 * @param role - User role to check
 * @param permissionName - Permission name (e.g., 'READ_STUDENT')
 * @returns true if the role has this permission by default
 */
export function hasDefaultPermission(role: UserRole, permissionName: string): boolean {
    const rolePermissions = DEFAULT_ROLE_PERMISSIONS[role];

    if (!rolePermissions) {
        return false;
    }

    // Admin has wildcard (all permissions)
    if (rolePermissions.includes('*')) {
        return true;
    }

    return rolePermissions.includes(permissionName);
}

/**
 * Check if a role has default permission for a resource and action
 * @param role - User role to check
 * @param resource - Resource type (e.g., 'STUDENT')
 * @param action - Permission action (e.g., 'READ')
 * @returns true if the role has this permission by default
 */
export function hasDefaultResourcePermission(
    role: UserRole,
    resource: string,
    action: PermissionAction
): boolean {
    const permissionName = `${action}_${resource}`;
    return hasDefaultPermission(role, permissionName);
}

/**
 * Get all permission names for a specific role
 * @param role - User role
 * @returns Array of permission names
 */
export function getRoleDefaultPermissions(role: UserRole): string[] {
    return DEFAULT_ROLE_PERMISSIONS[role] || [];
}

/**
 * Get permission definition by name
 * @param name - Permission name
 * @returns Permission definition or undefined
 */
export function getPermissionDefinition(name: string): PermissionDefinition | undefined {
    return DEFAULT_PERMISSIONS.find(p => p.name === name);
}

/**
 * Get all permissions for a specific resource
 * @param resource - Resource type
 * @returns Array of permission definitions for that resource
 */
export function getResourcePermissions(resource: string): PermissionDefinition[] {
    return DEFAULT_PERMISSIONS.filter(p => p.resource === resource);
}

/**
 * Get all permissions for a specific category
 * @param category - Permission category
 * @returns Array of permission definitions for that category
 */
export function getCategoryPermissions(category: string): PermissionDefinition[] {
    return DEFAULT_PERMISSIONS.filter(p => p.category === category);
}
