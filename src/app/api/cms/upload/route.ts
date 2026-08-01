import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/auth/require-admin";
import { isAllowedImage } from "@/lib/security/image-validation";

/**
 * POST /api/cms/upload
 * Uploads an image to Supabase Storage for CMS use.
 * Requires super_admin authentication.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Verify authentication + super_admin role (sourced from the DB, not
    // self-writable user_metadata).
    const auth = await requireSuperAdmin();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Extract file from FormData
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // ── File type validation ──
    // SVG excluded — can contain embedded scripts (XSS vector)
    const ALLOWED_MIME_TYPES = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/avif",
    ];
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not allowed. Only images are accepted." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10 MB." },
        { status: 400 }
      );
    }

    // Verify the actual file bytes match a real image type — don't trust the
    // client-declared file.type (a mislabeled payload would otherwise pass).
    const sniffBytes = Buffer.from(await file.arrayBuffer());
    if (!isAllowedImage(sniffBytes, ["jpeg", "png", "gif", "webp", "avif"], file.type)) {
      return NextResponse.json(
        { error: "File content does not match a supported image type." },
        { status: 400 }
      );
    }

    // Generate unique filename (sanitize to alphanumeric + safe chars)
    const filename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
    const path = `cms/${Date.now()}-${filename}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("cms-images")
      .upload(path, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("CMS upload error:", uploadError);
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
