"use client";

import { ReactNode } from "react";
import { authClient } from "@/utils/auth-client";
import { PermissionMap, RoleType } from "@/utils/permissions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

interface PermissionGuardProps {
  children: ReactNode;
  permissions?: PermissionMap;
  role?: RoleType;
  fallback?: ReactNode;
  requireAll?: boolean; // If true, user must have ALL permissions. If false, user needs ANY permission
}

function DefaultPermissionFallback() {
  return (
    <div className="flex h-[60vh] items-center justify-center px-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full border bg-muted">
            <span aria-hidden>🔒</span>
          </div>
          <CardTitle>Access denied</CardTitle>
          <CardDescription>
            You don&apos;t have permission to view this page.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          If you think this is a mistake, try signing in with a different account
          or contact your administrator to request access.
        </CardContent>
        <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild variant="default">
            <Link href="/">Go home</Link>
          </Button>
          <Button variant="outline" onClick={() => window.history.back()}>
            Go back
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export function PermissionGuard({
  children,
  permissions,
  role,
  fallback = null,
  requireAll = false,
}: PermissionGuardProps) {
  const { data: session } = authClient.useSession();
  const renderedFallback = fallback ?? <DefaultPermissionFallback />;

  // If not signed in, deny access
  if (!session?.user) {
    return <>{renderedFallback}</>;
  }

  const userRole = session.user.role as RoleType;

  // If checking for specific role
  if (role && userRole !== role) {
    return <>{renderedFallback}</>;
  }

  // If checking for permissions
  if (permissions && userRole) {
    try {
      // Check if user has the required permissions
      const hasPermission = authClient.admin.checkRolePermission({
        permissions,
        role: userRole,
      });

      if (!hasPermission) {
        return <>{renderedFallback}</>;
      }
    } catch (error) {
      console.error("Permission check failed:", error);
      return <>{renderedFallback}</>;
    }
  }

  // If all checks pass, render children
  return <>{children}</>;
}

// Hook for checking permissions in components
export function usePermissions() {
  const { data: session } = authClient.useSession();

  const checkPermission = (permissions: Record<string, string[]>) => {
    if (!session?.user?.role) return false;

    try {
      return authClient.admin.checkRolePermission({
        permissions,
        role: session.user.role as RoleType,
      });
    } catch (error) {
      console.error("Permission check failed:", error);
      return false;
    }
  };

  const hasRole = (role: RoleType) => {
    return session?.user?.role === role;
  };

  const isAdmin = () => {
    return (
      session?.user?.role === "admin" || session?.user?.role === "superAdmin"
    );
  };

  return {
    checkPermission,
    hasRole,
    isAdmin,
    userRole: session?.user?.role as RoleType,
  };
}

// Higher-order component for permission-based rendering
export function withPermissions<T extends object>(
  Component: React.ComponentType<T>,
  requiredPermissions?: PermissionMap,
  requiredRole?: RoleType
) {
  return function PermissionWrappedComponent(props: T) {
    return (
      <PermissionGuard
        permissions={requiredPermissions}
        role={requiredRole}
        fallback={<DefaultPermissionFallback />}
      >
        <Component {...props} />
      </PermissionGuard>
    );
  };
}
