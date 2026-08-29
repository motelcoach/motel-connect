export function isMissingTable(error: { message?: string; code?: string } | null | undefined) {
  if (!error) return false;
  return (
    error.message?.includes("schema cache") ||
    error.message?.includes("does not exist") ||
    error.code === "PGRST205" ||
    error.code === "42P01"
  );
}
