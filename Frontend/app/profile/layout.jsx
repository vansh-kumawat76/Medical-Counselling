
"use client";
import ProfileHeader from "../../components/profile/ProfileHeader";
import ProfileSidebar from "../../components/profile/ProfileSidebar";

export default function ProfileLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950">

      {/* Navbar */}
      <ProfileHeader />

      {/* Sidebar and Page Content */}
      <div className="flex flex-1 min-h-0">

        <ProfileSidebar />

        <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-slate-950 p-4 sm:p-6">
          {children}
        </main>

      </div>
    </div>
  );
}
