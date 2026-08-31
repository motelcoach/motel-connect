import { seedManagers } from "./initialData";
import type { ManagerProfile, PublicManagerProfile } from "./types";

export function managerSharePath(id: string) {
  return `/m/${id}`;
}

export function toPublicManager(manager: ManagerProfile): PublicManagerProfile {
  return {
    id: manager.id,
    name: manager.name,
    location: manager.location,
    state: manager.state,
    photoUrl: manager.photoUrl,
    bio: manager.bio,
    rightToWork: manager.rightToWork,
    experience: manager.experience,
    profileType: manager.profileType,
    partnerName: manager.partnerName,
    partnerBio: manager.partnerBio,
    partnerExperience: manager.partnerExperience,
    partnerPhotoUrl: manager.partnerPhotoUrl,
    preferredLocations: manager.preferredLocations,
    preferredJobTypes: manager.preferredJobTypes,
    liquorLicensing: manager.liquorLicensing,
    liquorStates: manager.liquorStates,
    eventsExperience: manager.eventsExperience,
    restaurantPubExperience: manager.restaurantPubExperience,
    softwarePMS: manager.softwarePMS,
    softwarePOS: manager.softwarePOS,
    softwareHR: manager.softwareHR,
    isVerified: manager.isVerified,
    completedShifts: manager.completedShifts,
  };
}

export function publicDisplayName(manager: Pick<PublicManagerProfile, "name" | "profileType" | "partnerName">) {
  if (manager.profileType === "Couple" && manager.partnerName) {
    return `${manager.name.split(" ")[0]} & ${manager.partnerName}`;
  }
  return manager.name;
}

export function findSeedPublicManager(id: string): PublicManagerProfile | null {
  const manager = seedManagers.find((item) => item.id === id);
  return manager ? toPublicManager(manager) : null;
}
