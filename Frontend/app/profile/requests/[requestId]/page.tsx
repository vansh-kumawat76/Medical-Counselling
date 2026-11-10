
"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/src/lib/axios";
import toast from "react-hot-toast";

interface CounsellingRequest {
  _id: string;
  requestNumber: string;
  academicYear: string;
  admissionLevel: string;
  student?: {
    name?: string;
    email?: string;
  };
  assignedTo?: {
    name?: string;
    email?: string;
  } | null;
  preferredLocations?: {
    city?: string;
    state?: string;
    country?: string;
  }[];
  budget?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  counsellingMode?: string;
  preferredTime?: {
    date?: string;
    timezone?: string;
  };
  status: string;
  priority?: string;
  source?: string;
  createdAt: string;
  updatedAt: string;
  statusHistory?: {
    oldStatus: string;
    newStatus: string;
    updatedAt: string;
  }[];
}

function RequestDetailsContent() {
  const params = useParams();
  const router = useRouter();

  const requestId = params.requestId as string;

  const [request, setRequest] = useState<CounsellingRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequestDetails = async () => {
      try {
        const response = await api.get(
          `/counsellingRequest/get-single-request/${requestId}`
        );

        setRequest(response.data.data);
      } catch (error: any) {
        toast.error(
          error.response?.data?.message ||
            "Failed to fetch request details"
        );
      } finally {
        setLoading(false);
      }
    };

    if (requestId) {
      fetchRequestDetails();
    }
  }, [requestId]);

  const formatStatus = (status: string) => {
    return status.replaceAll("_", " ");
  };

  const formatDate = (date?: string) => {
    if (!date) return "Not available";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex-1 p-6 text-center text-gray-600">
        Loading request details...
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex-1 p-6 text-center">
        <h2 className="text-xl font-semibold text-gray-900">
          Request Not Found
        </h2>

        <button
          onClick={() => router.push("/profile/requests")}
          className="mt-4 rounded-lg bg-blue-600 px-5 py-2 text-white"
        >
          Back to My Requests
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex-1 bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <Link
            href="/profile/requests"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
          >
            ← Back to My Requests
          </Link>

          <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Request Details
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                {request.requestNumber}
              </p>
            </div>

            <span className="w-fit rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold capitalize text-blue-700">
              {formatStatus(request.status)}
            </span>
          </div>
        </div>

        <div className="space-y-6">
          {/* Student Details */}
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Student Details
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="mt-1 font-medium text-gray-900">
                  {request.student?.name || "Not available"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="mt-1 font-medium text-gray-900">
                  {request.student?.email || "Not available"}
                </p>
              </div>
            </div>
          </section>

          {/* Admission Details */}
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Admission Details
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-gray-500">Academic Year</p>
                <p className="mt-1 font-medium text-gray-900">
                  {request.academicYear}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Admission Level</p>
                <p className="mt-1 font-medium text-gray-900">
                  {request.admissionLevel}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Preferred Locations</p>
                <p className="mt-1 font-medium text-gray-900">
                  {request.preferredLocations?.length
                    ? request.preferredLocations
                        .map((location) =>
                          [location.city, location.state, location.country]
                            .filter(Boolean)
                            .join(", ")
                        )
                        .join(" | ")
                    : "Not specified"}
                </p>
              </div>
            </div>
          </section>

          {/* Budget Details */}
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Budget Details
            </h2>

            <p className="font-medium text-gray-900">
              ₹{(request.budget?.min || 0).toLocaleString("en-IN")}
              {" - "}
              ₹{(request.budget?.max || 0).toLocaleString("en-IN")}
            </p>
          </section>

          {/* Counselling Details */}
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Counselling Details
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-gray-500">Counselling Mode</p>
                <p className="mt-1 font-medium capitalize text-gray-900">
                  {request.counsellingMode?.replaceAll("_", " ")}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Preferred Date</p>
                <p className="mt-1 font-medium text-gray-900">
                  {formatDate(request.preferredTime?.date)}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Assigned Counsellor</p>
                <p className="mt-1 font-medium text-gray-900">
                  {request.assignedTo?.name || "Not assigned yet"}
                </p>

                {request.assignedTo?.email && (
                  <p className="text-sm text-gray-500">
                    {request.assignedTo.email}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Request Information */}
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Request Information
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-gray-500">Request Status</p>
                <p className="mt-1 font-medium capitalize text-gray-900">
                  {formatStatus(request.status)}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Priority</p>
                <p className="mt-1 font-medium capitalize text-gray-900">
                  {request.priority || "Normal"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Source</p>
                <p className="mt-1 font-medium capitalize text-gray-900">
                  {request.source || "Website"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Submitted At</p>
                <p className="mt-1 font-medium text-gray-900">
                  {formatDate(request.createdAt)}
                </p>
              </div>
            </div>
          </section>

          {/* Status History */}
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Status History
            </h2>

            {!request.statusHistory?.length ? (
              <p className="text-sm text-gray-500">
                No status updates available yet.
              </p>
            ) : (
              <div className="space-y-4">
                {request.statusHistory.map((history, index) => (
                  <div
                    key={index}
                    className="border-l-2 border-blue-500 pl-4"
                  >
                    <p className="font-medium capitalize text-gray-900">
                      {formatStatus(history.oldStatus)}
                      {" → "}
                      {formatStatus(history.newStatus)}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {formatDate(history.updatedAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default function RequestDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 p-6 text-center text-gray-600">
          Loading request details...
        </div>
      }
    >
      <RequestDetailsContent />
    </Suspense>
  );
}
