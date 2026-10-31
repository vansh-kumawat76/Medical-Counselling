
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import api from "../../../src/lib/axios";
import { motion, AnimatePresence } from "motion/react";

import {
  FiSearch,
  FiMapPin,
  FiGitMerge,
  FiArrowRight,
  FiBookOpen,
  FiCalendar,
  FiGlobe,
  FiStar,
  FiX,
  FiCheck,
  FiTrash2,
  FiAward,
  FiInfo,
} from "react-icons/fi";

interface College {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  university?: string | { name?: string };
  collegeType?: string;
  ownership?: string;
  establishedYear?: number;
  location?: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  website?: string;
  rating?: {
    average?: number;
    count?: number;
  };
  status?: string;
}

function CollegeComparison() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialCollegeId = searchParams.get("college");

  const [colleges, setColleges] = useState<College[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await api.get("/college/Get-All-Colleges", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.status) {
          const collegeList: College[] = response.data.colleges || [];

          setColleges(collegeList);

          if (initialCollegeId) {
            const exists = collegeList.some(
              (college) => college._id === initialCollegeId
            );

            if (exists) {
              setSelectedIds([initialCollegeId]);
            }
          }
        } else {
          setError("Colleges ka data fetch nahi ho paya.");
        }
      } catch (err) {
        console.error("College comparison fetch error:", err);
        setError("Colleges load nahi hue. Backend aur login check karo.");
      } finally {
        setLoading(false);
      }
    };

    fetchColleges();
  }, [initialCollegeId]);

  // Search colleges
  const filteredColleges = useMemo(() => {
    return colleges.filter((college) =>
      college.name.toLowerCase().includes(search.trim().toLowerCase())
    );
  }, [colleges, search]);

  // Selected colleges
  const selectedColleges = selectedIds
    .map((id) => colleges.find((college) => college._id === id))
    .filter((college): college is College => Boolean(college));

  // Select / Remove college
  const toggleCollege = (id: string) => {
    setSelectedIds((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }

      if (current.length >= 3) {
        return current;
      }

      return [...current, id];
    });
  };

  // University name
  const getUniversity = (college: College) => {
    return typeof college.university === "object"
      ? college.university?.name || "—"
      : college.university || "—";
  };

  // College location
  const getLocation = (college: College) => {
    return [
      college.location?.city,
      college.location?.state,
      college.location?.country,
    ]
      .filter(Boolean)
      .join(", ") || college.location?.address || "—";
  };

  // Comparison data
  const comparisonRows: {
    label: string;
    icon: React.ComponentType<{ size?: number }>;
    value: (college: College) => ReactNode;
  }[] = [
    {
      label: "College Type",
      icon: FiBookOpen,
      value: (college) => college.collegeType || "—",
    },
    {
      label: "Ownership",
      icon: FiAward,
      value: (college) => college.ownership || "—",
    },
    {
      label: "University",
      icon: FiBookOpen,
      value: (college) => getUniversity(college),
    },
    {
      label: "Established Year",
      icon: FiCalendar,
      value: (college) => college.establishedYear || "—",
    },
    {
      label: "Location",
      icon: FiMapPin,
      value: (college) => getLocation(college),
    },
    {
      label: "Rating",
      icon: FiStar,
      value: (college) =>
        college.rating?.average != null ? (
          <span className="inline-flex flex-wrap items-center gap-1">
            <FiStar className="fill-amber-400 text-amber-400" />
            <span className="font-bold text-slate-800">
              {college.rating.average}
            </span>
            {college.rating.count != null && (
              <span className="text-xs text-slate-400">
                ({college.rating.count} reviews)
              </span>
            )}
          </span>
        ) : (
          "Not available"
        ),
    },
    {
      label: "Website",
      icon: FiGlobe,
      value: (college) =>
        college.website ? (
          <a
            href={college.website}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => event.stopPropagation()}
            className="inline-flex items-center gap-1 break-all font-semibold text-blue-600 hover:text-blue-800 hover:underline"
          >
            Visit Website
            <FiArrowRight />
          </a>
        ) : (
          "—"
        ),
    },
    {
      label: "Description",
      icon: FiInfo,
      value: (college) => college.description || "—",
    },
  ];

  // Loading UI
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
          <p className="mt-5 font-semibold text-slate-600">
            Colleges load ho rahe hain...
          </p>
        </div>
      </main>
    );
  }

  // Error UI
  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
        <div className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-10 text-center shadow-lg">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <FiInfo size={30} />
          </div>

          <h2 className="mt-5 text-2xl font-bold text-slate-900">
            Unable to Load Colleges
          </h2>

          <p className="mt-3 text-sm leading-7 text-slate-500">
            {error}
          </p>

          <button
            onClick={() => window.location.reload()}
            className="mt-7 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-slate-50 text-slate-900">

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-800 to-blue-600 px-6 py-16 md:py-20">

        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-cyan-300/20 blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative mx-auto max-w-7xl"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold text-cyan-200 backdrop-blur-md">
            <FiGitMerge />
            Smart College Comparison
          </span>

          <h1 className="mt-7 text-4xl font-extrabold leading-tight text-white md:text-5xl lg:text-6xl">
            Compare Colleges,
            <span className="block text-cyan-300">
              Choose Your Future
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-8 text-blue-100 md:text-lg">
            Compare different colleges side by side, understand their
            features and make a better decision for your medical career.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-medium text-white backdrop-blur-sm">
              <FiCheck className="text-cyan-300" />
              Compare up to 3 colleges
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-medium text-white backdrop-blur-sm">
              <FiBookOpen className="text-cyan-300" />
              Detailed Comparison
            </div>
          </div>
        </motion.div>
      </section>

      {/* Main Comparison Section */}
      <section className="mx-auto max-w-7xl px-5 py-14 lg:px-10 lg:py-20">

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[340px_minmax(0,1fr)]">

          {/* College Selection Sidebar */}
          <motion.aside
            initial={{ opacity: 0, x: -35 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
          >

            <div className="bg-gradient-to-r from-blue-700 to-blue-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-100">
                    Select Institutions
                  </p>
                  <h2 className="mt-1 text-2xl font-bold">
                    Find Colleges
                  </h2>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
                  <FiBookOpen size={25} />
                </div>
              </div>

              {/* Selection Progress */}
              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between text-xs font-semibold">
                  <span>Selection Progress</span>
                  <span>{selectedIds.length}/3</span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-white/20">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(selectedIds.length / 3) * 100}%`,
                    }}
                    transition={{ duration: 0.4 }}
                    className="h-full rounded-full bg-cyan-300"
                  />
                </div>
              </div>
            </div>

            <div className="p-5">

              {/* Search */}
              <div className="relative">
                <FiSearch
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={19}
                />

                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search college name..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="mb-4 mt-6 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">
                  Available Colleges
                </h3>

                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {filteredColleges.length} found
                </span>
              </div>

              {/* College List */}
              <div className="max-h-[540px] space-y-3 overflow-y-auto pr-1">

                <AnimatePresence mode="popLayout">
                  {filteredColleges.map((college, index) => {
                    const selected = selectedIds.includes(college._id);
                    const limitReached =
                      selectedIds.length >= 3 && !selected;

                    return (
                      <motion.button
                        layout
                        key={college._id}
                        type="button"
                        disabled={limitReached}
                        onClick={() => toggleCollege(college._id)}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{
                          duration: 0.3,
                          delay: index * 0.025,
                        }}
                        whileHover={
                          !limitReached ? { scale: 1.02 } : undefined
                        }
                        whileTap={
                          !limitReached ? { scale: 0.98 } : undefined
                        }
                        className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all duration-300 ${
                          selected
                            ? "border-blue-500 bg-blue-50 shadow-sm"
                            : "border-slate-100 bg-slate-50 hover:border-blue-200 hover:bg-white"
                        } ${
                          limitReached
                            ? "cursor-not-allowed opacity-40"
                            : "cursor-pointer"
                        }`}
                      >
                        {college.logo ? (
                          <img
                            src={college.logo}
                            alt=""
                            className="h-12 w-12 shrink-0 rounded-xl border border-slate-100 bg-white object-contain p-1"
                          />
                        ) : (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-xl font-bold text-blue-600">
                            {college.name.charAt(0).toUpperCase()}
                          </div>
                        )}

                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold text-slate-800">
                            {college.name}
                          </span>

                          <span className="mt-1 flex items-center gap-1 truncate text-xs text-slate-500">
                            <FiMapPin className="shrink-0 text-blue-500" />
                            {getLocation(college)}
                          </span>
                        </span>

                        <motion.span
                          animate={{
                            scale: selected ? 1 : 0.9,
                          }}
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition ${
                            selected
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "border-slate-300 bg-white text-slate-400"
                          }`}
                        >
                          {selected ? (
                            <FiCheck size={16} />
                          ) : (
                            <span className="text-lg">+</span>
                          )}
                        </motion.span>
                      </motion.button>
                    );
                  })}
                </AnimatePresence>

                {filteredColleges.length === 0 && (
                  <div className="py-10 text-center">
                    <FiSearch className="mx-auto text-slate-300" size={30} />
                    <p className="mt-3 text-sm font-medium text-slate-500">
                      Koi college nahi mila.
                    </p>
                  </div>
                )}
              </div>

              {selectedIds.length === 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-5 rounded-xl bg-amber-50 p-3 text-xs font-medium text-amber-700"
                >
                  Maximum 3 colleges select ho chuke hain.
                </motion.div>
              )}
            </div>
          </motion.aside>

          {/* Comparison Area */}
          <motion.section
            initial={{ opacity: 0, x: 35 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="min-w-0"
          >

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="text-sm font-semibold text-blue-600">
                  Side-by-side analysis
                </span>

                <h2 className="mt-1 text-2xl font-extrabold text-slate-900 md:text-3xl">
                  Comparison Overview
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  {selectedColleges.length} of 3 colleges selected
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedIds([])}
                disabled={selectedIds.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-100 bg-white px-5 py-3 text-sm font-semibold text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FiTrash2 />
                Clear Selection
              </button>
            </div>

            {/* Empty State */}
            {selectedColleges.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-dashed border-blue-200 bg-white p-8 text-center shadow-sm"
              >
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 text-blue-600"
                >
                  <FiGitMerge size={38} />
                </motion.div>

                <h3 className="mt-7 text-2xl font-bold text-slate-900">
                  Select Colleges to Compare
                </h3>

                <p className="mt-3 max-w-sm text-sm leading-7 text-slate-500">
                  Search for colleges on the left and select up to 3
                  institutions to see their details side by side.
                </p>

                <div className="mt-7 flex items-center gap-2 rounded-full bg-blue-50 px-5 py-2 text-xs font-semibold text-blue-600">
                  <FiArrowRight />
                  Start by selecting a college
                </div>
              </motion.div>
            ) : (

              /* Comparison Table */
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

                <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50 to-white p-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
                      <FiGitMerge size={22} />
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900">
                        College Comparison
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Review all selected college details
                      </p>
                    </div>
                  </div>
                </div>

                {/* Horizontal Scroll for Mobile */}
                <div className="overflow-x-auto">
                  <div
                    className="min-w-[650px]"
                    style={{
                      display: "grid",
                      gridTemplateColumns: `minmax(150px, 180px) repeat(${selectedColleges.length}, minmax(190px, 1fr))`,
                    }}
                  >

                    {/* College Headers */}
                    <div className="flex items-center bg-slate-50 p-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      College Details
                    </div>

                    <AnimatePresence mode="popLayout">
                      {selectedColleges.map((college, index) => (
                        <motion.div
                          layout
                          key={college._id}
                          initial={{ opacity: 0, y: 25 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.4 }}
                          className="min-w-0 border-l border-slate-100 p-4"
                        >
                          <div className="mb-3 flex items-center justify-between">
                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                              College {index + 1}
                            </span>

                            <button
                              type="button"
                              onClick={() => toggleCollege(college._id)}
                              aria-label={`Remove ${college.name}`}
                              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                            >
                              <FiX size={15} />
                              Remove
                            </button>
                          </div>

                          <div className="flex h-24 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 p-3">
                            {college.logo ? (
                              <img
                                src={college.logo}
                                alt={`${college.name} logo`}
                                className="h-full max-w-full object-contain"
                              />
                            ) : (
                              <span className="text-4xl font-extrabold text-blue-600">
                                {college.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>

                          <h3 className="mt-4 break-words text-sm font-bold leading-6 text-slate-900">
                            {college.name}
                          </h3>

                          <button
                            type="button"
                            onClick={() =>
                              router.push(`/college/${college.slug}`)
                            }
                            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 transition hover:text-blue-800"
                          >
                            View Details
                            <FiArrowRight />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {/* Comparison Rows */}
                    {comparisonRows.map((row, index) => {
                      const Icon = row.icon;

                      return (
                        <motion.div
                          key={row.label}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.35,
                            delay: index * 0.04,
                          }}
                          className={`contents`}
                        >
                          <div
                            className={`flex items-start gap-3 p-4 text-sm font-semibold text-slate-700 ${
                              index % 2 === 0
                                ? "bg-slate-50"
                                : "bg-white"
                            }`}
                          >
                            <Icon size={17} />
                            {row.label}
                          </div>

                          {selectedColleges.map((college) => (
                            <div
                              key={`${college._id}-${row.label}`}
                              className={`min-w-0 border-l border-slate-100 p-4 text-sm leading-7 text-slate-600 ${
                                index % 2 === 0
                                  ? "bg-slate-50"
                                  : "bg-white"
                              }`}
                            >
                              {row.value(college)}
                            </div>
                          ))}
                        </motion.div>
                      );
                    })}

                  </div>
                </div>

                <div className="border-t border-slate-100 bg-blue-50/50 p-4">
                  <p className="flex items-start gap-2 text-xs leading-6 text-slate-500">
                    <FiInfo className="mt-0.5 shrink-0 text-blue-500" />
                    Swipe horizontally to view all selected colleges on
                    smaller screens.
                  </p>
                </div>

              </div>
            )}

            <p className="mt-5 text-xs leading-6 text-slate-400">
              Note: Fees, course availability, seats aur cutoffs tabhi
              compare kiye ja sakte hain jab ye details backend mein
              available hon.
            </p>

          </motion.section>
        </div>
      </section>

    </main>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-50">
          <p className="font-semibold text-slate-600">
            Comparison page load ho raha hai...
          </p>
        </main>
      }
    >
      <CollegeComparison />
    </Suspense>
  );
}
