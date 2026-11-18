
"use client";

import api from "../../../src/lib/axios";
import { useParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import toast, { Toaster } from "react-hot-toast";
import { motion } from "motion/react";

import {
  FiMapPin,
  FiGlobe,
  FiCalendar,
  FiBookOpen,
  FiExternalLink,
  FiInfo,
  FiArrowRight,
  FiAlertCircle,
  FiAward,
  FiStar,
  FiEdit3,
  FiX,
} from "react-icons/fi";

type College = {
  _id?: string;
  name?: string;
  collegeName?: string;
  shortName?: string;
  logo?: string;
  image?: string;
  backgroundImage?: string;
  collegeType?: string;
  location?: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
  };
  website?: string;
  establishedYear?: number;
  type?: string;
  description?: string;
  rating?: {
    average?: number;
    count?: number;
  };
  [key: string]: unknown;
};

type CollegeReview = {
  _id: string;
  student?: {
    _id: string;
    name?: string;
  };
  overallRating: number;
  department?: string;
  departmentRating?: number;
  facilities?: {
    hostel?: number;
    library?: number;
    laboratory?: number;
    classrooms?: number;
    canteen?: number;
    sports?: number;
    wifi?: number;
    transport?: number;
    cleanliness?: number;
    safety?: number;
  };
  reviewTitle: string;
  review: string;
  pros?: string;
  cons?: string;
  studyYear?: string;
  createdAt: string;
};

type CollegeCourse = {
  _id: string;
  course?: {
    name?: string;
    shortName?: string;
    code?: string;
    duration?: {
      value?: number;
      unit?: string;
    };
    stream?: string;
    degree?: string;
  };
  specialization?: {
    name?: string;
  } | null;
  duration?: number;
  totalSeats?: number;
  availableSeats?: number;
  mode?: string;
  admissionOpen?: boolean;
  applicationDeadline?: string;
  totalFees?: number;
  yearlyFees?: number;
  currency?: string;
  eligibility?: string;
  entranceExams?: {
    name?: string;
    shortName?: string;
  }[];
  scholarshipAvailable?: boolean;
  status?: string;
};

const initialReviewForm = {
  overallRating: 0,
  department: "",
  departmentRating: 0,
  facilities: {
    hostel: 0,
    library: 0,
    laboratory: 0,
    classrooms: 0,
    canteen: 0,
    sports: 0,
    wifi: 0,
    transport: 0,
    cleanliness: 0,
    safety: 0,
  },
  reviewTitle: "",
  review: "",
  pros: "",
  cons: "",
  studyYear: "",
};

const facilityLabels = [
  ["hostel", "Hostel"],
  ["library", "Library"],
  ["laboratory", "Laboratory"],
  ["classrooms", "Classrooms"],
  ["canteen", "Canteen"],
  ["sports", "Sports"],
  ["wifi", "Wi-Fi"],
  ["transport", "Transport"],
  ["cleanliness", "Cleanliness"],
  ["safety", "Safety"],
] as const;

function StarSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="text-2xl transition hover:scale-110"
          aria-label={`Rate ${star} out of 5`}
        >
          <FiStar
            className={
              star <= value
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }
          />
        </button>
      ))}
      <span className="ml-1 text-sm font-semibold text-gray-600">
        {value > 0 ? `${value}/5` : "Select rating"}
      </span>
    </div>
  );
}

