import { resolveLoginAccount } from "@/lib/auth/resolve-account";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const header = request.headers.get("authorization") ?? "";
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  if (!token) {
    return NextResponse.json({ error: "Missing access token" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin().auth.getUser(token);
  const email = data.user?.email?.trim().toLowerCase();
  if (error || !email) {
    return NextResponse.json({ error: "Invalid or expired login" }, { status: 401 });
  }

  const lookup = await resolveLoginAccount(email);
  if (!lookup.ok) {
    return NextResponse.json(
      { error: lookup.message, status: lookup.status },
      { status: 403 },
    );
  }

  return NextResponse.json({ ok: true, account: lookup.account });
}
