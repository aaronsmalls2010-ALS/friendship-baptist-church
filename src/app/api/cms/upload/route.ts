import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * POST /api/cms/upload
 * Uploads an image to Supabase Storage for CMS use.
 * Requires super_admin authentication.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Verify super_admin role
    const role =
      user.user_metadata?.role || user.app_metadata?.role || "member";
    if (role !== "super_admin") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
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

    // Generate unique filename
    const filename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
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
