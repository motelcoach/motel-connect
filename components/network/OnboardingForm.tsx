"use client";

import { Badge, Button, Field, inputClass } from "@/components/ui";
import { useStore } from "@/lib/store";
import type {
  ExperienceBand,
  JobType,
  ManagerProfile,
  ProfileType,
  RightToWork,
} from "@/lib/types";
import {
  AU_STATES,
  EXPERIENCE_BANDS,
  JOB_TYPES,
  WORK_RIGHTS,
} from "@/lib/types";
import { uid } from "@/lib/utils";
import { useState } from "react";

const emptyManager = (id: string): ManagerProfile => ({
  id,
  name: "",
  email: "",
  phone: "",
  location: "",
  state: "NSW",
  lat: -33.8688,
  lng: 151.2093,
  photoUrl:
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&h=400&q=80",
  bio: "",
  rightToWork: "Australian Citizen",
  experience: "1-2 years",
  profileType: "Solo",
  preferredLocations: ["NSW"],
  preferredJobTypes: ["Relief"],
  liquorLicensing: false,
  liquorStates: [],
  eventsExperience: false,
  restaurantPubExperience: false,
  microsoftOffice: { Word: true, Excel: false, Outlook: true, Teams: false },
  softwarePMS: [],
  softwarePOS: [],
  softwareHR: [],
  compliance: { policeCheck: false, referenceList: false, managerLicense: false },
  references: [],
  isVerified: false,
  blockoutDates: [],
  completedShifts: 0,
});

export function OnboardingForm() {
  const { currentManager, session } = useStore();

  if (session?.role === "owner") {
    return (
      <p className="text-slate-600">
        Owner motel profiles are managed from Advisors (advisory stack) and the
        workspace. Switch to a manager role to edit a portfolio.
      </p>
    );
  }

  return (
    <OnboardingFields
      key={currentManager?.id ?? "new-manager"}
      initial={currentManager ?? emptyManager(uid("mgr"))}
    />
  );
}

