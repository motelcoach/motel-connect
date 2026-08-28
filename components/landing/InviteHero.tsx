"use client";

import { Button, Field, inputClass, Modal } from "@/components/ui";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { BadgeCheck, Check, Copy } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function InviteHero() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [rolesOpen, setRolesOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [interest, setInterest] = useState<"owner" | "manager">("owner");
  const [inviteCode, setInviteCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { personas, enterAs, requestInvite } = useStore();
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

  return (
    <div className="hero-lock relative text-white">
      <Image
        src="/hero-motel.jpg"
        alt=""
        fill
        priority
        className="object-cover object-[center_55%]"
      />
      <div className="hero-scrim absolute inset-0" />

      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-10">
        <p className="text-[13px] font-semibold tracking-[0.22em] uppercase">
          Motel Connect
        </p>
        <button
          onClick={() => setRolesOpen(true)}
          className="text-sm font-medium text-white/80 transition hover:text-white"
        >
          Enter
        </button>
      </header>

      <div className="relative z-10 mx-auto flex h-[calc(100svh-4.5rem)] max-w-3xl flex-col items-center justify-center px-6 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="flex w-full flex-col items-center"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/70">
            Invite only
          </p>
          <h1 className="mt-5 font-serif text-5xl font-medium leading-[1.05] tracking-tight text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.35)] sm:text-6xl md:text-[4.5rem]">
            Quality. Trusted. Managers.
          </h1>
          <p className="mt-6 max-w-md text-[17px] leading-relaxed text-white/85 drop-shadow-[0_1px_12px_rgba(0,0,0,0.4)]">
            Owners invite managers. We do not take walk-ins.
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
            className="mt-10 flex w-full max-w-lg items-center rounded-full border border-white/30 bg-white/18 p-1.5 pl-5 shadow-[0_12px_40px_rgba(0,0,0,0.18)] backdrop-blur-md"
          >
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              className="min-w-0 flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-white/55"
            />
            <button
              type="submit"
              disabled={submitting}
              className="shrink-0 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-white/90 disabled:opacity-70"
            >
              {submitting ? "Requesting…" : "Request invite"}
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
              Seats open when an owner vouches. Share your link — two people can
              skip the queue with you.
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
              Owners are admitted first. Managers join when an owner invites them.
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

      <AnimatePresence>
        {rolesOpen ? (
          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              className="absolute inset-0 bg-slate-950/50 backdrop-blur-md"
              onClick={() => setRolesOpen(false)}
              aria-label="Close"
            />
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="relative z-10 w-full max-w-2xl rounded-[28px] bg-white p-7 shadow-2xl md:p-8"
            >
              <h2 className="font-serif text-3xl text-slate-900">Enter</h2>
              <p className="mt-2 max-w-lg text-sm text-slate-500">
                Demo access. Live seats stay invite-only.
              </p>
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                {personas.map((persona) => (
                  <button
                    key={persona.id}
                    onClick={() => {
                      enterAs(persona.id);
                      router.push("/network/managers");
                    }}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-slate-50",
                    )}
                  >
                    <Image
                      src={persona.photoUrl}
                      alt=""
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                    <span>
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                        {persona.label}
                        {persona.role === "verified_manager" ? (
                          <BadgeCheck className="h-4 w-4 text-teal-700" />
                        ) : null}
                      </span>
                      <span className="mt-0.5 block text-sm text-slate-500">
                        {persona.name}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
