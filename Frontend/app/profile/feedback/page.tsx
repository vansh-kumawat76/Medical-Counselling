"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";

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

type ToastType = "success" | "error" | "warning";

interface ToastState {
  message: string;
  type: ToastType;
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
  const pageRef = useRef<HTMLDivElement>(null);
  const toastRef = useRef<HTMLDivElement>(null);

  const [sessions, setSessions] = useState<Session[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<ToastState | null>(null);

  // Toast Notification
  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (!toast || !toastRef.current) return;

    const element = toastRef.current;

    const timeline = gsap.timeline({
      onComplete: () => {
        setToast(null);
      },
    });

    timeline
      .fromTo(
        element,
        {
          opacity: 0,
          y: -30,
          scale: 0.95,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.4,
          ease: "power3.out",
        }
      )
      .to(element, {
        opacity: 0,
        y: -20,
        duration: 0.35,
        ease: "power2.in",
      }, "+=2.5");

    return () => {
      timeline.kill();
    };
  }, [toast]);

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

  // Main Page GSAP Animation
  useEffect(() => {
    if (loading || !pageRef.current) return;

    const ctx = gsap.context(() => {
      const timeline = gsap.timeline({
        defaults: {
          ease: "power3.out",
        },
      });

      timeline
        .fromTo(
          ".feedback-hero",
          {
            opacity: 0,
            y: -35,
          },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
          }
        )
        .fromTo(
          ".feedback-summary",
          {
            opacity: 0,
            y: 35,
          },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.15,
          },
          "-=0.35"
        )
        .fromTo(
          ".feedback-session-card",
          {
            opacity: 0,
            y: 40,
            scale: 0.97,
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.65,
            stagger: 0.15,
          },
          "-=0.25"
        );
    }, pageRef);

    return () => ctx.revert();
  }, [loading, sessions]);

  // Feedback Form Animation
  useEffect(() => {
    if (!selectedSession || !pageRef.current) return;

    const form = pageRef.current.querySelector(".feedback-form");

    if (!form) return;

    gsap.fromTo(
      form,
      {
        opacity: 0,
        y: 25,
        height: 0,
      },
      {
        opacity: 1,
        y: 0,
        height: "auto",
        duration: 0.55,
        ease: "power3.out",
      }
    );
  }, [selectedSession]);

  const isFeedbackSubmitted = (sessionId: string) => {
    return feedbacks.some(
      (item) => getId(item.counsellingSession) === sessionId
    );
  };

  // Submit Feedback
  const handleSubmit = async (sessionId: string) => {
    if (!rating) {
      showToast("Please select a rating", "warning");
      return;
    }

    if (!feedback.trim()) {
      showToast("Please write your feedback", "warning");
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

      showToast("Feedback submitted successfully!", "success");

      setSelectedSession("");
      setRating(0);
      setFeedback("");

      await fetchData();
    } catch (err) {
      console.error("Feedback submit error:", err);

      showToast(
        err instanceof Error ? err.message : "Something went wrong",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-700 rounded-full animate-spin mx-auto mb-4" />

          <p className="text-slate-700 font-semibold">
            Loading feedback...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={pageRef}
      className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8"
    >
      {/* Toast Notification */}
      {toast && (
        <div
          ref={toastRef}
          className={`fixed top-5 right-5 z-[100] max-w-sm w-[calc(100%-2.5rem)] rounded-xl shadow-2xl border p-4 flex items-center gap-3 ${
            toast.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : toast.type === "error"
              ? "bg-red-50 border-red-200 text-red-800"
              : "bg-amber-50 border-amber-200 text-amber-800"
          }`}
        >
          <span className="text-xl font-bold">
            {toast.type === "success"
              ? "✓"
              : toast.type === "error"
              ? "✕"
              : "!"}
          </span>

          <p className="text-sm font-semibold">
            {toast.message}
          </p>

          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-auto text-lg font-bold opacity-60 hover:opacity-100"
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      )}

      <div className="max-w-5xl mx-auto">

        {/* Navy Blue Hero */}
        <div className="feedback-hero relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#071B3A] via-[#102F5E] to-[#174A7E] p-6 sm:p-8 mb-8 shadow-xl">

          <div className="absolute -top-20 -right-16 w-64 h-64 bg-white/5 rounded-full" />

          <div className="absolute -bottom-28 right-40 w-72 h-72 bg-blue-300/10 rounded-full" />

          <div className="relative z-10">

            <span className="inline-flex items-center rounded-full bg-white/10 border border-white/20 px-4 py-1.5 text-xs font-semibold tracking-wide text-blue-100">
              Student Dashboard
            </span>

            <h1 className="text-2xl sm:text-3xl font-bold text-white mt-4">
              Feedback & Rating
            </h1>

            <p className="mt-2 text-sm sm:text-base text-blue-100 max-w-2xl">
              Share your experience after completing a counselling session.
              Your feedback helps us improve our counselling services.
            </p>

            <div className="mt-6">
              <a
                href="/profile"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#102F5E] shadow-md transition-all duration-300 hover:bg-blue-50 hover:-translate-y-1 hover:shadow-lg"
              >
                <span>←</span>
                Back to Dashboard
              </a>
            </div>

          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">

          <div className="feedback-summary bg-white rounded-xl shadow-sm border border-slate-200 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <p className="text-sm text-slate-600 font-medium">
              Completed Sessions
            </p>

            <h2 className="text-3xl font-bold text-slate-800 mt-2">
              {sessions.length}
            </h2>
          </div>

          <div className="feedback-summary bg-white rounded-xl shadow-sm border border-slate-200 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <p className="text-sm text-slate-600 font-medium">
              Feedback Submitted
            </p>

            <h2 className="text-3xl font-bold text-green-600 mt-2">
              {sessions.filter((s) => isFeedbackSubmitted(s._id)).length}
            </h2>
          </div>

          <div className="feedback-summary bg-white rounded-xl shadow-sm border border-slate-200 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <p className="text-sm text-slate-600 font-medium">
              Pending Feedback
            </p>

            <h2 className="text-3xl font-bold text-orange-500 mt-2">
              {sessions.filter((s) => !isFeedbackSubmitted(s._id)).length}
            </h2>
          </div>

        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">
            <p>{error}</p>

            <button
              onClick={fetchData}
              className="mt-2 underline font-semibold hover:text-red-900"
            >
              Retry
            </button>
          </div>
        )}

        {/* Sessions */}
        <div className="space-y-5">

          {sessions.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center shadow-sm">
              <div className="text-5xl mb-4">📋</div>

              <h2 className="text-lg font-semibold text-slate-800">
                No Completed Sessions
              </h2>

              <p className="text-slate-600 mt-2">
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
                  className="feedback-session-card bg-white border border-slate-200 rounded-xl shadow-sm p-5 sm:p-6 transition-all duration-300 hover:shadow-lg hover:border-blue-200"
                >

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                    <div className="min-w-0">

                      <h2 className="text-lg font-semibold text-slate-800">
                        Counselling Session{" "}
                        {session.sessionNumber
                          ? `#${session.sessionNumber}`
                          : ""}
                      </h2>

                      <p className="text-sm text-slate-600 mt-2">
                        Counsellor: {getCounsellorName(session.counsellor)}
                      </p>

                      <p className="text-sm text-slate-600 mt-1">
                        Date: {formatDate(session.startedAt)}
                      </p>

                      <p className="text-sm text-slate-500 mt-1 break-all">
                        Session ID: {session._id}
                      </p>

                      {session.mode && (
                        <p className="text-sm text-slate-600 mt-1">
                          Mode:{" "}
                          <span className="font-medium capitalize">
                            {session.mode.replace("_", " ")}
                          </span>
                        </p>
                      )}

                    </div>

                    <div className="shrink-0">

                      {submitted ? (
                        <span className="inline-flex items-center gap-2 rounded-full bg-green-100 text-green-700 px-4 py-2 text-sm font-semibold">
                          <span>✓</span>
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
                          className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2.5 rounded-lg font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                        >
                          {isSelected ? "Close Form" : "Give Feedback"}
                        </button>
                      )}

                    </div>

                  </div>

                  {/* Feedback Form */}
                  {isSelected && !submitted && (
                    <div className="feedback-form mt-6 pt-6 border-t border-slate-200">

                      <h3 className="text-lg font-semibold text-slate-800">
                        Rate Your Experience
                      </h3>

                      <p className="text-sm text-slate-600 mt-1">
                        How was your counselling session?
                      </p>

                      {/* Star Rating */}
                      <div className="flex flex-wrap items-center gap-2 mt-4">

                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className="text-3xl sm:text-4xl transition-transform duration-200 hover:scale-125 focus:outline-none"
                            aria-label={`Rate ${star} stars`}
                          >
                            <span
                              className={
                                star <= rating
                                  ? "text-yellow-400"
                                  : "text-slate-300"
                              }
                            >
                              ★
                            </span>
                          </button>
                        ))}

                        <span className="ml-2 text-sm font-semibold text-slate-700">
                          {rating > 0
                            ? `${rating}/5`
                            : "Select rating"}
                        </span>

                      </div>

                      {/* Feedback Text */}
                      <div className="mt-6">

                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Write Your Feedback
                        </label>

                        <textarea
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          rows={4}
                          maxLength={1000}
                          placeholder="Share your experience with the counsellor..."
                          className="w-full border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 resize-none transition"
                        />

                        <p className="text-right text-xs text-slate-500 mt-1">
                          {feedback.length}/1000 characters
                        </p>

                      </div>

                      {/* Submit */}
                      <div className="flex justify-end mt-4">

                        <button
                          onClick={() => handleSubmit(session._id)}
                          disabled={submitting}
                          className="bg-green-600 hover:bg-green-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                        >
                          {submitting
                            ? "Submitting..."
                            : "Submit Feedback"}
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