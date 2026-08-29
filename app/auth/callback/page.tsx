"use client";

import { supabaseBrowser } from "@/lib/supabase/browser";
import { useStore } from "@/lib/store";
import type { LoginAccount } from "@/lib/types";
import type { EmailOtpType, Session } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

let inflightKey = "";
let inflight: Promise<LoginAccount | { error: string }> | null = null;

function otpType(value: string | null): EmailOtpType {
  if (value === "recovery" || value === "signup" || value === "invite" || value === "magiclink" || value === "email") {
    return value;
  }
  return "email";
}

function waitForSession(ms: number) {
  const supabase = supabaseBrowser();
  if (!supabase) return Promise.resolve(null);

  return new Promise<Session | null>((resolve) => {
    let done = false;
    const finish = (session: Session | null) => {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      subscription.unsubscribe();
      resolve(session);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) finish(session);
    });

    const timer = window.setTimeout(() => finish(null), ms);

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) finish(data.session);
    });
  });
}

async function establishAccount(): Promise<LoginAccount | { error: string }> {
  const supabase = supabaseBrowser();
  if (!supabase) {
    return { error: "Supabase is not configured in this browser." };
  }

  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const code = search.get("code");
  const tokenHash = search.get("token_hash") ?? hash.get("token_hash");
  const type = otpType(search.get("type") ?? hash.get("type"));

  let session = (await supabase.auth.getSession()).data.session;

  if (!session && code) {
    const { data, error } = await Promise.race([
      supabase.auth.exchangeCodeForSession(code),
      new Promise<{ data: { session: Session | null }; error: { message: string } }>((resolve) =>
        window.setTimeout(
          () => resolve({ data: { session: null }, error: { message: "Login timed out. Request a new link." } }),
          10000,
        ),
      ),
    ]);
    if (data.session) {
      session = data.session;
    } else if (error) {
      session = (await supabase.auth.getSession()).data.session;
      if (!session) {
        const retry = await waitForSession(1500);
        if (retry) session = retry;
        else {
          return {
            error:
              error.message.includes("verifier") || error.message.includes("PKCE")
                ? "Open the login link in the same browser you used to request it."
                : error.message,
          };
        }
      }
    }
  } else if (!session && tokenHash) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    if (data.session) session = data.session;
    else if (error) return { error: error.message };
  }

  if (!session) {
    session = await waitForSession(8000);
  }

  if (!session?.access_token) {
    return { error: "That login link is invalid or has expired. Request a new one from Motel Connect." };
  }

  const response = await fetch("/api/auth/session", {
    method: "POST",
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  const payload = (await response.json()) as { account?: LoginAccount; error?: string };
  if (!response.ok || !payload.account) {
    return { error: payload.error || "You are not on Motel Connect yet." };
  }

  return payload.account;
}

function completeFromUrl() {
  const key = `${window.location.search}${window.location.hash}`;
  if (!inflight || inflightKey !== key) {
    inflightKey = key;
    inflight = establishAccount();
  }
  return inflight;
}

export default function AuthCallbackPage() {
  const { login, session } = useStore();
  const router = useRouter();
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void completeFromUrl().then((result) => {
      if (cancelled) return;
      if ("error" in result) {
        setError(result.error);
        return;
      }
      login(result);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [login]);

  useEffect(() => {
    if (ready && session?.email) {
      router.replace("/network/managers");
    }
  }, [ready, session, router]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-[#163832] px-6 text-center text-[#f3eee6]">
      {error ? (
        <div className="max-w-md space-y-4">
          <h1 className="font-serif text-3xl">Login did not complete</h1>
          <p className="text-sm text-[#f3eee6]/75">{error}</p>
          <Link
            href="/"
            className="inline-flex rounded-full bg-[#f3eee6] px-5 py-2.5 text-sm font-semibold text-[#163832]"
          >
            Back to Motel Connect
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-[#f3eee6]/75">Signing you in…</p>
          <p className="text-xs text-[#f3eee6]/45">This should only take a few seconds.</p>
        </div>
      )}
    </div>
  );
}
