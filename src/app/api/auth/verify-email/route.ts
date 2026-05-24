import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/auth/verify-email?token=<uuid>
 *
 * Validates the email verification token stored in user_metadata,
 * then sets is_email_verified = true on the profile.
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Missing verification token." },
        { status: 400 }
      );
    }

    // UUID format check to prevent junk lookups
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(token)) {
      return NextResponse.json(
        { error: "Invalid verification token format." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Find the user whose user_metadata contains this verification token.
    // Supabase Admin API doesn't support querying by metadata, so we look
    // up via the profiles table or list users. Since we stored the token in
    // user_metadata, we query all users. For efficiency at scale, the token
    // could also be stored in a dedicated table. For a church site this is fine.
    //
    // Alternative approach: store token in a separate verification_tokens table.
    // For now, we paginate through users (church sites have limited membership).

    const { data: usersResponse, error: listError } =
      await supabase.auth.admin.listUsers({ perPage: 1000 });

    if (listError) {
      console.error("[AUTH] Error listing users for verification:", listError);
      return NextResponse.json(
        { error: "Verification failed. Please try again." },
        { status: 500 }
      );
    }

    const matchedUser = usersResponse.users.find(
      (u) => u.user_metadata?.email_verification_token === token
    );

    if (!matchedUser) {
      return NextResponse.json(
        {
          error:
            "Invalid or expired verification link. The link may have already been used.",
        },
        { status: 400 }
      );
    }

    // Check if already verified
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_email_verified")
      .eq("id", matchedUser.id)
      .single();

    if (profile?.is_email_verified) {
      return NextResponse.json({
        message: "Email already verified.",
        alreadyVerified: true,
      });
    }

    // Mark email as verified on the profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ is_email_verified: true })
      .eq("id", matchedUser.id);

    if (updateError) {
      console.error("[AUTH] Error updating email verification:", updateError);
      return NextResponse.json(
        { error: "Verification failed. Please try again." },
        { status: 500 }
      );
    }

    // Clear the verification token from user_metadata (one-time use)
    const { email_verification_token: _, ...restMetadata } =
      matchedUser.user_metadata || {};
    await supabase.auth.admin.updateUserById(matchedUser.id, {
      user_metadata: restMetadata,
    });

    console.log("[AUDIT] auth.email_verified", {
      userId: matchedUser.id,
      email: matchedUser.email,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      message: "Email verified successfully! Your account is pending admin approval.",
      verified: true,
    });
  } catch (err) {
    console.error("[AUTH] Unexpected verify-email error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
