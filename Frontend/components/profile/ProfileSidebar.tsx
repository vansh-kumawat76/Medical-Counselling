
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  UserRound,
  ClipboardList,
  FileText,
  Settings,
  LogOut,
} from "lucide-react";

const menuItems = [
  { label: "My Profile", href: "/profile", icon: UserRound },
  {
    label: "Counselling Request",
    href: "/profile/counselling",
    icon: ClipboardList,
  },
  {
    label: "My Requests",
    href: "/profile/requests",
    icon: FileText,
  },
  { label: "Settings", href: "/profile/settings", icon: Settings },
];

export default function ProfileSidebar() {
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Student Menu
        </p>

        <h2 className="mt-1 text-lg font-bold text-gray-900">
          My Workspace
        </h2>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/profile" &&
              pathname.startsWith(item.href));

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon size={19} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-100 p-3">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
        >
          <LogOut size={19} />
          Logout
        </button>
      </div>
    </aside>
  );
}
