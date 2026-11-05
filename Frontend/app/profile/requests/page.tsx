
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import api from "@/src/lib/axios";
import toast from "react-hot-toast";

interface CounsellingRequest {
  _id: string;
  requestNumber: string;
  academicYear: string;
  admissionLevel: string;
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
  };
  assignedTo?: {
    name?: string;
    email?: string;
  } | null;
  status: string;
  createdAt: string;
}

export default function MyRequestsPage() {
  const [requests, setRequests] = useState<CounsellingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await api.get(
          "/counsellingRequest/getCounseller-request"
        );

        setRequests(response.data.data || []);
      } catch (error: any) {
        toast.error(
          error.response?.data?.message ||
            "Failed to fetch counselling requests"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const formatStatus = (status: string) => {
    return status.replaceAll("_", " ");
  };

  const formatDate = (date: string) => {
    if (!date) return "Not scheduled";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex-1 p-6 text-center text-gray-600">
        Loading your requests...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex-1 bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            My Counselling Requests
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Track your submitted counselling requests and their status.
          </p>
        </div>

        {requests.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
            <h2 className="text-lg font-semibold text-gray-800">
              No Requests Found
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              You have not submitted any counselling requests yet.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {requests.map((request) => (
              <div
                key={request._id}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="font-semibold text-gray-900">
                      {request.requestNumber}
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      Submitted: {formatDate(request.createdAt)}
                    </p>
                  </div>

                  <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-sm font-medium capitalize text-blue-700">
                    {formatStatus(request.status)}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-5 border-t border-gray-100 pt-5 sm:grid-cols-2 lg:grid-cols-3">

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
                    <p className="text-sm text-gray-500">Preferred City</p>
                    <p className="mt-1 font-medium text-gray-900">
                      {request.preferredLocations?.length
                        ? request.preferredLocations
                            .map((location) => location.city)
                            .filter(Boolean)
                            .join(", ")
                        : "Not specified"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Budget</p>
                    <p className="mt-1 font-medium text-gray-900">
                      ₹{(request.budget?.min || 0).toLocaleString("en-IN")}
                      {" - "}
                      ₹{(request.budget?.max || 0).toLocaleString("en-IN")}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Counselling Mode</p>
                    <p className="mt-1 font-medium capitalize text-gray-900">
                      {request.counsellingMode?.replaceAll("_", " ") || "Not specified"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Preferred Date</p>
                    <p className="mt-1 font-medium text-gray-900">
                      {request.preferredTime?.date
                        ? formatDate(request.preferredTime.date)
                        : "Not scheduled"}
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
                  <div className="mt-2">
  <Link
    href={`/profile/requests/${request._id}`}
    className="inline-flex rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
  >
    View Details
  </Link>
</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
