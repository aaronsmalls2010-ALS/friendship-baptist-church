import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeHtml, sanitizeInput, sanitizeEmail } from "@/lib/security/sanitize";
import { formRateLimit } from "@/lib/security/rate-limit";
import { isLikelyBot } from "@/lib/security/bot-protection";

const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;
const MAX_PHONE_LENGTH = 30;
const MAX_SUBJECT_LENGTH = 200;
const MAX_TYPE_LENGTH = 50;
const MAX_MESSAGE_LENGTH = 5000;

/**
 * POST /api/public/contact
 *
 * Stores a contact form submission for the church office to review.
 * Protected by rate limiting, bot detection, and input sanitization.
 */
export async function POST(request: NextRequest) {
  try {
    if (isLikelyBot(request)) {
      return NextResponse.json({ submission: { id: "ok" } }, { status: 201 });
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const rateLimitResult = await formRateLimit.check(5, ip);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many submissions. Please try again later." },
        { status: 429, headers: { "Retry-After": Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString() } }
      );
    }

    const body = await request.json();
    const { name, email, phone, subject, type, message, honeypot } = body;

    if (honeypot) {
      return NextResponse.json({ submission: { id: "ok" } }, { status: 201 });
    }

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Name, email, and message are required" }, { status: 400 });
    }

    const sanitizedName = sanitizeHtml(sanitizeInput(String(name)).slice(0, MAX_NAME_LENGTH));
    const sanitizedMessage = sanitizeHtml(sanitizeInput(String(message)).slice(0, MAX_MESSAGE_LENGTH));
    const sanitizedSubject = subject ? sanitizeHtml(sanitizeInput(String(subject)).slice(0, MAX_SUBJECT_LENGTH)) : null;
    const sanitizedType = type ? sanitizeHtml(sanitizeInput(String(type)).slice(0, MAX_TYPE_LENGTH)) : null;
    const sanitizedPhone = phone ? sanitizeHtml(sanitizeInput(String(phone)).slice(0, MAX_PHONE_LENGTH)) : null;

    const sanitizedEmail = sanitizeEmail(String(email).slice(0, MAX_EMAIL_LENGTH));
    if (!sanitizedEmail) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    if (!sanitizedName || !sanitizedMessage) {
      return NextResponse.json({ error: "Name and message are required" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("contact_submissions")
      .insert({
        name: sanitizedName,
        email: sanitizedEmail,
        phone: sanitizedPhone,
        subject: sanitizedSubject,
        inquiry_type: sanitizedType,
        message: sanitizedMessage,
      })
      .select()
      .single();

    if (error) {
      console.error("[PUBLIC] Contact submission error:", error);
      return NextResponse.json({ error: "Failed to submit message" }, { status: 500 });
    }

    return NextResponse.json({ submission: data }, { status: 201 });
  } catch (err) {
    console.error("[PUBLIC] Contact POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
