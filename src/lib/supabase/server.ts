import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Strip BOM (U+FEFF) that can sneak into env vars via copy-paste
const BOM_RE = new RegExp("^" + String.fromCharCode(0xfeff));
function cleanEnv(val: string): string {
  return val.replace(BOM_RE, "").trim();
}

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL!),
    cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as never)
            );
          } catch {
            // Server Component — cookie setting is not possible
          }
        },
      },
    }
  );
}
