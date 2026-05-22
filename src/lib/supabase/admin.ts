import { createClient } from "@supabase/supabase-js";

// Strip BOM (U+FEFF) that can sneak into env vars via copy-paste
const BOM_RE = new RegExp("^" + String.fromCharCode(0xfeff));
function cleanEnv(val: string): string {
  return val.replace(BOM_RE, "").trim();
}

/**
 * Creates a Supabase client with admin/service_role privileges.
 * Only use server-side — never expose the service role key to the browser.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Missing Supabase admin environment variables");
  }

  return createClient(cleanEnv(url), cleanEnv(serviceKey), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
