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
    {status || "unknown"}
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

const LIMIT = 10;

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

/* ============================================================
   MAIN PAGE
   ============================================================ */

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

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [selectedCourse, setSelectedCourse] = useState(null); // delete
  const [viewCourse, setViewCourse] = useState(null);

  const getError = (error) =>
    error.response?.data?.message || error.message || "Something went wrong";

  // ================= FETCH =================
  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await api.get("/Get-All-Courses");

      if (response.data.success) {
        setCourses(Array.isArray(response.data.data) ? response.data.data : []);
      } else {
        toast.error(response.data.message || "Failed to load courses");
      }
    } catch (error) {
      toast.error(getError(error));
    } finally {
      setLoading(false);
    }
  };

  const fetchDegrees = async () => {
    try {
      const response = await api.get("/GetAllDegree");

      if (response.data.success) {
        const data = response.data.data ?? response.data.degrees ?? [];
        setDegrees(Array.isArray(data) ? data : []);
      } else {
        toast.error(response.data.message || "Failed to load degrees");
      }
    } catch (error) {
      console.error("Degree API:", getError(error));
      toast.error("Degrees load nahi ho payi. Degree API URL check karo.");
    }
  };

  const fetchStreams = async () => {
    try {
      const response = await api.get("/Get-All-Streams");

      if (response.data.status) {
        setStreams(Array.isArray(response.data.streams) ? response.data.streams : []);
      } else {
        toast.error(response.data.message || "Failed to load streams");
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

  // ================= FORM =================
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

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setShowForm(false);
  };

  const closeForm = () => {
    if (saving) return;
    resetForm();
  };

  const openAddForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setShowForm(true);
  };

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
    setViewCourse(null);
    setShowForm(true);
  };

  // ================= ADD / UPDATE =================
  const handleSubmit = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error("Course name aur slug required hain");
      return;
    }

    if (!form.degree || !form.stream) {
      toast.error("Degree aur Stream select karo");
      return;
    }

    const durationValue = Number(form.durationValue);

    if (form.durationValue === "" || !Number.isFinite(durationValue) || durationValue < 0) {
      toast.error("Valid course duration enter karo");
      return;
    }

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim().toLowerCase(),
      code: form.code.trim(),
      degree: form.degree,
      stream: form.stream,
      duration: { value: durationValue, unit: form.durationUnit },
      description: form.description.trim(),
      status: form.status,
    };

    setSaving(true);

    try {
      const response = editingId
        ? await api.put(`/Edit-Course/${editingId}`, payload)
        : await api.post("/Add-New-Course", payload);

      if (response.data.success === false) {
        toast.error(response.data.message || "Course save nahi hua");
        return;
      }

      toast.success(editingId ? "Course updated successfully!" : "Course added successfully!");
      resetForm();
      await fetchCourses();
    } catch (error) {
      toast.error(getError(error));
    } finally {
      setSaving(false);
    }
  };

  // ================= DELETE =================
  const closeDeleteModal = () => {
    if (deleting) return;
    setSelectedCourse(null);
  };

  const confirmDelete = async () => {
    if (!selectedCourse?._id || deleting) return;
    setDeleting(true);

    try {
      const response = await api.delete(`/Delete-Course/${selectedCourse._id}`);

      if (response.data.success === false) {
        toast.error(response.data.message || "Course delete nahi hua");
        return;
      }

      toast.success("Course deleted successfully!");
      setSelectedCourse(null);
      await fetchCourses();
    } catch (error) {
      toast.error(getError(error));
    } finally {
      setDeleting(false);
    }
  };

  // ================= SEARCH, FILTER & SORT =================
  const filteredCourses = useMemo(() => {
    const searchText = search.toLowerCase();

    const result = courses.filter((course) => {
      const searchMatch = [course.name, course.code, course.slug, course.description]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(searchText));

      const degreeId = course.degree?._id || course.degree || "";
      const streamId = course.stream?._id || course.stream || "";

      return (
        searchMatch &&
        (!statusFilter || course.status === statusFilter) &&
        (!degreeFilter || degreeId === degreeFilter) &&
        (!streamFilter || streamId === streamFilter)
      );
    });

    return result.sort((a, b) => {
      const comparison = (a.name || "").localeCompare(b.name || "");
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [courses, search, statusFilter, degreeFilter, streamFilter, sortOrder]);

  // ================= PAGINATION =================
  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / LIMIT));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * LIMIT;
  const paginatedCourses = filteredCourses.slice(startIndex, startIndex + LIMIT);

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("");
    setDegreeFilter("");
    setStreamFilter("");
    setSortOrder("desc");
    setPage(1);
  };

  const durationText = (c) =>
    c.duration?.value != null ? `${c.duration.value} ${c.duration.unit || ""}` : "-";

  const hasFilters = search || statusFilter || degreeFilter || streamFilter;

  // ================= UI =================
  return (
    <div className={ui.page}>
      <div className={ui.container}>
        {/* HEADER */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className={ui.title}>Courses</h1>
            <p className={ui.subtitle}>Manage courses, degrees and streams</p>
          </div>
          <button type="button" onClick={openAddForm} className={ui.btnPrimary}>
            <Plus size={16} />
            Add New Course
          </button>
        </div>

        {/* STATS */}
        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Total Courses" value={courses.length} />
          <StatCard label="Active Courses" color="text-emerald-600"
            value={courses.filter((c) => c.status === "active").length} />
          <StatCard label="Inactive Courses" color="text-rose-600"
            value={courses.filter((c) => c.status === "inactive").length} />
        </div>

        {/* FILTERS */}
        <div className={`${ui.card} mb-5 grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-12`}>
          <div className="relative sm:col-span-2 lg:col-span-4">
            <Search size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search course..."
              className={`${ui.input} pl-10`}
            />
          </div>

          <select value={degreeFilter}
            onChange={(e) => { setDegreeFilter(e.target.value); setPage(1); }}
            className={`${ui.select} w-full lg:col-span-2`}>
            <option value="">All Degrees</option>
            {degrees.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>

          <select value={streamFilter}
            onChange={(e) => { setStreamFilter(e.target.value); setPage(1); }}
            className={`${ui.select} w-full lg:col-span-2`}>
            <option value="">All Streams</option>
            {streams.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>

          <select value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className={`${ui.select} w-full lg:col-span-2`}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select value={sortOrder}
            onChange={(e) => { setSortOrder(e.target.value); setPage(1); }}
            className={`${ui.select} w-full lg:col-span-1`}>
            <option value="asc">A-Z</option>
            <option value="desc">Z-A</option>
          </select>

          <button type="button" onClick={resetFilters} title="Reset filters"
            className={`${ui.btnSecondary} !px-3 lg:col-span-1`}>
            <RefreshCw size={15} />
          </button>
        </div>

        {/* TABLE / CARDS */}
        {loading ? (
          <div className={`${ui.card} py-14 text-center text-sm text-slate-500`}>
            Loading courses...
          </div>
        ) : paginatedCourses.length === 0 ? (
          <div className={`${ui.card} py-14 text-center text-sm text-slate-500`}>
            {hasFilters ? "No matching courses found." : "No courses found. Add your first course."}
          </div>
        ) : (
          <>
            {/* Desktop: table-fixed + truncate => scrollbar nahi aayega */}
            <div className={`${ui.card} hidden overflow-hidden md:block`}>
              <table className="w-full table-fixed text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="w-12 px-4 py-3.5 text-left font-semibold">#</th>
                    <th className="px-4 py-3.5 text-left font-semibold">Course</th>
                    <th className="hidden w-[10%] px-4 py-3.5 text-left font-semibold xl:table-cell">Code</th>
                    <th className="w-[18%] px-4 py-3.5 text-left font-semibold">Degree</th>
                    <th className="hidden w-[15%] px-4 py-3.5 text-left font-semibold lg:table-cell">Stream</th>
                    <th className="hidden w-[10%] px-4 py-3.5 text-left font-semibold xl:table-cell">Duration</th>
                    <th className="w-[11%] px-4 py-3.5 text-left font-semibold">Status</th>
                    <th className="w-32 px-4 py-3.5 text-right font-semibold">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedCourses.map((c, i) => (
                    <tr key={c._id} className="transition hover:bg-slate-50">
                      <td className="px-4 py-3.5 text-slate-400">{startIndex + i + 1}</td>
                      <td className="px-4 py-3.5">
                        <p className="truncate font-semibold text-slate-900" title={c.name}>{c.name}</p>
                        <p className="truncate text-xs text-slate-500">{c.slug}</p>
                      </td>
                      <td className="hidden truncate px-4 py-3.5 text-slate-600 xl:table-cell">
                        {c.code || "-"}
                      </td>
                      <td className="truncate px-4 py-3.5 text-slate-600" title={c.degree?.name}>
                        {c.degree?.name || "-"}
                      </td>
                      <td className="hidden truncate px-4 py-3.5 text-slate-600 lg:table-cell">
                        {c.stream?.name || "-"}
                      </td>
                      <td className="hidden px-4 py-3.5 capitalize text-slate-600 xl:table-cell">
                        {durationText(c)}
                      </td>
                      <td className="px-4 py-3.5"><StatusBadge status={c.status} /></td>
                      <td className="px-4 py-3.5">
                        <RowActions item={c} onView={setViewCourse} onEdit={handleEdit}
                          onDelete={setSelectedCourse} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: cards */}
            <div className="space-y-3 md:hidden">
              {paginatedCourses.map((c) => (
                <div key={c._id} className={`${ui.card} p-4`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{c.name}</p>
                      <p className="truncate text-sm text-slate-500">
                        {[c.degree?.name, c.stream?.name].filter(Boolean).join(" • ") || "-"}
                      </p>
                      <p className="text-sm capitalize text-slate-500">{durationText(c)}</p>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                  <div className="mt-3 flex items-center justify-end border-t border-slate-100 pt-3">
                    <RowActions item={c} onView={setViewCourse} onEdit={handleEdit}
                      onDelete={setSelectedCourse} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <Pagination currentPage={currentPage} totalPages={totalPages} onChange={setPage} />
      </div>

      {/* ADD / EDIT MODAL */}
      <Modal open={showForm} size="lg" title={editingId ? "Edit Course" : "Add New Course"} onClose={closeForm}>
        <form
          onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          <Field label="Course Name *">
            <input name="name" value={form.name} onChange={updateField} required
              placeholder="Bachelor of Technology" className={ui.input} />
          </Field>
          <Field label="Slug *">
            <input name="slug" value={form.slug} onChange={updateField} required
              placeholder="bachelor-of-technology" className={ui.input} />
          </Field>
          <Field label="Course Code">
            <input name="code" value={form.code} onChange={updateField}
              placeholder="BTECH" className={ui.input} />
          </Field>
          <Field label="Status">
            <select name="status" value={form.status} onChange={updateField}
              className={`${ui.select} w-full`}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>

          <Field label="Degree *">
            <select name="degree" value={form.degree} onChange={updateField} required
              className={`${ui.select} w-full`}>
              <option value="">Select degree</option>
              {degrees.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </Field>
          <Field label="Stream *">
            <select name="stream" value={form.stream} onChange={updateField} required
              className={`${ui.select} w-full`}>
              <option value="">Select stream</option>
              {streams.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </Field>

          <Field label="Duration">
            <input type="number" name="durationValue" value={form.durationValue}
              onChange={updateField} min="0" step="any" required className={ui.input} />
          </Field>
          <Field label="Duration Unit">
            <select name="durationUnit" value={form.durationUnit} onChange={updateField}
              className={`${ui.select} w-full`}>
              <option value="years">Years</option>
              <option value="months">Months</option>
            </select>
          </Field>

          <Field label="Description" className="md:col-span-2">
            <textarea name="description" value={form.description} onChange={updateField}
              rows="3" placeholder="Enter course description" className={ui.input} />
          </Field>

          <div className="flex gap-3 pt-2 md:col-span-2">
            <button type="button" onClick={closeForm} disabled={saving}
              className={`${ui.btnSecondary} flex-1`}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className={`${ui.btnPrimary} flex-1`}>
              {saving ? "Saving..." : editingId ? "Update Course" : "Save Course"}
            </button>
          </div>
        </form>
      </Modal>

      {/* VIEW MODAL */}
      <Modal open={!!viewCourse} title="Course Details" onClose={() => setViewCourse(null)}>
        {viewCourse && (
          <>
            <div className="divide-y divide-slate-100 rounded-xl bg-slate-50 px-4">
              <DetailRow label="Name">{viewCourse.name}</DetailRow>
              <DetailRow label="Slug">{viewCourse.slug}</DetailRow>
              <DetailRow label="Code">{viewCourse.code}</DetailRow>
              <DetailRow label="Degree">{viewCourse.degree?.name}</DetailRow>
              <DetailRow label="Stream">{viewCourse.stream?.name}</DetailRow>
              <DetailRow label="Duration"><span className="capitalize">{durationText(viewCourse)}</span></DetailRow>
              <DetailRow label="Status"><StatusBadge status={viewCourse.status} /></DetailRow>
              <DetailRow label="Description">{viewCourse.description || "No description available."}</DetailRow>
            </div>

            <div className="mt-5 flex gap-3">
              <button type="button" onClick={() => setViewCourse(null)}
                className={`${ui.btnSecondary} flex-1`}>
                Close
              </button>
              <button type="button" onClick={() => handleEdit(viewCourse)}
                className={`${ui.btnPrimary} flex-1`}>
                <Pencil size={15} />
                Edit
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* DELETE CONFIRMATION */}
      <Modal open={!!selectedCourse} title="Delete Course?" onClose={closeDeleteModal}>
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <Trash2 size={22} />
        </div>
        <p className="mb-6 text-sm text-slate-600">
          Are you sure you want to delete{" "}
          <strong className="text-slate-900">{selectedCourse?.name}</strong>? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button type="button" onClick={closeDeleteModal} disabled={deleting}
            className={`${ui.btnSecondary} flex-1`}>
            Cancel
          </button>
          <button type="button" onClick={confirmDelete} disabled={deleting}
            className={`${ui.btnDanger} flex-1`}>
            {deleting ? "Deleting..." : "Yes, Delete"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
