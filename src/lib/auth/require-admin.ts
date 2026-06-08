import type { User } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isAdmin, isSuperAdmin } from "@/lib/auth/roles";

type Ok = { ok: true; user: User };
type Fail = { ok: false; status: number; error: string };

/** Resolve the caller and require an admin/super_admin role. */
export async function requireAdmin(): Promise<Ok | Fail> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, status: 401, error: "Not authenticated" };
  if (!isAdmin(user)) return { ok: false, status: 403, error: "Unauthorized" };
  return { ok: true, user };
}

/** Require super_admin specifically. */
export async function requireSuperAdmin(): Promise<Ok | Fail> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, status: 401, error: "Not authenticated" };
  if (!isSuperAdmin(user))
    return { ok: false, status: 403, error: "Super admin required" };
  return { ok: true, user };
}
