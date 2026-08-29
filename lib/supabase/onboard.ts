import { ADMIN_EMAIL } from "@/lib/accounts";
import { seedListedRoles, seedManagers, seedOwners } from "@/lib/initialData";
import { nameFromEmail, toProfileJson } from "@/lib/managers";
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

  await seedEmptyProfiles(admin);
  await seedEmptyListedRoles(admin);
  await backfillEmptyRoleBriefs(admin);
}

async function seedEmptyProfiles(admin: SupabaseClient) {
  const { data, error } = await admin.from("managers").select("email, profile");
  if (error) return;

  const empty = new Set(
    (data ?? [])
      .filter((row) => !row.profile || Object.keys(row.profile as object).length === 0)
      .map((row) => String(row.email ?? "").toLowerCase()),
  );

  for (const manager of seedManagers) {
    if (!empty.has(manager.email.toLowerCase())) continue;
    await admin
      .from("managers")
      .update({
        name: manager.name,
        phone: manager.phone || null,
        location: manager.location || null,
        state: manager.state,
        profile: toProfileJson(manager),
      })
      .ilike("email", manager.email);
  }
}

async function seedEmptyListedRoles(admin: SupabaseClient) {
  const { count, error } = await admin.from("listed_roles").select("id", { count: "exact", head: true });
  if (error || (count ?? 0) > 0) return;

  for (const role of seedListedRoles) {
    const owner = seedOwners.find((item) => item.id === role.ownerId);
    const { data, error: insertError } = await admin
      .from("listed_roles")
      .insert({
        owner_email: owner?.email.toLowerCase() ?? "",
        owner_name: role.ownerName,
        motel_name: role.motelName,
        location: role.location,
        state: role.state,
        job_type: role.jobType,
        start_date: role.startDate,
        end_date: role.endDate,
        daily_rate: role.dailyRate,
        notes: role.notes,
        brief: role.brief ?? {},
        status: role.status,
        created_at: role.createdAt,
      })
      .select("id")
      .maybeSingle();

    if (insertError || !data?.id) continue;

    const emails = role.interestedManagerIds
      .map((id) => seedManagers.find((manager) => manager.id === id)?.email.toLowerCase())
      .filter((email): email is string => Boolean(email));

    if (emails.length) {
      await admin.from("listed_role_interest").insert(
        emails.map((email) => ({ role_id: data.id, manager_email: email })),
      );
    }
  }
}

async function backfillEmptyRoleBriefs(admin: SupabaseClient) {
  const { data, error } = await admin.from("listed_roles").select("id, owner_email, brief");
  if (error || !data?.length) return;

  for (const row of data) {
    if (row.brief && Object.keys(row.brief as object).length > 0) continue;
    const ownerEmail = String(row.owner_email ?? "").toLowerCase();
    const seed = seedListedRoles.find((role) => {
      const owner = seedOwners.find((item) => item.id === role.ownerId);
      return owner?.email.toLowerCase() === ownerEmail;
    });
    if (!seed?.brief) continue;
    await admin.from("listed_roles").update({ brief: seed.brief }).eq("id", row.id);
  }
}
