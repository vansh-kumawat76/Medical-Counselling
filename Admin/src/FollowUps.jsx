
import React, { useEffect, useMemo, useState } from "react";
import api from "./Api/axios";
import { toast } from "react-toastify";

const initialForm = {
  counsellingRequest: "",
  assignedTo: "",
  title: "",
  description: "",
  dueAt: "",
  type: "call",
  status: "pending",
  outcome: "",
};

const formatDate = (date) => {
  if (!date) return "N/A";

  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const toDateTimeLocal = (date) => {
  if (!date) return "";

  const value = new Date(date);
  const offset = value.getTimezoneOffset() * 60000;

  return new Date(value.getTime() - offset)
    .toISOString()
    .slice(0, 16);
};

const getId = (value) => {
  if (!value) return "";
  return typeof value === "object" ? value._id : value;
};

const getStatusStyle = (status) => {
  const styles = {
    pending: "bg-amber-50 text-amber-700",
    completed: "bg-emerald-50 text-emerald-700",
    cancelled: "bg-red-50 text-red-700",
    overdue: "bg-orange-50 text-orange-700",
  };

  return styles[status] || "bg-slate-100 text-slate-700";
};

const FollowUps = () => {
  const [followUps, setFollowUps] = useState([]);
  const [requests, setRequests] = useState([]);
  const [counsellors, setCounsellors] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const [selectedFollowUp, setSelectedFollowUp] = useState(null);
  const [editingFollowUp, setEditingFollowUp] = useState(null);

  const [form, setForm] = useState(initialForm);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // FETCH ALL FOLLOW-UPS
  const fetchFollowUps = async () => {
    try {
      setLoading(true);

      const response = await api.get(
        "/FollowUp/Get-All-FollowUps"
      );

      if (response.data.success) {
        setFollowUps(response.data.data || []);
      } else {
        toast.error(response.data.message || "Failed to fetch follow-ups");
      }
    } catch (error) {
      console.log("Fetch Follow-Ups Error:", error);

      toast.error(
        error.response?.data?.message ||
          "Unable to fetch follow-ups"
      );
    } finally {
      setLoading(false);
    }
  };

  // FETCH COUNSELLING REQUESTS
  const fetchRequests = async () => {
    try {
      const response = await api.get(
        "/CounsellingRequest/getCounseller-request"
      );

      if (response.data.success) {
        setRequests(response.data.data || []);
      } else {
        toast.error(
          response.data.message || "Unable to fetch counselling requests"
        );
      }
    } catch (error) {
      console.log("Fetch Requests Error:", error);
      toast.error(
        error.response?.data?.message ||
          "Unable to fetch counselling requests"
      );
    }
  };

  // FETCH COUNSELLORS
  const fetchCounsellors = async () => {
    try {
      const response = await api.get(
        "/users?role=Counsellor&limit=100"
      );

      if (response.data.status) {
        setCounsellors(response.data.data || []);
      } else {
        toast.error(
          response.data.message || "Unable to fetch counsellors"
        );
      }
    } catch (error) {
      console.log("Fetch Counsellors Error:", error);

      toast.error(
        error.response?.data?.message ||
          "Unable to fetch counsellors"
      );
    }
  };

  useEffect(() => {
    fetchFollowUps();
    fetchRequests();
    fetchCounsellors();
  }, []);

  // SEARCH AND FILTER
  const filteredFollowUps = useMemo(() => {
    return followUps.filter((item) => {
      const searchText = search.toLowerCase();

      const title = item.title || "";
      const description = item.description || "";
      const student = item.student?.email || "";
      const counsellor = item.assignedTo?.email || "";
      const requestNumber =
        item.counsellingRequest?.requestNumber || "";

      const matchesSearch =
        title.toLowerCase().includes(searchText) ||
        description.toLowerCase().includes(searchText) ||
        student.toLowerCase().includes(searchText) ||
        counsellor.toLowerCase().includes(searchText) ||
        requestNumber.toLowerCase().includes(searchText);

      const matchesStatus =
        statusFilter === "all" ||
        item.status === statusFilter;

      const matchesType =
        typeFilter === "all" ||
        item.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [followUps, search, statusFilter, typeFilter]);

  // OPEN ADD MODAL
  const openAddModal = () => {
    setEditingFollowUp(null);
    setForm(initialForm);
    setShowModal(true);
  };

  // OPEN EDIT MODAL
  const openEditModal = (item) => {
    setEditingFollowUp(item);

    setForm({
      counsellingRequest: getId(item.counsellingRequest),
      assignedTo: getId(item.assignedTo),
      title: item.title || "",
      description: item.description || "",
      dueAt: toDateTimeLocal(item.dueAt),
      type: item.type || "call",
      status: item.status || "pending",
      outcome: item.outcome || "",
    });

    setShowModal(true);
  };

  // CLOSE FORM MODAL
  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingFollowUp(null);
    setForm(initialForm);
  };

  // INPUT CHANGE
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // CREATE / UPDATE FOLLOW-UP
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!editingFollowUp && !form.counsellingRequest) {
      toast.error("Please select a counselling request");
      return;
    }

    if (!form.assignedTo) {
      toast.error("Please select a counsellor");
      return;
    }

    if (!form.title.trim()) {
      toast.error("Please enter follow-up title");
      return;
    }

    if (!form.dueAt) {
      toast.error("Please select due date and time");
      return;
    }

    if (new Date(form.dueAt) <= new Date()) {
      toast.error("Due date must be in the future");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        assignedTo: form.assignedTo,
        title: form.title.trim(),
        description: form.description.trim(),
        dueAt: new Date(form.dueAt).toISOString(),
        type: form.type,
      };

      if (editingFollowUp) {
        payload.status = form.status;
        payload.outcome = form.outcome.trim();

        const response = await api.put(
          `/FollowUp/Update-FollowUp/${editingFollowUp._id}`,
          payload
        );

        if (response.data.success) {
          toast.success(
            response.data.message || "Follow-up updated successfully"
          );

          setShowModal(false);
          setEditingFollowUp(null);
          setForm(initialForm);
          fetchFollowUps();
        } else {
          toast.error(response.data.message || "Update failed");
        }
      } else {
        const response = await api.post(
          "/FollowUp/Create-FollowUp",
          {
            ...payload,
            counsellingRequest: form.counsellingRequest,
          }
        );

        if (response.data.success) {
          toast.success(
            response.data.message || "Follow-up created successfully"
          );

          setShowModal(false);
          setForm(initialForm);
          fetchFollowUps();
        } else {
          toast.error(response.data.message || "Creation failed");
        }
      }
    } catch (error) {
      console.log("Save Follow-Up Error:", error);

      toast.error(
        error.response?.data?.message ||
          "Something went wrong"
      );
    } finally {
      setSaving(false);
    }
  };

  // VIEW FOLLOW-UP
  const handleView = async (item) => {
    try {
      const response = await api.get(
        `/FollowUp/Get-Single-FollowUp/${item._id}`
      );

      if (response.data.success) {
        setSelectedFollowUp(response.data.data);
        setShowViewModal(true);
      } else {
        toast.error(response.data.message || "Unable to view follow-up");
      }
    } catch (error) {
      console.log("View Follow-Up Error:", error);

      toast.error(
        error.response?.data?.message ||
          "Unable to fetch follow-up details"
      );
    }
  };

  // DELETE FOLLOW-UP
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this follow-up?"
    );

    if (!confirmed) return;

    try {
      setDeleting(true);

      const response = await api.delete(
        `/FollowUp/Delete-FollowUp/${id}`
      );

      if (response.data.success) {
        toast.success(
          response.data.message || "Follow-up deleted successfully"
        );

        setFollowUps((prev) =>
          prev.filter((item) => item._id !== id)
        );

        if (selectedFollowUp?._id === id) {
          setShowViewModal(false);
          setSelectedFollowUp(null);
        }
      } else {
        toast.error(response.data.message || "Delete failed");
      }
    } catch (error) {
      console.log("Delete Follow-Up Error:", error);

      toast.error(
        error.response?.data?.message ||
          "Unable to delete follow-up"
      );
    } finally {
      setDeleting(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setTypeFilter("all");
  };

  const getRequestLabel = (request) => {
    if (!request) return "Request unavailable";

    return `${request.requestNumber || "Request"} - ${
      request.student?.email || "Student"
    }`;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">
              Follow-Ups
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage student counselling follow-up tasks and reminders.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                fetchFollowUps();
                fetchRequests();
                fetchCounsellors();
              }}
              disabled={loading}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
            >
              <span className="mr-2">↻</span>
              Refresh
            </button>

            <button
              onClick={openAddModal}
              className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              + Add Follow-Up
            </button>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Total Follow-Ups
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-800">
              {followUps.length}
            </h2>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Pending
            </p>
            <h2 className="mt-2 text-3xl font-bold text-amber-600">
              {followUps.filter((item) => item.status === "pending").length}
            </h2>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Completed
            </p>
            <h2 className="mt-2 text-3xl font-bold text-emerald-600">
              {followUps.filter((item) => item.status === "completed").length}
            </h2>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Overdue
            </p>
            <h2 className="mt-2 text-3xl font-bold text-orange-600">
              {followUps.filter((item) => item.status === "overdue").length}
            </h2>
          </div>
        </div>

        {/* FILTERS */}
        <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Search Follow-Ups
              </label>

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title, student, counsellor..."
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Status
              </label>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Type
              </label>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-500"
              >
                <option value="all">All Types</option>
                <option value="call">Call</option>
                <option value="email">Email</option>
                <option value="document">Document</option>
                <option value="appointment">Appointment</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {(search || statusFilter !== "all" || typeFilter !== "all") && (
            <button
              onClick={clearFilters}
              className="mt-3 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* FOLLOW-UP LIST */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h2 className="font-bold text-slate-800">
              Follow-Ups List
            </h2>

            <span className="text-sm text-slate-500">
              {filteredFollowUps.length} records
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
            </div>
          ) : filteredFollowUps.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <div className="mb-3 text-4xl">📞</div>

              <h3 className="font-semibold text-slate-700">
                No Follow-Ups Found
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Add a new follow-up or change your search filters.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredFollowUps.map((item, index) => (
                <div
                  key={item._id}
                  className="p-5 transition hover:bg-slate-50"
                >
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-slate-400">
                          #{index + 1}
                        </span>

                        <h3 className="break-words font-bold text-slate-800">
                          {item.title}
                        </h3>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusStyle(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>
                      </div>

                      <p className="mb-3 line-clamp-2 text-sm text-slate-600">
                        {item.description || "No description provided"}
                      </p>

                      <div className="grid grid-cols-1 gap-2 text-xs text-slate-500 sm:grid-cols-2 lg:grid-cols-3">
                        <p>
                          <span className="font-semibold text-slate-700">
                            Student:
                          </span>{" "}
                          {item.student?.email || "N/A"}
                        </p>

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

                        <p>
                          <span className="font-semibold text-slate-700">
                            Created:
                          </span>{" "}
                          {formatDate(item.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <button
                        onClick={() => handleView(item)}
                        className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                      >
                        View
                      </button>

                      <button
                        onClick={() => openEditModal(item)}
                        className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDelete(item._id)}
                        disabled={deleting}
                        className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ADD / EDIT MODAL */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
            <div className="my-auto w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    {editingFollowUp
                      ? "Edit Follow-Up"
                      : "Add Follow-Up"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Enter follow-up details below.
                  </p>
                </div>

                <button
                  onClick={closeModal}
                  disabled={saving}
                  className="text-2xl text-slate-400 hover:text-slate-700"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 p-6">

                {!editingFollowUp && (
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Counselling Request{" "}
                      <span className="text-red-500">*</span>
                    </label>

                    <select
                      name="counsellingRequest"
                      value={form.counsellingRequest}
                      onChange={handleChange}
                      required
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500"
                    >
                      <option value="">
                        Select Counselling Request
                      </option>

                      {requests.map((request) => (
                        <option key={request._id} value={request._id}>
                          {getRequestLabel(request)}
                        </option>
                      ))}
                    </select>

                    {requests.length === 0 && (
                      <p className="mt-1 text-xs text-amber-600">
                        No counselling requests available.
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Assign Counsellor{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <select
                    name="assignedTo"
                    value={form.assignedTo}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500"
                  >
                    <option value="">Select Counsellor</option>

                    {counsellors.map((counsellor) => (
                      <option
                        key={counsellor._id}
                        value={counsellor._id}
                      >
                        {counsellor.email}
                      </option>
                    ))}
                  </select>

                  {counsellors.length === 0 && (
                    <p className="mt-1 text-xs text-amber-600">
                      No counsellors available.
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Follow-Up Title{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    required
                    maxLength={150}
                    placeholder="Enter follow-up title"
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Enter follow-up description..."
                    className="w-full resize-y rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Due Date & Time{" "}
                      <span className="text-red-500">*</span>
                    </label>

                    <input
                      type="datetime-local"
                      name="dueAt"
                      value={form.dueAt}
                      onChange={handleChange}
                      required
                      min={toDateTimeLocal(new Date())}
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Follow-Up Type
                    </label>

                    <select
                      name="type"
                      value={form.type}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500"
                    >
                      <option value="call">Call</option>
                      <option value="email">Email</option>
                      <option value="document">Document</option>
                      <option value="appointment">Appointment</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                {editingFollowUp && (
                  <>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Status
                      </label>

                      <select
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="overdue">Overdue</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Outcome
                      </label>

                      <textarea
                        name="outcome"
                        value={form.outcome}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Enter follow-up outcome..."
                        className="w-full resize-y rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                      />
                    </div>
                  </>
                )}

                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      saving ||
                      counsellors.length === 0 ||
                      (!editingFollowUp && requests.length === 0)
                    }
                    className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : editingFollowUp
                      ? "Update Follow-Up"
                      : "Create Follow-Up"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* VIEW MODAL */}
        {showViewModal && selectedFollowUp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
            <div className="my-auto w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    Follow-Up Details
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Complete follow-up information.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedFollowUp(null);
                  }}
                  className="text-2xl text-slate-400 hover:text-slate-700"
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
                    className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusStyle(
                      selectedFollowUp.status
                    )}`}
                  >
                    {selectedFollowUp.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      Counselling Request
                    </p>
                    <p className="mt-2 break-all font-semibold text-slate-800">
                      {selectedFollowUp.counsellingRequest?.requestNumber ||
                        getId(selectedFollowUp.counsellingRequest) ||
                        "N/A"}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      Student
                    </p>
                    <p className="mt-2 break-all font-semibold text-slate-800">
                      {selectedFollowUp.student?.email ||
                        getId(selectedFollowUp.student) ||
                        "N/A"}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      Assigned Counsellor
                    </p>
                    <p className="mt-2 break-all font-semibold text-slate-800">
                      {selectedFollowUp.assignedTo?.email ||
                        getId(selectedFollowUp.assignedTo) ||
                        "N/A"}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      Created By
                    </p>
                    <p className="mt-2 break-all font-semibold text-slate-800">
                      {selectedFollowUp.createdBy?.email ||
                        getId(selectedFollowUp.createdBy) ||
                        "N/A"}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      Type
                    </p>
                    <p className="mt-2 font-semibold capitalize text-slate-800">
                      {selectedFollowUp.type || "N/A"}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      Due Date
                    </p>
                    <p className="mt-2 font-semibold text-slate-800">
                      {formatDate(selectedFollowUp.dueAt)}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-700">
                    Description
                  </p>

                  <div className="whitespace-pre-wrap break-words rounded-lg border border-slate-200 p-4 text-sm leading-7 text-slate-700">
                    {selectedFollowUp.description || "No description provided"}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-700">
                    Outcome
                  </p>

                  <div className="whitespace-pre-wrap break-words rounded-lg border border-slate-200 p-4 text-sm leading-7 text-slate-700">
                    {selectedFollowUp.outcome || "No outcome recorded"}
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
                      Last Updated
                    </p>
                    <p className="mt-1 text-slate-700">
                      {formatDate(selectedFollowUp.updatedAt)}
                    </p>
                  </div>

                  {selectedFollowUp.completedAt && (
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Completed At
                      </p>
                      <p className="mt-1 text-slate-700">
                        {formatDate(selectedFollowUp.completedAt)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end border-t border-slate-100 px-6 py-4">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedFollowUp(null);
                  }}
                  className="rounded-lg bg-slate-800 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-900"
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

export default FollowUps;
