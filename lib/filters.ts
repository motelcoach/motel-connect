import type {
  AdvisorCategory,
  AdvisorProfile,
  AdvisorReview,
  AustralianState,
  JobType,
  ManagerProfile,
  ProfileType,
} from "./types";
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
  verifiedOnly: boolean;
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
  verifiedOnly: false,
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
    if (filters.verifiedOnly && !manager.isVerified) return false;
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

export function advisorRating(reviews: AdvisorReview[]) {
  return average(reviews.map((review) => review.rating));
}
