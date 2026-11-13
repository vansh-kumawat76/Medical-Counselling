
"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Plus } from "lucide-react";

export default function ProfileHeader() {
  const [userName, setUserName] = useState("My Account");

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        const user = parsedUser.user || parsedUser;

        const name =
          user.name ||
          user.fullName ||
          user.studentName ||
          [user.firstName, user.lastName].filter(Boolean).join(" ") ||
          user.email;

        if (name) {
          setUserName(name);
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    }
  }, []);

  const initials =
    userName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U";

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 sm:pr-6 dark:border-white/10 dark:bg-slate-900">

      {/* Left */}
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 text-white shadow-lg shadow-indigo-900/50">
          <Plus size={20} />
        </div>

        <div>
          <h1 className="text-base font-bold leading-tight text-slate-900 sm:text-lg dark:text-white">
            Medical Counselling
          </h1>

          <p className="text-xs text-indigo-600 dark:text-indigo-200/70">
            Student Portal
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3 sm:gap-5">
        <button
          type="button"
          aria-label="User profile"
          className="flex items-center gap-2.5 rounded-xl bg-slate-100 py-1.5 pl-1.5 pr-2.5 ring-1 ring-slate-200 transition hover:bg-slate-200 hover:ring-slate-300 dark:bg-white/5 dark:ring-white/10 dark:hover:bg-white/10 dark:hover:ring-white/20"
        >
          <span className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-lg bg-indigo-500 text-xs font-bold text-white shadow-md shadow-indigo-900/60">
            {initials}
          </span>

          <span className="hidden max-w-48 cursor-pointer truncate text-sm font-medium text-slate-700 sm:block dark:text-slate-200">
            {userName}
          </span>

          <ChevronDown
            size={16}
            className="hidden text-slate-500 sm:block dark:text-slate-400"
          />
        </button>
      </div>
    </header>
  );
}
