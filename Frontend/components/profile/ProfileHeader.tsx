"use client";

import { useEffect, useState } from "react";
import { ChevronDown, HeartHandshake, Plus } from "lucide-react";

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
    <header className="sticky top-0 z-40 flex h-16 w-full shrink-0 items-center justify-between border-b border-white/10 bg-slate-900 px-5 sm:pr-6">
      {/* Left */}
      <div className="flex items-center gap-3">
        <div className="grid h-10 cursor-pointer w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 text-white shadow-lg shadow-indigo-900/50">
          <Plus size={20} />
        </div>

        <div>
          <h1 className="text-base font-bold leading-tight text-white sm:text-lg">
            Medical Counselling
          </h1>

          <p className="text-xs text-indigo-200/70">Student Portal</p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3 sm:gap-5">
        <button
          type="button"
          aria-label="User profile"
          className="flex items-center gap-2.5 rounded-xl bg-white/5 py-1.5 pl-1.5 pr-2.5 ring-1 ring-white/10 transition hover:bg-white/10 hover:ring-white/20"
        >
          <span className="grid h-8 w-8 cursor-pointer shrink-0 place-items-center rounded-lg bg-indigo-500 text-xs font-bold text-white shadow-md shadow-indigo-900/60">
            {initials}
          </span>

          <span className="hidden max-w-48 cursor-pointer truncate text-sm font-medium text-slate-200 sm:block">
            {userName}
          </span>

          <ChevronDown size={16} className="hidden text-slate-400 sm:block" />
        </button>
      </div>
    </header>
  );
}
