"use client";

import { Badge, Button } from "@/components/ui";
import { publicDisplayName } from "@/lib/public-manager";
import { useStore } from "@/lib/store";
import type { PublicManagerProfile } from "@/lib/types";
import { Check, Copy } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export function ManagerPublicProfile({ id }: { id: string }) {
  const { session } = useStore();
  const [manager, setManager] = useState<PublicManagerProfile | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing">("loading");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setStatus("loading");
      try {
        const response = await fetch(`/api/managers/${encodeURIComponent(id)}`);
        const payload = (await response.json()) as { manager?: PublicManagerProfile };
        if (cancelled) return;
        if (!response.ok || !payload.manager) {
          setManager(null);
          setStatus("missing");
          return;
        }
        setManager(payload.manager);
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("missing");
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const shareUrl = typeof window === "undefined" ? `/m/${id}` : `${window.location.origin}/m/${id}`;
  const isOwn = Boolean(session?.managerId && session.managerId === manager?.id);
  const isOwner = session?.role === "owner" || session?.role === "admin";

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="min-h-svh bg-[#f4f7fa]">
      <header className="border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 md:px-6">
          <Link href="/" className="font-serif text-xl text-slate-900">
            Motel Connect
          </Link>
          <Link
            href={session ? "/network/managers" : "/"}
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            {session ? "Back to network" : "Login"}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 md:px-6">
        {status === "loading" ? (
          <p className="text-sm text-slate-500">Loading profile…</p>
        ) : null}
        {status === "missing" ? (
          <div className="soft-panel rounded-2xl p-6">
            <h1 className="font-serif text-3xl text-slate-900">Profile not found</h1>
            <p className="mt-2 text-sm text-slate-600">
              This Motel Connect link is not available. Ask the manager for an updated link.
            </p>
          </div>
        ) : null}
        {status === "ready" && manager ? (
          <div className="space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-800">
              Manager profile
            </p>
            <div className="soft-panel space-y-5 rounded-2xl p-6">
              <div className="flex flex-wrap gap-4">
                <Image
                  src={manager.photoUrl}
                  alt=""
                  width={96}
                  height={96}
                  className="h-24 w-24 rounded-2xl object-cover"
                />
                {manager.partnerPhotoUrl ? (
                  <Image
                    src={manager.partnerPhotoUrl}
                    alt=""
                    width={96}
                    height={96}
                    className="h-24 w-24 rounded-2xl object-cover"
                  />
                ) : null}
                <div className="min-w-0 flex-1">
                  <h1 className="font-serif text-3xl text-slate-900">{publicDisplayName(manager)}</h1>
                  <p className="mt-1 text-sm text-slate-600">
                    {manager.location} · {manager.experience}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge tone={manager.isVerified ? "teal" : "amber"}>
                      {manager.isVerified ? "Premium" : "Non-vetted"}
                    </Badge>
                    <Badge>{manager.profileType}</Badge>
                    <Badge>{manager.rightToWork}</Badge>
                    {manager.liquorLicensing ? <Badge tone="emerald">Liquor</Badge> : null}
                    {manager.eventsExperience ? <Badge>Events</Badge> : null}
                    {manager.restaurantPubExperience ? <Badge>Restaurant / pub</Badge> : null}
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-700">{manager.bio}</p>
              {manager.partnerBio ? (
                <p className="text-sm text-slate-700">
                  <span className="font-semibold">{manager.partnerName}: </span>
                  {manager.partnerBio}
                </p>
              ) : null}

              <div className="grid gap-3 text-sm md:grid-cols-2">
                <p>
                  <span className="font-medium">Looking for:</span>{" "}
                  {manager.preferredJobTypes.join(", ")}
                </p>
                <p>
                  <span className="font-medium">Regions:</span>{" "}
                  {manager.preferredLocations.join(", ")}
                </p>
                <p>
                  <span className="font-medium">PMS:</span> {manager.softwarePMS.join(", ") || "—"}
                </p>
                <p>
                  <span className="font-medium">POS:</span> {manager.softwarePOS.join(", ") || "—"}
                </p>
                <p>
                  <span className="font-medium">HR / payroll:</span>{" "}
                  {manager.softwareHR.join(", ") || "—"}
                </p>
                <p>
                  <span className="font-medium">Liquor:</span>{" "}
                  {manager.liquorLicensing ? manager.liquorStates.join(", ") : "No"}
                </p>
              </div>

              {manager.completedShifts ? (
                <p className="text-sm text-slate-500">
                  {manager.completedShifts} completed Motel Connect placements.
                </p>
              ) : null}

              <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                <Button type="button" variant="secondary" onClick={() => void copyLink()}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied" : "Copy Motel Connect link"}
                </Button>
                {isOwn ? (
                  <Link href="/network/onboarding">
                    <Button type="button" variant="dark">
                      Edit portfolio
                    </Button>
                  </Link>
                ) : isOwner ? (
                  <Link href="/network/managers">
                    <Button type="button" variant="dark">
                      Hire in the network
                    </Button>
                  </Link>
                ) : (
                  <Link href="/">
                    <Button type="button" variant="dark">
                      Login to hire
                    </Button>
                  </Link>
                )}
              </div>
            </div>
            <p className="text-sm text-slate-500">
              Owners use Motel Connect to recruit relief and permanent managers. Share this
              profile when you want the next job.
            </p>
          </div>
        ) : null}
      </main>
    </div>
  );
}
