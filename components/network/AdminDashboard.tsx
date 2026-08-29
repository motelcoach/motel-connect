"use client";

import { Badge, Button } from "@/components/ui";
import { useStore } from "@/lib/store";
import type { WaitlistEntry } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { useEffect, useState } from "react";

export function AdminDashboard() {
  const {
    session,
    managers,
    contracts,
    taxonomy,
    waitlist,
    setReferenceStatus,
    adminVerifyManager,
    resolveSoftware,
    setDispute,
  } = useStore();
  const [logId, setLogId] = useState<string | null>(null);
  const [remoteWaitlist, setRemoteWaitlist] = useState<WaitlistEntry[] | null>(null);
  const [waitlistSource, setWaitlistSource] = useState<"supabase" | "local">("local");
  const [rosterSource, setRosterSource] = useState<"supabase" | "local">("local");
  const [needsRosterTable, setNeedsRosterTable] = useState(false);

  useEffect(() => {
    if (session?.role !== "admin") return;
    let cancelled = false;
    fetch("/api/waitlist")
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as { waitlist?: WaitlistEntry[] };
      })
      .then((payload) => {
        if (cancelled || !payload?.waitlist) return;
        setRemoteWaitlist(payload.waitlist);
        setWaitlistSource("supabase");
      })
      .catch(() => {
        if (!cancelled) setWaitlistSource("local");
      });
    fetch("/api/managers")
      .then(async (response) => {
        if (cancelled) return;
        if (!response.ok) {
          setRosterSource("local");
          return;
        }
        const payload = (await response.json()) as { needsMigration?: boolean };
        setRosterSource("supabase");
        setNeedsRosterTable(Boolean(payload.needsMigration));
      })
      .catch(() => {
        if (!cancelled) setRosterSource("local");
      });
    return () => {
      cancelled = true;
    };
  }, [session?.role]);

  if (session?.role !== "admin") {
    return <p className="text-slate-600">Admin controls are restricted.</p>;
  }

  const pendingRefs = managers.flatMap((manager) =>
    manager.references
      .filter((reference) => reference.status === "Pending")
      .map((reference) => ({ manager, reference })),
  );
  const disputes = contracts.filter((job) => job.disputed && job.disputeStatus === "Open");
  const logContract = contracts.find((job) => job.id === logId);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-800">
          Governance
        </p>
        <h1 className="font-serif text-3xl text-slate-900">Admin command centre</h1>
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold text-slate-900">Reference moderation</h2>
        {pendingRefs.map(({ manager, reference }) => (
          <div
            key={reference.id}
            className="soft-panel flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4"
          >
            <div>
              <p className="font-medium">
                {manager.name} → {reference.businessName}
              </p>
              <p className="text-sm text-slate-500">
                {reference.contactPerson} · {reference.email} · {reference.phone}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="dark"
                onClick={() => setReferenceStatus(manager.id, reference.id, "Verified")}
              >
                Verify
              </Button>
              <Button
                variant="danger"
                onClick={() => setReferenceStatus(manager.id, reference.id, "Failed")}
              >
                Flag
              </Button>
            </div>
          </div>
        ))}
        {!pendingRefs.length ? (
          <p className="text-sm text-slate-500">No pending references.</p>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-slate-900">Manager baskets</h2>
        <p className="text-sm text-slate-500">
          {needsRosterTable
            ? "Supabase is connected. Run supabase/schema.sql in the SQL editor to create the managers table."
            : rosterSource === "supabase"
              ? "Live roster stored in Supabase. Non-vetted stay in the database. Admin pass moves them to Premium."
              : "This browser only — add Supabase keys to share the roster. Non-vetted stay listed. Admin pass moves them to Premium."}
        </p>
        {managers.map((manager) => (
          <div
            key={manager.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3"
          >
            <p className="text-sm">
              {manager.name}{" "}
              <Badge tone={manager.isVerified ? "teal" : "amber"}>
                {manager.isVerified ? "Premium" : "Non-vetted"}
              </Badge>
            </p>
            <Button
              variant="secondary"
              onClick={() => adminVerifyManager(manager.id, !manager.verifiedByAdmin)}
            >
              {manager.verifiedByAdmin ? "Return to Non-vetted" : "Move to Premium"}
            </Button>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-slate-900">Custom software queue</h2>
        {taxonomy.customQueue.map((item) => (
          <div
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3"
          >
            <p className="text-sm">
              {item.name} · {item.category} · {item.submittedBy}{" "}
              <Badge
                tone={
                  item.status === "Merged"
                    ? "teal"
                    : item.status === "Approved"
                      ? "emerald"
                      : "amber"
                }
              >
                {item.status}
              </Badge>
            </p>
            {item.status === "Pending" ? (
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => resolveSoftware(item.id, "Approved")}>
                  Approve
                </Button>
                <Button variant="dark" onClick={() => resolveSoftware(item.id, "Merged")}>
                  Merge into taxonomy
                </Button>
              </div>
            ) : null}
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-slate-900">Disputes</h2>
        {disputes.map((job) => (
          <div key={job.id} className="soft-panel space-y-2 rounded-2xl p-4">
            <p className="font-medium">
              {job.ownerMotel} · {job.managerName}
            </p>
            <p className="text-sm text-slate-600">{job.disputeNote}</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => setLogId(job.id)}>
                Inspect messages
              </Button>
              <Button
                variant="dark"
                onClick={() => setDispute(job.id, { disputeStatus: "Resolved" })}
              >
                Mark resolved
              </Button>
              <Button
                variant="ghost"
                onClick={() => setDispute(job.id, { disputeStatus: "Dismissed" })}
              >
                Dismiss
              </Button>
            </div>
          </div>
        ))}
        {!disputes.length ? (
          <p className="text-sm text-slate-500">No open disputes.</p>
        ) : null}
        {logContract ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="font-medium">Message log · {logContract.managerName}</p>
            {logContract.messages.map((message) => (
              <p key={message.id} className="mt-2 text-sm">
                <span className="text-xs text-slate-500">
                  {message.sender} · {formatDateTime(message.timestamp)}
                </span>
                <br />
                {message.text}
              </p>
            ))}
            {!logContract.messages.length ? (
              <p className="text-sm text-slate-500">No messages recorded.</p>
            ) : null}
          </div>
        ) : null}
      </section>

      <section>
        <h2 className="font-semibold text-slate-900">Invite waitlist</h2>
        <p className="mt-1 text-xs text-slate-500">
          {waitlistSource === "supabase"
            ? "Stored in Supabase"
            : "This browser only — add Supabase keys to share the list"}
        </p>
        <div className="mt-2 space-y-2">
          {(remoteWaitlist ?? waitlist).map((entry) => (
            <p key={entry.id} className="text-sm text-slate-600">
              {entry.email} · {entry.interest} · {entry.inviteCode ?? "—"}
              {entry.referredBy ? ` · via ${entry.referredBy}` : ""} ·{" "}
              {formatDateTime(entry.createdAt)}
            </p>
          ))}
          {!(remoteWaitlist ?? waitlist).length ? (
            <p className="text-sm text-slate-500">No invite requests yet.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
