
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import api from "@/src/lib/axios";
import toast from "react-hot-toast";
import Link from "next/link";

/* ---------- icons ---------- */

const Icon = ({
  path,
  className = "h-5 w-5",
}: {
  path: string;
  className?: string;
}) => (
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
  calendar:
    "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  cap: "M22 10L12 5 2 10l10 5 10-5zM6 12v5c3 2 9 2 12 0v-5",
  pin: "M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  wallet:
    "M20 12V8H6a2 2 0 0 1 0-4h12v4M4 6v12a2 2 0 0 0 2 2h14v-4M18 12a2 2 0 0 0 0 4h4v-4h-4z",
  phone:
    "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z",
  video: "M23 7l-7 5 7 5V7zM1 5h15v14H1z",
  users:
    "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
  chat:
    "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  clock: "M12 6v6l4 2M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
  send: "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
};

const modes = [
  { value: "phone", label: "Phone", icon: icons.phone },
  { value: "video", label: "Video Call", icon: icons.video },
  { value: "in_person", label: "In Person", icon: icons.users },
  { value: "chat", label: "Chat", icon: icons.chat },
];

const levels = [
  { value: "UG", label: "Undergraduate", short: "UG" },
  { value: "PG", label: "Postgraduate", short: "PG" },
  { value: "Diploma", label: "Diploma", short: "Dip" },
  { value: "Doctorate", label: "Doctorate", short: "PhD" },
  { value: "Other", label: "Other", short: "•••" },
];

