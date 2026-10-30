
"use client";

import { useEffect, useState } from "react";
import api from "../../src/lib/axios";
import { useRouter } from "next/navigation";
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
  FiAlertCircle,
  FiRefreshCw,
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

export default function CollegePage() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

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

  // College detail page
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

  // Search colleges
  const filteredColleges = colleges.filter((college) => {
    const university =
      typeof college.university === "object"
        ? college.university?.name
        : college.university;

    const searchText = search.toLowerCase().trim();

    return [
      college.name,
      college.collegeType,
      college.ownership,
      university,
      college.location?.city,
      college.location?.state,
      college.location?.country,
    ].some((value) => value?.toLowerCase().includes(searchText));
  });

  // Loading UI
  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-7xl text-center">
          <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
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
        <div className="w-full max-w-lg rounded-3xl border border-red-100 bg-white p-10 text-center shadow-lg">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <FiAlertCircle size={30} />
          </div>

          <h2 className="mt-5 text-2xl font-bold text-slate-900">
            Something Went Wrong
          </h2>

          <p className="mt-3 text-sm leading-7 text-slate-500">
            {error}
          </p>

          <button
            onClick={() => window.location.reload()}
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            <FiRefreshCw />
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-slate-50 text-slate-900">

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-800 to-blue-600 px-6 py-20 md:py-24">

        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-cyan-300/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">

          <div className="grid items-center gap-12 md:grid-cols-2">

            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold text-cyan-200 backdrop-blur-md">
                <FiBookOpen />
                Find Your Future
              </span>

              <h1 className="mt-7 text-4xl font-extrabold leading-tight text-white md:text-5xl lg:text-6xl">
                Explore Your
                <span className="block text-cyan-300">
                  Dream College
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-8 text-blue-100 md:text-lg">
                Discover top medical colleges, explore their details and
                compare institutions to make the right decision for your
                medical career.
              </p>

              <div className="mt-9 flex flex-wrap gap-4">
                <button
                  onClick={() => {
                    document.getElementById("all-colleges")?.scrollIntoView({
                      behavior: "smooth",
                    });
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-blue-800 transition hover:-translate-y-1 hover:bg-cyan-100"
                >
                  Explore Colleges
                  <FiArrowRight />
                </button>

                <button
                  onClick={() => openComparePage()}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-6 py-3 font-semibold text-white backdrop-blur-sm transition hover:bg-white hover:text-blue-800"
                >
                  <FiGitMerge />
                  Compare Colleges
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.85, x: 40 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.9 }}
              className="relative hidden md:block"
            >
              <div className="rounded-[2rem] border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur-md">
                <div className="rounded-3xl bg-white p-8">
                  <div className="flex h-48 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-100">
                    <div className="rounded-full bg-white p-8 shadow-lg">
                      <FiBookOpen size={75} className="text-blue-600" />
                    </div>
                  </div>

                  <h3 className="mt-6 text-2xl font-bold text-slate-900">
                    Your Career, Your Choice
                  </h3>

                  <p className="mt-3 leading-7 text-slate-500">
                    Explore institutions and take an informed step towards
                    your medical future.
                  </p>

                  <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-blue-600">
                    <FiStar />
                    Explore. Compare. Decide.
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-5 -left-8 rounded-2xl bg-white px-5 py-4 shadow-xl">
                <p className="text-sm font-bold text-slate-900">
                  Find the Right College
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Start your journey today
                </p>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* College Listing */}
      <section
        id="all-colleges"
        className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-20"
      >

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
              Discover Institutions
            </span>

            <h2 className="mt-5 text-3xl font-extrabold text-slate-900 md:text-4xl">
              Explore All Colleges
            </h2>

            <p className="mt-3 text-slate-500">
              Find the institution that matches your career goals.
            </p>
          </div>

          <button
            type="button"
            onClick={() => openComparePage()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-1 hover:bg-blue-700"
          >
            <FiGitMerge size={18} />
            Compare Colleges
          </button>
        </motion.div>

        {/* Search and Count */}
        <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">

          <div className="relative w-full sm:max-w-md">
            <FiSearch
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={19}
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search college, university or location..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <p className="text-sm font-medium text-slate-500">
            Showing{" "}
            <span className="font-bold text-blue-600">
              {filteredColleges.length}
            </span>{" "}
            of {colleges.length} colleges
          </p>

        </div>

        {/* College Cards */}
        {filteredColleges.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <FiSearch size={30} />
            </div>

            <h3 className="mt-5 text-2xl font-bold text-slate-900">
              No Colleges Found
            </h3>

            <p className="mt-3 text-slate-500">
              {colleges.length === 0
                ? "Abhi backend mein koi college available nahi hai."
                : "Try searching with another college name or location."}
            </p>

            {search && (
              <button
                onClick={() => setSearch("")}
                className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                Clear Search
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3"
          >
            <AnimatePresence mode="popLayout">
              {filteredColleges.map((college, index) => {
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
                  <motion.article
                    key={college._id}
                    layout
                    initial={{ opacity: 0, y: 35 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{
                      duration: 0.45,
                      delay: index * 0.05,
                    }}
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
                    whileHover={{ y: -8 }}
                    className="group cursor-pointer overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-shadow duration-300 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {/* Logo Section */}
                    <div className="relative flex h-48 items-center justify-center overflow-hidden border-b border-slate-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6">

                      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-100/70 blur-2xl transition-transform duration-500 group-hover:scale-150" />

                      {college.logo ? (
                        <img
                          src={college.logo}
                          alt={`${college.name} logo`}
                          className="relative h-28 w-28 rounded-2xl bg-white object-contain p-2 shadow-md transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="relative flex h-28 w-28 items-center justify-center rounded-2xl border border-blue-100 bg-white text-4xl font-extrabold text-blue-600 shadow-md transition-transform duration-500 group-hover:scale-110">
                          {college.name.charAt(0).toUpperCase()}
                        </div>
                      )}

                      {college.collegeType && (
                        <span className="absolute right-4 top-4 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold capitalize text-white shadow-md">
                          {college.collegeType}
                        </span>
                      )}
                    </div>

                    {/* College Details */}
                    <div className="p-6">

                      <div className="mb-4 flex flex-wrap gap-2">
                        {college.ownership && (
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold capitalize text-blue-700">
                            {college.ownership}
                          </span>
                        )}

                        {college.establishedYear && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                            <FiCalendar size={12} />
                            Est. {college.establishedYear}
                          </span>
                        )}
                      </div>

                      <h3 className="line-clamp-2 min-h-[56px] text-xl font-bold leading-7 text-slate-900 transition-colors group-hover:text-blue-600">
                        {college.name}
                      </h3>

                      {university && (
                        <p className="mt-3 flex items-start gap-2 text-sm text-slate-500">
                          <FiBookOpen className="mt-0.5 shrink-0 text-blue-500" />
                          <span className="line-clamp-2">
                            {university}
                          </span>
                        </p>
                      )}

                      {location && (
                        <p className="mt-3 flex items-start gap-2 text-sm text-slate-600">
                          <FiMapPin className="mt-0.5 shrink-0 text-blue-500" />
                          <span>{location}</span>
                        </p>
                      )}

                      {college.rating?.average !== undefined && (
                        <div className="mt-3 flex items-center gap-2 text-sm">
                          <FiStar className="fill-amber-400 text-amber-400" />
                          <span className="font-semibold text-slate-800">
                            {college.rating.average}
                          </span>
                          <span className="text-slate-400">
                            ({college.rating.count || 0} reviews)
                          </span>
                        </div>
                      )}

                      {college.description && (
                        <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-500">
                          {college.description}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="mt-6 border-t border-slate-100 pt-5">

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            openComparePage(college._id);
                          }}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700 transition hover:border-blue-600 hover:bg-blue-600 hover:text-white"
                        >
                          <FiGitMerge size={17} />
                          Compare College
                        </button>

                        <p className="mt-4 flex items-center justify-center gap-2 text-xs font-medium text-slate-400 transition group-hover:text-blue-600">
                          View College Details
                          <FiArrowRight />
                        </p>

                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </section>

      {/* Bottom CTA */}
      <section className="px-6 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mx-auto max-w-7xl rounded-3xl bg-gradient-to-r from-blue-800 to-blue-600 px-6 py-12 text-center text-white shadow-xl md:px-16 md:py-16"
        >
          <h2 className="text-3xl font-extrabold md:text-4xl">
            Find the Right College for Your Future
          </h2>

          <p className="mx-auto mt-5 max-w-2xl leading-7 text-blue-100">
            Explore your options, compare colleges and take a confident
            step towards your medical career.
          </p>

          <button
            onClick={() => openComparePage()}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3 font-bold text-blue-700 transition hover:-translate-y-1 hover:bg-cyan-100"
          >
            <FiGitMerge />
            Compare Now
            <FiArrowRight />
          </button>
        </motion.div>
      </section>

    </main>
  );
}
