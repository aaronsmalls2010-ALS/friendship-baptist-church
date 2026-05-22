import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// ── Rate limiting for signup (stricter than general auth) ──
const signupAttempts = new Map<string, { count: number; resetTime: number }>();

function checkSignupLimit(ip: string): boolean {
  const now = Date.now();
  const entry = signupAttempts.get(ip);

  // Clean up expired entries periodically
  if (Math.random() < 0.05) {
    for (const [key, val] of signupAttempts) {
      if (now > val.resetTime) signupAttempts.delete(key);
    }
  }

  if (!entry || now > entry.resetTime) {
    signupAttempts.set(ip, { count: 1, resetTime: now + 60 * 60 * 1000 }); // 1 hour window
    return true;
  }

  entry.count++;
  return entry.count <= 5; // Max 5 signups per IP per hour
}

export async function POST(request: NextRequest) {
  try {
    // ── Rate limiting ──
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

    // ── Parse and validate request body ──
    const body = await request.json();
    const { email, password, firstName, lastName, phone, honeypot } = body;

    // ── Honeypot check (bot detection) ──
    if (honeypot) {
      // Silently reject — don't tell bots they were caught
      return NextResponse.json(
        { message: "Account created successfully. Please check your email." },
        { status: 200 }
      );
    }

    // ── Basic server-side validation ──
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: "All required fields must be provided." },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format." },
        { status: 400 }
      );
    }

    // Password strength validation (server-side enforcement)
    if (password.length < 12) {
      return NextResponse.json(
        { error: "Password must be at least 12 characters." },
        { status: 400 }
      );
    }
    if (!/[A-Z]/.test(password)) {
      return NextResponse.json(
        { error: "Password must contain an uppercase letter." },
        { status: 400 }
      );
    }
    if (!/[a-z]/.test(password)) {
      return NextResponse.json(
        { error: "Password must contain a lowercase letter." },
        { status: 400 }
      );
    }
    if (!/[0-9]/.test(password)) {
      return NextResponse.json(
        { error: "Password must contain a number." },
        { status: 400 }
      );
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      return NextResponse.json(
        { error: "Password must contain a special character." },
        { status: 400 }
      );
    }

    // ── Sanitize inputs ──
    const sanitizedFirstName = firstName.trim().slice(0, 50);
    const sanitizedLastName = lastName.trim().slice(0, 50);
    const sanitizedEmail = email.trim().toLowerCase().slice(0, 255);
    const sanitizedPhone = phone ? phone.trim().slice(0, 20) : undefined;

    // ── Create user with Supabase ──
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase.auth.signUp({
      email: sanitizedEmail,
      password,
      options: {
        data: {
          first_name: sanitizedFirstName,
          last_name: sanitizedLastName,
          phone: sanitizedPhone,
          role: "member", // Default role — admin must promote
        },
        emailRedirectTo: `${request.nextUrl.origin}/auth/callback`,
      },
    });

    if (error) {
      // Don't leak specific error details about existing accounts
      if (error.message.includes("already registered")) {
        // Return same success message to prevent user enumeration
        return NextResponse.json(
          {
            message:
              "If this email is not already registered, you will receive a verification email shortly.",
          },
          { status: 200 }
        );
      }

      console.error("[AUTH] Signup error:", error.message);
      return NextResponse.json(
        { error: "Unable to create account. Please try again." },
        { status: 500 }
      );
    }

    // Log the signup event (audit trail)
    console.log("[AUDIT] auth.signup", {
      userId: data.user?.id,
      email: sanitizedEmail,
      ip,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        message:
          "Account created successfully. Please check your email to verify your account.",
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
