
"use client";

import { Bell, Search, UserCircle } from "lucide-react";

export default function ProfileHeader() {
  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6 lg:px-8">
      {/* Left */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white">
          M
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">
            Medical Counselling
          </h1>
          <p className="text-xs text-gray-500">Student Portal</p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3 sm:gap-5">
        <div className="hidden items-center rounded-lg border border-gray-200 px-3 py-2 md:flex">
          <Search size={17} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="ml-2 w-36 bg-transparent text-sm outline-none"
          />
        </div>

        <button
          type="button"
          aria-label="Notifications"
          className="relative rounded-full p-2 text-gray-600 hover:bg-gray-100"
        >
          <Bell size={21} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
        </button>

        <button
          type="button"
          aria-label="User profile"
          className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-gray-100"
        >
          <UserCircle size={30} className="text-blue-600" />
          <span className="hidden text-sm font-medium text-gray-700 sm:block">
            My Account
          </span>
        </button>
      </div>
    </header>
  );
}
