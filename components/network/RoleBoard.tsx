"use client";

import { Badge, Button, Field, inputClass, Modal } from "@/components/ui";
import { canExpressRoleInterest, canListRoles } from "@/lib/permissions";
import { useStore } from "@/lib/store";
import type { JobType, ListedRole, ManagerProfile } from "@/lib/types";
import { JOB_TYPES } from "@/lib/types";
import { formatAUD, formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

function displayName(manager: ManagerProfile) {
  if (manager.profileType === "Couple" && manager.partnerName) {
    return `${manager.name.split(" ")[0]} & ${manager.partnerName}`;
  }
  return manager.name;
}

function toneFor(status: ListedRole["status"]) {
  if (status === "Open") return "teal" as const;
  if (status === "Filled") return "emerald" as const;
  return "slate" as const;
}

export function RoleBoard() {
  const {
    session,
    listedRoles = [],
    managers,
    currentOwner,
    createListedRole,
    setListedRoleStatus,
    expressRoleInterest,
    createProposal,
  } = useStore();
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({
    jobType: "Relief" as JobType,
    startDate: "2026-09-14",
    endDate: "2026-09-28",
    dailyRate: 400,
    notes: "",
  });

  const canList = session ? canListRoles(session.role) : false;
  const canInterest = session ? canExpressRoleInterest(session.role) : false;

  const visible = useMemo(() => {
    if (!session) return [];
    if (session.role === "admin") return listedRoles;
    if (session.ownerId) {
      return listedRoles.filter((listing) => listing.ownerId === session.ownerId);
    }
    return listedRoles.filter((listing) => listing.status === "Open");
  }, [listedRoles, session]);

  function publishRole(event: React.FormEvent) {
    event.preventDefault();
    const id = createListedRole(form);
    if (id) {
      setFormOpen(false);
      setForm({ ...form, notes: "" });
    }
  }

  function proposeFromRole(listing: ListedRole, managerId: string) {
    const id = createProposal({
      managerId,
      startDate: listing.startDate,
      endDate: listing.endDate,
      dailyRate: listing.dailyRate,
      contractDetails: listing.notes,
      specialConditions: "",
    });
    if (id) router.push("/network/workspace");
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-800">
            Open cover
          </p>
          <h1 className="font-serif text-3xl text-slate-900">
            {canList ? "Your available roles" : "Available roles"}
          </h1>
          <p className="mt-1 max-w-xl text-sm text-slate-600">
            {canList
              ? "List Relief, Permanent, Couple and Individual cover at your motel. Premium managers can put their hand up, then you propose from here."
              : "Owners list the cover they need. Premium managers can express interest. Proposals still come from the owner."}
          </p>
        </div>
        {canList ? (
          <Button variant="dark" onClick={() => setFormOpen(true)}>
            List a role
          </Button>
        ) : null}
      </div>

      <div className="space-y-3">
        {visible.map((listing) => {
          const interested = listing.interestedManagerIds
            .map((id) => managers.find((manager) => manager.id === id))
            .filter((manager): manager is ManagerProfile => Boolean(manager));
          const alreadyIn =
            Boolean(session?.managerId) &&
            listing.interestedManagerIds.includes(session.managerId ?? "");

          return (
            <div key={listing.id} className="soft-panel space-y-3 rounded-2xl p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">
                    {listing.motelName}{" "}
                    <Badge tone={toneFor(listing.status)}>{listing.status}</Badge>
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {listing.jobType} · {listing.location} ·{" "}
                    {formatDate(listing.startDate)} – {formatDate(listing.endDate)} ·{" "}
                    {formatAUD(listing.dailyRate)} / day
                  </p>
                  {listing.notes ? (
                    <p className="mt-2 text-sm text-slate-500">{listing.notes}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {canList && listing.status === "Open" ? (
                    <>
                      <Button
                        variant="secondary"
                        onClick={() => setListedRoleStatus(listing.id, "Filled")}
                      >
                        Mark filled
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setListedRoleStatus(listing.id, "Closed")}
                      >
                        Close
                      </Button>
                    </>
                  ) : null}
                  {canInterest && listing.status === "Open" ? (
                    <Button
                      variant="dark"
                      disabled={alreadyIn}
                      onClick={() => expressRoleInterest(listing.id)}
                    >
                      {alreadyIn ? "Interest sent" : "I'm available"}
                    </Button>
                  ) : null}
                </div>
              </div>

              {canList && interested.length ? (
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Interested Premium managers
                  </p>
                  <div className="mt-2 space-y-2">
                    {interested.map((manager) => (
                      <div
                        key={manager.id}
                        className="flex flex-wrap items-center justify-between gap-2"
                      >
                        <p className="text-sm text-slate-700">
                          {displayName(manager)} · {manager.location}
                        </p>
                        {listing.status === "Open" ? (
                          <Button
                            variant="secondary"
                            onClick={() => proposeFromRole(listing, manager.id)}
                          >
                            Propose
                          </Button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {session?.role === "unverified_manager" && listing.status === "Open" ? (
                <p className="text-sm text-amber-800">
                  Premium unlocks interest. Build two vetted owner references first.
                </p>
              ) : null}
            </div>
          );
        })}
        {!visible.length ? (
          <div className="soft-panel rounded-2xl p-8 text-slate-600">
            {canList
              ? "No roles listed yet. Publish the cover you need and Premium managers can respond."
              : "No open roles right now. Check back as owners list Relief and Permanent cover."}
          </div>
        ) : null}
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="List a role">
        <form className="space-y-4" onSubmit={publishRole}>
          <p className="text-sm text-slate-600">
            {currentOwner
              ? `This will list cover at ${currentOwner.motelName}, ${currentOwner.location}.`
              : "This will list cover at your motel."}
          </p>
          <Field label="Role type">
            <select
              className={inputClass}
              value={form.jobType}
              onChange={(event) =>
                setForm({ ...form, jobType: event.target.value as JobType })
              }
            >
              {JOB_TYPES.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Start">
              <input
                type="date"
                required
                className={inputClass}
                value={form.startDate}
                onChange={(event) => setForm({ ...form, startDate: event.target.value })}
              />
            </Field>
            <Field label="End">
              <input
                type="date"
                required
                className={inputClass}
                value={form.endDate}
                onChange={(event) => setForm({ ...form, endDate: event.target.value })}
              />
            </Field>
          </div>
          <Field label="Daily rate (AUD)">
            <input
              type="number"
              min={1}
              required
              className={inputClass}
              value={form.dailyRate}
              onChange={(event) =>
                setForm({ ...form, dailyRate: Number(event.target.value) })
              }
            />
          </Field>
          <Field label="Notes">
            <textarea
              className={inputClass}
              rows={3}
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
              placeholder="Live-in, PMS, breakfast, any site notes."
            />
          </Field>
          <Button type="submit" className="w-full rounded-full" variant="dark">
            Publish role
          </Button>
        </form>
      </Modal>
    </div>
  );
}
