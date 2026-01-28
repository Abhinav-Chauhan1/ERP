'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChildSelection } from '@/components/auth/child-selection';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';

/**
 * Child Selection Page
 * 
 * Standalone page for parents with multiple children to select active child context.
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

interface Child {
  id: string;
  name: string;
  class?: string;
  section?: string;
}

export default function SelectChildPage() {
  const router = useRouter();
  const [children, setChildren] = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Get available children from session context service
    const loadAvailableChildren = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          router.push('/login');
          return;
        }

        // Call API to get parent's children
        const response = await fetch('/api/auth/parent/children', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to load children');
        }

        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to load children');
        }

        setChildren(data.children || []);
      } catch (error) {
        console.error('Error loading children:', error);
        setError('Failed to load available children');
      } finally {
        setIsLoading(false);
      }
    };

    loadAvailableChildren();
  }, [router]);

  const handleChildSelect = async (childId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/auth/context/switch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newStudentId: childId,
          token
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to switch child context');
      }

      // Redirect to the provided URL
      if (data.redirectUrl) {
        router.push(data.redirectUrl);
        router.refresh();
      }
    } catch (error: any) {
      throw error; // Re-throw to be handled by ChildSelection component
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading your children...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <ChildSelection children={children} onChildSelect={handleChildSelect} />
    </div>
  );
}