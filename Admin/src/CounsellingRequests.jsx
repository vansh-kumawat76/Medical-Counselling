
import React, { useEffect, useState } from "react";
import api from "./Api/axios";
import { toast } from "react-toastify";

const CounsellingRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [counsellors, setCounsellors] = useState([]);
  const [assigningRequest, setAssigningRequest] = useState(null);
  const [selectedCounsellor, setSelectedCounsellor] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);

  const [statusRequest, setStatusRequest] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);

  const statusOptions = [
    "new",
    "assigned",
    "contact_pending",
    "in_progress",
    "recommendations_shared",
    "converted",
    "closed",
    "cancelled",
  ];

  const formatLabel = (value) => {
    if (!value) return "N/A";

    return value
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const getStatusStyle = (status) => {
    const styles = {
      new: "bg-blue-100 text-blue-700",
      assigned: "bg-purple-100 text-purple-700",
      contact_pending: "bg-yellow-100 text-yellow-700",
      in_progress: "bg-indigo-100 text-indigo-700",
      recommendations_shared: "bg-cyan-100 text-cyan-700",
      converted: "bg-green-100 text-green-700",
      closed: "bg-gray-200 text-gray-700",
      cancelled: "bg-red-100 text-red-700",
    };

    return styles[status] || "bg-gray-100 text-gray-700";
  };

  // Fetch all counselling requests
  const fetchCounsellingRequests = async () => {
    try {
      setLoading(true);

      const response = await api.get(
        "/counsellingRequest/getCounseller-request"
      );

      setRequests(response.data.data || []);
    } catch (error) {
      console.log(
        "Counselling Request Error:",
        error.response?.data || error.message
      );

      toast.error(
        error.response?.data?.message ||
          "Failed to fetch counselling requests"
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch counsellors
  const fetchCounsellors = async () => {
    try {
      const response = await api.get("/users?role=Counsellor");

      setCounsellors(response.data.data || []);
    } catch (error) {
      console.log(
        "Fetch Counsellors Error:",
        error.response?.data || error.message
      );

      toast.error(
        error.response?.data?.message || "Failed to fetch counsellors"
      );
    }
  };

  useEffect(() => {
    fetchCounsellingRequests();
    fetchCounsellors();
  }, []);

  // View single counselling request
  const handleViewDetails = async (requestId) => {
    try {
      setDetailsLoading(true);
      setSelectedRequest(null);

      const response = await api.get(
        `/counsellingRequest/get-single-request/${requestId}`
      );

      setSelectedRequest(response.data.data);
    } catch (error) {
      console.log(
        "View Request Error:",
        error.response?.data || error.message
      );

      toast.error(
        error.response?.data?.message || "Failed to fetch request details"
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  // Assign counsellor
  const handleAssignCounsellor = async () => {
    if (!assigningRequest?._id || !selectedCounsellor) {
      toast.warning("Please select a counsellor");
      return;
    }

    try {
      setAssignLoading(true);

      const response = await api.post(
        "/counsellingRequest/assign-request",
        {
          requestId: assigningRequest._id,
          counsellorId: selectedCounsellor,
        }
      );

      toast.success(
        response.data.message || "Counsellor assigned successfully"
      );

      await fetchCounsellingRequests();

      if (selectedRequest?._id === assigningRequest._id) {
        await handleViewDetails(assigningRequest._id);
      }

      setAssigningRequest(null);
      setSelectedCounsellor("");
    } catch (error) {
      console.log(
        "Assign Counsellor Error:",
        error.response?.data || error.message
      );

      toast.error(
        error.response?.data?.message || "Failed to assign counsellor"
      );
    } finally {
      setAssignLoading(false);
    }
  };

  // Update counselling request status
  const handleUpdateStatus = async () => {
    if (!statusRequest?._id || !selectedStatus) {
      toast.warning("Please select a status");
      return;
    }

    try {
      setStatusLoading(true);

      const response = await api.put(
        "/counsellingRequest/update-request-status",
        {
          requestId: statusRequest._id,
          status: selectedStatus,
        }
      );

      toast.success(
        response.data.message || "Status updated successfully"
      );

      await fetchCounsellingRequests();

      // Refresh details if details modal is open
      if (selectedRequest?._id === statusRequest._id) {
        const detailResponse = await api.get(
          `/counsellingRequest/get-single-request/${statusRequest._id}`
        );

        setSelectedRequest(detailResponse.data.data);
      }

      setStatusRequest(null);
      setSelectedStatus("");
    } catch (error) {
      console.log(
        "Update Status Error:",
        error.response?.data || error.message
      );

      toast.error(
        error.response?.data?.message || "Failed to update status"
      );
    } finally {
      setStatusLoading(false);
    }
  };

  // Reusable detail component
  const DetailItem = ({ label, value }) => (
    <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 min-w-0">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="font-semibold text-gray-800 text-sm break-words">
        {value || "N/A"}
      </p>
    </div>
  );

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Counselling Requests
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Manage and monitor all counselling requests.
          </p>
        </div>

        <button
          onClick={fetchCounsellingRequests}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh Requests"}
        </button>
      </div>

      {/* Total Requests */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Total Requests</p>

          <h2 className="text-3xl font-bold text-gray-800 mt-2">
            {requests.length}
          </h2>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Assigned Requests</p>

          <h2 className="text-3xl font-bold text-purple-600 mt-2">
            {requests.filter((item) => item.assignedTo).length}
          </h2>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">New Requests</p>

          <h2 className="text-3xl font-bold text-blue-600 mt-2">
            {requests.filter((item) => item.status === "new").length}
          </h2>
        </div>
      </div>

      {/* Counselling Requests Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden w-full">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-gray-800">
            All Counselling Requests
          </h2>
        </div>

        <table className="w-full table-fixed text-sm text-left">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-2 sm:px-4 py-4 w-[23%] break-words">
                Request Number
              </th>

              <th className="px-2 sm:px-4 py-4 w-[22%] break-words">
                Student Email
              </th>

              <th className="hidden md:table-cell px-2 sm:px-4 py-4 w-[13%]">
                Admission
              </th>

              <th className="hidden lg:table-cell px-2 sm:px-4 py-4 w-[10%]">
                Mode
              </th>

              <th className="hidden sm:table-cell px-2 sm:px-4 py-4 w-[15%]">
                Status
              </th>

              <th className="hidden lg:table-cell px-2 sm:px-4 py-4 w-[10%]">
                Date
              </th>

              <th className="px-2 sm:px-4 py-4 w-[20%]">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="text-center py-10 text-gray-500">
                  Loading requests...
                </td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-10 text-gray-500">
                  No counselling requests found.
                </td>
              </tr>
            ) : (
              requests.map((item) => (
                <tr
                  key={item._id}
                  className="border-t hover:bg-gray-50 transition"
                >
                  <td className="px-2 sm:px-4 py-4 font-medium break-words">
                    {item.requestNumber}
                  </td>

                  <td className="px-2 sm:px-4 py-4 break-all">
                    {item.student?.email || "N/A"}
                  </td>

                  <td className="hidden md:table-cell px-2 sm:px-4 py-4 break-words">
                    {item.admissionLevel || "N/A"}
                  </td>

                  <td className="hidden lg:table-cell px-2 sm:px-4 py-4 capitalize break-words">
                    {item.counsellingMode || "N/A"}
                  </td>

                  <td className="hidden sm:table-cell px-2 sm:px-4 py-4">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getStatusStyle(
                        item.status
                      )}`}
                    >
                      {formatLabel(item.status)}
                    </span>
                  </td>

                  <td className="hidden lg:table-cell px-2 sm:px-4 py-4">
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleDateString("en-IN")
                      : "N/A"}
                  </td>

                  <td className="px-2 sm:px-4 py-4">
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => {
                          setAssigningRequest(item);
                          setSelectedCounsellor(
                            item.assignedTo?._id || ""
                          );
                        }}
                        className="w-full px-2 py-2 text-green-700 bg-green-50 rounded-lg hover:bg-green-100 text-xs font-medium transition"
                      >
                        Assign
                      </button>

                      <button
                        onClick={() => handleViewDetails(item._id)}
                        className="w-full px-2 py-2 text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 text-xs font-medium transition"
                      >
                        View Details
                      </button>

                      <button
                        onClick={() => {
                          setStatusRequest(item);
                          setSelectedStatus(item.status);
                        }}
                        className="w-full px-2 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 text-xs font-medium transition"
                      >
                        Update Status
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Assign Counsellor Modal */}
      {assigningRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-gray-800">
                Assign Counsellor
              </h2>

              <p className="text-sm text-gray-500 mt-2 break-words">
                Request: {assigningRequest.requestNumber}
              </p>
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Counsellor
            </label>

            <select
              value={selectedCounsellor}
              onChange={(e) => setSelectedCounsellor(e.target.value)}
              disabled={assignLoading}
              className="w-full border border-gray-300 rounded-lg px-3 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose Counsellor</option>

              {counsellors.map((counsellor) => (
                <option key={counsellor._id} value={counsellor._id}>
                  {counsellor.email}
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setAssigningRequest(null);
                  setSelectedCounsellor("");
                }}
                disabled={assignLoading}
                className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={handleAssignCounsellor}
                disabled={!selectedCounsellor || assignLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {assignLoading ? "Assigning..." : "Assign"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {statusRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-800">
              Update Request Status
            </h2>

            <p className="text-sm text-gray-500 mt-2 mb-5 break-words">
              Request: {statusRequest.requestNumber}
            </p>

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Status
            </label>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              disabled={statusLoading}
              className="w-full border border-gray-300 rounded-lg px-3 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {formatLabel(status)}
                </option>
              ))}
            </select>

            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-2">
                Current Status
              </p>

              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(
                  statusRequest.status
                )}`}
              >
                {formatLabel(statusRequest.status)}
              </span>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setStatusRequest(null);
                  setSelectedStatus("");
                }}
                disabled={statusLoading}
                className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={handleUpdateStatus}
                disabled={
                  statusLoading ||
                  !selectedStatus ||
                  selectedStatus === statusRequest.status
                }
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {statusLoading ? "Updating..." : "Update Status"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Loading */}
      {detailsLoading && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            Loading request details...
          </div>
        </div>
      )}

      {/* Request Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-gray-800">
                  Request Details
                </h2>

                <p className="text-sm text-gray-500 mt-1 break-all">
                  {selectedRequest.requestNumber}
                </p>
              </div>

              <button
                onClick={() => setSelectedRequest(null)}
                className="text-gray-500 hover:text-red-600 text-2xl ml-3"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-6">
              {/* Student Information */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">
                  Student Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <DetailItem
                    label="Student Email"
                    value={selectedRequest.student?.email}
                  />

                  <DetailItem
                    label="Student ID"
                    value={selectedRequest.student?._id}
                  />
                </div>
              </div>

              {/* Academic Information */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">
                  Academic Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <DetailItem
                    label="Academic Year"
                    value={selectedRequest.academicYear}
                  />

                  <DetailItem
                    label="Admission Level"
                    value={selectedRequest.admissionLevel}
                  />

                  <DetailItem
                    label="Counselling Mode"
                    value={selectedRequest.counsellingMode}
                  />

                  <DetailItem
                    label="Source"
                    value={selectedRequest.source}
                  />
                </div>
              </div>

              {/* Preferences */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">
                  Preferences
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <DetailItem
                    label="Preferred Locations"
                    value={
                      selectedRequest.preferredLocations?.length
                        ? selectedRequest.preferredLocations
                            .map((location) =>
                              [
                                location.city,
                                location.state,
                                location.country,
                              ]
                                .filter(Boolean)
                                .join(", ")
                            )
                            .join(" | ")
                        : "N/A"
                    }
                  />

                  <DetailItem
                    label="Preferred Streams"
                    value={
                      selectedRequest.preferredStreams?.length
                        ? selectedRequest.preferredStreams.join(", ")
                        : "N/A"
                    }
                  />

                  <DetailItem
                    label="Preferred Courses"
                    value={
                      selectedRequest.preferredCourses?.length
                        ? selectedRequest.preferredCourses.join(", ")
                        : "N/A"
                    }
                  />

                  <DetailItem
                    label="Entrance Exams"
                    value={
                      selectedRequest.entranceExams?.length
                        ? selectedRequest.entranceExams.join(", ")
                        : "N/A"
                    }
                  />
                </div>
              </div>

              {/* Budget */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">
                  Budget
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <DetailItem
                    label="Minimum Budget"
                    value={selectedRequest.budget?.min}
                  />

                  <DetailItem
                    label="Maximum Budget"
                    value={selectedRequest.budget?.max}
                  />

                  <DetailItem
                    label="Currency"
                    value={selectedRequest.budget?.currency}
                  />
                </div>
              </div>

              {/* Assignment & Status */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">
                  Assignment & Status
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <DetailItem
                    label="Assigned Counsellor"
                    value={
                      selectedRequest.assignedTo?.email || "Not Assigned"
                    }
                  />

                  <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                    <p className="text-xs text-gray-500 mb-2">
                      Current Status
                    </p>

                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(
                        selectedRequest.status
                      )}`}
                    >
                      {formatLabel(selectedRequest.status)}
                    </span>
                  </div>

                  <DetailItem
                    label="Priority"
                    value={selectedRequest.priority}
                  />

                  <DetailItem
                    label="Created Date"
                    value={
                      selectedRequest.createdAt
                        ? new Date(
                            selectedRequest.createdAt
                          ).toLocaleString("en-IN")
                        : "N/A"
                    }
                  />
                </div>
              </div>

              {/* Status History */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-4">
                  Status History
                </h3>

                {selectedRequest.statusHistory?.length > 0 ? (
                  <div className="relative ml-2 space-y-5">
                    {selectedRequest.statusHistory.map((history, index) => (
                      <div
                        key={history._id || index}
                        className="relative pl-6 border-l-2 border-blue-200 pb-2 last:border-l-transparent"
                      >
                        <span className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-blue-600 ring-4 ring-blue-100" />

                        <div className="bg-gray-50 border rounded-xl p-4">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusStyle(
                                history.oldStatus
                              )}`}
                            >
                              {formatLabel(history.oldStatus)}
                            </span>

                            <span className="text-gray-400">→</span>

                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusStyle(
                                history.newStatus
                              )}`}
                            >
                              {formatLabel(history.newStatus)}
                            </span>
                          </div>

                          <p className="text-xs text-gray-500">
                            {history.updatedAt
                              ? new Date(
                                  history.updatedAt
                                ).toLocaleString("en-IN")
                              : "Date unavailable"}
                          </p>

                          <p className="text-xs text-gray-500 mt-1 break-all">
                            Updated By:{" "}
                            {history.updatedBy?.name ||
                              history.updatedBy?.email ||
                              history.updatedBy ||
                              "Unknown"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-gray-50 rounded-xl border">
                    <p className="text-sm text-gray-500">
                      No status history available.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end p-5 border-t sticky bottom-0 bg-white">
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-5 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition"
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

export default CounsellingRequests;
