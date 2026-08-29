import { accountFromSeedEmail, isDemoLoginEmail } from "@/lib/accounts";
import { resolveLoginAccount } from "@/lib/auth/resolve-account";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

function requestOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin) return origin.replace(/\/$/, "");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "");
  if (host) return `${proto}://${host}`;
  return request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }

  if (isDemoLoginEmail(email)) {
    const seed = accountFromSeedEmail(email);
    if (seed) {
      return NextResponse.json({
        ok: true,
        configured: isSupabaseConfigured(),
        demo: true,
        account: seed,
      });
    }
  }

  const lookup = await resolveLoginAccount(email);
  if (!lookup.ok) {
    const status = lookup.status === "unavailable" ? 503 : lookup.status === "error" ? 500 : 200;
    return NextResponse.json(
      {
        ok: false,
        configured: lookup.status !== "unavailable",
        status: lookup.status,
        interest: lookup.interest,
        message: lookup.message,
        error: lookup.message,
      },
      { status },
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      ok: true,
      configured: false,
      demo: true,
      account: lookup.account,
    });
  }

  const redirectTo = `${requestOrigin(request)}/auth/callback`;
  const { error } = await supabaseAdmin().auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: redirectTo,
    },
  });

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        configured: true,
        error: error.message,
        message: error.message || "Could not send the login email.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    configured: true,
    magicLink: true,
    email,
  });
}
