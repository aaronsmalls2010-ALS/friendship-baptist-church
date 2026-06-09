import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeHtml, sanitizeInput, sanitizeEmail } from "@/lib/security/sanitize";
import { formRateLimit } from "@/lib/security/rate-limit";
import { isLikelyBot } from "@/lib/security/bot-protection";

const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;
const MAX_PHONE_LENGTH = 30;

/**
 * POST /api/public/connect-cards
 *
 * Stores a visitor connect card for the welcome team.
 * Protected by rate limiting, bot detection, and input sanitization.
 */
export async function POST(request: NextRequest) {
  try {
    if (isLikelyBot(request)) {
      return NextResponse.json({ card: { id: "ok" } }, { status: 201 });
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const rateLimitResult = await formRateLimit.check(3, ip);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many submissions. Please try again later." },
        { status: 429, headers: { "Retry-After": Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString() } }
      );
    }

    const body = await request.json();
    const { firstName, lastName, email, phone, hearAbout, interests, honeypot } = body;

    if (honeypot) {
      return NextResponse.json({ card: { id: "ok" } }, { status: 201 });
    }

    if (!firstName || !lastName || !email) {
      return NextResponse.json({ error: "First name, last name, and email are required" }, { status: 400 });
    }

    const sanitizedFirstName = sanitizeHtml(sanitizeInput(String(firstName)).slice(0, MAX_NAME_LENGTH));
    const sanitizedLastName = sanitizeHtml(sanitizeInput(String(lastName)).slice(0, MAX_NAME_LENGTH));
    const sanitizedPhone = phone ? sanitizeHtml(sanitizeInput(String(phone)).slice(0, MAX_PHONE_LENGTH)) : null;
    const sanitizedHearAbout = hearAbout ? sanitizeHtml(sanitizeInput(String(hearAbout)).slice(0, 100)) : null;

    const sanitizedEmail = sanitizeEmail(String(email).slice(0, MAX_EMAIL_LENGTH));
    if (!sanitizedEmail) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    if (!sanitizedFirstName || !sanitizedLastName) {
      return NextResponse.json({ error: "Name fields are required" }, { status: 400 });
    }

    const sanitizedInterests = Array.isArray(interests)
      ? interests.filter((i): i is string => typeof i === "string").map((i) => sanitizeHtml(sanitizeInput(i)).slice(0, 100))
      : [];

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("connect_cards")
      .insert({
        first_name: sanitizedFirstName,
        last_name: sanitizedLastName,
        email: sanitizedEmail,
        phone: sanitizedPhone,
        hear_about: sanitizedHearAbout,
        interests: sanitizedInterests,
      })
      .select()
      .single();

    if (error) {
      console.error("[PUBLIC] Connect card error:", error);
      return NextResponse.json({ error: "Failed to submit connect card" }, { status: 500 });
    }

    return NextResponse.json({ card: data }, { status: 201 });
  } catch (err) {
    console.error("[PUBLIC] Connect cards POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
