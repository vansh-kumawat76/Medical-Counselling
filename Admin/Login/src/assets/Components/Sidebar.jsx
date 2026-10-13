import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  School,
  GraduationCap,
  ShieldCheck,
  Waves,
  ScrollText,
  BookOpen,
  Puzzle,
  Settings,
  LogOut,
} from "lucide-react";

const Sidebar = () => {
  const navClass = ({ isActive }) =>
    `flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-all duration-200 ${
      isActive
        ? "bg-blue-600 text-white"
        : "text-slate-300 hover:bg-slate-800 hover:text-white"
    }`;

  return (
    <aside className="fixed left-0 top-0 flex h-screen w-64 flex-col overflow-y-auto bg-slate-900 text-white">

      {/* Logo */}
      <div className="border-b border-slate-700 px-6 py-6">
        <h1 className="text-2xl font-bold">
          Student<span className="text-blue-400">Hub</span>
        </h1>
        <p className="mt-1 text-xs text-slate-400">ADMIN PANEL</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 p-4">
        <NavLink to="/dashboard" end className={navClass}>
          <LayoutDashboard size={20} />
          Dashboard
        </NavLink>

        <NavLink to="/students" className={navClass}>
          <Users size={20} />
          Students
        </NavLink>

        <NavLink to="/colleges" className={navClass}>
          <School size={20} />
          Colleges
        </NavLink>

        <NavLink to="/university" className={navClass}>
          <GraduationCap size={20} />
          University
        </NavLink>

        <NavLink to="/role" className={navClass}>
          <ShieldCheck size={20} />
          Roles & Permissions
        </NavLink>

        <NavLink to="/stream" className={navClass}>
          <Waves size={20} />
          Stream
        </NavLink>

        <NavLink to="/degree" className={navClass}>
          <ScrollText size={20} />
          Degree
        </NavLink>

        <NavLink to="/course" className={navClass}>
          <BookOpen size={20} />
          Course
        </NavLink>

        <NavLink to="/specializations" className={navClass}>
          <Puzzle size={20} />
          Specialization
        </NavLink>

        <NavLink to="/settings" className={navClass}>
          <Settings size={20} />
          Settings
        </NavLink>
      </nav>

      {/* Logout */}
      <div className="border-t border-slate-700 p-4">
        <NavLink
          to="/login"
          className="flex items-center gap-3 rounded-lg px-4 py-3 text-red-400 transition hover:bg-slate-800"
        >
          <LogOut size={20} />
          Logout
        </NavLink>
      </div>

    </aside>
  );
};

export default Sidebar;