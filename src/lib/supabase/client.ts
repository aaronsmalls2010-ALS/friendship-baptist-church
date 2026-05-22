import { createBrowserClient } from "@supabase/ssr";

// Strip BOM (U+FEFF) that can sneak into env vars via copy-paste
const BOM_RE = new RegExp("^" + String.fromCharCode(0xfeff));
function cleanEnv(val: string): string {
  return val.replace(BOM_RE, "").trim();
}

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables");
  }

  return createBrowserClient(cleanEnv(url), cleanEnv(key));
}
