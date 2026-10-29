
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
  Mail,
  Contact,
  LogOut,
} from "lucide-react";

const Sidebar = () => {
  const navClass = ({ isActive }) =>
    `flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-all duration-200 ${
      isActive
        ? "bg-blue-600 text-white"
        : "text-slate-300 hover:bg-slate-800 hover:text-white"
    }`;

  // Login ke baad saved user aur permissions read karo
  const getUserData = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      const savedPermissions = JSON.parse(
        localStorage.getItem("permissions") || "null"
      );

      const permissions =
        savedPermissions ??
        user.permissions ??
        user.role?.permissions ??
        [];

      return {
        user,
        permissions: permissions.map((permission) =>
          typeof permission === "string"
            ? permission
            : permission.name
        ),
      };
    } catch (error) {
      console.error("User/permission read error:", error);

      return {
        user: {},
        permissions: [],
      };
    }
  };

  const { user, permissions } = getUserData();

  // SuperAdmin ka role check
  const isSuperAdmin =
    user.role === "SuperAdmin" ||
    user.role?.role === "SuperAdmin";

  const hasPermission = (permission) =>
    isSuperAdmin || permissions.includes(permission);

  const navItems = [
    {
      to: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      permission: "dashboard.view",
    },
    {
      to: "/students",
      label: "Students",
      icon: Users,
      permission: "student.view",
    },
    {
      to: "/colleges",
      label: "Colleges",
      icon: School,
      permission: "college.view",
    },
    {
      to: "/university",
      label: "University",
      icon: GraduationCap,
      permission: "university.view",
    },
    {
      to: "/role",
      label: "Roles & Permissions",
      icon: ShieldCheck,
      permission: "role.view",
    },
    {
      to: "/stream",
      label: "Stream",
      icon: Waves,
      permission: "stream.view",
    },
    {
      to: "/degree",
      label: "Degree",
      icon: ScrollText,
      permission: "degree.view",
    },
    {
      to: "/course",
      label: "Course",
      icon: BookOpen,
      permission: "course.view",
    },
    {
      to: "/specializations",
      label: "Specialization",
      icon: Puzzle,
      permission: "specialization.view",
    },
    {
      to: "/settings",
      label: "Settings",
      icon: Settings,
      permission: "settings.view",
    },
    {
      to : "/Email",
      label : "Email",
      icon : Mail
    },
    {
      to : "/Contact",
      label : "Contact",
      icon : Contact
    }
  ];

  return (
    <aside className="fixed left-0 top-0 flex h-screen w-64 flex-col overflow-hidden bg-slate-900 text-white">
      {/* Logo */}
      <div className="border-b border-slate-700 px-6 py-6">
        <h1 className="text-2xl font-bold">
          Medi<span className="text-blue-400">Counsel</span>
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          ADMIN PANEL
        </p>
      </div>

      {/* Permission-based Navigation */}
      <nav className="min-h-0 flex-1 overflow-y-auto space-y-2 p-4">
        {navItems
          .filter((item) => hasPermission(item.permission))
          .map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/dashboard"}
                className={navClass}
              >
                <Icon size={20} />
                {item.label}
              </NavLink>
            );
          })}
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
