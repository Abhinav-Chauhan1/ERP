import { PrismaClient, PermissionAction, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed script for Permission-Based Access Control System
 * This script creates default permissions and assigns them to roles
 */

// Define permission categories
const PERMISSION_CATEGORIES = {
  USER_MANAGEMENT: 'USER_MANAGEMENT',
  ACADEMIC: 'ACADEMIC',
  FINANCE: 'FINANCE',
  COMMUNICATION: 'COMMUNICATION',
  LIBRARY: 'LIBRARY',
  TRANSPORT: 'TRANSPORT',
  ADMISSION: 'ADMISSION',
  REPORTS: 'REPORTS',
  SYSTEM: 'SYSTEM',
};

// Define resources
const RESOURCES = {
  USER: 'USER',
  STUDENT: 'STUDENT',
  TEACHER: 'TEACHER',
  PARENT: 'PARENT',
  CLASS: 'CLASS',
  SUBJECT: 'SUBJECT',
  EXAM: 'EXAM',
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
  APPLICATION: 'APPLICATION',
  CERTIFICATE: 'CERTIFICATE',
  BACKUP: 'BACKUP',
  SETTINGS: 'SETTINGS',
};

// Define all permissions
const PERMISSIONS = [
  // User Management
  { name: 'CREATE_USER', resource: RESOURCES.USER, action: PermissionAction.CREATE, category: PERMISSION_CATEGORIES.USER_MANAGEMENT, description: 'Create new users' },
  { name: 'READ_USER', resource: RESOURCES.USER, action: PermissionAction.READ, category: PERMISSION_CATEGORIES.USER_MANAGEMENT, description: 'View user details' },
  { name: 'UPDATE_USER', resource: RESOURCES.USER, action: PermissionAction.UPDATE, category: PERMISSION_CATEGORIES.USER_MANAGEMENT, description: 'Update user information' },
  { name: 'DELETE_USER', resource: RESOURCES.USER, action: PermissionAction.DELETE, category: PERMISSION_CATEGORIES.USER_MANAGEMENT, description: 'Delete users' },
  { name: 'EXPORT_USER', resource: RESOURCES.USER, action: PermissionAction.EXPORT, category: PERMISSION_CATEGORIES.USER_MANAGEMENT, description: 'Export user data' },
  { name: 'IMPORT_USER', resource: RESOURCES.USER, action: PermissionAction.IMPORT, category: PERMISSION_CATEGORIES.USER_MANAGEMENT, description: 'Import user data' },

  // Student Management
  { name: 'CREATE_STUDENT', resource: RESOURCES.STUDENT, action: PermissionAction.CREATE, category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Create new students' },
  { name: 'READ_STUDENT', resource: RESOURCES.STUDENT, action: PermissionAction.READ, category: PERMISSION_CATEGORIES.ACADEMIC, description: 'View student details' },
  { name: 'UPDATE_STUDENT', resource: RESOURCES.STUDENT, action: PermissionAction.UPDATE, category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Update student information' },
  { name: 'DELETE_STUDENT', resource: RESOURCES.STUDENT, action: PermissionAction.DELETE, category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Delete students' },
  { name: 'EXPORT_STUDENT', resource: RESOURCES.STUDENT, action: PermissionAction.EXPORT, category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Export student data' },
  { name: 'IMPORT_STUDENT', resource: RESOURCES.STUDENT, action: PermissionAction.IMPORT, category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Import student data' },

  // Teacher Management
  { name: 'CREATE_TEACHER', resource: RESOURCES.TEACHER, action: PermissionAction.CREATE, category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Create new teachers' },
  { name: 'READ_TEACHER', resource: RESOURCES.TEACHER, action: PermissionAction.READ, category: PERMISSION_CATEGORIES.ACADEMIC, description: 'View teacher details' },
  { name: 'UPDATE_TEACHER', resource: RESOURCES.TEACHER, action: PermissionAction.UPDATE, category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Update teacher information' },
  { name: 'DELETE_TEACHER', resource: RESOURCES.TEACHER, action: PermissionAction.DELETE, category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Delete teachers' },
  { name: 'EXPORT_TEACHER', resource: RESOURCES.TEACHER, action: PermissionAction.EXPORT, category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Export teacher data' },

  // Parent Management
  { name: 'CREATE_PARENT', resource: RESOURCES.PARENT, action: PermissionAction.CREATE, category: PERMISSION_CATEGORIES.USER_MANAGEMENT, description: 'Create new parents' },
  { name: 'READ_PARENT', resource: RESOURCES.PARENT, action: PermissionAction.READ, category: PERMISSION_CATEGORIES.USER_MANAGEMENT, description: 'View parent details' },
  { name: 'UPDATE_PARENT', resource: RESOURCES.PARENT, action: PermissionAction.UPDATE, category: PERMISSION_CATEGORIES.USER_MANAGEMENT, description: 'Update parent information' },
  { name: 'DELETE_PARENT', resource: RESOURCES.PARENT, action: PermissionAction.DELETE, category: PERMISSION_CATEGORIES.USER_MANAGEMENT, description: 'Delete parents' },

  // Class Management
  { name: 'CREATE_CLASS', resource: RESOURCES.CLASS, action: PermissionAction.CREATE, category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Create new classes' },
  { name: 'READ_CLASS', resource: RESOURCES.CLASS, action: PermissionAction.READ, category: PERMISSION_CATEGORIES.ACADEMIC, description: 'View class details' },
  { name: 'UPDATE_CLASS', resource: RESOURCES.CLASS, action: PermissionAction.UPDATE, category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Update class information' },
  { name: 'DELETE_CLASS', resource: RESOURCES.CLASS, action: PermissionAction.DELETE, category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Delete classes' },

  // Subject Management
  { name: 'CREATE_SUBJECT', resource: RESOURCES.SUBJECT, action: PermissionAction.CREATE, category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Create new subjects' },
  { name: 'READ_SUBJECT', resource: RESOURCES.SUBJECT, action: PermissionAction.READ, category: PERMISSION_CATEGORIES.ACADEMIC, description: 'View subject details' },
  { name: 'UPDATE_SUBJECT', resource: RESOURCES.SUBJECT, action: PermissionAction.UPDATE, category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Update subject information' },
  { name: 'DELETE_SUBJECT', resource: RESOURCES.SUBJECT, action: PermissionAction.DELETE, category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Delete subjects' },

  // Exam Management
  { name: 'CREATE_EXAM', resource: RESOURCES.EXAM, action: PermissionAction.CREATE, category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Create new exams' },
  { name: 'READ_EXAM', resource: RESOURCES.EXAM, action: PermissionAction.READ, category: PERMISSION_CATEGORIES.ACADEMIC, description: 'View exam details' },
  { name: 'UPDATE_EXAM', resource: RESOURCES.EXAM, action: PermissionAction.UPDATE, category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Update exam information' },
  { name: 'DELETE_EXAM', resource: RESOURCES.EXAM, action: PermissionAction.DELETE, category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Delete exams' },
  { name: 'PUBLISH_EXAM', resource: RESOURCES.EXAM, action: PermissionAction.PUBLISH, category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Publish exam results' },

  // Assignment Management
  { name: 'CREATE_ASSIGNMENT', resource: RESOURCES.ASSIGNMENT, action: PermissionAction.CREATE, category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Create new assignments' },
  { name: 'READ_ASSIGNMENT', resource: RESOURCES.ASSIGNMENT, action: PermissionAction.READ, category: PERMISSION_CATEGORIES.ACADEMIC, description: 'View assignment details' },
  { name: 'UPDATE_ASSIGNMENT', resource: RESOURCES.ASSIGNMENT, action: PermissionAction.UPDATE, category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Update assignment information' },
  { name: 'DELETE_ASSIGNMENT', resource: RESOURCES.ASSIGNMENT, action: PermissionAction.DELETE, category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Delete assignments' },

  // Attendance Management
  { name: 'CREATE_ATTENDANCE', resource: RESOURCES.ATTENDANCE, action: PermissionAction.CREATE, category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Mark attendance' },
  { name: 'READ_ATTENDANCE', resource: RESOURCES.ATTENDANCE, action: PermissionAction.READ, category: PERMISSION_CATEGORIES.ACADEMIC, description: 'View attendance records' },
  { name: 'UPDATE_ATTENDANCE', resource: RESOURCES.ATTENDANCE, action: PermissionAction.UPDATE, category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Update attendance records' },
  { name: 'EXPORT_ATTENDANCE', resource: RESOURCES.ATTENDANCE, action: PermissionAction.EXPORT, category: PERMISSION_CATEGORIES.ACADEMIC, description: 'Export attendance data' },

  // Fee Management
  { name: 'CREATE_FEE', resource: RESOURCES.FEE, action: PermissionAction.CREATE, category: PERMISSION_CATEGORIES.FINANCE, description: 'Create fee structures' },
  { name: 'READ_FEE', resource: RESOURCES.FEE, action: PermissionAction.READ, category: PERMISSION_CATEGORIES.FINANCE, description: 'View fee details' },
  { name: 'UPDATE_FEE', resource: RESOURCES.FEE, action: PermissionAction.UPDATE, category: PERMISSION_CATEGORIES.FINANCE, description: 'Update fee structures' },
  { name: 'DELETE_FEE', resource: RESOURCES.FEE, action: PermissionAction.DELETE, category: PERMISSION_CATEGORIES.FINANCE, description: 'Delete fee structures' },

  // Payment Management
  { name: 'CREATE_PAYMENT', resource: RESOURCES.PAYMENT, action: PermissionAction.CREATE, category: PERMISSION_CATEGORIES.FINANCE, description: 'Record payments' },
  { name: 'READ_PAYMENT', resource: RESOURCES.PAYMENT, action: PermissionAction.READ, category: PERMISSION_CATEGORIES.FINANCE, description: 'View payment records' },
  { name: 'UPDATE_PAYMENT', resource: RESOURCES.PAYMENT, action: PermissionAction.UPDATE, category: PERMISSION_CATEGORIES.FINANCE, description: 'Update payment records' },
  { name: 'DELETE_PAYMENT', resource: RESOURCES.PAYMENT, action: PermissionAction.DELETE, category: PERMISSION_CATEGORIES.FINANCE, description: 'Delete payment records' },
  { name: 'APPROVE_PAYMENT', resource: RESOURCES.PAYMENT, action: PermissionAction.APPROVE, category: PERMISSION_CATEGORIES.FINANCE, description: 'Approve payments' },
  { name: 'EXPORT_PAYMENT', resource: RESOURCES.PAYMENT, action: PermissionAction.EXPORT, category: PERMISSION_CATEGORIES.FINANCE, description: 'Export payment data' },

  // Communication
  { name: 'CREATE_ANNOUNCEMENT', resource: RESOURCES.ANNOUNCEMENT, action: PermissionAction.CREATE, category: PERMISSION_CATEGORIES.COMMUNICATION, description: 'Create announcements' },
  { name: 'READ_ANNOUNCEMENT', resource: RESOURCES.ANNOUNCEMENT, action: PermissionAction.READ, category: PERMISSION_CATEGORIES.COMMUNICATION, description: 'View announcements' },
  { name: 'UPDATE_ANNOUNCEMENT', resource: RESOURCES.ANNOUNCEMENT, action: PermissionAction.UPDATE, category: PERMISSION_CATEGORIES.COMMUNICATION, description: 'Update announcements' },
  { name: 'DELETE_ANNOUNCEMENT', resource: RESOURCES.ANNOUNCEMENT, action: PermissionAction.DELETE, category: PERMISSION_CATEGORIES.COMMUNICATION, description: 'Delete announcements' },
  { name: 'PUBLISH_ANNOUNCEMENT', resource: RESOURCES.ANNOUNCEMENT, action: PermissionAction.PUBLISH, category: PERMISSION_CATEGORIES.COMMUNICATION, description: 'Publish announcements' },

  { name: 'CREATE_MESSAGE', resource: RESOURCES.MESSAGE, action: PermissionAction.CREATE, category: PERMISSION_CATEGORIES.COMMUNICATION, description: 'Send messages' },
  { name: 'READ_MESSAGE', resource: RESOURCES.MESSAGE, action: PermissionAction.READ, category: PERMISSION_CATEGORIES.COMMUNICATION, description: 'Read messages' },
  { name: 'DELETE_MESSAGE', resource: RESOURCES.MESSAGE, action: PermissionAction.DELETE, category: PERMISSION_CATEGORIES.COMMUNICATION, description: 'Delete messages' },

  // Document Management
  { name: 'CREATE_DOCUMENT', resource: RESOURCES.DOCUMENT, action: PermissionAction.CREATE, category: PERMISSION_CATEGORIES.SYSTEM, description: 'Upload documents' },
  { name: 'READ_DOCUMENT', resource: RESOURCES.DOCUMENT, action: PermissionAction.READ, category: PERMISSION_CATEGORIES.SYSTEM, description: 'View documents' },
  { name: 'UPDATE_DOCUMENT', resource: RESOURCES.DOCUMENT, action: PermissionAction.UPDATE, category: PERMISSION_CATEGORIES.SYSTEM, description: 'Update documents' },
  { name: 'DELETE_DOCUMENT', resource: RESOURCES.DOCUMENT, action: PermissionAction.DELETE, category: PERMISSION_CATEGORIES.SYSTEM, description: 'Delete documents' },

  // Reports
  { name: 'CREATE_REPORT', resource: RESOURCES.REPORT, action: PermissionAction.CREATE, category: PERMISSION_CATEGORIES.REPORTS, description: 'Create reports' },
  { name: 'READ_REPORT', resource: RESOURCES.REPORT, action: PermissionAction.READ, category: PERMISSION_CATEGORIES.REPORTS, description: 'View reports' },
  { name: 'EXPORT_REPORT', resource: RESOURCES.REPORT, action: PermissionAction.EXPORT, category: PERMISSION_CATEGORIES.REPORTS, description: 'Export reports' },

  // Library Management
  { name: 'CREATE_BOOK', resource: RESOURCES.BOOK, action: PermissionAction.CREATE, category: PERMISSION_CATEGORIES.LIBRARY, description: 'Add books to library' },
  { name: 'READ_BOOK', resource: RESOURCES.BOOK, action: PermissionAction.READ, category: PERMISSION_CATEGORIES.LIBRARY, description: 'View book details' },
  { name: 'UPDATE_BOOK', resource: RESOURCES.BOOK, action: PermissionAction.UPDATE, category: PERMISSION_CATEGORIES.LIBRARY, description: 'Update book information' },
  { name: 'DELETE_BOOK', resource: RESOURCES.BOOK, action: PermissionAction.DELETE, category: PERMISSION_CATEGORIES.LIBRARY, description: 'Delete books' },

  // Transport Management
  { name: 'CREATE_VEHICLE', resource: RESOURCES.VEHICLE, action: PermissionAction.CREATE, category: PERMISSION_CATEGORIES.TRANSPORT, description: 'Add vehicles' },
  { name: 'READ_VEHICLE', resource: RESOURCES.VEHICLE, action: PermissionAction.READ, category: PERMISSION_CATEGORIES.TRANSPORT, description: 'View vehicle details' },
  { name: 'UPDATE_VEHICLE', resource: RESOURCES.VEHICLE, action: PermissionAction.UPDATE, category: PERMISSION_CATEGORIES.TRANSPORT, description: 'Update vehicle information' },
  { name: 'DELETE_VEHICLE', resource: RESOURCES.VEHICLE, action: PermissionAction.DELETE, category: PERMISSION_CATEGORIES.TRANSPORT, description: 'Delete vehicles' },

  { name: 'CREATE_ROUTE', resource: RESOURCES.ROUTE, action: PermissionAction.CREATE, category: PERMISSION_CATEGORIES.TRANSPORT, description: 'Create routes' },
  { name: 'READ_ROUTE', resource: RESOURCES.ROUTE, action: PermissionAction.READ, category: PERMISSION_CATEGORIES.TRANSPORT, description: 'View route details' },
  { name: 'UPDATE_ROUTE', resource: RESOURCES.ROUTE, action: PermissionAction.UPDATE, category: PERMISSION_CATEGORIES.TRANSPORT, description: 'Update route information' },
  { name: 'DELETE_ROUTE', resource: RESOURCES.ROUTE, action: PermissionAction.DELETE, category: PERMISSION_CATEGORIES.TRANSPORT, description: 'Delete routes' },

  // Admission Management
  { name: 'CREATE_APPLICATION', resource: RESOURCES.APPLICATION, action: PermissionAction.CREATE, category: PERMISSION_CATEGORIES.ADMISSION, description: 'Create admission applications' },
  { name: 'READ_APPLICATION', resource: RESOURCES.APPLICATION, action: PermissionAction.READ, category: PERMISSION_CATEGORIES.ADMISSION, description: 'View admission applications' },
  { name: 'UPDATE_APPLICATION', resource: RESOURCES.APPLICATION, action: PermissionAction.UPDATE, category: PERMISSION_CATEGORIES.ADMISSION, description: 'Update admission applications' },
  { name: 'DELETE_APPLICATION', resource: RESOURCES.APPLICATION, action: PermissionAction.DELETE, category: PERMISSION_CATEGORIES.ADMISSION, description: 'Delete admission applications' },
  { name: 'APPROVE_APPLICATION', resource: RESOURCES.APPLICATION, action: PermissionAction.APPROVE, category: PERMISSION_CATEGORIES.ADMISSION, description: 'Approve admission applications' },
  { name: 'REJECT_APPLICATION', resource: RESOURCES.APPLICATION, action: PermissionAction.REJECT, category: PERMISSION_CATEGORIES.ADMISSION, description: 'Reject admission applications' },

  // Certificate Management
  { name: 'CREATE_CERTIFICATE', resource: RESOURCES.CERTIFICATE, action: PermissionAction.CREATE, category: PERMISSION_CATEGORIES.SYSTEM, description: 'Generate certificates' },
  { name: 'READ_CERTIFICATE', resource: RESOURCES.CERTIFICATE, action: PermissionAction.READ, category: PERMISSION_CATEGORIES.SYSTEM, description: 'View certificates' },
  { name: 'UPDATE_CERTIFICATE', resource: RESOURCES.CERTIFICATE, action: PermissionAction.UPDATE, category: PERMISSION_CATEGORIES.SYSTEM, description: 'Update certificates' },
  { name: 'DELETE_CERTIFICATE', resource: RESOURCES.CERTIFICATE, action: PermissionAction.DELETE, category: PERMISSION_CATEGORIES.SYSTEM, description: 'Delete certificates' },

  // Backup Management
  { name: 'CREATE_BACKUP', resource: RESOURCES.BACKUP, action: PermissionAction.CREATE, category: PERMISSION_CATEGORIES.SYSTEM, description: 'Create backups' },
  { name: 'READ_BACKUP', resource: RESOURCES.BACKUP, action: PermissionAction.READ, category: PERMISSION_CATEGORIES.SYSTEM, description: 'View backup details' },
  { name: 'DELETE_BACKUP', resource: RESOURCES.BACKUP, action: PermissionAction.DELETE, category: PERMISSION_CATEGORIES.SYSTEM, description: 'Delete backups' },

  // System Settings
  { name: 'READ_SETTINGS', resource: RESOURCES.SETTINGS, action: PermissionAction.READ, category: PERMISSION_CATEGORIES.SYSTEM, description: 'View system settings' },
  { name: 'UPDATE_SETTINGS', resource: RESOURCES.SETTINGS, action: PermissionAction.UPDATE, category: PERMISSION_CATEGORIES.SYSTEM, description: 'Update system settings' },
];

// Define role-permission mappings
const ROLE_PERMISSIONS = {
  [UserRole.ADMIN]: [
    // Admins have all permissions
    ...PERMISSIONS.map(p => p.name),
  ],
  [UserRole.TEACHER]: [
    // Teachers can manage their classes and students
    'READ_USER',
    'READ_STUDENT',
    'EXPORT_STUDENT',
    'READ_TEACHER',
    'READ_PARENT',
    'READ_CLASS',
    'READ_SUBJECT',
    'CREATE_EXAM',
    'READ_EXAM',
    'UPDATE_EXAM',
    'DELETE_EXAM',
    'PUBLISH_EXAM',
    'CREATE_ASSIGNMENT',
    'READ_ASSIGNMENT',
    'UPDATE_ASSIGNMENT',
    'DELETE_ASSIGNMENT',
    'CREATE_ATTENDANCE',
    'READ_ATTENDANCE',
    'UPDATE_ATTENDANCE',
    'EXPORT_ATTENDANCE',
    'READ_FEE',
    'READ_PAYMENT',
    'CREATE_ANNOUNCEMENT',
    'READ_ANNOUNCEMENT',
    'CREATE_MESSAGE',
    'READ_MESSAGE',
    'DELETE_MESSAGE',
    'CREATE_DOCUMENT',
    'READ_DOCUMENT',
    'UPDATE_DOCUMENT',
    'DELETE_DOCUMENT',
    'CREATE_REPORT',
    'READ_REPORT',
    'EXPORT_REPORT',
    'READ_BOOK',
  ],
  [UserRole.STUDENT]: [
    // Students can view their own data
    'READ_STUDENT',
    'READ_CLASS',
    'READ_SUBJECT',
    'READ_EXAM',
    'READ_ASSIGNMENT',
    'READ_ATTENDANCE',
    'READ_FEE',
    'READ_PAYMENT',
    'READ_ANNOUNCEMENT',
    'CREATE_MESSAGE',
    'READ_MESSAGE',
    'DELETE_MESSAGE',
    'READ_DOCUMENT',
    'READ_BOOK',
    'READ_CERTIFICATE',
  ],
  [UserRole.PARENT]: [
    // Parents can view their children's data
    'READ_STUDENT',
    'READ_CLASS',
    'READ_SUBJECT',
    'READ_EXAM',
    'READ_ASSIGNMENT',
    'READ_ATTENDANCE',
    'READ_FEE',
    'READ_PAYMENT',
    'CREATE_PAYMENT',
    'READ_ANNOUNCEMENT',
    'CREATE_MESSAGE',
    'READ_MESSAGE',
    'DELETE_MESSAGE',
    'READ_DOCUMENT',
  ],
};

async function seedPermissions() {
  console.log('🔐 Starting permission system seeding...');

  // Clear existing permissions
  console.log('🧹 Cleaning existing permissions...');
  await prisma.userPermission.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();

  // Create permissions
  console.log('📝 Creating permissions...');
  const createdPermissions = new Map<string, string>();

  for (const permission of PERMISSIONS) {
    const created = await prisma.permission.create({
      data: permission,
    });
    createdPermissions.set(permission.name, created.id);
    console.log(`  ✓ Created permission: ${permission.name}`);
  }

  // Assign permissions to roles
  console.log('🎭 Assigning permissions to roles...');
  for (const [role, permissionNames] of Object.entries(ROLE_PERMISSIONS)) {
    for (const permissionName of permissionNames) {
      const permissionId = createdPermissions.get(permissionName);
      if (permissionId) {
        await prisma.rolePermission.create({
          data: {
            role: role as UserRole,
            permissionId,
            isDefault: true,
          },
        });
      }
    }
    console.log(`  ✓ Assigned ${permissionNames.length} permissions to ${role}`);
  }

  console.log('✅ Permission system seeding completed!');
  console.log(`   Total permissions created: ${PERMISSIONS.length}`);
  console.log(`   Total role-permission mappings: ${Object.values(ROLE_PERMISSIONS).flat().length}`);
}

async function main() {
  try {
    await seedPermissions();
  } catch (error) {
    console.error('❌ Error seeding permissions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
