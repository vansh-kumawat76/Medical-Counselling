import React, { useEffect, useState } from "react";
import api from "./Api/axios";
import { toast } from "react-toastify";

const initialForm = {
  requestId: "",
  scheduledStart: "",
  scheduledEnd: "",
  mode: "video",
};

// Get current local date-time for datetime-local input
const getLocalDateTime = (date = new Date()) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [requests, setRequests] = useState([]);

  const [loading, setLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const [cancelAppointmentId, setCancelAppointmentId] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");

  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [rescheduleAppointmentId, setRescheduleAppointmentId] = useState("");

  const [rescheduleForm, setRescheduleForm] = useState({
    scheduledStart: "",
    scheduledEnd: "",
    mode: "video",
  });

  const [appointmentForm, setAppointmentForm] = useState(initialForm);

  // Fetch all appointments
  const fetchAppointments = async () => {
    try {
      setLoading(true);

      const response = await api.get("/appointment/getAll-Appointment");

      if (response.data.status) {
        setAppointments(response.data.appointments || []);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to fetch appointments",
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch assigned counselling requests
  const fetchAssignedRequests = async () => {
    try {
      const response = await api.get(
        "/counsellingRequest/getCounseller-request",
      );

      const allRequests = response.data.data || [];

      const assignedRequests = allRequests.filter(
        (item) => item.assignedTo?._id,
      );

      setRequests(assignedRequests);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to fetch assigned counselling requests",
      );
    }
  };

  // Handle form changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setAppointmentForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Create appointment
  const handleCreateAppointment = async (e) => {
    e.preventDefault();

    const { requestId, scheduledStart, scheduledEnd, mode } = appointmentForm;

    if (!requestId || !scheduledStart || !scheduledEnd || !mode) {
      toast.warning("Please fill all required fields");
      return;
    }

    const start = new Date(scheduledStart);
    const end = new Date(scheduledEnd);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      toast.warning("Please enter valid appointment dates");
      return;
    }

    if (start >= end) {
      toast.warning("End time must be after start time");
      return;
    }

    if (start <= new Date()) {
      toast.warning("Appointment must be scheduled for a future time");
      return;
    }

    try {
      setCreateLoading(true);

      const response = await api.post("/appointment/create-Appointment", {
        requestId,
        scheduledStart: start.toISOString(),
        scheduledEnd: end.toISOString(),
        mode,
      });

      toast.success(
        response.data.message || "Appointment created successfully",
      );

      setShowCreateModal(false);
      setAppointmentForm(initialForm);

      await Promise.all([fetchAppointments(), fetchAssignedRequests()]);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to create appointment",
      );
    } finally {
      setCreateLoading(false);
    }
  };

  // Update appointment status
  const handleUpdateStatus = async (appointmentId, status) => {
    try {
      setActionLoading(true);

      const response = await api.put(
        `/appointment/update-Appointment-Status/${appointmentId}`,
        { status },
      );

      toast.success(
        response.data.message || "Appointment status updated successfully",
      );

      setSelectedAppointment(null);

      await fetchAppointments();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update appointment status",
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Open cancel modal
  const openCancelModal = (appointmentId) => {
    setCancelAppointmentId(appointmentId);
    setCancellationReason("");
    setShowCancelModal(true);
  };

  // Cancel appointment
  const handleCancelAppointment = async (e) => {
    e.preventDefault();

    if (!cancellationReason.trim()) {
      toast.warning("Please enter cancellation reason");
      return;
    }

    try {
      setActionLoading(true);

      const response = await api.put(
        `/appointment/cancel-Appointment/${cancelAppointmentId}`,
        {
          cancellationReason: cancellationReason.trim(),
        },
      );

      toast.success(
        response.data.message || "Appointment cancelled successfully",
      );

      setShowCancelModal(false);
      setCancelAppointmentId("");
      setCancellationReason("");
      setSelectedAppointment(null);

      await fetchAppointments();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to cancel appointment",
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Open Reschedule Modal
  const openRescheduleModal = (appointment) => {
    setRescheduleAppointmentId(appointment._id);

    setRescheduleForm({
      scheduledStart: "",
      scheduledEnd: "",
      mode: appointment.mode || "video",
    });

    setShowRescheduleModal(true);
  };

  // Handle Reschedule Form Changes
  const handleRescheduleChange = (e) => {
    const { name, value } = e.target;

    setRescheduleForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Reschedule Appointment
  const handleRescheduleAppointment = async (e) => {
    e.preventDefault();

    const { scheduledStart, scheduledEnd, mode } = rescheduleForm;

    if (!scheduledStart || !scheduledEnd || !mode) {
      toast.warning("Please fill all required fields");
      return;
    }

    const start = new Date(scheduledStart);
    const end = new Date(scheduledEnd);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      toast.warning("Please enter valid dates");
      return;
    }

    if (start <= new Date()) {
      toast.warning("New appointment must be in the future");
      return;
    }

    if (start >= end) {
      toast.warning("End time must be after start time");
      return;
    }

    try {
      setRescheduleLoading(true);

      const response = await api.put(
        `/appointment/reschedule-Appointment/${rescheduleAppointmentId}`,
        {
          scheduledStart: start.toISOString(),
          scheduledEnd: end.toISOString(),
          mode,
        },
      );

      toast.success(
        response.data.message || "Appointment rescheduled successfully",
      );

      setShowRescheduleModal(false);
      setRescheduleAppointmentId("");

      setRescheduleForm({
        scheduledStart: "",
        scheduledEnd: "",
        mode: "video",
      });

      await fetchAppointments();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to reschedule appointment",
      );
    } finally {
      setRescheduleLoading(false);
    }
  };

  // Fetch single appointment details
  const fetchSingleAppointment = async (appointmentId) => {
    try {
      setDetailsLoading(true);
      setSelectedAppointment(null);

      const response = await api.get(
        `/appointment/get-Single-Appointment/${appointmentId}`,
      );

      if (response.data.status) {
        setSelectedAppointment(response.data.appointment);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to fetch appointment details",
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  // Initial API calls
  useEffect(() => {
    fetchAppointments();
    fetchAssignedRequests();
  }, []);

  // Status styling
  const getStatusStyle = (status) => {
    const styles = {
      scheduled: "bg-blue-100 text-blue-700",
      confirmed: "bg-green-100 text-green-700",
      completed: "bg-purple-100 text-purple-700",
      cancelled: "bg-red-100 text-red-700",
      rescheduled: "bg-yellow-100 text-yellow-700",
      no_show: "bg-gray-100 text-gray-700",
    };

    return styles[status] || "bg-gray-100 text-gray-700";
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // Summary calculations
  const total = appointments.length;

  const scheduled = appointments.filter(
    (item) => item.status === "scheduled",
  ).length;

  const confirmed = appointments.filter(
    (item) => item.status === "confirmed",
  ).length;

  const completed = appointments.filter(
    (item) => item.status === "completed",
  ).length;

  const cancelled = appointments.filter(
    (item) => item.status === "cancelled",
  ).length;

  const summaryCards = [
    { title: "Total Appointments", value: total, color: "text-blue-600" },
    { title: "Scheduled", value: scheduled, color: "text-indigo-600" },
    { title: "Confirmed", value: confirmed, color: "text-green-600" },
    { title: "Completed", value: completed, color: "text-purple-600" },
    { title: "Cancelled", value: cancelled, color: "text-red-600" },
  ];

  // Selected request details
  const selectedRequest = requests.find(
    (item) => item._id === appointmentForm.requestId,
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Appointments</h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage and monitor counselling appointments.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={fetchAppointments}
            disabled={loading}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-60"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <button
            onClick={() => {
              setAppointmentForm(initialForm);
              setShowCreateModal(true);
            }}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Create Appointment
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {summaryCards.map((card) => (
          <div
            key={card.title}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-gray-500">{card.title}</p>

            <h2 className={`mt-2 text-3xl font-bold ${card.color}`}>
              {card.value}
            </h2>
          </div>
        ))}
      </div>

      {/* Appointments Table */}
     
<div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
  <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
    <div>
      <h2 className="text-lg font-semibold text-gray-800">
        All Appointments
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Manage and track all counselling appointments
      </p>
    </div>
    <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
      {appointments.length} Total
    </span>
  </div>

  {loading ? (
    <div className="p-10 text-center text-gray-500">
      Loading appointments...
    </div>
  ) : appointments.length === 0 ? (
    <div className="p-10 text-center text-gray-500">
      No appointments found.
    </div>
  ) : (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1100px] text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-5 py-4">Request Number</th>
            <th className="px-5 py-4">Student</th>
            <th className="px-5 py-4">Counsellor</th>
            <th className="px-5 py-4">Date & Time</th>
            <th className="px-5 py-4">Mode</th>
            <th className="px-5 py-4">Status</th>
            <th className="px-5 py-4 min-w-[160px]">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {appointments.map((item) => {
            const normalizedStatus = String(item.status || "")
              .trim()
              .toLowerCase();

            return (
              <tr key={item._id} className="transition-colors hover:bg-gray-50">
                <td className="px-5 py-4 font-medium text-gray-700">
                  <span className="break-all">
                    {item.counsellingRequest?.requestNumber || "N/A"}
                  </span>
                </td>

                <td className="px-5 py-4">
                  <p className="font-medium text-gray-800">
                    {item.student?.name || "N/A"}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {item.student?.email || ""}
                  </p>
                </td>

                <td className="px-5 py-4">
                  <p className="font-medium text-gray-800">
                    {item.counsellor?.name || "N/A"}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {item.counsellor?.email || ""}
                  </p>
                </td>

                <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                  {formatDate(item.scheduledStart)}
                </td>

                <td className="px-5 py-4 capitalize text-gray-600">
                  {item.mode?.replace("_", " ") || "N/A"}
                </td>

                <td className="px-5 py-4">
                  <span
                    className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                      normalizedStatus
                    )}`}
                  >
                    {normalizedStatus.replace("_", " ") || "N/A"}
                  </span>
                </td>

                <td className="px-5 py-4">
                  <div className="flex min-w-[180px] flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fetchSingleAppointment(item._id)}
                      className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                    >
                      View Details
                    </button>

                    {normalizedStatus === "scheduled" && (
                      <>
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() =>
                            handleUpdateStatus(item._id, "confirmed")
                          }
                          className="rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Confirm
                        </button>

                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => openCancelModal(item._id)}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          disabled={actionLoading || rescheduleLoading}
                          onClick={() => openRescheduleModal(item)}
                          className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Reschedule
                        </button>
                      </>
                    )}

                    {normalizedStatus === "confirmed" && (
                      <>
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() =>
                            handleUpdateStatus(item._id, "completed")
                          }
                          className="rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 transition hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Complete
                        </button>

                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() =>
                            handleUpdateStatus(item._id, "no_show")
                          }
                          className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          No Show
                        </button>

                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => openCancelModal(item._id)}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          disabled={actionLoading || rescheduleLoading}
                          onClick={() => openRescheduleModal(item)}
                          className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Reschedule
                        </button>
                      </>
                    )}

                    {!["scheduled", "confirmed"].includes(normalizedStatus) && (
                      <span className="text-xs text-gray-400">
                        No actions available
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  )}
</div>


      {/* Create Appointment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  Create Appointment
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Schedule a counselling appointment.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-2xl text-gray-500 hover:text-gray-800"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-5 p-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Counselling Request *
                </label>

                <select
                  name="requestId"
                  value={appointmentForm.requestId}
                  onChange={handleFormChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Select Counselling Request</option>

                  {requests.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.requestNumber || item._id} -{" "}
                      {item.student?.name || item.student?.email || "Student"}
                    </option>
                  ))}
                </select>

                {requests.length === 0 && (
                  <p className="mt-2 text-xs text-red-500">
                    No assigned counselling requests available.
                  </p>
                )}
              </div>

              {selectedRequest && (
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                  <h3 className="mb-3 text-sm font-semibold text-gray-800">
                    Selected Request Details
                  </h3>

                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-medium">Student: </span>
                      {selectedRequest.student?.name ||
                        selectedRequest.student?.email ||
                        "N/A"}
                    </p>

                    <p>
                      <span className="font-medium">Student Email: </span>
                      {selectedRequest.student?.email || "N/A"}
                    </p>

                    <p>
                      <span className="font-medium">Counsellor: </span>
                      {selectedRequest.assignedTo?.name ||
                        selectedRequest.assignedTo?.email ||
                        "N/A"}
                    </p>

                    <p>
                      <span className="font-medium">Counsellor Email: </span>
                      {selectedRequest.assignedTo?.email || "N/A"}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Scheduled Start *
                </label>

                <input
                  type="datetime-local"
                  name="scheduledStart"
                  value={appointmentForm.scheduledStart}
                  onChange={handleFormChange}
                  min={getLocalDateTime()}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Scheduled End *
                </label>

                <input
                  type="datetime-local"
                  name="scheduledEnd"
                  value={appointmentForm.scheduledEnd}
                  onChange={handleFormChange}
                  min={appointmentForm.scheduledStart || getLocalDateTime()}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Appointment Mode *
                </label>

                <select
                  name="mode"
                  value={appointmentForm.mode}
                  onChange={handleFormChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="video">Video Call</option>
                  <option value="phone">Phone Call</option>
                  <option value="in_person">In Person</option>
                  <option value="chat">Chat</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={createLoading}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={createLoading || requests.length === 0}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {createLoading ? "Creating..." : "Create Appointment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Appointment Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="border-b p-5">
              <h2 className="text-lg font-bold text-gray-800">
                Cancel Appointment
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Please provide a reason for cancelling this appointment.
              </p>
            </div>

            <form onSubmit={handleCancelAppointment} className="p-5">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Cancellation Reason *
              </label>

              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Enter cancellation reason..."
                rows={4}
                required
                className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              />

              <div className="mt-5 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancelAppointmentId("");
                    setCancellationReason("");
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Close
                </button>

                <button
                  type="submit"
                  disabled={actionLoading || !cancellationReason.trim()}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {actionLoading ? "Cancelling..." : "Confirm Cancellation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Appointment Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  Reschedule Appointment
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Choose a new date, time and mode.
                </p>
              </div>

              <button
                type="button"
                disabled={rescheduleLoading}
                onClick={() => setShowRescheduleModal(false)}
                className="text-2xl text-gray-500 hover:text-gray-800"
              >
                &times;
              </button>
            </div>

            <form
              onSubmit={handleRescheduleAppointment}
              className="space-y-5 p-5"
            >
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  New Scheduled Start *
                </label>

                <input
                  type="datetime-local"
                  name="scheduledStart"
                  value={rescheduleForm.scheduledStart}
                  onChange={handleRescheduleChange}
                  min={getLocalDateTime()}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  New Scheduled End *
                </label>

                <input
                  type="datetime-local"
                  name="scheduledEnd"
                  value={rescheduleForm.scheduledEnd}
                  onChange={handleRescheduleChange}
                  min={
                    rescheduleForm.scheduledStart || getLocalDateTime()
                  }
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Appointment Mode *
                </label>

                <select
                  name="mode"
                  value={rescheduleForm.mode}
                  onChange={handleRescheduleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="video">Video Call</option>
                  <option value="phone">Phone Call</option>
                  <option value="in_person">In Person</option>
                  <option value="chat">Chat</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  disabled={rescheduleLoading}
                  onClick={() => setShowRescheduleModal(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Close
                </button>

                <button
                  type="submit"
                  disabled={rescheduleLoading}
                  className="rounded-lg bg-orange-600 px-5 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {rescheduleLoading
                    ? "Rescheduling..."
                    : "Confirm Reschedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Appointment Details Modal */}
      {(selectedAppointment || detailsLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-5">
              <h2 className="text-lg font-bold text-gray-800">
                Appointment Details
              </h2>

              <button
                onClick={() => setSelectedAppointment(null)}
                className="text-2xl text-gray-500 hover:text-gray-800"
              >
                &times;
              </button>
            </div>

            {detailsLoading ? (
              <div className="p-10 text-center text-gray-500">
                Loading details...
              </div>
            ) : selectedAppointment ? (
              <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-gray-500">Request Number</p>
                  <p className="mt-1 font-medium">
                    {selectedAppointment.counsellingRequest?.requestNumber ||
                      "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <span
                    className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-medium ${getStatusStyle(
                      selectedAppointment.status,
                    )}`}
                  >
                    {selectedAppointment.status?.replace("_", " ")}
                  </span>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Student Name</p>
                  <p className="mt-1 font-medium">
                    {selectedAppointment.student?.name || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Student Email</p>
                  <p className="mt-1 font-medium">
                    {selectedAppointment.student?.email || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Counsellor Name</p>
                  <p className="mt-1 font-medium">
                    {selectedAppointment.counsellor?.name || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Counsellor Email</p>
                  <p className="mt-1 font-medium">
                    {selectedAppointment.counsellor?.email || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Scheduled Start</p>
                  <p className="mt-1 font-medium">
                    {formatDate(selectedAppointment.scheduledStart)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Scheduled End</p>
                  <p className="mt-1 font-medium">
                    {formatDate(selectedAppointment.scheduledEnd)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Mode</p>
                  <p className="mt-1 font-medium capitalize">
                    {selectedAppointment.mode?.replace("_", " ") || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Timezone</p>
                  <p className="mt-1 font-medium">
                    {selectedAppointment.timezone || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Meeting Link</p>
                  <p className="mt-1 break-all font-medium">
                    {selectedAppointment.meetingLink || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Location</p>
                  <p className="mt-1 font-medium">
                    {selectedAppointment.location || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Academic Year</p>
                  <p className="mt-1 font-medium">
                    {selectedAppointment.counsellingRequest?.academicYear ||
                      "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Admission Level</p>
                  <p className="mt-1 font-medium">
                    {selectedAppointment.counsellingRequest?.admissionLevel ||
                      "N/A"}
                  </p>
                </div>

                {selectedAppointment.cancellationReason && (
                  <div className="sm:col-span-2">
                    <p className="text-xs text-gray-500">Cancellation Reason</p>

                    <p className="mt-1 font-medium">
                      {selectedAppointment.cancellationReason}
                    </p>
                  </div>
                )}
              </div>
            ) : null}

            <div className="flex justify-end border-t p-4">
              <button
                onClick={() => setSelectedAppointment(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;
