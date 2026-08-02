import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const CARD_TYPES = ["connect", "salvation", "baptism", "prayer", "interest"] as const;
type CardType = (typeof CARD_TYPES)[number];

/**
 * POST /api/portal/connection-cards
 *
 * A signed-in member submits a Connection / Next-Steps card. The caller is
 * resolved from the session; profile_id and default name/email come from their
 * profile. Insert runs through the service-role client (RLS allows anyone to
 * INSERT with check true, but we resolve identity server-side).
 */
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const cardType = body.card_type;
  const message = body.message;

  // Validate card_type is one of the allowed values.
  if (cardType !== undefined && cardType !== null) {
    if (typeof cardType !== "string" || !CARD_TYPES.includes(cardType as CardType)) {
      return NextResponse.json({ error: "Invalid card_type" }, { status: 400 });
    }
  }

  const safeMessage =
    typeof message === "string" ? message.trim().slice(0, 5000) : "";

  // Require a message OR a card_type.
  if (!cardType && !safeMessage) {
    return NextResponse.json(
      { error: "A card type or a message is required" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Default name/email from the member's profile.
  const { data: profile } = await admin
    .from("profiles")
    .select("first_name, last_name, email, phone")
    .eq("id", user.id)
    .maybeSingle();

  const profileName = profile
    ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim()
    : "";

  const name =
    (typeof body.name === "string" && body.name.trim()) ||
    profileName ||
    "Member";
  const email =
    (typeof body.email === "string" && body.email.trim()) ||
    profile?.email ||
    user.email ||
    null;
  const phone =
    (typeof body.phone === "string" && body.phone.trim()) ||
    profile?.phone ||
    null;

  const { error } = await admin.from("connection_cards").insert({
    profile_id: user.id,
    name: name.slice(0, 200),
    email: email ? String(email).slice(0, 200) : null,
    phone: phone ? String(phone).slice(0, 50) : null,
    card_type: (cardType as CardType) ?? "connect",
    message: safeMessage || null,
    status: "new",
  });

  if (error) {
    console.error("[PORTAL] Connection card insert error:", error);
    return NextResponse.json(
      { error: "Failed to submit connection card" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
