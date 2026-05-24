import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeHtml, sanitizeInput, sanitizeEmail } from "@/lib/security/sanitize";
import { formRateLimit } from "@/lib/security/rate-limit";
import { isLikelyBot } from "@/lib/security/bot-protection";

/** Maximum field lengths to prevent abuse */
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;
const MAX_REQUEST_LENGTH = 2000;
const MAX_CATEGORY_LENGTH = 50;

/** Rate limit: 3 prayer requests per hour per IP */
const prayerRateLimit = formRateLimit;

/**
 * GET /api/public/prayer-requests
 *
 * Returns all public prayer requests, ordered by created_at descending.
 */
export async function GET() {
  try {
    const admin = createAdminClient();
    const { data: prayerRequests, error } = await admin
      .from("prayer_requests")
      .select("*")
      .eq("is_public", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[PUBLIC] Fetch prayer requests error:", error);
      return NextResponse.json(
        { error: "Failed to fetch prayer requests" },
        { status: 500 }
      );
    }

    return NextResponse.json({ prayerRequests: prayerRequests ?? [] });
  } catch (err) {
    console.error("[PUBLIC] Prayer requests GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/public/prayer-requests
 *
 * Creates a new prayer request (anonymous submission allowed).
 * Protected by rate limiting, bot detection, and input sanitization.
 */
export async function POST(request: NextRequest) {
  try {
    // ── Bot detection ──
    if (isLikelyBot(request)) {
      // Return a fake success to not tip off bots
      return NextResponse.json(
        { prayerRequest: { id: "ok" } },
        { status: 201 }
      );
    }

    // ── Rate limiting: 3 submissions per hour per IP ──
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const rateLimitResult = await prayerRateLimit.check(3, ip);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many submissions. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil(
              (rateLimitResult.reset - Date.now()) / 1000
            ).toString(),
          },
        }
      );
    }

    const body = await request.json();
    const {
      name,
      email,
      request: prayerRequest,
      is_public,
      category,
      honeypot,
    } = body;

    // ── Honeypot check ──
    if (honeypot) {
      // Silently discard — bot filled in the hidden field
      return NextResponse.json(
        { prayerRequest: { id: "ok" } },
        { status: 201 }
      );
    }

    // ── Required field validation ──
    if (!name || !prayerRequest) {
      return NextResponse.json(
        { error: "Name and request are required" },
        { status: 400 }
      );
    }

    if (typeof name !== "string" || typeof prayerRequest !== "string") {
      return NextResponse.json(
        { error: "Invalid input types" },
        { status: 400 }
      );
    }

    // ── Sanitize all inputs ──
    const sanitizedName = sanitizeHtml(
      sanitizeInput(name).slice(0, MAX_NAME_LENGTH)
    );
    const sanitizedRequest = sanitizeHtml(
      sanitizeInput(prayerRequest).slice(0, MAX_REQUEST_LENGTH)
    );
    const sanitizedCategory = category
      ? sanitizeHtml(sanitizeInput(String(category)).slice(0, MAX_CATEGORY_LENGTH))
      : null;

    // Validate email if provided
    let sanitizedEmailValue: string | null = null;
    if (email) {
      sanitizedEmailValue = sanitizeEmail(
        String(email).slice(0, MAX_EMAIL_LENGTH)
      );
      // If email was provided but is invalid after sanitization, reject it
      if (!sanitizedEmailValue) {
        return NextResponse.json(
          { error: "Invalid email format" },
          { status: 400 }
        );
      }
    }

    // Final check: sanitized values must still be non-empty
    if (!sanitizedName || !sanitizedRequest) {
      return NextResponse.json(
        { error: "Name and request are required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("prayer_requests")
      .insert({
        name: sanitizedName,
        email: sanitizedEmailValue,
        request: sanitizedRequest,
        is_public: is_public === true,
        category: sanitizedCategory,
      })
      .select()
      .single();

    if (error) {
      console.error("[PUBLIC] Create prayer request error:", error);
      return NextResponse.json(
        { error: "Failed to create prayer request" },
        { status: 500 }
      );
    }

    return NextResponse.json({ prayerRequest: data }, { status: 201 });
  } catch (err) {
    console.error("[PUBLIC] Prayer requests POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
