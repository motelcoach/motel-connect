"use client";

import { Badge, Button, Field, inputClass, Modal } from "@/components/ui";
import { advisorRating, defaultAdvisorFilters, filterAdvisors } from "@/lib/filters";
import { useStore } from "@/lib/store";
import type {
  AdvisorCategory,
  AdvisorProfile,
  AdvisorService,
  AustralianState,
} from "@/lib/types";
import { ADVISOR_CATEGORIES, ADVISOR_SERVICES, AU_STATES } from "@/lib/types";
import { cn } from "@/lib/utils";
import { BadgeCheck, LayoutGrid, Mail, Map, Phone } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useMemo, useState } from "react";

const AdvisorMap = dynamic(() => import("./AdvisorMap"), { ssr: false });

export function AdvisorsDirectory() {
  const {
    advisors,
    advisorReviews,
    currentOwner,
    session,
    addAdvisorReview,
    setAdvisoryStack,
    dismissAdvisoryPrompt,
  } = useStore();
  const [filters, setFilters] = useState(defaultAdvisorFilters);
  const [view, setView] = useState<"grid" | "map">("grid");
  const [selected, setSelected] = useState<AdvisorProfile | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [form, setForm] = useState({
    serviceProvided: "General" as AdvisorService,
    rating: 5,
    feedback: "",
  });
  const [stack, setStack] = useState<string[]>(currentOwner?.advisoryStack ?? []);

  const specialties = useMemo(
    () => [...new Set(advisors.flatMap((advisor) => advisor.specialtyTags))].sort(),
    [advisors],
  );

  const results = useMemo(
    () => filterAdvisors(advisors, advisorReviews, filters),
    [advisors, advisorReviews, filters],
  );

  const showPrompt =
    session?.role === "owner" && currentOwner && !currentOwner.advisoryPromptDismissed;
  const canReview = session?.role === "owner" || session?.role === "admin";

  const selectedReviews = selected
    ? advisorReviews.filter((review) => review.advisorId === selected.id)
    : [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-800">
            Discovery
          </p>
          <h1 className="font-serif text-3xl text-slate-900">Motel advisors</h1>
          <p className="mt-1 text-sm text-slate-600">
            {results.length} of {advisors.length} in the network · zero lead fees
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

      {showPrompt ? (
        <div className="rounded-2xl border border-teal-200 bg-teal-50 p-5">
          <h2 className="font-serif text-xl text-slate-900">
            Who is in your motel advisory team?
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Tick the specialists you already use. You can leave a review in one click.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {advisors.map((advisor) => (
              <label key={advisor.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={stack.includes(advisor.id)}
                  onChange={(event) =>
                    setStack((current) =>
                      event.target.checked
                        ? [...current, advisor.id]
                        : current.filter((id) => id !== advisor.id),
                    )
                  }
                />
                {advisor.name} · {advisor.category}
              </label>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="dark" onClick={() => setAdvisoryStack(stack)}>
              Save advisory stack
            </Button>
            <Button variant="ghost" onClick={dismissAdvisoryPrompt}>
              Skip for now
            </Button>
          </div>
        </div>
      ) : null}

      <div className="soft-panel grid gap-3 rounded-2xl p-4 md:grid-cols-4">
        <input
          className={inputClass}
          placeholder="Search name, practice, specialty…"
          value={filters.query}
          onChange={(event) => setFilters({ ...filters, query: event.target.value })}
        />
        <select
          className={inputClass}
          value={filters.category}
          onChange={(event) =>
            setFilters({ ...filters, category: event.target.value as AdvisorCategory | "Any" })
          }
        >
          <option value="Any">Any category</option>
          {ADVISOR_CATEGORIES.map((item) => (
            <option key={item}>{item}</option>
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
          {AU_STATES.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select
          className={inputClass}
          value={filters.specialty}
          onChange={(event) => setFilters({ ...filters, specialty: event.target.value })}
        >
          <option value="">Any specialty</option>
          {specialties.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={filters.verifiedReviewsOnly}
            onChange={(event) =>
              setFilters({ ...filters, verifiedReviewsOnly: event.target.checked })
            }
          />
          Verified owner reviews
        </label>
        <button
          className="text-sm font-medium text-teal-800"
          onClick={() => setFilters(defaultAdvisorFilters())}
        >
          Reset filters
        </button>
      </div>

      {view === "map" ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <AdvisorMap advisors={results} onSelect={setSelected} />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((advisor) => {
            const reviews = advisorReviews.filter((review) => review.advisorId === advisor.id);
            const avg = advisorRating(reviews);
            const verified = reviews.some((review) => review.isVerifiedOwner);
            return (
              <button
                key={advisor.id}
                onClick={() => setSelected(advisor)}
                className="soft-panel rounded-2xl p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex gap-3">
                  <Image
                    src={advisor.photoUrl}
                    alt=""
                    width={64}
                    height={64}
                    className="h-16 w-16 rounded-2xl object-cover"
                  />
                  <div className="min-w-0">
                    <p className="flex items-center gap-1 font-semibold text-slate-900">
                      {advisor.name}
                      {verified ? <BadgeCheck className="h-4 w-4 text-teal-700" /> : null}
                    </p>
                    <p className="text-sm text-slate-500">
                      {advisor.location} · {advisor.practiceName}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <Badge tone="teal">{advisor.category}</Badge>
                      {avg ? <Badge>{avg.toFixed(1)} / 5</Badge> : <Badge tone="amber">New</Badge>}
                    </div>
                  </div>
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-slate-600">{advisor.bio}</p>
                <p className="mt-3 text-xs text-slate-500">
                  {advisor.specialtyTags.slice(0, 3).join(" · ")}
                </p>
              </button>
            );
          })}
        </div>
      )}

      <Modal
        open={Boolean(selected)}
        onClose={() => {
          setSelected(null);
          setReviewing(false);
        }}
        title={selected?.name ?? "Advisor"}
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
              <div>
                <div className="flex flex-wrap gap-1">
                  <Badge tone="teal">{selected.category}</Badge>
                  {advisorRating(selectedReviews) ? (
                    <Badge>
                      {advisorRating(selectedReviews).toFixed(1)} / 5 · {selectedReviews.length}
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-2 text-sm font-medium text-slate-700">{selected.practiceName}</p>
                <p className="text-sm text-slate-600">
                  {selected.location} · {selected.statesCovered.join(", ")}
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-700">{selected.bio}</p>
            <p className="text-sm text-slate-600">
              <span className="font-medium">Specialties:</span> {selected.specialtyTags.join(", ")}
            </p>
            <div className="flex flex-wrap gap-3 text-sm font-medium text-teal-800">
              <a href={`tel:${selected.phone}`} className="inline-flex items-center gap-1">
                <Phone className="h-4 w-4" /> {selected.phone}
              </a>
              <a href={`mailto:${selected.email}`} className="inline-flex items-center gap-1">
                <Mail className="h-4 w-4" /> Email
              </a>
              <a href={selected.website} target="_blank" rel="noreferrer" className="underline">
                Website
              </a>
            </div>
            {canReview ? (
              <Button variant="dark" onClick={() => setReviewing(true)}>
                Leave a review
              </Button>
            ) : null}
            <div className="space-y-2">
              {selectedReviews.map((review) => (
                <div key={review.id} className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
                  <p className="flex flex-wrap items-center gap-2 font-medium text-slate-900">
                    {review.rating}/5 · {review.serviceProvided}
                    {review.isVerifiedOwner ? <Badge tone="teal">Verified owner</Badge> : null}
                  </p>
                  <p className="text-slate-600">{review.feedback}</p>
                  <p className="text-xs text-slate-400">
                    {review.ownerName}, {review.ownerMotel}
                  </p>
                </div>
              ))}
              {!selectedReviews.length ? (
                <p className="text-sm text-slate-500">No reviews yet.</p>
              ) : null}
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={reviewing && Boolean(selected)}
        onClose={() => setReviewing(false)}
        title={selected ? `Review ${selected.name}` : "Review"}
      >
        <div className="space-y-3">
          <Field label="Service">
            <select
              className={inputClass}
              value={form.serviceProvided}
              onChange={(event) =>
                setForm({ ...form, serviceProvided: event.target.value as AdvisorService })
              }
            >
              {ADVISOR_SERVICES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
          <Field label={`Rating ${form.rating}/5`}>
            <input
              type="range"
              min={1}
              max={5}
              value={form.rating}
              className="w-full accent-teal-800"
              onChange={(event) => setForm({ ...form, rating: Number(event.target.value) })}
            />
          </Field>
          <Field label="Feedback">
            <textarea
              className={inputClass}
              rows={3}
              value={form.feedback}
              onChange={(event) => setForm({ ...form, feedback: event.target.value })}
            />
          </Field>
          <Button
            variant="dark"
            className="w-full"
            onClick={() => {
              if (!selected) return;
              addAdvisorReview({ advisorId: selected.id, ...form });
              setReviewing(false);
            }}
          >
            Publish review
          </Button>
        </div>
      </Modal>
    </div>
  );
}
