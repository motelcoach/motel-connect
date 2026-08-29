"use client";

import { Badge, Button, Field, inputClass, Modal } from "@/components/ui";
import { defaultRoleFilters, filterListedRoles } from "@/lib/filters";
import { canExpressRoleInterest, canListRoles } from "@/lib/permissions";
import { emptyRoleBrief, normalizeBrief } from "@/lib/roles";
import { useStore } from "@/lib/store";
import type {
  AustralianState,
  EmploymentType,
  JobType,
  ListedRole,
  ManagerProfile,
  OccupancyMix,
  OwnerProfile,
  RoleBrief,
  RoleProfilePreference,
  YesNoUnknown,
} from "@/lib/types";
import { AU_STATES, JOB_TYPES } from "@/lib/types";
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

function defaultForm(owner?: OwnerProfile) {
  return {
    jobType: "Relief" as JobType,
    startDate: "",
    endDate: "",
    dailyRate: 350,
    notes: "",
    brief: {
      ...emptyRoleBrief(),
      contactName: owner?.name ?? "",
      contactPhone: owner?.phone ?? "",
      rooms: owner?.rooms ?? 0,
      pms: owner?.pms ?? "",
    },
  };
}

function briefChips(listing: ListedRole) {
  const brief = normalizeBrief(listing.brief);
  return [
    brief.profileType !== "Either" ? brief.profileType : null,
    brief.pms || null,
    brief.pos || null,
    brief.rooms ? `${brief.rooms} rooms` : null,
    brief.liquorRequired ? "RSA / liquor" : null,
    brief.safeFoodLicense ? "Safe food" : null,
    brief.restaurantRequired ? "Restaurant / pub" : null,
    brief.eventsRequired ? "Events" : null,
    brief.employmentType,
    brief.petsAllowed ? "Pets OK" : null,
    brief.superIncluded ? "+ Super" : null,
    brief.billsIncluded ? "Bills included" : null,
    brief.mealsIncluded ? "Meals included" : null,
  ].filter((item): item is string => Boolean(item));
}

function packageLine(listing: ListedRole) {
  const brief = normalizeBrief(listing.brief);
  const extras = [
    brief.superIncluded ? "Super" : null,
    brief.livingQuarters || null,
    brief.billsIncluded ? "bills included" : null,
    brief.mealsIncluded ? "meals included" : null,
  ].filter(Boolean);
  return extras.length ? extras.join(" · ") : brief.packageNotes;
}

