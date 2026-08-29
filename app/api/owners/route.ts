import { nameFromEmail } from "@/lib/managers";
import { isMissingTable } from "@/lib/supabase/missing";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

function unavailable() {
  return NextResponse.json(
    { error: "Supabase is not configured", configured: false },
    { status: 503 },
  );
}

export async function PATCH(request: NextRequest) {
  if (!isSupabaseConfigured()) return unavailable();

  let body: { email?: string; admitted?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const admitted = body.admitted;
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }
  if (typeof admitted !== "boolean") {
    return NextResponse.json({ error: "admitted must be true or false" }, { status: 400 });
  }

  const admin = supabaseAdmin();
  const admittedAt = admitted ? new Date().toISOString() : null;

  const { data: existing, error: existingError } = await admin
    .from("owners")
    .select("id, email, admitted")
    .ilike("email", email)
    .maybeSingle();

  if (existingError) {
    if (isMissingTable(existingError)) {
      return NextResponse.json({
        configured: true,
        needsMigration: true,
        error: "Run supabase/schema.sql to create the owners table.",
      }, { status: 409 });
    }
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  if (existing) {
    const { data, error } = await admin
      .from("owners")
      .update({ admitted, admitted_at: admittedAt })
      .ilike("email", email)
      .select("id, email, name, admitted")
      .maybeSingle();

    if (error) {
      const retry = await admin
        .from("owners")
        .update({ admitted })
        .ilike("email", email)
        .select("id, email, name, admitted")
        .maybeSingle();
      if (retry.error) {
        return NextResponse.json({ error: retry.error.message }, { status: 500 });
      }
      return NextResponse.json({
        configured: true,
        owner: { id: retry.data?.id, email, admitted },
      });
    }

    return NextResponse.json({
      configured: true,
      owner: {
        id: data?.id,
        email,
        admitted,
      },
    });
  }

  const { data, error } = await admin
    .from("owners")
    .insert({
      email,
      name: nameFromEmail(email),
      admitted,
      admitted_at: admittedAt,
    })
    .select("id, email, name, admitted")
    .single();

  if (error) {
    if (isMissingTable(error)) {
      return NextResponse.json({
        configured: true,
        needsMigration: true,
        error: "Run supabase/schema.sql to create the owners table.",
      }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    configured: true,
    owner: {
      id: data.id,
      email,
      admitted,
    },
  });
}
