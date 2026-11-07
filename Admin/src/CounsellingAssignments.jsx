
import React, { useEffect, useState } from "react";
import api from "./Api/axios";
import { toast } from "react-toastify";

const CounsellingAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const formatLabel = (value) => {
    if (!value) return "N/A";

    return value
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const getStatusStyle = (status) => {
    const styles = {
      active: "bg-green-100 text-green-700",
      reassigned: "bg-yellow-100 text-yellow-700",
      completed: "bg-blue-100 text-blue-700",
    };

    return styles[status] || "bg-gray-100 text-gray-700";
  };

  // Fetch all assignments
  const fetchAssignments = async () => {
    try {
      setLoading(true);

      const response = await api.get(
        "/counsellingAssignment/get-all-assignments"
      );

      setAssignments(response.data.data || []);
    } catch (error) {
      console.log(
        "Fetch Assignments Error:",
        error.response?.data || error.message
      );

      toast.error(
        error.response?.data?.message ||
          "Failed to fetch counselling assignments"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  // View single assignment
  const handleViewDetails = async (assignmentId) => {
    try {
      setDetailsLoading(true);
      setSelectedAssignment(null);

      const response = await api.get(
        `/counsellingAssignment/get-assignment/${assignmentId}`
      );

      setSelectedAssignment(response.data.data);
    } catch (error) {
      console.log(
        "Assignment Details Error:",
        error.response?.data || error.message
      );

      toast.error(
        error.response?.data?.message ||
          "Failed to fetch assignment details"
      );
    } finally {
      setDetailsLoading(false);
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
            Counselling Assignments
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Manage and monitor counsellor assignments.
          </p>
        </div>

        <button
          onClick={fetchAssignments}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh Assignments"}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Total Assignments</p>

          <h2 className="text-3xl font-bold text-gray-800 mt-2">
            {assignments.length}
          </h2>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Active Assignments</p>

          <h2 className="text-3xl font-bold text-green-600 mt-2">
            {assignments.filter((item) => item.status === "active").length}
          </h2>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Reassigned Assignments</p>

          <h2 className="text-3xl font-bold text-yellow-600 mt-2">
            {assignments.filter((item) => item.status === "reassigned").length}
          </h2>
        </div>
      </div>

      {/* Assignments Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden w-full">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-gray-800">
            All Counselling Assignments
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-sm text-left">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-4">Request Number</th>
                <th className="px-4 py-4">Student Email</th>
                <th className="px-4 py-4">Counsellor</th>
                <th className="px-4 py-4">Assigned By</th>
                <th className="px-4 py-4">Type</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Date</th>
                <th className="px-4 py-4">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-10 text-gray-500">
                    Loading assignments...
                  </td>
                </tr>
              ) : assignments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-10 text-gray-500">
                    No counselling assignments found.
                  </td>
                </tr>
              ) : (
                assignments.map((item) => (
                  <tr
                    key={item._id}
                    className="border-t hover:bg-gray-50 transition"
                  >
                    <td className="px-4 py-4 font-medium break-all">
                      {item.counsellingRequest?.requestNumber || "N/A"}
                    </td>

                    <td className="px-4 py-4 break-all">
                      {item.counsellingRequest?.student?.email || "N/A"}
                    </td>

                    <td className="px-4 py-4 break-all">
                      {item.counsellor?.email || "N/A"}
                    </td>

                    <td className="px-4 py-4 break-all">
                      {item.assignedBy?.email || "N/A"}
                    </td>

                    <td className="px-4 py-4 capitalize">
                      {item.assignmentType || "N/A"}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getStatusStyle(
                          item.status
                        )}`}
                      >
                        {formatLabel(item.status)}
                      </span>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      {item.assignedAt
                        ? new Date(item.assignedAt).toLocaleDateString("en-IN")
                        : "N/A"}
                    </td>

                    <td className="px-4 py-4">
                      <button
                        onClick={() => handleViewDetails(item._id)}
                        className="px-3 py-2 text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 text-xs font-medium transition"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Loading */}
      {detailsLoading && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            Loading assignment details...
          </div>
        </div>
      )}

      {/* Assignment Details Modal */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-gray-800">
                  Assignment Details
                </h2>

                <p className="text-sm text-gray-500 mt-1 break-all">
                  {selectedAssignment._id}
                </p>
              </div>

              <button
                onClick={() => setSelectedAssignment(null)}
                className="text-gray-500 hover:text-red-600 text-2xl ml-3"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-6">
              {/* Request Information */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">
                  Counselling Request
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <DetailItem
                    label="Request Number"
                    value={selectedAssignment.counsellingRequest?.requestNumber}
                  />

                  <DetailItem
                    label="Student Email"
                    value={selectedAssignment.counsellingRequest?.student?.email}
                  />

                  <DetailItem
                    label="Academic Year"
                    value={selectedAssignment.counsellingRequest?.academicYear}
                  />

                  <DetailItem
                    label="Admission Level"
                    value={selectedAssignment.counsellingRequest?.admissionLevel}
                  />
                </div>
              </div>

              {/* Assignment Information */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">
                  Assignment Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <DetailItem
                    label="Counsellor Email"
                    value={selectedAssignment.counsellor?.email}
                  />

                  <DetailItem
                    label="Assigned By"
                    value={selectedAssignment.assignedBy?.email}
                  />

                  <DetailItem
                    label="Assignment Type"
                    value={formatLabel(selectedAssignment.assignmentType)}
                  />

                  <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                    <p className="text-xs text-gray-500 mb-2">
                      Assignment Status
                    </p>

                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(
                        selectedAssignment.status
                      )}`}
                    >
                      {formatLabel(selectedAssignment.status)}
                    </span>
                  </div>

                  <DetailItem
                    label="Assigned At"
                    value={
                      selectedAssignment.assignedAt
                        ? new Date(
                            selectedAssignment.assignedAt
                          ).toLocaleString("en-IN")
                        : "N/A"
                    }
                  />

                  <DetailItem
                    label="Ended At"
                    value={
                      selectedAssignment.endedAt
                        ? new Date(
                            selectedAssignment.endedAt
                          ).toLocaleString("en-IN")
                        : "Not ended"
                    }
                  />

                  <DetailItem
                    label="Reassigned To"
                    value={selectedAssignment.reassignedTo?.email}
                  />

                  <DetailItem
                    label="Reassignment Reason"
                    value={selectedAssignment.reassignmentReason}
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end p-5 border-t sticky bottom-0 bg-white">
              <button
                onClick={() => setSelectedAssignment(null)}
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

export default CounsellingAssignments;
