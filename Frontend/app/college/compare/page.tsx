
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import api from "../../../src/lib/axios";

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

  const filteredColleges = useMemo(() => {
    return colleges.filter((college) =>
      college.name.toLowerCase().includes(search.trim().toLowerCase())
    );
  }, [colleges, search]);

  const selectedColleges = selectedIds
    .map((id) => colleges.find((college) => college._id === id))
    .filter((college): college is College => Boolean(college));

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

  const getUniversity = (college: College) => {
    return typeof college.university === "object"
      ? college.university?.name || "—"
      : college.university || "—";
  };

  const getLocation = (college: College) => {
    return [
      college.location?.city,
      college.location?.state,
      college.location?.country,
    ]
      .filter(Boolean)
      .join(", ") || college.location?.address || "—";
  };

  const comparisonRows: {
    label: string;
    value: (college: College) => React.ReactNode;
  }[] = [
    {
      label: "College Type",
      value: (college) => college.collegeType || "—",
    },
    {
      label: "Ownership",
      value: (college) => college.ownership || "—",
    },
    {
      label: "University",
      value: (college) => getUniversity(college),
    },
    {
      label: "Established Year",
      value: (college) => college.establishedYear || "—",
    },
    {
      label: "Location",
      value: (college) => getLocation(college),
    },
    {
      label: "Rating",
      value: (college) =>
        college.rating?.average != null
          ? `★ ${college.rating.average}${
              college.rating.count != null
                ? ` (${college.rating.count} reviews)`
                : ""
            }`
          : "Not available",
    },
    {
      label: "Website",
      value: (college) =>
        college.website ? (
          <a
            href={college.website}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => event.stopPropagation()}
            className="break-all text-cyan-400 underline hover:text-cyan-300"
          >
            Visit Website ↗
          </a>
        ) : (
          "—"
        ),
    },
    {
      label: "Description",
      value: (college) => college.description || "—",
    },
  ];

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
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
            Make the right choice
          </p>

          <h1 className="text-3xl font-bold sm:text-4xl">
            Compare Colleges
          </h1>

          <p className="mt-3 text-slate-400">
            Compare up to 3 colleges side by side and choose the right one.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          {/* College search and selection */}
          <aside className="h-fit rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Find Colleges</h2>
              <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                {selectedIds.length}/3 selected
              </span>
            </div>

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search college name..."
              className="mb-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
            />

            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-slate-400">
                Available colleges
              </span>
              <span className="text-xs text-slate-500">
                {filteredColleges.length} found
              </span>
            </div>

            <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
              {filteredColleges.map((college) => {
                const selected = selectedIds.includes(college._id);
                const limitReached = selectedIds.length >= 3 && !selected;

                return (
                  <button
                    key={college._id}
                    type="button"
                    disabled={limitReached}
                    onClick={() => toggleCollege(college._id)}
                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                      selected
                        ? "border-cyan-400 bg-cyan-500/10"
                        : "border-slate-800 bg-slate-950 hover:border-slate-600"
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
                        className="h-12 w-12 shrink-0 rounded-lg bg-white object-contain p-1"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-xl font-bold text-cyan-300">
                        {college.name.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        {college.name}
                      </span>
                      <span className="mt-1 block truncate text-xs text-slate-400">
                        {getLocation(college)}
                      </span>
                    </span>

                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs ${
                        selected
                          ? "border-cyan-400 bg-cyan-400 text-slate-950"
                          : "border-slate-600 text-slate-400"
                      }`}
                    >
                      {selected ? "✓" : "+"}
                    </span>
                  </button>
                );
              })}

              {filteredColleges.length === 0 && (
                <p className="py-8 text-center text-sm text-slate-500">
                  Koi college nahi mila.
                </p>
              )}
            </div>

            {selectedIds.length === 3 && (
              <p className="mt-4 text-xs text-amber-300">
                Maximum 3 colleges select ho chuke hain.
              </p>
            )}
          </aside>

          {/* Comparison area */}
          <section className="min-w-0">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  Comparison Overview
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  {selectedColleges.length} of 3 colleges selected
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedIds([])}
                disabled={selectedIds.length === 0}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-red-400 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Clear Selection
              </button>
            </div>

            {selectedColleges.length === 0 ? (
              <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-8 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10 text-3xl">
                  ⚖
                </div>

                <h3 className="text-xl font-semibold">
                  Select Colleges to Compare
                </h3>

                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">
                  Search for colleges on the left and select up to 3 to see
                  their details side by side.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
                {/* College headers */}
                <div
                  className="grid border-b border-slate-800"
                  style={{
                    gridTemplateColumns: `140px repeat(${selectedColleges.length}, minmax(180px, 1fr))`,
                  }}
                >
                  <div className="flex items-center p-3 text-xs font-semibold uppercase tracking-wider text-slate-500 sm:p-4">
                    College details
                  </div>

                  {selectedColleges.map((college) => (
                    <div
                      key={college._id}
                      className="min-w-0 border-l border-slate-800 p-3 sm:p-4"
                    >
                      <div className="mb-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() => toggleCollege(college._id)}
                          aria-label={`Remove ${college.name}`}
                          className="rounded-md px-2 py-1 text-xs text-slate-400 hover:bg-red-500/10 hover:text-red-300"
                        >
                          ✕ Remove
                        </button>
                      </div>

                      <div className="mb-3 flex h-20 items-center justify-center rounded-xl bg-slate-950 p-2">
                        {college.logo ? (
                          <img
                            src={college.logo}
                            alt={`${college.name} logo`}
                            className="h-full max-w-full object-contain"
                          />
                        ) : (
                          <span className="text-3xl font-bold text-cyan-300">
                            {college.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>

                      <h3 className="break-words text-sm font-bold text-white sm:text-base">
                        {college.name}
                      </h3>

                      {college.slug && (
                        <a
                          href={`/college/${college.slug}`}
                          className="mt-2 inline-block text-xs font-semibold text-cyan-400 hover:text-cyan-300"
                        >
                          View Details ↗
                        </a>
                      )}
                    </div>
                  ))}
                </div>

                {/* Comparison rows */}
                {comparisonRows.map((row, index) => (
                  <div
                    key={row.label}
                    className={`grid border-b border-slate-800 last:border-b-0 ${
                      index % 2 === 0 ? "bg-slate-900" : "bg-slate-950/50"
                    }`}
                    style={{
                      gridTemplateColumns: `140px repeat(${selectedColleges.length}, minmax(180px, 1fr))`,
                    }}
                  >
                    <div className="flex items-start p-3 text-xs font-semibold text-slate-400 sm:p-4 sm:text-sm">
                      {row.label}
                    </div>

                    {selectedColleges.map((college) => (
                      <div
                        key={college._id}
                        className="min-w-0 border-l border-slate-800 p-3 text-sm leading-6 text-slate-200 sm:p-4"
                      >
                        {row.value(college)}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            <p className="mt-4 text-xs leading-5 text-slate-500">
              Note: Fees, course availability, seats aur cutoffs tabhi compare
              kiye ja sakte hain jab ye details backend mein available hon.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-950 p-8 text-center text-cyan-400">
          Comparison page load ho raha hai...
        </main>
      }
    >
      <CollegeComparison />
    </Suspense>
  );
}
