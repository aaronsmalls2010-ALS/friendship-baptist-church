import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { isAllowedImage } from "@/lib/security/image-validation";

/**
 * POST /api/admin/upload
 * Uploads an image (e.g. an event image) to Supabase Storage.
 * Requires admin-level authentication.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Verify authentication + admin role (sourced from the DB, not
    // self-writable user_metadata).
    const auth = await requireAdmin();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Extract file from FormData
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // ── Size validation (<= 8 MB) ──
    const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8 MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 8 MB." },
        { status: 400 }
      );
    }

    // ── Real image-type validation via magic bytes ──
    // Don't trust the client-declared file.type; SVG is excluded (XSS vector).
    const sniffBytes = Buffer.from(await file.arrayBuffer());
    if (
      !isAllowedImage(sniffBytes, ["jpeg", "png", "webp", "gif", "avif"], file.type)
    ) {
      return NextResponse.json(
        { error: "File content does not match a supported image type." },
        { status: 400 }
      );
    }

    // Generate unique filename (sanitize to alphanumeric + safe chars)
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
    const path = `events/${Date.now()}-${sanitizedName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("cms-images")
      .upload(path, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Admin upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("cms-images").getPublicUrl(path);

    return NextResponse.json({ url: publicUrl }, { status: 200 });
  } catch {
    // Supabase not configured or unreachable
    return NextResponse.json(
      { error: "Upload service unavailable" },
      { status: 503 }
    );
  }
}
