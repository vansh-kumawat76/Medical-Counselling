
import React, { useEffect, useMemo, useState } from "react";
import api from "./Api/axios";
import { toast } from "react-toastify";

const Sessions = () => {
  const [sessions, setSessions] = useState([]);
  const [appointments, setAppointments] = useState([]);

  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [selectedSession, setSelectedSession] = useState(null);

  const [showDetails, setShowDetails] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Search and Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState("all");

  const [formData, setFormData] = useState({
    appointmentId: "",
    type: "initial",
    mode: "video",
  });

  // Fetch All Sessions
  const fetchSessions = async () => {
    try {
      setLoading(true);

      const response = await api.get(
        "/session/GetAllCounsellingSession"
      );

      const data = response.data;

      setSessions(
        Array.isArray(data)
          ? data
          : data.sessions || data.data || []
      );
    } catch (error) {
      console.error("Fetch Sessions Error:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to fetch sessions"
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch Eligible Appointments
  const fetchAppointments = async () => {
    try {
      const response = await api.get(
        "/appointment/getAll-Appointment"
      );

      const data = response.data;

      const list = Array.isArray(data)
        ? data
        : data.appointments || data.data || [];

      setAppointments(
        list.filter((item) =>
          ["confirmed", "completed"].includes(
            String(item.status || "").toLowerCase()
          )
        )
      );
    } catch (error) {
      console.error("Fetch Appointments Error:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to fetch appointments"
      );
    }
  };

  useEffect(() => {
    fetchSessions();
    fetchAppointments();
  }, []);

  // Create Session
  const handleCreateSession = async (e) => {
    e.preventDefault();

    if (!formData.appointmentId) {
      return toast.error("Please select an appointment");
    }

    try {
      setCreating(true);

      const response = await api.post(
        "/session/CounsellingSession",
        formData
      );

      toast.success(
        response.data.message ||
          "Session created successfully"
      );

      closeCreateModal();

      await fetchSessions();
      await fetchAppointments();
    } catch (error) {
      console.error("Create Session Error:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to create session"
      );
    } finally {
      setCreating(false);
    }
  };

  // Get Single Session
  const getSingleSession = async (sessionId) => {
    try {
      const response = await api.get(
        `/session/get-Single-Counselling-Session/${sessionId}`
      );

      setSelectedSession(
        response.data.session ||
          response.data.data ||
          response.data
      );

      setShowDetails(true);
    } catch (error) {
      console.error("Get Single Session Error:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to fetch session details"
      );
    }
  };

  // Start Session
  const handleStartSession = async (sessionId) => {
    try {
      setProcessing(true);

      const response = await api.put(
        `/session/start-Counselling-Session/${sessionId}`
      );

      toast.success(
        response.data.message ||
          "Session started successfully"
      );

      await fetchSessions();

      if (selectedSession?._id === sessionId) {
        await getSingleSession(sessionId);
      }
    } catch (error) {
      console.error("Start Session Error:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to start session"
      );
    } finally {
      setProcessing(false);
    }
  };

  // Complete Session
  const handleCompleteSession = async (sessionId) => {
    const outcome = window.prompt(
      "Enter outcome:\n\n" +
        "counselling_completed\n" +
        "follow_up_required\n" +
        "recommendations_needed\n" +
        "student_unreachable\n" +
        "student_not_interested"
    );

    if (!outcome) return;

    const allowedOutcomes = [
      "counselling_completed",
      "follow_up_required",
      "recommendations_needed",
      "student_unreachable",
      "student_not_interested",
    ];

    if (!allowedOutcomes.includes(outcome.trim())) {
      toast.error("Please enter a valid outcome");
      return;
    }

    try {
      setProcessing(true);

      const response = await api.put(
        `/session/complete-Counselling-Session/${sessionId}`,
        {
          outcome: outcome.trim(),
        }
      );

      toast.success(
        response.data.message ||
          "Session completed successfully"
      );

      await fetchSessions();

      if (selectedSession?._id === sessionId) {
        await getSingleSession(sessionId);
      }
    } catch (error) {
      console.error("Complete Session Error:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to complete session"
      );
    } finally {
      setProcessing(false);
    }
  };

  // Helpers
  const getStatusStyle = (status) => {
    const styles = {
      in_progress: "bg-blue-100 text-blue-700",
      completed: "bg-green-100 text-green-700",
      cancelled: "bg-red-100 text-red-700",
    };

    return (
      styles[status] ||
      "bg-gray-100 text-gray-700"
    );
  };

  const formatText = (value) => {
    if (!value) return "N/A";

    return String(value)
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const studentName = (student) =>
    typeof student === "object"
      ? student?.name ||
        student?.fullName ||
        student?.email ||
        student?._id ||
        "N/A"
      : student || "N/A";

  const counsellorName = (counsellor) =>
    typeof counsellor === "object"
      ? counsellor?.name ||
        counsellor?.fullName ||
        counsellor?.email ||
        counsellor?._id ||
        "N/A"
      : counsellor || "N/A";

  const formatDate = (date) => {
    if (!date) return "N/A";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "N/A";
    }

    return parsedDate.toLocaleString();
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);

    setFormData({
      appointmentId: "",
      type: "initial",
      mode: "video",
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setTypeFilter("all");
    setModeFilter("all");
  };

  // Search and Filter Logic
  const filteredSessions = useMemo(() => {
    return [...sessions]
      .filter((item) => {
        const search = searchTerm.trim().toLowerCase();

        const student = studentName(item.student).toLowerCase();
        const counsellor = counsellorName(item.counsellor).toLowerCase();

        const sessionId = String(item._id || "").toLowerCase();
        const sessionNumber = String(item.sessionNumber || "").toLowerCase();

        const matchesSearch =
          !search ||
          student.includes(search) ||
          counsellor.includes(search) ||
          sessionId.includes(search) ||
          sessionNumber.includes(search);

        const matchesStatus =
          statusFilter === "all" ||
          item.status === statusFilter;

        const matchesType =
          typeFilter === "all" ||
          item.type === typeFilter;

        const matchesMode =
          modeFilter === "all" ||
          item.mode === modeFilter;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesType &&
          matchesMode
        );
      })
      .sort((a, b) => {
        return (
          new Date(b.createdAt || 0) -
          new Date(a.createdAt || 0)
        );
      });
  }, [
    sessions,
    searchTerm,
    statusFilter,
    typeFilter,
    modeFilter,
  ]);

  return (
    <div className="min-h-screen space-y-6 bg-gray-50 p-4 md:p-6">

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Counselling Sessions
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Create, manage and track counselling sessions
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              fetchSessions();
              fetchAppointments();
            }}
            disabled={loading}
            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <button
            onClick={() => {
              fetchAppointments();
              setShowCreateModal(true);
            }}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Create Session
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: "Total Sessions",
            value: sessions.length,
            color: "text-gray-800",
          },
          {
            title: "In Progress",
            value: sessions.filter(
              (s) => s.status === "in_progress"
            ).length,
            color: "text-blue-600",
          },
          {
            title: "Completed",
            value: sessions.filter(
              (s) => s.status === "completed"
            ).length,
            color: "text-green-600",
          },
          {
            title: "Cancelled",
            value: sessions.filter(
              (s) => s.status === "cancelled"
            ).length,
            color: "text-red-600",
          },
        ].map((card) => (
          <div
            key={card.title}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-gray-500">
              {card.title}
            </p>

            <h2
              className={`mt-2 text-2xl font-bold ${card.color}`}
            >
              {card.value}
            </h2>
          </div>
        ))}
      </div>

      {/* Session History */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

        {/* Table Header */}
        <div className="flex flex-col justify-between gap-3 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-semibold text-gray-800">
              Session History
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Showing {filteredSessions.length} of {sessions.length} sessions
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 gap-3 border-b border-gray-200 bg-gray-50 p-5 sm:grid-cols-2 lg:grid-cols-5">

          {/* Search */}
          <div className="lg:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Search Sessions
            </label>

            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Student, counsellor, session ID..."
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Status
            </label>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Session Type
            </label>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="initial">Initial</option>
              <option value="follow_up">Follow Up</option>
              <option value="admission_guidance">
                Admission Guidance
              </option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Mode Filter */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Session Mode
            </label>

            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="all">All Modes</option>
              <option value="phone">Phone</option>
              <option value="video">Video</option>
              <option value="in_person">In Person</option>
              <option value="chat">Chat</option>
            </select>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end sm:col-span-2 lg:col-span-5">
            <button
              onClick={clearFilters}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Sessions Table */}
        {loading ? (
          <div className="py-12 text-center text-gray-500">
            Loading sessions...
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="py-12 text-center">
            <p className="font-medium text-gray-600">
              No sessions found
            </p>

            <p className="mt-1 text-sm text-gray-400">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">

              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-5 py-4">Session No.</th>
                  <th className="px-5 py-4">Student</th>
                  <th className="px-5 py-4">Counsellor</th>
                  <th className="px-5 py-4">Type</th>
                  <th className="px-5 py-4">Mode</th>
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4">Duration</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredSessions.map((item) => (
                  <tr
                    key={item._id}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-5 py-4 font-medium text-gray-800">
                      #{item.sessionNumber}
                    </td>

                    <td className="px-5 py-4 text-gray-700">
                      {studentName(item.student)}
                    </td>

                    <td className="px-5 py-4 text-gray-700">
                      {counsellorName(item.counsellor)}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {formatText(item.type)}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {formatText(item.mode)}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {formatDate(
                        item.startedAt ||
                        item.createdAt
                      )}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {item.durationMinutes != null
                        ? `${item.durationMinutes} min`
                        : "N/A"}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(item.status)}`}
                      >
                        {formatText(item.status)}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex flex-wrap items-center gap-2">

                        <button
                          onClick={() =>
                            getSingleSession(item._id)
                          }
                          className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
                        >
                          View
                        </button>

                        {item.status === "in_progress" &&
                          !item.startedAt && (
                            <button
                              disabled={processing}
                              onClick={() =>
                                handleStartSession(item._id)
                              }
                              className="rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-200 disabled:opacity-50"
                            >
                              Start
                            </button>
                          )}

                        {item.status === "in_progress" &&
                          item.startedAt && (
                            <button
                              disabled={processing}
                              onClick={() =>
                                handleCompleteSession(item._id)
                              }
                              className="rounded-lg bg-green-100 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-200 disabled:opacity-50"
                            >
                              Complete
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Session Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleCreateSession}
            className="max-h-[90vh] w-full max-w-lg space-y-5 overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between border-b pb-4">
              <h2 className="text-lg font-bold text-gray-800">
                Create Counselling Session
              </h2>

              <button
                type="button"
                onClick={closeCreateModal}
                className="text-2xl text-gray-500 hover:text-gray-800"
              >
                &times;
              </button>
            </div>

            {/* Appointment */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Select Appointment *
              </label>

              <select
                required
                value={formData.appointmentId}
                onChange={(e) => {
                  const selected = appointments.find(
                    (item) => item._id === e.target.value
                  );

                  setFormData({
                    ...formData,
                    appointmentId: e.target.value,
                    mode: selected?.mode || formData.mode,
                  });
                }}
                className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
              >
                <option value="">
                  Select Appointment
                </option>

                {appointments.map((item) => (
                  <option
                    key={item._id}
                    value={item._id}
                  >
                    {studentName(item.student)} -{" "}
                    {item.scheduledStart
                      ? new Date(
                          item.scheduledStart
                        ).toLocaleString()
                      : "Date not available"}
                    {" "}({formatText(item.status)})
                  </option>
                ))}
              </select>

              {appointments.length === 0 && (
                <p className="mt-2 text-xs text-red-500">
                  No confirmed or completed appointments available.
                </p>
              )}
            </div>

            {/* Session Type */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Session Type *
              </label>

              <select
                required
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
              >
                <option value="initial">Initial</option>
                <option value="follow_up">Follow Up</option>
                <option value="admission_guidance">
                  Admission Guidance
                </option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Session Mode */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Session Mode *
              </label>

              <select
                required
                value={formData.mode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    mode: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
              >
                <option value="phone">Phone</option>
                <option value="video">Video</option>
                <option value="in_person">In Person</option>
                <option value="chat">Chat</option>
              </select>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 border-t pt-4">
              <button
                type="button"
                onClick={closeCreateModal}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={creating || appointments.length === 0}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create Session"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Session Details Modal */}
      {showDetails && selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">

            <div className="sticky top-0 flex items-center justify-between border-b bg-white px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  Session Details
                </h2>

                <p className="text-xs text-gray-500">
                  Session #{selectedSession.sessionNumber}
                </p>
              </div>

              <button
                onClick={() => {
                  setShowDetails(false);
                  setSelectedSession(null);
                }}
                className="text-2xl text-gray-500 hover:text-gray-800"
              >
                &times;
              </button>
            </div>

            <div className="space-y-6 p-6">

              {/* Basic Information */}
              <div>
                <h3 className="mb-4 font-semibold text-gray-800">
                  Basic Information
                </h3>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {[
                    [
                      "Session Number",
                      `#${selectedSession.sessionNumber}`,
                    ],
                    [
                      "Student",
                      studentName(selectedSession.student),
                    ],
                    [
                      "Counsellor",
                      counsellorName(selectedSession.counsellor),
                    ],
                    [
                      "Type",
                      formatText(selectedSession.type),
                    ],
                    [
                      "Mode",
                      formatText(selectedSession.mode),
                    ],
                    [
                      "Status",
                      formatText(selectedSession.status),
                    ],
                    [
                      "Outcome",
                      formatText(selectedSession.outcome),
                    ],
                    [
                      "Duration",
                      selectedSession.durationMinutes != null
                        ? `${selectedSession.durationMinutes} minutes`
                        : "N/A",
                    ],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs font-medium uppercase text-gray-400">
                        {label}
                      </p>

                      <p className="mt-1 break-words text-sm font-medium text-gray-800">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t" />

              {/* Timing Information */}
              <div>
                <h3 className="mb-4 font-semibold text-gray-800">
                  Timing Information
                </h3>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {[
                    [
                      "Created At",
                      formatDate(selectedSession.createdAt),
                    ],
                    [
                      "Started At",
                      formatDate(selectedSession.startedAt),
                    ],
                    [
                      "Ended At",
                      formatDate(selectedSession.endedAt),
                    ],
                    [
                      "Next Follow-up",
                      formatDate(selectedSession.nextFollowUpAt),
                    ],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs font-medium uppercase text-gray-400">
                        {label}
                      </p>

                      <p className="mt-1 break-words text-sm font-medium text-gray-800">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t" />

              {/* Session Information */}
              <div>
                <h3 className="mb-3 font-semibold text-gray-800">
                  Additional Information
                </h3>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-medium uppercase text-gray-400">
                      Student Questions
                    </p>

                    {selectedSession.studentQuestions?.length > 0 ? (
                      <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-700">
                        {selectedSession.studentQuestions.map(
                          (question, index) => (
                            <li key={index}>{question}</li>
                          )
                        )}
                      </ul>
                    ) : (
                      <p className="mt-1 text-sm text-gray-500">
                        No student questions recorded.
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase text-gray-400">
                      Next Action
                    </p>

                    <p className="mt-1 break-words text-sm text-gray-700">
                      {selectedSession.nextAction || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              {selectedSession.status === "in_progress" && (
                <div className="flex flex-wrap justify-end gap-3 border-t pt-4">

                  {!selectedSession.startedAt && (
                    <button
                      disabled={processing}
                      onClick={() =>
                        handleStartSession(selectedSession._id)
                      }
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      Start Session
                    </button>
                  )}

                  {selectedSession.startedAt && (
                    <button
                      disabled={processing}
                      onClick={() =>
                        handleCompleteSession(selectedSession._id)
                      }
                      className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      Complete Session
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sessions;
