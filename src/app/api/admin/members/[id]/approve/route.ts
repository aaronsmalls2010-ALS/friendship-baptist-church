import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";

/**
 * POST /api/admin/members/[id]/approve
 *
 * Sets is_approved = true on a member's profile.
 * Only admin or super_admin roles can approve members.
 * Optionally sends an approval notification email to the member.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetId } = await params;

    // Verify caller is authenticated and has admin privileges
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const callerRole = user.user_metadata?.role || user.app_metadata?.role;
    if (callerRole !== "admin" && callerRole !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const admin = createAdminClient();

    // Verify the target user exists and check current approval status
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id, first_name, is_approved, is_email_verified")
      .eq("id", targetId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Member not found." },
        { status: 404 }
      );
    }

    if (profile.is_approved) {
      return NextResponse.json({
        message: "Member is already approved.",
        alreadyApproved: true,
      });
    }

    // Approve the member
    const { error: updateError } = await admin
      .from("profiles")
      .update({
        is_approved: true,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .eq("id", targetId);

    if (updateError) {
      console.error("[ADMIN] Approve member error:", updateError);
      return NextResponse.json(
        { error: "Failed to approve member." },
        { status: 500 }
      );
    }

    console.log("[AUDIT] member.approved", {
      targetId,
      approvedBy: user.id,
      timestamp: new Date().toISOString(),
    });

    // Send approval notification email (non-blocking)
    const { data: targetUser } = await admin.auth.admin.getUserById(targetId);
    if (targetUser?.user?.email) {
      const firstName = profile.first_name || "Member";
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL || "https://thefriendshipbaptist.com";

      sendEmail({
        to: targetUser.user.email,
        subject: `Your Friendship Baptist Church Account Has Been Approved!`,
        html: getApprovalEmailHtml(firstName, siteUrl),
        text: getApprovalEmailText(firstName, siteUrl),
      }).catch((err) => {
        console.error("[EMAIL] Approval notification email failed:", err);
      });
    }

    return NextResponse.json({ success: true, approved: true });
  } catch (err) {
    console.error("[ADMIN] Approve member error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ── Approval notification email templates ──

function getApprovalEmailHtml(firstName: string, siteUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Approved</title>
</head>
<body style="margin:0;padding:0;font-family:'Georgia','Times New Roman',serif;background-color:#f5f0eb;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0eb;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header Banner -->
          <tr>
            <td style="background:linear-gradient(135deg,#4c1d95 0%,#6d28d9 50%,#7c3aed 100%);padding:40px 40px 30px;text-align:center;">
              <h1 style="margin:0;font-size:28px;color:#ffffff;font-weight:bold;letter-spacing:0.5px;">
                The Friendship Baptist Church
              </h1>
              <p style="margin:8px 0 0;font-size:16px;color:#c4a77d;font-style:italic;">
                The Church That Christ Built
              </p>
            </td>
          </tr>

          <!-- Approval Message -->
          <tr>
            <td style="padding:40px 40px 20px;">
              <h2 style="margin:0 0 20px;font-size:24px;color:#4c1d95;">
                Welcome to the Family, ${firstName}!
              </h2>
              <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#44403c;">
                Great news! Your account has been reviewed and approved by a church administrator.
                You can now sign in and access all the features of our member portal.
              </p>
              <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#44403c;">
                We are excited to have you as part of our church family online. Come explore
                upcoming events, prayer requests, sermons, and connect with our congregation.
              </p>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding:0 40px 30px;text-align:center;">
              <a href="${siteUrl}/auth/login"
                 style="display:inline-block;padding:14px 40px;background-color:#4c1d95;color:#ffffff;text-decoration:none;border-radius:12px;font-size:16px;font-weight:bold;letter-spacing:0.3px;">
                Sign In Now
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#1c1917;padding:30px 40px;text-align:center;">
              <p style="margin:0 0 8px;font-size:14px;color:#a8a29e;">
                The Friendship Baptist Church
              </p>
              <p style="margin:0 0 8px;font-size:13px;color:#78716c;">
                36 Friendship Lane, Beaufort, SC 29907
              </p>
              <p style="margin:0 0 8px;font-size:13px;color:#78716c;">
                (843) 525-1509
              </p>
              <p style="margin:0;font-size:12px;color:#57534e;">
                <a href="${siteUrl}" style="color:#c4a77d;text-decoration:none;">
                  thefriendshipbaptist.com
                </a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

function getApprovalEmailText(firstName: string, siteUrl: string): string {
  return `
Welcome to the Family, ${firstName}!

Great news! Your account has been reviewed and approved by a church administrator. You can now sign in and access all the features of our member portal.

We are excited to have you as part of our church family online. Come explore upcoming events, prayer requests, sermons, and connect with our congregation.

Sign in at: ${siteUrl}/auth/login

God bless you,
The Friendship Baptist Church
36 Friendship Lane, Beaufort, SC 29907
(843) 525-1509
thefriendshipbaptist.com
`.trim();
}
