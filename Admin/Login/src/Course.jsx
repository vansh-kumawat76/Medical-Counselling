import React, { useEffect, useMemo, useState } from "react";
import api from "./Api/axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const emptyForm = {
  name: "",
  slug: "",
  code: "",
  degree: "",
  stream: "",
  durationValue: 4,
  durationUnit: "years",
  description: "",
  status: "active",
};

export default function Course() {
  const [courses, setCourses] = useState([]);
  const [degrees, setDegrees] = useState([]);
  const [streams, setStreams] = useState([]);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [degreeFilter, setDegreeFilter] = useState("");
  const [streamFilter, setStreamFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");

  const [page, setPage] = useState(1);
  const limit = 10;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const getError = (error) =>
    error.response?.data?.message ||
    error.message ||
    "Something went wrong";

  // GET ALL COURSES
  const fetchCourses = async () => {
    setLoading(true);

    try {
      const response = await api.get("/Get-All-Courses");

      if (response.data.success) {
        setCourses(
          Array.isArray(response.data.data)
            ? response.data.data
            : [],
        );
      } else {
        toast.error(
          response.data.message || "Failed to load courses",
        );
      }
    } catch (error) {
      toast.error(getError(error));
    } finally {
      setLoading(false);
    }
  };

  // GET ALL DEGREES
  const fetchDegrees = async () => {
    try {
      const response = await api.get("/GetAllDegree");

      if (response.data.success) {
        const data =
          response.data.data ??
          response.data.degrees ??
          [];

        setDegrees(Array.isArray(data) ? data : []);
      } else {
        toast.error(
          response.data.message || "Failed to load degrees",
        );
      }
    } catch (error) {
      console.error("Degree API:", getError(error));
      toast.error(
        "Degrees load nahi ho payi. Degree API URL check karo.",
      );
    }
  };

  // GET ALL STREAMS
  const fetchStreams = async () => {
    try {
      const response = await api.get("/Get-All-Streams");

      if (response.data.status) {
        setStreams(
          Array.isArray(response.data.streams)
            ? response.data.streams
            : [],
        );
      } else {
        toast.error(
          response.data.message || "Failed to load streams",
        );
      }
    } catch (error) {
      console.error("Stream API:", getError(error));
      toast.error(getError(error));
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchDegrees();
    fetchStreams();
  }, []);

  // HANDLE INPUT CHANGES
  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "name"
        ? {
            slug: value
              .trim()
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-|-$/g, ""),
          }
        : {}),
    }));
  };

  // RESET FORM
  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  // ADD / UPDATE COURSE
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim() || !form.slug.trim()) {
      toast.error("Course name aur slug required hain");
      return;
    }

    if (!form.degree || !form.stream) {
      toast.error("Degree aur Stream select karo");
      return;
    }

    const durationValue = Number(form.durationValue);

    if (
      form.durationValue === "" ||
      !Number.isFinite(durationValue) ||
      durationValue < 0
    ) {
      toast.error("Valid course duration enter karo");
      return;
    }

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim().toLowerCase(),
      code: form.code.trim(),
      degree: form.degree,
      stream: form.stream,
      duration: {
        value: durationValue,
        unit: form.durationUnit,
      },
      description: form.description.trim(),
      status: form.status,
    };

    setSaving(true);

    try {
      if (editingId) {
        await api.put(
          `/Edit-Course/${editingId}`,
          payload,
        );

        toast.success("Course updated successfully");
      } else {
        await api.post("/Add-New-Course", payload);

        toast.success("Course added successfully");
      }

      resetForm();
      await fetchCourses();
    } catch (error) {
      toast.error(getError(error));
    } finally {
      setSaving(false);
    }
  };

  // EDIT COURSE
  const handleEdit = (course) => {
    setEditingId(course._id);

    setForm({
      name: course.name || "",
      slug: course.slug || "",
      code: course.code || "",
      degree: course.degree?._id || course.degree || "",
      stream: course.stream?._id || course.stream || "",
      durationValue: course.duration?.value ?? 4,
      durationUnit: course.duration?.unit || "years",
      description: course.description || "",
      status: course.status || "active",
    });

    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // DELETE COURSE
  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Kya tum ye course delete karna chahte ho?",
      )
    ) {
      return;
    }

    try {
      await api.delete(`/Delete-Course/${id}`);

      toast.success("Course deleted successfully");
      await fetchCourses();
    } catch (error) {
      toast.error(getError(error));
    }
  };

  // SEARCH, FILTER AND SORT
  const filteredCourses = useMemo(() => {
    const result = courses.filter((course) => {
      const searchText = search.toLowerCase();

      const searchMatch = [
        course.name,
        course.code,
        course.slug,
        course.description,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(searchText),
        );

      const degreeId =
        course.degree?._id || course.degree || "";

      const streamId =
        course.stream?._id || course.stream || "";

      return (
        searchMatch &&
        (!statusFilter || course.status === statusFilter) &&
        (!degreeFilter || degreeId === degreeFilter) &&
        (!streamFilter || streamId === streamFilter)
      );
    });

    return result.sort((a, b) => {
      const comparison = (a.name || "").localeCompare(
        b.name || "",
      );

      return sortOrder === "asc"
        ? comparison
        : -comparison;
    });
  }, [
    courses,
    search,
    statusFilter,
    degreeFilter,
    streamFilter,
    sortOrder,
  ]);

  // PAGINATION
  const totalPages = Math.max(
    1,
    Math.ceil(filteredCourses.length / limit),
  );

  const currentPage = Math.min(page, totalPages);

  const paginatedCourses = filteredCourses.slice(
    (currentPage - 1) * limit,
    currentPage * limit,
  );

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  const labelClass =
    "mb-1.5 block text-sm font-medium text-slate-700";

  return (
    <div className="ml-64 min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-8">
      <ToastContainer position="top-right" autoClose={2500} />

      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-blue-600">
              StudentHub / Academics
            </p>

            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Course Management
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage courses, degrees and streams.
            </p>
          </div>

          <button
            onClick={() => {
              if (showForm) {
                resetForm();
              } else {
                setForm(emptyForm);
                setEditingId(null);
                setShowForm(true);
              }
            }}
            className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            {showForm ? "Cancel" : "+ Add New Course"}
          </button>
        </div>

        {/* ADD / EDIT FORM */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <h2 className="mb-5 text-xl font-bold text-slate-800">
              {editingId ? "Edit Course" : "Add New Course"}
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className={labelClass}>
                  Course Name *
                </label>

                <input
                  name="name"
                  value={form.name}
                  onChange={updateField}
                  className={inputClass}
                  placeholder="Bachelor of Technology"
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Slug *</label>

                <input
                  name="slug"
                  value={form.slug}
                  onChange={updateField}
                  className={inputClass}
                  placeholder="bachelor-of-technology"
                  required
                />
              </div>

              <div>
                <label className={labelClass}>
                  Course Code
                </label>

                <input
                  name="code"
                  value={form.code}
                  onChange={updateField}
                  className={inputClass}
                  placeholder="BTECH"
                />
              </div>

              <div>
                <label className={labelClass}>Degree *</label>

                <select
                  name="degree"
                  value={form.degree}
                  onChange={updateField}
                  className={inputClass}
                  required
                >
                  <option value="">Select Degree</option>

                  {degrees.map((degree) => (
                    <option
                      key={degree._id}
                      value={degree._id}
                    >
                      {degree.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Stream *</label>

                <select
                  name="stream"
                  value={form.stream}
                  onChange={updateField}
                  className={inputClass}
                  required
                >
                  <option value="">Select Stream</option>

                  {streams.map((stream) => (
                    <option
                      key={stream._id}
                      value={stream._id}
                    >
                      {stream.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Duration</label>

                <input
                  type="number"
                  name="durationValue"
                  value={form.durationValue}
                  onChange={updateField}
                  min="0"
                  step="any"
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>
                  Duration Unit
                </label>

                <select
                  name="durationUnit"
                  value={form.durationUnit}
                  onChange={updateField}
                  className={inputClass}
                >
                  <option value="years">Years</option>
                  <option value="months">Months</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Status</label>

                <select
                  name="status"
                  value={form.status}
                  onChange={updateField}
                  className={inputClass}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <label className={labelClass}>
                  Description
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={updateField}
                  className={inputClass}
                  rows="3"
                  placeholder="Enter course description"
                />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update Course"
                    : "Save Course"}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-slate-300 px-5 py-2.5 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* COURSE STATISTICS */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Total Courses
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {courses.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Active Courses
            </p>

            <p className="mt-2 text-3xl font-bold text-green-600">
              {
                courses.filter(
                  (course) => course.status === "active",
                ).length
              }
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Inactive Courses
            </p>

            <p className="mt-2 text-3xl font-bold text-rose-600">
              {
                courses.filter(
                  (course) => course.status === "inactive",
                ).length
              }
            </p>
          </div>
        </div>

        {/* SEARCH AND FILTERS */}
        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search course..."
              className={inputClass}
            />

            <select
              value={degreeFilter}
              onChange={(event) => {
                setDegreeFilter(event.target.value);
                setPage(1);
              }}
              className={inputClass}
            >
              <option value="">All Degrees</option>

              {degrees.map((degree) => (
                <option
                  key={degree._id}
                  value={degree._id}
                >
                  {degree.name}
                </option>
              ))}
            </select>

            <select
              value={streamFilter}
              onChange={(event) => {
                setStreamFilter(event.target.value);
                setPage(1);
              }}
              className={inputClass}
            >
              <option value="">All Streams</option>

              {streams.map((stream) => (
                <option
                  key={stream._id}
                  value={stream._id}
                >
                  {stream.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
              className={inputClass}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              value={sortOrder}
              onChange={(event) =>
                setSortOrder(event.target.value)
              }
              className={inputClass}
            >
              <option value="asc">Name: A to Z</option>
              <option value="desc">Name: Z to A</option>
            </select>
          </div>
        </div>

        {/* COURSE TABLE */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-2 border-b border-slate-200 p-5 sm:flex-row sm:items-center">
            <h2 className="text-lg font-bold text-slate-800">
              Course List
            </h2>

            <span className="text-sm text-slate-500">
              {filteredCourses.length} result(s)
            </span>
          </div>

          {loading ? (
            <div className="p-10 text-center text-slate-500">
              Loading courses...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Course</th>
                    <th className="px-5 py-4">Code</th>
                    <th className="px-5 py-4">Degree</th>
                    <th className="px-5 py-4">Stream</th>
                    <th className="px-5 py-4">Duration</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedCourses.map((course) => (
                    <tr
                      key={course._id}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">
                          {course.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {course.slug}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {course.code || "-"}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {course.degree?.name || "-"}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {course.stream?.name || "-"}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {course.duration?.value ?? "-"}{" "}
                        {course.duration?.unit || ""}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            course.status === "active"
                              ? "bg-green-100 text-green-700"
                              : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {course.status || "unknown"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(course)}
                            className="rounded-md bg-amber-100 px-3 py-1.5 font-medium text-amber-800 hover:bg-amber-200"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() =>
                              handleDelete(course._id)
                            }
                            className="rounded-md bg-rose-100 px-3 py-1.5 font-medium text-rose-700 hover:bg-rose-200"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {!paginatedCourses.length && (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-5 py-12 text-center text-slate-500"
                      >
                        {search ||
                        statusFilter ||
                        degreeFilter ||
                        streamFilter
                          ? "No matching courses found."
                          : "No courses found. Add your first course."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* PAGINATION */}
          <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row">
            <p className="text-sm text-slate-500">
              Page {currentPage} of {totalPages}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() =>
                  setPage((prev) => Math.max(1, prev - 1))
                }
                disabled={currentPage === 1}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <button
                onClick={() =>
                  setPage((prev) =>
                    Math.min(totalPages, prev + 1),
                  )
                }
                disabled={currentPage === totalPages}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
