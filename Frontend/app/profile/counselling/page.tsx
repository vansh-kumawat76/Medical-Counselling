
"use client";

import { useState, type FormEvent } from "react";
import api from "@/src/lib/axios";
import toast from "react-hot-toast";

export default function CounsellingRequestPage() {
  const [academicYear, setAcademicYear] = useState("");
  const [admissionLevel, setAdmissionLevel] = useState("");
  const [preferredCity, setPreferredCity] = useState("");
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [loading, setLoading] = useState(false);
const [counsellingMode, setCounsellingMode] = useState("phone");
const [preferredDate, setPreferredDate] = useState("");

const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  // Budget validation
  if (
    minBudget !== "" &&
    maxBudget !== "" &&
    Number(maxBudget) < Number(minBudget)
  ) {
    toast.error("Maximum budget cannot be less than minimum budget");
    return;
  }

  try {
    setLoading(true);

    const response = await api.post(
      "/counsellingRequest/counselling-request",
      {
        academicYear,
        admissionLevel,

        preferredLocations: preferredCity.trim()
          ? [
              {
                city: preferredCity.trim(),
                state: "Rajasthan",
                country: "India",
              },
            ]
          : [],

        budget: {
          min: Number(minBudget) || 0,
          max: Number(maxBudget) || 0,
          currency: "INR",
        },

        counsellingMode,
        preferredTime: preferredDate
          ? {
              date: preferredDate,
              timezone: "Asia/Kolkata",
            }
          : undefined,
      }
    );

    toast.success(
      response.data.message || "Counselling request submitted successfully!"
    );

    setAcademicYear("");
    setAdmissionLevel("");
    setPreferredCity("");
    setMinBudget("");
    setMaxBudget("");
    setCounsellingMode("phone");
    setPreferredDate("");

  } catch (error: any) {
    toast.error(
      error.response?.data?.message || "Something went wrong"
    );
  } finally {
    setLoading(false);
  }
};


  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  const labelClass =
    "mb-2 block text-sm font-medium text-gray-700";

  return (
    <div className="min-h-screen flex-1 bg-gray-50 p-6">
      <div className="mx-auto max-w-3xl">

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Counselling Request
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Submit your details to get admission counselling assistance.
          </p>
        </div>

        {/* Counselling Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >

          {/* Academic Year */}
          <div>
            <label className={labelClass}>
              Academic Year *
            </label>

            <input
              type="text"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="Example: 2026-27"
              required
              className={inputClass}
            />
          </div>

          {/* Admission Level */}
          <div>
            <label className={labelClass}>
              Admission Level *
            </label>

            <select
              value={admissionLevel}
              onChange={(e) => setAdmissionLevel(e.target.value)}
              required
              className={inputClass}
            >
              <option value="">Select admission level</option>
              <option value="UG">Undergraduate (UG)</option>
              <option value="PG">Postgraduate (PG)</option>
              <option value="Diploma">Diploma</option>
              <option value="Doctorate">Doctorate</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Preferred City */}
          <div>
            <label className={labelClass}>
              Preferred City
            </label>

            <input
              type="text"
              value={preferredCity}
              onChange={(e) => setPreferredCity(e.target.value)}
              placeholder="Example: Jaipur"
              className={inputClass}
            />
          </div>

          {/* Budget Section */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Budget Details
            </h2>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

              {/* Minimum Budget */}
              <div>
                <label className={labelClass}>
                  Minimum Budget (₹)
                </label>

                <input
                  type="number"
                  min="0"
                  value={minBudget}
                  onChange={(e) => setMinBudget(e.target.value)}
                  placeholder="Example: 100000"
                  className={inputClass}
                />
              </div>

              {/* Maximum Budget */}
              <div>
                <label className={labelClass}>
                  Maximum Budget (₹)
                </label>

                <input
                  type="number"
                  min="0"
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(e.target.value)}
                  placeholder="Example: 300000"
                  className={inputClass}
                />
              </div>

            </div>
          </div>

{/* Counselling Mode */}
<div>
  <label className={labelClass}>
    Counselling Mode *
  </label>

  <select
    value={counsellingMode}
    onChange={(e) => setCounsellingMode(e.target.value)}
    required
    className={inputClass}
  >
    <option value="phone">Phone</option>
    <option value="video">Video Call</option>
    <option value="in_person">In Person</option>
    <option value="chat">Chat</option>
  </select>
</div>

{/* Preferred Date */}
<div>
  <label className={labelClass}>
    Preferred Counselling Date
  </label>

  <input
    type="datetime-local"
    value={preferredDate}
    onChange={(e) => setPreferredDate(e.target.value)}
    className={inputClass}
  />
</div>

          {/* Submit Button */}
          <div className="border-t border-gray-100 pt-5">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Submitting..." : "Submit Request"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
