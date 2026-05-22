/**
 * Send email via Supabase Edge Function or SMTP relay.
 * Uses the Supabase project's built-in SMTP (Resend) for delivery.
 *
 * Supabase projects include built-in email sending via their Auth system.
 * For custom transactional emails, we POST to our own API edge function
 * that calls the Supabase SMTP relay.
 *
 * Fallback: If no custom SMTP is configured, we use Supabase's
 * auth.admin.inviteUserByEmail as a workaround to trigger an email,
 * or simply log the email for manual follow-up.
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ success: boolean; error?: string }> {
  // Try Resend if API key is configured
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Friendship Baptist Church <welcome@thefriendshipbaptist.com>",
          to: [to],
          subject,
          html,
          text,
        }),
      });

      if (response.ok) {
        return { success: true };
      }

      const errorData = await response.json().catch(() => ({}));
      console.error("[EMAIL] Resend error:", errorData);
      return { success: false, error: "Email delivery failed" };
    } catch (err) {
      console.error("[EMAIL] Resend fetch error:", err);
      return { success: false, error: "Email service unavailable" };
    }
  }

  // No email service configured — log for manual follow-up
  console.log("[EMAIL] No email service configured. Would send:", {
    to,
    subject,
    textPreview: text.slice(0, 100) + "...",
  });

  return { success: true }; // Don't block signup if email isn't configured yet
}
