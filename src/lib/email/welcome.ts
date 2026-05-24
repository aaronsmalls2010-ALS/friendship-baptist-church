/**
 * Welcome email HTML template for new Friendship Baptist Church members.
 * Sent server-side after successful account creation.
 * Includes a verification link that the member must click to confirm their email.
 */
export function getWelcomeEmailHtml(
  firstName: string,
  verificationUrl?: string
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Friendship Baptist Church</title>
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

          <!-- Welcome Message -->
          <tr>
            <td style="padding:40px 40px 20px;">
              <h2 style="margin:0 0 20px;font-size:24px;color:#4c1d95;">
                Welcome, ${firstName}!
              </h2>
              <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#44403c;">
                We are so glad you have joined our church family online! At Friendship Baptist Church,
                we believe that true fellowship begins with love, grows through faith, and endures by the
                grace of God.
              </p>
              <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#44403c;">
                Rooted in the rich Lowcountry Gullah Geechee tradition, our church has been a beacon
                of hope and worship in Beaufort, South Carolina for generations. Whether you have been
                walking with us for years or this is your very first step, know that you have a home here.
              </p>
              <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#44403c;">
                Your new account gives you access to our member portal where you can connect with
                our congregation, view upcoming events, submit prayer requests, and grow in your
                spiritual journey.
              </p>
            </td>
          </tr>

          <!-- Email Verification CTA -->
          ${
            verificationUrl
              ? `<tr>
            <td style="padding:0 40px 10px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                     style="background-color:#fef3c7;border-radius:12px;border-left:4px solid #d97706;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 4px;font-size:16px;font-weight:bold;color:#92400e;">
                      One more step!
                    </p>
                    <p style="margin:0;font-size:14px;line-height:1.5;color:#78350f;">
                      Please verify your email address by clicking the button below.
                      After verification, a church administrator will review and approve your account.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 40px 30px;text-align:center;">
              <a href="${verificationUrl}"
                 style="display:inline-block;padding:16px 48px;background-color:#059669;color:#ffffff;text-decoration:none;border-radius:12px;font-size:18px;font-weight:bold;letter-spacing:0.3px;">
                Verify Your Email
              </a>
              <p style="margin:12px 0 0;font-size:12px;color:#78716c;">
                If the button does not work, copy and paste this link into your browser:<br>
                <a href="${verificationUrl}" style="color:#6d28d9;word-break:break-all;">${verificationUrl}</a>
              </p>
            </td>
          </tr>`
              : `<tr>
            <td style="padding:0 40px 30px;text-align:center;">
              <a href="https://thefriendshipbaptist.com/auth/login"
                 style="display:inline-block;padding:14px 40px;background-color:#4c1d95;color:#ffffff;text-decoration:none;border-radius:12px;font-size:16px;font-weight:bold;letter-spacing:0.3px;">
                Sign In to Your Account
              </a>
            </td>
          </tr>`
          }

          <!-- Scripture Quote -->
          <tr>
            <td style="padding:0 40px 30px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                     style="background-color:#faf5ff;border-radius:12px;border-left:4px solid #c4a77d;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 8px;font-size:15px;font-style:italic;line-height:1.6;color:#6d28d9;">
                      "For where two or three gather in my name, there am I with them."
                    </p>
                    <p style="margin:0;font-size:13px;color:#c4a77d;font-weight:bold;">
                      &mdash; Matthew 18:20
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- What You Can Do -->
          <tr>
            <td style="padding:0 40px 30px;">
              <h3 style="margin:0 0 16px;font-size:18px;color:#4c1d95;">
                Here is what you can do:
              </h3>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:8px 0;font-size:15px;color:#44403c;line-height:1.5;">
                    &#10003;&nbsp;&nbsp;View upcoming church events and RSVP
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-size:15px;color:#44403c;line-height:1.5;">
                    &#10003;&nbsp;&nbsp;Submit and follow prayer requests
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-size:15px;color:#44403c;line-height:1.5;">
                    &#10003;&nbsp;&nbsp;Watch sermons and listen to worship music
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-size:15px;color:#44403c;line-height:1.5;">
                    &#10003;&nbsp;&nbsp;Connect with our church family through the member directory
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-size:15px;color:#44403c;line-height:1.5;">
                    &#10003;&nbsp;&nbsp;Track your spiritual growth journey
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Pastor's Word -->
          <tr>
            <td style="padding:0 40px 30px;">
              <p style="margin:0;font-size:15px;font-style:italic;line-height:1.7;color:#57534e;">
                "When you walk through those doors — or sign in online — you are not a stranger.
                You are a brother, a sister, a child of the Most High. And we are here to walk with you,
                pray with you, and believe with you for every promise God has spoken over your life."
              </p>
              <p style="margin:12px 0 0;font-size:14px;color:#4c1d95;font-weight:bold;">
                &mdash; Pastor Isiah Smalls
              </p>
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
                <a href="https://thefriendshipbaptist.com" style="color:#c4a77d;text-decoration:none;">
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

/**
 * Plain text version of the welcome email.
 */
export function getWelcomeEmailText(
  firstName: string,
  verificationUrl?: string
): string {
  const verificationSection = verificationUrl
    ? `
ONE MORE STEP: Please verify your email address by visiting the link below:
${verificationUrl}

After verification, a church administrator will review and approve your account.
You will be notified by email once your account is approved and ready to use.
`
    : `
Sign in at: https://thefriendshipbaptist.com/auth/login
`;

  return `
Welcome to The Friendship Baptist Church, ${firstName}!

We are so glad you have joined our church family online!

At Friendship Baptist Church, we believe that true fellowship begins with love, grows through faith, and endures by the grace of God. Rooted in the rich Lowcountry Gullah Geechee tradition, our church has been a beacon of hope and worship in Beaufort, South Carolina for generations.

Your new account gives you access to our member portal where you can:
- View upcoming church events and RSVP
- Submit and follow prayer requests
- Watch sermons and listen to worship music
- Connect with our church family through the member directory
- Track your spiritual growth journey
${verificationSection}
"For where two or three gather in my name, there am I with them." - Matthew 18:20

God bless you,
Pastor Isiah Smalls
The Friendship Baptist Church
36 Friendship Lane, Beaufort, SC 29907
(843) 525-1509
thefriendshipbaptist.com
`.trim();
}
