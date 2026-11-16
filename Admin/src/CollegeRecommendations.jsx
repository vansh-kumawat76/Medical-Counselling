
import React, { useCallback, useEffect, useMemo, useState } from "react";
import api from "./Api/axios";
import { toast } from "react-toastify";

const API = "/college-recommendation";

const getId = (value) => {
  if (!value) return "";
  return typeof value === "object" ? value._id || value.id || "" : value;
};

const getName = (value) => {
  if (!value) return "N/A";
  if (typeof value === "string") return value;
  return value.name || value.collegeName || value.courseName || value.title || "N/A";
};

const getRole = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const role = user.role;
    return typeof role === "object" ? role.role : role;
  } catch {
    return "";
  }
};

const formatDate = (date) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const StatusBadge = ({ status }) => {
  const styles = {
    draft: "bg-amber-100 text-amber-700",
    shared: "bg-blue-100 text-blue-700",
    accepted: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    pending: "bg-gray-100 text-gray-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${
        styles[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {(status || "N/A").replaceAll("_", " ")}
    </span>
  );
};

const DetailItem = ({ label, value }) => (
  <div>
    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
      {label}
    </p>
    <p className="mt-1 break-words text-sm font-medium text-gray-800">
      {value || "N/A"}
    </p>
  </div>
);

const CollegeRecommendations = () => {
  const role = getRole();
  const isCounsellor = role === "Counsellor";

  const [recommendations, setRecommendations] = useState([]);
  const [counsellingRequests, setCounsellingRequests] = useState([]);
  const [collegeCourses, setCollegeCourses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [responseFilter, setResponseFilter] = useState("all");

  const [showDetails, setShowDetails] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingRecommendation, setEditingRecommendation] = useState(null);

  const [formData, setFormData] = useState({
    counsellingRequestId: "",
    counsellorRemarks: "",
    colleges: [],
  });

  const [collegeForm, setCollegeForm] = useState({
    collegeCourse: "",
    fees: "",
    remarks: "",
    recommendationReason: "",
  });

  const fetchRecommendations = useCallback(async () => {
    try {
      setLoading(true);

      const response = await api.get(
        `${API}/get-all-recommendations`
      );

      setRecommendations(response.data?.data || []);
    } catch (error) {
      console.error("Fetch recommendations error:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to fetch college recommendations"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCounsellingRequests = useCallback(async () => {
    if (!isCounsellor) return;

    try {
      const response = await api.get(
        "/counsellingRequest/getCounseller-request"
      );

      const data = response.data?.data || [];
      setCounsellingRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch counselling requests error:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to fetch assigned counselling requests"
      );
    }
  }, [isCounsellor]);

  const fetchCollegeCourses = useCallback(async () => {
    if (!isCounsellor) return;

    try {
      const response = await api.get(
        "/college-course/get-all-college-courses"
      );

      const data = response.data?.data || [];
      setCollegeCourses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch college courses error:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to fetch college courses"
      );
    }
  }, [isCounsellor]);

  useEffect(() => {
    fetchRecommendations();
    fetchCounsellingRequests();
    fetchCollegeCourses();
  }, [
    fetchRecommendations,
    fetchCounsellingRequests,
    fetchCollegeCourses,
  ]);

  const stats = useMemo(() => {
    return {
      total: recommendations.length,
      draft: recommendations.filter((item) => item.status === "draft").length,
      shared: recommendations.filter((item) => item.status === "shared").length,
      accepted: recommendations.filter(
        (item) => item.studentResponse?.status === "accepted"
      ).length,
      rejected: recommendations.filter(
        (item) => item.studentResponse?.status === "rejected"
      ).length,
      pending: recommendations.filter(
        (item) =>
          !item.studentResponse?.status ||
          item.studentResponse.status === "pending"
      ).length,
    };
  }, [recommendations]);

  const filteredRecommendations = useMemo(() => {
    return recommendations.filter((item) => {
      const studentName =
        item.student?.name ||
        item.student?.fullName ||
        item.student?.email ||
        "";

      const counsellorName =
        item.counsellor?.name ||
        item.counsellor?.fullName ||
        item.counsellor?.email ||
        "";

      const collegeNames = (item.colleges || [])
        .map((college) => getName(college.college))
        .join(" ");

      const courseNames = (item.colleges || [])
        .map((college) => getName(college.course))
        .join(" ");

      const requestNumber =
        item.counsellingRequest?.requestNumber ||
        item.counsellingRequest?._id ||
        "";

      const searchText = [
        studentName,
        counsellorName,
        collegeNames,
        courseNames,
        requestNumber,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchText.includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;

      const studentResponse = item.studentResponse?.status || "pending";

      const matchesResponse =
        responseFilter === "all" ||
        studentResponse === responseFilter;

      return matchesSearch && matchesStatus && matchesResponse;
    });
  }, [recommendations, search, statusFilter, responseFilter]);

  const getCourseDetails = (courseId) => {
    return collegeCourses.find(
      (item) => getId(item) === courseId
    );
  };

  const getCourseOptionLabel = (item) => {
    const college = getName(item.college);
    const course = getName(item.course);
    const specialization = item.specialization
      ? ` - ${getName(item.specialization)}`
      : "";

    return `${college} | ${course}${specialization}`;
  };

  const getRequestLabel = (request) => {
    const student =
      request.student?.name ||
      request.student?.fullName ||
      request.student?.email ||
      "Student";

    const requestNumber =
      request.requestNumber ||
      request._id ||
      "";

    return `${student} - ${requestNumber}`;
  };

  const resetForm = () => {
    setFormData({
      counsellingRequestId: "",
      counsellorRemarks: "",
      colleges: [],
    });

    setCollegeForm({
      collegeCourse: "",
      fees: "",
      remarks: "",
      recommendationReason: "",
    });

    setEditingRecommendation(null);
  };

  const openCreateForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (recommendation) => {
    if (recommendation.status !== "draft") {
      toast.error("Only draft recommendations can be edited");
      return;
    }

    setEditingRecommendation(recommendation);

    setFormData({
      counsellingRequestId: getId(recommendation.counsellingRequest),
      counsellorRemarks: recommendation.counsellorRemarks || "",
      colleges: (recommendation.colleges || []).map((item) => ({
        college: getId(item.college),
        collegeCourse: getId(item.collegeCourse),
        course: getId(item.course),
        specialization: getId(item.specialization) || null,
        fees: item.fees ?? "",
        remarks: item.remarks || "",
        recommendationReason: item.recommendationReason || "",
      })),
    });

    setCollegeForm({
      collegeCourse: "",
      fees: "",
      remarks: "",
      recommendationReason: "",
    });

    setShowForm(true);
  };

  const addCollege = () => {
    if (!collegeForm.collegeCourse) {
      toast.error("Please select a college course");
      return;
    }

    const courseData = getCourseDetails(collegeForm.collegeCourse);

    if (!courseData) {
      toast.error("Selected college course not found");
      return;
    }

    const alreadyAdded = formData.colleges.some(
      (item) => item.collegeCourse === collegeForm.collegeCourse
    );

    if (alreadyAdded) {
      toast.error("This college course has already been added");
      return;
    }

    const newCollege = {
      college: getId(courseData.college),
      collegeCourse: getId(courseData),
      course: getId(courseData.course),
      specialization: getId(courseData.specialization) || null,
      fees:
        collegeForm.fees !== ""
          ? Number(collegeForm.fees)
          : Number(courseData.totalFees || 0),
      remarks: collegeForm.remarks.trim(),
      recommendationReason: collegeForm.recommendationReason.trim(),
    };

    if (!newCollege.college || !newCollege.course) {
      toast.error(
        "College or course information is missing from this college course"
      );
      return;
    }

    setFormData((previous) => ({
      ...previous,
      colleges: [...previous.colleges, newCollege],
    }));

    setCollegeForm({
      collegeCourse: "",
      fees: "",
      remarks: "",
      recommendationReason: "",
    });

    toast.success("College added to recommendation");
  };

  const removeCollege = (index) => {
    setFormData((previous) => ({
      ...previous,
      colleges: previous.colleges.filter((_, i) => i !== index),
    }));
  };

  const saveRecommendation = async (event) => {
    event.preventDefault();

    if (!editingRecommendation && !formData.counsellingRequestId) {
      toast.error("Please select a counselling request");
      return;
    }

    if (!formData.colleges.length) {
      toast.error("Please add at least one college");
      return;
    }

    const payload = {
      colleges: formData.colleges,
      counsellorRemarks: formData.counsellorRemarks,
    };

    try {
      setSaving(true);

      if (editingRecommendation) {
        await api.put(
          `${API}/update-recommendation/${editingRecommendation._id}`,
          payload
        );

        toast.success("Recommendation updated successfully");
      } else {
        await api.post(`${API}/create-recommendation`, {
          counsellingRequestId: formData.counsellingRequestId,
          ...payload,
        });

        toast.success("Recommendation created successfully");
      }

      setShowForm(false);
      resetForm();

      await fetchRecommendations();
    } catch (error) {
      console.error("Save recommendation error:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to save recommendation"
      );
    } finally {
      setSaving(false);
    }
  };

  const shareRecommendation = async (recommendation) => {
    if (recommendation.status !== "draft") {
      toast.error("Only draft recommendations can be shared");
      return;
    }

    if (!recommendation.colleges?.length) {
      toast.error("Add at least one college before sharing");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to share this recommendation with the student? You cannot edit it after sharing."
    );

    if (!confirmed) return;

    try {
      setSaving(true);

      await api.post(
        `${API}/share-recommendation/${recommendation._id}`
      );

      toast.success("Recommendation shared successfully");

      setShowDetails(false);
      setSelectedRecommendation(null);

      await fetchRecommendations();
    } catch (error) {
      console.error("Share recommendation error:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to share recommendation"
      );
    } finally {
      setSaving(false);
    }
  };

  const openDetails = async (recommendation) => {
    try {
      const response = await api.get(
        `${API}/get-single-recommendation/${recommendation._id}`
      );

      setSelectedRecommendation(response.data?.data || recommendation);
    } catch (error) {
      console.error("Fetch recommendation details error:", error);
      setSelectedRecommendation(recommendation);
    }

    setShowDetails(true);
  };

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  const closeDetails = () => {
    setShowDetails(false);
    setSelectedRecommendation(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              College Recommendations
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage and track college recommendations for counselling requests.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={fetchRecommendations}
              disabled={loading}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>

            {isCounsellor && (
              <button
                onClick={openCreateForm}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                + Create Recommendation
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          {[
            { label: "Total", value: stats.total, color: "text-gray-800" },
            { label: "Draft", value: stats.draft, color: "text-amber-600" },
            { label: "Shared", value: stats.shared, color: "text-blue-600" },
            { label: "Accepted", value: stats.accepted, color: "text-green-600" },
            { label: "Rejected", value: stats.rejected, color: "text-red-600" },
            { label: "Pending", value: stats.pending, color: "text-gray-600" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <p className="text-sm text-gray-500">{item.label}</p>
              <p className={`mt-2 text-2xl font-bold ${item.color}`}>
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search student, counsellor, college, course..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            >
              <option value="all">All Recommendation Status</option>
              <option value="draft">Draft</option>
              <option value="shared">Shared</option>
            </select>

            <select
              value={responseFilter}
              onChange={(event) => setResponseFilter(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            >
              <option value="all">All Student Responses</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-gray-100 text-xs uppercase text-gray-600">
                <tr>
                  <th className="px-5 py-4">Student</th>
                  <th className="px-5 py-4">Counsellor</th>
                  <th className="px-5 py-4">Colleges</th>
                  <th className="px-5 py-4">Recommendation</th>
                  <th className="px-5 py-4">Student Response</th>
                  <th className="px-5 py-4">Created</th>
                  <th className="px-5 py-4 text-center">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-5 py-12 text-center text-gray-500"
                    >
                      Loading recommendations...
                    </td>
                  </tr>
                ) : filteredRecommendations.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-5 py-12 text-center text-gray-500"
                    >
                      No college recommendations found.
                    </td>
                  </tr>
                ) : (
                  filteredRecommendations.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-800">
                          {item.student?.name ||
                            item.student?.fullName ||
                            "N/A"}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {item.student?.email || ""}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-gray-700">
                        {item.counsellor?.name ||
                          item.counsellor?.fullName ||
                          item.counsellor?.email ||
                          "N/A"}
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-semibold text-gray-800">
                          {item.colleges?.length || 0} colleges
                        </span>
                        <p className="mt-1 max-w-[200px] truncate text-xs text-gray-500">
                          {(item.colleges || [])
                            .map((college) => getName(college.college))
                            .join(", ")}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={item.status} />
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge
                          status={item.studentResponse?.status || "pending"}
                        />
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {formatDate(item.createdAt)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openDetails(item)}
                            className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                          >
                            View Details
                          </button>

                          {isCounsellor && item.status === "draft" && (
                            <>
                              <button
                                onClick={() => openEditForm(item)}
                                className="rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                              >
                                Edit
                              </button>

                              <button
                                onClick={() => shareRecommendation(item)}
                                disabled={saving}
                                className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                              >
                                Share
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create / Edit Modal */}
        {showForm && isCounsellor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3">
            <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white shadow-xl">
              <div className="sticky top-0 flex items-center justify-between border-b bg-white px-6 py-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">
                    {editingRecommendation
                      ? "Edit College Recommendation"
                      : "Create College Recommendation"}
                  </h2>
                  <p className="mt-1 text-xs text-gray-500">
                    Add college courses and share them with the student.
                  </p>
                </div>

                <button
                  onClick={closeForm}
                  className="text-2xl text-gray-400 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <form onSubmit={saveRecommendation} className="space-y-5 p-6">
                {!editingRecommendation && (
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                      Assigned Counselling Request *
                    </label>

                    <select
                      value={formData.counsellingRequestId}
                      onChange={(event) =>
                        setFormData((previous) => ({
                          ...previous,
                          counsellingRequestId: event.target.value,
                        }))
                      }
                      required
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                    >
                      <option value="">Select Counselling Request</option>

                      {counsellingRequests.map((request) => (
                        <option key={request._id} value={request._id}>
                          {getRequestLabel(request)}
                        </option>
                      ))}
                    </select>

                    {counsellingRequests.length === 0 && (
                      <p className="mt-1 text-xs text-amber-600">
                        No assigned counselling requests found.
                      </p>
                    )}
                  </div>
                )}

                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-4 font-semibold text-gray-800">
                    Add Recommended College
                  </h3>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        College and Course *
                      </label>

                      <select
                        value={collegeForm.collegeCourse}
                        onChange={(event) => {
                          const selectedId = event.target.value;
                          const selected = getCourseDetails(selectedId);

                          setCollegeForm((previous) => ({
                            ...previous,
                            collegeCourse: selectedId,
                            fees: selected?.totalFees ?? "",
                          }));
                        }}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                      >
                        <option value="">Select College Course</option>

                        {collegeCourses.map((item) => (
                          <option key={item._id} value={item._id}>
                            {getCourseOptionLabel(item)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {collegeForm.collegeCourse && (
                      <div className="md:col-span-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
                        {(() => {
                          const selected = getCourseDetails(
                            collegeForm.collegeCourse
                          );

                          if (!selected) return null;

                          return (
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              <p>
                                <strong>College:</strong>{" "}
                                {getName(selected.college)}
                              </p>
                              <p>
                                <strong>Course:</strong>{" "}
                                {getName(selected.course)}
                              </p>
                              <p>
                                <strong>Duration:</strong>{" "}
                                {selected.duration || "N/A"}
                              </p>
                              <p>
                                <strong>Mode:</strong>{" "}
                                {selected.mode || "N/A"}
                              </p>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Recommended Fees
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={collegeForm.fees}
                        onChange={(event) =>
                          setCollegeForm((previous) => ({
                            ...previous,
                            fees: event.target.value,
                          }))
                        }
                        placeholder="Enter fees"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Remarks
                      </label>
                      <input
                        type="text"
                        value={collegeForm.remarks}
                        onChange={(event) =>
                          setCollegeForm((previous) => ({
                            ...previous,
                            remarks: event.target.value,
                          }))
                        }
                        placeholder="Optional remarks"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Recommendation Reason
                      </label>
                      <textarea
                        rows="2"
                        value={collegeForm.recommendationReason}
                        onChange={(event) =>
                          setCollegeForm((previous) => ({
                            ...previous,
                            recommendationReason: event.target.value,
                          }))
                        }
                        placeholder="Why are you recommending this college?"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={addCollege}
                    className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    + Add College
                  </button>
                </div>

                {/* Added Colleges */}
                <div>
                  <h3 className="mb-3 font-semibold text-gray-800">
                    Added Colleges ({formData.colleges.length})
                  </h3>

                  {formData.colleges.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-300 py-7 text-center text-sm text-gray-500">
                      No colleges added yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {formData.colleges.map((item, index) => {
                        const courseData = getCourseDetails(
                          item.collegeCourse
                        );

                        return (
                          <div
                            key={`${item.collegeCourse}-${index}`}
                            className="flex flex-col justify-between gap-3 rounded-lg border border-gray-200 p-4 sm:flex-row sm:items-center"
                          >
                            <div>
                              <p className="font-semibold text-gray-800">
                                {getName(
                                  courseData?.college ||
                                    item.college
                                )}
                              </p>
                              <p className="mt-1 text-sm text-gray-600">
                                {getName(
                                  courseData?.course || item.course
                                )}
                              </p>
                              <p className="mt-1 text-xs text-gray-500">
                                Fees: ₹{Number(item.fees || 0).toLocaleString("en-IN")}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeCollege(index)}
                              className="self-start rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 sm:self-center"
                            >
                              Remove
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Counsellor Remarks */}
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
                    Counsellor Remarks
                  </label>
                  <textarea
                    rows="3"
                    value={formData.counsellorRemarks}
                    onChange={(event) =>
                      setFormData((previous) => ({
                        ...previous,
                        counsellorRemarks: event.target.value,
                      }))
                    }
                    placeholder="Enter overall recommendation remarks..."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex flex-col-reverse justify-end gap-3 border-t pt-4 sm:flex-row">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving || formData.colleges.length === 0}
                    className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : editingRecommendation
                      ? "Update Recommendation"
                      : "Create Recommendation"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Details Modal */}
        {showDetails && selectedRecommendation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3">
            <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-xl bg-white shadow-xl">
              <div className="sticky top-0 flex items-center justify-between border-b bg-white px-6 py-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">
                    Recommendation Details
                  </h2>
                  <p className="mt-1 text-xs text-gray-500">
                    View complete recommendation information.
                  </p>
                </div>

                <button
                  onClick={closeDetails}
                  className="text-2xl text-gray-400 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6 p-6">
                {/* Status */}
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge status={selectedRecommendation.status} />
                  <StatusBadge
                    status={
                      selectedRecommendation.studentResponse?.status ||
                      "pending"
                    }
                  />
                </div>

                {/* Student and Counsellor */}
                <section>
                  <h3 className="mb-3 font-semibold text-gray-800">
                    Basic Information
                  </h3>

                  <div className="grid grid-cols-1 gap-4 rounded-lg bg-gray-50 p-4 sm:grid-cols-2 lg:grid-cols-3">
                    <DetailItem
                      label="Student"
                      value={
                        selectedRecommendation.student?.name ||
                        selectedRecommendation.student?.fullName
                      }
                    />
                    <DetailItem
                      label="Student Email"
                      value={selectedRecommendation.student?.email}
                    />
                    <DetailItem
                      label="Counsellor"
                      value={
                        selectedRecommendation.counsellor?.name ||
                        selectedRecommendation.counsellor?.fullName ||
                        selectedRecommendation.counsellor?.email
                      }
                    />
                    <DetailItem
                      label="Request ID"
                      value={
                        selectedRecommendation.counsellingRequest
                          ?.requestNumber ||
                        getId(selectedRecommendation.counsellingRequest)
                      }
                    />
                    <DetailItem
                      label="Created At"
                      value={formatDate(selectedRecommendation.createdAt)}
                    />
                    <DetailItem
                      label="Shared At"
                      value={formatDate(selectedRecommendation.sharedAt)}
                    />
                  </div>
                </section>

                {/* Counselling Request */}
                {selectedRecommendation.counsellingRequest && (
                  <section>
                    <h3 className="mb-3 font-semibold text-gray-800">
                      Counselling Request Information
                    </h3>

                    <div className="grid grid-cols-1 gap-4 rounded-lg bg-gray-50 p-4 sm:grid-cols-2 lg:grid-cols-3">
                      <DetailItem
                        label="Study Level"
                        value={
                          selectedRecommendation.counsellingRequest.studyLevel
                        }
                      />
                      <DetailItem
                        label="Admission Year"
                        value={
                          selectedRecommendation.counsellingRequest.admissionYear
                        }
                      />
                      <DetailItem
                        label="Budget"
                        value={
                          selectedRecommendation.counsellingRequest.budget
                            ? `₹${Number(
                                selectedRecommendation.counsellingRequest.budget
                              ).toLocaleString("en-IN")}`
                            : "N/A"
                        }
                      />
                      <DetailItem
                        label="Preferred Location"
                        value={
                          Array.isArray(
                            selectedRecommendation.counsellingRequest.preferredLocations
                          )
                            ? selectedRecommendation.counsellingRequest.preferredLocations.join(
                                ", "
                              )
                            : selectedRecommendation.counsellingRequest.preferredLocations
                        }
                      />
                    </div>
                  </section>
                )}

                {/* Recommended Colleges */}
                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800">
                      Recommended Colleges
                    </h3>
                    <span className="text-sm text-gray-500">
                      {selectedRecommendation.colleges?.length || 0} colleges
                    </span>
                  </div>

                  <div className="space-y-4">
                    {(selectedRecommendation.colleges || []).map(
                      (item, index) => (
                        <div
                          key={item._id || index}
                          className="rounded-xl border border-gray-200 p-4"
                        >
                          <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row">
                            <div>
                              <p className="text-base font-bold text-gray-800">
                                {getName(item.college)}
                              </p>
                              <p className="mt-1 text-sm text-blue-600">
                                {getName(item.course)}
                                {item.specialization
                                  ? ` - ${getName(item.specialization)}`
                                  : ""}
                              </p>
                            </div>

                            <span className="h-fit rounded-lg bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                              ₹{Number(item.fees || 0).toLocaleString("en-IN")}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <DetailItem
                              label="Duration"
                              value={item.collegeCourse?.duration}
                            />
                            <DetailItem
                              label="Mode"
                              value={item.collegeCourse?.mode}
                            />
                            <DetailItem
                              label="Total Seats"
                              value={item.collegeCourse?.totalSeats}
                            />
                            <DetailItem
                              label="Available Seats"
                              value={item.collegeCourse?.availableSeats}
                            />
                            <DetailItem
                              label="Admission Open"
                              value={
                                item.collegeCourse?.admissionOpen
                                  ? "Yes"
                                  : "No"
                              }
                            />
                            <DetailItem
                              label="Eligibility"
                              value={
                                item.collegeCourse?.eligibility
                              }
                            />
                          </div>

                          {item.recommendationReason && (
                            <div className="mt-4 rounded-lg bg-blue-50 p-3">
                              <p className="text-xs font-semibold uppercase text-blue-700">
                                Recommendation Reason
                              </p>
                              <p className="mt-1 text-sm text-gray-700">
                                {item.recommendationReason}
                              </p>
                            </div>
                          )}

                          {item.remarks && (
                            <div className="mt-3">
                              <p className="text-xs font-semibold uppercase text-gray-500">
                                Remarks
                              </p>
                              <p className="mt-1 text-sm text-gray-700">
                                {item.remarks}
                              </p>
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>
                </section>

                {/* Counsellor Remarks */}
                {selectedRecommendation.counsellorRemarks && (
                  <section>
                    <h3 className="mb-2 font-semibold text-gray-800">
                      Counsellor Remarks
                    </h3>
                    <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
                      {selectedRecommendation.counsellorRemarks}
                    </div>
                  </section>
                )}

                {/* Student Response */}
                <section>
                  <h3 className="mb-3 font-semibold text-gray-800">
                    Student Response
                  </h3>

                  <div className="rounded-lg bg-gray-50 p-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <DetailItem
                        label="Response"
                        value={
                          selectedRecommendation.studentResponse?.status ||
                          "pending"
                        }
                      />
                      <DetailItem
                        label="Responded At"
                        value={formatDate(
                          selectedRecommendation.studentResponse?.respondedAt
                        )}
                      />
                    </div>

                    {selectedRecommendation.studentResponse?.remarks && (
                      <div className="mt-4">
                        <p className="text-xs font-semibold uppercase text-gray-500">
                          Student Remarks
                        </p>
                        <p className="mt-1 text-sm text-gray-700">
                          {selectedRecommendation.studentResponse.remarks}
                        </p>
                      </div>
                    )}
                  </div>
                </section>

                {/* Actions */}
                {isCounsellor &&
                  selectedRecommendation.status === "draft" && (
                    <div className="flex flex-col justify-end gap-3 border-t pt-4 sm:flex-row">
                      <button
                        onClick={() => {
                          setShowDetails(false);
                          openEditForm(selectedRecommendation);
                        }}
                        className="rounded-lg border border-amber-300 px-5 py-2.5 text-sm font-semibold text-amber-700 hover:bg-amber-50"
                      >
                        Edit Recommendation
                      </button>

                      <button
                        onClick={() =>
                          shareRecommendation(selectedRecommendation)
                        }
                        disabled={saving}
                        className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        {saving ? "Sharing..." : "Share with Student"}
                      </button>
                    </div>
                  )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollegeRecommendations;
