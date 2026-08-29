"use client";

import { isManagerRole, navItems } from "@/lib/permissions";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { ChevronDown, LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, hydrated, personas, enterAs, signOut, currentManager, currentOwner } =
    useStore();
  const [switchOpen, setSwitchOpen] = useState(false);

  useEffect(() => {
    if (hydrated && !session) router.replace("/");
  }, [hydrated, session, router]);

  if (!hydrated || !session) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#f4f7fa] text-slate-500">
        Opening the network…
      </div>
    );
  }

  const items = navItems(session.role);
  const persona = personas.find((item) => item.id === session.personaId);
  const unverified =
    session.role === "unverified_manager" ||
    (isManagerRole(session.role) && currentManager && !currentManager.isVerified);

  return (
    <div className="min-h-svh bg-[#f4f7fa]">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-serif text-xl text-slate-900">
              Motel Connect
            </Link>
            <nav className="hidden items-center gap-1 lg:flex">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                    pathname === item.href
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="relative">
            <button
              onClick={() => setSwitchOpen((open) => !open)}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pr-3 pl-1 text-left"
            >
              <Image
                src={persona?.photoUrl ?? ""}
                alt=""
                width={32}
                height={32}
                className="h-8 w-8 rounded-full object-cover"
              />
              <span className="hidden sm:block">
                <span className="block text-xs font-semibold text-slate-900">
                  {persona?.name}
                </span>
                <span className="block text-[11px] text-slate-500">{persona?.label}</span>
              </span>
              <ChevronDown className="h-4 w-4 text-slate-500" />
            </button>
            {switchOpen ? (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                {personas.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      enterAs(item.id);
                      setSwitchOpen(false);
                      router.push("/network/managers");
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-sm hover:bg-slate-50"
                  >
                    <Image
                      src={item.photoUrl}
                      alt=""
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                    <span>
                      <span className="block font-medium text-slate-900">{item.label}</span>
                      <span className="block text-xs text-slate-500">{item.name}</span>
                    </span>
                  </button>
                ))}
                <button
                  onClick={() => {
                    signOut();
                    router.push("/");
                  }}
                  className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  <LogOut className="h-4 w-4" />
                  Leave network
                </button>
              </div>
            ) : null}
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-slate-100 px-3 py-2 lg:hidden">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium",
                pathname === item.href
                  ? "bg-slate-900 text-white"
                  : "text-slate-600",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      {unverified ? (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900">
          Your profile is on the open roster. Messaging, proposals and reviews
          unlock when you reach Premium — two vetted owner references.
        </div>
      ) : null}

      {session.role === "owner" && currentOwner ? (
        <div className="border-b border-slate-200 bg-white/70 px-4 py-2 text-center text-xs text-slate-500">
          Signed in as {currentOwner.name} · {currentOwner.motelName} · {currentOwner.rooms}{" "}
          rooms · {currentOwner.pms}
        </div>
      ) : null}

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">{children}</main>
    </div>
  );
}
