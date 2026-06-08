/**
 * Password-reset email for Friendship Baptist Church members.
 * Sent server-side when a member requests a reset. Contains a one-time,
 * time-limited link to set a new password.
 */
export function getPasswordResetEmailHtml(
  firstName: string,
  resetUrl: string
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your password</title>
</head>
<body style="margin:0;padding:0;font-family:'Georgia','Times New Roman',serif;background-color:#f5f0eb;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0eb;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#4c1d95 0%,#6d28d9 50%,#7c3aed 100%);padding:36px 40px;text-align:center;">
              <h1 style="margin:0;font-size:24px;color:#ffffff;font-weight:bold;letter-spacing:0.5px;">
                The Friendship Baptist Church
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 16px;">
              <h2 style="margin:0 0 16px;font-size:22px;color:#4c1d95;">
                Reset your password
              </h2>
              <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#44403c;">
                Hi ${firstName}, we received a request to reset the password for your
                member portal account. Click the button below to choose a new password.
              </p>
              <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#78716c;">
                This link will expire in 1 hour and can only be used once.
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:8px 40px 28px;text-align:center;">
              <a href="${resetUrl}"
                 style="display:inline-block;padding:16px 48px;background-color:#6d28d9;color:#ffffff;text-decoration:none;border-radius:12px;font-size:18px;font-weight:bold;letter-spacing:0.3px;">
                Reset Password
              </a>
              <p style="margin:14px 0 0;font-size:12px;color:#78716c;">
                If the button does not work, copy and paste this link into your browser:<br>
                <a href="${resetUrl}" style="color:#6d28d9;word-break:break-all;">${resetUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Safety note -->
          <tr>
            <td style="padding:0 40px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                     style="background-color:#fef3c7;border-radius:12px;border-left:4px solid #d97706;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;font-size:13px;line-height:1.6;color:#78350f;">
                      Didn't request this? You can safely ignore this email &mdash; your
                      password will stay the same.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#1c1917;padding:26px 40px;text-align:center;">
              <p style="margin:0 0 6px;font-size:13px;color:#a8a29e;">
                The Friendship Baptist Church
              </p>
              <p style="margin:0;font-size:12px;color:#78716c;">
                36 Friendship Lane, Beaufort, SC 29907 &middot; (843) 525-1509
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

export function getPasswordResetEmailText(
  firstName: string,
  resetUrl: string
): string {
  return `
Reset your password — The Friendship Baptist Church

Hi ${firstName},

We received a request to reset the password for your member portal account.
Visit the link below to choose a new password:

${resetUrl}

This link will expire in 1 hour and can only be used once.

Didn't request this? You can safely ignore this email — your password will stay the same.

The Friendship Baptist Church
36 Friendship Lane, Beaufort, SC 29907
(843) 525-1509
`.trim();
}
