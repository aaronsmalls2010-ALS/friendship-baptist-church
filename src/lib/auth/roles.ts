import type { User } from "@supabase/supabase-js";

/**
 * Multi-role helpers.
 *
 * A member can hold several roles (stored in the `user_roles` table and
 * mirrored into auth `user_metadata.roles`). `profiles.role` /
 * `user_metadata.role` remain as the single "primary" role (the highest one)
 * for display and the default post-login redirect.
 */

export const ALL_ROLES = [
  "member",
  "deacon",
  "minister",
  "musician",
  "finance",
  "pastor",
  "admin",
  "super_admin",
] as const;

export type Role = (typeof ALL_ROLES)[number];

// pastor is admin-level: can reach /admin and has full admin access + financial access
export const ADMIN_ROLES: readonly Role[] = ["admin", "super_admin", "pastor"];
export const ADMIN_LEVEL_ROLES: readonly Role[] = ["admin", "super_admin", "pastor"];

// Roles that can view / manage financial data
export const FINANCE_ROLES: readonly Role[] = ["finance", "admin", "pastor", "super_admin"];

// Higher number = higher precedence. Mirrors the Postgres `user_role` enum order.
const PRECEDENCE: Record<Role, number> = {
  super_admin: 8,
  pastor: 7,
  admin: 6,
  finance: 5,
  musician: 4,
  minister: 3,
  deacon: 2,
  member: 1,
};

export function isRole(value: unknown): value is Role {
  return (
    typeof value === "string" && (ALL_ROLES as readonly string[]).includes(value)
  );
}

type MetaUser =
  | Pick<User, "user_metadata" | "app_metadata">
  | null
  | undefined;

/** Every role a user holds — from user_metadata.roles, falling back to the single role. */
export function rolesFromUser(user: MetaUser): Role[] {
  if (!user) return [];
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const app = (user.app_metadata ?? {}) as Record<string, unknown>;

  const arr = Array.isArray(meta.roles)
    ? meta.roles
    : Array.isArray(app.roles)
      ? app.roles
      : null;
  if (arr) {
    const roles = arr.filter(isRole);
    if (roles.length) return roles;
  }

  const single = meta.role ?? app.role;
  return isRole(single) ? [single] : [];
}

/** The single highest-precedence role from a set (defaults to "member"). */
export function primaryRole(roles: Role[]): Role {
  if (!roles.length) return "member";
  return roles.reduce((a, b) => (PRECEDENCE[b] > PRECEDENCE[a] ? b : a));
}

export function hasAnyRole(roles: Role[], wanted: readonly Role[]): boolean {
  return roles.some((r) => wanted.includes(r));
}

export function isAdmin(user: MetaUser): boolean {
  return hasAnyRole(rolesFromUser(user), ADMIN_ROLES);
}

export function isSuperAdmin(user: MetaUser): boolean {
  return rolesFromUser(user).includes("super_admin");
}

export function canViewFinancials(user: MetaUser): boolean {
  return hasAnyRole(rolesFromUser(user), FINANCE_ROLES);
}
