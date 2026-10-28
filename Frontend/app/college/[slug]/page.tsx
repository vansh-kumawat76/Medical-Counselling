
"use client";

import api from "../../../src/lib/axios";
import { useParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import toast, { Toaster } from "react-hot-toast";

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

        const data = response.data?.college ?? response.data?.data ?? response.data;

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

  if (loading) {
    return <p className="p-8 text-center">Loading college details...</p>;
  }

  if (error || !college) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-xl font-semibold text-slate-800">
          College details unavailable
        </h1>
        <p className="mt-2 text-slate-600">
          Please try again later.
        </p>
      </div>
    );
  }

  const collegeName =
    college.name ?? college.collegeName ?? college.shortName ?? "College";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 sm:px-6">
      <Toaster position="top-right" />

      <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="bg-blue-700 px-6 py-8 text-white sm:px-10">
          <h1 className="text-2xl font-bold sm:text-4xl">
            {collegeName}
          </h1>

         
{college.location && (
  <p className="mt-3 text-blue-100">
    {[
      college.location.city,
      college.location.state,
      college.location.country,
    ]
      .filter(Boolean)
      .join(", ")}
  </p>
)}

        </div>

        <div className="grid gap-8 p-6 sm:p-10 md:grid-cols-2">
          <div>
            {(college.logo || college.image) && (
              <img
                src={college.logo ?? college.image}
                alt={`${collegeName} image`}
                className="mb-6 h-56 w-full rounded-xl object-contain"
              />
            )}

            {college.description && (
              <>
                <h2 className="text-xl font-semibold">About College</h2>
                <p className="mt-3 leading-7 text-slate-600">
                  {college.description}
                </p>
              </>
            )}
          </div>

          <div>
            <h2 className="text-xl font-semibold">College Information</h2>

            <div className="mt-4 divide-y divide-slate-200">
              {college.shortName && (
                <Info label="Short Name" value={college.shortName} />
              )}

              {college.type && (
                <Info label="College Type" value={college.type} />
              )}

              {college.establishedYear && (
                <Info
                  label="Established Year"
                  value={String(college.establishedYear)}
                />
              )}

              {college.location?.address && (
  <Info label="Address" value={college.location.address} />
)}

{college.location?.pincode && (
  <Info label="Pincode" value={college.location.pincode} />
)}
              {college.website && (
                <div className="py-4">
                  <p className="text-sm text-slate-500">Website</p>
                  <a
                    href={college.website}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block break-all text-blue-600 hover:underline"
                  >
                    {college.website}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 font-medium text-slate-800">{value}</p>
    </div>
  );
}

export default function Page() {
  return (
    <>
      <Toaster position="top-right" />
      <Suspense fallback={<p className="p-8 text-center">Loading...</p>}>
        <CollegeDetails />
      </Suspense>
    </>
  );
}
