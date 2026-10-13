import React, { useEffect, useMemo, useState } from "react";
import api from "./Api/axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const emptyForm = {
  name: "",
  slug: "",
  code: "",
  description: "",
  course: "",
  durationValue: "",
  durationUnit: "years",
  minimumPercentage: "",
  requiredSubjects: "",
  requiredQualification: "",
  careerOptions: "",
  status: "active",
};

const getError = (error) =>
  error.response?.data?.message ||
  error.message ||
  "Something went wrong";

export default function Specialization() {
  const [specializations, setSpecializations] = useState([]);
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);

  const pageSize = 8;

  // GET ALL SPECIALIZATIONS
  const fetchSpecializations = async () => {
    try {
      setLoading(true);

      const response = await api.get("/Get-All-Specializations");

      if (response.data.status) {
        setSpecializations(
          Array.isArray(response.data.data)
            ? response.data.data
            : [],
        );
      } else {
        toast.error(
          response.data.message ||
            "Specializations load nahi hui.",
        );
      }
    } catch (error) {
      toast.error(getError(error));
    } finally {
      setLoading(false);
    }
  };

  // GET ALL COURSES
  const fetchCourses = async () => {
    try {
      const response = await api.get("/Get-All-Courses");

      const result = response.data.data;

      if (
        response.data.status === true ||
        response.data.success === true
      ) {
        setCourses(Array.isArray(result) ? result : []);
      } else {
        toast.error(
          response.data.message || "Courses load nahi hue.",
        );
      }
    } catch (error) {
      toast.error(
        `Courses load nahi hue: ${getError(error)}`,
      );
    }
  };

  useEffect(() => {
    fetchSpecializations();
    fetchCourses();
  }, []);

  // SEARCH, FILTER AND SORT
  const filteredSpecializations = useMemo(() => {
    let result = [...specializations];

    if (search.trim()) {
      const query = search.toLowerCase();

      result = result.filter((item) =>
        [
          item.name,
          item.slug,
          item.code,
          item.course?.name,
        ].some((value) =>
          String(value || "").toLowerCase().includes(query),
        ),
      );
    }

    if (statusFilter !== "all") {
      result = result.filter(
        (item) => item.status === statusFilter,
      );
    }

    result.sort((a, b) => {
      if (sortOrder === "name-asc") {
        return (a.name || "").localeCompare(b.name || "");
      }

      if (sortOrder === "name-desc") {
        return (b.name || "").localeCompare(a.name || "");
      }

      return sortOrder === "oldest"
        ? new Date(a.createdAt || 0) -
            new Date(b.createdAt || 0)
        : new Date(b.createdAt || 0) -
            new Date(a.createdAt || 0);
    });

    return result;
  }, [specializations, search, statusFilter, sortOrder]);

  // PAGINATION
  const totalPages = Math.max(
    1,
    Math.ceil(filteredSpecializations.length / pageSize),
  );

  const visibleSpecializations = filteredSpecializations.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, sortOrder]);

  // HANDLE INPUT CHANGES
  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
      ...(name === "name" && !editingId
        ? {
            slug: value
              .toLowerCase()
              .trim()
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

  // ADD / UPDATE SPECIALIZATION
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.course) {
      toast.error("Please select a course.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      code: form.code.trim(),
      description: form.description.trim(),
      course: form.course,
      duration: {
        value:
          form.durationValue === ""
            ? undefined
            : Number(form.durationValue),
        unit: form.durationUnit,
      },
      eligibility: {
        minimumPercentage:
          form.minimumPercentage === ""
            ? undefined
            : Number(form.minimumPercentage),
        requiredSubjects: form.requiredSubjects
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
        requiredQualification:
          form.requiredQualification.trim(),
      },
      careerOptions: form.careerOptions
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      status: form.status,
    };

    try {
      setLoading(true);

      if (editingId) {
        await api.put(
          `/Edit-Specialization/${editingId}`,
          payload,
        );

        toast.success(
          "Specialization updated successfully!",
        );
      } else {
        await api.post(
          "/Add-New-Specialization",
          payload,
        );

        toast.success(
          "Specialization added successfully!",
        );
      }

      resetForm();
      await fetchSpecializations();
    } catch (error) {
      toast.error(getError(error));
    } finally {
      setLoading(false);
    }
  };

  // EDIT SPECIALIZATION
  const handleEdit = (item) => {
    setEditingId(item._id);

    setForm({
      name: item.name || "",
      slug: item.slug || "",
      code: item.code || "",
      description: item.description || "",
      course: item.course?._id || item.course || "",
      durationValue: item.duration?.value ?? "",
      durationUnit: item.duration?.unit || "years",
      minimumPercentage:
        item.eligibility?.minimumPercentage ?? "",
      requiredSubjects: (
        item.eligibility?.requiredSubjects || []
      ).join(", "),
      requiredQualification:
        item.eligibility?.requiredQualification || "",
      careerOptions: (item.careerOptions || []).join(", "),
      status: item.status || "active",
    });

    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // DELETE SPECIALIZATION
  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this specialization?",
      )
    ) {
      return;
    }

    try {
      await api.delete(`/Delete-Specialization/${id}`);

      toast.success(
        "Specialization deleted successfully!",
      );

      await fetchSpecializations();
    } catch (error) {
      toast.error(getError(error));
    }
  };

  return (
    <div className="ml-64 min-h-screen bg-slate-100 p-4 text-slate-800 sm:p-6 lg:p-8">
      <ToastContainer position="top-right" autoClose={2500} />

      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              StudentHub / Academic Management
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              Specializations
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage courses, eligibility and career options.
            </p>
          </div>

          <button
            onClick={() => {
              if (showForm && !editingId) {
                resetForm();
              } else {
                setEditingId(null);
                setForm(emptyForm);
                setShowForm(true);
              }
            }}
            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            {showForm && !editingId
              ? "Close Form"
              : "+ Add Specialization"}
          </button>
        </div>

        {/* ADD / EDIT FORM */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
          >
            <h2 className="mb-5 text-xl font-bold">
              {editingId
                ? "Edit Specialization"
                : "Add New Specialization"}
            </h2>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Specialization Name *">
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className={inputClass}
                  placeholder="e.g. Data Science"
                />
              </Field>

              <Field label="Slug *">
                <input
                  name="slug"
                  value={form.slug}
                  onChange={handleChange}
                  required
                  className={inputClass}
                  placeholder="data-science"
                />
              </Field>

              <Field label="Code">
                <input
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="DS101"
                />
              </Field>

              <Field label="Course *">
                <select
                  name="course"
                  value={form.course}
                  onChange={handleChange}
                  required
                  className={inputClass}
                >
                  <option value="">Select Course</option>

                  {courses.map((course) => (
                    <option
                      key={course._id}
                      value={course._id}
                    >
                      {course.name}
                    </option>
                  ))}
                </select>

                {courses.length === 0 && (
                  <p className="mt-1 text-xs text-amber-600">
                    No courses found. Add a course first or check
                    the API.
                  </p>
                )}
              </Field>

              <Field label="Duration Value">
                <input
                  name="durationValue"
                  type="number"
                  min="0"
                  value={form.durationValue}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="e.g. 2"
                />
              </Field>

              <Field label="Duration Unit">
                <select
                  name="durationUnit"
                  value={form.durationUnit}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="years">Years</option>
                  <option value="months">Months</option>
                </select>
              </Field>

              <Field label="Minimum Percentage">
                <input
                  name="minimumPercentage"
                  type="number"
                  min="0"
                  max="100"
                  value={form.minimumPercentage}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="e.g. 50"
                />
              </Field>

              <Field label="Required Qualification">
                <input
                  name="requiredQualification"
                  value={form.requiredQualification}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="e.g. Graduation"
                />
              </Field>

              <Field label="Required Subjects">
                <input
                  name="requiredSubjects"
                  value={form.requiredSubjects}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Mathematics, Physics"
                />
              </Field>

              <Field label="Career Options">
                <input
                  name="careerOptions"
                  value={form.careerOptions}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Data Analyst, Data Scientist"
                />
              </Field>

              <Field label="Status">
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </Field>

              <div className="sm:col-span-2 lg:col-span-3">
                <Field label="Description">
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows="3"
                    className={inputClass}
                    placeholder="Enter specialization description"
                  />
                </Field>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {loading
                  ? "Please wait..."
                  : editingId
                    ? "Update Specialization"
                    : "Save Specialization"}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-slate-300 px-6 py-3 font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* STATISTICS */}
        <div className="mb-5 grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Total Specializations"
            value={specializations.length}
          />

          <StatCard
            label="Active"
            value={
              specializations.filter(
                (item) => item.status === "active",
              ).length
            }
          />

          <StatCard
            label="Inactive"
            value={
              specializations.filter(
                (item) => item.status === "inactive",
              ).length
            }
          />
        </div>

        {/* SEARCH, FILTER AND SORT */}
        <div className="mb-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3">
          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            className={inputClass}
            placeholder="Search name, code or course..."
          />

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            className={inputClass}
          >
            <option value="all">All Statuses</option>
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
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name-asc">Name A–Z</option>
            <option value="name-desc">Name Z–A</option>
          </select>
        </div>

        {/* SPECIALIZATION TABLE */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 p-5">
            <h2 className="font-bold">
              All Specializations
            </h2>

            <span className="text-sm text-slate-500">
              {filteredSpecializations.length} records
            </span>
          </div>

          {loading && specializations.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              Loading...
            </div>
          ) : visibleSpecializations.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              No specializations found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-4">
                      Specialization
                    </th>
                    <th className="px-5 py-4">Course</th>
                    <th className="px-5 py-4">Duration</th>
                    <th className="px-5 py-4">Eligibility</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {visibleSpecializations.map((item) => (
                    <tr
                      key={item._id}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold">
                          {item.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {item.code || item.slug}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        {item.course?.name ||
                          "Course unavailable"}
                      </td>

                      <td className="px-5 py-4">
                        {item.duration?.value != null
                          ? `${item.duration.value} ${item.duration.unit || "years"}`
                          : "—"}
                      </td>

                      <td className="px-5 py-4">
                        {item.eligibility
                          ?.minimumPercentage != null
                          ? `${item.eligibility.minimumPercentage}%`
                          : "—"}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            item.status === "active"
                              ? "bg-green-100 text-green-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="rounded-lg border border-blue-200 px-3 py-2 font-medium text-blue-700 hover:bg-blue-50"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() =>
                              handleDelete(item._id)
                            }
                            className="rounded-lg border border-red-200 px-3 py-2 font-medium text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* PAGINATION */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-4">
            <p className="text-sm text-slate-500">
              Page {currentPage} of {totalPages}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() =>
                  setCurrentPage((page) =>
                    Math.max(1, page - 1),
                  )
                }
                disabled={currentPage === 1}
                className="rounded-lg border border-slate-300 px-4 py-2 disabled:opacity-40"
              >
                Previous
              </button>

              <button
                onClick={() =>
                  setCurrentPage((page) =>
                    Math.min(totalPages, page + 1),
                  )
                }
                disabled={currentPage === totalPages}
                className="rounded-lg border border-slate-300 px-4 py-2 disabled:opacity-40"
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

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

function Field({ label, children }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      <span className="mb-2 block">{label}</span>
      {children}
    </label>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}
