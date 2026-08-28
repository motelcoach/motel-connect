import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase/admin";
import type { WaitlistEntry } from "@/lib/types";
import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";

type WaitlistRow = {
  id: string;
  email: string;
  interest: "owner" | "manager";
  invite_code: string;
  referred_by: string | null;
  created_at: string;
};

function makeInviteCode() {
  return `MC${randomBytes(3).toString("hex").toUpperCase()}`;
}

function toEntry(row: WaitlistRow): WaitlistEntry {
  return {
    id: row.id,
    email: row.email,
    interest: row.interest,
    createdAt: row.created_at,
    inviteCode: row.invite_code,
    referredBy: row.referred_by ?? undefined,
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

  const { data, error } = await supabaseAdmin()
    .from("waitlist")
    .select("id, email, interest, invite_code, referred_by, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    configured: true,
    waitlist: ((data ?? []) as WaitlistRow[]).map(toEntry),
  });
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) return unavailable();

  let body: { email?: string; interest?: string; referredBy?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const interest = body.interest === "manager" ? "manager" : body.interest === "owner" ? "owner" : null;
  const referredBy = body.referredBy?.trim().toUpperCase() || null;

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }
  if (!interest) {
    return NextResponse.json({ error: "Interest must be owner or manager" }, { status: 400 });
  }

  const admin = supabaseAdmin();
  const { data: existing, error: existingError } = await admin
    .from("waitlist")
    .select("id, email, interest, invite_code, referred_by, created_at")
    .ilike("email", email)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }
  if (existing) {
    return NextResponse.json({
      configured: true,
      waitlist: toEntry(existing as WaitlistRow),
      inviteCode: (existing as WaitlistRow).invite_code,
    });
  }

  const insert = {
    email,
    interest,
    invite_code: makeInviteCode(),
    referred_by: referredBy,
  };

  const { data, error } = await admin
    .from("waitlist")
    .insert(insert)
    .select("id, email, interest, invite_code, referred_by, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const entry = toEntry(data as WaitlistRow);
  return NextResponse.json({ configured: true, waitlist: entry, inviteCode: entry.inviteCode });
}
