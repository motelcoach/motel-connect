import type { ManagerBasket, ManagerProfile } from "./types";
import { uid } from "./utils";

export function managerBasket(manager: Pick<ManagerProfile, "isVerified">): ManagerBasket {
  return manager.isVerified ? "premium" : "open";
}

export function createOpenManager(email: string, id = uid("mgr")): ManagerProfile {
  const handle = email.split("@")[0]?.replace(/[._-]+/g, " ").trim() || "New manager";
  const name = handle.replace(/\b\w/g, (letter) => letter.toUpperCase());

  return {
    id,
    name,
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
