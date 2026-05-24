import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET_NAME = "avatars";
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB after decoding

/**
 * POST /api/portal/profile/avatar
 *
 * Accepts a base64-encoded JPEG data URL, uploads it to Supabase Storage
 * (bucket "avatars"), and updates the user's profile.photo_url.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { image } = body;

    if (!image || typeof image !== "string") {
      return NextResponse.json(
        { error: "Missing image data" },
        { status: 400 }
      );
    }

    // Parse the data URL: "data:image/jpeg;base64,..."
    const match = image.match(
      /^data:image\/(jpeg|png|webp);base64,(.+)$/
    );
    if (!match) {
      return NextResponse.json(
        { error: "Invalid image format. Must be JPEG, PNG, or WebP data URL." },
        { status: 400 }
      );
    }

    const mimeSubtype = match[1]; // jpeg | png | webp
    const base64Data = match[2];

    // Decode base64 to buffer
    const buffer = Buffer.from(base64Data, "base64");

    if (buffer.length > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Image too large. Maximum 5 MB." },
        { status: 400 }
      );
    }

    const extension = mimeSubtype === "jpeg" ? "jpg" : mimeSubtype;
    const filePath = `${user.id}/avatar.${extension}`;

    const admin = createAdminClient();

    // Ensure the avatars bucket exists (idempotent)
    const { data: buckets } = await admin.storage.listBuckets();
    const bucketExists = buckets?.some((b) => b.name === BUCKET_NAME);
    if (!bucketExists) {
      await admin.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: MAX_SIZE_BYTES,
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
      });
    }

    // Upload (upsert) the file
    const { error: uploadError } = await admin.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType: `image/${mimeSubtype}`,
        upsert: true,
      });

    if (uploadError) {
      console.error("[PORTAL] Avatar upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload image" },
        { status: 500 }
      );
    }

    // Get the public URL
    const {
      data: { publicUrl },
    } = admin.storage.from(BUCKET_NAME).getPublicUrl(filePath);

    // Append a cache-busting query param so the browser fetches the new image
    const photoUrl = `${publicUrl}?v=${Date.now()}`;

    // Update profile.photo_url
    const { data: profile, error: updateError } = await admin
      .from("profiles")
      .update({ photo_url: photoUrl, updated_at: new Date().toISOString() })
      .eq("id", user.id)
      .select("*")
      .single();

    if (updateError) {
      console.error("[PORTAL] Avatar profile update error:", updateError);
      return NextResponse.json(
        { error: "Image uploaded but failed to update profile" },
        { status: 500 }
      );
    }

    console.log("[AUDIT] profile.avatar_update", {
      userId: user.id,
      filePath,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ profile, photo_url: photoUrl });
  } catch (err) {
    console.error("[PORTAL] Avatar POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
