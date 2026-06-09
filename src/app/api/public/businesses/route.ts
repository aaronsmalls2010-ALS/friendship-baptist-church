import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeHtml, sanitizeInput, sanitizeEmail } from "@/lib/security/sanitize";
import { formRateLimit } from "@/lib/security/rate-limit";
import { isLikelyBot } from "@/lib/security/bot-protection";

/**
 * GET /api/public/businesses
 *
 * Returns all approved businesses, ordered by name.
 */
export async function GET() {
  try {
    const admin = createAdminClient();
    const { data: businesses, error } = await admin
      .from("businesses")
      .select("*")
      .eq("is_approved", true)
      .order("name", { ascending: true });

    if (error) {
      console.error("[PUBLIC] Fetch businesses error:", error);
      return NextResponse.json(
        { error: "Failed to fetch businesses" },
        { status: 500 }
      );
    }

    return NextResponse.json({ businesses: businesses ?? [] });
  } catch (err) {
    console.error("[PUBLIC] Businesses GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

const MAX_NAME = 200;
const MAX_DESC = 2000;
const MAX_SHORT = 100;
const MAX_URL = 500;

/**
 * POST /api/public/businesses
 *
 * Submit a business for review. Inserted with is_approved = false.
 */
export async function POST(request: NextRequest) {
  try {
    if (isLikelyBot(request)) {
      return NextResponse.json({ business: { id: "ok" } }, { status: 201 });
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
    const { name, ownerName, description, category, phone, email, website, honeypot } = body;

    if (honeypot) {
      return NextResponse.json({ business: { id: "ok" } }, { status: 201 });
    }

    if (!name || !ownerName || !description) {
      return NextResponse.json({ error: "Name, owner, and description are required" }, { status: 400 });
    }

    const sName = sanitizeHtml(sanitizeInput(String(name)).slice(0, MAX_NAME));
    const sOwner = sanitizeHtml(sanitizeInput(String(ownerName)).slice(0, MAX_NAME));
    const sDesc = sanitizeHtml(sanitizeInput(String(description)).slice(0, MAX_DESC));
    const sCat = category ? sanitizeHtml(sanitizeInput(String(category)).slice(0, MAX_SHORT)) : null;
    const sPhone = phone ? sanitizeHtml(sanitizeInput(String(phone)).slice(0, 30)) : null;
    const sWebsite = website ? String(website).slice(0, MAX_URL) : null;

    let sEmail: string | null = null;
    if (email) {
      sEmail = sanitizeEmail(String(email).slice(0, 254));
    }

    if (!sName || !sOwner || !sDesc) {
      return NextResponse.json({ error: "Name, owner, and description are required" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("businesses")
      .insert({
        name: sName,
        owner_name: sOwner,
        description: sDesc,
        category: sCat,
        phone: sPhone,
        email: sEmail,
        website: sWebsite,
        is_approved: false,
      })
      .select()
      .single();

    if (error) {
      console.error("[PUBLIC] Business submission error:", error);
      return NextResponse.json({ error: "Failed to submit business" }, { status: 500 });
    }

    return NextResponse.json({ business: data }, { status: 201 });
  } catch (err) {
    console.error("[PUBLIC] Businesses POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
