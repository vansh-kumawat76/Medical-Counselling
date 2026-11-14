
"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import api from "../src/lib/axios";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "react-toastify";
import axios from "axios";
import { useDispatch } from "react-redux";
import { setCurrentUser } from "../src/redux/authSlice";

type College = {
  _id: string;
  name: string;
  slug: string;
  logo: string;
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
  const dispatch = useDispatch();

  const [colleges, setColleges] = useState<College[]>([]);
  const [heroImage, setHeroImage] = useState("");
  const [loadingColleges, setLoadingColleges] = useState(true);
  const [collegeError, setCollegeError] = useState("");

  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [courseError, setCourseError] = useState("");

  // Login Modal States
  const [showLogin, setShowLogin] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [redirectPath, setRedirectPath] = useState("/");

  // Open Login Popup Before Viewing Details
  const openDetails = (path: string) => {
    const token = localStorage.getItem("token");

    if (!token) {
      setRedirectPath(path);
      setShowLoginForm(false);
      setShowLogin(true);
      return;
    }

    window.location.href = path;
  };

  // Close Login Popup
  const closeLoginPopup = () => {
    if (loginLoading) return;

    setShowLogin(false);
    setShowLoginForm(false);
  };

  // Home Page Login Handler
  const handleHomeLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    try {
      setLoginLoading(true);

      const { data } = await api.post(
        "/login-user",
        {
          email,
          password,
          portal: "user",
        },
        {
          withCredentials: true,
        }
      );

      if (!data.status || !data.token) {
        toast.error(data.message || "Login failed");
        return;
      }

      const currentUser = {
        email: data.emailVerify?.email ?? email,
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

      setShowLogin(false);
      setShowLoginForm(false);

      window.location.href = redirectPath;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message || "Unable to login"
        );
      } else {
        toast.error("Something went wrong!");
      }
    } finally {
      setLoginLoading(false);
    }
  };

  useEffect(() => {
    async function fetchColleges() {
      setLoadingColleges(true);
      setCollegeError("");

      try {
        const response = await api.get("/college/Get-All-Colleges?limit=3");

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

    fetchColleges();
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
      <motion.div
        initial={{ opacity: 0, y: 35 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2"
      >
        {/* Hero Content */}
        <motion.div
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="space-y-6"
        >
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
        </motion.div>

        {/* Hero Image */}
        <motion.div
          initial={{ opacity: 0, x: 60, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.3 }}
          className="w-full overflow-hidden rounded-2xl bg-white shadow-md"
        >
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
        </motion.div>
      </motion.div>

      {/* How We Help Students */}
      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7 }}
            className="mb-12 text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              How We Help Students
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-slate-600">
              We help students explore medical colleges and understand the
              admission and counselling process.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Card 1 */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              whileHover={{ y: -10, scale: 1.02 }}
            >
              <Link
                href="/college"
                className="block h-full rounded-2xl border border-slate-200 bg-slate-50 p-8 transition duration-300 hover:shadow-lg"
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
            </motion.div>

            {/* Card 2 */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{ y: -10, scale: 1.02 }}
            >
              <Link
                href="/admission-guidance"
                className="block h-full rounded-2xl border border-slate-200 bg-slate-50 p-8 transition duration-300 hover:shadow-lg"
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
            </motion.div>

            {/* Card 3 */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              whileHover={{ y: -10, scale: 1.02 }}
            >
              <Link
                href="/college"
                className="block h-full rounded-2xl border border-slate-200 bg-slate-50 p-8 transition duration-300 hover:shadow-lg"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-purple-100 text-2xl">
                  🏥
                </div>

                <h3 className="mb-3 text-xl font-semibold text-slate-900">
                  Choose Your College
                </h3>

                <p className="leading-7 text-slate-600">
                  Compare available college information and explore options that
                  match your preferences.
                </p>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Colleges */}
      <section id="featured-colleges" className="bg-slate-50 px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            {/* Heading and Button */}
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-3xl font-bold text-slate-900">
                Featured Medical Colleges
              </h2>

              <button
                type="button"
                onClick={() => openDetails("/college")}
                className="shrink-0 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                View More Colleges
              </button>
            </div>

            <p className="mt-3 text-slate-600">
              Explore medical colleges and find the right college for you.
            </p>
          </motion.div>

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
          {!loadingColleges && !collegeError && colleges.length === 0 && (
            <p className="mt-8 rounded-lg bg-white p-6 text-center text-slate-500">
              No medical colleges are available right now.
            </p>
          )}

          {/* College Cards */}
          {!loadingColleges && !collegeError && colleges.length > 0 && (
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {colleges.map((college, index) => (
                <motion.div
                  key={college._id}
                  initial={{ opacity: 0, y: 45 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{
                    duration: 0.6,
                    delay: index * 0.15,
                  }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:border-blue-300 hover:shadow-xl"
                >
                  <div className="h-2 bg-blue-600 transition-colors duration-300 group-hover:bg-indigo-600" />

                  <div className="p-6">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-2">
                      {college.logo ? (
                        <img
                          src={college.logo}
                          alt={`${college.name} logo`}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <span className="text-3xl">🏥</span>
                      )}
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

                    <button
                      type="button"
                      onClick={() =>
                        openDetails(`/college/${college.slug}`)
                      }
                      className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      View More
                      <span aria-hidden="true">→</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Courses */}
      <section id="featured-courses" className="bg-white px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            {/* Heading and Button */}
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-3xl font-bold text-slate-900">
                Featured Medical Courses
              </h2>

              <button
                type="button"
                onClick={() => openDetails("/course")}
                className="shrink-0 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                View More Courses
              </button>
            </div>

            <p className="mt-3 text-slate-600">
              Explore courses, understand their duration, and discover the
              degree and stream associated with each course.
            </p>
          </motion.div>

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
              {courses.map((course, index) => (
                <motion.div
                  key={course._id}
                  initial={{ opacity: 0, y: 45 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{
                    duration: 0.6,
                    delay: index * 0.15,
                  }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:border-blue-300 hover:shadow-xl"
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
                        {course.duration.value}{" "}
                        {course.duration.unit || "years"}
                      </p>
                    )}

                    {course.description && (
                      <p className="mt-4 line-clamp-3 leading-6 text-slate-600">
                        {course.description}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        openDetails(`/course/${course.slug}`)
                      }
                      className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      View More
                      <span aria-hidden="true">→</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Explore More Colleges CTA */}
      <section className="px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.96 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 to-indigo-700 px-8 py-12 text-center shadow-lg sm:px-12"
        >
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
        </motion.div>
      </section>

      {/* Home Page Two-Step Login Popup */}
      <AnimatePresence>
        {showLogin && (
          <motion.div
            key="home-login-backdrop"
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
                /* First Popup - Login Required */
                <div className="p-8 text-center">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-3xl text-blue-700">
                    🎓
                  </div>

                  <h2 className="text-2xl font-extrabold text-slate-900">
                    Login Required
                  </h2>

                  <p className="mt-3 leading-7 text-slate-500">
                    Please login to view complete details and explore more
                    information about your selected college or course.
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
                /* Second Popup - Login Form */
                <div className="p-7 sm:p-8">
                  <div className="mb-6 flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-extrabold text-slate-900">
                        Welcome Back!
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        Login to view your selected details.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={closeLoginPopup}
                      disabled={loginLoading}
                      aria-label="Close login popup"
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-xl text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
                    >
                      &times;
                    </button>
                  </div>

                  <form onSubmit={handleHomeLogin} className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Email Address
                      </label>

                      <input
                        type="email"
                        name="email"
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
                        name="password"
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
    </div>
  );
}
