
"use client";

import React, { useEffect, useMemo, useState } from "react";
import api from "@/src/lib/axios";

interface FollowUp {
  _id: string;
  title: string;
  description?: string;
  dueAt: string;
  type: "call" | "email" | "document" | "appointment" | "other";
  status: "pending" | "completed" | "cancelled" | "overdue";
  outcome?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: {
    _id: string;
    email: string;
  };
  counsellingRequest?: {
    _id: string;
    requestNumber: string;
    status?: string;
  };
}

const formatDate = (date?: string) => {
  if (!date) return "N/A";

  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const statusStyle: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
  cancelled: "bg-slate-100 text-slate-600",
};

export default function FollowUpsPage() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedFollowUp, setSelectedFollowUp] =
    useState<FollowUp | null>(null);

  const fetchFollowUps = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/FollowUp/Get-All-FollowUps"
      );

      if (response.data.success) {
        setFollowUps(response.data.data || []);
      } else {
        setError(
          response.data.message || "Unable to fetch follow-ups"
        );
      }
    } catch (err: any) {
      console.error("Follow-Ups Error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load your follow-ups. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowUps();
  }, []);

  const filteredFollowUps = useMemo(() => {
    return followUps.filter((item) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        item.title?.toLowerCase().includes(searchText) ||
        item.description?.toLowerCase().includes(searchText) ||
        item.assignedTo?.email?.toLowerCase().includes(searchText) ||
        item.counsellingRequest?.requestNumber
          ?.toLowerCase()
          .includes(searchText);

      const matchesStatus =
        statusFilter === "all" ||
        item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [followUps, search, statusFilter]);

  const counts = {
    total: followUps.length,
    pending: followUps.filter((item) => item.status === "pending").length,
    completed: followUps.filter((item) => item.status === "completed").length,
    overdue: followUps.filter((item) => item.status === "overdue").length,
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              My Follow-Ups
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Track your counselling follow-ups and important reminders.
            </p>
          </div>

          <button
            onClick={fetchFollowUps}
            disabled={loading}
            className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
          >
            ↻ Refresh
          </button>
        </div>

        {/* SUMMARY */}
        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total Follow-Ups</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">
              {counts.total}
            </h2>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Pending</p>
            <h2 className="mt-2 text-3xl font-bold text-amber-600">
              {counts.pending}
            </h2>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Completed</p>
            <h2 className="mt-2 text-3xl font-bold text-green-600">
              {counts.completed}
            </h2>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Overdue</p>
            <h2 className="mt-2 text-3xl font-bold text-red-600">
              {counts.overdue}
            </h2>
          </div>
        </div>

        {/* SEARCH AND FILTER */}
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Search
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title, description, counsellor..."
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Filter by Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* FOLLOW-UP LIST */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h2 className="font-bold text-slate-800">
              Follow-Up History
            </h2>
            <span className="text-sm text-slate-500">
              {filteredFollowUps.length} records
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
            </div>
          ) : error ? (
            <div className="px-5 py-14 text-center">
              <p className="font-medium text-red-600">{error}</p>
              <button
                onClick={fetchFollowUps}
                className="mt-4 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Try Again
              </button>
            </div>
          ) : filteredFollowUps.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <div className="mb-3 text-4xl">📋</div>
              <h3 className="font-semibold text-slate-800">
                No Follow-Ups Found
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Your counselling follow-up activities will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredFollowUps.map((item) => (
                <div
                  key={item._id}
                  className="flex flex-col justify-between gap-4 p-5 transition hover:bg-slate-50 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-slate-800">
                        {item.title}
                      </h3>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                          statusStyle[item.status] ||
                          "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <p className="mb-3 line-clamp-2 text-sm text-slate-500">
                      {item.description || "No description available"}
                    </p>

                    <div className="grid grid-cols-1 gap-2 text-xs text-slate-500 sm:grid-cols-2">
                      <p>
                        <span className="font-semibold text-slate-700">
                          Counsellor:
                        </span>{" "}
                        {item.assignedTo?.email || "N/A"}
                      </p>

                      <p>
                        <span className="font-semibold text-slate-700">
                          Request:
                        </span>{" "}
                        {item.counsellingRequest?.requestNumber || "N/A"}
                      </p>

                      <p>
                        <span className="font-semibold text-slate-700">
                          Type:
                        </span>{" "}
                        <span className="capitalize">{item.type}</span>
                      </p>

                      <p>
                        <span className="font-semibold text-slate-700">
                          Due:
                        </span>{" "}
                        {formatDate(item.dueAt)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedFollowUp(item)}
                    className="shrink-0 rounded-lg bg-indigo-50 px-5 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* DETAILS MODAL */}
        {selectedFollowUp && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
            onClick={() => setSelectedFollowUp(null)}
          >
            <div
              className="my-auto w-full max-w-2xl rounded-2xl bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Follow-Up Details
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Your counselling follow-up information
                  </p>
                </div>

                <button
                  onClick={() => setSelectedFollowUp(null)}
                  className="text-2xl text-slate-400 hover:text-slate-800"
                  aria-label="Close details"
                >
                  ×
                </button>
              </div>

              <div className="space-y-5 p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-bold text-slate-800">
                    {selectedFollowUp.title}
                  </h3>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                      statusStyle[selectedFollowUp.status] ||
                      "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {selectedFollowUp.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      Counsellor
                    </p>
                    <p className="mt-2 break-all text-sm font-semibold text-slate-800">
                      {selectedFollowUp.assignedTo?.email || "N/A"}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      Request Number
                    </p>
                    <p className="mt-2 break-all text-sm font-semibold text-slate-800">
                      {selectedFollowUp.counsellingRequest?.requestNumber ||
                        "N/A"}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      Follow-Up Type
                    </p>
                    <p className="mt-2 text-sm font-semibold capitalize text-slate-800">
                      {selectedFollowUp.type}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      Due Date
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-800">
                      {formatDate(selectedFollowUp.dueAt)}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-700">
                    Description
                  </p>
                  <div className="whitespace-pre-wrap break-words rounded-lg border border-slate-200 p-4 text-sm leading-7 text-slate-600">
                    {selectedFollowUp.description ||
                      "No description available"}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-700">
                    Outcome
                  </p>
                  <div className="whitespace-pre-wrap break-words rounded-lg border border-slate-200 p-4 text-sm leading-7 text-slate-600">
                    {selectedFollowUp.outcome || "No outcome recorded yet"}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-400">
                      Created At
                    </p>
                    <p className="mt-1 text-slate-700">
                      {formatDate(selectedFollowUp.createdAt)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-400">
                      Completed At
                    </p>
                    <p className="mt-1 text-slate-700">
                      {formatDate(selectedFollowUp.completedAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end border-t border-slate-100 px-6 py-4">
                <button
                  onClick={() => setSelectedFollowUp(null)}
                  className="rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
