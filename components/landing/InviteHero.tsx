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
    <div className="hero-lock relative">
      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-10">
        <p className="text-[13px] font-semibold tracking-[0.22em] uppercase text-[#f3eee6]">
          Motel Connect
        </p>
        <button
          onClick={() => setRolesOpen(true)}
          className="text-sm font-medium text-[#f3eee6]/70 transition hover:text-[#f3eee6]"
        >
          Enter
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
              Quality. <span className="hero-gold">Trusted.</span>
            </span>
            <span className="hero-headline-line mt-[0.32em]">Motel Managers.</span>
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
                Demo access. Owners stay invite-only. Managers join the open
                roster, then earn Premium.
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
