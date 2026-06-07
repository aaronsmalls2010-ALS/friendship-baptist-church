import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { toE164, looksLikeEmail } from "@/lib/phone";

// ── Failed login tracking (account lockout) ──
const failedAttempts = new Map<
  string,
  { count: number; lockoutUntil: number }
>();

function checkLockout(
  key: string
): { locked: boolean; remainingSeconds: number } {
  const now = Date.now();
  const entry = failedAttempts.get(key);

  if (!entry) return { locked: false, remainingSeconds: 0 };
  if (now > entry.lockoutUntil) {
    failedAttempts.delete(key);
    return { locked: false, remainingSeconds: 0 };
  }

  return {
    locked: entry.count >= 5,
    remainingSeconds: Math.ceil((entry.lockoutUntil - now) / 1000),
  };
}

function recordFailedAttempt(key: string): void {
  const now = Date.now();
  const entry = failedAttempts.get(key);

  if (!entry || now > entry.lockoutUntil) {
    failedAttempts.set(key, {
      count: 1,
      lockoutUntil: now + 15 * 60 * 1000, // 15-minute window
    });
    return;
  }

  entry.count++;

  // Progressive lockout: 5 fails = 15 min, 10 fails = 1 hour, 15+ = 4 hours
  if (entry.count >= 15) {
    entry.lockoutUntil = now + 4 * 60 * 60 * 1000;
  } else if (entry.count >= 10) {
    entry.lockoutUntil = now + 60 * 60 * 1000;
  } else if (entry.count >= 5) {
    entry.lockoutUntil = now + 15 * 60 * 1000;
  }
}

function clearFailedAttempts(key: string): void {
  failedAttempts.delete(key);
}

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const body = await request.json();
    const { identifier, email, password } = body;

    // Accept either the new `identifier` field or the legacy `email` field.
    const rawIdentifier = (identifier ?? email ?? "").toString().trim();

    if (!rawIdentifier || !password) {
      return NextResponse.json(
        { error: "Email or phone and password are required." },
        { status: 400 }
      );
    }

    // Resolve the identifier into either an email or an E.164 phone.
    const isEmail = looksLikeEmail(rawIdentifier);
    const sanitizedEmail = isEmail ? rawIdentifier.toLowerCase() : null;
    const e164Phone = isEmail ? null : toE164(rawIdentifier);

    if (!sanitizedEmail && !e164Phone) {
      return NextResponse.json(
        { error: "Enter a valid email address or phone number." },
        { status: 400 }
      );
    }

    // ── Check account lockout (by IP + identifier combination) ──
    const lockoutKey = `${ip}:${sanitizedEmail ?? e164Phone}`;
    const { locked, remainingSeconds } = checkLockout(lockoutKey);

    if (locked) {
      console.log("[AUDIT] auth.lockout", {
        email: sanitizedEmail,
        ip,
        remainingSeconds,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json(
        {
          error: `Account temporarily locked due to too many failed attempts. Please try again in ${Math.ceil(remainingSeconds / 60)} minutes.`,
          locked: true,
          retryAfter: remainingSeconds,
        },
        { status: 429, headers: { "Retry-After": remainingSeconds.toString() } }
      );
    }

    // ── Attempt login (with email or phone) ──
    const supabase = await createServerSupabaseClient();
    const { data, error } = sanitizedEmail
      ? await supabase.auth.signInWithPassword({
          email: sanitizedEmail,
          password,
        })
      : await supabase.auth.signInWithPassword({
          phone: e164Phone!,
          password,
        });

    if (error || !data.user) {
      recordFailedAttempt(lockoutKey);

      console.log("[AUDIT] auth.failed_login", {
        identifier: sanitizedEmail ?? e164Phone,
        ip,
        reason: error?.message,
        timestamp: new Date().toISOString(),
      });

      // Generic error message to prevent user enumeration
      return NextResponse.json(
        { error: "Invalid login. Please check your details and try again." },
        { status: 401 }
      );
    }

    // ── Verification gate ──
    // The account is active once EITHER channel has been verified.
    // Use admin client to bypass RLS and read profile fields directly.
    const adminClient = createAdminClient();
    const { data: profile } = await adminClient
      .from("profiles")
      .select("is_email_verified, is_phone_verified")
      .eq("id", data.user.id)
      .single();

    const isVerified =
      !!profile &&
      (profile.is_email_verified === true || profile.is_phone_verified === true);

    if (!isVerified) {
      // Sign the user out so the session isn't left active
      await supabase.auth.signOut();

      return NextResponse.json(
        {
          error:
            "Please verify your account first. Check your email or text messages for your verification code.",
          code: "NOT_VERIFIED",
        },
        { status: 403 }
      );
    }

    // ── Success ──
    clearFailedAttempts(lockoutKey);

    console.log("[AUDIT] auth.login", {
      userId: data.user.id,
      identifier: sanitizedEmail ?? e164Phone,
      ip,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        message: "Login successful.",
        user: {
          id: data.user.id,
          email: data.user.email,
          role: data.user.user_metadata?.role || "member",
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[AUTH] Unexpected login error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
