
"use client";

import React, { useEffect, useState } from "react";

type Session = {
  _id: string;
  sessionNumber: number;
  type: string;
  mode: string;
  status: string;
  startedAt?: string;
  endedAt?: string;
  durationMinutes?: number;
  outcome?: string;
  nextAction?: string;
  nextFollowUpAt?: string;
  studentQuestions?: string[];
  createdAt: string;
};

const API_URL = "http://localhost:8090";

const SessionHistoryPage = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please login to view your counselling sessions.");
        return;
      }

      const response = await fetch(
        `${API_URL}/session/GetAllCounsellingSession`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const result = await response.json();

      if (!response.ok || result.status !== true) {
        throw new Error(
          result.message || "Unable to fetch counselling sessions."
        );
      }

      const sessionList: Session[] = result.sessions || [];

      // Newest sessions first
      sessionList.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      );

      setSessions(sessionList);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const formatDate = (date?: string) => {
    if (!date) return "Not available";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (date?: string) => {
    if (!date) return "Not available";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700";
      case "in_progress":
        return "bg-blue-100 text-blue-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const filteredSessions = sessions.filter((session) => {
    const matchesSearch =
      `session ${session.sessionNumber} ${session.type} ${session.mode} ${session.status}`
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || session.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const completedCount = sessions.filter(
    (session) => session.status === "completed"
  ).length;

  const inProgressCount = sessions.filter(
    (session) => session.status === "in_progress"
  ).length;

  const cancelledCount = sessions.filter(
    (session) => session.status === "cancelled"
  ).length;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* Navy Blue Hero */}
        <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-[#071B3A] via-[#102F5E] to-[#174A7E] p-8 shadow-xl shadow-blue-950/20 sm:p-10">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-blue-300/10 blur-2xl" />

          <div className="pointer-events-none absolute -bottom-20 left-10 h-56 w-56 rounded-full bg-cyan-300/10 blur-3xl" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-medium text-white backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-emerald-300" />
                Student Dashboard
              </span>

              <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Counselling Session History
              </h1>

              <p className="mt-2 max-w-xl text-sm text-blue-100 sm:text-base">
                View your previous and ongoing counselling sessions.
              </p>
            </div>

            <a
              href="/profile"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white shadow-lg backdrop-blur transition hover:bg-white/20"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
              Back to Dashboard
            </a>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={fetchSessions}
            disabled={loading}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Statistics */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Total Sessions",
              value: sessions.length,
              color: "text-gray-900",
            },
            {
              label: "Completed",
              value: completedCount,
              color: "text-green-600",
            },
            {
              label: "In Progress",
              value: inProgressCount,
              color: "text-blue-600",
            },
            {
              label: "Cancelled",
              value: cancelledCount,
              color: "text-red-600",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm font-medium text-gray-500">
                {item.label}
              </p>
              <h2 className={`mt-2 text-3xl font-bold ${item.color}`}>
                {item.value}
              </h2>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row">
          <input
            type="text"
            placeholder="Search sessions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
           className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:flex-1"
           />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
           className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-52"
          >
            <option value="all">All Sessions</option>
            <option value="completed">Completed</option>
            <option value="in_progress">In Progress</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Loading */}
        {loading && (
          <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
            <p className="mt-4 text-sm text-gray-500">
              Loading your sessions...
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5">
            <p className="font-semibold text-red-700">{error}</p>
            <button
              onClick={fetchSessions}
              className="mt-3 text-sm font-semibold text-red-700 underline"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filteredSessions.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="text-4xl">📅</div>
            <h2 className="mt-4 text-lg font-bold text-gray-900">
              No Sessions Found
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              {sessions.length === 0
                ? "You don't have any counselling sessions yet."
                : "No sessions match your search or selected filter."}
            </p>
          </div>
        )}

        {/* Session Table */}
        {!loading && !error && filteredSessions.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] text-left">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      "Session",
                      "Type",
                      "Mode",
                      "Date",
                      "Status",
                      "Action",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-gray-500"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredSessions.map((session) => (
                    <tr key={session._id} className="hover:bg-gray-50">
                      <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                        Session #{session.sessionNumber}
                      </td>

                      <td className="px-5 py-4 text-sm capitalize text-gray-600">
                        {session.type.replaceAll("_", " ")}
                      </td>

                      <td className="px-5 py-4 text-sm capitalize text-gray-600">
                        {session.mode.replaceAll("_", " ")}
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-600">
                        {formatDate(session.startedAt || session.createdAt)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusStyle(
                            session.status
                          )}`}
                        >
                          {session.status.replaceAll("_", " ")}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <button
                          onClick={() => setSelectedSession(session)}
                          className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Details Modal */}
        {selectedSession && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setSelectedSession(null)}
          >
            <div
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Session #{selectedSession.sessionNumber}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Counselling session details
                  </p>
                </div>

                <button
                  onClick={() => setSelectedSession(null)}
                  className="rounded-lg px-3 py-2 text-xl text-gray-500 hover:bg-gray-100"
                  aria-label="Close details"
                >
                  ×
                </button>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">Session Type</p>
                  <p className="mt-1 font-semibold capitalize text-gray-900">
                    {selectedSession.type.replaceAll("_", " ")}
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">Mode</p>
                  <p className="mt-1 font-semibold capitalize text-gray-900">
                    {selectedSession.mode.replaceAll("_", " ")}
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">Status</p>
                  <p className="mt-1 font-semibold capitalize text-gray-900">
                    {selectedSession.status.replaceAll("_", " ")}
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">Duration</p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {selectedSession.durationMinutes != null
                      ? `${selectedSession.durationMinutes} minutes`
                      : "Not available"}
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">Started At</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {formatDateTime(selectedSession.startedAt)}
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">Ended At</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {formatDateTime(selectedSession.endedAt)}
                  </p>
                </div>
              </div>

              {selectedSession.outcome && (
                <div className="mt-5">
                  <p className="text-sm font-bold text-gray-900">
                    Session Outcome
                  </p>
                  <p className="mt-2 rounded-lg bg-gray-50 p-4 text-sm capitalize text-gray-600">
                    {selectedSession.outcome.replaceAll("_", " ")}
                  </p>
                </div>
              )}

              {selectedSession.studentQuestions &&
                selectedSession.studentQuestions.length > 0 && (
                  <div className="mt-5">
                    <p className="text-sm font-bold text-gray-900">
                      Your Questions
                    </p>
                    <ul className="mt-2 list-inside list-disc space-y-2 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
                      {selectedSession.studentQuestions.map((question, index) => (
                        <li key={index}>{question}</li>
                      ))}
                    </ul>
                  </div>
                )}

              {selectedSession.nextAction && (
                <div className="mt-5">
                  <p className="text-sm font-bold text-gray-900">
                    Next Action
                  </p>
                  <p className="mt-2 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
                    {selectedSession.nextAction}
                  </p>
                </div>
              )}

              {selectedSession.nextFollowUpAt && (
                <div className="mt-5">
                  <p className="text-sm font-bold text-gray-900">
                    Next Follow-up
                  </p>
                  <p className="mt-2 text-sm text-gray-600">
                    {formatDateTime(selectedSession.nextFollowUpAt)}
                  </p>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedSession(null)}
                  className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
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
};

export default SessionHistoryPage;
