import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { getWelcomeEmailHtml, getWelcomeEmailText } from "@/lib/email/welcome";

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
    const { email, password, firstName, lastName, phone, honeypot } = body;

    // Honeypot check
    if (honeypot) {
      return NextResponse.json(
        { message: "Account created successfully. Please check your email." },
        { status: 200 }
      );
    }

    // Basic validation
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: "All required fields must be provided." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format." },
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

    // Sanitize
    const sanitizedFirstName = firstName.trim().slice(0, 50);
    const sanitizedLastName = lastName.trim().slice(0, 50);
    const sanitizedEmail = email.trim().toLowerCase().slice(0, 255);
    const sanitizedPhone = phone ? phone.trim().slice(0, 20) : undefined;

    // Generate a verification token for email confirmation
    const verificationToken = randomUUID();

    // Create user with admin API — auto-confirm in Supabase auth so the
    // account exists, but we track email verification separately on the profile.
    const supabase = createAdminClient();

    const { data, error } = await supabase.auth.admin.createUser({
      email: sanitizedEmail,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: sanitizedFirstName,
        last_name: sanitizedLastName,
        phone: sanitizedPhone,
        role: "member",
        email_verification_token: verificationToken,
      },
    });

    if (error) {
      if (error.message.includes("already been registered") || error.message.includes("already exists")) {
        return NextResponse.json(
          { error: "An account with this email already exists. Please sign in instead." },
          { status: 409 }
        );
      }

      console.error("[AUTH] Signup error:", error.message);
      return NextResponse.json(
        { error: "Unable to create account. Please try again." },
        { status: 500 }
      );
    }

    // Update profile with name, phone, and verification fields.
    // The trigger creates the profile row; we set additional fields here.
    if (data.user) {
      await supabase
        .from("profiles")
        .update({
          first_name: sanitizedFirstName,
          last_name: sanitizedLastName,
          phone: sanitizedPhone || null,
          is_email_verified: false,
          is_approved: false,
        })
        .eq("id", data.user.id);
    }

    // Build the verification URL
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://thefriendshipbaptist.com";
    const verificationUrl = `${siteUrl}/auth/verify-email?token=${verificationToken}`;

    // Send welcome email with verification link (non-blocking)
    sendEmail({
      to: sanitizedEmail,
      subject: `Welcome to Friendship Baptist Church, ${sanitizedFirstName}! Please verify your email`,
      html: getWelcomeEmailHtml(sanitizedFirstName, verificationUrl),
      text: getWelcomeEmailText(sanitizedFirstName, verificationUrl),
    }).catch((err) => {
      console.error("[EMAIL] Welcome email failed:", err);
    });

    console.log("[AUDIT] auth.signup", {
      userId: data.user?.id,
      email: sanitizedEmail,
      ip,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        message:
          "Account created successfully! Please check your email to verify your address.",
        userId: data.user?.id,
        requiresVerification: true,
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
