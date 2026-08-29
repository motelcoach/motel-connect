"use client";

import { Badge, Button, Field, inputClass, Modal } from "@/components/ui";
import { canLeaveReviews } from "@/lib/permissions";
import { useStore } from "@/lib/store";
import type { JobContract, ManagerReview, OwnerReview } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { useMemo, useState } from "react";

function Score({ value, max = 10 }: { value: number; max?: number }) {
  return (
    <span className="font-semibold tabular-nums text-slate-900">
      {value}/{max}
    </span>
  );
}

function Slider({
  label,
  value,
  onChange,
  max = 10,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  max?: number;
}) {
  return (
    <Field label={`${label} (${value}/${max})`}>
      <input
        type="range"
        min={1}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-teal-800"
      />
    </Field>
  );
}

export function ReviewDrawer({
  contract,
  open,
  onClose,
}: {
  contract: JobContract | null;
  open: boolean;
  onClose: () => void;
}) {
  const { session, submitOwnerReview, submitManagerReview } = useStore();
  const [owner, setOwner] = useState<OwnerReview>({
    overall: 8,
    guestService: 8,
    computerCapability: 8,
    attentionToDetail: 8,
    rehire: true,
    comments: "",
  });
  const [manager, setManager] = useState<ManagerReview>({
    residence: 8,
    environment: 8,
    wagesPaidSwiftly: 8,
    comments: "",
  });

  if (!contract || !session) return null;
  const canReview = canLeaveReviews(session.role);
  const asOwner = session.role === "owner" || session.role === "admin";
  const asManager = session.role === "verified_manager" || session.role === "admin";

  return (
    <Modal open={open} onClose={onClose} title="Bidirectional review" wide>
      <p className="mb-4 text-sm text-slate-600">
        {contract.ownerMotel} · {contract.managerName} · {formatDate(contract.startDate)}–
        {formatDate(contract.endDate)}
      </p>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3 rounded-2xl border border-slate-200 p-4">
          <h3 className="font-semibold">Owner → Manager</h3>
          {contract.reviewByOwner ? (
            <div className="space-y-1 text-sm">
              <p>Overall <Score value={contract.reviewByOwner.overall} /></p>
              <p>Guest service <Score value={contract.reviewByOwner.guestService} /></p>
              <p>Computer / PMS <Score value={contract.reviewByOwner.computerCapability} /></p>
              <p>Attention to detail <Score value={contract.reviewByOwner.attentionToDetail} /></p>
              <p>Rehire {contract.reviewByOwner.rehire ? "Yes" : "No"}</p>
              <p className="text-slate-600">{contract.reviewByOwner.comments}</p>
            </div>
          ) : asOwner && canReview ? (
            <>
              <Slider label="Overall" value={owner.overall} onChange={(overall) => setOwner({ ...owner, overall })} />
              <Slider label="Guest service" value={owner.guestService} onChange={(guestService) => setOwner({ ...owner, guestService })} />
              <Slider label="Computer capability" value={owner.computerCapability} onChange={(computerCapability) => setOwner({ ...owner, computerCapability })} />
              <Slider label="Attention to detail" value={owner.attentionToDetail} onChange={(attentionToDetail) => setOwner({ ...owner, attentionToDetail })} />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={owner.rehire}
                  onChange={(event) => setOwner({ ...owner, rehire: event.target.checked })}
                />
                Would rehire
              </label>
              <textarea
                className={inputClass}
                rows={3}
                placeholder="Comments"
                value={owner.comments}
                onChange={(event) => setOwner({ ...owner, comments: event.target.value })}
              />
              <Button
                variant="dark"
                onClick={() => {
                  submitOwnerReview(contract.id, owner);
                  onClose();
                }}
              >
                Submit owner review
              </Button>
            </>
          ) : (
            <p className="text-sm text-slate-500">Waiting for the owner review.</p>
          )}
        </div>
        <div className="space-y-3 rounded-2xl border border-slate-200 p-4">
          <h3 className="font-semibold">Manager → Owner</h3>
          {contract.reviewByManager ? (
            <div className="space-y-1 text-sm">
              <p>Residence <Score value={contract.reviewByManager.residence} /></p>
              <p>Workplace <Score value={contract.reviewByManager.environment} /></p>
              <p>Wage speed <Score value={contract.reviewByManager.wagesPaidSwiftly} /></p>
              <p className="text-slate-600">{contract.reviewByManager.comments}</p>
            </div>
          ) : asManager && canReview ? (
            <>
              <Slider label="Residence" value={manager.residence} onChange={(residence) => setManager({ ...manager, residence })} />
              <Slider label="Working environment" value={manager.environment} onChange={(environment) => setManager({ ...manager, environment })} />
              <Slider label="Wage payment speed" value={manager.wagesPaidSwiftly} onChange={(wagesPaidSwiftly) => setManager({ ...manager, wagesPaidSwiftly })} />
              <textarea
                className={inputClass}
                rows={3}
                placeholder="Comments"
                value={manager.comments}
                onChange={(event) => setManager({ ...manager, comments: event.target.value })}
              />
              <Button
                variant="dark"
                onClick={() => {
                  submitManagerReview(contract.id, manager);
                  onClose();
                }}
              >
                Submit manager review
              </Button>
            </>
          ) : (
            <p className="text-sm text-slate-500">Waiting for the manager review.</p>
          )}
        </div>
      </div>
    </Modal>
  );
}

export function ReviewSystem() {
  const { contracts, session } = useStore();
  const [openId, setOpenId] = useState<string | null>(null);

  const completed = useMemo(() => {
    if (!session) return [];
    return contracts.filter((job) => {
      if (job.status !== "Completed") return false;
      if (session.role === "admin") return true;
      if (session.ownerId) return job.ownerId === session.ownerId;
      if (session.managerId) return job.managerId === session.managerId;
      return false;
    });
  }, [contracts, session]);

  const active = completed.find((job) => job.id === openId) ?? null;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-800">
          After the shift
        </p>
        <h1 className="font-serif text-3xl text-slate-900">Bidirectional reviews</h1>
        <p className="mt-1 text-sm text-slate-600">
          Owners score operations 1–10. Managers score residence, workplace and wage
          speed. Rehire flags stay on the profile.
        </p>
      </div>
      <div className="grid gap-3">
        {completed.map((job) => (
          <div key={job.id} className="soft-panel flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
            <div>
              <p className="font-semibold text-slate-900">
                {job.ownerMotel} · {job.managerName}
              </p>
              <p className="text-sm text-slate-500">
                {formatDate(job.startDate)} – {formatDate(job.endDate)}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge tone={job.reviewByOwner ? "teal" : "amber"}>
                  Owner {job.reviewByOwner ? `${job.reviewByOwner.overall}/10` : "pending"}
                </Badge>
                <Badge tone={job.reviewByManager ? "teal" : "amber"}>
                  Manager {job.reviewByManager ? `${job.reviewByManager.residence}/10` : "pending"}
                </Badge>
              </div>
            </div>
            <Button variant="secondary" onClick={() => setOpenId(job.id)}>
              Open review
            </Button>
          </div>
        ))}
        {!completed.length ? (
          <p className="text-sm text-slate-500">Completed shifts will appear here.</p>
        ) : null}
      </div>
      <ReviewDrawer contract={active} open={Boolean(openId)} onClose={() => setOpenId(null)} />
    </div>
  );
}
