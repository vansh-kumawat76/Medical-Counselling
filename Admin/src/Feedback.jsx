
import React, { useEffect, useMemo, useState } from "react";
import api from "./Api/axios";
import { toast } from "react-toastify";
import { RefreshCw, Star } from "lucide-react";

import {
  ui,
  PageHeader,
  Modal,
  Field,
  DetailRow,
  RowActions,
  FilterBar,
  SearchInput,
  DataTable,
  Pagination,
} from "./assets/Components/ui/ui";

const Feedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [viewModal, setViewModal] = useState(false);
  const [editModal, setEditModal] = useState(false);

  const [editData, setEditData] = useState({
    rating: 5,
    feedback: "",
  });

  const [saving, setSaving] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ================= GET ALL FEEDBACK =================

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);

      const response = await api.get("/feedback/Get-All-Feedback");

      if (response.data.status) {
        setFeedbacks(response.data.data || []);
      } else {
        toast.error(
          response.data.message || "Unable to fetch feedback"
        );
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

  // ================= HELPERS =================

  const getStudentEmail = (item) => {
    if (!item?.student) return "N/A";

    if (typeof item.student === "string") {
      return item.student;
    }

    return item.student.email || item.student.name || "N/A";
  };

  const getCounsellorEmail = (item) => {
    if (!item?.counsellor) return "N/A";

    if (typeof item.counsellor === "string") {
      return item.counsellor;
    }

    return item.counsellor.email || item.counsellor.name || "N/A";
  };

  const getSessionId = (item) => {
    if (!item?.counsellingSession) return "N/A";

    if (typeof item.counsellingSession === "string") {
      return item.counsellingSession;
    }

    return item.counsellingSession._id || "N/A";
  };

  const formatDate = (date) => {
    if (!date) return "N/A";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "N/A";

    return parsedDate.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const renderStars = (rating) => {
    const value = Number(rating || 0);

    return (
      <div className="flex items-center gap-1 whitespace-nowrap">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={15}
            className={
              star <= value
                ? "fill-amber-400 text-amber-400"
                : "fill-slate-100 text-slate-300"
            }
          />
        ))}

        <span className="ml-1 text-xs font-semibold text-slate-700">
          {value}/5
        </span>
      </div>
    );
  };

  // ================= SUMMARY =================

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

  // ================= SEARCH + FILTER + SORT =================

  const filteredFeedbacks = useMemo(() => {
    let result = [...feedbacks];

    if (search.trim()) {
      const searchText = search.toLowerCase().trim();

      result = result.filter((item) => {
        const studentEmail = getStudentEmail(item);
        const counsellorEmail = getCounsellorEmail(item);
        const sessionId = getSessionId(item);

        return [
          studentEmail,
          counsellorEmail,
          sessionId,
          item.feedback || "",
          item.rating || "",
        ].some((value) =>
          String(value).toLowerCase().includes(searchText)
        );
      });
    }

    if (ratingFilter !== "all") {
      result = result.filter(
        (item) => String(item.rating) === ratingFilter
      );
    }

    if (sortOrder === "newest") {
      result.sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      );
    } else if (sortOrder === "oldest") {
      result.sort(
        (a, b) =>
          new Date(a.createdAt || 0).getTime() -
          new Date(b.createdAt || 0).getTime()
      );
    } else if (sortOrder === "rating-high") {
      result.sort(
        (a, b) => Number(b.rating || 0) - Number(a.rating || 0)
      );
    } else if (sortOrder === "rating-low") {
      result.sort(
        (a, b) => Number(a.rating || 0) - Number(b.rating || 0)
      );
    }

    return result;
  }, [feedbacks, search, ratingFilter, sortOrder]);

  // ================= PAGINATION =================

  const totalPages = Math.ceil(
    filteredFeedbacks.length / itemsPerPage
  );

  const paginatedFeedbacks = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;

    return filteredFeedbacks.slice(
      startIndex,
      startIndex + itemsPerPage
    );
  }, [filteredFeedbacks, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, ratingFilter, sortOrder]);

  // ================= CLEAR FILTERS =================

  const clearFilters = () => {
    setSearch("");
    setRatingFilter("all");
    setSortOrder("newest");
    setCurrentPage(1);
  };

  const hasFilters =
    search !== "" ||
    ratingFilter !== "all" ||
    sortOrder !== "newest";

  // ================= GET SINGLE FEEDBACK =================

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
        error.response?.data?.message ||
          "Unable to fetch feedback details"
      );
    }
  };

  // ================= OPEN EDIT MODAL =================

  const handleEdit = (item) => {
    setSelectedFeedback(item);

    setEditData({
      rating: Number(item.rating || 5),
      feedback: item.feedback || "",
    });

    setEditModal(true);
  };

  // ================= UPDATE FEEDBACK =================

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!selectedFeedback?._id) {
      toast.error("Feedback record not found");
      return;
    }

    if (
      Number(editData.rating) < 1 ||
      Number(editData.rating) > 5
    ) {
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

        await fetchFeedbacks();
      } else {
        toast.error(
          response.data.message || "Unable to update feedback"
        );
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to update feedback"
      );
    } finally {
      setSaving(false);
    }
  };

  // ================= DELETE FEEDBACK =================

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
        setEditModal(false);
        setSelectedFeedback(null);
      } else {
        toast.error(
          response.data.message || "Unable to delete feedback"
        );
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to delete feedback"
      );
    }
  };

  // ================= TABLE COLUMNS =================

  const columns = [
    {
      header: "Student",
      className: "w-[19%]",
      cell: (item) => (
        <span
          className="block truncate font-medium text-slate-800"
          title={getStudentEmail(item)}
        >
          {getStudentEmail(item)}
        </span>
      ),
    },
    {
      header: "Counsellor",
      className: "w-[19%]",
      cell: (item) => (
        <span
          className="block truncate text-slate-600"
          title={getCounsellorEmail(item)}
        >
          {getCounsellorEmail(item)}
        </span>
      ),
    },
    {
      header: "Rating",
      className: "w-[17%]",
      cell: (item) => renderStars(item.rating),
    },
    {
      header: "Feedback",
      className: "w-[22%]",
      hideBelow: "lg",
      truncate: true,
      cell: (item) => (
        <span title={item.feedback || ""}>
          {item.feedback || "No written feedback"}
        </span>
      ),
    },
    {
      header: "Date",
      className: "w-[15%]",
      hideBelow: "md",
      cell: (item) => (
        <span className="whitespace-nowrap text-xs text-slate-500">
          {formatDate(item.createdAt)}
        </span>
      ),
    },
  ];

  // ================= TABLE ACTIONS =================

  const renderActions = (item) => (
    <RowActions
      onView={() => handleView(item._id)}
      onEdit={() => handleEdit(item)}
      onDelete={() => handleDelete(item._id)}
    />
  );

  // ================= MOBILE CARD =================

  const renderCard = (item, index) => (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-all text-sm font-semibold text-slate-800">
            {getStudentEmail(item)}
          </p>

          <p className="mt-1 break-all text-xs text-slate-500">
            Counsellor: {getCounsellorEmail(item)}
          </p>
        </div>

        {renderStars(item.rating)}
      </div>

      <div className="rounded-lg bg-slate-50 p-3">
        <p className="line-clamp-3 whitespace-pre-wrap text-sm text-slate-600">
          {item.feedback || "No written feedback"}
        </p>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <div>
          <p className="text-xs text-slate-400">
            {formatDate(item.createdAt)}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            #{(currentPage - 1) * itemsPerPage + index + 1}
          </p>
        </div>

        <RowActions
          onView={() => handleView(item._id)}
          onEdit={() => handleEdit(item)}
          onDelete={() => handleDelete(item._id)}
        />
      </div>
    </div>
  );

  // ================= RENDER =================

  return (
    <div className={ui.page}>
      <div className={ui.container}>

        {/* PAGE HEADER */}

        <PageHeader
          title="Feedback & Ratings"
          subtitle="Manage student feedback and counselling ratings."
          actions={
            <button
              type="button"
              onClick={fetchFeedbacks}
              disabled={loading}
              className={ui.btnSecondary}
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          }
        />

        {/* SUMMARY CARDS */}

        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className={`${ui.card} p-4`}>
            <p className="text-sm font-medium text-slate-500">
              Total Feedback
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-800">
              {totalFeedback}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Total submissions
            </p>
          </div>

          <div className={`${ui.card} p-4`}>
            <p className="text-sm font-medium text-slate-500">
              Average Rating
            </p>
            <p className="mt-2 flex items-center gap-2 text-2xl font-bold text-slate-800">
              {averageRating}
              <Star size={20} className="fill-amber-400 text-amber-400" />
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Out of 5 stars
            </p>
          </div>

          <div className={`${ui.card} p-4`}>
            <p className="text-sm font-medium text-slate-500">
              5 Star Feedback
            </p>
            <p className="mt-2 text-2xl font-bold text-emerald-600">
              {fiveStar}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Excellent ratings
            </p>
          </div>

          <div className={`${ui.card} p-4`}>
            <p className="text-sm font-medium text-slate-500">
              Low Ratings
            </p>
            <p className="mt-2 text-2xl font-bold text-rose-600">
              {lowRating}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Ratings of 1 or 2 stars
            </p>
          </div>
        </div>

        {/* FILTERS */}

        <FilterBar
          onClear={clearFilters}
          showClear={hasFilters}
        >
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search student, counsellor, session..."
            className="col-span-2 lg:col-span-6"
          />

          <div className="col-span-1 lg:col-span-3">
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className={ui.select}
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>

          <div className="col-span-1 lg:col-span-3">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className={ui.select}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="rating-high">Rating: High to Low</option>
              <option value="rating-low">Rating: Low to High</option>
            </select>
          </div>
        </FilterBar>

        {/* FEEDBACK TABLE */}

        <DataTable
          columns={columns}
          rows={paginatedFeedbacks}
          rowKey="_id"
          startIndex={(currentPage - 1) * itemsPerPage}
          renderActions={renderActions}
          renderCard={renderCard}
          loading={loading}
          emptyTitle="No feedback found"
          emptyHint="Try changing your search or filters."
        />

        {/* TABLE FOOTER + PAGINATION */}

        {!loading && filteredFeedbacks.length > 0 && (
          <>
            <div className="mt-3 flex flex-col justify-between gap-2 px-1 text-sm text-slate-500 sm:flex-row sm:items-center">
              <p>
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {(currentPage - 1) * itemsPerPage + 1}
                </span>
                {" "}to{" "}
                <span className="font-semibold text-slate-700">
                  {Math.min(
                    currentPage * itemsPerPage,
                    filteredFeedbacks.length
                  )}
                </span>
                {" "}of{" "}
                <span className="font-semibold text-slate-700">
                  {filteredFeedbacks.length}
                </span>
                {" "}feedback records
              </p>
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onChange={setCurrentPage}
            />
          </>
        )}

        {/* VIEW FEEDBACK MODAL */}

        <Modal
          open={viewModal && !!selectedFeedback}
          title="Feedback Details"
          onClose={() => setViewModal(false)}
          size="lg"
          footer={
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setViewModal(false)}
                className={ui.btnSecondary}
              >
                Close
              </button>
            </div>
          }
        >
          {selectedFeedback && (
            <div className="space-y-5">
              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-800">
                  Feedback Information
                </h3>

                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 px-4">
                  <DetailRow label="Student">
                    <span className="break-all">
                      {getStudentEmail(selectedFeedback)}
                    </span>
                  </DetailRow>

                  <DetailRow label="Counsellor">
                    <span className="break-all">
                      {getCounsellorEmail(selectedFeedback)}
                    </span>
                  </DetailRow>

                  <DetailRow label="Session ID">
                    <span className="break-all">
                      {getSessionId(selectedFeedback)}
                    </span>
                  </DetailRow>

                  <DetailRow label="Rating">
                    {renderStars(selectedFeedback.rating)}
                  </DetailRow>

                  <DetailRow label="Submitted At">
                    {formatDate(selectedFeedback.createdAt)}
                  </DetailRow>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-800">
                  Written Feedback
                </h3>

                <div className="whitespace-pre-wrap break-words rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700">
                  {selectedFeedback.feedback ||
                    "No written feedback provided."}
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* EDIT FEEDBACK MODAL */}

        <Modal
          open={editModal && !!selectedFeedback}
          title="Update Feedback"
          onClose={() => setEditModal(false)}
          size="md"
          footer={
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setEditModal(false)}
                disabled={saving}
                className={ui.btnSecondary}
              >
                Cancel
              </button>

              <button
                type="submit"
                form="feedback-edit-form"
                disabled={saving}
                className={ui.btnPrimary}
              >
                {saving ? "Updating..." : "Update Feedback"}
              </button>
            </div>
          }
        >
          <form
            id="feedback-edit-form"
            onSubmit={handleUpdate}
            className="space-y-5"
          >
            <Field label="Rating">
              <select
                value={editData.rating}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    rating: Number(e.target.value),
                  }))
                }
                className={ui.select}
              >
                <option value={5}>5 Stars</option>
                <option value={4}>4 Stars</option>
                <option value={3}>3 Stars</option>
                <option value={2}>2 Stars</option>
                <option value={1}>1 Star</option>
              </select>
            </Field>

            <Field label="Written Feedback">
              <textarea
                rows={5}
                maxLength={1000}
                value={editData.feedback}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    feedback: e.target.value,
                  }))
                }
                placeholder="Enter feedback..."
                className={`${ui.input} resize-none`}
              />

              <p className="mt-1 text-right text-xs text-slate-400">
                {editData.feedback.length}/1000
              </p>
            </Field>
          </form>
        </Modal>
      </div>
    </div>
  );
};

export default Feedback;
