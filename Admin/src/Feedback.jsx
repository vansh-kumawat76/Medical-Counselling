
import React, { useEffect, useMemo, useState } from "react";
import api from "./Api/axios";
import { toast } from "react-toastify";

const Feedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");

  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [viewModal, setViewModal] = useState(false);
  const [editModal, setEditModal] = useState(false);

  const [editData, setEditData] = useState({
    rating: 5,
    feedback: "",
  });

  const [saving, setSaving] = useState(false);

  // GET ALL FEEDBACK
  const fetchFeedbacks = async () => {
    try {
      setLoading(true);

      const response = await api.get(
        "/feedback/Get-All-Feedback"
      );

      if (response.data.status) {
        setFeedbacks(response.data.data || []);
      } else {
        toast.error(response.data.message || "Unable to fetch feedback");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to fetch feedback"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  // SEARCH AND FILTER
  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((item) => {
      const studentEmail =
        typeof item.student === "object"
          ? item.student?.email || ""
          : "";

      const counsellorEmail =
        typeof item.counsellor === "object"
          ? item.counsellor?.email || ""
          : "";

      const sessionId =
        typeof item.counsellingSession === "object"
          ? item.counsellingSession?._id || ""
          : item.counsellingSession || "";

      const searchText = search.toLowerCase();

      const matchesSearch =
        studentEmail.toLowerCase().includes(searchText) ||
        counsellorEmail.toLowerCase().includes(searchText) ||
        sessionId.toLowerCase().includes(searchText) ||
        (item.feedback || "").toLowerCase().includes(searchText);

      const matchesRating =
        ratingFilter === "all" ||
        String(item.rating) === ratingFilter;

      return matchesSearch && matchesRating;
    });
  }, [feedbacks, search, ratingFilter]);

  // SUMMARY
  const totalFeedback = feedbacks.length;

  const averageRating =
    totalFeedback > 0
      ? (
          feedbacks.reduce(
            (total, item) => total + Number(item.rating || 0),
            0
          ) / totalFeedback
        ).toFixed(1)
      : "0.0";

  const fiveStar = feedbacks.filter(
    (item) => Number(item.rating) === 5
  ).length;

  const lowRating = feedbacks.filter(
    (item) => Number(item.rating) <= 2
  ).length;

  // GET SINGLE FEEDBACK
  const handleView = async (id) => {
    try {
      const response = await api.get(
        `/feedback/Get-Single-Feedback/${id}`
      );

      if (response.data.status) {
        setSelectedFeedback(response.data.data);
        setViewModal(true);
      } else {
        toast.error(response.data.message || "Feedback not found");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to fetch feedback details"
      );
    }
  };

  // OPEN EDIT MODAL
  const handleEdit = (item) => {
    setSelectedFeedback(item);

    setEditData({
      rating: item.rating,
      feedback: item.feedback || "",
    });

    setEditModal(true);
  };

  // UPDATE FEEDBACK
  const handleUpdate = async (e) => {
    e.preventDefault();

    if (Number(editData.rating) < 1 || Number(editData.rating) > 5) {
      toast.error("Rating must be between 1 and 5");
      return;
    }

    try {
      setSaving(true);

      const response = await api.put(
        `/feedback/Update-Feedback/${selectedFeedback._id}`,
        {
          rating: Number(editData.rating),
          feedback: editData.feedback,
        }
      );

      if (response.data.status) {
        toast.success("Feedback updated successfully");
        setEditModal(false);
        setSelectedFeedback(null);
        fetchFeedbacks();
      } else {
        toast.error(response.data.message || "Unable to update feedback");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to update feedback"
      );
    } finally {
      setSaving(false);
    }
  };

  // DELETE FEEDBACK
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this feedback?"
    );

    if (!confirmDelete) return;

    try {
      const response = await api.delete(
        `/feedback/Delete-Feedback/${id}`
      );

      if (response.data.status) {
        toast.success("Feedback deleted successfully");

        setFeedbacks((prev) =>
          prev.filter((item) => item._id !== id)
        );

        setViewModal(false);
        setSelectedFeedback(null);
      } else {
        toast.error(response.data.message || "Unable to delete feedback");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to delete feedback"
      );
    }
  };

  // HELPERS
  const getStudentEmail = (item) => {
    if (!item.student) return "N/A";

    if (typeof item.student === "string") {
      return item.student;
    }

    return item.student.email || item.student.name || "N/A";
  };

  const getCounsellorEmail = (item) => {
    if (!item.counsellor) return "N/A";

    if (typeof item.counsellor === "string") {
      return item.counsellor;
    }

    return item.counsellor.email || item.counsellor.name || "N/A";
  };

  const getSessionId = (item) => {
    if (!item.counsellingSession) return "N/A";

    if (typeof item.counsellingSession === "string") {
      return item.counsellingSession;
    }

    return item.counsellingSession._id || "N/A";
  };

  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={
              star <= Number(rating)
                ? "text-amber-400"
                : "text-gray-300"
            }
          >
            ★
          </span>
        ))}
        <span className="ml-1 text-sm font-semibold text-gray-700">
          {rating}/5
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* HEADER */}
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Feedback & Ratings
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage student feedback and counselling ratings.
          </p>
        </div>

        <button
          onClick={fetchFeedbacks}
          disabled={loading}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "↻ Refresh"}
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Total Feedback
          </p>
          <h2 className="mt-2 text-3xl font-bold text-gray-800">
            {totalFeedback}
          </h2>
          <p className="mt-1 text-xs text-gray-400">
            Total submissions
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Average Rating
          </p>
          <h2 className="mt-2 text-3xl font-bold text-gray-800">
            {averageRating} <span className="text-amber-400">★</span>
          </h2>
          <p className="mt-1 text-xs text-gray-400">
            Out of 5 stars
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            5 Star Feedback
          </p>
          <h2 className="mt-2 text-3xl font-bold text-green-600">
            {fiveStar}
          </h2>
          <p className="mt-1 text-xs text-gray-400">
            Excellent ratings
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Low Ratings
          </p>
          <h2 className="mt-2 text-3xl font-bold text-red-500">
            {lowRating}
          </h2>
          <p className="mt-1 text-xs text-gray-400">
            Ratings of 1 or 2 stars
          </p>
        </div>
      </div>

      {/* FILTERS */}
      <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student, counsellor or feedback..."
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 md:w-52"
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>
      </div>

      {/* FEEDBACK TABLE */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="font-semibold text-gray-800">
            All Feedback
          </h2>

          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
            {filteredFeedbacks.length} Records
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-gray-500">
            Loading feedback...
          </div>
        ) : filteredFeedbacks.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mb-3 text-4xl">⭐</div>
            <h3 className="font-semibold text-gray-700">
              No feedback found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Feedback records will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Student</th>
                  <th className="px-5 py-4 font-semibold">Counsellor</th>
                  <th className="px-5 py-4 font-semibold">Rating</th>
                  <th className="px-5 py-4 font-semibold">Feedback</th>
                  <th className="px-5 py-4 font-semibold">Date</th>
                  <th className="px-5 py-4 text-center font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredFeedbacks.map((item) => (
                  <tr key={item._id} className="transition hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-gray-800">
                        {getStudentEmail(item)}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-700">
                        {getCounsellorEmail(item)}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      {renderStars(item.rating)}
                    </td>

                    <td className="max-w-xs px-5 py-4">
                      <p className="truncate text-sm text-gray-600">
                        {item.feedback || "No written feedback"}
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-500">
                      {formatDate(item.createdAt)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleView(item._id)}
                          className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-100"
                        >
                          View
                        </button>

                        <button
                          onClick={() => handleEdit(item)}
                          className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-600 hover:bg-amber-100"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(item._id)}
                          className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* VIEW MODAL */}
      {viewModal && selectedFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-auto w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 p-5">
              <h2 className="text-lg font-bold text-gray-800">
                Feedback Details
              </h2>

              <button
                onClick={() => setViewModal(false)}
                className="text-2xl text-gray-400 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div>
                <p className="text-xs font-semibold uppercase text-gray-400">
                  Student
                </p>
                <p className="mt-1 text-sm font-medium text-gray-800">
                  {getStudentEmail(selectedFeedback)}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-gray-400">
                  Counsellor
                </p>
                <p className="mt-1 text-sm font-medium text-gray-800">
                  {getCounsellorEmail(selectedFeedback)}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-gray-400">
                  Session ID
                </p>
                <p className="mt-1 break-all text-sm text-gray-700">
                  {getSessionId(selectedFeedback)}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-gray-400">
                  Rating
                </p>
                <div className="mt-2">
                  {renderStars(selectedFeedback.rating)}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-gray-400">
                  Written Feedback
                </p>
                <p className="mt-2 whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm leading-6 text-gray-700">
                  {selectedFeedback.feedback || "No written feedback provided."}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-gray-400">
                  Submitted At
                </p>
                <p className="mt-1 text-sm text-gray-700">
                  {formatDate(selectedFeedback.createdAt)}
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 p-5">
              <button
                onClick={() => setViewModal(false)}
                className="w-full rounded-lg bg-gray-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editModal && selectedFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-auto w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 p-5">
              <h2 className="text-lg font-bold text-gray-800">
                Update Feedback
              </h2>

              <button
                onClick={() => setEditModal(false)}
                className="text-2xl text-gray-400 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-5 p-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Rating
                </label>

                <select
                  value={editData.rating}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      rating: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                >
                  <option value={5}>5 Stars</option>
                  <option value={4}>4 Stars</option>
                  <option value={3}>3 Stars</option>
                  <option value={2}>2 Stars</option>
                  <option value={1}>1 Star</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Written Feedback
                </label>

                <textarea
                  rows={5}
                  maxLength={1000}
                  value={editData.feedback}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      feedback: e.target.value,
                    })
                  }
                  placeholder="Enter feedback..."
                  className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />

                <p className="mt-1 text-right text-xs text-gray-400">
                  {editData.feedback.length}/1000
                </p>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setEditModal(false)}
                  className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Updating..." : "Update Feedback"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Feedback;
