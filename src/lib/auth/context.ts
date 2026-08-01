import type { User } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  type Role,
  ADMIN_ROLES,
  FINANCE_ROLES,
  CARE_ROLES,
  primaryRole,
  hasAnyRole,
  isRole,
} from "@/lib/auth/roles";

/**
 * The trusted, server-resolved authorization context for a request.
 *
 * SECURITY: roles come from the authoritative `user_roles` table — NEVER from
 * `user_metadata`, which a user can rewrite themselves with the public anon key
 * via `supabase.auth.updateUser({ data })`. Every server-side authz decision
 * must go through here (or the `require*` helpers built on it).
 */
export type AuthContext = {
  user: User;
  roles: Role[];
  primary: Role;
  /** True if the caller holds ANY of the given roles. */
  has: (...wanted: Role[]) => boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isPastor: boolean;
  /** finance / admin / pastor / super_admin — may view giving data. */
  canViewFinancials: boolean;
  /** deacon / pastor / super_admin — may read/write pastoral care notes. Deliberately disjoint from finance. */
  canAccessCareNotes: boolean;
};

/**
 * Resolve the caller and their roles from the database. Returns null when there
 * is no authenticated user.
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Read roles from the authoritative table with the service client, filtered
  // strictly by the verified auth uid. A self-tampered session cannot influence
  // this result.
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  let roles: Role[] = (data ?? [])
    .map((r: { role: string }) => r.role)
    .filter(isRole);

  // Fallback: if the user_roles row is missing but the profile carries a role
  // (also server-side, not user-writable), trust that. Everyone is at least a
  // member.
  if (!error && roles.length === 0) {
    const { data: prof } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (prof && isRole(prof.role)) roles = [prof.role];
    if (roles.length === 0) roles = ["member"];
  }

  return {
    user,
    roles,
    primary: primaryRole(roles),
    has: (...wanted: Role[]) => hasAnyRole(roles, wanted),
    isAdmin: hasAnyRole(roles, ADMIN_ROLES),
    isSuperAdmin: roles.includes("super_admin"),
    isPastor: roles.includes("pastor"),
    canViewFinancials: hasAnyRole(roles, FINANCE_ROLES),
    canAccessCareNotes: hasAnyRole(roles, CARE_ROLES),
  };
}
