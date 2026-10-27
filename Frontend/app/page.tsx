
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

export default function Header() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [heroImage, setHeroImage] = useState("");

  useEffect(() => {
    async function fetchColleges() {
      try {
        const response = await api.get(
          "/college/Get-All-Colleges?limit=3"
        );

        if (response.data.status) {
          setColleges(response.data.colleges);
        }
      } catch (error) {
        console.error("Failed to fetch colleges:", error);
      }
    }

    fetchColleges();

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
    <div className="min-h-[70vh] bg-slate-50 px-6 py-16">
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

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {colleges.map((college) => (
              <div
                key={college._id}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h3 className="text-xl font-bold text-slate-900">
                  {college.name}
                </h3>

                <p className="mt-2 text-slate-600">
                  {college.location?.city}, {college.location?.state}
                </p>

                <Link
                  href={`/college/${college.slug}`}
                  className="mt-5 inline-block rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700"
                >
                  View Details
                </Link>
              </div>
            ))}
          </div>

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
    </div>
  );
}
