import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { getWelcomeEmailHtml, getWelcomeEmailText } from "@/lib/email/welcome";
import { toE164, isValidUsPhone, syntheticEmailForPhone } from "@/lib/phone";
import { issuePhoneOtp } from "@/lib/auth/phone-otp";
import { getSiteUrl } from "@/lib/site-url";

// ── Rate limiting for signup ──
const signupAttempts = new Map<string, { count: number; resetTime: number }>();

function checkSignupLimit(ip: string): boolean {
  const now = Date.now();
  const entry = signupAttempts.get(ip);

  if (Math.random() < 0.05) {
    for (const [key, val] of signupAttempts) {
      if (now > val.resetTime) signupAttempts.delete(key);
    }
  }

  if (!entry || now > entry.resetTime) {
    signupAttempts.set(ip, { count: 1, resetTime: now + 60 * 60 * 1000 });
    return true;
  }

  entry.count++;
  return entry.count <= 5;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    if (!checkSignupLimit(ip)) {
      return NextResponse.json(
        { error: "Too many signup attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": "3600" } }
      );
    }

    const body = await request.json();
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      contactMethod,
      honeypot,
    } = body;

    // Honeypot check — pretend success so bots get no signal.
    if (honeypot) {
      return NextResponse.json(
        { message: "Account created successfully.", requiresVerification: "email" },
        { status: 200 }
      );
    }

    // ── Validate common fields ──
    if (!password || !firstName || !lastName) {
      return NextResponse.json(
        { error: "All required fields must be provided." },
        { status: 400 }
      );
    }
    // Account creation is EMAIL-ONLY. A phone number may be provided (and can be
    // used to sign in later), but it can't be the way an account is created.
    if (contactMethod === "phone") {
      return NextResponse.json(
        { error: "New accounts must be created with an email address. You can add a phone number for sign-in." },
        { status: 400 }
      );
    }
    if (contactMethod !== "email") {
      return NextResponse.json(
        { error: "An email address is required to create an account." },
        { status: 400 }
      );
    }

    // Password validation
    if (password.length < 12) {
      return NextResponse.json({ error: "Password must be at least 12 characters." }, { status: 400 });
    }
    if (!/[A-Z]/.test(password)) {
      return NextResponse.json({ error: "Password must contain an uppercase letter." }, { status: 400 });
    }
    if (!/[a-z]/.test(password)) {
      return NextResponse.json({ error: "Password must contain a lowercase letter." }, { status: 400 });
    }
    if (!/[0-9]/.test(password)) {
      return NextResponse.json({ error: "Password must contain a number." }, { status: 400 });
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      return NextResponse.json({ error: "Password must contain a special character." }, { status: 400 });
    }

    // ── Normalize + validate identifiers (one required, both allowed) ──
    const rawEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const rawPhone = typeof phone === "string" ? phone.trim() : "";

    const sanitizedEmail = rawEmail ? rawEmail.slice(0, 255) : null;
    const e164Phone = rawPhone ? toE164(rawPhone) : null;

    if (sanitizedEmail && !EMAIL_RE.test(sanitizedEmail)) {
      return NextResponse.json({ error: "Invalid email format." }, { status: 400 });
    }
    if (rawPhone && !e164Phone) {
      return NextResponse.json({ error: "Invalid phone number." }, { status: 400 });
    }

    // The chosen verification channel must be present.
    if (contactMethod === "email" && !sanitizedEmail) {
      return NextResponse.json(
        { error: "Please enter your email address." },
        { status: 400 }
      );
    }
    if (contactMethod === "phone" && !e164Phone) {
      return NextResponse.json(
        { error: "Please enter a valid phone number." },
        { status: 400 }
      );
    }
    if (!sanitizedEmail && !e164Phone) {
      return NextResponse.json(
        { error: "Please provide an email address or phone number." },
        { status: 400 }
      );
    }

    const sanitizedFirstName = firstName.trim().slice(0, 50);
    const sanitizedLastName = lastName.trim().slice(0, 50);

    const supabase = createAdminClient();

    // ── Pre-check for an existing account on either identifier ──
    // (auth.admin.createUser will also reject duplicates, but checking first
    //  lets us return a clean, specific message.)
    const conflict = await findIdentifierConflict(
      supabase,
      sanitizedEmail,
      e164Phone
    );
    if (conflict) {
      return NextResponse.json({ error: conflict }, { status: 409 });
    }

    // Email verification token (only used on the email path).
    const verificationToken = randomUUID();

    // Auth identity is ALWAYS an email. If the member gave a real email we use
    // it; otherwise we mint an internal stand-in email from their phone. We
    // never bind the phone to the Supabase auth record — phone login resolves
    // to this email server-side, so we don't depend on Supabase's phone
    // provider at all. The real phone lives only on the profile.
    const authEmail = sanitizedEmail || syntheticEmailForPhone(e164Phone);
    if (!authEmail) {
      return NextResponse.json(
        { error: "Please provide an email address or phone number." },
        { status: 400 }
      );
    }

    // Create the auth user. We auto-confirm in Supabase (so password sign-in
    // works) and track our own verification flags on the profile.
    const createPayload: Parameters<
      typeof supabase.auth.admin.createUser
    >[0] = {
      email: authEmail,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: sanitizedFirstName,
        last_name: sanitizedLastName,
        role: "member",
        ...(contactMethod === "email"
          ? { email_verification_token: verificationToken }
          : {}),
      },
    };

    const { data, error } = await supabase.auth.admin.createUser(createPayload);

    if (error) {
      const msg = error.message.toLowerCase();
      if (
        msg.includes("already been registered") ||
        msg.includes("already exists") ||
        msg.includes("already registered")
      ) {
        return NextResponse.json(
          {
            error:
              "An account with this email or phone already exists. Please sign in instead.",
          },
          { status: 409 }
        );
      }

      console.error("[AUTH] Signup error:", error.message);
      return NextResponse.json(
        { error: "Unable to create account. Please try again." },
        { status: 500 }
      );
    }

    const userId = data.user?.id;

    // Populate profile fields. The trigger created the row; we enrich it.
    if (userId) {
      await supabase
        .from("profiles")
        .update({
          first_name: sanitizedFirstName,
          last_name: sanitizedLastName,
          email: sanitizedEmail,
          phone: e164Phone,
          sms_opt_in: !!e164Phone,
          email_notifications: !!sanitizedEmail,
          public_directory: true,
          is_email_verified: false,
          is_phone_verified: false,
          is_approved: false,
        })
        .eq("id", userId);

      // Auto-assign to Pew Ministry (every member starts here).
      const { data: pewMinistry } = await supabase
        .from("ministries")
        .select("id")
        .ilike("name", "%pew%")
        .eq("is_active", true)
        .maybeSingle();

      if (pewMinistry) {
        await supabase.from("ministry_members").insert({
          ministry_id: pewMinistry.id,
          profile_id: userId,
          role: "member",
          status: "approved",
          approved_at: new Date().toISOString(),
        });
      }
    }

    // ── Phone path: send the SMS code ──
    if (contactMethod === "phone" && userId && e164Phone) {
      const issued = await issuePhoneOtp(supabase, userId, e164Phone, "signup");
      if (!issued.ok) {
        // Roll the account back so the member can retry cleanly.
        await supabase.auth.admin.deleteUser(userId);
        return NextResponse.json(
          { error: issued.error },
          {
            status: issued.status,
            headers: issued.retryAfter
              ? { "Retry-After": issued.retryAfter.toString() }
              : undefined,
          }
        );
      }

      console.log("[AUDIT] auth.signup", {
        userId,
        channel: "phone",
        ip,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json(
        {
          message: "Account created. Enter the code we just texted you.",
          userId,
          requiresVerification: "phone",
        },
        { status: 201 }
      );
    }

    // ── Email path: send the verification link ──
    const siteUrl = getSiteUrl();
    const verificationUrl = `${siteUrl}/auth/verify-email?token=${verificationToken}`;

    const emailResult = await sendEmail({
      to: sanitizedEmail!,
      subject: `Welcome to Friendship Baptist Church, ${sanitizedFirstName}! Please verify your email`,
      html: getWelcomeEmailHtml(sanitizedFirstName, verificationUrl),
      text: getWelcomeEmailText(sanitizedFirstName, verificationUrl),
    }).catch((err) => {
      console.error("[EMAIL] Welcome email failed:", err);
      return { success: false as const, error: "Email delivery failed." };
    });

    console.log("[AUDIT] auth.signup", {
      userId,
      channel: "email",
      emailSent: emailResult.success,
      ip,
      timestamp: new Date().toISOString(),
    });

    // The account exists either way. Only promise "check your email" if the
    // email actually went out — otherwise point them to the resend flow so we
    // never strand a member the way Resend-not-configured did.
    return NextResponse.json(
      {
        message: emailResult.success
          ? "Account created successfully! Please check your email to verify your address."
          : "Your account was created, but we couldn't send your verification email just now. Please go to the sign-in page and choose \"Resend verification email,\" or contact the church office.",
        userId,
        requiresVerification: "email",
        emailSent: emailResult.success,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[AUTH] Unexpected signup error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * Return a user-facing message if the email or phone already belongs to an
 * existing profile, otherwise null. Uses the admin client (bypasses RLS).
 */
async function findIdentifierConflict(
  admin: ReturnType<typeof createAdminClient>,
  email: string | null,
  phone: string | null
): Promise<string | null> {
  if (email) {
    const { data } = await admin
      .from("profiles")
      .select("id")
      .ilike("email", email)
      .maybeSingle();
    if (data) {
      return "An account with this email already exists. Please sign in instead.";
    }
  }
  if (phone && isValidUsPhone(phone)) {
    const { data } = await admin
      .from("profiles")
      .select("id")
      .eq("phone", phone)
      .maybeSingle();
    if (data) {
      return "An account with this phone number already exists. Please sign in instead.";
    }
  }
  return null;
}
