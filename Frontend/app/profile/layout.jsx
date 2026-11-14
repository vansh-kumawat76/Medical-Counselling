
"use client";

import ProfileHeader from "../../components/profile/ProfileHeader";
import ProfileSidebar from "../../components/profile/ProfileSidebar";

export default function ProfileLayout({ children }) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">

      {/* Navbar */}
      <div className="shrink-0">
        <ProfileHeader />
      </div>

      {/* Sidebar and Page Content */}
      <div className="flex min-h-0 flex-1 overflow-hidden">

        <ProfileSidebar />

        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 dark:bg-slate-950">
          {children}
        </main>

      </div>
    </div>
  );
}
