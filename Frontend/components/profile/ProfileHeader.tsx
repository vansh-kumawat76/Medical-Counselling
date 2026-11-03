"use client";

import { useEffect, useState } from "react";
import { UserCircle } from "lucide-react";

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
          [user.firstName, user.lastName].filter(Boolean).join(" ");
          user.email;

        if (name) {
          setUserName(name);
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    }
  }, []);

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

          <p className="text-xs text-gray-500">
            Student Portal
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3 sm:gap-5">
        <button
          type="button"
          aria-label="User profile"
          className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-gray-100"
        >
          <UserCircle size={30} className="text-blue-600" />

          <span className="hidden max-w-48 truncate text-sm font-medium text-gray-700 sm:block">
            {userName}
          </span>
        </button>
      </div>
    </header>
  );
}