export default function CounsellingRequestPage() {
  const [academicYear, setAcademicYear] = useState("");
  const [admissionLevel, setAdmissionLevel] = useState("");
  const [preferredCity, setPreferredCity] = useState("");
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [loading, setLoading] = useState(false);
  const [counsellingMode, setCounsellingMode] = useState("phone");
  const [preferredDate, setPreferredDate] = useState("");
  const [minDateTime, setMinDateTime] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const rootRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  /* ---------- progress ---------- */

  const progress = useMemo(() => {
    const checks = [
      !!academicYear.trim(),
      !!admissionLevel,
      !!preferredCity.trim(),
      minBudget !== "" && maxBudget !== "",
      !!counsellingMode,
      !!preferredDate,
    ];

    return Math.round(
      (checks.filter(Boolean).length / checks.length) * 100
    );
  }, [
    academicYear,
    admissionLevel,
    preferredCity,
    minBudget,
    maxBudget,
    counsellingMode,
    preferredDate,
  ]);

  useEffect(() => {
  const now = new Date();

  const localDateTime = new Date(
    now.getTime() - now.getTimezoneOffset() * 60000
  )
    .toISOString()
    .slice(0, 16);

  setMinDateTime(localDateTime);
}, []);

  /* ---------- GSAP entrance ---------- */

  useEffect(() => {
    if (!rootRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
      });

      tl.from(".hero-badge", {
        y: -20,
        opacity: 0,
        duration: 0.5,
      })
        .from(
          ".hero-title",
          { y: 30, opacity: 0, duration: 0.7 },
          "-=0.2"
        )
        .from(
          ".hero-sub",
          { y: 20, opacity: 0, duration: 0.6 },
          "-=0.4"
        )
        .from(
          ".progress-wrap",
          { y: 20, opacity: 0, duration: 0.5 },
          "-=0.3"
        )
        .from(
          ".form-section",
          {
            y: 50,
            opacity: 0,
            duration: 0.7,
            stagger: 0.15,
          },
          "-=0.2"
        )
        .from(
          ".submit-wrap",
          { y: 20, opacity: 0, duration: 0.5 },
          "-=0.3"
        );

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
  }, []);

  /* ---------- progress bar animation ---------- */

  useEffect(() => {
    if (!progressRef.current) return;

    gsap.to(progressRef.current, {
      width: `${progress}%`,
      duration: 0.6,
      ease: "power2.out",
    });
  }, [progress]);

  /* ---------- card animation ---------- */

  const pop = (el: HTMLElement) => {
    gsap.fromTo(
      el,
      { scale: 0.94 },
      {
        scale: 1,
        duration: 0.45,
        ease: "back.out(2.5)",
      }
    );
  };

  /* ---------- clear individual errors ---------- */

  const clearError = (field: string) => {
    setErrors((prev) => ({
      ...prev,
      [field]: "",
    }));
  };

  /* ---------- submit and validation ---------- */

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (loading) return;

    const newErrors: Record<string, string> = {};

    if (!academicYear.trim()) {
      newErrors.academicYear = "Please enter Academic Year.";
    }

    if (!admissionLevel) {
      newErrors.admissionLevel =
        "Please select Admission Level.";
    }

    if (!preferredCity.trim()) {
      newErrors.preferredCity = "Please enter Preferred City.";
    }

    if (minBudget === "") {
      newErrors.minBudget = "Please enter Minimum Budget.";
    } else if (
      !Number.isFinite(Number(minBudget)) ||
      Number(minBudget) < 0
    ) {
      newErrors.minBudget = "Please enter a valid non-negative budget.";
    }

    if (maxBudget === "") {
      newErrors.maxBudget = "Please enter Maximum Budget.";
    } else if (
      !Number.isFinite(Number(maxBudget)) ||
      Number(maxBudget) < 0
    ) {
      newErrors.maxBudget = "Please enter a valid non-negative budget.";
    }

    if (
      minBudget !== "" &&
      maxBudget !== "" &&
      Number.isFinite(Number(minBudget)) &&
      Number.isFinite(Number(maxBudget)) &&
      Number(maxBudget) < Number(minBudget)
    ) {
      newErrors.maxBudget =
        "Maximum Budget cannot be less than Minimum Budget.";
    }

    if (!counsellingMode) {
      newErrors.counsellingMode =
        "Please select Counselling Mode.";
    }

    if (!preferredDate) {
      newErrors.preferredDate =
        "Please select Preferred Counselling Date.";
    } else if (
      !Number.isFinite(new Date(preferredDate).getTime()) ||
      new Date(preferredDate).getTime() <= Date.now()
    ) {
      newErrors.preferredDate =
        "Please select a future date and time.";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fill all required fields correctly.");

      if (newErrors.admissionLevel) {
        gsap.fromTo(
          ".level-group",
          { x: -8 },
          {
            x: 0,
            duration: 0.5,
            ease: "elastic.out(1, 0.3)",
          }
        );
      }

      if (newErrors.minBudget || newErrors.maxBudget) {
        gsap.fromTo(
          ".budget-group",
          { x: -8 },
          {
            x: 0,
            duration: 0.5,
            ease: "elastic.out(1, 0.3)",
          }
        );
      }

      return;
    }

    try {
      setLoading(true);

      const response = await api.post(
        "/counsellingRequest/counselling-request",
        {
          academicYear: academicYear.trim(),
          admissionLevel,

          preferredLocations: [
            {
              city: preferredCity.trim(),
              state: "Rajasthan",
              country: "India",
            },
          ],

          budget: {
            min: Number(minBudget),
            max: Number(maxBudget),
            currency: "INR",
          },

          counsellingMode,

          preferredTime: {
            date: new Date(preferredDate).toISOString(),
            timezone: "Asia/Kolkata",
          },
        }
      );

      toast.success(
        response.data.message ||
          "Counselling request submitted successfully!"
      );

      setAcademicYear("");
      setAdmissionLevel("");
      setPreferredCity("");
      setMinBudget("");
      setMaxBudget("");
      setCounsellingMode("phone");
      setPreferredDate("");
      setErrors({});
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  /* ---------- styles ---------- */

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100";

  const labelClass =
    "mb-2 block text-sm font-semibold text-slate-700";

  const iconWrap =
    "pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-indigo-500";

  const sectionCard =
    "form-section rounded-2xl border border-slate-200 bg-white p-6 shadow-sm";

  const errorClass =
    "mt-1.5 text-xs font-medium text-red-500";

  const SectionTitle = ({
    step,
    title,
    sub,
  }: {
    step: number;
    title: string;
    sub: string;
  }) => (
    <div className="mb-5 flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-bold text-white shadow-md shadow-indigo-200">
        {step}
      </div>

      <div>
        <h2 className="text-base font-semibold text-slate-900">
          {title}
        </h2>
        <p className="text-xs text-slate-500">{sub}</p>
      </div>
    </div>
  );

  return (
    <div
      ref={rootRef}
      className="min-h-screen flex-1 bg-slate-50 px-4 py-6 sm:px-6"
    >
      <div className="mx-auto max-w-3xl">

        {/* Back to Dashboard */}

        <div className="mb-5 flex justify-end">
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
          >
            <span className="text-lg">←</span>
            Back to Dashboard
          </Link>
        </div>

        {/* ---------- HERO ---------- */}

        <div className="relative overflow-hidden rounded-3xl bg-[#0B1F3A] p-8 shadow-xl shadow-slate-300 sm:p-10">
          <div className="blob-1 pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-blue-400/10 blur-2xl" />

          <div className="blob-2 pointer-events-none absolute -bottom-20 left-10 h-56 w-56 rounded-full bg-blue-300/10 blur-3xl" />

          <div className="relative mx-auto max-w-3xl">
            <span className="hero-badge inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-medium text-white backdrop-blur">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
              Free Admission Guidance
            </span>

            <h1 className="hero-title mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Counselling Request
            </h1>

            <p className="hero-sub mt-2 max-w-xl text-sm text-blue-100 sm:text-base">
              Apni details bhejiye aur expert counsellor se admission ke liye
              personalised guidance paaiye.
            </p>

            {/* progress */}

            <div className="progress-wrap mt-6">
              <div className="mb-2 flex items-center justify-between text-xs font-medium text-blue-100">
                <span>Form completion</span>
                <span>{progress}%</span>
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
                <div
                  ref={progressRef}
                  className="h-full w-0 rounded-full bg-gradient-to-r from-emerald-300 to-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ---------- FORM ---------- */}

        <form
          onSubmit={handleSubmit}
          noValidate
          className="mt-6 space-y-5"
        >

          {/* 1. Academic details */}

          <div className={sectionCard}>
            <SectionTitle
              step={1}
              title="Academic Details"
              sub="Aap kis level aur year ke liye admission chahte hain"
            />

            <div className="space-y-5">

              {/* Academic Year */}

              <div>
                <label className={labelClass}>
                  Academic Year *
                </label>

                <div className="group relative">
                  <span className={iconWrap}>
                    <Icon path={icons.calendar} />
                  </span>

                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => {
                      setAcademicYear(e.target.value);
                      clearError("academicYear");
                    }}
                    placeholder="Example: 2026-27"
                    className={inputClass}
                  />
                </div>

                {errors.academicYear && (
                  <p className={errorClass}>
                    {errors.academicYear}
                  </p>
                )}
              </div>

              {/* Admission Level */}

              <div>
                <label className={labelClass}>
                  Admission Level *
                </label>

                <div className="level-group grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {levels.map((l) => {
                    const active = admissionLevel === l.value;

                    return (
                      <button
                        type="button"
                        key={l.value}
                        onClick={(e) => {
                          setAdmissionLevel(l.value);
                          clearError("admissionLevel");
                          pop(e.currentTarget);
                        }}
                        className={`flex flex-col items-center gap-1 rounded-xl border px-3 py-3 text-center transition ${
                          active
                            ? "border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-100 ring-2 ring-indigo-200"
                            : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50"
                        }`}
                      >
                        <span
                          className={`text-lg font-bold ${
                            active
                              ? "text-indigo-600"
                              : "text-slate-700"
                          }`}
                        >
                          {l.short}
                        </span>

                        <span className="text-[11px] font-medium text-slate-500">
                          {l.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {errors.admissionLevel && (
                  <p className={errorClass}>
                    {errors.admissionLevel}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 2. Location & budget */}

          <div className={sectionCard}>
            <SectionTitle
              step={2}
              title="Location & Budget"
              sub="Preferred city aur aapka budget range"
            />

            <div className="space-y-5">

              {/* Preferred City */}

              <div>
                <label className={labelClass}>
                  Preferred City *
                </label>

                <div className="group relative">
                  <span className={iconWrap}>
                    <Icon path={icons.pin} />
                  </span>

                  <input
                    type="text"
                    value={preferredCity}
                    onChange={(e) => {
                      setPreferredCity(e.target.value);
                      clearError("preferredCity");
                    }}
                    placeholder="Example: Jaipur"
                    className={inputClass}
                  />
                </div>

                {errors.preferredCity && (
                  <p className={errorClass}>
                    {errors.preferredCity}
                  </p>
                )}
              </div>

              {/* Budget */}

              <div className="budget-group grid grid-cols-1 gap-5 md:grid-cols-2">

                {/* Minimum Budget */}

                <div>
                  <label className={labelClass}>
                    Minimum Budget (₹) *
                  </label>

                  <div className="group relative">
                    <span className={iconWrap}>
                      <Icon path={icons.wallet} />
                    </span>

                    <input
                      type="number"
                      min="0"
                      value={minBudget}
                      onChange={(e) => {
                        setMinBudget(e.target.value);
                        setErrors((prev) => ({
                          ...prev,
                          minBudget: "",
                          maxBudget: "",
                        }));
                      }}
                      placeholder="Example: 100000"
                      className={inputClass}
                    />
                  </div>

                  {errors.minBudget && (
                    <p className={errorClass}>
                      {errors.minBudget}
                    </p>
                  )}
                </div>

                {/* Maximum Budget */}

                <div>
                  <label className={labelClass}>
                    Maximum Budget (₹) *
                  </label>

                  <div className="group relative">
                    <span className={iconWrap}>
                      <Icon path={icons.wallet} />
                    </span>

                    <input
                      type="number"
                      min="0"
                      value={maxBudget}
                      onChange={(e) => {
                        setMaxBudget(e.target.value);
                        clearError("maxBudget");
                      }}
                      placeholder="Example: 300000"
                      className={inputClass}
                    />
                  </div>

                  {errors.maxBudget && (
                    <p className={errorClass}>
                      {errors.maxBudget}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 3. Counselling preference */}

          <div className={sectionCard}>
            <SectionTitle
              step={3}
              title="Counselling Preference"
              sub="Aap kaise aur kab baat karna chahte hain"
            />

            <div className="space-y-5">

              {/* Counselling Mode */}

              <div>
                <label className={labelClass}>
                  Counselling Mode *
                </label>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {modes.map((m) => {
                    const active = counsellingMode === m.value;

                    return (
                      <button
                        type="button"
                        key={m.value}
                        onClick={(e) => {
                          setCounsellingMode(m.value);
                          clearError("counsellingMode");
                          pop(e.currentTarget);
                        }}
                        className={`flex flex-col items-center gap-2 rounded-xl border px-3 py-4 transition ${
                          active
                            ? "border-indigo-500 bg-gradient-to-br from-indigo-50 to-violet-50 shadow-md shadow-indigo-100 ring-2 ring-indigo-200"
                            : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50"
                        }`}
                      >
                        <span
                          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                            active
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          <Icon path={m.icon} />
                        </span>

                        <span
                          className={`text-xs font-semibold ${
                            active
                              ? "text-indigo-700"
                              : "text-slate-600"
                          }`}
                        >
                          {m.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {errors.counsellingMode && (
                  <p className={errorClass}>
                    {errors.counsellingMode}
                  </p>
                )}
              </div>

              {/* Preferred Date */}

              <div>
                <label className={labelClass}>
                  Preferred Counselling Date *
                </label>

                <div className="group relative">
                  <span className={iconWrap}>
                    <Icon path={icons.clock} />
                  </span>

                  <input
                    type="datetime-local"
                    value={preferredDate}
                    onChange={(e) => {
                      setPreferredDate(e.target.value);
                      clearError("preferredDate");
                    }}
                   min = {minDateTime}
                    className={inputClass}
                  />
                </div>

                {errors.preferredDate && (
                  <p className={errorClass}>
                    {errors.preferredDate}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Submit */}

          <div className="submit-wrap flex flex-col items-stretch justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
            <p className="text-xs text-slate-500">
              <span className="font-semibold text-slate-700">*</span>{" "}
              required fields. Aapki details sirf counselling ke liye use hongi.
            </p>

            <button
              type="submit"
              disabled={loading}
              onMouseEnter={(e) =>
                !loading &&
                gsap.to(e.currentTarget, {
                  scale: 1.04,
                  duration: 0.25,
                })
              }
              onMouseLeave={(e) =>
                gsap.to(e.currentTarget, {
                  scale: 1,
                  duration: 0.25,
                })
              }
              className="submit-btn inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit Request
                  <Icon
                    path={icons.send}
                    className="h-4 w-4"
                  />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
