import React, { useCallback, useEffect, useState } from "react";
import api from "./Api/axios";
import {
  Eye,
  Pencil,
  Trash2,
  Plus,
  X,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
} from "lucide-react";

const initialForm = {
  name: "",
  slug: "",
  code: "",
  description: "",
  icon: "",
  image: "",
  logo: "",
  streamType: "government",
  parentStream: "",
  displayOrder: 0,
  status: "active",
  isVerified: false,
  createdBy: "",
};

const Stream = () => {
  const [streams, setStreams] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [viewStream, setViewStream] = useState(null);
  const [editStream, setEditStream] = useState(null);

  const [form, setForm] = useState(initialForm);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [order, setOrder] = useState("desc");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // ================= FETCH STREAMS =================
  const fetchStreams = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/Search-Streams", {
        params: {
          search,
          status,
          page: currentPage,
          limit: 10,
          sortBy,
          order,
        },
      });

      const data = res.data;

      setStreams(
        data.streams ||
          data.data?.streams ||
          data.data ||
          []
      );

      setTotalPages(
        Number(data.totalPages || data.pagination?.totalPages || 1)
      );

      setSelectedIds([]);
    } catch (err) {
      console.error("Fetch Streams Error:", err);

      setError(
        err.response?.data?.message ||
          "Streams fetch nahi ho paaye."
      );

      setStreams([]);
    } finally {
      setLoading(false);
    }
  }, [search, status, currentPage, sortBy, order]);

  useEffect(() => {
    fetchStreams();
  }, [fetchStreams]);

  // ================= FORM INPUT =================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ================= OPEN ADD FORM =================
  const openAddForm = () => {
    setEditStream(null);
    setForm(initialForm);
    setError("");
    setShowForm(true);
  };

  // ================= OPEN EDIT FORM =================
  const openEditForm = (stream) => {
    setEditStream(stream);

    setForm({
      ...initialForm,
      ...stream,
      parentStream:
        typeof stream.parentStream === "object"
          ? stream.parentStream?._id || ""
          : stream.parentStream || "",
      displayOrder: stream.displayOrder ?? 0,
      isVerified: stream.isVerified ?? false,
    });

    setError("");
    setShowForm(true);
  };

  // ================= ADD / EDIT STREAM =================
  const submitStream = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      setError("Stream name required hai.");
      return;
    }

    if (!form.slug.trim()) {
      setError("Stream slug required hai.");
      return;
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug.trim())) {
      setError(
        "Slug mein sirf lowercase letters, numbers aur hyphens use karo."
      );
      return;
    }

    if (!form.code.trim()) {
      setError("Stream code required hai.");
      return;
    }

    if (Number(form.displayOrder) < 0) {
      setError("Display order negative nahi ho sakta.");
      return;
    }

    const payload = {
      ...form,
      name: form.name.trim(),
      slug: form.slug.trim(),
      code: form.code.trim(),
      displayOrder: Number(form.displayOrder),
    };

    if (!payload.parentStream) {
      delete payload.parentStream;
    }

    try {
      setSaving(true);
      setError("");

      if (editStream) {
        await api.put("/Edit-Stream", {
          ...payload,
          id: editStream._id,
        });

        alert("Stream updated successfully!");
      } else {
        await api.post("/Add-New-Stream", payload);

        alert("Stream added successfully!");
      }

      setShowForm(false);
      setEditStream(null);
      setForm(initialForm);

      await fetchStreams();
    } catch (err) {
      console.error("Save Stream Error:", err);

      setError(
        err.response?.data?.message ||
          "Stream save nahi ho paayi."
      );
    } finally {
      setSaving(false);
    }
  };

  // ================= DELETE SINGLE STREAM =================
  const deleteStream = async (id) => {
    if (!window.confirm("Kya tum ye stream delete karna chahte ho?")) {
      return;
    }

    try {
      await api.delete("/Delete-Stream", {
        data: { id },
      });

      alert("Stream deleted successfully!");

      await fetchStreams();
    } catch (err) {
      console.error("Delete Stream Error:", err);

      alert(
        err.response?.data?.message ||
          "Stream delete nahi ho paayi."
      );
    }
  };

  // ================= SELECT SINGLE STREAM =================
  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  // ================= SELECT ALL STREAMS =================
  const toggleSelectAll = () => {
    const pageIds = streams.map((stream) => stream._id);
    const allSelected =
      pageIds.length > 0 &&
      pageIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds((prev) =>
        prev.filter((id) => !pageIds.includes(id))
      );
    } else {
      setSelectedIds((prev) => [
        ...new Set([...prev, ...pageIds]),
      ]);
    }
  };

  // ================= BULK DELETE =================
  const bulkDelete = async () => {
    if (!selectedIds.length) {
      alert("Pehle streams select karo.");
      return;
    }

    if (
      !window.confirm(
        `${selectedIds.length} selected streams delete karni hain?`
      )
    ) {
      return;
    }

    try {
      setBulkDeleting(true);

      const results = await Promise.allSettled(
        selectedIds.map((id) =>
          api.delete("/Delete-Stream", {
            data: { id },
          })
        )
      );

      const failed = results.filter(
        (result) => result.status === "rejected"
      );

      if (failed.length) {
        alert(
          `${results.length - failed.length} streams delete hui. ${failed.length} delete nahi hui.`
        );
      } else {
        alert("Selected streams deleted successfully!");
      }

      setSelectedIds([]);
      await fetchStreams();
    } catch (err) {
      console.error("Bulk Delete Error:", err);
      alert("Bulk delete operation fail ho gaya.");
    } finally {
      setBulkDeleting(false);
    }
  };

  // ================= RESET FILTERS =================
  const resetFilters = () => {
    setSearch("");
    setStatus("");
    setSortBy("createdAt");
    setOrder("desc");
    setCurrentPage(1);
  };

  const pageIds = streams.map((stream) => stream._id);
  const allSelected =
    pageIds.length > 0 &&
    pageIds.every((id) => selectedIds.includes(id));

  return (
    <div className="ml-64 min-h-screen bg-slate-100 p-4 md:p-6">
      {/* HEADER */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Stream Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage university streams here.
          </p>
        </div>

        <button
          onClick={openAddForm}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white hover:bg-blue-700"
        >
          <Plus size={18} />
          Add New Stream
        </button>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="mb-5 rounded-xl bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-3 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search streams..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
          >
            <option value="createdAt">Created Date</option>
            <option value="name">Name</option>
            <option value="displayOrder">Display Order</option>
          </select>

          <select
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>

          <button
            onClick={resetFilters}
            className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2.5 text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw size={16} />
            Reset Filters
          </button>
        </div>
      </div>

      {/* BULK ACTIONS */}
      {selectedIds.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
          <span className="text-sm font-medium text-blue-800">
            {selectedIds.length} stream(s) selected
          </span>

          <button
            onClick={bulkDelete}
            disabled={bulkDeleting}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
          >
            <Trash2 size={16} />
            {bulkDeleting ? "Deleting..." : "Delete Selected"}
          </button>
        </div>
      )}

      {/* ERROR */}
      {error && !showForm && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
          <button
            onClick={() => setError("")}
            className="ml-3 font-semibold underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* STREAM TABLE */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-slate-50 text-sm text-slate-600">
              <tr>
                <th className="px-4 py-4">
                  <button onClick={toggleSelectAll}>
                    {allSelected ? (
                      <CheckSquare size={19} />
                    ) : (
                      <Square size={19} />
                    )}
                  </button>
                </th>
                <th className="px-4 py-4">#</th>
                <th className="px-4 py-4">Stream</th>
                <th className="px-4 py-4">Code</th>
                <th className="px-4 py-4">Type</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Order</th>
                <th className="px-4 py-4 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan="8"
                    className="px-4 py-12 text-center text-slate-500"
                  >
                    Loading streams...
                  </td>
                </tr>
              ) : streams.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="px-4 py-12 text-center text-slate-500"
                  >
                    No streams found.
                  </td>
                </tr>
              ) : (
                streams.map((stream, index) => (
                  <tr
                    key={stream._id}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-4 py-4">
                      <button
                        onClick={() => toggleSelect(stream._id)}
                      >
                        {selectedIds.includes(stream._id) ? (
                          <CheckSquare
                            size={18}
                            className="text-blue-600"
                          />
                        ) : (
                          <Square
                            size={18}
                            className="text-slate-400"
                          />
                        )}
                      </button>
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-500">
                      {(currentPage - 1) * 10 + index + 1}
                    </td>

                    <td className="px-4 py-4">
                      <div className="font-medium text-slate-800">
                        {stream.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {stream.slug}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-600">
                      {stream.code || "-"}
                    </td>

                    <td className="px-4 py-4 text-sm capitalize text-slate-600">
                      {stream.streamType || "-"}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          stream.status === "active"
                            ? "bg-green-100 text-green-700"
                            : stream.status === "inactive"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {stream.status || "pending"}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-600">
                      {stream.displayOrder ?? 0}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          title="View"
                          onClick={() => setViewStream(stream)}
                          className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                        >
                          <Eye size={18} />
                        </button>

                        <button
                          title="Edit"
                          onClick={() => openEditForm(stream)}
                          className="rounded-lg p-2 text-amber-600 hover:bg-amber-50"
                        >
                          <Pencil size={18} />
                        </button>

                        <button
                          title="Delete"
                          onClick={() => deleteStream(stream._id)}
                          className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row">
          <p className="text-sm text-slate-500">
            Page {currentPage} of {totalPages}
          </p>

          <div className="flex items-center gap-2">
            <button
              disabled={currentPage <= 1 || loading}
              onClick={() =>
                setCurrentPage((page) => Math.max(1, page - 1))
              }
              className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            <button
              disabled={currentPage >= totalPages || loading}
              onClick={() =>
                setCurrentPage((page) =>
                  Math.min(totalPages, page + 1)
                )
              }
              className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-6 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b bg-white px-5 py-4">
              <h2 className="text-xl font-semibold text-slate-800">
                {editStream ? "Edit Stream" : "Add New Stream"}
              </h2>

              <button
                onClick={() => {
                  setShowForm(false);
                  setError("");
                }}
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={submitStream} className="p-5">
              {error && (
                <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Stream Name *
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                    placeholder="Enter stream name"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Slug *
                  </label>
                  <input
                    name="slug"
                    value={form.slug}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                    placeholder="computer-science"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Stream Code *
                  </label>
                  <input
                    name="code"
                    value={form.code}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                    placeholder="CS"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Stream Type
                  </label>
                  <select
                    name="streamType"
                    value={form.streamType}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                  >
                    <option value="government">Government</option>
                    <option value="private">Private</option>
                    <option value="deemed">Deemed</option>
                    <option value="autonomous">Autonomous</option>
                    <option value="public">Public</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Icon
                  </label>
                  <input
                    name="icon"
                    value={form.icon}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                    placeholder="Icon name or URL"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Image URL
                  </label>
                  <input
                    name="image"
                    value={form.image}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                    placeholder="Enter image URL"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Logo URL
                  </label>
                  <input
                    name="logo"
                    value={form.logo}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                    placeholder="Enter logo URL"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Parent Stream ID
                  </label>
                  <input
                    name="parentStream"
                    value={form.parentStream}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                    placeholder="Optional parent stream ID"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="0"
                    name="displayOrder"
                    value={form.displayOrder}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Status
                  </label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows="3"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                    placeholder="Enter stream description"
                  />
                </div>

                <div className="flex items-center gap-2 md:col-span-2">
                  <input
                    type="checkbox"
                    id="isVerified"
                    name="isVerified"
                    checked={Boolean(form.isVerified)}
                    onChange={handleChange}
                    className="h-4 w-4"
                  />
                  <label htmlFor="isVerified" className="text-sm">
                    Mark as verified
                  </label>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setError("");
                  }}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editStream
                    ? "Update Stream"
                    : "Add Stream"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {viewStream && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-6 max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-xl font-semibold text-slate-800">
                Stream Details
              </h2>

              <button
                onClick={() => setViewStream(null)}
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              {[
                ["Name", viewStream.name],
                ["Slug", viewStream.slug],
                ["Code", viewStream.code],
                ["Description", viewStream.description],
                ["Type", viewStream.streamType],
                ["Status", viewStream.status],
                ["Display Order", viewStream.displayOrder],
                ["Parent Stream", viewStream.parentStream?.name || viewStream.parentStream],
                ["Verified", viewStream.isVerified ? "Yes" : "No"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="grid grid-cols-3 gap-3 border-b border-slate-100 pb-3"
                >
                  <span className="text-sm font-medium text-slate-500">
                    {label}
                  </span>
                  <span className="col-span-2 break-words text-sm text-slate-800">
                    {value ?? "-"}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-end border-t p-4">
              <button
                onClick={() => setViewStream(null)}
                className="rounded-lg bg-slate-800 px-4 py-2 text-white hover:bg-slate-900"
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

export default Stream;
