import type { AustralianState, JobContract, ManagerProfile } from "./types";
import { average } from "./utils";

export type LeaderboardRow = {
  manager: ManagerProfile;
  score: number;
  completedShifts: number;
  rehireRate: number;
  avgOverall: number;
  avgGuest: number;
  avgComputer: number;
  avgDetail: number;
  reviewCount: number;
};

export function rankManagers(
  managers: ManagerProfile[],
  contracts: JobContract[],
  state: AustralianState | "Nationwide",
) {
  const rows: LeaderboardRow[] = managers
    .filter((manager) => manager.isVerified)
    .filter((manager) => {
      if (state === "Nationwide") return true;
      return (
        manager.preferredLocations.includes("Nationwide") ||
        manager.preferredLocations.includes(state) ||
        manager.state === state
      );
    })
    .map((manager) => {
      const completed = contracts.filter(
        (contract) =>
          contract.managerId === manager.id && contract.status === "Completed",
      );
      const reviews = completed
        .map((contract) => contract.reviewByOwner)
        .filter((review): review is NonNullable<typeof review> => Boolean(review));
      const rehireRate = reviews.length
        ? reviews.filter((review) => review.rehire).length / reviews.length
        : 0;
      const avgOverall = average(reviews.map((review) => review.overall));
      const avgGuest = average(reviews.map((review) => review.guestService));
      const avgComputer = average(reviews.map((review) => review.computerCapability));
      const avgDetail = average(reviews.map((review) => review.attentionToDetail));
      const regionalBonus =
        state !== "Nationwide" &&
        (manager.preferredLocations.includes(state) || manager.state === state)
          ? 8
          : 0;
      const completedShifts = Math.max(manager.completedShifts, completed.length);
      const score =
        completedShifts * 12 +
        rehireRate * 50 +
        avgOverall * 4 +
        regionalBonus;

      return {
        manager,
        score,
        completedShifts,
        rehireRate,
        avgOverall,
        avgGuest,
        avgComputer,
        avgDetail,
        reviewCount: reviews.length,
      };
    });

  return rows.sort((a, b) => b.score - a.score || b.completedShifts - a.completedShifts);
}
