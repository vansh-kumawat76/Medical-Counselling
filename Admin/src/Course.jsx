
import React, { useEffect, useMemo, useState } from "react";
import api from "./Api/axios";
import { toast } from "react-toastify";
import {
  Eye,
  Pencil,
  Trash2,
  X,
  Plus,
  Search,
  RefreshCw,
} from "lucide-react";
import BulkCourseImport from "./assets/Components/BulkCourseImport";

/* ============================================================
   PERMISSIONS
   ============================================================ */

const getUserPermissions = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const savedPermissions = JSON.parse(
      localStorage.getItem("permissions") || "null"
    );

    const rawPermissions =
      savedPermissions ?? user.permissions ?? user.role?.permissions ?? [];

    const permissions = Array.isArray(rawPermissions)
      ? rawPermissions
          .map((permission) =>
            typeof permission === "string"
              ? permission
              : permission?.name
          )
          .filter(Boolean)
      : [];

    const isSuperAdmin =
      user.role === "SuperAdmin" ||
      user.role?.role === "SuperAdmin" ||
      user.role?.name === "SuperAdmin";

    return { isSuperAdmin, permissions };
  } catch (error) {
    console.error("Course permission error:", error);
    return { isSuperAdmin: false, permissions: [] };
  }
};

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

    const onKey = (event) => {
      if (event.key === "Escape") onClose();
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
        onClick={(event) => event.stopPropagation()}
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

/* Actions appear only when the corresponding permission exists. */
const RowActions = ({
  item,
  onView,
  onEdit,
  onDelete,
  canView,
  canEdit,
  canDelete,
}) => {
  if (!canView && !canEdit && !canDelete) return null;

  return (
    <div className="flex items-center justify-end gap-1">
      {canView && (
        <button
          type="button"
          title="View"
          aria-label="View course"
          onClick={() => onView(item)}
          className={ui.iconBtnView}
        >
          <Eye size={17} />
        </button>
      )}

      {canEdit && (
        <button
          type="button"
          title="Edit"
          aria-label="Edit course"
          onClick={() => onEdit(item)}
          className={ui.iconBtnEdit}
        >
          <Pencil size={17} />
        </button>
      )}

      {canDelete && (
        <button
          type="button"
          title="Delete"
          aria-label="Delete course"
          onClick={() => onDelete(item)}
          className={ui.iconBtnDelete}
        >
          <Trash2 size={17} />
        </button>
      )}
    </div>
  );
};

const getPages = (current, total) => {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const pages = new Set([1, total, current - 1, current, current + 1]);

  const list = [...pages]
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b);

  const result = [];

  list.forEach((page, index) => {
    if (index > 0 && page - list[index - 1] > 1) {
      result.push("...");
    }

    result.push(page);
  });

  return result;
};

