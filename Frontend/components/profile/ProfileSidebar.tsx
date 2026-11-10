
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  UserRound,
  ClipboardList,
  FileText,
  Settings,
  LogOut,
  CalendarDays,
  NotebookTabsIcon,
  Focus,
  HeartHandshake,
  CalendarPlus,
} from "lucide-react";
import { VscSessionInProgress } from "react-icons/vsc";
import { FaStar } from "react-icons/fa6";

const menuItems = [
  { label: "My Profile", href: "/profile", icon: UserRound },
  { label: "Counselling Request", href: "/profile/counselling", icon: ClipboardList },
  { label: "My Requests", href: "/profile/requests", icon: FileText },
  { label: "My Appointments", href: "/profile/appointments", icon: CalendarDays },
  { label: "My Counselling Notes", href: "/profile/notes", icon: NotebookTabsIcon },
  { label: "Counselling Sessions", href: "/profile/sessions", icon: VscSessionInProgress },
  { label: "Follow Ups", href: "/profile/follow-ups", icon: Focus },
  { label: "Feedback & Ratings", href: "/profile/feedback", icon: FaStar },
  { label: "Settings", href: "/profile/settings", icon: Settings },
];

type ProfileSidebarProps = {
  badges?: Record<string, number>;
};

export default function ProfileSidebar({ badges = {} }: ProfileSidebarProps) {
  const pathname = usePathname();
  const [name, setName] = useState("Student");

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("user") || "null");

      const fullName =
        stored?.name ||
        stored?.fullName ||
        [stored?.firstName, stored?.lastName].filter(Boolean).join(" ");

      if (fullName) setName(fullName);
    } catch {
      // Ignore malformed localStorage value
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  const LogoutButton = ({ mobile = false }: { mobile?: boolean }) => (
    <button
      type="button"
      onClick={handleLogout}
      className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/15 hover:text-rose-200 ${
        mobile ? "border border-rose-400/20" : ""
      }`}
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-rose-500/10">
        <LogOut size={17} />
      </span>
      <span>Logout</span>
    </button>
  );

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-slate-300">

      {/* Brand */}
      <div className="flex shrink-0 items-center gap-3 px-5 pb-4 pt-5">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-indigo-400 to-violet-500 text-white">
          <HeartHandshake size={20} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-white">Student Space</p>
          <p className="truncate text-xs text-slate-400">{name}</p>
        </div>
      </div>

      {/* Menu */}
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-3">
        {menuItems.map((item) => {
          const Icon = item.icon;

          const isActive =
            pathname === item.href ||
            (item.href !== "/profile" && pathname.startsWith(item.href));

          const badge = badges[item.href];

          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-white/10 text-white ring-1 ring-white/10"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
              }`}
            >
              <span
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                  isActive
                    ? "bg-indigo-500 text-white"
                    : "bg-white/5 text-slate-400"
                }`}
              >
                <Icon size={17} />
              </span>

              <span className="flex-1 truncate">{item.label}</span>

              {badge ? (
                <span className="rounded-full bg-indigo-400/20 px-2 py-0.5 text-[11px] font-semibold text-indigo-200">
                  {badge}
                </span>
              ) : null}
            </Link>
          );
        })}

        {/* Logout inside menu */}
        <div className="pt-1">
          <LogoutButton />
        </div>
      </nav>

      {/* Sidebar Bottom */}
      <div className="shrink-0 space-y-2 border-t border-white/10 bg-slate-950/30 p-3">
        <Link
          href="/profile/counselling"
          className="block rounded-xl bg-gradient-to-br from-indigo-500/30 to-violet-500/20 p-3 ring-1 ring-white/10 transition hover:ring-white/25"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-200">
            Need support?
          </p>
          <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-white">
            <CalendarPlus size={16} />
            Request a session
          </p>
          <p className="mt-0.5 text-xs text-slate-300">
            Talk to a counsellor
          </p>
        </Link>

        {/* Logout at sidebar bottom */}
        <LogoutButton mobile />
      </div>
    </aside>
  );
}
