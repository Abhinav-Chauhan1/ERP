/**
 * Example: User Management Page with Permission Checks
 * This demonstrates how to implement permissions at multiple layers
 * 
 * This is an EXAMPLE file showing best practices
 * DO NOT use this file directly - it's for reference only
 */

import { auth } from "@/auth";
import { hasPermission } from '@/lib/utils/permissions';
import { ServerPermissionGuard } from '@/components/auth/PermissionGuard';
import { Button } from '@/components/ui/button';

/**
 * Server Component - Page Level
 * Permissions are checked on the server for better performance and security
 */
export default async function UsersPageExample() {
  // Get authenticated user
  const session = await auth();
  const userId = session?.user?.id;
  
  if (!userId) {
    return <div>Unauthorized</div>;
  }
  
  // Check permissions in parallel for better performance
  const [canCreate, canUpdate, canDelete, canExport] = await Promise.all([
    hasPermission(userId, 'USER', 'CREATE'),
    hasPermission(userId, 'USER', 'UPDATE'),
    hasPermission(userId, 'USER', 'DELETE'),
    hasPermission(userId, 'USER', 'EXPORT'),
  ]);
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">User Management</h1>
        
        {/* Only show create button if user has permission */}
        <ServerPermissionGuard hasPermission={canCreate}>
          <Button>Create User</Button>
        </ServerPermissionGuard>
      </div>
      
      {/* Pass permissions to client component */}
      <UserListExample 
        userId={userId}
        canUpdate={canUpdate}
        canDelete={canDelete}
        canExport={canExport}
      />
    </div>
  );
}

/**
 * Client Component - List Level
 * Receives permission flags from server component
 */
'use client';

import { useState } from 'react';

interface UserListExampleProps {
  userId: string;
  canUpdate: boolean;
  canDelete: boolean;
  canExport: boolean;
}

function UserListExample({ userId, canUpdate, canDelete, canExport }: UserListExampleProps) {
  const [users, setUsers] = useState([
    { id: '1', name: 'John Doe', email: 'john@example.com', role: 'ADMIN' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'TEACHER' },
  ]);
  
  const handleEdit = async (userId: string) => {
    // Call server action (which also checks permissions)
    // const result = await updateUser(userId, data);
    console.log('Edit user:', userId);
  };
  
  const handleDelete = async (userId: string) => {
    // Call server action (which also checks permissions)
    // const result = await deleteUser(userId);
    console.log('Delete user:', userId);
  };
  
  const handleExport = async () => {
    // Call server action (which also checks permissions)
    // const result = await exportUsers();
    console.log('Export users');
  };
  
  return (
    <div>
      {/* Export button - only visible if user has permission */}
      {canExport && (
        <div className="mb-4">
          <Button onClick={handleExport} variant="outline">
            Export Users
          </Button>
        </div>
      )}
      
      {/* User list */}
      <div className="space-y-4">
        {users.map(user => (
          <div key={user.id} className="border p-4 rounded-lg flex justify-between items-center">
            <div>
              <h3 className="font-semibold">{user.name}</h3>
              <p className="text-sm text-gray-600">{user.email}</p>
              <p className="text-xs text-gray-500">{user.role}</p>
            </div>
            
            <div className="flex gap-2">
              {/* Edit button - only visible if user has permission */}
              {canUpdate && (
                <Button 
                  onClick={() => handleEdit(user.id)}
                  variant="outline"
                  size="sm"
                >
                  Edit
                </Button>
              )}
              
              {/* Delete button - only visible if user has permission */}
              {canDelete && (
                <Button 
                  onClick={() => handleDelete(user.id)}
                  variant="destructive"
                  size="sm"
                >
                  Delete
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Server Actions with Permission Checks
 * These would typically be in a separate file like src/lib/actions/userActions.ts
 */

'use server';

import { withPermission } from '@/lib/utils/permission-wrapper';
import { PermissionAction } from '@prisma/client';

export const updateUserExample = withPermission(
  'USER',
  'UPDATE' as PermissionAction,
  async (userId: string, data: any) => {
    try {
      // Your implementation here
      // Permission has already been checked by the wrapper
      
      // Update user in database
      // const updatedUser = await prisma.user.update({
      //   where: { id: userId },
      //   data,
      // });
      
      return {
        success: true,
        data: { message: 'User updated successfully' },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update user',
      };
    }
  }
);

export const deleteUserExample = withPermission(
  'USER',
  'DELETE' as PermissionAction,
  async (userId: string) => {
    try {
      // Your implementation here
      // Permission has already been checked by the wrapper
      
      // Additional business logic checks
      const session = await auth();
      const currentUserId = session?.user?.id;
      if (userId === currentUserId) {
        return {
          success: false,
          error: 'Cannot delete your own account',
        };
      }
      
      // Delete user from database
      // await prisma.user.delete({
      //   where: { id: userId },
      // });
      
      return {
        success: true,
        data: { message: 'User deleted successfully' },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete user',
      };
    }
  }
);

export const exportUsersExample = withPermission(
  'USER',
  'EXPORT' as PermissionAction,
  async () => {
    try {
      // Your implementation here
      // Permission has already been checked by the wrapper
      
      // Fetch users and generate export
      // const users = await prisma.user.findMany();
      // const csvData = generateCSV(users);
      
      return {
        success: true,
        data: { message: 'Users exported successfully' },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to export users',
      };
    }
  }
);
