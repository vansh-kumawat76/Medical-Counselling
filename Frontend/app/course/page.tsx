
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "../../src/lib/axios";
import { motion, AnimatePresence } from "motion/react";
import {
  FiBookOpen,
  FiAward,
  FiClock,
  FiArrowRight,
  FiSearch,
  FiLayers,
  FiActivity,
  FiRefreshCw,
  FiHash,
  FiBook,
} from "react-icons/fi";

interface Course {
  _id: string;
  name: string;
  shortName?: string;
  slug: string;
  code?: string;
  degree?: {
    name?: string;
    shortName?: string;
  } | null;
  stream?: {
    name?: string;
    slug?: string;
  } | null;
  duration?: {
    value?: number;
    unit?: "months" | "years";
  };
  description?: string;
  status: "active" | "inactive";
  displayOrder?: number;
}

export default function CoursePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      const response = await api.get("/course/Get-All-Courses", {
        headers: token
          ? { Authorization: `Bearer ${token}` }
          : {},
      });

      if (response.data.success) {
        setCourses(
          [...response.data.data].sort(
            (a: Course, b: Course) =>
              (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
          )
        );
      } else {
        setError("Courses load nahi ho paaye.");
      }
    } catch (err) {
      console.error("Fetch Courses Error:", err);
      setError("Courses load nahi ho paaye. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const filteredCourses = courses.filter((course) => {
    const value = search.toLowerCase();

    return (
      course.name.toLowerCase().includes(value) ||
      course.shortName?.toLowerCase().includes(value) ||
      course.code?.toLowerCase().includes(value) ||
      course.degree?.name?.toLowerCase().includes(value) ||
      course.stream?.name?.toLowerCase().includes(value)
    );
  });

  const activeCourses = courses.filter(
    (course) => course.status === "active"
  ).length;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.09 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 35 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" as const },
    },
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#f6f9ff] text-slate-900">

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#071b3b] via-[#102f60] to-[#075985] px-5 py-20 text-white sm:px-8 lg:py-24">

        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.35, 0.2] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute -right-24 -top-32 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl"
        />

        <motion.div
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.1, 0.25, 0.1] }}
          transition={{ duration: 9, repeat: Infinity }}
          className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl"
        />

        <div className="relative mx-auto max-w-7xl">

          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-white/10 px-4 py-2 text-sm font-semibold text-cyan-200 backdrop-blur-md">
              <FiBookOpen />
              Medical Counselling Platform
            </div>

            <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
              Discover Your
              <span className="block bg-gradient-to-r from-cyan-300 to-blue-200 bg-clip-text text-transparent">
                Future Course
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-blue-100/80 sm:text-lg">
              Explore academic courses, discover their degrees and streams,
              and find the right path for your educational journey.
            </p>

            <motion.a
              href="#available-courses"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="mt-9 inline-flex items-center gap-3 rounded-xl bg-cyan-400 px-7 py-4 font-bold text-slate-950 shadow-xl shadow-cyan-950/20 transition hover:bg-cyan-300"
            >
              Explore Courses
              <FiArrowRight />
            </motion.a>
          </motion.div>

          {/* Statistics */}
          {!loading && !error && (
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="mt-14 grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-3"
            >
              {[
                {
                  label: "Total Courses",
                  value: courses.length,
                  icon: FiBookOpen,
                },
                {
                  label: "Active Courses",
                  value: activeCourses,
                  icon: FiActivity,
                },
                {
                  label: "Available Degrees",
                  value: new Set(
                    courses
                      .map((course) => course.degree?.name)
                      .filter(Boolean)
                  ).size,
                  icon: FiBook,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-lg"
                >
                  <item.icon className="mb-3 text-2xl text-cyan-300" />
                  <p className="text-3xl font-extrabold">{item.value}</p>
                  <p className="mt-1 text-sm text-blue-100/70">
                    {item.label}
                  </p>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Courses Section */}
      <section
        id="available-courses"
        className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20"
      >

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end"
        >
          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-blue-600">
              Explore Opportunities
            </p>

            <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
              Available Courses
            </h2>

            <p className="mt-3 max-w-xl leading-7 text-slate-500">
              Find the course that matches your interests and career goals.
            </p>
          </div>

          {!loading && !error && (
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <FiBookOpen className="text-lg text-blue-600" />
              {filteredCourses.length} Courses Found
            </div>
          )}
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10"
        >
          <div className="relative max-w-xl">
            <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-xl text-slate-400" />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search courses, degree, stream or code..."
              className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-14 pr-5 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            />
          </div>
        </motion.div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse rounded-3xl border border-slate-200 bg-white p-7"
              >
                <div className="mb-6 h-12 w-12 rounded-xl bg-slate-200" />
                <div className="mb-3 h-5 w-3/4 rounded bg-slate-200" />
                <div className="mb-8 h-3 w-1/2 rounded bg-slate-100" />
                <div className="space-y-4">
                  <div className="h-12 rounded-lg bg-slate-100" />
                  <div className="h-12 rounded-lg bg-slate-100" />
                  <div className="h-12 rounded-lg bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl border border-red-200 bg-red-50 p-10 text-center"
          >
            <p className="text-lg font-bold text-red-600">{error}</p>

            <button
              onClick={fetchCourses}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700"
            >
              <FiRefreshCw />
              Try Again
            </button>
          </motion.div>
        )}

        {/* Empty */}
        {!loading && !error && courses.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm"
          >
            <FiBookOpen className="mx-auto mb-5 text-5xl text-blue-300" />
            <h3 className="text-2xl font-bold text-slate-800">
              No Courses Available
            </h3>
            <p className="mt-3 text-slate-500">
              Courses will appear here when they are available.
            </p>
          </motion.div>
        )}

        {/* No Search Results */}
        {!loading && !error && courses.length > 0 && filteredCourses.length === 0 && (
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center">
            <FiSearch className="mx-auto mb-4 text-4xl text-slate-300" />
            <h3 className="text-xl font-bold text-slate-800">
              No Matching Courses
            </h3>
            <p className="mt-2 text-slate-500">
              Try searching with another course name or degree.
            </p>
          </div>
        )}

        {/* Course Cards */}
        {!loading && !error && filteredCourses.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3"
          >
            <AnimatePresence mode="popLayout">
              {filteredCourses.map((course, index) => (
                <motion.article
                  key={course._id}
                  layout
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, scale: 0.92 }}
                  whileHover={{ y: -9 }}
                  transition={{ duration: 0.3 }}
                  className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition-shadow duration-300 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-900/10"
                >
                  {/* Top Gradient */}
                  <div className="absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-300" />

                  <div className="mb-6 flex items-start justify-between gap-3">
                    <motion.div
                      whileHover={{ rotate: 8, scale: 1.08 }}
                      className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-lg font-extrabold text-white shadow-lg shadow-blue-200"
                    >
                      {(course.shortName || course.name)
                        .slice(0, 2)
                        .toUpperCase()}
                    </motion.div>

                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                        course.status === "active"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <span className="mr-1">●</span>
                      {course.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="mb-5">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-blue-600">
                      Course {String(index + 1).padStart(2, "0")}
                    </p>

                    <h3 className="text-xl font-extrabold leading-7 text-slate-900 transition group-hover:text-blue-700">
                      {course.name}
                    </h3>

                    {course.shortName && (
                      <p className="mt-2 text-sm font-semibold text-cyan-600">
                        {course.shortName}
                      </p>
                    )}

                    {course.code && (
                      <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
                        <FiHash />
                        {course.code}
                      </div>
                    )}
                  </div>

                  {/* Course Details */}
                  <div className="mb-6 space-y-4 rounded-2xl bg-slate-50 p-5">

                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
                        <FiBook />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Degree
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {course.degree?.name || "Not specified"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-cyan-100 p-2 text-cyan-700">
                        <FiLayers />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Stream
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {course.stream?.name || "Not specified"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-violet-100 p-2 text-violet-600">
                        <FiClock />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Duration
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {course.duration?.value != null
                            ? `${course.duration.value} ${course.duration.unit || "years"}`
                            : "Not specified"}
                        </p>
                      </div>
                    </div>

                  </div>

                  <p className="mb-7 flex-1 text-sm leading-7 text-slate-500">
                    {course.description?.trim() ||
                      "Course details will be available soon."}
                  </p>

                  <Link
                    href={`/course/${course.slug}`}
                    className="inline-flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-blue-700 to-cyan-600 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:from-blue-800 hover:to-cyan-700"
                  >
                    View Course
                    <FiArrowRight className="transition-transform duration-300 group-hover:translate-x-2" />
                  </Link>

                </motion.article>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </section>

      {/* Bottom CTA */}
      <section className="px-5 pb-16 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-gradient-to-r from-[#0b2550] via-[#12477c] to-[#087e9d] px-7 py-12 text-center text-white sm:px-12 sm:py-16"
        >
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-300/10 blur-3xl" />

          <div className="relative">
            <FiAward className="mx-auto mb-5 text-4xl text-cyan-300" />

            <h2 className="text-2xl font-extrabold sm:text-3xl">
              Your Future Starts With The Right Choice
            </h2>

            <p className="mx-auto mt-4 max-w-2xl leading-7 text-blue-100/80">
              Explore available courses and take the next step toward
              your academic goals.
            </p>

            <a
              href="#available-courses"
              className="mt-8 inline-flex items-center gap-3 rounded-xl bg-white px-7 py-3.5 font-bold text-blue-900 transition hover:bg-cyan-100"
            >
              Explore Now
              <FiArrowRight />
            </a>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
