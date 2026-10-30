
"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "motion/react";
import {
  FiBookOpen,
  FiAward,
  FiHash,
  FiLayers,
  FiClock,
  FiActivity,
  FiFileText,
  FiArrowLeft,
  FiRefreshCw,
} from "react-icons/fi";
import Link from "next/link";
import api from "../../../src/lib/axios";
import { Toaster, toast } from "react-hot-toast";

interface Course {
  _id: string;
  name?: string;
  shortName?: string;
  slug?: string;
  code?: string;
  description?: string;
  status?: string;
  duration?: string | number | {
    value?: number;
    unit?: string;
  };
  degree?: string | {
    name?: string;
    shortName?: string;
  } | null;
  stream?: string | {
    name?: string;
  } | null;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut" as const,
    },
  },
};

function CourseDetails() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchCourse() {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        const response = await api.get("/course/Get-All-Courses", {
          headers: token
            ? { Authorization: `Bearer ${token}` }
            : {},
        });

        const courses = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data?.data)
            ? response.data.data
            : Array.isArray(response.data?.courses)
              ? response.data.courses
              : [];

        const found = courses.find(
          (item: Course) => item.slug === slug
        );

        if (!active) return;

        if (found) {
          setCourse(found);
        } else {
          setError("Course not found.");
        }
      } catch (err) {
        console.error("Course API error:", err);

        if (active) {
          setError("Unable to load course details.");
          toast.error("Failed to load course");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    if (slug) {
      fetchCourse();
    }

    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-3xl rounded-3xl bg-white p-8 shadow-xl"
        >
          <div className="mb-6 flex items-center gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                repeat: Infinity,
                duration: 2,
                ease: "linear",
              }}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600"
            >
              <FiRefreshCw size={24} />
            </motion.div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                Loading Course
              </h2>
              <p className="text-sm text-slate-500">
                Please wait while we fetch course details...
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {[1, 2, 3, 4].map((item) => (
              <motion.div
                key={item}
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{
                  repeat: Infinity,
                  duration: 1.5,
                  delay: item * 0.15,
                }}
                className="h-16 rounded-xl bg-slate-100"
              />
            ))}
          </div>
        </motion.div>
      </main>
    );
  }

  if (error || !course) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg rounded-3xl border border-red-100 bg-white p-10 text-center shadow-xl"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-3xl text-red-500"
          >
            !
          </motion.div>

          <h2 className="text-2xl font-bold text-slate-800">
            Course Not Available
          </h2>

          <p className="mt-3 text-slate-500">
            {error || "Course not found."}
          </p>

          <Link
            href="/course"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            <FiArrowLeft />
            Back to Courses
          </Link>
        </motion.div>
      </main>
    );
  }

  const degree =
    typeof course.degree === "object"
      ? course.degree?.name || course.degree?.shortName
      : course.degree;

  const stream =
    typeof course.stream === "object"
      ? course.stream?.name
      : course.stream;

  const duration =
    typeof course.duration === "object"
      ? course.duration
        ? `${course.duration.value ?? ""} ${
            course.duration.unit ?? ""
          }`.trim()
        : undefined
      : course.duration;

  const details = [
    {
      label: "Course Name",
      value: course.name,
      icon: FiBookOpen,
    },
    {
      label: "Short Name",
      value: course.shortName,
      icon: FiAward,
    },
    {
      label: "Course Code",
      value: course.code,
      icon: FiHash,
    },
    {
      label: "Slug",
      value: course.slug,
      icon: FiLayers,
    },
    {
      label: "Degree",
      value: degree,
      icon: FiAward,
    },
    {
      label: "Stream",
      value: stream,
      icon: FiBookOpen,
    },
    {
      label: "Duration",
      value: duration !== undefined ? String(duration) : undefined,
      icon: FiClock,
    },
    {
      label: "Status",
      value: course.status,
      icon: FiActivity,
    },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50">

      {/* Background Effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            x: [0, 40, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-blue-200/40 blur-3xl"
        />

        <motion.div
          animate={{
            x: [0, -40, 0],
            y: [0, 40, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -right-32 bottom-10 h-96 w-96 rounded-full bg-cyan-200/40 blur-3xl"
        />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-16">

        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Link
            href="/course"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-600 shadow-sm transition-all duration-300 hover:-translate-x-1 hover:border-blue-300 hover:text-blue-600 hover:shadow-md"
          >
            <FiArrowLeft />
            Back to Courses
          </Link>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="overflow-hidden rounded-3xl border border-white bg-white shadow-2xl shadow-blue-100/60"
        >

          {/* Hero Section */}
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-800 to-cyan-700 px-6 py-12 text-white md:px-12 md:py-16">

            <motion.div
              animate={{
                rotate: 360,
                scale: [1, 1.15, 1],
              }}
              transition={{
                rotate: {
                  duration: 25,
                  repeat: Infinity,
                  ease: "linear",
                },
                scale: {
                  duration: 5,
                  repeat: Infinity,
                },
              }}
              className="absolute -right-20 -top-32 h-80 w-80 rounded-full border-[35px] border-white/10"
            />

            <motion.div
              animate={{
                y: [0, -20, 0],
                x: [0, 15, 0],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute bottom-[-100px] right-40 h-64 w-64 rounded-full bg-cyan-300/10 blur-2xl"
            />

            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="relative z-10"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-cyan-100 backdrop-blur-md">
                <FiBookOpen />
                Course Details
              </span>

              <h1 className="mt-6 max-w-3xl text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
                {course.name || "Course Details"}
              </h1>

              {course.shortName && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-4 text-lg font-medium text-blue-100 md:text-xl"
                >
                  {course.shortName}
                </motion.p>
              )}

              <div className="mt-7 flex flex-wrap items-center gap-3">
                {course.code && (
                  <span className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm backdrop-blur-md">
                    Code: {course.code}
                  </span>
                )}

                {course.status && (
                  <span
                    className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                      course.status.toLowerCase() === "active"
                        ? "bg-emerald-400/20 text-emerald-100"
                        : "bg-red-400/20 text-red-100"
                    }`}
                  >
                    {course.status}
                  </span>
                )}
              </div>
            </motion.div>
          </div>

          {/* Details Section */}
          <div className="p-6 md:p-10">

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="mb-8 grid gap-5 sm:grid-cols-2"
            >
              {details.map((item, index) => {
                const Icon = item.icon;

                return (
                  <motion.div
                    key={item.label}
                    variants={itemVariants}
                    whileHover={{
                      y: -7,
                      scale: 1.02,
                      transition: { duration: 0.25 },
                    }}
                    className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors duration-300 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-100/60"
                  >
                    <div className="flex items-start gap-4">
                      <motion.div
                        whileHover={{ rotate: 10, scale: 1.1 }}
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xl text-blue-600 transition-colors duration-300 group-hover:bg-blue-600 group-hover:text-white"
                      >
                        <Icon />
                      </motion.div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-500">
                          {item.label}
                        </p>

                        <p className="mt-2 break-words text-base font-bold text-slate-800">
                          {item.value || "N/A"}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              whileHover={{ y: -4 }}
              className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-cyan-50 p-6 md:p-8"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-xl text-white shadow-lg shadow-blue-200">
                  <FiFileText />
                </div>

                <h2 className="text-xl font-bold text-slate-800">
                  Course Description
                </h2>
              </div>

              <p className="whitespace-pre-line leading-8 text-slate-600">
                {course.description || "No description available for this course."}
              </p>
            </motion.div>

            {/* Bottom CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl bg-slate-900 p-6 text-center text-white sm:flex-row sm:text-left"
            >
              <div>
                <h3 className="text-lg font-bold">
                  Explore More Courses
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  Find the right course for your career goals.
                </p>
              </div>

              <Link
                href="/course"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition-all duration-300 hover:scale-105 hover:bg-blue-500"
              >
                View All Courses
                <FiArrowLeft className="rotate-180" />
              </Link>
            </motion.div>

          </div>
        </motion.div>
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <>
      <Toaster position="top-right" />

      <Suspense
        fallback={
          <main className="flex min-h-screen items-center justify-center bg-slate-50">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                repeat: Infinity,
                duration: 1.5,
                ease: "linear",
              }}
              className="h-12 w-12 rounded-full border-4 border-blue-200 border-t-blue-600"
            />
          </main>
        }
      >
        <CourseDetails />
      </Suspense>
    </>
  );
}
