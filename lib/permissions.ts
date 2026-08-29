import type { Role } from "./types";

export function canDispatchProposals(role: Role) {
  return role === "owner" || role === "admin";
}

export function canNegotiateContracts(role: Role) {
  return role === "verified_manager" || role === "owner" || role === "admin";
}

export function canMessage(role: Role, ndaComplete: boolean) {
  if (role === "admin") return true;
  if (role === "unverified_manager") return false;
  return ndaComplete;
}

export function canLeaveReviews(role: Role) {
  return role === "owner" || role === "verified_manager" || role === "admin";
}

export function canEditManagerProfile(role: Role) {
  return (
    role === "verified_manager" ||
    role === "unverified_manager" ||
    role === "admin"
  );
}

export function canUseAdmin(role: Role) {
  return role === "admin";
}

export function isManagerRole(role: Role) {
  return role === "verified_manager" || role === "unverified_manager";
}

export function navItems(role: Role) {
  const items = [
    { href: "/network/managers", label: "Managers" },
    { href: "/network/roles", label: "Roles" },
    { href: "/network/workspace", label: "Workspace" },
    { href: "/network/reviews", label: "Reviews" },
    { href: "/network/advisors", label: "Advisors" },
  ];

  if (isManagerRole(role) || role === "admin") {
    items.push({ href: "/network/onboarding", label: "Portfolio" });
  }

  if (role === "admin") {
    items.push({ href: "/network/admin", label: "Admin" });
  }

  return items;
}

export function canListRoles(role: Role) {
  return role === "owner" || role === "admin";
}

export function canExpressRoleInterest(role: Role) {
  return role === "verified_manager" || role === "admin";
}
