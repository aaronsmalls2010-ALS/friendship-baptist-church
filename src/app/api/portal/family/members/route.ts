import { NextResponse } from "next/server";

/**
 * RETIRED. The old "family head manages members" flow is gone.
 *
 * Families are now admin-managed (see /api/admin/families/[id]/members), and
 * members add/remove only THEMSELVES via /api/portal/family/join and
 * /api/portal/family/leave. These endpoints respond 410 Gone.
 */
function gone() {
  return NextResponse.json(
    {
      error:
        "This action has moved. Members join or leave families themselves; admins manage family membership.",
    },
    { status: 410 }
  );
}

export async function POST() {
  return gone();
}

export async function DELETE() {
  return gone();
}
