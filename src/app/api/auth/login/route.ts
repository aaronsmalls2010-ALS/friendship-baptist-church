import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const sanitizedEmail = email.trim().toLowerCase();

    // ── Check account lockout (by IP + email combination) ──
    const lockoutKey = `${ip}:${sanitizedEmail}`;
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

    // ── Attempt login ──
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: sanitizedEmail,
      password,
    });

    if (error) {
      recordFailedAttempt(lockoutKey);

      console.log("[AUDIT] auth.failed_login", {
        email: sanitizedEmail,
        ip,
        reason: error.message,
        timestamp: new Date().toISOString(),
      });

      // Generic error message to prevent user enumeration
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // ── Success ──
    clearFailedAttempts(lockoutKey);

    console.log("[AUDIT] auth.login", {
      userId: data.user.id,
      email: sanitizedEmail,
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