function CollegeDetails() {
  const { slug } = useParams<{ slug: string }>();

  const [college, setCollege] = useState<College | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [collegeCourses, setCollegeCourses] = useState<CollegeCourse[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState("");

  const [reviews, setReviews] = useState<CollegeReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState("");

  const [isStudent, setIsStudent] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewForm, setReviewForm] = useState(initialReviewForm);

  // Check login and role
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    setIsLoggedIn(Boolean(token));

    if (token && user) {
      try {
        const parsedUser = JSON.parse(user);
        setIsStudent(parsedUser.role === "Student");
      } catch {
        setIsStudent(false);
      }
    }
  }, []);

  // Fetch college details and courses
  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(false);

        const response = await api.get(
          `/college/Get-One-Colleges/${slug}`
        );

        if (!active) return;

        const data =
          response.data?.college ??
          response.data?.data ??
          response.data;

        if (!data || typeof data !== "object") {
          throw new Error("Invalid college response");
        }

        setCollege(data as College);

        if (data._id) {
          try {
            setCoursesLoading(true);
            setCoursesError("");

            const token = localStorage.getItem("token");

            const courseResponse = await api.get(
              `/college-course/get-college-courses/${data._id}`,
              {
                headers: token
                  ? { Authorization: `Bearer ${token}` }
                  : {},
              }
            );

            if (!active) return;

            setCollegeCourses(courseResponse.data?.data || []);
          } catch (courseError) {
            if (!active) return;

            console.error("College courses fetch error:", courseError);
            setCoursesError("College courses load nahi ho paye.");
          } finally {
            if (active) setCoursesLoading(false);
          }
        }

        toast.success("College details loaded successfully!");
      } catch (err) {
        if (!active) return;

        console.error("College details error:", err);
        setError(true);
        toast.error("College details load nahi ho payi.");
      } finally {
        if (active) setLoading(false);
      }
    };

    if (slug) fetchData();

    return () => {
      active = false;
    };
  }, [slug]);

  // Fetch approved public reviews
  useEffect(() => {
    if (!college?._id) return;

    let active = true;

    const fetchReviews = async () => {
      try {
        setReviewsLoading(true);
        setReviewsError("");

        const response = await api.get(
          `/college-review/college/${college._id}`
        );

        if (!active) return;

        setReviews(
          response.data?.data ??
          response.data?.reviews ??
          []
        );
      } catch (err: any) {
        if (!active) return;

        console.error("College reviews error:", err);

        setReviewsError(
          err.response?.data?.message ||
          "Unable to load college reviews."
        );
      } finally {
        if (active) setReviewsLoading(false);
      }
    };

    fetchReviews();

    return () => {
      active = false;
    };
  }, [college?._id]);

  // Submit student review
  const handleReviewSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!isLoggedIn) {
      toast.error("Please login first to submit a review.");
      return;
    }

    if (!isStudent) {
      toast.error("Only students can submit college reviews.");
      return;
    }

    if (!college?._id) {
      toast.error("College information not found.");
      return;
    }

    if (reviewForm.overallRating < 1) {
      toast.error("Please select an overall rating.");
      return;
    }

    if (!reviewForm.reviewTitle.trim()) {
      toast.error("Please enter a review title.");
      return;
    }

    if (reviewForm.reviewTitle.trim().length < 5) {
      toast.error("Review title must be at least 5 characters.");
      return;
    }

    if (reviewForm.review.trim().length < 20) {
      toast.error("Review must be at least 20 characters.");
      return;
    }

    try {
      setSubmittingReview(true);

      const payload = {
        college: college._id,
        ...reviewForm,
        reviewTitle: reviewForm.reviewTitle.trim(),
        review: reviewForm.review.trim(),
        department: reviewForm.department.trim(),
        pros: reviewForm.pros.trim(),
        cons: reviewForm.cons.trim(),
      };

      await api.post(
        "/college-review/create-review",
        payload
      );

      toast.success(
        "Review submitted! It will appear after Admin approval."
      );

      setReviewForm(initialReviewForm);
      setShowReviewForm(false);
    } catch (err: any) {
      console.error("Review submit error:", err);

      toast.error(
        err.response?.data?.message ||
        "Unable to submit review."
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  // Loading UI
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

          <p className="mt-5 font-semibold text-slate-600">
            Loading college details...
          </p>

          <p className="mt-2 text-sm text-slate-400">
            Please wait while we fetch the information.
          </p>
        </div>
      </main>
    );
  }

  // Error UI
  if (error || !college) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-lg">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <FiAlertCircle size={30} />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-slate-900">
            College Not Found
          </h1>

          <p className="mt-3 leading-7 text-slate-500">
            College details are currently unavailable. Please try again later.
          </p>
        </div>
      </main>
    );
  }

  const collegeName =
    college.name ??
    college.collegeName ??
    college.shortName ??
    "College";

  const collegeImage = college.logo ?? college.image;
  const backgroundImage = college.backgroundImage;
  const collegeType = college.collegeType ?? college.type;

  const location = [
    college.location?.city,
    college.location?.state,
    college.location?.country,
  ]
    .filter(Boolean)
    .join(", ");

  const information = [
    {
      label: "Short Name",
      value: college.shortName,
      icon: FiBookOpen,
    },
    {
      label: "College Type",
      value: collegeType,
      icon: FiAward,
    },
    {
      label: "Established Year",
      value: college.establishedYear
        ? String(college.establishedYear)
        : undefined,
      icon: FiCalendar,
    },
    {
      label: "Address",
      value: college.location?.address,
      icon: FiMapPin,
    },
    {
      label: "Pincode",
      value: college.location?.pincode,
      icon: FiMapPin,
    },
  ].filter((item) => item.value);

  const averageRating = college.rating?.average || 0;
  const reviewCount = college.rating?.count || 0;

  return (
    <main className="min-h-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* Hero Section */}
      <section className="relative isolate flex min-h-[450px] items-center overflow-hidden bg-gradient-to-br from-blue-950 via-blue-800 to-blue-600 px-6 py-20 md:min-h-[550px] md:py-24">
        {backgroundImage && (
          <div
            className="absolute inset-0 -z-20 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url("${backgroundImage}")`,
            }}
          />
        )}

        {backgroundImage && (
          <div className="absolute inset-0 -z-10 bg-black/20" />
        )}

        {!backgroundImage && (
          <>
            <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-blue-400/20 blur-3xl" />
            <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-cyan-300/20 blur-3xl" />
          </>
        )}

        <div className="relative mx-auto w-full max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/20 px-5 py-2 text-sm font-semibold text-cyan-200 backdrop-blur-sm">
              <FiBookOpen />
              College Profile
            </span>

            <h1 className="mt-7 max-w-4xl text-3xl font-extrabold leading-tight text-white md:text-5xl lg:text-6xl">
              {collegeName}
            </h1>

            {college.shortName && (
              <p className="mt-3 text-lg font-semibold text-cyan-200">
                {college.shortName}
              </p>
            )}

            {location && (
              <p className="mt-6 flex items-center gap-2 text-sm text-white md:text-base">
                <FiMapPin className="shrink-0 text-cyan-300" size={20} />
                {location}
              </p>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              {collegeType && (
                <span className="rounded-full border border-white/20 bg-black/20 px-4 py-2 text-sm font-medium capitalize text-white backdrop-blur-sm">
                  {collegeType}
                </span>
              )}

              {college.establishedYear && (
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
                  <FiCalendar />
                  Established {college.establishedYear}
                </span>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main College Information */}
      <section className="mx-auto max-w-7xl px-6 py-14 lg:px-10 lg:py-20">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Side */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-5"
          >
            {/* College Image */}
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="relative flex h-72 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-white to-cyan-50 md:h-80">
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-100/70 blur-2xl" />

                {collegeImage ? (
                  <img
                    src={collegeImage}
                    alt={`${collegeName} image`}
                    className="relative max-h-60 max-w-[85%] rounded-2xl object-contain transition-transform duration-700 hover:scale-105"
                  />
                ) : (
                  <div className="relative flex h-32 w-32 items-center justify-center rounded-3xl bg-white text-5xl font-extrabold text-blue-600 shadow-lg">
                    {collegeName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="px-2 pb-2 pt-6">
                <h2 className="text-xl font-bold text-slate-900">
                  {collegeName}
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  College Information and Overview
                </p>

                {college.website && (
                  <a
                    href={college.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:-translate-y-1 hover:bg-blue-700"
                  >
                    Visit Official Website
                    <FiExternalLink />
                  </a>
                )}
              </div>
            </div>

            {/* Location Card */}
            {location && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="mt-7 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                    <FiMapPin size={23} />
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">
                    College Location
                  </h3>
                </div>

                <p className="mt-5 leading-7 text-slate-600">{location}</p>

                {college.location?.address && (
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {college.location.address}
                  </p>
                )}
              </motion.div>
            )}
          </motion.div>

          {/* Right Side */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-7"
          >
            {/* About College */}
            <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm md:p-9">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                  <FiInfo size={24} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-blue-600">
                    College Overview
                  </p>

                  <h2 className="text-2xl font-extrabold text-slate-900">
                    About College
                  </h2>
                </div>
              </div>

              <div className="mt-7">
                {college.description ? (
                  <p className="whitespace-pre-line text-base leading-8 text-slate-600">
                    {college.description}
                  </p>
                ) : (
                  <p className="text-slate-500">
                    College description is currently not available.
                  </p>
                )}
              </div>
            </div>

            {/* College Information */}
            <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm md:p-9">
              <div className="mb-7 flex items-center gap-3">
                <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                  <FiBookOpen size={24} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-blue-600">
                    Important Details
                  </p>

                  <h2 className="text-2xl font-extrabold text-slate-900">
                    College Information
                  </h2>
                </div>
              </div>

              {information.length > 0 || college.website ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {information.map((item) => {
                    const Icon = item.icon;

                    return (
                      <motion.div
                        key={item.label}
                        whileHover={{ y: -4 }}
                        className="rounded-2xl border border-slate-100 bg-slate-50 p-5 transition hover:border-blue-200 hover:bg-blue-50/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="rounded-xl bg-white p-3 text-blue-600 shadow-sm">
                            <Icon size={20} />
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs font-medium text-slate-500">
                              {item.label}
                            </p>

                            <p className="mt-1 break-words font-bold text-slate-800">
                              {item.value}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

                  {college.website && (
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 transition hover:border-blue-200 hover:bg-blue-50/50 sm:col-span-2">
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-white p-3 text-blue-600 shadow-sm">
                          <FiGlobe size={20} />
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-500">
                            Official Website
                          </p>

                          <a
                            href={college.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-flex max-w-full items-center gap-2 break-all font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {college.website}
                            <FiExternalLink className="shrink-0" />
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-slate-500">
                  Additional college information is not available.
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* College Courses & Admission Details */}
      <section className="mx-auto max-w-7xl px-6 pb-16 lg:px-10">
        <div className="mb-10">
          <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
            Courses & Admissions
          </span>

          <h2 className="mt-5 text-3xl font-extrabold text-slate-900 md:text-4xl">
            Available Courses
          </h2>

          <p className="mt-3 text-slate-500">
            Explore courses, seats, fees and admission information offered by
            this college.
          </p>
        </div>

        {coursesLoading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

            <p className="mt-4 font-semibold text-slate-600">
              Loading available courses...
            </p>
          </div>
        ) : coursesError ? (
          <div className="rounded-3xl border border-red-100 bg-white p-10 text-center">
            <FiAlertCircle className="mx-auto text-red-500" size={32} />
            <p className="mt-4 text-slate-600">{coursesError}</p>
          </div>
        ) : collegeCourses.filter((item) => item.status === "active").length ===
          0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
            <FiBookOpen className="mx-auto text-blue-500" size={36} />

            <h3 className="mt-4 text-xl font-bold text-slate-900">
              No Courses Available
            </h3>

            <p className="mt-2 text-slate-500">
              Currently, no active courses are available for this college.
            </p>
          </div>
        ) : (
          <div className="grid w-full grid-cols-1 gap-7">
            {collegeCourses
              .filter((item) => item.status === "active")
              .map((item) => {
                const courseName = item.course?.name || "Course";
                const currency = item.currency || "INR";

                const formatFees = (amount?: number) =>
                  amount !== undefined
                    ? new Intl.NumberFormat("en-IN", {
                        style: "currency",
                        currency,
                        maximumFractionDigits: 0,
                      }).format(amount)
                    : "Not specified";

                const duration =
                  item.course?.duration?.value !== undefined
                    ? `${item.course.duration.value} ${item.course.duration.unit || ""}`
                    : item.duration !== undefined
                      ? `${item.duration} Years`
                      : "Not specified";

                const entranceExams = item.entranceExams || [];

                return (
                  <motion.article
                    key={item._id}
                    initial={{ opacity: 0, y: 25 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div className="bg-gradient-to-r from-blue-950 to-blue-600 p-6 text-white">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-cyan-200">
                            {item.course?.code || "Course Details"}
                          </p>

                          <h3 className="mt-2 text-2xl font-extrabold">
                            {courseName}
                          </h3>

                          {item.specialization?.name && (
                            <p className="mt-2 text-sm text-blue-100">
                              {item.specialization.name}
                            </p>
                          )}
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            item.admissionOpen
                              ? "bg-green-400/20 text-green-200"
                              : "bg-red-400/20 text-red-200"
                          }`}
                        >
                          {item.admissionOpen
                            ? "Admission Open"
                            : "Admission Closed"}
                        </span>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-2xl bg-blue-50 p-4">
                          <p className="text-xs font-medium text-slate-500">
                            Total Seats
                          </p>

                          <p className="mt-2 text-2xl font-extrabold text-blue-700">
                            {item.totalSeats ?? 0}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-green-50 p-4">
                          <p className="text-xs font-medium text-slate-500">
                            Available Seats
                          </p>

                          <p className="mt-2 text-2xl font-extrabold text-green-700">
                            {item.availableSeats ?? 0}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 space-y-4">
                        {[
                          ["Duration", duration],
                          ["Mode", item.mode || "Not specified"],
                          ["Total Fees", formatFees(item.totalFees)],
                          ["Yearly Fees", formatFees(item.yearlyFees)],
                          ["Eligibility", item.eligibility || "Not specified"],
                        ].map(([label, value]) => (
                          <div
                            key={label}
                            className="flex flex-col justify-between gap-1 border-b border-slate-100 pb-3 sm:flex-row"
                          >
                            <span className="text-sm text-slate-500">
                              {label}
                            </span>

                            <span className="text-sm font-semibold capitalize text-slate-800 sm:text-right">
                              {value}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-6">
                        <h4 className="font-bold text-slate-900">
                          Entrance Exams
                        </h4>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {entranceExams.length > 0 ? (
                            entranceExams.map((exam, index) => (
                              <span
                                key={`${exam.name}-${index}`}
                                className="rounded-full bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700"
                              >
                                {exam.name || exam.shortName}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-slate-500">
                              No entrance exam specified
                            </span>
                          )}
                        </div>
                      </div>

                      {item.applicationDeadline && (
                        <div className="mt-6 flex items-center gap-3 rounded-2xl bg-amber-50 p-4">
                          <FiCalendar
                            className="shrink-0 text-amber-600"
                            size={20}
                          />

                          <div>
                            <p className="text-xs text-slate-500">
                              Application Deadline
                            </p>

                            <p className="mt-1 font-bold text-slate-800">
                              {new Date(
                                item.applicationDeadline
                              ).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="mt-5 flex items-center gap-3 rounded-2xl bg-purple-50 p-4">
                        <FiAward
                          className="shrink-0 text-purple-600"
                          size={22}
                        />

                        <p className="text-sm font-semibold text-purple-800">
                          {item.scholarshipAvailable
                            ? "Scholarship Available"
                            : "Scholarship Not Available"}
                        </p>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
          </div>
        )}
      </section>

      {/* College Reviews Section */}
      <section className="bg-gray-50 px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                Student Feedback
              </p>

              <h2 className="mt-2 text-3xl font-bold text-gray-900">
                College Reviews & Ratings
              </h2>

              <p className="mt-2 text-gray-500">
                Read genuine feedback and experiences shared by students.
              </p>
            </div>

            <div className="min-w-[220px] rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="text-4xl font-bold text-gray-900">
                  {averageRating.toFixed(1)}
                </span>

                <div>
                  <div className="flex text-yellow-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FiStar
                        key={star}
                        className={
                          star <= Math.round(averageRating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }
                      />
                    ))}
                  </div>

                  <p className="mt-1 text-xs text-gray-500">
                    {reviewCount} Reviews
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Student Review Button */}
          {isStudent && (
            <div className="mb-8">
              <button
                type="button"
                onClick={() => setShowReviewForm((previous) => !previous)}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                {showReviewForm ? <FiX /> : <FiEdit3 />}
                {showReviewForm ? "Close Review Form" : "Write a Review"}
              </button>
            </div>
          )}

          {/* Login message */}
          {!isLoggedIn && (
            <div className="mb-8 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
              Login as a Student to submit your college review. Everyone can
              read approved reviews.
            </div>
          )}

          {isLoggedIn && !isStudent && (
            <div className="mb-8 rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-700">
              Only Student accounts can submit college reviews.
            </div>
          )}

          {/* Review Form */}
          {isStudent && showReviewForm && (
            <form
              onSubmit={handleReviewSubmit}
              className="mb-10 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-8"
            >
              <div className="mb-7 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Write Your Review
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Share your experience about {collegeName}.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
                >
                  <FiX size={22} />
                </button>
              </div>

              {/* Overall Rating */}
              <div className="mb-6">
                <label className="mb-2 block font-semibold text-gray-800">
                  Overall College Rating *
                </label>

                <StarSelector
                  value={reviewForm.overallRating}
                  onChange={(value) =>
                    setReviewForm((previous) => ({
                      ...previous,
                      overallRating: value,
                    }))
                  }
                />
              </div>

              {/* Department */}
              <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Department
                  </label>

                  <input
                    type="text"
                    value={reviewForm.department}
                    onChange={(e) =>
                      setReviewForm((previous) => ({
                        ...previous,
                        department: e.target.value,
                      }))
                    }
                    placeholder="e.g. Computer Science"
                    maxLength={100}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Department Rating
                  </label>

                  <StarSelector
                    value={reviewForm.departmentRating}
                    onChange={(value) =>
                      setReviewForm((previous) => ({
                        ...previous,
                        departmentRating: value,
                      }))
                    }
                  />
                </div>
              </div>

              {/* Facilities Ratings */}
              <div className="mb-7">
                <h4 className="mb-4 text-lg font-bold text-gray-900">
                  Rate College Facilities
                </h4>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {facilityLabels.map(([key, label]) => (
                    <div
                      key={key}
                      className="rounded-xl border border-gray-100 bg-gray-50 p-4"
                    >
                      <p className="mb-2 text-sm font-semibold text-gray-700">
                        {label}
                      </p>

                      <StarSelector
                        value={reviewForm.facilities[key]}
                        onChange={(value) =>
                          setReviewForm((previous) => ({
                            ...previous,
                            facilities: {
                              ...previous.facilities,
                              [key]: value,
                            },
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Study Year */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Study Year
                </label>

                <input
                  type="text"
                  value={reviewForm.studyYear}
                  onChange={(e) =>
                    setReviewForm((previous) => ({
                      ...previous,
                      studyYear: e.target.value,
                    }))
                  }
                  placeholder="e.g. 2025-2026"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Review Title */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Review Title *
                </label>

                <input
                  type="text"
                  required
                  minLength={5}
                  maxLength={100}
                  value={reviewForm.reviewTitle}
                  onChange={(e) =>
                    setReviewForm((previous) => ({
                      ...previous,
                      reviewTitle: e.target.value,
                    }))
                  }
                  placeholder="Summarize your experience"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Review Description */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Your Review *
                </label>

                <textarea
                  required
                  minLength={20}
                  maxLength={2000}
                  rows={5}
                  value={reviewForm.review}
                  onChange={(e) =>
                    setReviewForm((previous) => ({
                      ...previous,
                      review: e.target.value,
                    }))
                  }
                  placeholder="Share your experience with this college (minimum 20 characters)..."
                  className="w-full resize-y rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <p className="mt-1 text-right text-xs text-gray-400">
                  {reviewForm.review.length}/2000
                </p>
              </div>

              {/* Pros and Cons */}
              <div className="mb-7 grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-green-700">
                    Pros
                  </label>

                  <textarea
                    rows={4}
                    maxLength={1000}
                    value={reviewForm.pros}
                    onChange={(e) =>
                      setReviewForm((previous) => ({
                        ...previous,
                        pros: e.target.value,
                      }))
                    }
                    placeholder="What did you like about this college?"
                    className="w-full resize-y rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-red-700">
                    Cons
                  </label>

                  <textarea
                    rows={4}
                    maxLength={1000}
                    value={reviewForm.cons}
                    onChange={(e) =>
                      setReviewForm((previous) => ({
                        ...previous,
                        cons: e.target.value,
                      }))
                    }
                    placeholder="What could be improved?"
                    className="w-full resize-y rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 pt-6">
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="rounded-xl bg-blue-600 px-7 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setReviewForm(initialReviewForm);
                    setShowReviewForm(false);
                  }}
                  className="rounded-xl border border-gray-300 px-7 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>

              <p className="mt-4 text-xs leading-5 text-gray-500">
                Your review will be visible publicly only after Admin approval.
              </p>
            </form>
          )}

          {/* Reviews List */}
          {reviewsLoading ? (
            <div className="py-12 text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />

              <p className="mt-4 text-gray-500">
                Loading reviews...
              </p>
            </div>
          ) : reviewsError ? (
            <div className="rounded-xl bg-red-50 p-5 text-center text-red-600">
              {reviewsError}
            </div>
          ) : reviews.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
              <FiStar className="mx-auto mb-4 text-4xl text-gray-300" />

              <h3 className="text-xl font-semibold text-gray-800">
                No Reviews Yet
              </h3>

              <p className="mt-2 text-gray-500">
                Be the first student to share an experience about this college.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {reviews.map((item) => (
                <div
                  key={item._id}
                  className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {item.reviewTitle}
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        {item.student?.name || "Student"}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1 rounded-lg bg-yellow-50 px-3 py-1.5">
                      <FiStar className="fill-yellow-400 text-yellow-400" />

                      <span className="font-semibold text-gray-800">
                        {item.overallRating}/5
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex text-yellow-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FiStar
                        key={star}
                        className={
                          star <= item.overallRating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }
                      />
                    ))}
                  </div>

                  <p className="mt-4 leading-relaxed text-gray-600">
                    {item.review}
                  </p>

                  {item.department && (
                    <p className="mt-4 text-sm text-gray-500">
                      <span className="font-semibold text-gray-700">
                        Department:
                      </span>{" "}
                      {item.department}
                    </p>
                  )}

                  {item.departmentRating ? (
                    <p className="mt-2 text-sm text-gray-500">
                      <span className="font-semibold text-gray-700">
                        Department Rating:
                      </span>{" "}
                      {item.departmentRating}/5
                    </p>
                  ) : null}

                  {item.pros && (
                    <div className="mt-4 rounded-xl bg-green-50 p-3">
                      <p className="text-sm font-semibold text-green-700">
                        Pros
                      </p>

                      <p className="mt-1 text-sm text-gray-600">
                        {item.pros}
                      </p>
                    </div>
                  )}

                  {item.cons && (
                    <div className="mt-3 rounded-xl bg-red-50 p-3">
                      <p className="text-sm font-semibold text-red-700">
                        Cons
                      </p>

                      <p className="mt-1 text-sm text-gray-600">
                        {item.cons}
                      </p>
                    </div>
                  )}

                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
                    <span className="text-xs text-gray-500">
                      {item.studyYear || ""}
                    </span>

                    <span className="text-xs text-gray-400">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString(
                            "en-IN",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )
                        : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-6 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mx-auto max-w-7xl rounded-3xl bg-gradient-to-r from-blue-800 to-blue-600 px-6 py-12 text-center text-white shadow-xl md:px-16 md:py-14"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
            <FiAward size={28} />
          </div>

          <h2 className="mt-6 text-3xl font-extrabold md:text-4xl">
            Take the Next Step Towards Your Future
          </h2>

          <p className="mx-auto mt-4 max-w-2xl leading-7 text-blue-100">
            Explore your opportunities, gather the right information and move
            forward towards your medical career.
          </p>

          <a
            href="/college"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3 font-bold text-blue-700 transition hover:-translate-y-1 hover:bg-cyan-100"
          >
            Explore More Colleges
            <FiArrowRight />
          </a>
        </motion.div>
      </section>
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
            <p className="font-semibold text-slate-600">Loading...</p>
          </main>
        }
      >
        <CollegeDetails />
      </Suspense>
    </>
  );
}
