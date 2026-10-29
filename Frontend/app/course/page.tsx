
"use client";

import { useEffect, useState } from "react";
import api from "../../src/lib/axios";

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

  useEffect(() => {
    const fetchCourses = async () => {
      try {
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

    fetchCourses();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-12 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
            Medical Counselling
          </p>

          <h1 className="text-3xl font-bold sm:text-4xl">
            Explore Courses
          </h1>

          <p className="mt-3 max-w-2xl leading-7 text-slate-400">
            Explore courses, compare their streams and degrees, and
            find the right option for your medical counselling journey.
          </p>
        </div>

        {loading && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
            <p className="text-cyan-400">Loading courses...</p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
            <p className="text-red-400">{error}</p>

            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-cyan-500 px-5 py-2 font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && courses.length === 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
            <h2 className="text-xl font-semibold">
              No Courses Available
            </h2>

            <p className="mt-2 text-slate-400">
              Courses will appear here when they are available.
            </p>
          </div>
        )}

        {!loading && !error && courses.length > 0 && (
          <>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">
                Available Courses
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <article
                  key={course._id}
                  className="group flex h-full flex-col rounded-2xl border border-slate-800 bg-slate-900 p-6 transition duration-300 hover:-translate-y-1 hover:border-cyan-500/60 hover:shadow-xl hover:shadow-cyan-950/20"
                >
                  <div className="mb-5 flex items-start justify-between gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-lg font-bold text-cyan-400">
                      {(course.shortName || course.name)
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        course.status === "active"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-slate-700 text-slate-300"
                      }`}
                    >
                      {course.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold leading-7 text-white transition group-hover:text-cyan-300">
                    {course.name}
                  </h3>

                  {course.shortName && (
                    <p className="mt-1 text-sm text-cyan-400">
                      {course.shortName}
                    </p>
                  )}

                  {course.code && (
                    <p className="mt-3 text-sm text-slate-400">
                      Course Code:{" "}
                      <span className="font-medium text-slate-300">
                        {course.code}
                      </span>
                    </p>
                  )}

                  <div className="my-5 space-y-3 border-y border-slate-800 py-5">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                        Degree
                      </p>
                      <p className="mt-1 text-sm text-slate-200">
                        {course.degree?.name || "Not specified"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                        Stream
                      </p>
                      <p className="mt-1 text-sm text-slate-200">
                        {course.stream?.name || "Not specified"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                        Duration
                      </p>
                      <p className="mt-1 text-sm text-slate-200">
                        {course.duration?.value != null
                          ? `${course.duration.value} ${course.duration.unit || "years"}`
                          : "Not specified"}
                      </p>
                    </div>
                  </div>

                  <p className="mb-6 flex-1 text-sm leading-6 text-slate-400">
                    {course.description?.trim() ||
                      "Course details will be available soon."}
                  </p>

                  <a
                    href={`/course/${course.slug}`}
                    className="inline-flex w-full items-center justify-center rounded-xl border border-cyan-500/40 px-5 py-3 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500 hover:text-slate-950"
                  >
                    View Course
                    <span className="ml-2 transition group-hover:translate-x-1">
                      →
                    </span>
                  </a>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
