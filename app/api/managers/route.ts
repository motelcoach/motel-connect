import { onboardNetwork } from "@/lib/supabase/onboard";
import { isMissingTable } from "@/lib/supabase/missing";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase/admin";
import { toProfileJson } from "@/lib/managers";
import type { ManagerProfile, ManagerRosterRecord } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

const ROSTER_COLUMNS = "id, email, name, phone, location, state, basket, verified_by_admin, created_at";
const PROFILE_COLUMNS = `${ROSTER_COLUMNS}, profile`;

type ManagerRow = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  location: string | null;
  state: string | null;
  basket: "premium" | "open";
  verified_by_admin: boolean;
  created_at: string;
  profile?: Partial<ManagerProfile> | null;
};

function toRecord(row: ManagerRow): ManagerRosterRecord {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    phone: row.phone,
    location: row.location,
    state: row.state,
    basket: row.basket,
    verifiedByAdmin: row.verified_by_admin,
    createdAt: row.created_at,
    profile: row.profile && Object.keys(row.profile).length ? row.profile : null,
  };
}

function unavailable() {
  return NextResponse.json(
    { error: "Supabase is not configured", configured: false },
    { status: 503 },
  );
}

export async function GET() {
  if (!isSupabaseConfigured()) return unavailable();

  const admin = supabaseAdmin();
  try {
    await onboardNetwork(admin);
  } catch {
    // Table may not exist until schema.sql is applied.
  }

  let { data, error } = await admin
    .from("managers")
    .select(PROFILE_COLUMNS)
    .order("created_at", { ascending: false });

  if (error && !isMissingTable(error)) {
    const fallback = await admin
      .from("managers")
      .select(ROSTER_COLUMNS)
      .order("created_at", { ascending: false });
    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    if (isMissingTable(error)) {
      return NextResponse.json({
        configured: true,
        managers: [] as ManagerRosterRecord[],
        needsMigration: true,
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    configured: true,
    managers: ((data ?? []) as ManagerRow[]).map(toRecord),
  });
}

export async function PATCH(request: NextRequest) {
  if (!isSupabaseConfigured()) return unavailable();

  let body: { email?: string; basket?: string; profile?: ManagerProfile };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const basket = body.basket === "premium" ? "premium" : body.basket === "open" ? "open" : null;

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (basket) {
    patch.basket = basket;
    patch.verified_by_admin = basket === "premium";
  }
  if (body.profile) {
    patch.name = body.profile.name;
    patch.phone = body.profile.phone || null;
    patch.location = body.profile.location || null;
    patch.state = body.profile.state;
    patch.profile = toProfileJson(body.profile);
  }
  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin()
    .from("managers")
    .update(patch)
    .ilike("email", email)
    .select(PROFILE_COLUMNS)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Manager not found" }, { status: 404 });
  }

  return NextResponse.json({
    configured: true,
    manager: toRecord(data as ManagerRow),
  });
}
