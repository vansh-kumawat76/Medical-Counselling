
"use client";

import { useEffect, useState } from "react";
import api from "../../src/lib/axios";
import { useRouter } from "next/navigation";

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

export default function CollegePage() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

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
          setColleges(response.data.colleges || []);
        } else {
          setError("Colleges ka data fetch nahi ho paya.");
        }
      } catch (err) {
        console.error("College fetch error:", err);
        setError(
          "Colleges load nahi hue. Login aur backend server check karo."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchColleges();
  }, []);

  // Existing college detail page
  const changeRoute = (slug: string) => {
    router.push(`/college/${slug}`);
  };

  // College comparison page
  const openComparePage = (collegeId?: string) => {
    const url = collegeId
      ? `/college/compare?college=${encodeURIComponent(collegeId)}`
      : "/college/compare";

    router.push(url);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-center text-cyan-400">
        Colleges load ho rahe hain...
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-center text-red-400">
        {error}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Page heading */}
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
              Find Your Future
            </p>

            <h1 className="text-3xl font-bold sm:text-4xl">
              Explore Colleges
            </h1>

            <p className="mt-3 text-slate-400">
              Discover colleges and explore their details.
            </p>
          </div>

          <button
            type="button"
            onClick={() => openComparePage()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            <span aria-hidden="true">⚖</span>
            Compare Colleges
          </button>
        </div>

        <div className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
          <h2 className="text-lg font-semibold">All Colleges</h2>
        </div>

        {colleges.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
            <h3 className="text-xl font-semibold">No Colleges Found</h3>
            <p className="mt-2 text-slate-400">
              Abhi backend mein koi college available nahi hai.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {colleges.map((college) => {
              const location = [
                college.location?.city,
                college.location?.state,
                college.location?.country,
              ]
                .filter(Boolean)
                .join(", ");

              const university =
                typeof college.university === "object"
                  ? college.university?.name
                  : college.university;

              return (
                <article
                  key={college._id}
                  onClick={() => {
                    if (college.slug) {
                      changeRoute(college.slug);
                    }
                  }}
                  onKeyDown={(event) => {
                    if (
                      college.slug &&
                      (event.key === "Enter" || event.key === " ")
                    ) {
                      event.preventDefault();
                      changeRoute(college.slug);
                    }
                  }}
                  role="link"
                  tabIndex={college.slug ? 0 : -1}
                  aria-label={`View details for ${college.name}`}
                  className="group cursor-pointer overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 transition duration-300 hover:-translate-y-1 hover:border-cyan-500/60 hover:shadow-xl hover:shadow-cyan-950/30 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                >
                  {/* College logo */}
                  <div className="flex h-44 items-center justify-center border-b border-slate-800 bg-gradient-to-br from-slate-800 to-slate-950 p-6">
                    {college.logo ? (
                      <img
                        src={college.logo}
                        alt={`${college.name} logo`}
                        className="h-28 w-28 rounded-xl bg-white object-contain p-2"
                      />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 text-3xl font-bold text-cyan-300">
                        {college.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* College information */}
                  <div className="p-5">
                    <div className="mb-3 flex flex-wrap gap-2">
                      {college.collegeType && (
                        <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-medium capitalize text-cyan-300">
                          {college.collegeType}
                        </span>
                      )}

                      {college.ownership && (
                        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                          {college.ownership}
                        </span>
                      )}

                      {college.establishedYear && (
                        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                          Est. {college.establishedYear}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-bold transition group-hover:text-cyan-300">
                      {college.name}
                    </h3>

                    {university && (
                      <p className="mt-2 text-sm text-slate-400">
                        University: {university}
                      </p>
                    )}

                    {location && (
                      <p className="mt-3 flex items-start gap-2 text-sm text-slate-300">
                        <span className="text-cyan-400" aria-hidden="true">
                          📍
                        </span>
                        <span>{location}</span>
                      </p>
                    )}

                    {college.description && (
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-400">
                        {college.description}
                      </p>
                    )}

                    {/* Compare action */}
                    <div className="mt-5 border-t border-slate-800 pt-4">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openComparePage(college._id);
                        }}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-300 transition hover:border-cyan-400 hover:bg-cyan-500 hover:text-slate-950"
                      >
                        <span aria-hidden="true">⚖</span>
                        Compare College
                      </button>

                      <p className="mt-3 text-center text-xs text-slate-500">
                        Click the card to view college details
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
