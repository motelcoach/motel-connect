import type {
  AustralianState,
  JobType,
  ListedRole,
  ListedRoleRecord,
  ListedRoleStatus,
  ManagerProfile,
  OwnerProfile,
} from "./types";
import { asAustralianState } from "./managers";

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
    status: asRoleStatus(record.status),
    interestedManagerIds: record.interestedEmails
      .map((email) => managers.find((manager) => manager.email.toLowerCase() === email.toLowerCase())?.id)
      .filter((id): id is string => Boolean(id)),
    createdAt: record.createdAt,
  };
}
