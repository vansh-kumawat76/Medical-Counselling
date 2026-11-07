
import React, { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

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
  Landmark,
  ChevronDown,
  Headset,
  FileText,
  ClipboardList,
  CalendarCheck,
  Video,
  NotebookPen,
  Focus,
} from "lucide-react";

const Sidebar = () => {
  const location = useLocation();

  // Counselling dropdown state
  const [counsellingOpen, setCounsellingOpen] = useState(
    location.pathname.startsWith("/counselling")
  );

  // Active counselling route par dropdown automatically open rahega
  useEffect(() => {
    if (location.pathname.startsWith("/counselling")) {
      setCounsellingOpen(true);
    }
  }, [location.pathname]);

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

  const userRole =
    typeof user.role === "string"
      ? user.role
      : user.role?.role || "User";

  // SuperAdmin ka role check
  const isSuperAdmin =
    user.role === "SuperAdmin" ||
    user.role?.role === "SuperAdmin";

  const hasPermission = (permission) =>
    isSuperAdmin || permissions.includes(permission);

  // Counselling submenu
  const counsellingItems = [
    {
      to: "/counselling/requests",
      label: "Counselling Requests",
      icon: FileText,
      permission: "counsellingRequest.view",
    },
    {
      to: "/counselling/assignments",
      label: "Assignments",
      icon: ClipboardList,
      permission: "counsellingAssignment.view",
    },
    {
      to: "/counselling/appointments",
      label: "Appointments",
      icon: CalendarCheck,
      permission: "appointment.view",
    },
    {
      to: "/counselling/sessions",
      label: "Sessions",
      icon: Video,
      permission: "counsellingSession.view",
    },
    {
      to: "/counselling/notes",
      label: "Counselling Notes",
      icon: NotebookPen,
      permission: "counsellingNotes.view",
    },
     {
      to: "/counselling/followup",
      label: "FollowUps",
      icon: Focus,
      permission: "counsellingNotes.view",
    },
  ];

  // Kya user ko counselling menu ka koi access hai?
  const showCounsellingMenu = counsellingItems.some((item) =>
    hasPermission(item.permission)
  );

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
      icon: GraduationCap,
      permission: "student.view",
    },
    {
      to: "/users",
      label: "Users",
      icon: Users,
      permission: "user.view",
    },
    {
      type: "counselling",
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
      icon: Landmark,
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
      to: "/Email",
      label: "Email Templates",
      icon: Mail,
    },
    {
      to: "/Contact",
      label: "Contact",
      icon: Contact,
    },
    {
      to: "/settings",
      label: "Settings",
      icon: Settings,
      permission: "settings.view",
    },
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

        <div className="mt-3 flex items-center gap-2">
          <ShieldCheck size={15} className="text-blue-400" />

          <span className="text-sm font-medium text-blue-300">
            {userRole}
          </span>
        </div>
      </div>

      {/* Permission-based Navigation */}
      <nav className="min-h-0 flex-1 overflow-y-auto space-y-2 p-4">

        {navItems.map((item) => {

          // Counselling dropdown
          if (item.type === "counselling") {
            if (!showCounsellingMenu) return null;

            return (
              <div key="counselling">

                <button
                  type="button"
                  onClick={() =>
                    setCounsellingOpen((prev) => !prev)
                  }
                  className={`flex items-center justify-between w-full px-4 py-3 rounded-lg transition-all duration-200 ${
                    location.pathname.startsWith("/counselling")
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Headset size={20} />
                    Counselling
                  </span>

                  <ChevronDown
                    size={18}
                    className={`transition-transform duration-200 ${
                      counsellingOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {counsellingOpen && (
                  <div className="mt-2 ml-4 pl-3 border-l border-slate-700 space-y-1">

                    {counsellingItems
                      .filter((subItem) =>
                        hasPermission(subItem.permission)
                      )
                      .map((subItem) => {
                        const Icon = subItem.icon;

                        return (
                          <NavLink
                            key={subItem.to}
                            to={subItem.to}
                            className={({ isActive }) =>
                              `flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                                isActive
                                  ? "bg-blue-600 text-white"
                                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
                              }`
                            }
                          >
                            <Icon size={17} />
                            {subItem.label}
                          </NavLink>
                        );
                      })}

                  </div>
                )}

              </div>
            );
          }

          // Normal navigation items
          if (
            item.permission &&
            !hasPermission(item.permission)
          ) {
            return null;
          }

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