function OnboardingFields({ initial }: { initial: ManagerProfile }) {
  const { taxonomy, saveManager, enqueueSoftware } = useStore();
  const [form, setForm] = useState<ManagerProfile>(initial);
  const [customName, setCustomName] = useState("");
  const [customCat, setCustomCat] = useState<"PMS" | "POS" | "HR">("PMS");
  const [saved, setSaved] = useState(false);

  function toggleArray<T>(list: T[], value: T) {
    return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
  }

  function addReference() {
    setForm({
      ...form,
      references: [
        ...form.references,
        {
          id: uid("ref"),
          businessName: "",
          contactPerson: "",
          phone: "",
          email: "",
          status: "Pending",
        },
      ],
    });
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        saveManager(form);
        setSaved(true);
      }}
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-800">
          Portfolio
        </p>
        <h1 className="font-serif text-3xl text-slate-900">Manager onboarding</h1>
        <p className="mt-1 text-sm text-slate-600">
          Solo and couple profiles. Verification requires two owner references or
          an admin override.
        </p>
        {form.isVerified ? <Badge tone="teal">Verified</Badge> : <Badge tone="amber">Pending verification</Badge>}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Profile type">
          <select
            className={inputClass}
            value={form.profileType}
            onChange={(event) =>
              setForm({ ...form, profileType: event.target.value as ProfileType })
            }
          >
            <option>Solo</option>
            <option>Couple</option>
          </select>
        </Field>
        <Field label="Full name">
          <input
            className={inputClass}
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            className={inputClass}
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
          />
        </Field>
        <Field label="Phone">
          <input
            className={inputClass}
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
          />
        </Field>
        <Field label="Location">
          <input
            className={inputClass}
            value={form.location}
            onChange={(event) => setForm({ ...form, location: event.target.value })}
          />
        </Field>
        <Field label="Home state">
          <select
            className={inputClass}
            value={form.state}
            onChange={(event) =>
              setForm({ ...form, state: event.target.value as ManagerProfile["state"] })
            }
          >
            {AU_STATES.map((state) => (
              <option key={state}>{state}</option>
            ))}
          </select>
        </Field>
        <Field label="Right to work">
          <select
            className={inputClass}
            value={form.rightToWork}
            onChange={(event) =>
              setForm({ ...form, rightToWork: event.target.value as RightToWork })
            }
          >
            {WORK_RIGHTS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </Field>
        <Field label="Experience">
          <select
            className={inputClass}
            value={form.experience}
            onChange={(event) =>
              setForm({ ...form, experience: event.target.value as ExperienceBand })
            }
          >
            {EXPERIENCE_BANDS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </Field>
      </div>

      {form.profileType === "Couple" ? (
        <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-2">
          <Field label="Partner name">
            <input
              className={inputClass}
              value={form.partnerName ?? ""}
              onChange={(event) => setForm({ ...form, partnerName: event.target.value })}
            />
          </Field>
          <Field label="Partner right to work">
            <select
              className={inputClass}
              value={form.partnerRightToWork ?? "Australian Citizen"}
              onChange={(event) =>
                setForm({
                  ...form,
                  partnerRightToWork: event.target.value as RightToWork,
                })
              }
            >
              {WORK_RIGHTS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
          <Field label="Partner experience">
            <select
              className={inputClass}
              value={form.partnerExperience ?? "1-2 years"}
              onChange={(event) =>
                setForm({
                  ...form,
                  partnerExperience: event.target.value as ExperienceBand,
                })
              }
            >
              {EXPERIENCE_BANDS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
          <Field label="Partner bio">
            <textarea
              className={inputClass}
              rows={3}
              value={form.partnerBio ?? ""}
              onChange={(event) => setForm({ ...form, partnerBio: event.target.value })}
            />
          </Field>
        </div>
      ) : null}

      <Field label="Bio">
        <textarea
          className={inputClass}
          rows={4}
          value={form.bio}
          onChange={(event) => setForm({ ...form, bio: event.target.value })}
        />
      </Field>

      <div>
        <p className="mb-2 text-sm font-medium">Preferred states</p>
        <div className="flex flex-wrap gap-2">
          {(["Nationwide", ...AU_STATES] as const).map((state) => (
            <label key={state} className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={form.preferredLocations.includes(state)}
                onChange={() =>
                  setForm({
                    ...form,
                    preferredLocations: toggleArray(form.preferredLocations, state),
                  })
                }
              />
              {state}
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Job types</p>
        <div className="flex flex-wrap gap-2">
          {JOB_TYPES.map((type) => (
            <label key={type} className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={form.preferredJobTypes.includes(type)}
                onChange={() =>
                  setForm({
                    ...form,
                    preferredJobTypes: toggleArray(form.preferredJobTypes, type) as JobType[],
                  })
                }
              />
              {type}
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {(["pms", "pos", "hr"] as const).map((key) => (
          <div key={key}>
            <p className="mb-2 text-sm font-medium uppercase">{key}</p>
            {taxonomy[key].map((item) => {
              const field =
                key === "pms" ? "softwarePMS" : key === "pos" ? "softwarePOS" : "softwareHR";
              return (
                <label key={item} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form[field].includes(item)}
                    onChange={() =>
                      setForm({ ...form, [field]: toggleArray(form[field], item) })
                    }
                  />
                  {item}
                </label>
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <Field label="Request custom software">
          <input
            className={inputClass}
            value={customName}
            onChange={(event) => setCustomName(event.target.value)}
            placeholder="e.g. RoomMaster"
          />
        </Field>
        <select
          className={inputClass + " w-28"}
          value={customCat}
          onChange={(event) => setCustomCat(event.target.value as typeof customCat)}
        >
          <option>PMS</option>
          <option>POS</option>
          <option>HR</option>
        </select>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            if (!customName.trim()) return;
            enqueueSoftware(customName.trim(), customCat);
            setCustomName("");
          }}
        >
          Submit to admin
        </Button>
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.liquorLicensing}
            onChange={(event) =>
              setForm({ ...form, liquorLicensing: event.target.checked })
            }
          />
          Liquor licensed
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.eventsExperience}
            onChange={(event) =>
              setForm({ ...form, eventsExperience: event.target.checked })
            }
          />
          Events
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.restaurantPubExperience}
            onChange={(event) =>
              setForm({ ...form, restaurantPubExperience: event.target.checked })
            }
          />
          Restaurant / pub
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.compliance.policeCheck}
            onChange={(event) =>
              setForm({
                ...form,
                compliance: { ...form.compliance, policeCheck: event.target.checked },
              })
            }
          />
          Police check
        </label>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium">Owner references</p>
          <Button type="button" variant="ghost" onClick={addReference}>
            Add reference
          </Button>
        </div>
        <div className="space-y-3">
          {form.references.map((reference, index) => (
            <div key={reference.id} className="grid gap-2 rounded-xl border border-slate-200 p-3 md:grid-cols-2">
              <input
                className={inputClass}
                placeholder="Business"
                value={reference.businessName}
                onChange={(event) => {
                  const references = [...form.references];
                  references[index] = { ...reference, businessName: event.target.value };
                  setForm({ ...form, references });
                }}
              />
              <input
                className={inputClass}
                placeholder="Contact"
                value={reference.contactPerson}
                onChange={(event) => {
                  const references = [...form.references];
                  references[index] = { ...reference, contactPerson: event.target.value };
                  setForm({ ...form, references });
                }}
              />
              <input
                className={inputClass}
                placeholder="Phone"
                value={reference.phone}
                onChange={(event) => {
                  const references = [...form.references];
                  references[index] = { ...reference, phone: event.target.value };
                  setForm({ ...form, references });
                }}
              />
              <input
                className={inputClass}
                placeholder="Email"
                value={reference.email}
                onChange={(event) => {
                  const references = [...form.references];
                  references[index] = { ...reference, email: event.target.value };
                  setForm({ ...form, references });
                }}
              />
              <Badge tone={reference.status === "Verified" ? "teal" : reference.status === "Failed" ? "rose" : "amber"}>
                {reference.status}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      <Field label="Blockout dates (comma separated YYYY-MM-DD)">
        <input
          className={inputClass}
          value={form.blockoutDates.join(", ")}
          onChange={(event) =>
            setForm({
              ...form,
              blockoutDates: event.target.value
                .split(",")
                .map((value) => value.trim())
                .filter(Boolean),
            })
          }
        />
      </Field>

      <Button type="submit" variant="dark">
        Save portfolio
      </Button>
      {saved ? <p className="text-sm text-teal-800">Saved to this device.</p> : null}
    </form>
  );
}
