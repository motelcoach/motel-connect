import { onboardNetwork } from "@/lib/supabase/onboard";
import { isMissingTable } from "@/lib/supabase/missing";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase/admin";
import type { ManagerRosterRecord } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

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

  const { data, error } = await admin
    .from("managers")
    .select("id, email, name, phone, location, state, basket, verified_by_admin, created_at")
    .order("created_at", { ascending: false });

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

  let body: { email?: string; basket?: string };
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
  if (!basket) {
    return NextResponse.json({ error: "Basket must be premium or open" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin()
    .from("managers")
    .update({
      basket,
      verified_by_admin: basket === "premium",
    })
    .ilike("email", email)
    .select("id, email, name, phone, location, state, basket, verified_by_admin, created_at")
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
