import { ADMIN_EMAIL } from "@/lib/accounts";
import { seedManagers, seedOwners } from "@/lib/initialData";
import { nameFromEmail } from "@/lib/managers";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function onboardNetwork(admin: SupabaseClient) {
  const seedManagerRows = seedManagers.map((manager) => ({
    email: manager.email.toLowerCase(),
    name: manager.name,
    phone: manager.phone || null,
    location: manager.location || null,
    state: manager.state,
    basket: manager.isVerified ? "premium" : "open",
    verified_by_admin: Boolean(manager.verifiedByAdmin),
  }));

  if (seedManagerRows.length) {
    await admin.from("managers").upsert(seedManagerRows, {
      onConflict: "email",
      ignoreDuplicates: true,
    });
  }

  const { data: waitingManagers } = await admin
    .from("waitlist")
    .select("email")
    .eq("interest", "manager");

  const waitlistManagerRows = (waitingManagers ?? [])
    .map((row) => String(row.email ?? "").trim().toLowerCase())
    .filter((email) => email.includes("@"))
    .map((email) => ({
      email,
      name: nameFromEmail(email),
      basket: "open" as const,
    }));

  if (waitlistManagerRows.length) {
    await admin.from("managers").upsert(waitlistManagerRows, {
      onConflict: "email",
      ignoreDuplicates: true,
    });
  }

  const seedOwnerRows = seedOwners.map((owner) => ({
    email: owner.email.toLowerCase(),
    name: owner.name,
    motel_name: owner.motelName,
    phone: owner.phone || null,
    location: owner.location || null,
    state: owner.state,
    admitted: true,
  }));

  if (seedOwnerRows.length) {
    await admin.from("owners").upsert(seedOwnerRows, {
      onConflict: "email",
      ignoreDuplicates: true,
    });
  }

  const { data: waitingOwners } = await admin
    .from("waitlist")
    .select("email")
    .eq("interest", "owner");

  const waitlistOwnerRows = (waitingOwners ?? [])
    .map((row) => String(row.email ?? "").trim().toLowerCase())
    .filter((email) => email.includes("@"))
    .map((email) => ({
      email,
      name: nameFromEmail(email),
      admitted: false,
    }));

  if (waitlistOwnerRows.length) {
    await admin.from("owners").upsert(waitlistOwnerRows, {
      onConflict: "email",
      ignoreDuplicates: true,
    });
  }

  await admin.from("admins").upsert(
    { email: ADMIN_EMAIL, name: "Alex Rivera" },
    { onConflict: "email", ignoreDuplicates: true },
  );
}
