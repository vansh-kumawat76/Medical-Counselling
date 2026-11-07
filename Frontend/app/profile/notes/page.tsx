
"use client";

import React, { useEffect, useState } from "react";

type CounsellingNote = {
  _id: string;
  content: string;
  category: string;
  visibility: string;
  createdAt: string;
  editedAt?: string;
  session?: {
    sessionNumber?: number;
    type?: string;
    mode?: string;
  };
  author?: {
    name?: string;
    email?: string;
  };
};

const API_URL = "http://localhost:8090";

const CounsellingNotesPage = () => {
  const [notes, setNotes] = useState<CounsellingNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchNotes = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please login to view your counselling notes.");
        return;
      }

      const response = await fetch(
        `${API_URL}/Notes/Get-All-Counselling-Notes`,
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

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to fetch counselling notes.");
      }

      // Backend Student role ke liye sirf student_visible notes return karega.
      setNotes(result.data || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while fetching notes."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      academic: "bg-blue-100 text-blue-700",
      budget: "bg-green-100 text-green-700",
      preferences: "bg-purple-100 text-purple-700",
      follow_up: "bg-orange-100 text-orange-700",
      general: "bg-gray-100 text-gray-700",
    };

    return colors[category] || colors.general;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Counselling Notes
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              View important updates and recommendations shared by your counsellor.
            </p>
          </div>

          <button
            onClick={fetchNotes}
            disabled={loading}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh Notes"}
          </button>
        </div>

        {/* Summary */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Total Notes
            </p>
            <h2 className="mt-2 text-3xl font-bold text-gray-900">
              {notes.length}
            </h2>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Latest Update
            </p>
            <h2 className="mt-2 text-lg font-bold text-gray-900">
              {notes.length
                ? formatDate(notes[0].createdAt)
                : "No updates yet"}
            </h2>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
            <p className="mt-4 text-sm text-gray-500">
              Loading counselling notes...
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5">
            <p className="font-semibold text-red-700">{error}</p>
            <button
              onClick={fetchNotes}
              className="mt-3 text-sm font-semibold text-red-700 underline"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && notes.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-3xl">
              📝
            </div>

            <h2 className="mt-5 text-lg font-bold text-gray-900">
              No Counselling Notes Yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
              Your counsellor has not shared any notes with you yet.
              Please check again later.
            </p>
          </div>
        )}

        {/* Notes List */}
        {!loading && !error && notes.length > 0 && (
          <div className="space-y-5">
            {notes.map((note) => (
              <div
                key={note._id}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getCategoryColor(
                      note.category
                    )}`}
                  >
                    {note.category.replaceAll("_", " ")}
                  </span>

                  <span className="text-xs text-gray-500">
                    {formatDate(note.createdAt)}
                  </span>
                </div>

                <div className="mt-4">
                  <h3 className="text-base font-bold text-gray-900">
                    Counselling Update
                  </h3>

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-gray-600">
                    {note.content}
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                  <div>
                    <p className="text-xs text-gray-400">
                      Counselling Session
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-700">
                      {note.session?.sessionNumber
                        ? `Session #${note.session.sessionNumber}`
                        : "Counselling Session"}
                    </p>
                  </div>

                  {note.author?.name && (
                    <div className="text-right">
                      <p className="text-xs text-gray-400">
                        Shared By
                      </p>
                      <p className="mt-1 text-sm font-semibold text-gray-700">
                        {note.author.name}
                      </p>
                    </div>
                  )}
                </div>

                {note.editedAt && (
                  <p className="mt-3 text-xs text-gray-400">
                    Updated on {formatDate(note.editedAt)}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CounsellingNotesPage;
