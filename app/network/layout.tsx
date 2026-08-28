import { AppShell } from "@/components/network/AppShell";
import type { ReactNode } from "react";

export default function NetworkLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
