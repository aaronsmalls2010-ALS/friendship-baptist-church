"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { usePathname, useRouter } from "next/navigation";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  fallback?: React.ReactNode;
}

/**
 * Client-side auth guard component.
 * Provides an extra layer of protection beyond middleware.
 * Use in layouts for portal/admin sections.
 */
export function AuthGuard({
  children,
  requireAuth = false,
  requireAdmin = false,
  fallback,
}: AuthGuardProps) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    if (requireAuth && !isAuthenticated) {
      router.replace(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (requireAdmin && !isAdmin) {
      router.replace("/portal");
    }
  }, [isAuthenticated, isAdmin, isLoading, requireAuth, requireAdmin, router, pathname]);

  if (isLoading) {
    return (
      fallback || (
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-warm-300 border-t-purple-600" />
            <p className="text-warm-500 text-sm">Verifying access...</p>
          </div>
        </div>
      )
    );
  }

  if (requireAuth && !isAuthenticated) return null;
  if (requireAdmin && !isAdmin) return null;

  return <>{children}</>;
}