export function RoleBoard() {
  const {
    session,
    listedRoles = [],
    managers,
    taxonomy,
    currentOwner,
    createListedRole,
    setListedRoleStatus,
    expressRoleInterest,
    createProposal,
  } = useStore();
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(() => defaultForm());
  const [filters, setFilters] = useState(defaultRoleFilters);

  const canList = session ? canListRoles(session.role) : false;
  const canInterest = session ? canExpressRoleInterest(session.role) : false;

  const scoped = useMemo(() => {
    if (!session) return [];
    if (session.role === "admin") return listedRoles;
    if (session.ownerId) {
      return listedRoles.filter((listing) => listing.ownerId === session.ownerId);
    }
    return listedRoles.filter((listing) => listing.status === "Open");
  }, [listedRoles, session]);

  const visible = useMemo(() => filterListedRoles(scoped, filters), [scoped, filters]);

  function patchBrief(patch: Partial<RoleBrief>) {
    setForm((current) => ({ ...current, brief: { ...current.brief, ...patch } }));
  }

  function publishRole(event: React.FormEvent) {
    event.preventDefault();
    const id = createListedRole(form);
    if (id) {
      setFormOpen(false);
      setForm(defaultForm(currentOwner));
    }
  }

  function proposeFromRole(listing: ListedRole, managerId: string) {
    const brief = normalizeBrief(listing.brief);
    const id = createProposal({
      managerId,
      startDate: listing.startDate,
      endDate: listing.endDate,
      dailyRate: listing.dailyRate,
      contractDetails: [listing.notes, brief.packageNotes, brief.rosterNotes]
        .filter(Boolean)
        .join(" "),
      specialConditions: [
        brief.livingQuarters && `Residence: ${brief.livingQuarters}`,
        brief.petsAllowed ? "Pets OK" : null,
        brief.liquorNotes,
      ]
        .filter(Boolean)
        .join(". "),
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
              ? "Post a placement brief the same way you brief a motel: systems, F&B, occupancy, residence and package. Premium managers can put their hand up."
              : "Filter open cover the same way you search managers. Premium managers can express interest."}
          </p>
          <p className="mt-1 text-sm text-slate-500">{visible.length} showing</p>
        </div>
        {canList ? (
          <Button
            variant="dark"
            onClick={() => {
              setForm(defaultForm(currentOwner));
              setFormOpen(true);
            }}
          >
            List a role
          </Button>
        ) : null}
      </div>

      <div className="soft-panel grid gap-3 rounded-2xl p-4 md:grid-cols-4">
        <input
          className={inputClass}
          placeholder="Search motel, PMS, region…"
          value={filters.query}
          onChange={(event) => setFilters({ ...filters, query: event.target.value })}
        />
        <select
          className={inputClass}
          value={filters.profileType}
          onChange={(event) =>
            setFilters({
              ...filters,
              profileType: event.target.value as RoleProfilePreference | "Any",
            })
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
            setFilters({ ...filters, state: event.target.value as AustralianState | "Any" })
          }
        >
          <option value="Any">Any state</option>
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
            onChange={(event) => setFilters({ ...filters, restaurant: event.target.checked })}
          />
          Restaurant / pub
        </label>
        <button
          type="button"
          className="text-sm font-medium text-teal-800"
          onClick={() => setFilters(defaultRoleFilters())}
        >
          Reset filters
        </button>
      </div>

      <div className="space-y-3">
        {visible.map((listing) => {
          const brief = normalizeBrief(listing.brief);
          const interested = listing.interestedManagerIds
            .map((id) => managers.find((manager) => manager.id === id))
            .filter((manager): manager is ManagerProfile => Boolean(manager));
          const alreadyIn =
            Boolean(session?.managerId) &&
            listing.interestedManagerIds.includes(session?.managerId ?? "");
          const chips = briefChips(listing);
          const extras = packageLine(listing);

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
                    {brief.superIncluded ? " + Super" : ""}
                  </p>
                  {brief.durationNotes ? (
                    <p className="mt-1 text-sm text-slate-500">{brief.durationNotes}</p>
                  ) : null}
                  {listing.notes ? (
                    <p className="mt-2 text-sm text-slate-500">{listing.notes}</p>
                  ) : null}
                  {chips.length ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {chips.map((chip) => (
                        <Badge key={chip}>{chip}</Badge>
                      ))}
                    </div>
                  ) : null}
                  {extras ? <p className="mt-2 text-sm text-slate-500">{extras}</p> : null}
                  {brief.occupancyNotes || brief.occupancyAverage ? (
                    <p className="mt-1 text-sm text-slate-500">
                      Occupancy
                      {brief.occupancyAverage ? ` ${brief.occupancyAverage}` : ""}
                      {brief.occupancyMix ? ` · ${brief.occupancyMix}` : ""}
                      {brief.occupancyNotes ? ` · ${brief.occupancyNotes}` : ""}
                    </p>
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
              ? "No roles match those filters. Publish a placement brief or reset the search."
              : "No open roles match those filters. Reset or check back as owners list cover."}
          </div>
        ) : null}
      </div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Placement brief"
        wide
      >
        <form className="space-y-6" onSubmit={publishRole}>
          <p className="text-sm text-slate-600">
            Same brief you take on an owner call.{" "}
            {currentOwner
              ? `${currentOwner.motelName}, ${currentOwner.location}.`
              : "It lists against your motel."}
          </p>

          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Client
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Contact names">
                <input
                  className={inputClass}
                  value={form.brief.contactName}
                  onChange={(event) => patchBrief({ contactName: event.target.value })}
                  placeholder="Clinton & Lisa"
                />
              </Field>
              <Field label="Phone">
                <input
                  className={inputClass}
                  value={form.brief.contactPhone}
                  onChange={(event) => patchBrief({ contactPhone: event.target.value })}
                  placeholder="0428 374 990"
                />
              </Field>
            </div>
          </section>

          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Role
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
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
              <Field label="Individual or couple">
                <select
                  className={inputClass}
                  value={form.brief.profileType}
                  onChange={(event) =>
                    patchBrief({ profileType: event.target.value as RoleProfilePreference })
                  }
                >
                  <option value="Either">Either</option>
                  <option value="Solo">Individual</option>
                  <option value="Couple">Couple</option>
                </select>
              </Field>
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
            <Field label="Start / duration notes">
              <input
                className={inputClass}
                value={form.brief.durationNotes}
                onChange={(event) => patchBrief({ durationNotes: event.target.value })}
                placeholder="Relaxed / relief for a few months"
              />
            </Field>
          </section>

          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Property and systems
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Room count">
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  value={form.brief.rooms || ""}
                  onChange={(event) => patchBrief({ rooms: Number(event.target.value) || 0 })}
                />
              </Field>
              <Field label="PMS">
                <select
                  className={inputClass}
                  value={form.brief.pms}
                  onChange={(event) => patchBrief({ pms: event.target.value })}
                >
                  <option value="">Select PMS</option>
                  {taxonomy.pms.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </Field>
              <Field label="POS">
                <select
                  className={inputClass}
                  value={form.brief.pos}
                  onChange={(event) => patchBrief({ pos: event.target.value })}
                >
                  <option value="">None / not set up</option>
                  {taxonomy.pos.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </Field>
              <Field label="HR / payroll">
                <select
                  className={inputClass}
                  value={form.brief.hr}
                  onChange={(event) => patchBrief({ hr: event.target.value })}
                >
                  <option value="">None / not set up</option>
                  {taxonomy.hr.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Any other key systems">
              <input
                className={inputClass}
                value={form.brief.otherSystems}
                onChange={(event) => patchBrief({ otherSystems: event.target.value })}
                placeholder="Restaurant & bar — setting up the POS"
              />
            </Field>
          </section>

          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              F&B and compliance
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.brief.liquorRequired}
                  onChange={(event) => patchBrief({ liquorRequired: event.target.checked })}
                />
                Responsible service of alcohol
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.brief.safeFoodLicense}
                  onChange={(event) => patchBrief({ safeFoodLicense: event.target.checked })}
                />
                Safe food licence valuable
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.brief.restaurantRequired}
                  onChange={(event) => patchBrief({ restaurantRequired: event.target.checked })}
                />
                Restaurant / pub
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.brief.eventsRequired}
                  onChange={(event) => patchBrief({ eventsRequired: event.target.checked })}
                />
                Events
              </label>
            </div>
            <Field label="Liquor / F&B notes">
              <input
                className={inputClass}
                value={form.brief.liquorNotes}
                onChange={(event) => patchBrief({ liquorNotes: event.target.value })}
                placeholder="Subsidiary On-Premises licence held by owners"
              />
            </Field>
          </section>

          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Occupancy
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Occupancy average">
                <input
                  className={inputClass}
                  value={form.brief.occupancyAverage}
                  onChange={(event) => patchBrief({ occupancyAverage: event.target.value })}
                  placeholder="70%"
                />
              </Field>
              <Field label="Corporate / leisure mix">
                <select
                  className={inputClass}
                  value={form.brief.occupancyMix}
                  onChange={(event) =>
                    patchBrief({ occupancyMix: event.target.value as OccupancyMix })
                  }
                >
                  <option value="">Not specified</option>
                  <option value="Corporate">Corporate</option>
                  <option value="Leisure">Leisure</option>
                  <option value="Mixed">Mixed</option>
                </select>
              </Field>
              <Field label="GDS connected">
                <select
                  className={inputClass}
                  value={form.brief.gdsConnected}
                  onChange={(event) =>
                    patchBrief({ gdsConnected: event.target.value as YesNoUnknown })
                  }
                >
                  <option value="">Unknown</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </Field>
            </div>
            <Field label="Occupancy notes">
              <input
                className={inputClass}
                value={form.brief.occupancyNotes}
                onChange={(event) => patchBrief({ occupancyNotes: event.target.value })}
                placeholder="M, T and W fully booked. Quiet on weekends."
              />
            </Field>
          </section>

          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Site and roster
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Employee or contractor">
                <select
                  className={inputClass}
                  value={form.brief.employmentType}
                  onChange={(event) =>
                    patchBrief({ employmentType: event.target.value as EmploymentType })
                  }
                >
                  <option value="Contractor">Contractor</option>
                  <option value="Employee">Employee</option>
                </select>
              </Field>
              <Field label="Living quarters">
                <input
                  className={inputClass}
                  value={form.brief.livingQuarters}
                  onChange={(event) => patchBrief({ livingQuarters: event.target.value })}
                  placeholder="1 bedroom apartment"
                />
              </Field>
            </div>
            <Field label="Roster / weeks on">
              <input
                className={inputClass}
                value={form.brief.rosterNotes}
                onChange={(event) => patchBrief({ rosterNotes: event.target.value })}
                placeholder="2–3 weeks on; other managers 4 weeks on"
              />
            </Field>
            <Field label="Cleaning expectation">
              <input
                className={inputClass}
                value={form.brief.cleaningExpectation}
                onChange={(event) => patchBrief({ cleaningExpectation: event.target.value })}
                placeholder="Not a major expectation with cleaning"
              />
            </Field>
            <Field label="Meal preparation">
              <input
                className={inputClass}
                value={form.brief.mealPrepNotes}
                onChange={(event) => patchBrief({ mealPrepNotes: event.target.value })}
                placeholder="Meal preparation 1 night a week"
              />
            </Field>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.brief.petsAllowed}
                onChange={(event) => patchBrief({ petsAllowed: event.target.checked })}
              />
              Manager with pet OK
            </label>
          </section>

          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Package
            </p>
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
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.brief.superIncluded}
                  onChange={(event) => patchBrief({ superIncluded: event.target.checked })}
                />
                Super included
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.brief.billsIncluded}
                  onChange={(event) => patchBrief({ billsIncluded: event.target.checked })}
                />
                Bills included
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.brief.mealsIncluded}
                  onChange={(event) => patchBrief({ mealsIncluded: event.target.checked })}
                />
                Meals included
              </label>
            </div>
            <Field label="Package notes">
              <input
                className={inputClass}
                value={form.brief.packageNotes}
                onChange={(event) => patchBrief({ packageNotes: event.target.value })}
                placeholder="$350 / day + Super. 1 bedroom apartment."
              />
            </Field>
            <Field label="Extra notes">
              <textarea
                className={inputClass}
                rows={3}
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
                placeholder="Anything else from the owner call."
              />
            </Field>
          </section>

          <Button type="submit" className="w-full rounded-full" variant="dark">
            Publish placement
          </Button>
        </form>
      </Modal>
    </div>
  );
}
