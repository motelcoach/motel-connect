"use client";

import { Button, Field, inputClass, Modal } from "@/components/ui";
import { DEMO_LOGINS, accountFromSeedEmail, isDemoLoginEmail } from "@/lib/accounts";
import { useStore } from "@/lib/store";
import { motion } from "framer-motion";
import { Check, Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function InviteHero() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [interest, setInterest] = useState<"owner" | "manager">("owner");
  const [inviteCode, setInviteCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login, requestInvite } = useStore();
  const router = useRouter();

  const shareUrl =
    typeof window === "undefined"
      ? ""
      : `${window.location.origin}/?invite=${inviteCode}`;

  async function submitInvite(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim() || submitting) return;
    const referredBy =
      new URLSearchParams(window.location.search).get("invite") ?? undefined;
    setSubmitting(true);
    try {
      const code = await requestInvite(email.trim(), interest, referredBy);
      setInviteCode(code);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  async function copyLink() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  async function submitLogin(event: React.FormEvent) {
    event.preventDefault();
    const nextEmail = loginEmail.trim().toLowerCase();
    if (!nextEmail || loggingIn) return;
    setLoggingIn(true);
    setLoginError("");
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: nextEmail }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        account?: Parameters<typeof login>[0];
        magicLink?: boolean;
        message?: string;
        error?: string;
      };
      if (payload.ok && payload.account) {
        login(payload.account);
        router.push("/network/managers");
        return;
      }
      if (payload.ok && payload.magicLink) {
        setLinkSent(true);
        return;
      }
      const seed = accountFromSeedEmail(nextEmail);
      if (response.status === 503 && seed) {
        login(seed);
        router.push("/network/managers");
        return;
      }
      setLoginError(payload.message || payload.error || "Could not log in.");
    } catch {
      const seed = accountFromSeedEmail(nextEmail);
      if (seed) {
        login(seed);
        router.push("/network/managers");
        return;
      }
      setLoginError("Could not reach the network. Try again.");
    } finally {
      setLoggingIn(false);
    }
  }

  return (
    <div className="hero-lock relative">
      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-10">
        <p className="text-[13px] font-semibold tracking-[0.22em] uppercase text-[#f3eee6]">
          Motel Connect
        </p>
        <button
          onClick={() => {
            setLoginError("");
            setLinkSent(false);
            setLoginOpen(true);
          }}
          className="text-sm font-medium text-[#f3eee6]/70 transition hover:text-[#f3eee6]"
        >
          Login
        </button>
      </header>

      <div className="relative z-10 mx-auto flex h-[calc(100svh-4.5rem)] max-w-3xl flex-col items-center justify-center px-5 pb-10 text-center sm:px-6 sm:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="hero-copy flex w-full flex-col items-center"
        >
          <p className="hero-badge text-[11px] font-semibold uppercase tracking-[0.32em] text-[#d4c4a8]">
            Invite Only Motel Network
          </p>
          <h1 className="hero-headline mt-5 font-serif font-medium text-[#f6f1e8] sm:mt-7">
            <span className="hero-headline-line">
              <span className="hero-gold">Trusted</span> Motel Manager
            </span>
            <span className="hero-headline-line mt-[0.32em]">Recruitment</span>
          </h1>
          <p className="mt-5 max-w-[20.5rem] text-[15px] leading-[1.5] text-[#f3eee6]/72 sm:mt-8 sm:max-w-xl sm:text-[17px] sm:leading-[1.55]">
            Recruit Relief, Permanent, Couple and Individual Motel Managers.
          </p>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!email.trim()) {
                setSubmitted(false);
                setInviteOpen(true);
                return;
              }
              void submitInvite(event);
              setInviteOpen(true);
            }}
            className="mt-8 flex w-full max-w-lg items-center rounded-full border border-[#f3eee6]/20 bg-[#f3eee6]/10 p-1.5 pl-4 shadow-[0_18px_50px_rgba(8,20,18,0.28)] backdrop-blur-sm sm:mt-12 sm:pl-5"
          >
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              className="min-w-0 flex-1 bg-transparent text-[15px] text-[#f6f1e8] outline-none placeholder:text-[#f3eee6]/45"
            />
            <button
              type="submit"
              disabled={submitting}
              className="shrink-0 rounded-full bg-[#f3eee6] px-4 py-2.5 text-sm font-semibold text-[#163832] transition hover:bg-white disabled:opacity-70 sm:px-5"
            >
              {submitting ? "Requesting…" : (
                <>
                  <span className="sm:hidden">Request</span>
                  <span className="hidden sm:inline">Request invite</span>
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>

      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title={submitted ? "You're on the list" : "Request an invite"}
      >
        {submitted ? (
          <div className="space-y-4">
            <p className="text-slate-600">
              {interest === "manager"
                ? "You're on the open roster as Non-vetted. Share your link — owners still come by invite, and Premium is earned when two of them vouch."
                : "Seats open when we admit owners. Share your link — two people can skip the queue with you."}
            </p>
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2">
              <code className="min-w-0 flex-1 truncate text-sm text-slate-700">
                {shareUrl || inviteCode}
              </code>
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex items-center gap-1 text-sm font-semibold text-slate-900"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={(event) => {
            void submitInvite(event);
          }}>
            <p className="text-sm text-slate-600">
              {interest === "manager"
                ? "Join the database now. You land as Non-vetted. Premium (hire, chat, reviews) unlocks after two vetted owner references."
                : "Owners are admitted first. Live owner seats stay invite-only."}
            </p>
            <Field label="Email">
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={inputClass}
                placeholder="you@email.com"
              />
            </Field>
            <Field label="I am a">
              <select
                className={inputClass}
                value={interest}
                onChange={(event) =>
                  setInterest(event.target.value as "owner" | "manager")
                }
              >
                <option value="owner">Motel owner</option>
                <option value="manager">Motel manager</option>
              </select>
            </Field>
            <Button type="submit" className="w-full rounded-full" variant="dark" disabled={submitting}>
              {submitting ? "Requesting…" : "Submit request"}
            </Button>
          </form>
        )}
      </Modal>

      <Modal
        open={loginOpen}
        onClose={() => {
          setLoginOpen(false);
          setLinkSent(false);
        }}
        title="Login"
      >
        {linkSent ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              We sent a login link to <span className="font-medium text-slate-900">{loginEmail}</span>.
              Open it on this device. It expires shortly.
            </p>
            <Button
              type="button"
              className="w-full rounded-full"
              variant="secondary"
              onClick={() => setLinkSent(false)}
            >
              Use a different email
            </Button>
          </div>
        ) : (
        <form className="space-y-4" onSubmit={(event) => void submitLogin(event)}>
          <p className="text-sm text-slate-600">
            {isDemoLoginEmail(loginEmail)
              ? "Demo accounts open the network immediately. Your own email gets a login link."
              : "Use the email on your Motel Connect account. We will send a login link. Owners must be admitted. Managers on the roster can log in now."}
          </p>
          <Field label="Email">
            <input
              type="email"
              required
              value={loginEmail}
              onChange={(event) => setLoginEmail(event.target.value)}
              className={inputClass}
              placeholder="you@email.com"
              autoComplete="email"
            />
          </Field>
          {loginError ? (
            <p className="text-sm text-amber-800">{loginError}</p>
          ) : null}
          <Button type="submit" className="w-full rounded-full" variant="dark" disabled={loggingIn}>
            {loggingIn
              ? isDemoLoginEmail(loginEmail)
                ? "Entering…"
                : "Sending link…"
              : isDemoLoginEmail(loginEmail)
                ? "Enter network"
                : "Send login link"}
          </Button>
        </form>
        )}
        <div className="mt-5 border-t border-slate-100 pt-4">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
            Demo accounts
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {DEMO_LOGINS.map((demo) => (
              <button
                key={demo.email}
                type="button"
                onClick={() => {
                  setLoginEmail(demo.email);
                  setLoginError("");
                  setLinkSent(false);
                }}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                {demo.name}
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
