
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "../src/lib/axios";

type College = {
  _id: string;
  name: string;
  slug: string;
  location?: {
    city?: string;
    state?: string;
  };
};


type Course = {
  _id: string;
  name: string;
  shortName?: string;
  slug: string;
  description?: string;
  duration?: {
    value?: number;
    unit?: "months" | "years";
  };
  degree?: {
    name: string;
    shortName?: string;
    slug?: string;
    level?: string;
  };
  stream?: {
    name: string;
    slug?: string;
    code?: string;
  };
};


export default function Header() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [heroImage, setHeroImage] = useState("");
  const [loadingColleges, setLoadingColleges] = useState(true);
  const [collegeError, setCollegeError] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [courseError, setCourseError] = useState("");
useEffect(() => {
  async function fetchColleges() {
   
    setLoadingColleges(true);
    setCollegeError("");

    try {
      const response = await api.get(
        "/college/Get-All-Colleges?limit=3"
      );

      if (response.data.status) {
        setColleges(response.data.colleges || []);
      } else {
        setColleges([]);
        setCollegeError("Unable to load colleges.");
      }
    } catch (error) {
      console.error("Failed to fetch colleges:", error);
      setColleges([]);
      setCollegeError("Failed to load colleges. Please try again later.");
    } finally {
      setLoadingColleges(false);
    }
  }

  fetchColleges();

  

async function fetchCourses() {
  setLoadingCourses(true);
  setCourseError("");

  try {
    const response = await api.get("/course/Get-All-Courses");

    if (response.data.success) {
      setCourses((response.data.data || []).slice(0, 3));
    } else {
      setCourses([]);
      setCourseError("Unable to load courses.");
    }
  } catch (error) {
    console.error("Failed to fetch courses:", error);
    setCourses([]);
    setCourseError("Failed to load courses. Please try again later.");
  } finally {
    setLoadingCourses(false);
  }
}

fetchCourses();


  api
    .get("/home-page/get-image")
    .then((response) => {
      if (response.data.status) {
        setHeroImage(response.data.data.imageUrl);
      }
    })
    .catch((error) => {
      console.error("Failed to fetch hero image:", error);
    });
}, []);

  return (
    <div className="min-h-[70vh] bg-slate-50">
      {/* Hero Section */}
      <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
        <div className="space-y-6">
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Medical Counselling{" "}
            <span className="inline-block animate-pulse text-blue-600">
              Platform...
            </span>
          </h1>

          <p className="text-base leading-7 text-slate-600 sm:text-lg">
            How will students be assisted with the college and admission
            process?
          </p>

          <button
            type="button"
            onClick={() => {
              document
                .getElementById("featured-colleges")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
            className="rounded-lg bg-blue-600 px-7 py-3 font-semibold text-white shadow-md transition hover:bg-blue-700"
          >
            Get Started
          </button>
        </div>

        {/* Hero Image */}
        <div className="w-full overflow-hidden rounded-2xl bg-white shadow-md">
          {heroImage ? (
            <img
              src={heroImage}
              alt="Medical counselling"
              className="block h-64 w-full object-cover sm:h-80 lg:h-96"
            />
          ) : (
            <div className="flex h-64 items-center justify-center sm:h-80 lg:h-96">
              <p className="text-slate-500">Loading image...</p>
            </div>
          )}
        </div>
      </div>

      {/* How We Help Students */}
      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              How We Help Students
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-slate-600">
              We help students explore medical colleges and understand the
              admission and counselling process.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Card 1 */}
            <Link
              href="/college"
              className="block rounded-2xl border border-slate-200 bg-slate-50 p-8 transition duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100 text-2xl">
                🎓
              </div>

              <h3 className="mb-3 text-xl font-semibold text-slate-900">
                Explore Colleges
              </h3>

              <p className="leading-7 text-slate-600">
                Explore medical colleges and learn about their courses,
                facilities, and admission options.
              </p>
            </Link>

            {/* Card 2 */}
            <Link
              href="/admission-guidance"
              className="block rounded-2xl border border-slate-200 bg-slate-50 p-8 transition duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-green-100 text-2xl">
                📋
              </div>

              <h3 className="mb-3 text-xl font-semibold text-slate-900">
                Admission Guidance
              </h3>

              <p className="leading-7 text-slate-600">
                Understand the admission process, counselling steps, and
                important information for your journey.
              </p>
            </Link>

            {/* Card 3 */}
            <Link
              href="/college"
              className="block rounded-2xl border border-slate-200 bg-slate-50 p-8 transition duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-purple-100 text-2xl">
                🏥
              </div>

              <h3 className="mb-3 text-xl font-semibold text-slate-900">
                Choose Your College
              </h3>

              <p className="leading-7 text-slate-600">
                Compare available college information and explore options
                that match your preferences.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Colleges */}
      <section
        id="featured-colleges"
        className="bg-slate-50 px-6 py-16"
      >
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-slate-900">
            Featured Medical Colleges
          </h2>

          <p className="mt-3 text-slate-600">
            Explore medical colleges and find the right college for you.
          </p>

{/* Loading State */}
{loadingColleges && (
  <p className="mt-8 text-center text-slate-500">
    Loading medical colleges...
  </p>
)}

{/* Error State */}
{!loadingColleges && collegeError && (
  <p className="mt-8 rounded-lg bg-red-50 p-4 text-center text-red-600">
    {collegeError}
  </p>
)}

{/* Empty State */}
{!loadingColleges &&
  !collegeError &&
  colleges.length === 0 && (
    <p className="mt-8 rounded-lg bg-white p-6 text-center text-slate-500">
      No medical colleges are available right now.
    </p>
  )}
  {!loadingColleges && !collegeError && colleges.length > 0 && (        
<div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
  {colleges.map((college) => (
    <div
      key={college._id}
      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl"
    >
      <div className="h-2 bg-blue-600 transition-colors duration-300 group-hover:bg-indigo-600" />

      <div className="p-6">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl transition-colors group-hover:bg-blue-100">
          🏥
        </div>

        <h3 className="text-xl font-bold text-slate-900 transition-colors group-hover:text-blue-700">
          {college.name}
        </h3>

        <p className="mt-3 flex items-center gap-2 text-sm text-slate-600">
          <span>📍</span>
          <span>
            {[college.location?.city, college.location?.state]
              .filter(Boolean)
              .join(", ") || "Location not available"}
          </span>
        </p>

        <Link
          href={`/college/${college.slug}`}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          View Details
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  ))}
</div>
  )}

          <div className="mt-6">
            <Link
              href="/college"
              className="inline-block rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
            >
              View All Colleges
            </Link>
          </div>
        </div>
      </section>

     
{/* Featured Courses */}
<section id="featured-courses" className="bg-white px-6 py-16">
  <div className="mx-auto max-w-6xl">
    <h2 className="text-3xl font-bold text-slate-900">
      Featured Medical Courses
    </h2>

    <p className="mt-3 text-slate-600">
      Explore courses, understand their duration, and discover the
      degree and stream associated with each course.
    </p>

    {loadingCourses && (
      <p className="mt-8 text-center text-slate-500">
        Loading medical courses...
      </p>
    )}

    {!loadingCourses && courseError && (
      <p className="mt-8 rounded-lg bg-red-50 p-4 text-center text-red-600">
        {courseError}
      </p>
    )}

    {!loadingCourses && !courseError && courses.length === 0 && (
      <p className="mt-8 rounded-lg bg-slate-50 p-6 text-center text-slate-500">
        No medical courses are available right now.
      </p>
    )}

    {!loadingCourses && !courseError && courses.length > 0 && (
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <div
            key={course._id}
            className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl"
          >
            <div className="h-2 bg-indigo-600 transition-colors group-hover:bg-blue-600" />

            <div className="p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-2xl">
                📚
              </div>

              <h3 className="text-xl font-bold text-slate-900 transition-colors group-hover:text-blue-700">
                {course.name}
              </h3>

              {course.shortName && (
                <p className="mt-1 text-sm font-medium text-indigo-600">
                  {course.shortName}
                </p>
              )}

              {course.degree?.name && (
                <p className="mt-4 text-sm text-slate-600">
                  <span className="font-semibold">Degree:</span>{" "}
                  {course.degree.name}
                </p>
              )}

              {course.stream?.name && (
                <p className="mt-2 text-sm text-slate-600">
                  <span className="font-semibold">Stream:</span>{" "}
                  {course.stream.name}
                </p>
              )}

              {course.duration?.value != null && (
                <p className="mt-2 text-sm text-slate-600">
                  <span className="font-semibold">Duration:</span>{" "}
                  {course.duration.value} {course.duration.unit || "years"}
                </p>
              )}

              {course.description && (
                <p className="mt-4 line-clamp-3 leading-6 text-slate-600">
                  {course.description}
                </p>
              )}

              <Link
                href={`/course/${course.slug}`}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                View Details
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        ))}
      </div>
    )}

    <div className="mt-6">
      <Link
        href="/course"
        className="inline-block rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
      >
        View All Courses
      </Link>
    </div>
  </div>
</section>


{/* Explore More Colleges CTA */}
<section className="px-6 py-16">
  <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 to-indigo-700 px-8 py-12 text-center shadow-lg sm:px-12">
    <h2 className="text-3xl font-bold text-white sm:text-4xl">
      Find the Right Medical College for You
    </h2>

    <p className="mx-auto mt-4 max-w-2xl leading-7 text-blue-100">
      Explore available medical colleges, compare your options, and take
      the next step toward your medical career.
    </p>

    <Link
      href="/college"
      className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-blue-700 transition duration-300 hover:-translate-y-1 hover:bg-blue-50 hover:shadow-md"
    >
      Explore All Colleges
      <span aria-hidden="true">→</span>
    </Link>
  </div>
</section>
    
    </div>
  );
}