const Pagination = ({ currentPage, totalPages, onChange }) => {
  if (totalPages <= 1) return null;

  const base =
    "h-9 min-w-9 rounded-lg px-3 text-sm font-medium transition";
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

      {getPages(currentPage, totalPages).map((page, index) =>
        page === "..." ? (
          <span key={`dots-${index}`} className="px-1 text-slate-400">
            …
          </span>
        ) : (
          <button
            type="button"
            key={page}
            onClick={() => onChange(page)}
            className={`${base} ${
              page === currentPage
                ? "bg-indigo-600 text-white shadow-sm"
                : idle
            }`}
          >
            {page}
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
  const { isSuperAdmin, permissions } = getUserPermissions();

  const hasPermission = (permission) =>
    isSuperAdmin || permissions.includes(permission);

  const canView = hasPermission("course.view");
  const canCreate = hasPermission("course.create");
  const canEdit = hasPermission("course.edit");
  const canDelete = hasPermission("course.delete");

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

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [viewCourse, setViewCourse] = useState(null);

  const getError = (error) =>
    error.response?.data?.message ||
    error.message ||
    "Something went wrong";

  /* ================= FETCH ================= */

  const fetchCourses = async () => {
    try {
      setLoading(true);

      const response = await api.get("/course/Get-All-Courses");

      if (response.data.success) {
        const coursesData = Array.isArray(response.data.data)
          ? response.data.data
          : [];

        const sortedCourses = [...coursesData].sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();

          if (dateA !== dateB) return dateB - dateA;

          return String(b._id || "").localeCompare(String(a._id || ""));
        });

        setCourses(sortedCourses);
      } else {
        toast.error(response.data.message || "Failed to fetch courses");
      }
    } catch (error) {
      console.error("Fetch courses error:", error);
      toast.error(getError(error));
    } finally {
      setLoading(false);
    }
  };

  const fetchDegrees = async () => {
    try {
      const response = await api.get("/degree/GetAllDegree");

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
      const response = await api.get("/stream/Get-All-Streams");

      if (response.data.status) {
        setStreams(
          Array.isArray(response.data.streams)
            ? response.data.streams
            : []
        );
      } else {
        toast.error(response.data.message || "Failed to load streams");
      }
    } catch (error) {
      console.error("Stream API:", getError(error));
      toast.error(getError(error));
    }
  };

  useEffect(() => {
    if (!canView) return;

    fetchCourses();
    fetchDegrees();
    fetchStreams();

    const handleCoursesImported = () => {
      if (canCreate) fetchCourses();
    };

    window.addEventListener("courses-imported", handleCoursesImported);

    return () => {
      window.removeEventListener(
        "courses-imported",
        handleCoursesImported
      );
    };
  }, [canView, canCreate]);

  /* ================= FORM ================= */

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
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
    if (!canCreate) {
      toast.error("You do not have permission to create courses.");
      return;
    }

    setForm({ ...emptyForm });
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (course) => {
    if (!canEdit) {
      toast.error("You do not have permission to edit courses.");
      return;
    }

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

  /* ================= ADD / UPDATE ================= */

  const handleSubmit = async () => {
    if (editingId ? !canEdit : !canCreate) {
      toast.error(
        editingId
          ? "You do not have permission to edit courses."
          : "You do not have permission to create courses."
      );
      return;
    }

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
      const response = editingId
        ? await api.put(`/course/Edit-Course/${editingId}`, payload)
        : await api.post("/course/Add-New-Course", payload);

      if (response.data.success === false) {
        toast.error(response.data.message || "Course save nahi hua");
        return;
      }

      toast.success(
        editingId
          ? "Course updated successfully!"
          : "Course added successfully!"
      );

      resetForm();
      setSearch("");
      setStatusFilter("");
      setDegreeFilter("");
      setStreamFilter("");
      setSortOrder("desc");
      setPage(1);

      await fetchCourses();
    } catch (error) {
      toast.error(getError(error));
    } finally {
      setSaving(false);
    }
  };

  /* ================= DELETE ================= */

  const openDeleteModal = (course) => {
    if (!canDelete) {
      toast.error("You do not have permission to delete courses.");
      return;
    }

    setSelectedCourse(course);
  };

  const closeDeleteModal = () => {
    if (deleting) return;
    setSelectedCourse(null);
  };

  const confirmDelete = async () => {
    if (!canDelete) {
      toast.error("You do not have permission to delete courses.");
      return;
    }

    if (!selectedCourse?._id || deleting) return;

    setDeleting(true);

    try {
      const response = await api.delete(
        `/course/Delete-Course/${selectedCourse._id}`
      );

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

  /* ================= SEARCH, FILTER & SORT ================= */

  const filteredCourses = useMemo(() => {
    const searchText = search.toLowerCase();

    const result = courses.filter((course) => {
      const searchMatch = [
        course.name,
        course.code,
        course.slug,
        course.description,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(searchText)
        );

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
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();

      return sortOrder === "desc"
        ? dateB - dateA
        : dateA - dateB;
    });
  }, [
    courses,
    search,
    statusFilter,
    degreeFilter,
    streamFilter,
    sortOrder,
  ]);

  /* ================= PAGINATION ================= */

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCourses.length / LIMIT)
  );

  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * LIMIT;

  const paginatedCourses = filteredCourses.slice(
    startIndex,
    startIndex + LIMIT
  );

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("");
    setDegreeFilter("");
    setStreamFilter("");
    setSortOrder("desc");
    setPage(1);
  };

  const durationText = (course) =>
    course.duration?.value != null
      ? `${course.duration.value} ${course.duration.unit || ""}`
      : "-";

  const hasFilters =
    search || statusFilter || degreeFilter || streamFilter;

  /* ================= VIEW PERMISSION ================= */

  if (!canView) {
    return (
      <div className={ui.page}>
        <div className={`${ui.container} ${ui.card} p-8 text-center`}>
          <h1 className="text-xl font-bold text-rose-600">
            Access Denied
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            You do not have permission to view courses.
          </p>
        </div>
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <div className={ui.page}>
      <div className={ui.container}>
        {/* HEADER */}

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className={ui.title}>Courses</h1>
            <p className={ui.subtitle}>
              Manage courses, degrees and streams
            </p>
          </div>

          {canCreate && (
            <div className="flex flex-wrap items-center gap-3">
              <BulkCourseImport />

              <button
                type="button"
                onClick={openAddForm}
                className={ui.btnPrimary}
              >
                <Plus size={16} />
                Add New Course
              </button>
            </div>
          )}
        </div>

        {/* STATS */}

        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Total Courses" value={courses.length} />

          <StatCard
            label="Active Courses"
            color="text-emerald-600"
            value={courses.filter((course) => course.status === "active").length}
          />

          <StatCard
            label="Inactive Courses"
            color="text-rose-600"
            value={courses.filter((course) => course.status === "inactive").length}
          />
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
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search course..."
              className={`${ui.input} pl-10`}
            />
          </div>

          <select
            value={degreeFilter}
            onChange={(event) => {
              setDegreeFilter(event.target.value);
              setPage(1);
            }}
            className={`${ui.select} w-full lg:col-span-2`}
          >
            <option value="">All Degrees</option>
            {degrees.map((degree) => (
              <option key={degree._id} value={degree._id}>
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
            className={`${ui.select} w-full lg:col-span-2`}
          >
            <option value="">All Streams</option>
            {streams.map((stream) => (
              <option key={stream._id} value={stream._id}>
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
            className={`${ui.select} w-full lg:col-span-2`}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={sortOrder}
            onChange={(event) => {
              setSortOrder(event.target.value);
              setPage(1);
            }}
            className={`${ui.select} w-full lg:col-span-1`}
          >
            <option value="desc">Newest First</option>
            <option value="asc">Older First</option>
          </select>

          <button
            type="button"
            onClick={resetFilters}
            title="Reset filters"
            className={`${ui.btnSecondary} !px-3 lg:col-span-1`}
          >
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
            {hasFilters
              ? "No matching courses found."
              : "No courses found."}
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE */}

            <div className={`${ui.card} hidden overflow-hidden md:block`}>
              <table className="w-full table-fixed text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="w-12 px-4 py-3.5 text-left font-semibold">
                      #
                    </th>
                    <th className="px-4 py-3.5 text-left font-semibold">
                      Course
                    </th>
                    <th className="hidden w-[10%] px-4 py-3.5 text-left font-semibold xl:table-cell">
                      Code
                    </th>
                    <th className="w-[18%] px-4 py-3.5 text-left font-semibold">
                      Degree
                    </th>
                    <th className="hidden w-[15%] px-4 py-3.5 text-left font-semibold lg:table-cell">
                      Stream
                    </th>
                    <th className="hidden w-[10%] px-4 py-3.5 text-left font-semibold xl:table-cell">
                      Duration
                    </th>
                    <th className="w-[11%] px-4 py-3.5 text-left font-semibold">
                      Status
                    </th>
                    {(canView || canEdit || canDelete) && (
                      <th className="w-32 px-4 py-3.5 text-right font-semibold">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedCourses.map((course, index) => (
                    <tr
                      key={course._id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-4 py-3.5 text-slate-400">
                        {startIndex + index + 1}
                      </td>

                      <td className="px-4 py-3.5">
                        <p
                          className="truncate font-semibold text-slate-900"
                          title={course.name}
                        >
                          {course.name}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {course.slug}
                        </p>
                      </td>

                      <td className="hidden truncate px-4 py-3.5 text-slate-600 xl:table-cell">
                        {course.code || "-"}
                      </td>

                      <td
                        className="truncate px-4 py-3.5 text-slate-600"
                        title={course.degree?.name}
                      >
                        {course.degree?.name || "-"}
                      </td>

                      <td className="hidden truncate px-4 py-3.5 text-slate-600 lg:table-cell">
                        {course.stream?.name || "-"}
                      </td>

                      <td className="hidden px-4 py-3.5 capitalize text-slate-600 xl:table-cell">
                        {durationText(course)}
                      </td>

                      <td className="px-4 py-3.5">
                        <StatusBadge status={course.status} />
                      </td>

                      {(canView || canEdit || canDelete) && (
                        <td className="px-4 py-3.5">
                          <RowActions
                            item={course}
                            onView={setViewCourse}
                            onEdit={handleEdit}
                            onDelete={openDeleteModal}
                            canView={canView}
                            canEdit={canEdit}
                            canDelete={canDelete}
                          />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARDS */}

            <div className="space-y-3 md:hidden">
              {paginatedCourses.map((course) => (
                <div key={course._id} className={`${ui.card} p-4`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">
                        {course.name}
                      </p>

                      <p className="truncate text-sm text-slate-500">
                        {[
                          course.degree?.name,
                          course.stream?.name,
                        ]
                          .filter(Boolean)
                          .join(" • ") || "-"}
                      </p>

                      <p className="text-sm capitalize text-slate-500">
                        {durationText(course)}
                      </p>
                    </div>

                    <StatusBadge status={course.status} />
                  </div>

                  {(canView || canEdit || canDelete) && (
                    <div className="mt-3 flex items-center justify-end border-t border-slate-100 pt-3">
                      <RowActions
                        item={course}
                        onView={setViewCourse}
                        onEdit={handleEdit}
                        onDelete={openDeleteModal}
                        canView={canView}
                        canEdit={canEdit}
                        canDelete={canDelete}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onChange={setPage}
        />
      </div>

      {/* ADD / EDIT MODAL */}

      <Modal
        open={showForm}
        size="lg"
        title={editingId ? "Edit Course" : "Add New Course"}
        onClose={closeForm}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit();
          }}
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          <Field label="Course Name *">
            <input
              name="name"
              value={form.name}
              onChange={updateField}
              required
              placeholder="Bachelor of Technology"
              className={ui.input}
            />
          </Field>

          <Field label="Slug *">
            <input
              name="slug"
              value={form.slug}
              onChange={updateField}
              required
              placeholder="bachelor-of-technology"
              className={ui.input}
            />
          </Field>

          <Field label="Course Code">
            <input
              name="code"
              value={form.code}
              onChange={updateField}
              placeholder="BTECH"
              className={ui.input}
            />
          </Field>

          <Field label="Status">
            <select
              name="status"
              value={form.status}
              onChange={updateField}
              className={`${ui.select} w-full`}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>

          <Field label="Degree *">
            <select
              name="degree"
              value={form.degree}
              onChange={updateField}
              required
              className={`${ui.select} w-full`}
            >
              <option value="">Select degree</option>
              {degrees.map((degree) => (
                <option key={degree._id} value={degree._id}>
                  {degree.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Stream *">
            <select
              name="stream"
              value={form.stream}
              onChange={updateField}
              required
              className={`${ui.select} w-full`}
            >
              <option value="">Select stream</option>
              {streams.map((stream) => (
                <option key={stream._id} value={stream._id}>
                  {stream.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Duration">
            <input
              type="number"
              name="durationValue"
              value={form.durationValue}
              onChange={updateField}
              min="0"
              step="any"
              required
              className={ui.input}
            />
          </Field>

          <Field label="Duration Unit">
            <select
              name="durationUnit"
              value={form.durationUnit}
              onChange={updateField}
              className={`${ui.select} w-full`}
            >
              <option value="years">Years</option>
              <option value="months">Months</option>
            </select>
          </Field>

          <Field label="Description" className="md:col-span-2">
            <textarea
              name="description"
              value={form.description}
              onChange={updateField}
              rows="3"
              placeholder="Enter course description"
              className={ui.input}
            />
          </Field>

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
                : editingId
                ? "Update Course"
                : "Save Course"}
            </button>
          </div>
        </form>
      </Modal>

      {/* VIEW MODAL */}

      <Modal
        open={!!viewCourse}
        title="Course Details"
        onClose={() => setViewCourse(null)}
      >
        {viewCourse && (
          <>
            <div className="divide-y divide-slate-100 rounded-xl bg-slate-50 px-4">
              <DetailRow label="Name">{viewCourse.name}</DetailRow>
              <DetailRow label="Slug">{viewCourse.slug}</DetailRow>
              <DetailRow label="Code">{viewCourse.code}</DetailRow>
              <DetailRow label="Degree">{viewCourse.degree?.name}</DetailRow>
              <DetailRow label="Stream">{viewCourse.stream?.name}</DetailRow>

              <DetailRow label="Duration">
                <span className="capitalize">
                  {durationText(viewCourse)}
                </span>
              </DetailRow>

              <DetailRow label="Status">
                <StatusBadge status={viewCourse.status} />
              </DetailRow>

              <DetailRow label="Description">
                {viewCourse.description || "No description available."}
              </DetailRow>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setViewCourse(null)}
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
        open={!!selectedCourse}
        title="Delete Course?"
        onClose={closeDeleteModal}
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <Trash2 size={22} />
        </div>

        <p className="mb-6 text-sm text-slate-600">
          Are you sure you want to delete{" "}
          <strong className="text-slate-900">
            {selectedCourse?.name}
          </strong>
          ? This action cannot be undone.
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={closeDeleteModal}
            disabled={deleting}
            className={`${ui.btnSecondary} flex-1`}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={confirmDelete}
            disabled={deleting}
            className={`${ui.btnDanger} flex-1`}
          >
            {deleting ? "Deleting..." : "Yes, Delete"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
