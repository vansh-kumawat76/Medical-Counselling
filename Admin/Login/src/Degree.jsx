import React, { useEffect, useMemo, useState } from "react";
import api from "./Api/axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const initialForm = {
  name: "",
  shortName: "",
  slug: "",
  code: "",
  level: "undergraduate",
  degreeType: "academic",
  defaultDuration: {
    value: 4,
    unit: "years",
  },
  description: "",
  streams: [],
  status: "active",
  displayOrder: 1,
};

const Degree = () => {
  const [degrees, setDegrees] = useState([]);
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [sortBy, setSortBy] = useState("displayOrder");
  const [sortOrder, setSortOrder] = useState("asc");

  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(5);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);

  // ================= GET ALL DEGREES =================

  const fetchDegrees = async () => {
    try {
      setLoading(true);

      const response = await api.get("/GetAllDegree");

      if (response.data.success) {
        setDegrees(response.data.data || []);
      } else {
        toast.error(response.data.message || "Failed to fetch degrees");
      }
    } catch (error) {
      console.error("Fetch Degrees Error:", error);

      toast.error(
        error.response?.data?.message ||
          "Unable to fetch degrees. Check backend connection."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDegrees();
  }, []);

  // ================= FETCH STREAMS =================

  const fetchStreams = async () => {
    try {
      const response = await api.get("/Get-All-Streams");

      if (response.data.status) {
        setStreams(response.data.streams || []);
      } else {
        toast.error(response.data.message || "Failed to fetch streams");
      }
    } catch (error) {
      console.error("Fetch Streams Error:", error);

      toast.error(
        error.response?.data?.message || "Unable to fetch streams"
      );
    }
  };

  useEffect(() => {
    fetchStreams();
  }, []);

  // ================= FORM HANDLING =================

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "durationValue") {
      setForm((prev) => ({
        ...prev,
        defaultDuration: {
          ...prev.defaultDuration,
          value: value === "" ? "" : Number(value),
        },
      }));
      return;
    }

    if (name === "durationUnit") {
      setForm((prev) => ({
        ...prev,
        defaultDuration: {
          ...prev.defaultDuration,
          unit: value,
        },
      }));
      return;
    }

    if (name === "displayOrder") {
      setForm((prev) => ({
        ...prev,
        displayOrder: value === "" ? "" : Number(value),
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const openAddForm = () => {
    setEditingId(null);
    setForm(initialForm);
    setShowForm(true);
  };

  const openEditForm = (degree) => {
    setEditingId(degree._id);

    setForm({
      name: degree.name || "",
      shortName: degree.shortName || "",
      slug: degree.slug || "",
      code: degree.code || "",
      level: degree.level || "undergraduate",
      degreeType: degree.degreeType || "academic",
      defaultDuration: {
        value: degree.defaultDuration?.value ?? 4,
        unit: degree.defaultDuration?.unit || "years",
      },
      description: degree.description || "",
      streams: Array.isArray(degree.streams)
        ? degree.streams.map((stream) =>
            typeof stream === "object" ? stream._id : stream
          )
        : [],
      status: degree.status || "active",
      displayOrder: degree.displayOrder ?? 1,
    });

    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(initialForm);
  };

  // ================= CREATE / EDIT DEGREE =================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.name.trim() ||
      !form.shortName.trim() ||
      !form.slug.trim() ||
      !form.level
    ) {
      toast.error("Name, short name, slug and level are required");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...form,
        name: form.name.trim(),
        shortName: form.shortName.trim(),
        slug: form.slug.trim().toLowerCase(),
        code: form.code.trim()
          ? form.code.trim().toUpperCase()
          : undefined,
        defaultDuration: {
          value: Number(form.defaultDuration.value),
          unit: form.defaultDuration.unit,
        },
        displayOrder: Number(form.displayOrder || 0),
      };

      let response;

      if (editingId) {
        response = await api.put(
          `/Edit-Degree/${editingId}`,
          payload
        );
      } else {
        response = await api.post(
          "/Add-New-Degree",
          payload
        );
      }

      if (response.data.success) {
        toast.success(
          response.data.message ||
            (editingId
              ? "Degree updated successfully"
              : "Degree created successfully")
        );

        closeForm();
        await fetchDegrees();
      } else {
        toast.error(response.data.message || "Operation failed");
      }
    } catch (error) {
      console.error("Save Degree Error:", error);

      toast.error(
        error.response?.data?.message || "Failed to save degree"
      );
    } finally {
      setSaving(false);
    }
  };

  // ================= DELETE DEGREE =================

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this degree?"
    );

    if (!confirmed) return;

    try {
      const response = await api.delete(`/Delete-Degree/${id}`);

      if (response.data.success) {
        toast.success(
          response.data.message || "Degree deleted successfully"
        );

        await fetchDegrees();
      } else {
        toast.error(response.data.message || "Failed to delete degree");
      }
    } catch (error) {
      console.error("Delete Degree Error:", error);

      toast.error(
        error.response?.data?.message || "Failed to delete degree"
      );
    }
  };

  // ================= SEARCH, FILTER & SORT =================

  const filteredDegrees = useMemo(() => {
    let result = [...degrees];

    const keyword = search.trim().toLowerCase();

    if (keyword) {
      result = result.filter((degree) =>
        [degree.name, degree.shortName, degree.slug, degree.code].some(
          (value) =>
            String(value || "")
              .toLowerCase()
              .includes(keyword)
        )
      );
    }

    if (levelFilter) {
      result = result.filter((degree) => degree.level === levelFilter);
    }

    if (typeFilter) {
      result = result.filter(
        (degree) => degree.degreeType === typeFilter
      );
    }

    if (statusFilter) {
      result = result.filter(
        (degree) => degree.status === statusFilter
      );
    }

    result.sort((a, b) => {
      const first = a[sortBy] ?? "";
      const second = b[sortBy] ?? "";

      let comparison;

      if (
        typeof first === "number" &&
        typeof second === "number"
      ) {
        comparison = first - second;
      } else {
        comparison = String(first).localeCompare(
          String(second),
          undefined,
          {
            numeric: true,
            sensitivity: "base",
          }
        );
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [
    degrees,
    search,
    levelFilter,
    typeFilter,
    statusFilter,
    sortBy,
    sortOrder,
  ]);

  // ================= PAGINATION =================

  const totalPages = Math.max(
    1,
    Math.ceil(filteredDegrees.length / limit)
  );

  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * limit;

  const paginatedDegrees = filteredDegrees.slice(
    startIndex,
    startIndex + limit
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    levelFilter,
    typeFilter,
    statusFilter,
    sortBy,
    sortOrder,
    limit,
  ]);

  // ================= UI =================

  return (
    <div className="ml-64 min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-8">
      {/* HEADER */}

      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">
            Degree Management
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage degrees, duration, type and status.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddForm}
          className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          + Add New Degree
        </button>
      </div>

      {/* STATISTICS */}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Degrees</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-800">
            {degrees.length}
          </h2>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Active Degrees</p>
          <h2 className="mt-2 text-3xl font-bold text-green-600">
            {degrees.filter((degree) => degree.status === "active").length}
          </h2>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Inactive Degrees</p>
          <h2 className="mt-2 text-3xl font-bold text-red-500">
            {degrees.filter((degree) => degree.status === "inactive").length}
          </h2>
        </div>
      </div>

      {/* SEARCH AND FILTERS */}

      <div className="mb-6 rounded-xl bg-white p-4 shadow-sm sm:p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, short name, slug or code..."
            className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-blue-500"
          >
            <option value="">All Levels</option>
            <option value="certificate">Certificate</option>
            <option value="diploma">Diploma</option>
            <option value="undergraduate">Undergraduate</option>
            <option value="postgraduate">Postgraduate</option>
            <option value="doctoral">Doctoral</option>
            <option value="postdoctoral">Postdoctoral</option>
            <option value="other">Other</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-blue-500"
          >
            <option value="">All Degree Types</option>
            <option value="academic">Academic</option>
            <option value="professional">Professional</option>
            <option value="vocational">Vocational</option>
            <option value="research">Research</option>
            <option value="other">Other</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-blue-500"
          >
            <option value="displayOrder">Display Order</option>
            <option value="name">Name</option>
            <option value="shortName">Short Name</option>
            <option value="createdAt">Created Date</option>
          </select>

          <div className="flex gap-2">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-blue-500"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setLevelFilter("");
                setTypeFilter("");
                setStatusFilter("");
                setSortBy("displayOrder");
                setSortOrder("asc");
                setCurrentPage(1);
              }}
              className="rounded-lg border border-slate-300 px-4 py-3 font-medium text-slate-600 hover:bg-slate-100"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* DEGREE TABLE */}

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center">
          <h2 className="text-lg font-bold text-slate-800">
            All Degrees
          </h2>

          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>Rows:</span>

            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="rounded-md border border-slate-300 px-2 py-1.5"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>

            <button
              type="button"
              onClick={fetchDegrees}
              disabled={loading}
              className="rounded-lg border border-slate-300 px-3 py-2 font-medium hover:bg-slate-100 disabled:opacity-50"
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">
            Loading degrees...
          </div>
        ) : paginatedDegrees.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-lg font-semibold text-slate-700">
              No degrees found
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Add a degree or change your search and filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-4">#</th>
                  <th className="px-5 py-4">Degree</th>
                  <th className="px-5 py-4">Code / Slug</th>
                  <th className="px-5 py-4">Level</th>
                  <th className="px-5 py-4">Type</th>
                  <th className="px-5 py-4">Duration</th>
                  <th className="px-5 py-4">Streams</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {paginatedDegrees.map((degree, index) => (
                  <tr
                    key={degree._id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4 text-slate-500">
                      {startIndex + index + 1}
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800">
                        {degree.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {degree.shortName}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-700">
                        {degree.code || "—"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {degree.slug}
                      </p>
                    </td>

                    <td className="px-5 py-4 capitalize text-slate-600">
                      {degree.level || "—"}
                    </td>

                    <td className="px-5 py-4 capitalize text-slate-600">
                      {degree.degreeType || "—"}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {degree.defaultDuration?.value ?? "—"}{" "}
                      {degree.defaultDuration?.unit || ""}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {Array.isArray(degree.streams)
                        ? degree.streams.length
                        : 0}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          degree.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {degree.status || "inactive"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditForm(degree)}
                          className="rounded-md bg-amber-100 px-3 py-2 font-medium text-amber-700 hover:bg-amber-200"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(degree._id)}
                          className="rounded-md bg-red-100 px-3 py-2 font-medium text-red-700 hover:bg-red-200"
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

        <div className="flex flex-col justify-between gap-3 border-t border-slate-200 p-4 sm:flex-row sm:items-center">
          <p className="text-sm text-slate-500">
            Showing {filteredDegrees.length === 0 ? 0 : startIndex + 1}
            {" - "}
            {Math.min(startIndex + limit, filteredDegrees.length)} of{" "}
            {filteredDegrees.length} degrees
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() =>
                setCurrentPage((page) => Math.max(1, page - 1))
              }
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <span className="rounded-lg bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
              {safePage} / {totalPages}
            </span>

            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() =>
                setCurrentPage((page) =>
                  Math.min(totalPages, page + 1)
                )
              }
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ADD / EDIT MODAL */}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
          <div className="my-auto w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-7">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  {editingId ? "Edit Degree" : "Add New Degree"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Enter the degree information below.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg px-3 py-2 text-xl text-slate-500 hover:bg-slate-100"
                aria-label="Close form"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-7">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Degree Name *
                  </label>

                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="Bachelor of Technology"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Short Name *
                  </label>

                  <input
                    name="shortName"
                    value={form.shortName}
                    onChange={handleChange}
                    required
                    placeholder="B.Tech"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Slug *
                  </label>

                  <input
                    name="slug"
                    value={form.slug}
                    onChange={handleChange}
                    required
                    placeholder="bachelor-of-technology"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Code
                  </label>

                  <input
                    name="code"
                    value={form.code}
                    onChange={handleChange}
                    placeholder="BTECH"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Degree Level *
                  </label>

                  <select
                    name="level"
                    value={form.level}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                  >
                    <option value="certificate">Certificate</option>
                    <option value="diploma">Diploma</option>
                    <option value="undergraduate">Undergraduate</option>
                    <option value="postgraduate">Postgraduate</option>
                    <option value="doctoral">Doctoral</option>
                    <option value="postdoctoral">Postdoctoral</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Degree Type
                  </label>

                  <select
                    name="degreeType"
                    value={form.degreeType}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                  >
                    <option value="academic">Academic</option>
                    <option value="professional">Professional</option>
                    <option value="vocational">Vocational</option>
                    <option value="research">Research</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Duration
                  </label>

                  <div className="flex gap-2">
                    <input
                      type="number"
                      name="durationValue"
                      min="1"
                      value={form.defaultDuration.value}
                      onChange={handleChange}
                      className="w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                    />

                    <select
                      name="durationUnit"
                      value={form.defaultDuration.unit}
                      onChange={handleChange}
                      className="rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                    >
                      <option value="months">Months</option>
                      <option value="years">Years</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Display Order
                  </label>

                  <input
                    type="number"
                    name="displayOrder"
                    min="0"
                    value={form.displayOrder}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Status
                  </label>

                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Streams
                  </label>

                  <select
                    value=""
                    onChange={(e) => {
                      const streamId = e.target.value;

                      if (
                        streamId &&
                        !form.streams.includes(streamId)
                      ) {
                        setForm((prev) => ({
                          ...prev,
                          streams: [...prev.streams, streamId],
                        }));
                      }
                    }}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                  >
                    <option value="">Select a Stream</option>

                    {streams.map((stream) => (
                      <option key={stream._id} value={stream._id}>
                        {stream.name}
                      </option>
                    ))}
                  </select>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {form.streams.map((streamId) => {
                      const stream = streams.find(
                        (item) => item._id === streamId
                      );

                      return (
                        <span
                          key={streamId}
                          className="flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700"
                        >
                          {stream?.name || streamId}

                          <button
                            type="button"
                            onClick={() =>
                              setForm((prev) => ({
                                ...prev,
                                streams: prev.streams.filter(
                                  (id) => id !== streamId
                                ),
                              }))
                            }
                            className="font-bold"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    Select one or more Streams for this Degree.
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Enter degree description..."
                    className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-lg border border-slate-300 px-5 py-2.5 font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update Degree"
                      : "Create Degree"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Degree;
