import { fromRosterRecord } from "@/lib/managers";
import { findSeedPublicManager, toPublicManager } from "@/lib/public-manager";
import { isMissingTable } from "@/lib/supabase/missing";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase/admin";
import type { ManagerProfile, ManagerRosterRecord } from "@/lib/types";
import { NextResponse } from "next/server";

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

function matchesId(row: ManagerRow, id: string) {
  return row.id === id || row.profile?.id === id;
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const lookup = id.trim();
  if (!lookup) {
    return NextResponse.json({ error: "Manager not found" }, { status: 404 });
  }

  if (isSupabaseConfigured()) {
    const withProfile = await supabaseAdmin().from("managers").select(PROFILE_COLUMNS);
    if (!withProfile.error) {
      const rows = (withProfile.data ?? []) as ManagerRow[];
      const row = rows.find((item) => matchesId(item, lookup));
      if (row) {
        return NextResponse.json({ manager: toPublicManager(fromRosterRecord(toRecord(row))) });
      }
    } else if (!isMissingTable(withProfile.error)) {
      const fallback = await supabaseAdmin().from("managers").select(ROSTER_COLUMNS);
      if (!fallback.error) {
        const rows = (fallback.data ?? []) as ManagerRow[];
        const row = rows.find((item) => item.id === lookup);
        if (row) {
          return NextResponse.json({ manager: toPublicManager(fromRosterRecord(toRecord(row))) });
        }
      }
    }
  }

  const seed = findSeedPublicManager(lookup);
  if (seed) return NextResponse.json({ manager: seed });

  return NextResponse.json({ error: "Manager not found" }, { status: 404 });
}
