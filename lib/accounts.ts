import { personas, seedManagers, seedOwners } from "./initialData";
import type { LoginAccount, Persona, Role, Session } from "./types";

export const DEFAULT_PHOTO =
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&h=400&q=80";

export const ADMIN_EMAIL = "alex.rivera@motelconnect.com.au";

export const DEMO_LOGINS: Array<{ email: string; name: string; label: string }> = [
  { email: "helen@highwayrest.com.au", name: "Helen Walsh", label: "Owner" },
  { email: "marcus.priya@motelmanagers.au", name: "Marcus & Priya", label: "Premium" },
  { email: "jamie.cole@outlook.com", name: "Jamie Cole", label: "Non-vetted" },
  { email: ADMIN_EMAIL, name: "Alex Rivera", label: "Admin" },
];

export function isDemoLoginEmail(email: string) {
  const normalised = email.trim().toLowerCase();
  return DEMO_LOGINS.some((demo) => demo.email === normalised);
}

const ADMIN_PHOTO =
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&h=400&q=80";

function personaFor(role: Role, ownerId?: string, managerId?: string) {
  return personas.find((persona) => {
    if (ownerId) return persona.ownerId === ownerId;
    if (managerId) return persona.managerId === managerId;
    return persona.role === role && !persona.ownerId && !persona.managerId;
  });
}

export function accountFromSeedEmail(email: string): LoginAccount | null {
  const normalised = email.trim().toLowerCase();
  if (!normalised) return null;

  if (normalised === ADMIN_EMAIL) {
    const persona = personaFor("admin");
    return {
      role: "admin",
      email: ADMIN_EMAIL,
      name: persona?.name ?? "Alex Rivera",
      label: persona?.label ?? "System Admin",
      photoUrl: persona?.photoUrl ?? ADMIN_PHOTO,
      personaId: persona?.id,
    };
  }

  const owner = seedOwners.find((item) => item.email.toLowerCase() === normalised);
  if (owner) {
    const persona = personaFor("owner", owner.id);
    return {
      role: "owner",
      email: owner.email.toLowerCase(),
      name: owner.name,
      label: persona?.label ?? "Motel Owner",
      photoUrl: owner.photoUrl || persona?.photoUrl || DEFAULT_PHOTO,
      ownerId: owner.id,
      personaId: persona?.id,
      motelName: owner.motelName,
    };
  }

  const manager = seedManagers.find((item) => item.email.toLowerCase() === normalised);
  if (manager) {
    const role: Role = manager.isVerified ? "verified_manager" : "unverified_manager";
    const persona = personaFor(role, undefined, manager.id);
    return {
      role,
      email: manager.email.toLowerCase(),
      name: manager.name,
      label: persona?.label ?? (manager.isVerified ? "Premium Manager" : "Non-vetted Manager"),
      photoUrl: manager.photoUrl || persona?.photoUrl || DEFAULT_PHOTO,
      managerId: manager.id,
      personaId: persona?.id,
    };
  }

  return null;
}

export function accountFromPersona(persona: Persona): LoginAccount {
  if (persona.ownerId) {
    const owner = seedOwners.find((item) => item.id === persona.ownerId);
    if (owner) return accountFromSeedEmail(owner.email) ?? fallbackPersona(persona);
  }
  if (persona.managerId) {
    const manager = seedManagers.find((item) => item.id === persona.managerId);
    if (manager) return accountFromSeedEmail(manager.email) ?? fallbackPersona(persona);
  }
  if (persona.role === "admin") {
    return accountFromSeedEmail(ADMIN_EMAIL) ?? fallbackPersona(persona);
  }
  return fallbackPersona(persona);
}

function fallbackPersona(persona: Persona): LoginAccount {
  return {
    role: persona.role,
    email: "",
    name: persona.name,
    label: persona.label,
    photoUrl: persona.photoUrl,
    personaId: persona.id,
    ownerId: persona.ownerId,
    managerId: persona.managerId,
  };
}

export function hydrateSession(session: Session | null): Session | null {
  if (!session) return null;
  const persona = personas.find((item) => item.id === session.personaId);
  return {
    ...session,
    email: session.email || "",
    name: session.name || persona?.name || "Member",
    photoUrl: session.photoUrl || persona?.photoUrl || DEFAULT_PHOTO,
    label: session.label || persona?.label || "Member",
  };
}

export function labelForRole(role: Role) {
  if (role === "owner") return "Motel Owner";
  if (role === "verified_manager") return "Premium Manager";
  if (role === "unverified_manager") return "Non-vetted Manager";
  return "System Admin";
}
