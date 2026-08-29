import type {
  AdvisorCategory,
  AdvisorProfile,
  AdvisorReview,
  AustralianState,
  JobType,
  ListedRole,
  ManagerBasket,
  ManagerProfile,
  ProfileType,
  RoleProfilePreference,
} from "./types";
import { normalizeBrief } from "./roles";
import { managerBasket } from "./managers";
import { average } from "./utils";

export type ManagerFilters = {
  query: string;
  profileType: ProfileType | "Any";
  jobType: JobType | "Any";
  state: AustralianState | "Nationwide" | "Any";
  startDate: string;
  endDate: string;
  pms: string;
  pos: string;
  hr: string;
  liquor: boolean;
  events: boolean;
  restaurant: boolean;
  basket: ManagerBasket | "all";
};

export const defaultManagerFilters = (): ManagerFilters => ({
  query: "",
  profileType: "Any",
  jobType: "Any",
  state: "Any",
  startDate: "",
  endDate: "",
  pms: "",
  pos: "",
  hr: "",
  liquor: false,
  events: false,
  restaurant: false,
  basket: "premium",
});

function dateRangeClear(blockouts: string[], start: string, end: string) {
  if (!start || !end) return true;
  const from = new Date(`${start}T00:00:00`).getTime();
  const to = new Date(`${end}T00:00:00`).getTime();
  if (Number.isNaN(from) || Number.isNaN(to) || from > to) return true;
  return !blockouts.some((day) => {
    const time = new Date(`${day}T00:00:00`).getTime();
    return time >= from && time <= to;
  });
}

export function filterManagers(managers: ManagerProfile[], filters: ManagerFilters) {
  const q = filters.query.trim().toLowerCase();

  return managers.filter((manager) => {
    if (filters.basket !== "all" && managerBasket(manager) !== filters.basket) {
      return false;
    }
    if (filters.profileType !== "Any" && manager.profileType !== filters.profileType) {
      return false;
    }
    if (
      filters.jobType !== "Any" &&
      !manager.preferredJobTypes.includes(filters.jobType)
    ) {
      return false;
    }
    if (filters.state !== "Any") {
      const wantsNationwide = manager.preferredLocations.includes("Nationwide");
      const wantsState =
        filters.state === "Nationwide"
          ? wantsNationwide
          : wantsNationwide || manager.preferredLocations.includes(filters.state);
      if (!wantsState) return false;
    }
    if (!dateRangeClear(manager.blockoutDates, filters.startDate, filters.endDate)) {
      return false;
    }
    if (filters.pms && !manager.softwarePMS.includes(filters.pms)) return false;
    if (filters.pos && !manager.softwarePOS.includes(filters.pos)) return false;
    if (filters.hr && !manager.softwareHR.includes(filters.hr)) return false;
    if (filters.liquor && !manager.liquorLicensing) return false;
    if (filters.events && !manager.eventsExperience) return false;
    if (filters.restaurant && !manager.restaurantPubExperience) return false;
    if (q) {
      const haystack = [
        manager.name,
        manager.partnerName,
        manager.location,
        manager.bio,
        manager.softwarePMS.join(" "),
        manager.preferredLocations.join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export type AdvisorFilters = {
  query: string;
  category: AdvisorCategory | "Any";
  state: AustralianState | "Any";
  specialty: string;
  verifiedReviewsOnly: boolean;
};

export const defaultAdvisorFilters = (): AdvisorFilters => ({
  query: "",
  category: "Any",
  state: "Any",
  specialty: "",
  verifiedReviewsOnly: false,
});

export function filterAdvisors(
  advisors: AdvisorProfile[],
  reviews: AdvisorReview[],
  filters: AdvisorFilters,
) {
  const q = filters.query.trim().toLowerCase();

  return advisors.filter((advisor) => {
    const advisorReviews = reviews.filter((review) => review.advisorId === advisor.id);
    if (filters.verifiedReviewsOnly && !advisorReviews.some((review) => review.isVerifiedOwner)) {
      return false;
    }
    if (filters.category !== "Any" && advisor.category !== filters.category) return false;
    if (filters.state !== "Any" && !advisor.statesCovered.includes(filters.state)) return false;
    if (filters.specialty && !advisor.specialtyTags.includes(filters.specialty)) return false;
    if (q) {
      const haystack = [
        advisor.name,
        advisor.practiceName,
        advisor.location,
        advisor.bio,
        advisor.category,
        advisor.specialtyTags.join(" "),
        advisor.statesCovered.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export type RoleFilters = {
  query: string;
  profileType: RoleProfilePreference | "Any";
  jobType: JobType | "Any";
  state: AustralianState | "Any";
  startDate: string;
  endDate: string;
  pms: string;
  pos: string;
  hr: string;
  liquor: boolean;
  events: boolean;
  restaurant: boolean;
};

export const defaultRoleFilters = (): RoleFilters => ({
  query: "",
  profileType: "Any",
  jobType: "Any",
  state: "Any",
  startDate: "",
  endDate: "",
  pms: "",
  pos: "",
  hr: "",
  liquor: false,
  events: false,
  restaurant: false,
});

function rangesOverlap(roleStart: string, roleEnd: string, from: string, to: string) {
  if (!from && !to) return true;
  const start = new Date(`${roleStart}T00:00:00`).getTime();
  const end = new Date(`${roleEnd}T00:00:00`).getTime();
  const filterStart = from ? new Date(`${from}T00:00:00`).getTime() : start;
  const filterEnd = to ? new Date(`${to}T00:00:00`).getTime() : end;
  if ([start, end, filterStart, filterEnd].some(Number.isNaN)) return true;
  return start <= filterEnd && end >= filterStart;
}

export function filterListedRoles(roles: ListedRole[], filters: RoleFilters) {
  const q = filters.query.trim().toLowerCase();

  return roles.filter((role) => {
    const brief = normalizeBrief(role.brief);
    if (filters.profileType !== "Any" && brief.profileType !== "Either" && brief.profileType !== filters.profileType) {
      return false;
    }
    if (filters.jobType !== "Any" && role.jobType !== filters.jobType) return false;
    if (filters.state !== "Any" && role.state !== filters.state) return false;
    if (!rangesOverlap(role.startDate, role.endDate, filters.startDate, filters.endDate)) {
      return false;
    }
    if (filters.pms && brief.pms !== filters.pms) return false;
    if (filters.pos && brief.pos !== filters.pos) return false;
    if (filters.hr && brief.hr !== filters.hr) return false;
    if (filters.liquor && !brief.liquorRequired) return false;
    if (filters.events && !brief.eventsRequired) return false;
    if (filters.restaurant && !brief.restaurantRequired) return false;
    if (q) {
      const haystack = [
        role.motelName,
        role.location,
        role.ownerName,
        role.notes,
        brief.pms,
        brief.pos,
        brief.otherSystems,
        brief.occupancyNotes,
        brief.livingQuarters,
        brief.packageNotes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export function advisorRating(reviews: AdvisorReview[]) {
  return average(reviews.map((review) => review.rating));
}
