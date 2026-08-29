import { onboardNetwork } from "@/lib/supabase/onboard";
import { isMissingTable } from "@/lib/supabase/missing";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase/admin";
import { asJobType, asRoleStatus } from "@/lib/roles";
import type { ListedRoleRecord } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

type RoleRow = {
  id: string;
  owner_email: string;
  owner_name: string;
  motel_name: string;
  location: string;
  state: string;
  job_type: string;
  start_date: string;
  end_date: string;
  daily_rate: number | string;
  notes: string;
  status: string;
  created_at: string;
};

function unavailable() {
  return NextResponse.json(
    { error: "Supabase is not configured", configured: false },
    { status: 503 },
  );
}

function toRecord(row: RoleRow, interestedEmails: string[]): ListedRoleRecord {
  return {
    id: row.id,
    ownerEmail: String(row.owner_email).toLowerCase(),
    ownerName: row.owner_name,
    motelName: row.motel_name,
    location: row.location,
    state: row.state,
    jobType: asJobType(row.job_type),
    startDate: String(row.start_date).slice(0, 10),
    endDate: String(row.end_date).slice(0, 10),
    dailyRate: Number(row.daily_rate),
    notes: row.notes ?? "",
    status: asRoleStatus(row.status),
    interestedEmails,
    createdAt: row.created_at,
  };
}

async function interestsByRole(admin: ReturnType<typeof supabaseAdmin>, roleIds: string[]) {
  const map = new Map<string, string[]>();
  if (!roleIds.length) return map;
  const { data } = await admin
    .from("listed_role_interest")
    .select("role_id, manager_email")
    .in("role_id", roleIds);
  for (const row of data ?? []) {
    const id = String(row.role_id);
    const email = String(row.manager_email ?? "").toLowerCase();
    const list = map.get(id) ?? [];
    if (email) list.push(email);
    map.set(id, list);
  }
  return map;
}

export async function GET() {
  if (!isSupabaseConfigured()) return unavailable();

  const admin = supabaseAdmin();
  try {
    await onboardNetwork(admin);
  } catch {
    // Tables may not exist until schema.sql is applied.
  }

  const { data, error } = await admin
    .from("listed_roles")
    .select(
      "id, owner_email, owner_name, motel_name, location, state, job_type, start_date, end_date, daily_rate, notes, status, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingTable(error)) {
      return NextResponse.json({ configured: true, roles: [] as ListedRoleRecord[], needsMigration: true });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as RoleRow[];
  const interest = await interestsByRole(
    admin,
    rows.map((row) => row.id),
  );

  return NextResponse.json({
    configured: true,
    roles: rows.map((row) => toRecord(row, interest.get(row.id) ?? [])),
  });
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) return unavailable();

  let body: {
    ownerEmail?: string;
    ownerName?: string;
    motelName?: string;
    location?: string;
    state?: string;
    jobType?: string;
    startDate?: string;
    endDate?: string;
    dailyRate?: number;
    notes?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const ownerEmail = body.ownerEmail?.trim().toLowerCase();
  if (!ownerEmail || !ownerEmail.includes("@")) {
    return NextResponse.json({ error: "Owner email is required" }, { status: 400 });
  }
  if (!body.startDate || !body.endDate) {
    return NextResponse.json({ error: "Start and end dates are required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin()
    .from("listed_roles")
    .insert({
      owner_email: ownerEmail,
      owner_name: body.ownerName ?? "",
      motel_name: body.motelName ?? "",
      location: body.location ?? "",
      state: body.state ?? "NSW",
      job_type: asJobType(body.jobType),
      start_date: body.startDate,
      end_date: body.endDate,
      daily_rate: Number(body.dailyRate) || 0,
      notes: body.notes ?? "",
      status: "Open",
    })
    .select(
      "id, owner_email, owner_name, motel_name, location, state, job_type, start_date, end_date, daily_rate, notes, status, created_at",
    )
    .maybeSingle();

  if (error) {
    if (isMissingTable(error)) {
      return NextResponse.json({
        configured: true,
        needsMigration: true,
        error: "Run supabase/schema.sql to create listed_roles.",
      }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Could not create the role" }, { status: 500 });
  }

  return NextResponse.json({ configured: true, role: toRecord(data as RoleRow, []) });
}

export async function PATCH(request: NextRequest) {
  if (!isSupabaseConfigured()) return unavailable();

  let body: { id?: string; status?: string; interestedEmail?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const id = body.id?.trim();
  if (!id) {
    return NextResponse.json({ error: "Role id is required" }, { status: 400 });
  }

  const admin = supabaseAdmin();

  if (body.status) {
    const status = asRoleStatus(body.status);
    const { error } = await admin.from("listed_roles").update({ status }).eq("id", id);
    if (error) {
      if (isMissingTable(error)) {
        return NextResponse.json({ configured: true, needsMigration: true }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  const interestedEmail = body.interestedEmail?.trim().toLowerCase();
  if (interestedEmail && interestedEmail.includes("@")) {
    const { error } = await admin.from("listed_role_interest").upsert(
      { role_id: id, manager_email: interestedEmail },
      { onConflict: "role_id,manager_email" },
    );
    if (error && !isMissingTable(error)) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  const { data, error } = await admin
    .from("listed_roles")
    .select(
      "id, owner_email, owner_name, motel_name, location, state, job_type, start_date, end_date, daily_rate, notes, status, created_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Role not found" }, { status: 404 });
  }

  const interest = await interestsByRole(admin, [id]);
  return NextResponse.json({
    configured: true,
    role: toRecord(data as RoleRow, interest.get(id) ?? []),
  });
}
