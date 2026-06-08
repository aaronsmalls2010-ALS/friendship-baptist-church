/**
 * Welcome email HTML template for new Friendship Baptist Church members.
 * Sent server-side after successful account creation. Includes a verification
 * link the member must click to confirm their email.
 *
 * Built table-based with inline styles for broad email-client support.
 * Images are absolute URLs (hosted on the live site) with alt fallbacks, so
 * the email still reads well if images are blocked.
 */

const SITE = "https://thefriendshipbaptist.com";
const IMG = `${SITE}/images`;

// Brand palette (from tailwind.config.ts)
const PURPLE_950 = "#1A0636";
const PURPLE_900 = "#2E0D5A";
const PURPLE_700 = "#4A1A8A";
const PURPLE_50 = "#F5F0FA";
const GOLD_400 = "#FFD740";
const GOLD_600 = "#C7A400";
const INK = "#3A3548";
const MUTE = "#6E677E";

export function getWelcomeEmailHtml(
  firstName: string,
  verificationUrl?: string
): string {
  const preheader = verificationUrl
    ? `Welcome to the Friendship Baptist Church family, ${firstName} — one quick step to verify your email.`
    : `Welcome to the Friendship Baptist Church family, ${firstName}.`;

  const ctaBlock = verificationUrl
    ? `
          <!-- One more step callout -->
          <tr>
            <td style="padding:4px 40px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                     style="background-color:#FFF8D4;border-radius:12px;border-left:4px solid ${GOLD_600};">
                <tr>
                  <td style="padding:18px 22px;">
                    <p style="margin:0 0 4px;font-size:15px;font-weight:bold;color:#6B5700;font-family:'Georgia','Times New Roman',serif;">
                      One quick step
                    </p>
                    <p style="margin:0;font-size:14px;line-height:1.6;color:#856C00;font-family:'Georgia','Times New Roman',serif;">
                      Please confirm your email address below. Once verified, your account
                      is ready &mdash; you can sign in right away.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Bulletproof gold CTA -->
          <tr>
            <td style="padding:18px 40px 26px;" align="center">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" bgcolor="${GOLD_400}" style="border-radius:999px;">
                    <a href="${verificationUrl}"
                       style="display:inline-block;padding:16px 52px;font-family:'Georgia','Times New Roman',serif;font-size:17px;font-weight:bold;letter-spacing:0.3px;color:${PURPLE_900};text-decoration:none;border-radius:999px;">
                      Verify My Email &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:14px 0 0;font-size:12px;line-height:1.5;color:${MUTE};font-family:'Georgia','Times New Roman',serif;">
                Button not working? Paste this link into your browser:<br>
                <a href="${verificationUrl}" style="color:${PURPLE_700};word-break:break-all;">${verificationUrl}</a>
              </p>
            </td>
          </tr>`
    : `
          <tr>
            <td style="padding:8px 40px 30px;" align="center">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" bgcolor="${GOLD_400}" style="border-radius:999px;">
                    <a href="${SITE}/auth/login"
                       style="display:inline-block;padding:16px 52px;font-family:'Georgia','Times New Roman',serif;font-size:17px;font-weight:bold;letter-spacing:0.3px;color:${PURPLE_900};text-decoration:none;border-radius:999px;">
                      Sign In to Your Account &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <title>Welcome to The Friendship Baptist Church</title>
</head>
<body style="margin:0;padding:0;background-color:#ECE6F3;-webkit-text-size-adjust:100%;">
  <!-- Hidden preheader -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">
    ${preheader}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ECE6F3;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background-color:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 6px 28px rgba(26,6,54,0.14);">

          <!-- Branded header -->
          <tr>
            <td bgcolor="${PURPLE_900}" style="background:linear-gradient(135deg,${PURPLE_950} 0%,${PURPLE_900} 48%,${PURPLE_700} 100%);padding:36px 40px 30px;text-align:center;">
              <img src="${IMG}/logos/fbc-logo-light.png" alt="The Friendship Baptist Church"
                   width="210" style="display:block;margin:0 auto;width:210px;max-width:70%;height:auto;border:0;">
              <p style="margin:16px 0 0;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:${GOLD_400};font-family:'Georgia','Times New Roman',serif;">
                The Church That Christ Built
              </p>
            </td>
          </tr>

          <!-- Hero image -->
          <tr>
            <td style="font-size:0;line-height:0;">
              <img src="${IMG}/church/exterior.png" alt="The Friendship Baptist Church in Beaufort, South Carolina"
                   width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;">
            </td>
          </tr>

          <!-- Gold accent rule -->
          <tr><td style="height:4px;line-height:4px;font-size:0;background-color:${GOLD_400};">&nbsp;</td></tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:36px 40px 4px;">
              <h1 style="margin:0 0 18px;font-size:26px;line-height:1.25;color:${PURPLE_700};font-family:'Georgia','Times New Roman',serif;">
                Welcome, ${firstName}!
              </h1>
              <p style="margin:0 0 16px;font-size:16px;line-height:1.75;color:${INK};font-family:'Georgia','Times New Roman',serif;">
                We are overjoyed to welcome you into our church family. At Friendship Baptist
                Church, we believe true fellowship begins with love, grows through faith, and
                endures by the grace of God.
              </p>
              <p style="margin:0 0 16px;font-size:16px;line-height:1.75;color:${INK};font-family:'Georgia','Times New Roman',serif;">
                Rooted in the rich Lowcountry Gullah Geechee tradition, our church has been a
                beacon of hope and worship in Beaufort, South Carolina for generations. Whether
                you have walked with us for years or this is your very first step, know that you
                have a home here.
              </p>
            </td>
          </tr>

          ${ctaBlock}

          <!-- Scripture -->
          <tr>
            <td style="padding:6px 40px 30px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                     style="background-color:${PURPLE_50};border-radius:12px;">
                <tr>
                  <td style="padding:22px 26px;text-align:center;">
                    <p style="margin:0 0 8px;font-size:17px;font-style:italic;line-height:1.6;color:${PURPLE_700};font-family:'Georgia','Times New Roman',serif;">
                      &ldquo;For where two or three gather in my name, there am I with them.&rdquo;
                    </p>
                    <p style="margin:0;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:${GOLD_600};font-weight:bold;font-family:'Georgia','Times New Roman',serif;">
                      Matthew 18:20
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- What you can do -->
          <tr>
            <td style="padding:0 40px 14px;">
              <h2 style="margin:0 0 14px;font-size:18px;color:${PURPLE_700};font-family:'Georgia','Times New Roman',serif;">
                In your member portal you can:
              </h2>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:'Georgia','Times New Roman',serif;">
                ${[
                  "View upcoming church events and RSVP",
                  "Submit and follow prayer requests",
                  "Watch sermons and listen to worship music",
                  "Connect through the member directory",
                  "Track your spiritual growth journey",
                ]
                  .map(
                    (item) => `<tr>
                  <td width="28" valign="top" style="padding:7px 0;font-size:16px;color:${GOLD_600};font-weight:bold;">&#10003;</td>
                  <td style="padding:7px 0;font-size:15px;line-height:1.5;color:${INK};">${item}</td>
                </tr>`
                  )
                  .join("")}
              </table>
            </td>
          </tr>

          <!-- Pastor's word -->
          <tr>
            <td style="padding:22px 40px 30px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="76" valign="top">
                    <img src="${IMG}/pastor/pastor-headshot.png" alt="Pastor Isiah Smalls"
                         width="60" height="60"
                         style="display:block;width:60px;height:60px;border-radius:50%;object-fit:cover;border:2px solid ${GOLD_400};">
                  </td>
                  <td valign="top" style="padding-left:6px;">
                    <p style="margin:0 0 8px;font-size:15px;font-style:italic;line-height:1.7;color:#534D62;font-family:'Georgia','Times New Roman',serif;">
                      &ldquo;When you walk through those doors &mdash; or sign in online &mdash; you are
                      not a stranger. You are a brother, a sister, a child of the Most High. We are
                      here to walk with you, pray with you, and believe with you for every promise
                      God has spoken over your life.&rdquo;
                    </p>
                    <p style="margin:0;font-size:14px;color:${PURPLE_700};font-weight:bold;font-family:'Georgia','Times New Roman',serif;">
                      &mdash; Pastor Isiah Smalls
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td bgcolor="${PURPLE_950}" style="padding:30px 40px;text-align:center;">
              <img src="${IMG}/logos/fbc-icon.png" alt="" width="44"
                   style="display:block;margin:0 auto 12px;width:44px;height:auto;border:0;">
              <p style="margin:0 0 8px;font-size:14px;color:#E9E0F5;font-family:'Georgia','Times New Roman',serif;">
                The Friendship Baptist Church
              </p>
              <p style="margin:0 0 4px;font-size:13px;line-height:1.6;color:#9B86C7;font-family:'Georgia','Times New Roman',serif;">
                36 Friendship Lane, Beaufort, SC 29907 &middot; (843) 525-1509
              </p>
              <p style="margin:8px 0 0;font-size:12px;font-family:'Georgia','Times New Roman',serif;">
                <a href="${SITE}" style="color:${GOLD_400};text-decoration:none;">thefriendshipbaptist.com</a>
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
ONE QUICK STEP — please confirm your email address by visiting the link below:
${verificationUrl}

Once verified, your account is ready and you can sign in right away.
`
    : `
Sign in at: ${SITE}/auth/login
`;

  return `
Welcome to The Friendship Baptist Church, ${firstName}!

We are overjoyed to welcome you into our church family.

At Friendship Baptist Church, we believe true fellowship begins with love, grows through faith, and endures by the grace of God. Rooted in the rich Lowcountry Gullah Geechee tradition, our church has been a beacon of hope and worship in Beaufort, South Carolina for generations. Whether you have walked with us for years or this is your very first step, know that you have a home here.

In your member portal you can:
- View upcoming church events and RSVP
- Submit and follow prayer requests
- Watch sermons and listen to worship music
- Connect through the member directory
- Track your spiritual growth journey
${verificationSection}
"For where two or three gather in my name, there am I with them." - Matthew 18:20

"When you walk through those doors — or sign in online — you are not a stranger. You are a brother, a sister, a child of the Most High."
— Pastor Isiah Smalls

The Friendship Baptist Church
36 Friendship Lane, Beaufort, SC 29907
(843) 525-1509
${SITE}
`.trim();
}
