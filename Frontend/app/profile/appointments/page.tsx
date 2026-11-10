"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import api from "@/src/lib/axios";
import toast from "react-hot-toast";

interface Appointment {
  _id: string;
  scheduledStart: string;
  scheduledEnd: string;
  mode: string;
  status: string;
  counsellor?: {
    email?: string;
  };
  counsellingRequest?: {
    requestNumber?: string;
    academicYear?: string;
    admissionLevel?: string;
  };
}

/* ---------- helpers ---------- */

const statusStyles: Record<string, { badge: string; dot: string; bar: string }> = {
  scheduled: {
    badge: "bg-blue-50 text-blue-700 ring-blue-200",
    dot: "bg-blue-500",
    bar: "from-blue-500 to-indigo-500",
  },
  confirmed: {
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-500",
    bar: "from-emerald-500 to-teal-500",
  },
  completed: {
    badge: "bg-violet-50 text-violet-700 ring-violet-200",
    dot: "bg-violet-500",
    bar: "from-violet-500 to-fuchsia-500",
  },
  pending: {
    badge: "bg-amber-50 text-amber-700 ring-amber-200",
    dot: "bg-amber-500",
    bar: "from-amber-400 to-orange-500",
  },
  cancelled: {
    badge: "bg-rose-50 text-rose-700 ring-rose-200",
    dot: "bg-rose-500",
    bar: "from-rose-500 to-red-500",
  },
};

const fallbackStyle = {
  badge: "bg-gray-50 text-gray-700 ring-gray-200",
  dot: "bg-gray-400",
  bar: "from-gray-400 to-gray-500",
};

const getStyle = (status: string) =>
  statusStyles[status?.toLowerCase()] || fallbackStyle;

const formatDay = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit" });
const formatMonth = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { month: "short" });
const formatWeekday = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { weekday: "long" });
const formatTime = (d: string) =>
  new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

/* ---------- icons ---------- */

