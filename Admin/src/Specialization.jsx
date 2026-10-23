import api from "./Api/axios";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Eye, Pencil, Trash2, X, Plus, Search } from "lucide-react";
import BulkSpecializationImport from "./assets/Components/BulkSpecializationImport";

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

const StatusBadge = ({ status }) => {
  const value = String(status || "active").toLowerCase();
  return (
    <span className={`${ui.badge} ${badgeColor[value] || badgeColor.default}`}>{value}</span>
  );
};

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
  course: "",
  description: "",
  duration: "",
  status: "active",
};

/* ============================================================
   MAIN PAGE
   ============================================================ */

const Specialization = () => {
  const [specializations, setSpecializations] = useState([]);
  const [courses, setCourses] = useState([]);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [page, setPage] = useState(1);

  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedSpecialization, setSelectedSpecialization] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    fetchSpecializations();
    fetchCourses();
  }, []);

  // ================= FETCH =================

const fetchSpecializations = async () => {
  try {
    setLoading(true);

    const response = await api.get("/specialization/Get-All-Specializations");

    if (
      response.data?.status === false ||
      response.data?.success === false
    ) {
      throw new Error(
        response.data?.message ||
          "Failed to fetch specializations"
      );
    }

    const data =
      response.data?.data ??
      response.data?.specializations ??
      [];

    const sortedData = Array.isArray(data)
      ? [...data].sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();

          return dateB - dateA;
        })
      : [];

    setSpecializations(sortedData);
  } catch (error) {
    toast.error(
      error.response?.data?.message ||
        error.message ||
        "Failed to fetch specializations"
    );
  } finally {
    setLoading(false);
  }
};


  const fetchCourses = async () => {
    try {
      const response = await api.get("/course/Get-All-Courses");

      if (response.data?.status === false || response.data?.success === false) {
        throw new Error(response.data?.message || "Failed to fetch courses");
      }

      const data = response.data?.data ?? response.data?.courses ?? [];
      setCourses(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Failed to fetch courses");
    }
  };

  const getId = (item) => item?._id || item?.id;

  const getCourseName = (item) => {
    if (!item?.course) return "N/A";

    if (typeof item.course === "object") {
      return item.course.name || item.course.title || "N/A";
    }

    const course = courses.find((c) => getId(c) === item.course);
    return course?.name || course?.title || item.course;
  };

  // ================= SEARCH, FILTER & SORT =================
  const filteredSpecializations = useMemo(() => {
    let result = [...specializations];
    const searchText = search.trim().toLowerCase();

    if (searchText) {
      result = result.filter((item) =>
        [
          item.name,
          item.slug,
          item.code,
          item.degree,
          item.stream,
          item.description,
          getCourseName(item),
        ].some((v) => String(v || "").toLowerCase().includes(searchText))
      );
    }

    if (statusFilter !== "all") {
      result = result.filter(
        (item) => String(item.status || "active").toLowerCase() === statusFilter
      );
    }

    result.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();

      if (sortOrder === "newest") return dateB - dateA;
      if (sortOrder === "oldest") return dateA - dateB;
      return String(a.name || "").localeCompare(String(b.name || ""));
    });

    return result;
  }, [specializations, search, statusFilter, sortOrder, courses]);

  // ================= PAGINATION =================
  const totalPages = Math.max(1, Math.ceil(filteredSpecializations.length / LIMIT));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * LIMIT;
  const paginatedSpecializations = filteredSpecializations.slice(startIndex, startIndex + LIMIT);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, sortOrder]);

  // ================= FORM =================
  const openAddModal = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowFormModal(true);
  };

  const openEditModal = (item) => {
    setEditingId(getId(item));
    setForm({
      name: item.name || "",
      slug: item.slug || "",
      code: item.code || "",
      degree: item.degree || "",
      stream: typeof item.stream === "object" ? item.stream?._id || "" : item.stream || "",
      course: typeof item.course === "object" ? item.course?._id || "" : item.course || "",
      description: item.description || "",
      duration: item.duration ?? "",
      status: item.status || "active",
    });
    setSelectedSpecialization(null);
    setShowFormModal(true);
  };

  const closeForm = () => {
    if (saving) return;
    setShowFormModal(false);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ================= ADD / UPDATE =================
 
const handleSubmit = async (e) => {
  e?.preventDefault();

  if (!form.name.trim()) {
    toast.error("Specialization name is required");
    return;
  }

  if (!form.slug.trim()) {
    toast.error("Specialization slug is required");
    return;
  }

  if (!form.course) {
    toast.error("Please select a course");
    return;
  }

  try {
    setSaving(true);

    const payload = {
      ...form,
      name: form.name.trim(),
      slug: form.slug.trim().toLowerCase(),
      code: form.code.trim().toUpperCase(),
      duration:
        form.duration === "" ? undefined : Number(form.duration),
    };

    const response = editingId
      ? await api.put(
          `/specialization/Edit-Specialization/${editingId}`,
          payload
        )
      : await api.post(
          "/specialization/Add-New-Specialization",
          payload
        );

    if (
      response.data?.status === false ||
      response.data?.success === false
    ) {
      throw new Error(
        response.data?.message || "Unable to save specialization"
      );
    }

    toast.success(
      response.data?.message ||
        (editingId
          ? "Specialization updated successfully"
          : "Specialization added successfully")
    );

    setShowFormModal(false);
    setForm(emptyForm);
    setEditingId(null);
    setPage(1);

    // Fetch latest data and put newly created specialization first
    await fetchSpecializations();

  } catch (error) {
    toast.error(
      error.response?.data?.message ||
        error.message ||
        "Unable to save specialization"
    );
  } finally {
    setSaving(false);
  }
};

  // ================= DELETE =================
  const closeDelete = () => {
    if (deleting) return;
    setDeleteTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      const response = await api.delete(`/specialization/Delete-Specialization/${getId(deleteTarget)}`);

      if (response.data?.status === false || response.data?.success === false) {
        throw new Error(response.data?.message || "Unable to delete specialization");
      }

      toast.success(response.data?.message || "Specialization deleted successfully");
      setDeleteTarget(null);
      await fetchSpecializations();
    } catch (error) {
      toast.error(
        error.response?.data?.message || error.message || "Unable to delete specialization"
      );
    } finally {
      setDeleting(false);
    }
  };

  const activeCount = specializations.filter(
    (item) => String(item.status || "active").toLowerCase() === "active"
  ).length;
  const inactiveCount = specializations.length - activeCount;

  // ================= UI =================
  return (
    <div className={ui.page}>
      <div className={ui.container}>
        {/* HEADER */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className={ui.title}>Specializations</h1>
            <p className={ui.subtitle}>Manage your course specializations</p>
          </div>
        <div className="flex flex-wrap items-center gap-3">
  <BulkSpecializationImport
    onImported={() => {
      window.dispatchEvent(new CustomEvent("specializations-imported"));
    }}
  />

  <button
    type="button"
    onClick={openAddModal}
    className={ui.btnPrimary}
  >
    <Plus size={16} />
    Add Specialization
  </button>
</div>
        </div>

        {/* STATS */}
        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Total Specializations" value={specializations.length} />
          <StatCard label="Active" color="text-emerald-600" value={activeCount} />
          <StatCard label="Inactive" color="text-rose-600" value={inactiveCount} />
        </div>

        {/* FILTERS */}
        <div className={`${ui.card} mb-5 grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-12`}>
          <div className="relative sm:col-span-2 lg:col-span-6">
            <Search size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search specializations..."
              className={`${ui.input} pl-10`}
            />
          </div>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className={`${ui.select} w-full lg:col-span-3`}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>

          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}
            className={`${ui.select} w-full lg:col-span-3`}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Name A-Z</option>
          </select>
        </div>

        {/* TABLE / CARDS */}
        {loading ? (
          <div className={`${ui.card} py-14 text-center text-sm text-slate-500`}>
            Loading specializations...
          </div>
        ) : paginatedSpecializations.length === 0 ? (
          <div className={`${ui.card} py-14 text-center text-sm text-slate-500`}>
            No specializations found
          </div>
        ) : (
          <>
            {/* Desktop: table-fixed + truncate => scrollbar nahi aayega */}
            <div className={`${ui.card} hidden overflow-hidden md:block`}>
              <table className="w-full table-fixed text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="w-12 px-4 py-3.5 text-left font-semibold">#</th>
                    <th className="px-4 py-3.5 text-left font-semibold">Name</th>
                    <th className="hidden w-[10%] px-4 py-3.5 text-left font-semibold xl:table-cell">Code</th>
                    <th className="hidden w-[15%] px-4 py-3.5 text-left font-semibold lg:table-cell">Degree</th>
                    <th className="w-[20%] px-4 py-3.5 text-left font-semibold">Course</th>
                    <th className="w-[12%] px-4 py-3.5 text-left font-semibold">Status</th>
                    <th className="w-32 px-4 py-3.5 text-right font-semibold">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedSpecializations.map((item, i) => (
                    <tr key={getId(item) || i} className="transition hover:bg-slate-50">
                      <td className="px-4 py-3.5 text-slate-400">{startIndex + i + 1}</td>
                      <td className="px-4 py-3.5">
                        <p className="truncate font-semibold text-slate-900" title={item.name}>
                          {item.name || "N/A"}
                        </p>
                        <p className="truncate text-xs text-slate-500">{item.slug || "-"}</p>
                      </td>
                      <td className="hidden truncate px-4 py-3.5 text-slate-600 xl:table-cell">
                        {item.code || "N/A"}
                      </td>
                      <td className="hidden truncate px-4 py-3.5 text-slate-600 lg:table-cell">
                        {item.degree || "N/A"}
                      </td>
                      <td className="truncate px-4 py-3.5 text-slate-600" title={getCourseName(item)}>
                        {getCourseName(item)}
                      </td>
                      <td className="px-4 py-3.5"><StatusBadge status={item.status} /></td>
                      <td className="px-4 py-3.5">
                        <RowActions item={item} onView={setSelectedSpecialization}
                          onEdit={openEditModal} onDelete={setDeleteTarget} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: cards */}
            <div className="space-y-3 md:hidden">
              {paginatedSpecializations.map((item, i) => (
                <div key={getId(item) || i} className={`${ui.card} p-4`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{item.name || "N/A"}</p>
                      <p className="truncate text-sm text-slate-500">{getCourseName(item)}</p>
                      <p className="truncate text-sm text-slate-500">
                        {[item.degree, item.code].filter(Boolean).join(" • ") || "-"}
                      </p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                  <div className="mt-3 flex items-center justify-end border-t border-slate-100 pt-3">
                    <RowActions item={item} onView={setSelectedSpecialization}
                      onEdit={openEditModal} onDelete={setDeleteTarget} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <Pagination currentPage={currentPage} totalPages={totalPages} onChange={setPage} />
      </div>

      {/* ADD / EDIT MODAL */}
      <Modal open={showFormModal} size="lg"
        title={editingId ? "Edit Specialization" : "Add Specialization"} onClose={closeForm}>
        <form
          onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          <Field label="Specialization Name *">
            <input name="name" value={form.name} onChange={handleChange} required
              placeholder="Enter specialization name" className={ui.input} />
          </Field>
          <Field label="Slug">
            <input name="slug" value={form.slug} onChange={handleChange}
              placeholder="Enter slug" className={ui.input} />
          </Field>
          <Field label="Code">
            <input name="code" value={form.code} onChange={handleChange}
              placeholder="Enter code" className={ui.input} />
          </Field>
          <Field label="Degree">
            <input name="degree" value={form.degree} onChange={handleChange}
              placeholder="Enter degree" className={ui.input} />
          </Field>
          <Field label="Stream">
            <input name="stream" value={form.stream} onChange={handleChange}
              placeholder="Enter stream ID or name" className={ui.input} />
          </Field>
          <Field label="Course">
            <select name="course" value={form.course} onChange={handleChange}
              className={`${ui.select} w-full`}>
              <option value="">Select course</option>
              {courses.map((course) => (
                <option key={getId(course)} value={getId(course)}>
                  {course.name || course.title || "Unnamed Course"}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Duration">
            <input type="number" min="0" name="duration" value={form.duration}
              onChange={handleChange} placeholder="Enter duration" className={ui.input} />
          </Field>
          <Field label="Status">
            <select name="status" value={form.status} onChange={handleChange}
              className={`${ui.select} w-full`}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </Field>
          <Field label="Description" className="md:col-span-2">
            <textarea name="description" value={form.description} onChange={handleChange}
              rows={3} placeholder="Enter description" className={ui.input} />
          </Field>

          <div className="flex gap-3 pt-2 md:col-span-2">
            <button type="button" onClick={closeForm} disabled={saving}
              className={`${ui.btnSecondary} flex-1`}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className={`${ui.btnPrimary} flex-1`}>
              {saving ? "Saving..." : editingId ? "Update Specialization" : "Add Specialization"}
            </button>
          </div>
        </form>
      </Modal>

      {/* VIEW MODAL */}
      <Modal open={!!selectedSpecialization} title="Specialization Details"
        onClose={() => setSelectedSpecialization(null)}>
        {selectedSpecialization && (
          <>
            <div className="divide-y divide-slate-100 rounded-xl bg-slate-50 px-4">
              <DetailRow label="Name">{selectedSpecialization.name}</DetailRow>
              <DetailRow label="Slug">{selectedSpecialization.slug}</DetailRow>
              <DetailRow label="Code">{selectedSpecialization.code}</DetailRow>
              <DetailRow label="Degree">{selectedSpecialization.degree}</DetailRow>
              <DetailRow label="Stream">
                {typeof selectedSpecialization.stream === "object"
                  ? selectedSpecialization.stream?.name
                  : selectedSpecialization.stream}
              </DetailRow>
              <DetailRow label="Course">{getCourseName(selectedSpecialization)}</DetailRow>
             
<DetailRow label="Duration">
  {typeof selectedSpecialization.duration === "object" &&
  selectedSpecialization.duration !== null
    ? `${selectedSpecialization.duration.value ?? ""} ${
        selectedSpecialization.duration.unit ?? ""
      }`.trim() || "-"
    : selectedSpecialization.duration ?? "-"}
</DetailRow>

              <DetailRow label="Status"><StatusBadge status={selectedSpecialization.status} /></DetailRow>
              <DetailRow label="Description">{selectedSpecialization.description}</DetailRow>
            </div>

            <div className="mt-5 flex gap-3">
              <button type="button" onClick={() => setSelectedSpecialization(null)}
                className={`${ui.btnSecondary} flex-1`}>
                Close
              </button>
             
            </div>
          </>
        )}
      </Modal>

      {/* DELETE CONFIRMATION */}
      <Modal open={!!deleteTarget} title="Delete Specialization?" onClose={closeDelete}>
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <Trash2 size={22} />
        </div>
        <p className="mb-6 text-sm text-slate-600">
          Do you really want to delete{" "}
          <strong className="text-slate-900">{deleteTarget?.name}</strong>? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button type="button" onClick={closeDelete} disabled={deleting}
            className={`${ui.btnSecondary} flex-1`}>
            Cancel
          </button>
          <button type="button" onClick={handleDelete} disabled={deleting}
            className={`${ui.btnDanger} flex-1`}>
            {deleting ? "Deleting..." : "Yes, Delete"}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Specialization;
