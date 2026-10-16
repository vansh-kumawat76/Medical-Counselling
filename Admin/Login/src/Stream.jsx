
import React, { useCallback, useEffect, useState } from "react";
import api from "./Api/axios";
import {
  Eye,
  Pencil,
  Trash2,
  Plus,
  Search,
  X,
  RefreshCw,
  Check,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/* ============================================================
   DESIGN SYSTEM
   ============================================================ */

const ui = {
  page: "min-h-screen bg-slate-50 p-6 lg:p-8",
  container: "mx-auto w-full max-w-6xl",
  title: "text-2xl font-bold tracking-tight text-slate-900",
  subtitle: "mt-1 text-sm text-slate-500",
  card: "rounded-2xl bg-white shadow-sm ring-1 ring-slate-200",
  input:
    "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100",
  select:
    "rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100",
  label: "mb-1.5 block text-sm font-medium text-slate-700",
  btnPrimary:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50",
  btnSecondary:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50",
  btnDanger:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50",
  iconBtnView:
    "rounded-lg p-2 text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-600",
  iconBtnEdit:
    "rounded-lg p-2 text-slate-500 transition hover:bg-amber-50 hover:text-amber-600",
  iconBtnDelete:
    "rounded-lg p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600",
  badge:
    "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
};

const badgeColor = {
  active: "bg-emerald-50 text-emerald-700",
  inactive: "bg-rose-50 text-rose-700",
  pending: "bg-amber-50 text-amber-700",
  role: "bg-sky-50 text-sky-700",
  default: "bg-slate-100 text-slate-600",
};

/* ============================================================
   REUSABLE COMPONENTS
   ============================================================ */

const Modal = ({ open, title, onClose, children, size = "md" }) => {
  useEffect(() => {
    if (!open) return;

    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const width = size === "lg" ? "max-w-3xl" : "max-w-md";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`max-h-[90vh] w-full ${width} overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
};

const Field = ({ label, className = "", children }) => (
  <div className={className}>
    <label className={ui.label}>{label}</label>
    {children}
  </div>
);

const DetailRow = ({ label, children }) => (
  <div className="flex items-start justify-between gap-6 py-2.5">
    <span className="shrink-0 text-sm text-slate-500">{label}</span>

    <span className="min-w-0 break-words text-right text-sm font-medium text-slate-900">
      {children || "-"}
    </span>
  </div>
);

const StatusBadge = ({ status }) => (
  <span className={`${ui.badge} ${badgeColor[status] || badgeColor.default}`}>
    {status || "pending"}
  </span>
);

const RowActions = ({ item, onView, onEdit, onDelete }) => (
  <div className="flex items-center justify-end gap-1">
    <button
      type="button"
      title="View"
      onClick={() => onView(item)}
      className={ui.iconBtnView}
    >
      <Eye size={17} />
    </button>

    <button
      type="button"
      title="Edit"
      onClick={() => onEdit(item)}
      className={ui.iconBtnEdit}
    >
      <Pencil size={17} />
    </button>

    <button
      type="button"
      title="Delete"
      onClick={() => onDelete(item)}
      className={ui.iconBtnDelete}
    >
      <Trash2 size={17} />
    </button>
  </div>
);

const getPages = (current, total) => {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = new Set([1, total, current - 1, current, current + 1]);

  const list = [...pages]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);

  const result = [];

  list.forEach((p, i) => {
    if (i > 0 && p - list[i - 1] > 1) {
      result.push("...");
    }

    result.push(p);
  });

  return result;
};

const Pagination = ({ currentPage, totalPages, onChange }) => {
  if (totalPages <= 1) return null;

  const base = "h-9 min-w-9 rounded-lg px-3 text-sm font-medium transition";
  const idle =
    "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50";

  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 py-5">
      <button
        type="button"
        onClick={() => onChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className={`${base} ${idle} disabled:opacity-40`}
      >
        ‹
      </button>

      {getPages(currentPage, totalPages).map((p, i) =>
        p === "..." ? (
          <span key={`dots-${i}`} className="px-1 text-slate-400">
            …
          </span>
        ) : (
          <button
            type="button"
            key={p}
            onClick={() => onChange(p)}
            className={`${base} ${
              p === currentPage
                ? "bg-indigo-600 text-white shadow-sm"
                : idle
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className={`${base} ${idle} disabled:opacity-40`}
      >
        ›
      </button>
    </div>
  );
};

const ResultModal = ({ result, onClose }) => {
  if (!result) return null;

  const ok = result.type === "success";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
        <div
          className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
            ok
              ? "bg-emerald-50 text-emerald-600"
              : "bg-rose-50 text-rose-600"
          }`}
        >
          {ok ? <Check size={28} /> : <X size={28} />}
        </div>

        <h2 className="mb-1 text-lg font-bold text-slate-900">
          {ok ? "Success!" : "Something went wrong"}
        </h2>

        <p className="mb-6 break-words text-sm text-slate-500">
          {result.message}
        </p>

        <button
          type="button"
          onClick={onClose}
          className={`w-full ${ok ? ui.btnPrimary : ui.btnDanger}`}
        >
          Okay
        </button>
      </div>
    </div>
  );
};

/* ============================================================
   CONSTANTS
   ============================================================ */

const LIMIT = 10;

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

/* ============================================================
   MAIN PAGE
   ============================================================ */

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

  const [confirmModal, setConfirmModal] = useState({
    open: false,
    type: "",
    ids: [],
  });

  const [result, setResult] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const showResult = (message, type = "success") => {
    setResult({ type, message });

    if (type === "success") {
      toast.success(message);
    } else {
      toast.error(message);
    }
  };

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
          limit: LIMIT,
          sortBy,
          order,
        },
      });

      const data = res.data;

      const streamData =
        data.streams ??
        data.data?.streams ??
        (Array.isArray(data.data) ? data.data : []);

      setStreams(Array.isArray(streamData) ? streamData : []);

      setTotalPages(
        Math.max(
          1,
          Number(
            data.totalPages ??
              data.pagination?.totalPages ??
              data.data?.totalPages ??
              1
          )
        )
      );

      setSelectedIds([]);
    } catch (err) {
      console.error("Fetch Streams Error:", err);

      setError(
        err.response?.data?.message || "Streams fetch nahi ho paaye."
      );

      setStreams([]);
    } finally {
      setLoading(false);
    }
  }, [search, status, currentPage, sortBy, order, refreshKey]);

  useEffect(() => {
    fetchStreams();
  }, [fetchStreams]);

  // ================= FORM HANDLERS =================

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (error) {
      setError("");
    }
  };

  const openAddForm = () => {
    setEditStream(null);
    setForm({ ...initialForm });
    setError("");
    setShowForm(true);
  };

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
    setViewStream(null);
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setError("");
  };

  const fail = (message) => {
    setError(message);
    toast.error(message);
  };

  // ================= ADD / EDIT STREAM =================

  const submitStream = async () => {
    if (!form.name.trim()) {
      return fail("Stream name required hai.");
    }

    if (!form.slug.trim()) {
      return fail("Stream slug required hai.");
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug.trim())) {
      return fail(
        "Slug mein sirf lowercase letters, numbers aur hyphens use karo."
      );
    }

    if (!form.code.trim()) {
      return fail("Stream code required hai.");
    }

    if (
      form.displayOrder === "" ||
      !Number.isFinite(Number(form.displayOrder)) ||
      Number(form.displayOrder) < 0
    ) {
      return fail(
        "Display order valid non-negative number hona chahiye."
      );
    }

    const isEditing = Boolean(editStream);

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

      const response = isEditing
        ? await api.put("/Edit-Stream", {
            ...payload,
            id: editStream._id,
          })
        : await api.post("/Add-New-Stream", payload);

      if (response.data?.status === false) {
        throw new Error(
          response.data.message || "Stream save nahi ho paayi."
        );
      }

      const message =
        response.data?.message ||
        (isEditing
          ? "Stream updated successfully!"
          : "Stream added successfully!");

      setShowForm(false);
      setEditStream(null);
      setForm({ ...initialForm });

      showResult(message, "success");

      if (!isEditing) {
        // Add ke baad default view: latest records first
        setSearch("");
        setStatus("");
        setSortBy("createdAt");
        setOrder("desc");
        setCurrentPage(1);
      }

      // Search/sort/page state update ke baad list refresh
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error("Save Stream Error:", err);

      const message =
        err.response?.data?.message ||
        err.message ||
        "Stream save nahi ho paayi.";

      setError(message);
      showResult(message, "error");
    } finally {
      setSaving(false);
    }
  };

  // ================= DELETE =================

  const closeConfirm = () => {
    setConfirmModal({
      open: false,
      type: "",
      ids: [],
    });
  };

  const bulkDelete = () => {
    if (!selectedIds.length) {
      toast.error("Pehle streams select karo.");
      return;
    }

    setConfirmModal({
      open: true,
      type: "bulk",
      ids: [...selectedIds],
    });
  };

  const confirmDelete = async () => {
    const { ids, type } = confirmModal;

    closeConfirm();

    if (!ids.length) return;

    try {
      if (type === "bulk") {
        setBulkDeleting(true);
      }

      if (type === "single") {
        await api.delete("/Delete-Stream", {
          data: { id: ids[0] },
        });

        setSelectedIds((prev) =>
          prev.filter((id) => id !== ids[0])
        );

        showResult("Stream deleted successfully!", "success");
      } else {
        const results = await Promise.allSettled(
          ids.map((id) =>
            api.delete("/Delete-Stream", {
              data: { id },
            })
          )
        );

        const succeeded = results.filter(
          (r) => r.status === "fulfilled"
        ).length;

        const failed = results.length - succeeded;

        setSelectedIds([]);

        if (failed === 0) {
          showResult(
            `${succeeded} selected stream(s) deleted successfully!`,
            "success"
          );
        } else if (succeeded > 0) {
          showResult(
            `${succeeded} stream(s) deleted. ${failed} stream(s) delete nahi hui.`,
            "error"
          );
        } else {
          showResult(
            "Selected streams delete nahi ho paayi.",
            "error"
          );
        }
      }

      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error("Delete Stream Error:", err);

      showResult(
        err.response?.data?.message ||
          "Stream delete nahi ho paayi.",
        "error"
      );
    } finally {
      setBulkDeleting(false);
    }
  };

  // ================= SELECTION =================

  const pageIds = streams.map((s) => s._id);

  const allSelected =
    pageIds.length > 0 &&
    pageIds.every((id) => selectedIds.includes(id));

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((itemId) => itemId !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) =>
      allSelected
        ? prev.filter((id) => !pageIds.includes(id))
        : [...new Set([...prev, ...pageIds])]
    );
  };

  const resetFilters = () => {
    setSearch("");
    setStatus("");
    setSortBy("createdAt");
    setOrder("desc");
    setCurrentPage(1);
  };

  const checkbox =
    "h-4 w-4 rounded border-slate-300 accent-indigo-600";

  // ================= UI =================

  return (
    <div className={ui.page}>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        newestOnTop
        closeOnClick
        pauseOnHover
      />

      <div className={ui.container}>
        {/* HEADER */}

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className={ui.title}>Streams</h1>
            <p className={ui.subtitle}>
              Manage university streams
            </p>
          </div>

          <button
            type="button"
            onClick={openAddForm}
            className={ui.btnPrimary}
          >
            <Plus size={16} />
            Add New Stream
          </button>
        </div>

        {/* FILTERS */}

        <div
          className={`${ui.card} mb-5 grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-12`}
        >
          <div className="relative sm:col-span-2 lg:col-span-4">
            <Search
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              placeholder="Search streams..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className={`${ui.input} pl-10`}
            />
          </div>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setCurrentPage(1);
            }}
            className={`${ui.select} w-full lg:col-span-2`}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setCurrentPage(1);
            }}
            className={`${ui.select} w-full lg:col-span-2`}
          >
            <option value="createdAt">Created Date</option>
            <option value="name">Name</option>
            <option value="displayOrder">Display Order</option>
          </select>

          <select
            value={order}
            onChange={(e) => {
              setOrder(e.target.value);
              setCurrentPage(1);
            }}
            className={`${ui.select} w-full lg:col-span-2`}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>

          <button
            type="button"
            onClick={resetFilters}
            className={`${ui.btnSecondary} !px-3 lg:col-span-2`}
          >
            <RefreshCw size={15} />
            Reset
          </button>
        </div>

        {/* BULK ACTIONS */}

        {selectedIds.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-indigo-50 p-3 ring-1 ring-indigo-100">
            <span className="pl-2 text-sm font-medium text-indigo-800">
              {selectedIds.length} stream(s) selected
            </span>

            <button
              type="button"
              onClick={bulkDelete}
              disabled={bulkDeleting}
              className={ui.btnDanger}
            >
              <Trash2 size={15} />
              {bulkDeleting ? "Deleting..." : "Delete Selected"}
            </button>
          </div>
        )}

        {/* FETCH ERROR */}

        {error && !showForm && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-rose-100">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="font-semibold underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* TABLE / CARDS */}

        {loading ? (
          <div
            className={`${ui.card} py-14 text-center text-sm text-slate-500`}
          >
            Loading streams...
          </div>
        ) : streams.length === 0 ? (
          <div
            className={`${ui.card} py-14 text-center text-sm text-slate-500`}
          >
            No streams found.
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE */}

            <div className={`${ui.card} hidden overflow-hidden md:block`}>
              <table className="w-full table-fixed text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="w-12 px-4 py-3.5 text-left">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        title="Select all on this page"
                        className={checkbox}
                      />
                    </th>

                    <th className="w-12 px-4 py-3.5 text-left font-semibold">
                      #
                    </th>

                    <th className="px-4 py-3.5 text-left font-semibold">
                      Stream
                    </th>

                    <th className="hidden w-[11%] px-4 py-3.5 text-left font-semibold lg:table-cell">
                      Code
                    </th>

                    <th className="hidden w-[13%] px-4 py-3.5 text-left font-semibold lg:table-cell">
                      Type
                    </th>

                    <th className="w-[13%] px-4 py-3.5 text-left font-semibold">
                      Status
                    </th>

                    <th className="hidden w-[9%] px-4 py-3.5 text-left font-semibold xl:table-cell">
                      Order
                    </th>

                    <th className="w-32 px-4 py-3.5 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {streams.map((s, i) => (
                    <tr
                      key={s._id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-4 py-3.5">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(s._id)}
                          onChange={() => toggleSelect(s._id)}
                          className={checkbox}
                        />
                      </td>

                      <td className="px-4 py-3.5 text-slate-400">
                        {(currentPage - 1) * LIMIT + i + 1}
                      </td>

                      <td className="px-4 py-3.5">
                        <p
                          className="truncate font-semibold text-slate-900"
                          title={s.name}
                        >
                          {s.name}
                        </p>

                        <p className="truncate text-xs text-slate-500">
                          {s.slug}
                        </p>
                      </td>

                      <td className="hidden truncate px-4 py-3.5 text-slate-600 lg:table-cell">
                        {s.code || "-"}
                      </td>

                      <td className="hidden px-4 py-3.5 lg:table-cell">
                        <span
                          className={`${ui.badge} ${badgeColor.role}`}
                        >
                          {s.streamType || "-"}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <StatusBadge status={s.status} />
                      </td>

                      <td className="hidden px-4 py-3.5 text-slate-600 xl:table-cell">
                        {s.displayOrder ?? 0}
                      </td>

                      <td className="px-4 py-3.5">
                        <RowActions
                          item={s}
                          onView={setViewStream}
                          onEdit={openEditForm}
                          onDelete={(item) =>
                            setConfirmModal({
                              open: true,
                              type: "single",
                              ids: [item._id],
                            })
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARDS */}

            <div className="space-y-3 md:hidden">
              {streams.map((s) => (
                <div key={s._id} className={`${ui.card} p-4`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(s._id)}
                      onChange={() => toggleSelect(s._id)}
                      className={`${checkbox} mt-1`}
                    />

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">
                        {s.name}
                      </p>

                      <p className="truncate text-sm text-slate-500">
                        {s.slug}
                        {s.code ? ` • ${s.code}` : ""}
                      </p>
                    </div>

                    <StatusBadge status={s.status} />
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                    <span
                      className={`${ui.badge} ${badgeColor.role}`}
                    >
                      {s.streamType || "-"}
                    </span>

                    <RowActions
                      item={s}
                      onView={setViewStream}
                      onEdit={openEditForm}
                      onDelete={(item) =>
                        setConfirmModal({
                          open: true,
                          type: "single",
                          ids: [item._id],
                        })
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onChange={(page) => {
            if (page >= 1 && page <= totalPages) {
              setCurrentPage(page);
            }
          }}
        />
      </div>

      {/* ADD / EDIT MODAL */}

      <Modal
        open={showForm}
        size="lg"
        title={editStream ? "Edit Stream" : "Add New Stream"}
        onClose={closeForm}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitStream();
          }}
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          {error && (
            <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-rose-100 md:col-span-2">
              {error}
            </div>
          )}

          <Field label="Stream Name *">
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="Enter stream name"
              className={ui.input}
            />
          </Field>

          <Field label="Slug *">
            <input
              name="slug"
              value={form.slug}
              onChange={handleChange}
              required
              placeholder="computer-science"
              className={ui.input}
            />
          </Field>

          <Field label="Stream Code *">
            <input
              name="code"
              value={form.code}
              onChange={handleChange}
              required
              placeholder="CS"
              className={ui.input}
            />
          </Field>

          <Field label="Stream Type">
            <select
              name="streamType"
              value={form.streamType}
              onChange={handleChange}
              className={`${ui.select} w-full`}
            >
              <option value="government">Government</option>
              <option value="private">Private</option>
              <option value="deemed">Deemed</option>
              <option value="autonomous">Autonomous</option>
              <option value="public">Public</option>
            </select>
          </Field>

          <Field label="Icon">
            <input
              name="icon"
              value={form.icon}
              onChange={handleChange}
              placeholder="Icon name or URL"
              className={ui.input}
            />
          </Field>

          <Field label="Image URL">
            <input
              name="image"
              value={form.image}
              onChange={handleChange}
              placeholder="Enter image URL"
              className={ui.input}
            />
          </Field>

          <Field label="Logo URL">
            <input
              name="logo"
              value={form.logo}
              onChange={handleChange}
              placeholder="Enter logo URL"
              className={ui.input}
            />
          </Field>

          <Field label="Parent Stream ID">
            <input
              name="parentStream"
              value={form.parentStream}
              onChange={handleChange}
              placeholder="Optional parent stream ID"
              className={ui.input}
            />
          </Field>

          <Field label="Display Order">
            <input
              type="number"
              min="0"
              name="displayOrder"
              value={form.displayOrder}
              onChange={handleChange}
              className={ui.input}
            />
          </Field>

          <Field label="Status">
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className={`${ui.select} w-full`}
            >
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>

          <Field label="Description" className="md:col-span-2">
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows="3"
              placeholder="Enter stream description"
              className={ui.input}
            />
          </Field>

          <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-slate-700 md:col-span-2">
            <input
              type="checkbox"
              name="isVerified"
              checked={Boolean(form.isVerified)}
              onChange={handleChange}
              className={checkbox}
            />
            Mark as verified
          </label>

          <div className="flex gap-3 pt-2 md:col-span-2">
            <button
              type="button"
              onClick={closeForm}
              disabled={saving}
              className={`${ui.btnSecondary} flex-1`}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className={`${ui.btnPrimary} flex-1`}
            >
              {saving
                ? "Saving..."
                : editStream
                ? "Update Stream"
                : "Add Stream"}
            </button>
          </div>
        </form>
      </Modal>

      {/* VIEW MODAL */}

      <Modal
        open={!!viewStream}
        title="Stream Details"
        onClose={() => setViewStream(null)}
      >
        {viewStream && (
          <>
            <div className="divide-y divide-slate-100 rounded-xl bg-slate-50 px-4">
              <DetailRow label="Name">{viewStream.name}</DetailRow>
              <DetailRow label="Slug">{viewStream.slug}</DetailRow>
              <DetailRow label="Code">{viewStream.code}</DetailRow>

              <DetailRow label="Type">
                <span className="capitalize">
                  {viewStream.streamType}
                </span>
              </DetailRow>

              <DetailRow label="Status">
                <StatusBadge status={viewStream.status} />
              </DetailRow>

              <DetailRow label="Display Order">
                {viewStream.displayOrder ?? 0}
              </DetailRow>

              <DetailRow label="Parent Stream">
                {typeof viewStream.parentStream === "object"
                  ? viewStream.parentStream?.name
                  : viewStream.parentStream}
              </DetailRow>

              <DetailRow label="Verified">
                {viewStream.isVerified ? "Yes" : "No"}
              </DetailRow>

              <DetailRow label="Description">
                {viewStream.description}
              </DetailRow>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setViewStream(null)}
                className={`${ui.btnSecondary} flex-1`}
              >
                Close
              </button>

            </div>
          </>
        )}
      </Modal>

      {/* DELETE CONFIRMATION */}

      <Modal
        open={confirmModal.open}
        title="Confirm Delete"
        onClose={closeConfirm}
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <Trash2 size={22} />
        </div>

        <p className="mb-6 text-sm text-slate-600">
          {confirmModal.type === "bulk"
            ? `Kya tum ${confirmModal.ids.length} selected streams delete karna chahte ho? Ye action undo nahi kiya ja sakta.`
            : "Kya tum ye stream delete karna chahte ho? Ye action undo nahi kiya ja sakta."}
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={closeConfirm}
            className={`${ui.btnSecondary} flex-1`}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={confirmDelete}
            disabled={bulkDeleting}
            className={`${ui.btnDanger} flex-1`}
          >
            {bulkDeleting ? "Deleting..." : "Yes, Delete"}
          </button>
        </div>
      </Modal>

      {/* RESULT MODAL */}

      <ResultModal
        result={result}
        onClose={() => setResult(null)}
      />
    </div>
  );
};

export default Stream;
