/**
 * Permission-Aware Button Component
 * 
 * A button that automatically disables itself and shows a tooltip
 * when the user lacks the required permission.
 */

'use client';

import { ReactNode, useState, useEffect } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { PermissionAction } from '@prisma/client';
import { Loader2 } from 'lucide-react';

interface PermissionButtonProps extends Omit<ButtonProps, 'disabled'> {
    /** Resource to check permission for (e.g., 'STUDENT', 'FEE') */
    resource: string;
    /** Action to check permission for (e.g., 'CREATE', 'DELETE') */
    action: PermissionAction;
    /** User ID to check permissions for */
    userId: string;
    /** Content to display in the button */
    children: ReactNode;
    /** Custom message to show when permission is denied */
    deniedMessage?: string;
    /** Whether to show loading state while checking permissions */
    showLoading?: boolean;
    /** Fallback to show when permission is denied (instead of disabled button) */
    fallback?: ReactNode;
    /** Force disable the button regardless of permission */
    forceDisabled?: boolean;
}

/**
 * PermissionButton Component
 * 
 * Wraps a button with permission checking. If the user lacks the required
 * permission, the button is disabled and shows a tooltip explaining why.
 * 
 * @example
 * <PermissionButton
 *   resource="STUDENT"
 *   action="CREATE"
 *   userId={userId}
 *   onClick={handleCreate}
 * >
 *   Add Student
 * </PermissionButton>
 */
import { useUserPermissions } from '@/context/permissions-context';

export function PermissionButton({
    resource,
    action,
    userId,
    children,
    deniedMessage,
    showLoading = true,
    fallback,
    forceDisabled = false,
    ...buttonProps
}: PermissionButtonProps) {
    const permissions = useUserPermissions();
    const permissionName = `${action}_${resource}`;
    // Using explicit boolean conversion
    const hasPermission = permissions.includes(permissionName);
    const loading = false;

    // No effect needed as context is synchronous

    // Show loading state
    if (loading && showLoading) {
        return (
            <Button {...buttonProps} disabled>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {children}
            </Button>
        );
    }

    // If permission is granted and not force disabled
    if (hasPermission && !forceDisabled) {
        return <Button {...buttonProps}>{children}</Button>;
    }

    // If fallback is provided, show that instead of disabled button
    if (fallback) {
        return <>{fallback}</>;
    }

    // Show disabled button with tooltip
    const tooltipMessage = deniedMessage ||
        `You don't have permission to ${action.toLowerCase()} ${resource.toLowerCase()}`;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span tabIndex={0} className="inline-block">
                        <Button {...buttonProps} disabled className="pointer-events-none">
                            {children}
                        </Button>
                    </span>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{tooltipMessage}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

/**
 * Server-side Permission Button
 * Use this in Server Components when you already have the permission check result
 */
interface ServerPermissionButtonProps extends Omit<ButtonProps, 'disabled'> {
    /** Whether the user has permission (pre-computed on server) */
    hasPermission: boolean;
    /** Content to display in the button */
    children: ReactNode;
    /** Custom message to show when permission is denied */
    deniedMessage?: string;
    /** Fallback to show when permission is denied */
    fallback?: ReactNode;
}

export function ServerPermissionButton({
    hasPermission,
    children,
    deniedMessage = "You don't have permission for this action",
    fallback,
    ...buttonProps
}: ServerPermissionButtonProps) {
    if (hasPermission) {
        return <Button {...buttonProps}>{children}</Button>;
    }

    if (fallback) {
        return <>{fallback}</>;
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span tabIndex={0} className="inline-block">
                        <Button {...buttonProps} disabled className="pointer-events-none">
                            {children}
                        </Button>
                    </span>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{deniedMessage}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

/**
 * Hook to check if user has permission
 * Returns { hasPermission, loading, error }
 */
export function useHasPermission(
    userId: string,
    resource: string,
    action: PermissionAction
) {
    const [hasPermission, setHasPermission] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function checkPermission() {
            try {
                setLoading(true);
                const response = await fetch('/api/permissions/check', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        userId,
                        resource,
                        action,
                    }),
                });

                if (!response.ok) {
                    throw new Error('Failed to check permission');
                }

                const data = await response.json();
                setHasPermission(data.hasPermission || false);
            } catch (err) {
                console.error('Error checking permission:', err);
                setError(err instanceof Error ? err : new Error('Unknown error'));
                // On error, allow by default
                setHasPermission(true);
            } finally {
                setLoading(false);
            }
        }

        if (userId) {
            checkPermission();
        } else {
            setLoading(false);
            setHasPermission(false);
        }
    }, [userId, resource, action]);

    return { hasPermission, loading, error };
}