const Icon = ({ path, className = "h-4 w-4" }: { path: string; className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d={path} />
  </svg>
);

const icons = {
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  clock: "M12 6v6l4 2M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
  video: "M23 7l-7 5 7 5V7zM1 5h15v14H1z",
  cap: "M22 10L12 5 2 10l10 5 10-5zM6 12v5c3 2 9 2 12 0v-5",
  calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  layers: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  search: "M21 21l-4.3-4.3M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z",
  check: "M20 6L9 17l-5-5",
};

/* ---------- page ---------- */

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [currentTime, setCurrentTime] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const fetchAppointments = async () => {
    try {
      const response = await api.get("/appointment/getAll-Appointment");
      setAppointments(response.data.appointments || []);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to fetch appointments"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentTime(Date.now());
    fetchAppointments();
  }, []);

  /* derived data */
  const statuses = useMemo(() => {
    const set = new Set(appointments.map((a) => a.status?.toLowerCase()));
    return ["all", ...Array.from(set).filter(Boolean)];
  }, [appointments]);

  const filtered = useMemo(() => {
    return appointments.filter((a) => {
      const matchStatus = filter === "all" || a.status?.toLowerCase() === filter;
      const q = query.trim().toLowerCase();
      const matchQuery =
        !q ||
        a.counsellingRequest?.requestNumber?.toLowerCase().includes(q) ||
        a.counsellor?.email?.toLowerCase().includes(q) ||
        a.mode?.toLowerCase().includes(q);
      return matchStatus && matchQuery;
    });
  }, [appointments, filter, query]);

 const stats = useMemo(() => {
  return {
    total: appointments.length,
    upcoming: appointments.filter(
      (a) =>
        currentTime !== null &&
        new Date(a.scheduledStart).getTime() > currentTime &&
        a.status?.toLowerCase() !== "cancelled"
    ).length,
    completed: appointments.filter(
      (a) => a.status?.toLowerCase() === "completed"
    ).length,
  };
}, [appointments, currentTime]);

  /* GSAP: header + stats entrance (once data is loaded) */
  useEffect(() => {
    if (loading || !rootRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from(".hero-badge", { y: -20, opacity: 0, duration: 0.5 })
        .from(".hero-title", { y: 30, opacity: 0, duration: 0.7 }, "-=0.2")
        .from(".hero-sub", { y: 20, opacity: 0, duration: 0.6 }, "-=0.4")
        .from(
          ".stat-card",
          { y: 40, opacity: 0, scale: 0.95, duration: 0.6, stagger: 0.12 },
          "-=0.3"
        )
        .from(".toolbar", { y: 20, opacity: 0, duration: 0.5 }, "-=0.2");

      // count-up numbers
      gsap.utils.toArray<HTMLElement>(".count-up").forEach((el) => {
        const target = Number(el.dataset.value || 0);
        const obj = { val: 0 };
        gsap.to(obj, {
          val: target,
          duration: 1.4,
          ease: "power2.out",
          delay: 0.5,
          onUpdate: () => {
            el.textContent = String(Math.round(obj.val));
          },
        });
      });

      // floating blobs in the hero
      gsap.to(".blob-1", {
        y: 20,
        x: 15,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
      gsap.to(".blob-2", {
        y: -25,
        x: -10,
        duration: 5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }, rootRef);

    return () => ctx.revert();
  }, [loading]);

  /* GSAP: cards stagger (runs on load + whenever filter/search changes) */
  useEffect(() => {
    if (loading || !listRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from(".appt-card", {
        y: 50,
        opacity: 0,
        duration: 0.6,
        stagger: 0.09,
        ease: "power3.out",
        clearProps: "transform,opacity",
      });
    }, listRef);

    return () => ctx.revert();
  }, [loading, filtered]);

  /* GSAP: hover lift */
  const onEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    gsap.to(e.currentTarget, {
      y: -6,
      scale: 1.01,
      duration: 0.3,
      ease: "power2.out",
    });
  };
  const onLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    gsap.to(e.currentTarget, {
      y: 0,
      scale: 1,
      duration: 0.3,
      ease: "power2.out",
    });
  };

  /* ---------- loading skeleton ---------- */
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="h-48 animate-pulse rounded-3xl bg-gradient-to-r from-slate-200 to-slate-100" />
          <div className="grid gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200" />
            ))}
          </div>
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    { label: "Total Appointments", value: stats.total, icon: icons.layers, grad: "from-indigo-500 to-blue-500" },
    { label: "Upcoming", value: stats.upcoming, icon: icons.calendar, grad: "from-emerald-500 to-teal-500" },
    { label: "Completed", value: stats.completed, icon: icons.check, grad: "from-violet-500 to-fuchsia-500" },
  ];

  return (
    <div ref={rootRef} className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-5xl">
        {/* ---------- HERO ---------- */}
        
{/* ---------- HERO ---------- */}
<div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#071B3A] via-[#102F5E] to-[#174A7E] p-8 shadow-xl shadow-blue-950/20 sm:p-10">
  <div className="blob-1 pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-blue-300/10 blur-2xl" />
  <div className="blob-2 pointer-events-none absolute -bottom-20 left-10 h-56 w-56 rounded-full bg-cyan-300/10 blur-3xl" />

  <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
    <div>
      <span className="hero-badge inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-medium text-white backdrop-blur">
        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
        Counselling Dashboard
      </span>

      <h1 className="hero-title mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
        My Appointments
      </h1>

      <p className="hero-sub mt-2 max-w-xl text-sm text-blue-100 sm:text-base">
        Apne saare counselling sessions ek hi jagah dekhiye — date, time,
        counsellor aur mode ke saath.
      </p>
    </div>

    <a
      href="/profile"
      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white shadow-lg backdrop-blur transition hover:bg-white/20"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
      Back to Dashboard
    </a>
  </div>
</div>

        {/* ---------- STATS ---------- */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {statCards.map((s) => (
            <div
              key={s.label}
              className="stat-card flex items-center gap-4 rounded-2xl border border-white bg-white/80 p-5 shadow-sm backdrop-blur"
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${s.grad} text-white shadow-lg`}
              >
                <Icon path={s.icon} className="h-6 w-6" />
              </div>
              <div>
                <p
                  className="count-up text-2xl font-bold text-slate-800"
                  data-value={s.value}
                >
                  0
                </p>
                <p className="text-xs font-medium text-slate-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ---------- TOOLBAR ---------- */}
        {appointments.length > 0 && (
          <div className="toolbar mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="relative sm:w-72">
              <Icon
                path={icons.search}
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search request, counsellor, mode..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {statuses.map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition ${
                    filter === s
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ---------- LIST ---------- */}
        <div ref={listRef} className="mt-6">
          {appointments.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
                <Icon path={icons.calendar} className="h-8 w-8" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-slate-700">
                No Appointments Yet
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Your scheduled appointments will appear here.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <h2 className="text-lg font-semibold text-slate-700">
                Koi result nahi mila
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Search ya filter change karke dekhiye.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((appointment) => {
                const st = getStyle(appointment.status);
                return (
                  <div
                    key={appointment._id}
                    onMouseEnter={onEnter}
                    onMouseLeave={onLeave}
                    className="appt-card group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-xl hover:shadow-indigo-100"
                  >
                    {/* left accent bar */}
                    <div
                      className={`absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b ${st.bar}`}
                    />

                    <div className="flex flex-col gap-5 p-5 pl-7 sm:flex-row sm:items-stretch">
                      {/* date block */}
                      <div className="flex shrink-0 items-center gap-4 sm:w-44 sm:flex-col sm:items-start sm:justify-center">
                        <div className="flex h-20 w-20 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 ring-1 ring-slate-200">
                          <span className="text-2xl font-bold leading-none text-slate-800">
                            {formatDay(appointment.scheduledStart)}
                          </span>
                          <span className="mt-1 text-xs font-semibold uppercase tracking-wider text-indigo-600">
                            {formatMonth(appointment.scheduledStart)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-700">
                            {formatWeekday(appointment.scheduledStart)}
                          </p>
                          <p className="flex items-center gap-1 text-xs text-slate-500">
                            <Icon path={icons.clock} className="h-3.5 w-3.5" />
                            {formatTime(appointment.scheduledStart)}
                            {appointment.scheduledEnd &&
                              ` - ${formatTime(appointment.scheduledEnd)}`}
                          </p>
                        </div>
                      </div>

                      {/* divider */}
                      <div className="hidden w-px bg-slate-100 sm:block" />

                      {/* details */}
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h2 className="text-lg font-semibold text-slate-800">
                            {appointment.counsellingRequest?.requestNumber ||
                              "Appointment"}
                          </h2>

                          <span
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ${st.badge}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                            {appointment.status}
                          </span>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <Detail
                            icon={icons.user}
                            label="Counsellor"
                            value={appointment.counsellor?.email || "Not available"}
                          />
                          <Detail
                            icon={icons.video}
                            label="Mode"
                            value={appointment.mode}
                            capitalize
                          />
                          <Detail
                            icon={icons.calendar}
                            label="Academic Year"
                            value={
                              appointment.counsellingRequest?.academicYear || "N/A"
                            }
                          />
                          <Detail
                            icon={icons.cap}
                            label="Admission Level"
                            value={
                              appointment.counsellingRequest?.admissionLevel ||
                              "N/A"
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- small detail row ---------- */

function Detail({
  icon,
  label,
  value,
  capitalize,
}: {
  icon: string;
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 transition group-hover:bg-indigo-50/50">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200">
        <Icon path={icon} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <p
          className={`truncate text-sm font-medium text-slate-700 ${
            capitalize ? "capitalize" : ""
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
