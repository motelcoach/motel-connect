"use client";

import { Badge, Button, Field, inputClass } from "@/components/ui";
import { canLeaveReviews, canMessage, canNegotiateContracts } from "@/lib/permissions";
import { useStore } from "@/lib/store";
import type { ContractStatus } from "@/lib/types";
import { CONTRACT_STAGES } from "@/lib/types";
import { cn, formatAUD, formatDate, formatDateTime } from "@/lib/utils";
import { useMemo, useState } from "react";
import { ReviewDrawer } from "./ReviewSystem";

const stageLabel: Record<ContractStatus, string> = {
  Proposal: "Proposal",
  NDAPending: "NDA",
  ChatActive: "Negotiate",
  Agreed: "Agreed",
  Completed: "Completed",
  Declined: "Declined",
};

function toneFor(status: ContractStatus) {
  if (status === "Completed") return "emerald" as const;
  if (status === "Declined") return "rose" as const;
  if (status === "Agreed") return "teal" as const;
  if (status === "ChatActive") return "teal" as const;
  if (status === "NDAPending") return "amber" as const;
  return "slate" as const;
}

export function RecruitmentWorkspace() {
  const store = useStore();
  const { session, contracts, respondToProposal, signNDA, sendMessage, updateContractTerms, lockAgreement, completeContract } =
    store;
  const [activeId, setActiveId] = useState(contracts[0]?.id ?? "");
  const [draft, setDraft] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);

  const visible = useMemo(() => {
    if (!session) return [];
    if (session.role === "admin") return contracts;
    if (session.ownerId) return contracts.filter((job) => job.ownerId === session.ownerId);
    if (session.managerId) return contracts.filter((job) => job.managerId === session.managerId);
    return [];
  }, [contracts, session]);

  const job = visible.find((item) => item.id === activeId) ?? visible[0];

  if (!session || !job) {
    return (
      <div className="soft-panel rounded-2xl p-8 text-slate-600">
        No contracts yet. Owners dispatch proposals from the manager directory.
      </div>
    );
  }

  const ndaDone = job.ownerSignedNDA && job.managerSignedNDA;
  const chatOn = canMessage(session.role, ndaDone) && job.status !== "Proposal" && job.status !== "Declined";
  const canAct = canNegotiateContracts(session.role);
  const isOwner = session.role === "owner" || session.role === "admin";
  const isManager = session.role === "verified_manager" || session.role === "admin";

  return (
    <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
      <aside className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-800">
          Contract engine
        </p>
        <h1 className="font-serif text-3xl text-slate-900">Workspace</h1>
        {visible.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveId(item.id)}
            className={cn(
              "w-full rounded-2xl border p-3 text-left",
              item.id === job.id
                ? "border-teal-300 bg-teal-50"
                : "border-slate-200 bg-white hover:border-slate-300",
            )}
          >
            <p className="text-sm font-semibold text-slate-900">{item.managerName}</p>
            <p className="text-xs text-slate-500">{item.ownerMotel}</p>
            <div className="mt-1">
              <Badge tone={toneFor(item.status)}>{stageLabel[item.status]}</Badge>
            </div>
          </button>
        ))}
      </aside>

      <section className="soft-panel space-y-5 rounded-2xl p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-serif text-2xl text-slate-900">
              {job.ownerMotel} → {job.managerName}
            </h2>
            <p className="text-sm text-slate-600">
              {formatDate(job.startDate)} – {formatDate(job.endDate)} · {formatAUD(job.dailyRate)}
              /day
            </p>
          </div>
          <Badge tone={toneFor(job.status)}>{stageLabel[job.status]}</Badge>
        </div>

        <ol className="grid grid-cols-5 gap-2">
          {CONTRACT_STAGES.map((stage, index) => {
            const currentIndex = CONTRACT_STAGES.indexOf(
              job.status === "Declined" ? "Proposal" : job.status,
            );
            return (
              <li
                key={stage}
                className={cn(
                  "rounded-xl px-2 py-2 text-center text-[11px] font-semibold",
                  index <= currentIndex && job.status !== "Declined"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-500",
                )}
              >
                {index + 1}. {stageLabel[stage]}
              </li>
            );
          })}
        </ol>

        <p className="text-sm text-slate-700">{job.contractDetails}</p>
        {job.specialConditions ? (
          <p className="text-sm text-slate-500">Conditions: {job.specialConditions}</p>
        ) : null}

        {job.status === "Proposal" && canAct ? (
          <div className="flex gap-2">
            {isManager ? (
              <>
                <Button variant="dark" onClick={() => respondToProposal(job.id, true)}>
                  Accept & move to NDA
                </Button>
                <Button variant="danger" onClick={() => respondToProposal(job.id, false)}>
                  Decline
                </Button>
              </>
            ) : (
              <p className="text-sm text-slate-500">Waiting for the manager to accept.</p>
            )}
          </div>
        ) : null}

        {(job.status === "NDAPending" || ndaDone) && job.status !== "Declined" ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="font-semibold text-slate-900">Mutual NDA</h3>
            <p className="mt-1 text-sm text-slate-600">
              Direct chat stays locked until both parties execute the digital NDA.
              Commercial terms, guest lists and wage rates stay confidential.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone={job.ownerSignedNDA ? "teal" : "amber"}>
                Owner {job.ownerSignedNDA ? "signed" : "pending"}
              </Badge>
              <Badge tone={job.managerSignedNDA ? "teal" : "amber"}>
                Manager {job.managerSignedNDA ? "signed" : "pending"}
              </Badge>
            </div>
            {job.status === "NDAPending" && canAct ? (
              <Button className="mt-3" variant="dark" onClick={() => signNDA(job.id)}>
                Sign digital NDA
              </Button>
            ) : null}
          </div>
        ) : null}

        {job.status === "ChatActive" && canAct ? (
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Start">
              <input
                type="date"
                className={inputClass}
                value={job.startDate}
                onChange={(event) =>
                  updateContractTerms(job.id, { startDate: event.target.value })
                }
              />
            </Field>
            <Field label="End">
              <input
                type="date"
                className={inputClass}
                value={job.endDate}
                onChange={(event) =>
                  updateContractTerms(job.id, { endDate: event.target.value })
                }
              />
            </Field>
            <Field label="Daily rate AUD">
              <input
                type="number"
                className={inputClass}
                value={job.dailyRate}
                onChange={(event) =>
                  updateContractTerms(job.id, { dailyRate: Number(event.target.value) })
                }
              />
            </Field>
            <div className="flex items-end">
              <Button variant="dark" onClick={() => lockAgreement(job.id)}>
                {isOwner && !job.ownerAgreed
                  ? "Owner lock terms"
                  : isManager && !job.managerAgreed
                    ? "Manager lock terms"
                    : "Lock agreement"}
              </Button>
            </div>
            <div className="md:col-span-2 flex gap-2">
              <Badge tone={job.ownerAgreed ? "teal" : "amber"}>
                Owner {job.ownerAgreed ? "locked" : "not locked"}
              </Badge>
              <Badge tone={job.managerAgreed ? "teal" : "amber"}>
                Manager {job.managerAgreed ? "locked" : "not locked"}
              </Badge>
            </div>
          </div>
        ) : null}

        {job.status === "Agreed" && canAct ? (
          <Button variant="dark" onClick={() => completeContract(job.id)}>
            Mark shift completed
          </Button>
        ) : null}

        {job.status === "Completed" && canLeaveReviews(session.role) ? (
          <Button onClick={() => setReviewOpen(true)}>Open bidirectional review</Button>
        ) : null}

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="font-semibold text-slate-900">Secure chat</h3>
          {!chatOn ? (
            <p className="mt-2 text-sm text-slate-500">
              Chat unlocks after mutual NDA. Non-vetted managers remain locked.
            </p>
          ) : (
            <>
              <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
                {job.messages.map((message) => (
                  <div key={message.id} className="rounded-xl bg-white p-3 text-sm shadow-sm">
                    <p className="text-xs font-semibold text-teal-800">
                      {message.sender} · {formatDateTime(message.timestamp)}
                    </p>
                    <p className="text-slate-700">{message.text}</p>
                  </div>
                ))}
                {!job.messages.length ? (
                  <p className="text-sm text-slate-500">No messages yet.</p>
                ) : null}
              </div>
              <form
                className="mt-3 flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!draft.trim()) return;
                  sendMessage(job.id, draft.trim());
                  setDraft("");
                }}
              >
                <input
                  className={inputClass}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Negotiate dates and rate…"
                />
                <Button type="submit" variant="dark">
                  Send
                </Button>
              </form>
            </>
          )}
        </div>
      </section>

      <ReviewDrawer contract={job} open={reviewOpen} onClose={() => setReviewOpen(false)} />
    </div>
  );
}
