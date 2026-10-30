
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
  FiRefreshCw,
  FiAward,
} from "react-icons/fi";

type College = {
  _id?: string;
  name?: string;
  collegeName?: string;
  shortName?: string;
  logo?: string;
  image?: string;
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
  [key: string]: unknown;
};

function CollegeDetails() {
  const { slug } = useParams<{ slug: string }>();

  const [college, setCollege] = useState<College | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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
        toast.success("College details loaded successfully!");
      } catch (err) {
        if (!active) return;

        setError(true);
        toast.error("College details load nahi ho payi.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    if (slug) {
      fetchData();
    }

    return () => {
      active = false;
    };
  }, [slug]);

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
            College Not Available
          </h1>

          <p className="mt-3 leading-7 text-slate-500">
            College details are currently unavailable. Please try again later.
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

  const collegeName =
    college.name ??
    college.collegeName ??
    college.shortName ??
    "College";

  const collegeImage = college.logo ?? college.image;

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
      value: college.type,
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

  return (
    <main className="min-h-screen overflow-hidden bg-slate-50 text-slate-900">

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-800 to-blue-600 px-6 py-16 md:py-24">

        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-cyan-300/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">

          <motion.div
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold text-cyan-200 backdrop-blur-md">
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
              <p className="mt-6 flex items-center gap-2 text-sm text-blue-100 md:text-base">
                <FiMapPin className="shrink-0 text-cyan-300" size={20} />
                {location}
              </p>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              {college.type && (
                <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium capitalize text-white backdrop-blur-sm">
                  {college.type}
                </span>
              )}

              {college.establishedYear && (
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
                  <FiCalendar />
                  Established {college.establishedYear}
                </span>
              )}
            </div>
          </motion.div>

        </div>
      </section>

      {/* Main Content */}
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

                <p className="mt-5 leading-7 text-slate-600">
                  {location}
                </p>

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

            {/* Information */}
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
            Explore your opportunities, gather the right information and
            move forward towards your medical career.
          </p>

          <a
            href="/colleges"
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
            <p className="font-semibold text-slate-600">
              Loading...
            </p>
          </main>
        }
      >
        <CollegeDetails />
      </Suspense>
    </>
  );
}
