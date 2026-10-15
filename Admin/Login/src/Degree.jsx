import React, { useEffect, useMemo, useState } from "react";
import api from "./Api/axios";
import { toast } from "react-toastify";
import { Eye, Pencil, Trash2, X, Plus, Search, RefreshCw } from "lucide-react";

/* ============================================================
   DESIGN SYSTEM — Students wala hi same (sab pages me yehi rakhna)
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
  iconBtnView: "rounded-lg p-2 text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-600",
  iconBtnEdit: "rounded-lg p-2 text-slate-500 transition hover:bg-amber-50 hover:text-amber-600",
  iconBtnDelete: "rounded-lg p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600",
  badge: "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
};

const badgeColor = {
  active: "bg-emerald-50 text-emerald-700",
  inactive: "bg-rose-50 text-rose-700",
  pending: "bg-amber-50 text-amber-700",
  role: "bg-sky-50 text-sky-700",
  default: "bg-slate-100 text-slate-600",
};

/* ============================================================
   REUSABLE PIECES
   ============================================================ */

const Modal = ({ open, title, onClose, children, size = "md" }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
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
    {status || "inactive"}
  </span>
);

const StatCard = ({ label, value, color = "text-slate-900" }) => (
  <div className={`${ui.card} p-5`}>
    <p className="text-sm text-slate-500">{label}</p>
    <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
  </div>
);

const RowActions = ({ item, onView, onEdit, onDelete }) => (
  <div className="flex items-center justify-end gap-1">
    <button type="button" title="View" onClick={() => onView(item)} className={ui.iconBtnView}>
      <Eye size={17} />
    </button>
    <button type="button" title="Edit" onClick={() => onEdit(item)} className={ui.iconBtnEdit}>
      <Pencil size={17} />
    </button>
    <button type="button" title="Delete" onClick={() => onDelete(item)} className={ui.iconBtnDelete}>
      <Trash2 size={17} />
    </button>
  </div>
);

const getPages = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, total, current - 1, current, current + 1]);
  const list = [...set].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  list.forEach((p, i) => {
    if (i > 0 && p - list[i - 1] > 1) out.push("...");
    out.push(p);
  });
  return out;
};

const Pagination = ({ currentPage, totalPages, onChange }) => {
  if (totalPages <= 1) return null;
  const base = "h-9 min-w-9 rounded-lg px-3 text-sm font-medium transition";
  const idle = "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50";

  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 py-5">
      <button type="button" onClick={() => onChange(currentPage - 1)}
        disabled={currentPage <= 1} className={`${base} ${idle} disabled:opacity-40`}>
        ‹
      </button>
      {getPages(currentPage, totalPages).map((p, i) =>
        p === "..." ? (
          <span key={`d${i}`} className="px-1 text-slate-400">…</span>
        ) : (
          <button type="button" key={p} onClick={() => onChange(p)}
            className={`${base} ${p === currentPage ? "bg-indigo-600 text-white shadow-sm" : idle}`}>
            {p}
          </button>
        )
      )}
      <button type="button" onClick={() => onChange(currentPage + 1)}
        disabled={currentPage >= totalPages} className={`${base} ${idle} disabled:opacity-40`}>
        ›
      </button>
    </div>
  );
};

/* ============================================================
   CONSTANTS
   ============================================================ */

const LEVELS = ["certificate", "diploma", "undergraduate", "postgraduate", "doctoral", "postdoctoral", "other"];
const DEGREE_TYPES = ["academic", "professional", "vocational", "research", "other"];
const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);

const initialForm = {
  name: "",
  shortName: "",
  slug: "",
  code: "",
  level: "undergraduate",
  degreeType: "academic",
  defaultDuration: { value: 4, unit: "years" },
  description: "",
  streams: [],
  status: "active",
  displayOrder: 1,
};

const freshForm = () => ({
  ...initialForm,
  defaultDuration: { ...initialForm.defaultDuration },
  streams: [],
});

