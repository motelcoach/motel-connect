import {
  accountFromSeedEmail,
  DEFAULT_PHOTO,
  labelForRole,
} from "@/lib/accounts";
import { nameFromEmail } from "@/lib/managers";
import { isMissingTable } from "@/lib/supabase/missing";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase/admin";
import type { LoginAccount, Role } from "@/lib/types";

export type LoginLookup =
  | { ok: true; account: LoginAccount; seeded?: boolean }
  | {
      ok: false;
      status: "waitlist" | "unknown" | "unavailable" | "error";
      interest?: "owner" | "manager";
      message: string;
    };

function asAccount(partial: LoginAccount): LoginAccount {
  const seed = accountFromSeedEmail(partial.email);
  return {
    role: partial.role,
    email: partial.email,
    name: seed?.name || partial.name || nameFromEmail(partial.email),
    photoUrl: seed?.photoUrl || partial.photoUrl || DEFAULT_PHOTO,
    label: seed?.label || partial.label || labelForRole(partial.role),
    ownerId: seed?.ownerId ?? partial.ownerId,
    managerId: seed?.managerId ?? partial.managerId,
    personaId: seed?.personaId ?? partial.personaId,
    motelName: seed?.motelName ?? partial.motelName,
  };
}

export async function resolveLoginAccount(email: string): Promise<LoginLookup> {
  const normalised = email.trim().toLowerCase();
  const seed = accountFromSeedEmail(normalised);

  if (!isSupabaseConfigured()) {
    if (seed) return { ok: true, account: seed };
    return {
      ok: false,
      status: "unavailable",
      message: "Supabase is not configured",
    };
  }

  const admin = supabaseAdmin();

  const { data: adminRow, error: adminError } = await admin
    .from("admins")
    .select("email, name")
    .ilike("email", normalised)
    .maybeSingle();

  if (adminError && !isMissingTable(adminError)) {
    return { ok: false, status: "error", message: adminError.message };
  }
  if (adminRow) {
    return {
      ok: true,
      account: asAccount({
        role: "admin",
        email: normalised,
        name: String(adminRow.name || "Admin"),
        label: "System Admin",
        photoUrl: DEFAULT_PHOTO,
      }),
    };
  }

  const { data: ownerRow, error: ownerError } = await admin
    .from("owners")
    .select("id, email, name, motel_name, admitted")
    .ilike("email", normalised)
    .maybeSingle();

  if (ownerError && !isMissingTable(ownerError)) {
    return { ok: false, status: "error", message: ownerError.message };
  }
  if (ownerRow && ownerRow.admitted) {
    return {
      ok: true,
      account: asAccount({
        role: "owner",
        email: normalised,
        name: String(ownerRow.name || nameFromEmail(normalised)),
        label: "Motel Owner",
        photoUrl: DEFAULT_PHOTO,
        ownerId: String(ownerRow.id),
        motelName: ownerRow.motel_name ? String(ownerRow.motel_name) : undefined,
      }),
    };
  }
  if (ownerRow && !ownerRow.admitted) {
    return {
      ok: false,
      status: "waitlist",
      interest: "owner",
      message: "You're on the owner waitlist. We'll open the network when your invite is admitted.",
    };
  }

  const { data: managerRow, error: managerError } = await admin
    .from("managers")
    .select("id, email, name, basket")
    .ilike("email", normalised)
    .maybeSingle();

  if (managerError && !isMissingTable(managerError)) {
    return { ok: false, status: "error", message: managerError.message };
  }
  if (managerRow) {
    const role: Role = managerRow.basket === "premium" ? "verified_manager" : "unverified_manager";
    return {
      ok: true,
      account: asAccount({
        role,
        email: normalised,
        name: String(managerRow.name || nameFromEmail(normalised)),
        label: labelForRole(role),
        photoUrl: DEFAULT_PHOTO,
        managerId: String(managerRow.id),
      }),
    };
  }

  const { data: waitlistRow } = await admin
    .from("waitlist")
    .select("interest")
    .ilike("email", normalised)
    .maybeSingle();

  if (waitlistRow?.interest === "owner") {
    return {
      ok: false,
      status: "waitlist",
      interest: "owner",
      message: "You're on the owner waitlist. We'll open the network when your invite is admitted.",
    };
  }

  if (waitlistRow?.interest === "manager") {
    const role: Role = "unverified_manager";
    return {
      ok: true,
      account: asAccount({
        role,
        email: normalised,
        name: nameFromEmail(normalised),
        label: labelForRole(role),
        photoUrl: DEFAULT_PHOTO,
      }),
    };
  }

  if (seed) {
    return { ok: true, account: seed, seeded: true };
  }

  return {
    ok: false,
    status: "unknown",
    message: "That email is not on Motel Connect yet. Request an invite first.",
  };
}
