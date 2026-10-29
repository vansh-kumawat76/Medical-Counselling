"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";
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
    return <main className="p-8 text-center">Loading course...</main>;
  }

  if (error || !course) {
    return (
      <main className="p-8 text-center text-red-600">
        {error || "Course not found."}
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

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl bg-white shadow-lg">
        <div className="bg-blue-700 px-6 py-8 text-white">
          <h1 className="text-3xl font-bold">
            {course.name || "Course Details"}
          </h1>

          {course.shortName && (
            <p className="mt-2 text-blue-100">{course.shortName}</p>
          )}
        </div>

        <div className="grid gap-5 p-6 sm:grid-cols-2">
          <Info label="Course Name" value={course.name} />
          <Info label="Short Name" value={course.shortName} />
          <Info label="Course Code" value={course.code} />
          <Info label="Slug" value={course.slug} />
          <Info label="Degree" value={degree} />
          <Info label="Stream" value={stream} />
          <Info
            label="Duration"
            value={duration !== undefined ? String(duration) : undefined}
          />
          <Info label="Status" value={course.status} />

          <div className="sm:col-span-2">
            <Info label="Description" value={course.description} />
          </div>
        </div>
      </div>
    </main>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-1 break-words font-semibold text-gray-900">
        {value || "N/A"}
      </p>
    </div>
  );
}

export default function Page() {
  return (
    <>
      <Toaster position="top-right" />
      <Suspense
        fallback={
          <main className="p-8 text-center">
            Loading course details...
          </main>
        }
      >
        <CourseDetails />
      </Suspense>
    </>
  );
}
