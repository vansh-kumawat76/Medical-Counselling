
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, CheckCircle, XCircle, Trash2, Star, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";

import api from "./Api/axios";

import {
  PageHeader,
  Modal,
  DetailRow,
  StatusBadge,
  Avatar,
  FilterBar,
  SearchInput,
  DataTable,
  Pagination,
  EmptyState,
} from "./assets/Components/ui/ui";

const API = "/college-review";

const ITEMS_PER_PAGE = 10;

const getId = (value) => {
  if (!value) return "";
  if (typeof value === "object") return value._id || value.id || "";
  return value;
};

const getStudentName = (review) => {
  return (
    review?.student?.name ||
    review?.studentName ||
    review?.student?.email ||
    "Student"
  );
};

const getCollegeName = (review) => {
  return (
    review?.college?.name ||
    review?.collegeName ||
    "College"
  );
};

const formatDate = (date) => {
  if (!date) return "N/A";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getErrorMessage = (error) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    "Something went wrong. Please try again."
  );
};

const facilitiesList = [
  "hostel",
  "library",
  "laboratory",
  "classrooms",
  "canteen",
  "sports",
  "wifi",
  "transport",
  "cleanliness",
  "safety",
];

const ReviewStatus = ({ status }) => {
  const styles = {
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${
        styles[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {status || "Unknown"}
    </span>
  );
};

const Rating = ({ value }) => {
  const rating = Number(value || 0);

  return (
    <div className="flex items-center gap-1">
      <Star size={15} className="fill-amber-400 text-amber-400" />
      <span className="font-semibold text-gray-800">{rating}/5</span>
    </div>
  );
};

const CollegeReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReview, setSelectedReview] = useState(null);

  const [actionLoading, setActionLoading] = useState(false);

  // Fetch all reviews
  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);

      const response = await api.get(`${API}/admin/all-reviews`);

      const responseData = response?.data;

      const reviewData = Array.isArray(responseData?.data)
        ? responseData.data
        : Array.isArray(responseData?.reviews)
        ? responseData.reviews
        : [];

      setReviews(reviewData);
    } catch (error) {
      console.error("Fetch college reviews error:", error);
      toast.error(getErrorMessage(error));
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: reviews.length,
      pending: reviews.filter((item) => item.status === "pending").length,
      approved: reviews.filter((item) => item.status === "approved").length,
      rejected: reviews.filter((item) => item.status === "rejected").length,
    };
  }, [reviews]);

  // Search and status filter
  const filteredReviews = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return reviews.filter((review) => {
      const matchesStatus =
        statusFilter === "all" || review.status === statusFilter;

      const searchableText = [
        getStudentName(review),
        review?.student?.email,
        getCollegeName(review),
        review?.reviewTitle,
        review?.department,
        review?.review,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !searchValue || searchableText.includes(searchValue);

      return matchesStatus && matchesSearch;
    });
  }, [reviews, search, statusFilter]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredReviews.length / ITEMS_PER_PAGE)
  );

  const paginatedReviews = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

    return filteredReviews.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );
  }, [filteredReviews, currentPage]);

  // Approve review
  const handleApprove = async (review) => {
    const reviewId = getId(review);

    if (!reviewId) {
      toast.error("Review ID not found.");
      return;
    }

    if (!window.confirm("Are you sure you want to approve this review?")) {
      return;
    }

    try {
      setActionLoading(true);

      await api.put(`${API}/admin/approve/${reviewId}`);

      toast.success("Review approved successfully!");

      setSelectedReview(null);
      await fetchReviews();
    } catch (error) {
      console.error("Approve review error:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setActionLoading(false);
    }
  };

  // Reject review
  const handleReject = async (review) => {
    const reviewId = getId(review);

    if (!reviewId) {
      toast.error("Review ID not found.");
      return;
    }

    if (!window.confirm("Are you sure you want to reject this review?")) {
      return;
    }

    try {
      setActionLoading(true);

      await api.put(`${API}/admin/reject/${reviewId}`);

      toast.success("Review rejected successfully!");

      setSelectedReview(null);
      await fetchReviews();
    } catch (error) {
      console.error("Reject review error:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setActionLoading(false);
    }
  };

  // Delete review
  const handleDelete = async (review) => {
    const reviewId = getId(review);

    if (!reviewId) {
      toast.error("Review ID not found.");
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to permanently delete this review?"
      )
    ) {
      return;
    }

    try {
      setActionLoading(true);

      await api.delete(`${API}/admin/delete/${reviewId}`);

      toast.success("Review deleted successfully!");

      setSelectedReview(null);
      await fetchReviews();
    } catch (error) {
      console.error("Delete review error:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setActionLoading(false);
    }
  };

  // Table columns
  const columns = [
    {
      header: "Student",
      cell: (review) => (
        <div className="flex items-center gap-3 min-w-0">
          <Avatar name={getStudentName(review)} />
          <div className="min-w-0">
            <p className="font-semibold text-gray-800 truncate">
              {getStudentName(review)}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {review?.student?.email || ""}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "College",
      cell: (review) => (
        <span className="font-medium text-gray-700">
          {getCollegeName(review)}
        </span>
      ),
    },
    {
      header: "Rating",
      cell: (review) => <Rating value={review.overallRating} />,
    },
    {
      header: "Review",
      cell: (review) => (
        <div className="max-w-[190px]">
          <p className="font-medium text-gray-800 truncate">
            {review.reviewTitle || "Untitled"}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {review.review || ""}
          </p>
        </div>
      ),
    },
    {
      header: "Date",
      cell: (review) => (
        <span className="text-sm text-gray-600">
          {formatDate(review.createdAt)}
        </span>
      ),
    },
    {
      header: "Status",
      cell: (review) => <ReviewStatus status={review.status} />,
    },
  ];

  // Mobile card layout
  const renderCard = (review) => (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar name={getStudentName(review)} />
          <div className="min-w-0">
            <p className="font-semibold text-gray-800 truncate">
              {getStudentName(review)}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {getCollegeName(review)}
            </p>
          </div>
        </div>

        <ReviewStatus status={review.status} />
      </div>

      <div>
        <p className="font-semibold text-gray-800">
          {review.reviewTitle || "Untitled"}
        </p>
        <p className="text-sm text-gray-500 line-clamp-2">
          {review.review || ""}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <Rating value={review.overallRating} />
        <span className="text-xs text-gray-500">
          {formatDate(review.createdAt)}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
        <button
          onClick={() => setSelectedReview(review)}
          className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Eye size={15} /> View
        </button>

        {review.status !== "approved" && (
          <button
            disabled={actionLoading}
            onClick={() => handleApprove(review)}
            className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            <CheckCircle size={15} /> Approve
          </button>
        )}

        {review.status !== "rejected" && (
          <button
            disabled={actionLoading}
            onClick={() => handleReject(review)}
            className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
          >
            <XCircle size={15} /> Reject
          </button>
        )}

        <button
          disabled={actionLoading}
          onClick={() => handleDelete(review)}
          className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
        >
          <Trash2 size={15} /> Delete
        </button>
      </div>
    </div>
  );

  // Desktop row actions
  const renderActions = (review) => (
    <div className="flex items-center gap-1">
      <button
        title="View details"
        onClick={() => setSelectedReview(review)}
        className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
      >
        <Eye size={17} />
      </button>

      {review.status !== "approved" && (
        <button
          title="Approve"
          disabled={actionLoading}
          onClick={() => handleApprove(review)}
          className="rounded-lg p-2 text-green-600 hover:bg-green-50 disabled:opacity-50"
        >
          <CheckCircle size={17} />
        </button>
      )}

      {review.status !== "rejected" && (
        <button
          title="Reject"
          disabled={actionLoading}
          onClick={() => handleReject(review)}
          className="rounded-lg p-2 text-amber-600 hover:bg-amber-50 disabled:opacity-50"
        >
          <XCircle size={17} />
        </button>
      )}

      <button
        title="Delete"
        disabled={actionLoading}
        onClick={() => handleDelete(review)}
        className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        <Trash2 size={17} />
      </button>
    </div>
  );

  const renderFacilities = (facilities) => {
    if (!facilities || typeof facilities !== "object") {
      return <p className="text-sm text-gray-500">No facility ratings added.</p>;
    }

    const availableFacilities = facilitiesList.filter(
      (key) => facilities[key] !== undefined && facilities[key] !== null
    );

    if (!availableFacilities.length) {
      return <p className="text-sm text-gray-500">No facility ratings added.</p>;
    }

    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {availableFacilities.map((key) => (
          <div
            key={key}
            className="rounded-lg border border-gray-100 bg-gray-50 p-3"
          >
            <p className="text-xs capitalize text-gray-500">{key}</p>
            <div className="mt-1">
              <Rating value={facilities[key]} />
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="College Reviews"
        subtitle="Manage, review and moderate student college reviews."
        actions={
          <button
            onClick={fetchReviews}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        }
      />

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Reviews</p>
          <p className="mt-2 text-2xl font-bold text-gray-800">{stats.total}</p>
        </div>

        <div className="rounded-xl border border-amber-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Pending Reviews</p>
          <p className="mt-2 text-2xl font-bold text-amber-600">
            {stats.pending}
          </p>
        </div>

        <div className="rounded-xl border border-green-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Approved Reviews</p>
          <p className="mt-2 text-2xl font-bold text-green-600">
            {stats.approved}
          </p>
        </div>

        <div className="rounded-xl border border-red-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Rejected Reviews</p>
          <p className="mt-2 text-2xl font-bold text-red-600">
            {stats.rejected}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <FilterBar
          onClear={() => {
            setSearch("");
            setStatusFilter("all");
          }}
          showClear={Boolean(search || statusFilter !== "all")}
        >
          <div className="w-full">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search student, college or review..."
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {["all", "pending", "approved", "rejected"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-lg px-3 py-2 text-sm font-medium capitalize transition ${
                  statusFilter === status
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </FilterBar>
      </div>

      {/* Reviews table */}
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-800">Student Reviews</h2>
            <p className="text-sm text-gray-500">
              {filteredReviews.length} review(s) found
            </p>
          </div>
        </div>

        <DataTable
          columns={columns}
          rows={paginatedReviews}
          rowKey="_id"
          startIndex={(currentPage - 1) * ITEMS_PER_PAGE}
          renderActions={renderActions}
          renderCard={renderCard}
          loading={loading}
          emptyTitle="No reviews found"
          emptyHint="Student reviews will appear here."
        />

        {!loading && filteredReviews.length > 0 && (
          <div className="mt-5">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Review details modal */}
      <Modal
        open={Boolean(selectedReview)}
        title="Review Details"
        onClose={() => setSelectedReview(null)}
        size="lg"
        footer={
          selectedReview && (
            <div className="flex flex-wrap justify-end gap-2">
              <button
                onClick={() => setSelectedReview(null)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>

              {selectedReview.status !== "approved" && (
                <button
                  disabled={actionLoading}
                  onClick={() => handleApprove(selectedReview)}
                  className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle size={16} /> Approve
                </button>
              )}

              {selectedReview.status !== "rejected" && (
                <button
                  disabled={actionLoading}
                  onClick={() => handleReject(selectedReview)}
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
                >
                  <XCircle size={16} /> Reject
                </button>
              )}

              <button
                disabled={actionLoading}
                onClick={() => handleDelete(selectedReview)}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                <Trash2 size={16} /> Delete
              </button>
            </div>
          )
        }
      >
        {selectedReview && (
          <div className="max-h-[65vh] space-y-5 overflow-y-auto pr-1">
            {/* Student and college */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gray-50 p-4">
              <div className="flex items-center gap-3">
                <Avatar name={getStudentName(selectedReview)} size="lg" />
                <div>
                  <p className="font-semibold text-gray-800">
                    {getStudentName(selectedReview)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {selectedReview?.student?.email || "Student"}
                  </p>
                </div>
              </div>

              <ReviewStatus status={selectedReview.status} />
            </div>

            <div className="space-y-2">
              <DetailRow label="College">
                {getCollegeName(selectedReview)}
              </DetailRow>

              <DetailRow label="Overall Rating">
                <Rating value={selectedReview.overallRating} />
              </DetailRow>

              <DetailRow label="Study Year">
                {selectedReview.studyYear || "Not specified"}
              </DetailRow>

              <DetailRow label="Department">
                {selectedReview.department || "Not specified"}
              </DetailRow>

              {selectedReview.departmentRating !== undefined && (
                <DetailRow label="Department Rating">
                  <Rating value={selectedReview.departmentRating} />
                </DetailRow>
              )}

              <DetailRow label="Submitted On">
                {formatDate(selectedReview.createdAt)}
              </DetailRow>

              <DetailRow label="Helpful Votes">
                {selectedReview.helpfulCount || 0}
              </DetailRow>
            </div>

            {/* Review content */}
            <div>
              <h3 className="mb-2 font-semibold text-gray-800">Review</h3>
              <div className="rounded-xl border border-gray-100 p-4">
                <h4 className="font-semibold text-gray-800">
                  {selectedReview.reviewTitle}
                </h4>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">
                  {selectedReview.review || "No review description."}
                </p>
              </div>
            </div>

            {/* Pros and cons */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-green-100 bg-green-50 p-4">
                <h3 className="mb-2 font-semibold text-green-700">Pros</h3>
                <p className="whitespace-pre-wrap text-sm text-gray-700">
                  {selectedReview.pros || "Not provided"}
                </p>
              </div>

              <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                <h3 className="mb-2 font-semibold text-red-700">Cons</h3>
                <p className="whitespace-pre-wrap text-sm text-gray-700">
                  {selectedReview.cons || "Not provided"}
                </p>
              </div>
            </div>

            {/* Facilities */}
            <div>
              <h3 className="mb-3 font-semibold text-gray-800">
                Facilities Ratings
              </h3>
              {renderFacilities(selectedReview.facilities)}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CollegeReviews;
