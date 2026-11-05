"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inbox, PlusCircle, Settings, LogOut, Globe, Menu, X } from "lucide-react";
import { useState } from "react";
import { logout } from "@/app/actions/auth";
import type { SessionUser } from "@/lib/auth";
import { FIRM } from "@/lib/firm";

const NAV = [
  { href: "/", label: "Requests", icon: Inbox, match: (p: string) => p === "/" || p.startsWith("/requests/") },
  { href: "/requests/new", label: "New request", icon: PlusCircle, match: (p: string) => p === "/requests/new" },
  { href: "/settings", label: "Settings", icon: Settings, match: (p: string) => p.startsWith("/settings") },
];

export function Sidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-1 flex-col gap-1">
      {NAV.map((item) => {
        const active = item.match(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`nav-link ${active ? "nav-link-active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
      <a href="/intake" target="_blank" rel="noreferrer" className="nav-link mt-2">
        <Globe className="size-4" />
        Client inquiry form
      </a>
    </nav>
  );

  const footer = (
    <div className="border-t border-ink-800 pt-4">
      <div className="truncate text-sm font-medium text-white">{user.name}</div>
      <div className="truncate text-xs text-ink-400">{user.title ?? user.email}</div>
      <form action={logout} className="mt-3">
        <button type="submit" className="nav-link w-full px-2 py-1.5 text-xs">
          <LogOut className="size-3.5" />
          Sign out
        </button>
      </form>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between bg-ink-950 px-4 lg:hidden">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/brand/logo-white.png" alt={FIRM.shortName} width={96} height={36} />
        </Link>
        <button type="button" onClick={() => setOpen((v) => !v)} className="text-white" aria-label="Toggle menu">
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>
      {open ? (
        <div className="fixed inset-0 z-20 bg-ink-950 px-4 pb-6 pt-20 lg:hidden">
          {nav}
          <div className="mt-6">{footer}</div>
        </div>
      ) : null}
      <div className="h-14 lg:hidden" aria-hidden />

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-ink-950 px-4 py-6 lg:flex">
        <Link href="/" className="mb-8 block px-2">
          <Image src="/brand/logo-white.png" alt={FIRM.name} width={150} height={56} priority />
          <span className="mt-2 block text-[11px] font-semibold uppercase tracking-widest text-ink-500">
            {FIRM.portalName} · staff
          </span>
        </Link>
        {nav}
        {footer}
      </aside>
    </>
  );
}
