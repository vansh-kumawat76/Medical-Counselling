
"use client";

import { useEffect, useState } from "react";
import api from "@/src/lib/axios";
import toast from "react-hot-toast";

interface CollegeItem {
  college?: any;
  collegeCourse?: any;
  course?: any;
  specialization?: any;
  fees?: number;
  remarks?: string;
  recommendationReason?: string;
}

interface Recommendation {
  _id: string;
  counsellingRequest?: {
    requestNumber?: string;
  };
  counsellor?: {
    name?: string;
    email?: string;
  };
  colleges?: CollegeItem[];
  counsellorRemarks?: string;
  status: string;
  sharedAt?: string;
  studentResponse?: {
    status?: string;
    remarks?: string;
    respondedAt?: string;
  };
  createdAt?: string;
}

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchRecommendations = async () => {
    try {
      const response = await api.get(
        "/college-recommendation/get-all-recommendations"
      );

      setRecommendations(response.data.data || []);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          "Failed to fetch recommendations"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const getName = (value: any, keys: string[]) => {
    if (!value) return "Not available";

    if (typeof value === "string") return value;

    for (const key of keys) {
      if (value[key]) return value[key];
    }

    return "Not available";
  };

  const formatDate = (date?: string) => {
    if (!date) return "Not available";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatStatus = (status?: string) => {
    return (status || "pending").replaceAll("_", " ");
  };

  const formatFees = (fees?: number) => {
    if (fees === undefined || fees === null) {
      return "Not specified";
    }

    return `₹${fees.toLocaleString("en-IN")}`;
  };

  const handleResponse = async (
    recommendationId: string,
    responseType: "accepted" | "rejected"
  ) => {
    try {
      setSubmitting(true);

      const response = await api.post(
        `/college-recommendation/respond-recommendation/${recommendationId}`,
        {
          response: responseType,
          remarks: remarks.trim(),
        }
      );

      toast.success(
        response.data.message || "Your response has been submitted"
      );

      setActiveId(null);
      setRemarks("");

      await fetchRecommendations();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          "Failed to submit your response"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-6 text-center text-gray-600">
        Loading your recommendations...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex-1 bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            My College Recommendations
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            View colleges recommended by your counsellor and share your response.
          </p>
        </div>

        {/* Empty State */}
        {recommendations.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
            <h2 className="text-lg font-semibold text-gray-800">
              No Recommendations Found
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Your counsellor has not shared any college recommendations yet.
            </p>
          </div>
        ) : (
          <div className="space-y-6">

            {recommendations.map((recommendation) => {
              const studentResponse =
                recommendation.studentResponse?.status || "pending";

              const alreadyResponded = studentResponse !== "pending";

              return (
                <div
                  key={recommendation._id}
                  className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                  {/* Recommendation Header */}
                  <div className="flex flex-col justify-between gap-3 border-b border-gray-100 pb-5 sm:flex-row sm:items-center">
                    <div>
                      <h2 className="font-semibold text-gray-900">
                        Recommendation
                      </h2>

                      <p className="mt-1 text-sm text-gray-500">
                        Request:{" "}
                        {recommendation.counsellingRequest?.requestNumber ||
                          "Not available"}
                      </p>
                    </div>

                    <span
                      className={`w-fit rounded-full px-3 py-1 text-sm font-medium capitalize ${
                        studentResponse === "accepted"
                          ? "bg-green-50 text-green-700"
                          : studentResponse === "rejected"
                          ? "bg-red-50 text-red-700"
                          : "bg-yellow-50 text-yellow-700"
                      }`}
                    >
                      {formatStatus(studentResponse)}
                    </span>
                  </div>

                  {/* Counsellor Details */}
                  <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <p className="text-sm text-gray-500">
                        Counsellor
                      </p>

                      <p className="mt-1 font-medium text-gray-900">
                        {recommendation.counsellor?.name ||
                          recommendation.counsellor?.email ||
                          "Not available"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">
                        Shared Date
                      </p>

                      <p className="mt-1 font-medium text-gray-900">
                        {formatDate(recommendation.sharedAt)}
                      </p>
                    </div>
                  </div>

                  {/* College List */}
                  <div className="mt-6">
                    <h3 className="mb-4 text-lg font-semibold text-gray-900">
                      Recommended Colleges
                    </h3>

                    <div className="space-y-4">
                      {recommendation.colleges?.map((item, index) => (
                        <div
                          key={index}
                          className="rounded-lg border border-gray-200 bg-gray-50 p-5"
                        >
                          <h4 className="font-semibold text-gray-900">
                            {index + 1}.{" "}
                            {getName(item.college, [
                              "name",
                              "collegeName",
                            ])}
                          </h4>

                          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                              <p className="text-sm text-gray-500">
                                Course
                              </p>

                              <p className="mt-1 font-medium text-gray-900">
                                {getName(item.course, [
                                  "name",
                                  "courseName",
                                  "title",
                                ])}
                              </p>
                            </div>

                            <div>
                              <p className="text-sm text-gray-500">
                                Specialization
                              </p>

                              <p className="mt-1 font-medium text-gray-900">
                                {getName(item.specialization, [
                                  "name",
                                  "specializationName",
                                  "title",
                                ])}
                              </p>
                            </div>

                            <div>
                              <p className="text-sm text-gray-500">
                                Fees
                              </p>

                              <p className="mt-1 font-medium text-gray-900">
                                {formatFees(item.fees)}
                              </p>
                            </div>
                          </div>

                          {item.recommendationReason && (
                            <div className="mt-4">
                              <p className="text-sm text-gray-500">
                                Recommendation Reason
                              </p>

                              <p className="mt-1 text-sm text-gray-800">
                                {item.recommendationReason}
                              </p>
                            </div>
                          )}

                          {item.remarks && (
                            <div className="mt-3">
                              <p className="text-sm text-gray-500">
                                College Remarks
                              </p>

                              <p className="mt-1 text-sm text-gray-800">
                                {item.remarks}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Counsellor Remarks */}
                  {recommendation.counsellorRemarks && (
                    <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50 p-4">
                      <h3 className="font-semibold text-blue-900">
                        Counsellor Remarks
                      </h3>

                      <p className="mt-2 text-sm text-blue-800">
                        {recommendation.counsellorRemarks}
                      </p>
                    </div>
                  )}

                  {/* Student Response */}
                  <div className="mt-6 border-t border-gray-100 pt-5">
                    {alreadyResponded ? (
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          Your Response
                        </h3>

                        <p className="mt-2 text-sm capitalize text-gray-700">
                          Status:{" "}
                          <span className="font-semibold">
                            {formatStatus(studentResponse)}
                          </span>
                        </p>

                        {recommendation.studentResponse?.remarks && (
                          <p className="mt-2 text-sm text-gray-600">
                            Remarks:{" "}
                            {recommendation.studentResponse.remarks}
                          </p>
                        )}

                        <p className="mt-2 text-sm text-gray-500">
                          Responded on:{" "}
                          {formatDate(
                            recommendation.studentResponse?.respondedAt
                          )}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          Share Your Response
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                          Review the recommended colleges and accept or reject this recommendation.
                        </p>

                        <textarea
                          value={
                            activeId === recommendation._id
                              ? remarks
                              : ""
                          }
                          onChange={(e) => {
                            setActiveId(recommendation._id);
                            setRemarks(e.target.value);
                          }}
                          placeholder="Enter your remarks (optional)..."
                          rows={3}
                          maxLength={2000}
                          className="mt-4 w-full rounded-lg border border-gray-300 p-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />

                        <div className="mt-4 flex flex-wrap gap-3">
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() =>
                              handleResponse(
                                recommendation._id,
                                "accepted"
                              )
                            }
                            className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {submitting ? "Submitting..." : "Accept"}
                          </button>

                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() =>
                              handleResponse(
                                recommendation._id,
                                "rejected"
                              )
                            }
                            className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {submitting ? "Submitting..." : "Reject"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

          </div>
        )}
      </div>
    </div>
  );
}
