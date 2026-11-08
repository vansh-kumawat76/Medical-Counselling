
"use client";

import React, { useEffect, useState } from "react";

interface Session {
  _id: string;
  sessionNumber?: number;
  status: string;
  startedAt?: string;
  endedAt?: string;
  counsellor?: {
    name?: string;
    email?: string;
  } | string;
  type?: string;
  mode?: string;
}

interface FeedbackItem {
  _id: string;
  counsellingSession: string | { _id: string };
  rating: number;
  feedback: string;
}

const API_URL = "http://localhost:8090";

const getId = (value: string | { _id: string } | undefined) => {
  if (!value) return "";
  return typeof value === "string" ? value : value._id;
};

const getCounsellorName = (value: Session["counsellor"]) => {
  if (!value) return "Counsellor";
  if (typeof value === "string") return "Counsellor";
  return value.name || value.email || "Counsellor";
};

const formatDate = (date?: string) => {
  if (!date) return "N/A";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function FeedbackPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const getHeaders = () => {
    const token = localStorage.getItem("token");

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const headers = getHeaders();

      const [sessionResponse, feedbackResponse] = await Promise.all([
        fetch(`${API_URL}/session/GetAllCounsellingSession`, {
          method: "GET",
          headers,
          credentials: "include",
        }),
        fetch(`${API_URL}/feedback/Get-All-Feedback`, {
          method: "GET",
          headers,
          credentials: "include",
        }),
      ]);

      const sessionResult = await sessionResponse.json();
      const feedbackResult = await feedbackResponse.json();

      if (!sessionResponse.ok || !sessionResult.status) {
        throw new Error(
          sessionResult.message || "Unable to fetch counselling sessions"
        );
      }

      if (!feedbackResponse.ok || !feedbackResult.status) {
        throw new Error(
          feedbackResult.message || "Unable to fetch feedback"
        );
      }

      const sessionList: Session[] = Array.isArray(sessionResult.sessions)
        ? sessionResult.sessions
        : Array.isArray(sessionResult.data)
        ? sessionResult.data
        : [];

      const feedbackList: FeedbackItem[] = Array.isArray(feedbackResult.data)
        ? feedbackResult.data
        : [];

      setSessions(
        sessionList.filter(
          (session) => session.status?.toLowerCase() === "completed"
        )
      );

      setFeedbacks(feedbackList);
    } catch (err) {
      console.error("Feedback fetch error:", err);
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const isFeedbackSubmitted = (sessionId: string) => {
    return feedbacks.some(
      (item) => getId(item.counsellingSession) === sessionId
    );
  };

  const handleSubmit = async (sessionId: string) => {
    if (!rating) {
      alert("Please select a rating");
      return;
    }

    if (!feedback.trim()) {
      alert("Please write your feedback");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        `${API_URL}/feedback/Create-Feedback`,
        {
          method: "POST",
          headers: getHeaders(),
          credentials: "include",
          body: JSON.stringify({
            counsellingSession: sessionId,
            rating,
            feedback: feedback.trim(),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.status) {
        throw new Error(result.message || "Unable to submit feedback");
      }

      alert("Feedback submitted successfully!");

      setSelectedSession("");
      setRating(0);
      setFeedback("");

      await fetchData();
    } catch (err) {
      console.error("Feedback submit error:", err);
      alert(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600 font-medium">Loading feedback...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Feedback & Rating
          </h1>
          <p className="mt-2 text-gray-500">
            Share your experience after completing a counselling session.
          </p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <p className="text-sm text-gray-500">Completed Sessions</p>
            <h2 className="text-3xl font-bold text-gray-800 mt-2">
              {sessions.length}
            </h2>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-5">
            <p className="text-sm text-gray-500">Feedback Submitted</p>
            <h2 className="text-3xl font-bold text-green-600 mt-2">
              {sessions.filter((s) => isFeedbackSubmitted(s._id)).length}
            </h2>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-5">
            <p className="text-sm text-gray-500">Pending Feedback</p>
            <h2 className="text-3xl font-bold text-orange-500 mt-2">
              {sessions.filter((s) => !isFeedbackSubmitted(s._id)).length}
            </h2>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">
            {error}
            <button
              onClick={fetchData}
              className="ml-3 underline font-semibold"
            >
              Retry
            </button>
          </div>
        )}

        {/* Sessions */}
        <div className="space-y-5">
          {sessions.length === 0 ? (
            <div className="bg-white border rounded-xl p-10 text-center">
              <h2 className="text-lg font-semibold text-gray-700">
                No Completed Sessions
              </h2>
              <p className="text-gray-500 mt-2">
                Feedback will be available after you complete a counselling
                session.
              </p>
            </div>
          ) : (
            sessions.map((session) => {
              const submitted = isFeedbackSubmitted(session._id);
              const isSelected = selectedSession === session._id;

              return (
                <div
                  key={session._id}
                  className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 sm:p-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800">
                        Counselling Session{" "}
                        {session.sessionNumber
                          ? `#${session.sessionNumber}`
                          : ""}
                      </h2>

                      <p className="text-sm text-gray-500 mt-2">
                        Counsellor: {getCounsellorName(session.counsellor)}
                      </p>

                      <p className="text-sm text-gray-500 mt-1">
                        Date: {formatDate(session.startedAt)}
                      </p>

                      <p className="text-sm text-gray-500 mt-1">
                        Session ID: {session._id}
                      </p>
                    </div>

                    <div>
                      {submitted ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 px-4 py-2 text-sm font-semibold">
                          Feedback Submitted
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedSession(
                              isSelected ? "" : session._id
                            );
                            setRating(0);
                            setFeedback("");
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition"
                        >
                          {isSelected ? "Close Form" : "Give Feedback"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Feedback Form */}
                  {isSelected && !submitted && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-800">
                        Rate Your Experience
                      </h3>

                      <p className="text-sm text-gray-500 mt-1">
                        How was your counselling session?
                      </p>

                      {/* Star Rating */}
                      <div className="flex items-center gap-2 mt-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className="text-3xl sm:text-4xl transition-transform hover:scale-110"
                            aria-label={`Rate ${star} stars`}
                          >
                            <span
                              className={
                                star <= rating
                                  ? "text-yellow-400"
                                  : "text-gray-300"
                              }
                            >
                              ★
                            </span>
                          </button>
                        ))}

                        <span className="ml-2 text-sm font-medium text-gray-600">
                          {rating > 0 ? `${rating}/5` : "Select rating"}
                        </span>
                      </div>

                      {/* Feedback Text */}
                      <div className="mt-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Write Your Feedback
                        </label>

                        <textarea
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          rows={4}
                          maxLength={1000}
                          placeholder="Share your experience with the counsellor..."
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        />

                        <p className="text-right text-xs text-gray-400 mt-1">
                          {feedback.length}/1000 characters
                        </p>
                      </div>

                      {/* Submit */}
                      <div className="flex justify-end mt-4">
                        <button
                          onClick={() => handleSubmit(session._id)}
                          disabled={submitting}
                          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2.5 rounded-lg font-semibold transition"
                        >
                          {submitting ? "Submitting..." : "Submit Feedback"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
