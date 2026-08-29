import type {
  AustralianState,
  ManagerBasket,
  ManagerProfile,
  ManagerRosterRecord,
} from "./types";
import { computeVerified, uid } from "./utils";

const STATES: AustralianState[] = ["QLD", "NSW", "VIC", "WA", "SA", "TAS", "NT", "ACT"];

export function managerBasket(manager: Pick<ManagerProfile, "isVerified">): ManagerBasket {
  return manager.isVerified ? "premium" : "open";
}

export function nameFromEmail(email: string) {
  const handle = email.split("@")[0]?.replace(/[._-]+/g, " ").trim() || "New manager";
  return handle.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function asAustralianState(value?: string | null): AustralianState {
  return STATES.includes(value as AustralianState) ? (value as AustralianState) : "NSW";
}

export function createOpenManager(email: string, id = uid("mgr")): ManagerProfile {
  return {
    id,
    name: nameFromEmail(email),
    email,
    phone: "",
    location: "",
    state: "NSW",
    lat: -33.8688,
    lng: 151.2093,
    photoUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&h=400&q=80",
    bio: "Open roster — portfolio in progress. Premium unlocks after two vetted owner references.",
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
  };
}

function applyRosterRow(existing: ManagerProfile | undefined, row: ManagerRosterRecord): ManagerProfile {
  const base = existing ?? createOpenManager(row.email, row.id);
  const premium = row.basket === "premium";

  return {
    ...base,
    name: base.name || row.name || nameFromEmail(row.email),
    email: row.email,
    phone: base.phone || row.phone || "",
    location: base.location || row.location || "",
    state: base.location ? base.state : asAustralianState(row.state),
    verifiedByAdmin: row.verifiedByAdmin || premium,
  };
}

export function mergeRoster(
  local: ManagerProfile[],
  remote: ManagerRosterRecord[],
): ManagerProfile[] {
  const byEmail = new Map(local.map((manager) => [manager.email.toLowerCase(), manager]));

  for (const row of remote) {
    const key = row.email.toLowerCase();
    byEmail.set(key, applyRosterRow(byEmail.get(key), row));
  }

  return Array.from(byEmail.values()).map((manager) => ({
    ...manager,
    isVerified: computeVerified(manager),
  }));
}
