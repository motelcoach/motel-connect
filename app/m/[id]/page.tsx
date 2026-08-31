import { ManagerPublicProfile } from "@/components/public/ManagerPublicProfile";

export default async function PublicManagerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ManagerPublicProfile id={id} />;
}
