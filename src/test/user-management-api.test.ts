import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET, POST, PATCH } from '@/app/api/super-admin/users/route';
import { GET as getUserById, PATCH as updateUser, DELETE as deleteUser } from '@/app/api/super-admin/users/[id]/route';
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { UserRole, SchoolStatus } from '@prisma/client';

// Mock dependencies
jest.mock('@/auth');
jest.mock('@/lib/db', () => ({
  db: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    school: {
      findUnique: jest.fn(),
    },
    userSchool: {
      findUnique: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  },
}));

jest.mock('@/lib/middleware/rate-limit', () => ({
  rateLimit: jest.fn().mockResolvedValue(null),
}));

jest.mock('@/lib/services/audit-service', () => ({
  logAuditEvent: jest.fn(),
}));

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockDb = db as any;

describe('User Management API', () => {
  const mockSuperAdminSession = {
    user: {
      id: 'super-admin-id',
      role: 'SUPER_ADMIN',
      email: 'admin@example.com',
    },
  };

  const mockSchool = {
    id: 'school-1',
    name: 'Test School',
    schoolCode: 'TEST001',
    status: SchoolStatus.ACTIVE,
  };

  const mockUser = {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    mobile: '+1234567890',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLoginAt: new Date(),
    passwordHash: 'hashed-password',
    userSchools: [
      {
        id: 'us-1',
        schoolId: 'school-1',
        role: UserRole.STUDENT,
        isActive: true,
        createdAt: new Date(),
        school: mockSchool,
      },
    ],
    _count: {
      userSchools: 1,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue(mockSuperAdminSession);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('GET /api/super-admin/users', () => {
    it('should return users with search and filtering', async () => {
      const mockUsers = [mockUser];
      mockDb.user.findMany.mockResolvedValue(mockUsers);
      mockDb.user.count.mockResolvedValue(1);

      const request = new NextRequest('http://localhost/api/super-admin/users?search=john&role=STUDENT');
      const response = await GET(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data.users).toHaveLength(1);
      expect(result.data.users[0].name).toBe('John Doe');
      expect(result.data.pagination.total).toBe(1);
    });

    it('should return 401 for non-super-admin users', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      });

      const request = new NextRequest('http://localhost/api/super-admin/users');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should handle search parameters correctly', async () => {
      mockDb.user.findMany.mockResolvedValue([]);
      mockDb.user.count.mockResolvedValue(0);

      const request = new NextRequest('http://localhost/api/super-admin/users?search=test&status=active&schoolId=school-1');
      await GET(request);

      expect(mockDb.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { name: { contains: 'test', mode: 'insensitive' } },
              { email: { contains: 'test', mode: 'insensitive' } },
            ]),
            isActive: true,
            userSchools: {
              some: {
                schoolId: 'school-1',
              },
            },
          }),
        })
      );
    });
  });

  describe('POST /api/super-admin/users', () => {
    const validUserData = {
      name: 'Jane Doe',
      email: 'jane@example.com',
      mobile: '+1987654321',
      password: 'password123',
      role: 'TEACHER',
      schoolId: 'school-1',
      isActive: true,
    };

    it('should create a new user successfully', async () => {
      mockDb.school.findUnique.mockResolvedValue(mockSchool);
      mockDb.user.findFirst.mockResolvedValue(null); // No existing user
      mockDb.user.create.mockResolvedValue({
        id: 'new-user-id',
        ...validUserData,
        passwordHash: 'hashed-password',
      });
      mockDb.userSchool.create.mockResolvedValue({
        id: 'us-new',
        userId: 'new-user-id',
        schoolId: 'school-1',
        role: UserRole.TEACHER,
        school: mockSchool,
      });

      const request = new NextRequest('http://localhost/api/super-admin/users', {
        method: 'POST',
        body: JSON.stringify(validUserData),
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(201);
      expect(result.success).toBe(true);
      expect(result.data.user.name).toBe('Jane Doe');
      expect(result.data.schoolAssociation.role).toBe('TEACHER');
    });

    it('should associate existing user with new school', async () => {
      const existingUser = {
        id: 'existing-user-id',
        email: 'jane@example.com',
        name: 'Jane Doe',
      };

      mockDb.school.findUnique.mockResolvedValue(mockSchool);
      mockDb.user.findFirst.mockResolvedValue(existingUser);
      mockDb.userSchool.findUnique.mockResolvedValue(null); // No existing association
      mockDb.userSchool.create.mockResolvedValue({
        id: 'us-new',
        userId: 'existing-user-id',
        schoolId: 'school-1',
        role: UserRole.TEACHER,
        school: mockSchool,
      });

      const request = new NextRequest('http://localhost/api/super-admin/users', {
        method: 'POST',
        body: JSON.stringify(validUserData),
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(201);
      expect(result.success).toBe(true);
      expect(result.message).toContain('associated with school');
    });

    it('should return 400 for invalid school', async () => {
      mockDb.school.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/super-admin/users', {
        method: 'POST',
        body: JSON.stringify(validUserData),
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(404);
      expect(result.error).toBe('School not found');
    });

    it('should return 400 for inactive school', async () => {
      mockDb.school.findUnique.mockResolvedValue({
        ...mockSchool,
        status: SchoolStatus.SUSPENDED,
      });

      const request = new NextRequest('http://localhost/api/super-admin/users', {
        method: 'POST',
        body: JSON.stringify(validUserData),
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toBe('Cannot add users to inactive school');
    });

    it('should return 400 for existing user-school association', async () => {
      const existingUser = {
        id: 'existing-user-id',
        email: 'jane@example.com',
      };

      mockDb.school.findUnique.mockResolvedValue(mockSchool);
      mockDb.user.findFirst.mockResolvedValue(existingUser);
      mockDb.userSchool.findUnique.mockResolvedValue({
        id: 'existing-association',
      });

      const request = new NextRequest('http://localhost/api/super-admin/users', {
        method: 'POST',
        body: JSON.stringify(validUserData),
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toBe('User is already associated with this school');
    });
  });

  describe('PATCH /api/super-admin/users (bulk operations)', () => {
    const bulkActionData = {
      userIds: ['user-1', 'user-2'],
      action: 'activate',
    };

    it('should perform bulk activate operation', async () => {
      const mockUsers = [
        { id: 'user-1', name: 'User 1', isActive: false },
        { id: 'user-2', name: 'User 2', isActive: false },
      ];

      mockDb.user.findMany.mockResolvedValue(mockUsers);
      mockDb.user.update.mockResolvedValue({});
      mockDb.userSchool.updateMany.mockResolvedValue({});

      const request = new NextRequest('http://localhost/api/super-admin/users', {
        method: 'PATCH',
        body: JSON.stringify(bulkActionData),
      });

      const response = await PATCH(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data.success).toBe(2);
      expect(result.data.failed).toBe(0);
    });

    it('should handle bulk deactivate operation', async () => {
      const deactivateData = {
        ...bulkActionData,
        action: 'deactivate',
      };

      const mockUsers = [
        { id: 'user-1', name: 'User 1', isActive: true },
        { id: 'user-2', name: 'User 2', isActive: true },
      ];

      mockDb.user.findMany.mockResolvedValue(mockUsers);
      mockDb.user.update.mockResolvedValue({});
      mockDb.userSchool.updateMany.mockResolvedValue({});

      const request = new NextRequest('http://localhost/api/super-admin/users', {
        method: 'PATCH',
        body: JSON.stringify(deactivateData),
      });

      const response = await PATCH(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data.success).toBe(2);
    });

    it('should handle missing users in bulk operation', async () => {
      const bulkActionWithMissingUsers = {
        userIds: ['user-1', 'missing-user', 'user-2'],
        action: 'activate',
      };

      const mockUsers = [
        { id: 'user-1', name: 'User 1', isActive: false },
        { id: 'user-2', name: 'User 2', isActive: false },
      ];

      mockDb.user.findMany.mockResolvedValue(mockUsers);
      mockDb.user.update.mockResolvedValue({});
      mockDb.userSchool.updateMany.mockResolvedValue({});

      const request = new NextRequest('http://localhost/api/super-admin/users', {
        method: 'PATCH',
        body: JSON.stringify(bulkActionWithMissingUsers),
      });

      const response = await PATCH(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.data.success).toBe(2);
      expect(result.data.failed).toBe(1);
      expect(result.data.errors).toHaveLength(1);
      expect(result.data.errors[0].userId).toBe('missing-user');
    });
  });

  describe('GET /api/super-admin/users/[id]', () => {
    it('should return user details successfully', async () => {
      mockDb.user.findUnique.mockResolvedValue({
        ...mockUser,
        auditLogs: [],
      });

      const request = new NextRequest('http://localhost/api/super-admin/users/user-1');
      const response = await getUserById(request, { params: Promise.resolve({ id: 'user-1' }) });
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data.id).toBe('user-1');
      expect(result.data.name).toBe('John Doe');
      expect(result.data.schools).toHaveLength(1);
    });

    it('should return 404 for non-existent user', async () => {
      mockDb.user.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/super-admin/users/non-existent');
      const response = await getUserById(request, { params: Promise.resolve({ id: 'non-existent' }) });

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/super-admin/users/[id]', () => {
    const updateData = {
      name: 'Updated Name',
      email: 'updated@example.com',
      isActive: false,
    };

    it('should update user successfully', async () => {
      mockDb.user.findUnique.mockResolvedValue(mockUser);
      mockDb.user.findFirst.mockResolvedValue(null); // No conflicts
      mockDb.user.update.mockResolvedValue({
        ...mockUser,
        ...updateData,
      });
      mockDb.userSchool.updateMany.mockResolvedValue({});

      const request = new NextRequest('http://localhost/api/super-admin/users/user-1', {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      });

      const response = await updateUser(request, { params: Promise.resolve({ id: 'user-1' }) });
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Updated Name');
    });

    it('should return 400 for email conflict', async () => {
      mockDb.user.findUnique.mockResolvedValue(mockUser);
      mockDb.user.findFirst.mockResolvedValue({
        id: 'other-user',
        email: 'updated@example.com',
      });

      const request = new NextRequest('http://localhost/api/super-admin/users/user-1', {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      });

      const response = await updateUser(request, { params: Promise.resolve({ id: 'user-1' }) });
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toBe('Email or mobile number already exists');
    });
  });

  describe('DELETE /api/super-admin/users/[id]', () => {
    it('should delete user successfully', async () => {
      const userToDelete = {
        ...mockUser,
        _count: { userSchools: 1, auditLogs: 0 },
      };

      mockDb.user.findUnique.mockResolvedValue(userToDelete);
      mockDb.user.delete.mockResolvedValue({});

      const request = new NextRequest('http://localhost/api/super-admin/users/user-1');
      const response = await deleteUser(request, { params: Promise.resolve({ id: 'user-1' }) });
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.message).toBe('User deleted successfully');
    });

    it('should return 400 for user with multiple schools', async () => {
      const userWithMultipleSchools = {
        ...mockUser,
        _count: { userSchools: 2, auditLogs: 0 },
      };

      mockDb.user.findUnique.mockResolvedValue(userWithMultipleSchools);

      const request = new NextRequest('http://localhost/api/super-admin/users/user-1');
      const response = await deleteUser(request, { params: Promise.resolve({ id: 'user-1' }) });
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toContain('multiple schools');
    });

    it('should return 400 for super admin user', async () => {
      const superAdminUser = {
        ...mockUser,
        userSchools: [
          {
            ...mockUser.userSchools[0],
            role: UserRole.SUPER_ADMIN,
          },
        ],
        _count: { userSchools: 1, auditLogs: 0 },
      };

      mockDb.user.findUnique.mockResolvedValue(superAdminUser);

      const request = new NextRequest('http://localhost/api/super-admin/users/user-1');
      const response = await deleteUser(request, { params: Promise.resolve({ id: 'user-1' }) });
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toBe('Cannot delete super admin users');
    });
  });
});