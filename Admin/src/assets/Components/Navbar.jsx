import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

/* ───────── small inline icons (no extra package needed) ───────── */
const Icon = ({ children, className = "h-4 w-4" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {children}
  </svg>
);

const UserIcon = () => (
  <Icon>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </Icon>
);

const SettingsIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </Icon>
);

const LogoutIcon = () => (
  <Icon>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </Icon>
);

const ChevronIcon = ({ className }) => (
  <Icon className={className}>
    <polyline points="6 9 12 15 18 9" />
  </Icon>
);

const CalendarIcon = () => (
  <Icon className="h-3.5 w-3.5">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </Icon>
);

/* ───────── helpers ───────── */
const ADMIN_NAME = "Admin";

const getGreeting = (date) => {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const Navbar = ({ title = "Dashboard" }) => {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // bahar click karne par dropdown band + Esc se band
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleEsc = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  // live clock (har 30 sec mein update)
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      await fetch("http://localhost:8090/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("token");
      setOpen(false);
      setLoggingOut(false);
      navigate("/login", { replace: true });
    }
  };

  const goTo = (path) => {
    navigate(path);
    setOpen(false);
  };

  const dateText = now.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const timeText = now.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="relative flex h-20 items-center justify-between gap-4 border-b border-white/10 bg-[#060a14]/80 px-4 shadow-[0_14px_44px_-26px_rgba(34,211,238,0.5)] backdrop-blur-xl sm:px-8">
        {/* top glow line */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent" />

        {/* ambient glows */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-16 -top-20 h-44 w-44 rounded-full bg-violet-500/15 blur-3xl" />
          <div className="absolute -right-10 -top-20 h-44 w-60 rounded-full bg-cyan-400/15 blur-3xl" />
        </div>

        {/* bottom glow line */}
        <div className="pointer-events-none absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-violet-400/50 to-transparent" />

        {/* ───── Left: title + greeting ───── */}
        <div className="relative min-w-0">
          <h1 className="truncate bg-gradient-to-r from-white via-cyan-200 to-violet-300 bg-clip-text text-xl font-bold tracking-tight text-transparent sm:text-2xl">
            {title}
          </h1>

          <p className="mt-0.5 flex items-center gap-2 truncate text-xs text-slate-400 sm:text-sm">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="truncate">
              {getGreeting(now)},{" "}
              <span className="font-semibold text-slate-200">
                {ADMIN_NAME}
              </span>{" "}
              <span aria-hidden="true">👋</span>
            </span>
          </p>
        </div>

        {/* ───── Right: date chip + avatar ───── */}
        <div className="relative flex shrink-0 items-center gap-3 sm:gap-4">
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-slate-300 backdrop-blur md:flex">
            <span className="text-cyan-300">
              <CalendarIcon />
            </span>
            <span>{dateText}</span>
            <span className="h-3 w-px bg-white/15" />
            <span className="tabular-nums text-slate-400">{timeText}</span>
          </div>

          {/* ===== Avatar + Dropdown ===== */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              aria-label="Account menu"
              aria-haspopup="menu"
              aria-expanded={open}
              className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] py-1 pl-1 pr-2.5 transition hover:border-cyan-400/50 hover:bg-white/[0.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
            >
              <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 p-[2px] shadow-[0_0_18px_-2px_rgba(34,211,238,0.6)]">
                <span className="flex h-full w-full items-center justify-center rounded-full bg-[#0a0f1e] text-sm font-bold text-cyan-300">
                  {ADMIN_NAME.charAt(0)}
                </span>
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#060a14] bg-emerald-400" />
              </span>

              <ChevronIcon
                className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${
                  open ? "rotate-180 text-cyan-300" : ""
                }`}
              />
            </button>

            {/* Dropdown (always mounted so it can animate in and out) */}
            <div
              role="menu"
              aria-hidden={!open}
              className={`absolute right-0 top-14 z-50 w-64 origin-top-right rounded-2xl bg-gradient-to-br from-cyan-400/50 via-white/10 to-violet-400/50 p-px shadow-[0_20px_60px_-20px_rgba(34,211,238,0.45)] transition-all duration-200 ${
                open
                  ? "visible translate-y-0 scale-100 opacity-100"
                  : "invisible -translate-y-2 scale-95 opacity-0"
              }`}
            >
              <div className="rounded-[calc(1rem-1px)] bg-[#080c1a]/95 p-2 backdrop-blur-xl">
                {/* account header */}
                <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] px-3 py-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 text-sm font-bold text-[#04121c]">
                    {ADMIN_NAME.charAt(0)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {ADMIN_NAME}
                    </p>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300/80">
                      Administrator
                    </p>
                  </div>
                </div>

                <div className="my-2 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

                <div className="my-2 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

                <button
                  type="button"
                  role="menuitem"
                  tabIndex={open ? 0 : -1}
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-rose-400 transition hover:bg-rose-400/10 focus:outline-none focus-visible:bg-rose-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <LogoutIcon />
                  {loggingOut ? "Logging out..." : "Logout"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
