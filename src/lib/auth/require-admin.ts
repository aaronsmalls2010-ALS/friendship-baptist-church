import type { User } from "@supabase/supabase-js";
import { getAuthContext, type AuthContext } from "@/lib/auth/context";

type Ok = { ok: true; user: User; ctx: AuthContext };
type Fail = { ok: false; status: number; error: string };

/**
 * Resolve the caller and require an admin-level role (admin / super_admin /
 * pastor). Roles are read from the database, not user_metadata.
 */
export async function requireAdmin(): Promise<Ok | Fail> {
  const ctx = await getAuthContext();
  if (!ctx) return { ok: false, status: 401, error: "Not authenticated" };
  if (!ctx.isAdmin) return { ok: false, status: 403, error: "Unauthorized" };
  return { ok: true, user: ctx.user, ctx };
}

/** Require finance-capable role (finance, admin, pastor, super_admin). */
export async function requireFinance(): Promise<Ok | Fail> {
  const ctx = await getAuthContext();
  if (!ctx) return { ok: false, status: 401, error: "Not authenticated" };
  if (!ctx.canViewFinancials)
    return { ok: false, status: 403, error: "Finance role required" };
  return { ok: true, user: ctx.user, ctx };
}

/** Require super_admin specifically. */
export async function requireSuperAdmin(): Promise<Ok | Fail> {
  const ctx = await getAuthContext();
  if (!ctx) return { ok: false, status: 401, error: "Not authenticated" };
  if (!ctx.isSuperAdmin)
    return { ok: false, status: 403, error: "Super admin required" };
  return { ok: true, user: ctx.user, ctx };
}

/**
 * Require pastoral-care access (deacon / pastor / super_admin) — the disjoint
 * capability that gates confidential care notes. Finance roles are excluded.
 */
export async function requireCareAccess(): Promise<Ok | Fail> {
  const ctx = await getAuthContext();
  if (!ctx) return { ok: false, status: 401, error: "Not authenticated" };
  if (!ctx.canAccessCareNotes)
    return { ok: false, status: 403, error: "Pastoral care role required" };
  return { ok: true, user: ctx.user, ctx };
}
