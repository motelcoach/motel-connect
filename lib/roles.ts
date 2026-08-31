import type {
  AustralianState,
  JobType,
  ListedRole,
  ListedRoleRecord,
  ListedRoleStatus,
  ManagerProfile,
  OwnerProfile,
  RoleBrief,
} from "./types";
import { asAustralianState } from "./managers";

export function emptyRoleBrief(): RoleBrief {
  return {
    contactName: "",
    contactPhone: "",
    profileType: "Either",
    rooms: 0,
    pms: [],
    pos: [],
    hr: [],
    otherSystems: "",
    durationNotes: "",
    liquorRequired: false,
    liquorNotes: "",
    safeFoodLicense: false,
    eventsRequired: false,
    restaurantRequired: false,
    occupancyAverage: "",
    occupancyNotes: "",
    occupancyMix: "",
    gdsConnected: "",
    cleaningExpectation: "",
    employmentType: "Contractor",
    rosterNotes: "",
    livingQuarters: "",
    petsAllowed: false,
    mealPrepNotes: "",
    superIncluded: false,
    accommodationIncluded: false,
    billsIncluded: false,
    mealsIncluded: false,
    packageNotes: "",
  };
}

function toSoftwareList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && Boolean(item.trim()));
  }
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

export function normalizeBrief(value?: Partial<RoleBrief> | null): RoleBrief {
  const raw = (value ?? {}) as Partial<RoleBrief> & Record<string, unknown>;
  const merged = { ...emptyRoleBrief(), ...raw };
  return {
    ...merged,
    pms: toSoftwareList(raw.pms),
    pos: toSoftwareList(raw.pos),
    hr: toSoftwareList(raw.hr),
  };
}

const JOB_TYPES: JobType[] = ["Full-Time", "Relief", "Relief Couple", "Permanent Couple"];
const STATUSES: ListedRoleStatus[] = ["Open", "Filled", "Closed"];

export function asJobType(value?: string | null): JobType {
  return JOB_TYPES.includes(value as JobType) ? (value as JobType) : "Relief";
}

export function asRoleStatus(value?: string | null): ListedRoleStatus {
  return STATUSES.includes(value as ListedRoleStatus) ? (value as ListedRoleStatus) : "Open";
}

export function toListedRole(
  record: ListedRoleRecord,
  owners: OwnerProfile[],
  managers: ManagerProfile[],
): ListedRole {
  const owner = owners.find((item) => item.email.toLowerCase() === record.ownerEmail.toLowerCase());
  return {
    id: record.id,
    ownerId: owner?.id ?? record.ownerEmail,
    ownerName: record.ownerName || owner?.name || "",
    motelName: record.motelName || owner?.motelName || "",
    location: record.location || owner?.location || "",
    state: asAustralianState(record.state || owner?.state) as AustralianState,
    jobType: asJobType(record.jobType),
    startDate: record.startDate,
    endDate: record.endDate,
    dailyRate: record.dailyRate,
    notes: record.notes,
    brief: normalizeBrief(record.brief),
    status: asRoleStatus(record.status),
    interestedManagerIds: record.interestedEmails
      .map((email) => managers.find((manager) => manager.email.toLowerCase() === email.toLowerCase())?.id)
      .filter((id): id is string => Boolean(id)),
    createdAt: record.createdAt,
  };
}
