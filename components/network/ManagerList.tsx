"use client";

import { Badge, Button, Field, inputClass, Modal } from "@/components/ui";
import { defaultManagerFilters, filterManagers } from "@/lib/filters";
import { canDispatchProposals } from "@/lib/permissions";
import { useStore } from "@/lib/store";
import type { AustralianState, JobType, ManagerProfile, ProfileType } from "@/lib/types";
import { AU_STATES, JOB_TYPES } from "@/lib/types";
import { cn, formatAUD } from "@/lib/utils";
import { BadgeCheck, Map, LayoutGrid, ShieldAlert } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const ManagerMap = dynamic(() => import("./ManagerMap"), { ssr: false });

function displayName(manager: ManagerProfile) {
  if (manager.profileType === "Couple" && manager.partnerName) {
    return `${manager.name.split(" ")[0]} & ${manager.partnerName}`;
  }
  return manager.name;
}

export function ManagerList() {
  const { managers, taxonomy, session, createProposal } = useStore();
  const router = useRouter();
  const [filters, setFilters] = useState(defaultManagerFilters);
  const [view, setView] = useState<"grid" | "map">("grid");
  const [selected, setSelected] = useState<ManagerProfile | null>(null);
  const [proposalOpen, setProposalOpen] = useState(false);
  const [proposal, setProposal] = useState({
    startDate: "2026-09-14",
    endDate: "2026-09-28",
    dailyRate: 400,
    contractDetails: "Live-in relief cover including breakfast and night audit.",
    specialConditions: "",
  });

  const results = useMemo(() => filterManagers(managers, filters), [managers, filters]);
  const canPropose = session ? canDispatchProposals(session.role) : false;
  const premiumCount = managers.filter((manager) => manager.isVerified).length;
  const openCount = managers.length - premiumCount;

  const basketCopy = {
    premium: {
      title: "Premium managers",
      note: "Vetted. Two owner references, or an admin pass. Owners hire from here.",
    },
    open: {
      title: "Non-vetted managers",
      note: "Everyone who joins lands here. Visible in the roster. Proposals stay locked until they earn Premium.",
    },
    all: {
      title: "All managers",
      note: "Open roster plus Premium. Filter by basket to hire with the right trust level.",
    },
  }[filters.basket];

  function sendProposal() {
    if (!selected) return;
    const id = createProposal({ managerId: selected.id, ...proposal });
    if (id) {
      setProposalOpen(false);
      setSelected(null);
      router.push("/network/workspace");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-800">
            Discovery
          </p>
          <h1 className="font-serif text-3xl text-slate-900">{basketCopy.title}</h1>
          <p className="mt-1 max-w-xl text-sm text-slate-600">{basketCopy.note}</p>
          <p className="mt-1 text-sm text-slate-500">
            {results.length} showing · {premiumCount} Premium · {openCount} Non-vetted
          </p>
        </div>
        <div className="flex rounded-xl border border-slate-200 bg-white p-1">
          <button
            onClick={() => setView("grid")}
            className={cn(
              "inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium",
              view === "grid" ? "bg-slate-900 text-white" : "text-slate-600",
            )}
          >
            <LayoutGrid className="h-4 w-4" /> Cards
          </button>
          <button
            onClick={() => setView("map")}
            className={cn(
              "inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium",
              view === "map" ? "bg-slate-900 text-white" : "text-slate-600",
            )}
          >
            <Map className="h-4 w-4" /> Map
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["premium", `Premium · ${premiumCount}`],
            ["open", `Non-vetted · ${openCount}`],
            ["all", `All · ${managers.length}`],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setFilters({ ...filters, basket: value })}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-semibold transition",
              filters.basket === value
                ? "bg-slate-900 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="soft-panel grid gap-3 rounded-2xl p-4 md:grid-cols-4">
        <input
          className={inputClass}
          placeholder="Search name, PMS, region…"
          value={filters.query}
          onChange={(event) => setFilters({ ...filters, query: event.target.value })}
        />
        <select
          className={inputClass}
          value={filters.profileType}
          onChange={(event) =>
            setFilters({ ...filters, profileType: event.target.value as ProfileType | "Any" })
          }
        >
          <option value="Any">Solo or couple</option>
          <option value="Solo">Solo</option>
          <option value="Couple">Couple</option>
        </select>
        <select
          className={inputClass}
          value={filters.jobType}
          onChange={(event) =>
            setFilters({ ...filters, jobType: event.target.value as JobType | "Any" })
          }
        >
          <option value="Any">Any job type</option>
          {JOB_TYPES.map((type) => (
            <option key={type}>{type}</option>
          ))}
        </select>
        <select
          className={inputClass}
          value={filters.state}
          onChange={(event) =>
            setFilters({
              ...filters,
              state: event.target.value as AustralianState | "Nationwide" | "Any",
            })
          }
        >
          <option value="Any">Any state</option>
          <option value="Nationwide">Nationwide</option>
          {AU_STATES.map((state) => (
            <option key={state}>{state}</option>
          ))}
        </select>
        <input
          type="date"
          className={inputClass}
          value={filters.startDate}
          onChange={(event) => setFilters({ ...filters, startDate: event.target.value })}
        />
        <input
          type="date"
          className={inputClass}
          value={filters.endDate}
          onChange={(event) => setFilters({ ...filters, endDate: event.target.value })}
        />
        <select
          className={inputClass}
          value={filters.pms}
          onChange={(event) => setFilters({ ...filters, pms: event.target.value })}
        >
          <option value="">Any PMS</option>
          {taxonomy.pms.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select
          className={inputClass}
          value={filters.pos}
          onChange={(event) => setFilters({ ...filters, pos: event.target.value })}
        >
          <option value="">Any POS</option>
          {taxonomy.pos.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select
          className={inputClass}
          value={filters.hr}
          onChange={(event) => setFilters({ ...filters, hr: event.target.value })}
        >
          <option value="">Any HR / payroll</option>
          {taxonomy.hr.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={filters.liquor}
            onChange={(event) => setFilters({ ...filters, liquor: event.target.checked })}
          />
          Liquor licence
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={filters.events}
            onChange={(event) => setFilters({ ...filters, events: event.target.checked })}
          />
          Events
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={filters.restaurant}
            onChange={(event) =>
              setFilters({ ...filters, restaurant: event.target.checked })
            }
          />
          Restaurant / pub
        </label>
        <button
          className="text-sm font-medium text-teal-800"
          onClick={() => setFilters(defaultManagerFilters())}
        >
          Reset filters
        </button>
      </div>

      {view === "map" ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <ManagerMap managers={results} onSelect={setSelected} />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((manager) => (
            <button
              key={manager.id}
              onClick={() => setSelected(manager)}
              className="soft-panel rounded-2xl p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex gap-3">
                <Image
                  src={manager.photoUrl}
                  alt=""
                  width={64}
                  height={64}
                  className="h-16 w-16 rounded-2xl object-cover"
                />
                <div className="min-w-0">
                  <p className="flex items-center gap-1 font-semibold text-slate-900">
                    {displayName(manager)}
                    {manager.isVerified ? (
                      <BadgeCheck className="h-4 w-4 text-teal-700" />
                    ) : (
                      <ShieldAlert className="h-4 w-4 text-amber-600" />
                    )}
                  </p>
                  <p className="text-sm text-slate-500">
                    {manager.location} · {manager.experience}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Badge tone={manager.isVerified ? "teal" : "amber"}>
                      {manager.isVerified ? "Premium" : "Non-vetted"}
                    </Badge>
                    <Badge>{manager.profileType}</Badge>
                    {manager.liquorLicensing ? <Badge tone="emerald">Liquor</Badge> : null}
                  </div>
                </div>
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-slate-600">{manager.bio}</p>
              <p className="mt-3 text-xs text-slate-500">
                {manager.softwarePMS.slice(0, 3).join(" · ")}
              </p>
            </button>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? displayName(selected) : "Manager"}
        wide
      >
        {selected ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Image
                src={selected.photoUrl}
                alt=""
                width={88}
                height={88}
                className="h-[88px] w-[88px] rounded-2xl object-cover"
              />
              {selected.partnerPhotoUrl ? (
                <Image
                  src={selected.partnerPhotoUrl}
                  alt=""
                  width={88}
                  height={88}
                  className="h-[88px] w-[88px] rounded-2xl object-cover"
                />
              ) : null}
              <div>
                <div className="flex flex-wrap gap-1">
                  <Badge tone={selected.isVerified ? "teal" : "amber"}>
                    {selected.isVerified ? "Premium" : "Non-vetted"}
                  </Badge>
                  <Badge>{selected.profileType}</Badge>
                  <Badge>{selected.rightToWork}</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-600">{selected.location}</p>
                <p className="text-sm text-slate-600">
                  Prefers {selected.preferredLocations.join(", ")} ·{" "}
                  {selected.preferredJobTypes.join(", ")}
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-700">{selected.bio}</p>
            {selected.partnerBio ? (
              <p className="text-sm text-slate-700">
                <span className="font-semibold">{selected.partnerName}: </span>
                {selected.partnerBio}
              </p>
            ) : null}
            <div className="grid gap-3 text-sm md:grid-cols-2">
              <p>
                <span className="font-medium">PMS:</span> {selected.softwarePMS.join(", ")}
              </p>
              <p>
                <span className="font-medium">POS:</span> {selected.softwarePOS.join(", ") || "—"}
              </p>
              <p>
                <span className="font-medium">HR:</span> {selected.softwareHR.join(", ")}
              </p>
              <p>
                <span className="font-medium">Liquor:</span>{" "}
                {selected.liquorLicensing ? selected.liquorStates.join(", ") : "No"}
              </p>
            </div>
            {canPropose && selected.isVerified ? (
              <Button
                variant="dark"
                onClick={() => {
                  setProposalOpen(true);
                }}
              >
                Dispatch proposal
              </Button>
            ) : null}
            {canPropose && !selected.isVerified ? (
              <p className="text-sm text-amber-800">
                This manager is on the open roster. Dispatch a proposal once they
                are Premium.
              </p>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={proposalOpen}
        onClose={() => setProposalOpen(false)}
        title="Dispatch proposal"
      >
        <div className="space-y-3">
          <Field label="Start">
            <input
              type="date"
              className={inputClass}
              value={proposal.startDate}
              onChange={(event) =>
                setProposal({ ...proposal, startDate: event.target.value })
              }
            />
          </Field>
          <Field label="End">
            <input
              type="date"
              className={inputClass}
              value={proposal.endDate}
              onChange={(event) =>
                setProposal({ ...proposal, endDate: event.target.value })
              }
            />
          </Field>
          <Field label={`Daily rate (${formatAUD(proposal.dailyRate)})`}>
            <input
              type="number"
              className={inputClass}
              value={proposal.dailyRate}
              onChange={(event) =>
                setProposal({ ...proposal, dailyRate: Number(event.target.value) })
              }
            />
          </Field>
          <Field label="Details">
            <textarea
              className={inputClass}
              rows={3}
              value={proposal.contractDetails}
              onChange={(event) =>
                setProposal({ ...proposal, contractDetails: event.target.value })
              }
            />
          </Field>
          <Field label="Special conditions">
            <textarea
              className={inputClass}
              rows={2}
              value={proposal.specialConditions}
              onChange={(event) =>
                setProposal({ ...proposal, specialConditions: event.target.value })
              }
            />
          </Field>
          <Button variant="dark" className="w-full" onClick={sendProposal}>
            Send proposal
          </Button>
        </div>
      </Modal>
    </div>
  );
}
