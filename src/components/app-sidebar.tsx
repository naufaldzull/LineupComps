"use client";

import Link from "next/link";
import {
  BarChart3,
  Bell,
  Brain,
  CalendarDays,
  Home,
  Menu,
  Moon,
  Trophy,
} from "lucide-react";

export type SidebarSection = "home" | "schedule";

type AppSidebarProps = {
  active: SidebarSection;
};

// Analytics, Reports and Alerts have no destination yet, so they render as inert
// buttons rather than links that would go nowhere.
const navItems: Array<{
  label: string;
  icon: typeof Home;
  section?: SidebarSection;
  href?: string;
}> = [
  { label: "Home", icon: Home, section: "home", href: "/" },
  { label: "Fixtures", icon: CalendarDays, section: "schedule", href: "/schedule" },
  { label: "Analytics", icon: BarChart3 },
  { label: "Reports", icon: Brain },
  { label: "Alerts", icon: Bell },
];

function itemClass(isActive: boolean): string {
  return `grid h-12 w-12 cursor-pointer place-items-center rounded-2xl transition ${
    isActive
      ? "bg-white text-[#1f7a4f] shadow-sm"
      : "text-[#7d8580] hover:bg-white/70 hover:text-[#101513]"
  }`;
}

export function AppSidebar({ active }: AppSidebarProps) {
  return (
    <aside className="hidden border-r border-[#dfe4df] bg-[#ebecea] px-4 py-6 lg:flex lg:flex-col lg:items-center lg:justify-between">
      <div className="grid gap-6">
        <Link
          href="/"
          title="LineupComps"
          className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-[#1f7a4f] shadow-sm"
        >
          <Trophy aria-hidden className="h-6 w-6" />
          <span className="sr-only">LineupComps home</span>
        </Link>
        <nav className="grid gap-3">
          {navItems.map(({ label, icon: Icon, section, href }) => {
            const isActive = section === active;

            if (!href) {
              return (
                <button
                  key={label}
                  type="button"
                  title={label}
                  className={itemClass(false)}
                >
                  <Icon aria-hidden className="h-6 w-6" />
                  <span className="sr-only">{label}</span>
                </button>
              );
            }

            return (
              <Link
                key={label}
                href={href}
                title={label}
                aria-current={isActive ? "page" : undefined}
                className={itemClass(isActive)}
              >
                <Icon aria-hidden className="h-6 w-6" />
                <span className="sr-only">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="grid gap-3">
        <button
          type="button"
          title="Theme"
          className="grid h-12 w-12 cursor-pointer place-items-center rounded-2xl text-[#7d8580] transition hover:bg-white/70 hover:text-[#101513]"
        >
          <Moon aria-hidden className="h-6 w-6" />
          <span className="sr-only">Theme</span>
        </button>
        <button
          type="button"
          title="Menu"
          className="grid h-12 w-12 cursor-pointer place-items-center rounded-2xl text-[#7d8580] transition hover:bg-white/70 hover:text-[#101513]"
        >
          <Menu aria-hidden className="h-6 w-6" />
          <span className="sr-only">Menu</span>
        </button>
      </div>
    </aside>
  );
}