/* ============================================================
   MAIN PAGE
   ============================================================ */

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
  const [limit, setLimit] = useState(10);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(freshForm());

  const [viewDegree, setViewDegree] = useState(null);

  const [deleteDegree, setDeleteDegree] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ================= FETCH =================
  const fetchDegrees = async () => {
    try {
      setLoading(true);
      const response = await api.get("/GetAllDegree");

      if (response.data.success) setDegrees(response.data.data || []);
      else toast.error(response.data.message || "Unable to load degrees.");
    } catch (error) {
      console.error("Fetch Degrees Error:", error);
      toast.error(
        error.response?.data?.message ||
          "Unable to load degrees. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchStreams = async () => {
    try {
      const response = await api.get("/Get-All-Streams");

      if (response.data.status) setStreams(response.data.streams || []);
      else toast.error(response.data.message || "Unable to load streams.");
    } catch (error) {
      console.error("Fetch Streams Error:", error);
      toast.error(error.response?.data?.message || "Unable to load streams. Please try again.");
    }
  };

  useEffect(() => {
    fetchDegrees();
    fetchStreams();
  }, []);

  // ================= FORM =================
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "durationValue") {
      setForm((prev) => ({
        ...prev,
        defaultDuration: { ...prev.defaultDuration, value: value === "" ? "" : Number(value) },
      }));
      return;
    }

    if (name === "durationUnit") {
      setForm((prev) => ({
        ...prev,
        defaultDuration: { ...prev.defaultDuration, unit: value },
      }));
      return;
    }

    if (name === "displayOrder") {
      setForm((prev) => ({ ...prev, displayOrder: value === "" ? "" : Number(value) }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const openAddForm = () => {
    setEditingId(null);
    setForm(freshForm());
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
        ? degree.streams.map((s) => (typeof s === "object" ? s._id : s))
        : [],
      status: degree.status || "active",
      displayOrder: degree.displayOrder ?? 1,
    });
    setViewDegree(null);
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;
    setShowForm(false);
    setEditingId(null);
    setForm(freshForm());
  };

  // ================= CREATE / EDIT =================
  const handleSubmit = async () => {
    if (!form.name.trim() || !form.shortName.trim() || !form.slug.trim() || !form.level) {
      toast.error("Please complete all required fields: Name, Short Name, Slug, and Level.");
      return;
    }

    if (!form.defaultDuration.value || Number(form.defaultDuration.value) < 1) {
      toast.error("Please enter a valid degree duration.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...form,
        name: form.name.trim(),
        shortName: form.shortName.trim(),
        slug: form.slug.trim().toLowerCase(),
        code: form.code.trim() ? form.code.trim().toUpperCase() : undefined,
        defaultDuration: {
          value: Number(form.defaultDuration.value),
          unit: form.defaultDuration.unit,
        },
        displayOrder: Number(form.displayOrder || 0),
        streams: form.streams,
      };

      const response = editingId
        ? await api.put(`/Edit-Degree/${editingId}`, payload)
        : await api.post("/Add-New-Degree", payload);

      if (response.data.success) {
        toast.success(
          response.data.message ||
            (editingId ? "Degree updated successfully." : "Degree created successfully.")
        );
        setShowForm(false);
        setEditingId(null);
        setForm(freshForm());
        await fetchDegrees();
      } else {
        toast.error(response.data.message || "Unable to save the degree. Please try again.");
      }
    } catch (error) {
      console.error("Save Degree Error:", error);
      toast.error(error.response?.data?.message || "Unable to save the degree. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ================= DELETE =================
  const closeDeleteModal = () => {
    if (deleting) return;
    setDeleteDegree(null);
  };

  const confirmDelete = async () => {
    if (!deleteDegree?._id) return;

    try {
      setDeleting(true);
      const response = await api.delete(`/Delete-Degree/${deleteDegree._id}`);

      if (response.data.success) {
        toast.success(response.data.message || "Degree deleted successfully.");
        setDeleteDegree(null);
        await fetchDegrees();
      } else {
        toast.error(response.data.message || "Unable to delete the degree. Please try again.");
      }
    } catch (error) {
      console.error("Delete Degree Error:", error);
      toast.error(error.response?.data?.message || "Unable to delete the degree. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  // ================= SEARCH, FILTER & SORT =================
  const filteredDegrees = useMemo(() => {
    let result = [...degrees];
    const keyword = search.trim().toLowerCase();

    if (keyword) {
      result = result.filter((d) =>
        [d.name, d.shortName, d.slug, d.code].some((v) =>
          String(v || "").toLowerCase().includes(keyword)
        )
      );
    }
    if (levelFilter) result = result.filter((d) => d.level === levelFilter);
    if (typeFilter) result = result.filter((d) => d.degreeType === typeFilter);
    if (statusFilter) result = result.filter((d) => d.status === statusFilter);

    result.sort((a, b) => {
      const first = a[sortBy] ?? "";
      const second = b[sortBy] ?? "";

      const comparison =
        typeof first === "number" && typeof second === "number"
          ? first - second
          : String(first).localeCompare(String(second), undefined, {
              numeric: true,
              sensitivity: "base",
            });

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [degrees, search, levelFilter, typeFilter, statusFilter, sortBy, sortOrder]);

  // ================= PAGINATION =================
  const totalPages = Math.max(1, Math.ceil(filteredDegrees.length / limit));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * limit;
  const paginatedDegrees = filteredDegrees.slice(startIndex, startIndex + limit);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, levelFilter, typeFilter, statusFilter, sortBy, sortOrder, limit]);

  const resetFilters = () => {
    setSearch("");
    setLevelFilter("");
    setTypeFilter("");
    setStatusFilter("");
    setSortBy("displayOrder");
    setSortOrder("asc");
    setCurrentPage(1);
  };

  const durationText = (d) =>
    d.defaultDuration?.value != null
      ? `${d.defaultDuration.value} ${d.defaultDuration.unit || ""}`
      : "-";

  const streamCount = (d) => (Array.isArray(d.streams) ? d.streams.length : 0);

  // ================= UI =================
  return (
    <div className={ui.page}>
      <div className={ui.container}>
        {/* HEADER */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className={ui.title}>Degrees</h1>
            <p className={ui.subtitle}>Manage degrees, duration, type, and status</p>
          </div>
          <button type="button" onClick={openAddForm} className={ui.btnPrimary}>
            <Plus size={16} />
            Add New Degree
          </button>
        </div>

        {/* STATS */}
        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Total Degrees" value={degrees.length} />
          <StatCard label="Active Degrees" color="text-emerald-600"
            value={degrees.filter((d) => d.status === "active").length} />
          <StatCard label="Inactive Degrees" color="text-rose-600"
            value={degrees.filter((d) => d.status === "inactive").length} />
        </div>

        {/* FILTERS */}
        <div className={`${ui.card} mb-5 grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-12`}>
          <div className="relative sm:col-span-2 lg:col-span-4">
            <Search size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, short name, slug or code..."
              className={`${ui.input} pl-10`}
            />
          </div>

          <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}
            className={`${ui.select} w-full lg:col-span-2`}>
            <option value="">All Levels</option>
            {LEVELS.map((l) => <option key={l} value={l}>{cap(l)}</option>)}
          </select>

          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
            className={`${ui.select} w-full lg:col-span-2`}>
            <option value="">All Types</option>
            {DEGREE_TYPES.map((t) => <option key={t} value={t}>{cap(t)}</option>)}
          </select>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className={`${ui.select} w-full lg:col-span-2`}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
            className={`${ui.select} w-full lg:col-span-2`}>
            <option value="displayOrder">Display Order</option>
            <option value="name">Name</option>
            <option value="shortName">Short Name</option>
            <option value="createdAt">Created Date</option>
          </select>

          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}
            className={`${ui.select} w-full lg:col-span-2`}>
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>

          <select value={limit} onChange={(e) => setLimit(Number(e.target.value))}
            className={`${ui.select} w-full lg:col-span-2`}>
            {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n} rows</option>)}
          </select>

          <button type="button" onClick={resetFilters} className={`${ui.btnSecondary} !px-3 lg:col-span-2`}>
            <RefreshCw size={15} />
            Reset
          </button>

          <button type="button" onClick={fetchDegrees} disabled={loading}
            className={`${ui.btnSecondary} !px-3 lg:col-span-2`}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {/* TABLE / CARDS */}
        {loading ? (
          <div className={`${ui.card} py-14 text-center text-sm text-slate-500`}>
            Loading degrees...
          </div>
        ) : paginatedDegrees.length === 0 ? (
          <div className={`${ui.card} py-14 text-center`}>
            <p className="font-semibold text-slate-700">No degrees found</p>
            <p className="mt-1 text-sm text-slate-500">
              Try adjusting your search or filters, or add a new degree.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop: table-fixed + truncate => scrollbar nahi aayega */}
            <div className={`${ui.card} hidden overflow-hidden md:block`}>
              <table className="w-full table-fixed text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="w-12 px-4 py-3.5 text-left font-semibold">#</th>
                    <th className="px-4 py-3.5 text-left font-semibold">Degree</th>
                    <th className="hidden w-[14%] px-4 py-3.5 text-left font-semibold lg:table-cell">Code</th>
                    <th className="w-[14%] px-4 py-3.5 text-left font-semibold">Level</th>
                    <th className="hidden w-[11%] px-4 py-3.5 text-left font-semibold xl:table-cell">Type</th>
                    <th className="hidden w-[10%] px-4 py-3.5 text-left font-semibold lg:table-cell">Duration</th>
                    <th className="hidden w-[9%] px-4 py-3.5 text-left font-semibold xl:table-cell">Streams</th>
                    <th className="w-[11%] px-4 py-3.5 text-left font-semibold">Status</th>
                    <th className="w-32 px-4 py-3.5 text-right font-semibold">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedDegrees.map((d, i) => (
                    <tr key={d._id} className="transition hover:bg-slate-50">
                      <td className="px-4 py-3.5 text-slate-400">{startIndex + i + 1}</td>
                      <td className="px-4 py-3.5">
                        <p className="truncate font-semibold text-slate-900" title={d.name}>{d.name}</p>
                        <p className="truncate text-xs text-slate-500">{d.shortName}</p>
                      </td>
                      <td className="hidden px-4 py-3.5 lg:table-cell">
                        <p className="truncate font-medium text-slate-700">{d.code || "-"}</p>
                        <p className="truncate text-xs text-slate-500">{d.slug}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`${ui.badge} ${badgeColor.role}`}>{d.level || "-"}</span>
                      </td>
                      <td className="hidden px-4 py-3.5 capitalize text-slate-600 xl:table-cell">
                        {d.degreeType || "-"}
                      </td>
                      <td className="hidden px-4 py-3.5 capitalize text-slate-600 lg:table-cell">
                        {durationText(d)}
                      </td>
                      <td className="hidden px-4 py-3.5 text-slate-600 xl:table-cell">{streamCount(d)}</td>
                      <td className="px-4 py-3.5"><StatusBadge status={d.status} /></td>
                      <td className="px-4 py-3.5">
                        <RowActions item={d} onView={setViewDegree} onEdit={openEditForm}
                          onDelete={setDeleteDegree} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: cards */}
            <div className="space-y-3 md:hidden">
              {paginatedDegrees.map((d) => (
                <div key={d._id} className={`${ui.card} p-4`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{d.name}</p>
                      <p className="truncate text-sm text-slate-500">
                        {d.shortName}{d.code ? ` • ${d.code}` : ""}
                      </p>
                      <p className="text-sm capitalize text-slate-500">{durationText(d)}</p>
                    </div>
                    <StatusBadge status={d.status} />
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className={`${ui.badge} ${badgeColor.role}`}>{d.level || "-"}</span>
                    <RowActions item={d} onView={setViewDegree} onEdit={openEditForm}
                      onDelete={setDeleteDegree} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <Pagination currentPage={safePage} totalPages={totalPages} onChange={setCurrentPage} />
      </div>

      {/* ADD / EDIT MODAL */}
      <Modal open={showForm} size="lg" title={editingId ? "Edit Degree" : "Add New Degree"} onClose={closeForm}>
        <form
          onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          <Field label="Degree Name *">
            <input name="name" value={form.name} onChange={handleChange} required
              placeholder="Bachelor of Technology" className={ui.input} />
          </Field>
          <Field label="Short Name *">
            <input name="shortName" value={form.shortName} onChange={handleChange} required
              placeholder="B.Tech" className={ui.input} />
          </Field>
          <Field label="Slug *">
            <input name="slug" value={form.slug} onChange={handleChange} required
              placeholder="bachelor-of-technology" className={ui.input} />
          </Field>
          <Field label="Code">
            <input name="code" value={form.code} onChange={handleChange}
              placeholder="BTECH" className={ui.input} />
          </Field>

          <Field label="Degree Level *">
            <select name="level" value={form.level} onChange={handleChange} required
              className={`${ui.select} w-full`}>
              {LEVELS.map((l) => <option key={l} value={l}>{cap(l)}</option>)}
            </select>
          </Field>
          <Field label="Degree Type">
            <select name="degreeType" value={form.degreeType} onChange={handleChange}
              className={`${ui.select} w-full`}>
              {DEGREE_TYPES.map((t) => <option key={t} value={t}>{cap(t)}</option>)}
            </select>
          </Field>

          <Field label="Duration">
            <div className="flex gap-2">
              <input type="number" name="durationValue" min="1" value={form.defaultDuration.value}
                onChange={handleChange} required className={`${ui.input} min-w-0`} />
              <select name="durationUnit" value={form.defaultDuration.unit} onChange={handleChange}
                className={ui.select}>
                <option value="months">Months</option>
                <option value="years">Years</option>
              </select>
            </div>
          </Field>
          <Field label="Display Order">
            <input type="number" name="displayOrder" min="0" value={form.displayOrder}
              onChange={handleChange} className={ui.input} />
          </Field>

          <Field label="Status">
            <select name="status" value={form.status} onChange={handleChange}
              className={`${ui.select} w-full`}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>

          <Field label="Streams">
            <select
              value=""
              onChange={(e) => {
                const streamId = e.target.value;
                if (streamId && !form.streams.includes(streamId)) {
                  setForm((prev) => ({ ...prev, streams: [...prev.streams, streamId] }));
                }
              }}
              className={`${ui.select} w-full`}
            >
              <option value="">Select a stream</option>
              {streams.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>

            {form.streams.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {form.streams.map((streamId) => {
                  const stream = streams.find((s) => s._id === streamId);
                  return (
                    <span key={streamId}
                      className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                      {stream?.name || streamId}
                      <button type="button" aria-label={`Remove ${stream?.name || "stream"}`}
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            streams: prev.streams.filter((id) => id !== streamId),
                          }))
                        }>
                        <X size={13} />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </Field>

          <Field label="Description" className="md:col-span-2">
            <textarea name="description" value={form.description} onChange={handleChange}
              rows={3} placeholder="Enter a description of the degree..." className={ui.input} />
          </Field>

          <div className="flex gap-3 pt-2 md:col-span-2">
            <button type="button" onClick={closeForm} disabled={saving}
              className={`${ui.btnSecondary} flex-1`}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className={`${ui.btnPrimary} flex-1`}>
              {saving ? "Saving..." : editingId ? "Update Degree" : "Create Degree"}
            </button>
          </div>
        </form>
      </Modal>

      {/* VIEW MODAL */}
      <Modal open={!!viewDegree} title="Degree Details" onClose={() => setViewDegree(null)}>
        {viewDegree && (
          <>
            <div className="divide-y divide-slate-100 rounded-xl bg-slate-50 px-4">
              <DetailRow label="Name">{viewDegree.name}</DetailRow>
              <DetailRow label="Short Name">{viewDegree.shortName}</DetailRow>
              <DetailRow label="Slug">{viewDegree.slug}</DetailRow>
              <DetailRow label="Code">{viewDegree.code}</DetailRow>
              <DetailRow label="Level"><span className="capitalize">{viewDegree.level}</span></DetailRow>
              <DetailRow label="Type"><span className="capitalize">{viewDegree.degreeType}</span></DetailRow>
              <DetailRow label="Duration"><span className="capitalize">{durationText(viewDegree)}</span></DetailRow>
              <DetailRow label="Streams">
                {Array.isArray(viewDegree.streams) && viewDegree.streams.length > 0
                  ? viewDegree.streams
                      .map((s) => (typeof s === "object" ? s.name : streams.find((x) => x._id === s)?.name || s))
                      .join(", ")
                  : ""}
              </DetailRow>
              <DetailRow label="Status"><StatusBadge status={viewDegree.status} /></DetailRow>
              <DetailRow label="Description">{viewDegree.description}</DetailRow>
            </div>

            <div className="mt-5 flex gap-3">
              <button type="button" onClick={() => setViewDegree(null)}
                className={`${ui.btnSecondary} flex-1`}>
                Close
              </button>
              <button type="button" onClick={() => openEditForm(viewDegree)}
                className={`${ui.btnPrimary} flex-1`}>
                <Pencil size={15} />
                Edit
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* DELETE CONFIRMATION */}
      <Modal open={!!deleteDegree} title="Delete Degree?" onClose={closeDeleteModal}>
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <Trash2 size={22} />
        </div>
        <p className="mb-6 text-sm text-slate-600">
          Are you sure you want to delete{" "}
          <strong className="text-slate-900">{deleteDegree?.name}</strong>? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button type="button" onClick={closeDeleteModal} disabled={deleting}
            className={`${ui.btnSecondary} flex-1`}>
            Cancel
          </button>
          <button type="button" onClick={confirmDelete} disabled={deleting}
            className={`${ui.btnDanger} flex-1`}>
            {deleting ? "Deleting..." : "Delete Degree"}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Degree;
