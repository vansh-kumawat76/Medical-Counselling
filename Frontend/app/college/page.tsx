
"use client";

import { useEffect, useState, type FormEvent } from "react";
import api from "../../src/lib/axios";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { setCurrentUser } from "../../src/redux/authSlice";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "motion/react";

import {
  FiSearch,
  FiMapPin,
  FiGitMerge,
  FiArrowRight,
  FiBookOpen,
  FiCalendar,
  FiStar,
  FiAlertCircle,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

interface College {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
  backgroundImage?: string;
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

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalColleges, setTotalColleges] = useState(0);

  const LIMIT = 12;

  const router = useRouter();
  const dispatch = useDispatch();

  // Login Popup States
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);

  // Selected College Details
  const [selectedCollegeSlug, setSelectedCollegeSlug] = useState("");

  // Compare College States
  const [openCompareAfterLogin, setOpenCompareAfterLogin] = useState(false);
  const [selectedCompareCollegeId, setSelectedCompareCollegeId] = useState("");

  // Login Form States
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Fetch Colleges With Pagination
  useEffect(() => {
    const fetchColleges = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        const response = await api.get(
          `/college/Get-All-Colleges?page=${currentPage}&limit=${LIMIT}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.status) {
          const collegeData = response.data.colleges || [];

          setColleges(collegeData);

          const pagination = response.data.pagination || {};

          const total =
            response.data.totalColleges ??
            response.data.total ??
            pagination.totalColleges ??
            pagination.total ??
            collegeData.length;

          const pages =
            response.data.totalPages ??
            pagination.totalPages ??
            Math.ceil(total / LIMIT);

          setTotalColleges(total);
          setTotalPages(Math.max(1, pages));
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
  }, [currentPage]);

  // Open Login Popup for College Details
  const changeRoute = (slug: string) => {
    setSelectedCollegeSlug(slug);

    // Compare destination clear
    setOpenCompareAfterLogin(false);
    setSelectedCompareCollegeId("");

    setShowLoginForm(false);
    setShowLoginPopup(true);
  };

  // Open Login Popup for College Comparison
  const openComparePage = (collegeId?: string) => {
    // College details destination clear
    setSelectedCollegeSlug("");

    // Save selected college ID for comparison
    setSelectedCompareCollegeId(collegeId || "");

    setOpenCompareAfterLogin(true);

    setShowLoginForm(false);
    setShowLoginPopup(true);
  };

  // Close Login Popup
  const closeLoginPopup = () => {
    if (loginLoading) return;

    setShowLoginPopup(false);
    setShowLoginForm(false);

    setLoginEmail("");
    setLoginPassword("");

    // Clear pending navigation
    setSelectedCollegeSlug("");
    setSelectedCompareCollegeId("");
    setOpenCompareAfterLogin(false);
  };

  // College Login
  const handleCollegeLogin = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    try {
      setLoginLoading(true);

      const { data } = await api.post(
        "/login-user",
        {
          email: loginEmail.trim(),
          password: loginPassword,
          portal: "user",
        },
        {
          withCredentials: true,
        }
      );

      if (!data.status) {
        toast.error(data.message || "Login failed!");
        return;
      }

      if (!data.token) {
        toast.error("Login token was not received from server.");
        return;
      }

      const loggedInEmail =
        data.emailVerify?.email ?? loginEmail.trim();

      const currentUser = {
        email: loggedInEmail,
        role: data.emailVerify?.role?.role ?? "",
        permissions:
          data.emailVerify?.role?.permissions?.map(
            (permission: { name: string }) => permission.name
          ) ?? [],
      };

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(currentUser));

      dispatch(setCurrentUser(currentUser));

      toast.success("Login successful!");

      // Close Login Popup
      setShowLoginPopup(false);
      setShowLoginForm(false);

      setLoginEmail("");
      setLoginPassword("");

      // Navigate according to selected action
      if (openCompareAfterLogin) {
        const compareUrl = selectedCompareCollegeId
          ? `/college/compare?college=${encodeURIComponent(
              selectedCompareCollegeId
            )}`
          : "/college/compare";

        setOpenCompareAfterLogin(false);
        setSelectedCompareCollegeId("");

        router.push(compareUrl);
      } else {
        const collegeUrl = `/college/${selectedCollegeSlug}`;

        setSelectedCollegeSlug("");

        router.push(collegeUrl);
      }
    } catch (error: any) {
      console.error("College Login Error:", error);

      toast.error(
        error.response?.data?.message ||
          "Unable to login. Please try again."
      );
    } finally {
      setLoginLoading(false);
    }
  };

  // Search Colleges
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
    ].some((value) =>
      value?.toLowerCase().includes(searchText)
    );
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
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search college, university or location..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <p className="text-sm font-medium text-slate-500">
            Showing{" "}
            <span className="font-bold text-blue-600">
              {filteredColleges.length}
            </span>{" "}
            of{" "}
            <span className="font-bold text-slate-800">
              {totalColleges}
            </span>{" "}
            colleges
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
              {totalColleges === 0
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

                    {/* College Logo */}
                    <div className="relative h-56 w-full overflow-hidden border-b border-slate-100 bg-white">

                      {college.logo ? (
                        <img
                          src={college.logo}
                          alt={`${college.name} logo`}
                          className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50 text-6xl font-extrabold text-blue-600">
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex flex-wrap items-center justify-center gap-4">

            <button
              type="button"
              disabled={currentPage === 1 || loading}
              onClick={() => {
                setCurrentPage((prev) => Math.max(1, prev - 1));

                document.getElementById("all-colleges")?.scrollIntoView({
                  behavior: "smooth",
                });
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:border-blue-600 hover:bg-blue-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FiChevronLeft />
              Previous
            </button>

            <span className="rounded-xl bg-blue-50 px-5 py-3 font-semibold text-blue-700">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages || loading}
              onClick={() => {
                setCurrentPage((prev) =>
                  Math.min(totalPages, prev + 1)
                );

                document.getElementById("all-colleges")?.scrollIntoView({
                  behavior: "smooth",
                });
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <FiChevronRight />
            </button>

          </div>
        )}

        {/* Pagination Information */}
        {totalColleges > 0 && (
          <p className="mt-5 text-center text-sm text-slate-400">
            Page {currentPage} · {colleges.length} colleges loaded
          </p>
        )}

      </section>

      {/* Login Required / Login Form Popup */}
      <AnimatePresence>
        {showLoginPopup && (
          <motion.div
            key="college-login-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm"
            onClick={closeLoginPopup}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
            >
              {!showLoginForm ? (
                <div className="p-8 text-center">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-3xl text-blue-700">
                    <FiBookOpen />
                  </div>

                  <h2 className="text-2xl font-extrabold text-slate-900">
                    Login Required
                  </h2>

                  <p className="mt-3 leading-7 text-slate-500">
                    {openCompareAfterLogin
                      ? "Please login to compare colleges and explore their details."
                      : "Please login to view complete college details and explore more information about this college."}
                  </p>

                  <div className="mt-7 flex gap-3">
                    <button
                      type="button"
                      onClick={closeLoginPopup}
                      className="flex-1 rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowLoginForm(true)}
                      className="flex-1 rounded-xl bg-gradient-to-r from-blue-700 to-cyan-600 px-5 py-3 font-bold text-white transition hover:opacity-90"
                    >
                      Login
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-7 sm:p-8">
                  <div className="mb-6 flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-extrabold text-slate-900">
                        Welcome Back!
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        {openCompareAfterLogin
                          ? "Login to compare colleges."
                          : "Login to view your selected college."}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={closeLoginPopup}
                      disabled={loginLoading}
                      aria-label="Close login popup"
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-xl text-slate-500 transition hover:bg-slate-100"
                    >
                      &times;
                    </button>
                  </div>

                  <form onSubmit={handleCollegeLogin} className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Email Address
                      </label>

                      <input
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="Enter your email"
                        autoComplete="email"
                        required
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Password
                      </label>

                      <input
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        required
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loginLoading}
                      className="w-full rounded-xl bg-gradient-to-r from-blue-700 to-cyan-600 px-5 py-3.5 font-bold text-white shadow-lg shadow-blue-200 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loginLoading ? "Please wait..." : "Login"}
                    </button>

                    <button
                      type="button"
                      disabled={loginLoading}
                      onClick={() => setShowLoginForm(false)}
                      className="w-full py-2 text-sm font-semibold text-slate-500 transition hover:text-blue-700 disabled:opacity-50"
                    >
                      Back
                    </button>
                  </form>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
