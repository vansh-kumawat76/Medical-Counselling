
import React, { useEffect, useMemo, useState } from "react";
import api from "./Api/axios";
import { toast } from "react-toastify";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import BulkCourseImport from "./assets/Components/BulkCourseImport";

import {
  ui,
  PageHeader,
  Modal,
  Field,
  DetailRow,
  StatusBadge,
  StatusToggle,
  RowActions,
  FilterBar,
  SearchInput,
  EmptyState,
  ListSkeleton,
  DataTable,
  Pagination,
} from "./assets/Components/ui/ui";

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
            typeof permission === "string" ? permission : permission?.name
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
  const [togglingCourseId, setTogglingCourseId] = useState(null);

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

    const handleCoursesImported = () => fetchCourses();

    window.addEventListener("courses-imported", handleCoursesImported);

    return () => {
      window.removeEventListener("courses-imported", handleCoursesImported);
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

  /* ================= TOGGLE STATUS ================= */

  const toggleCourseStatus = async (course) => {
    if (!canEdit) {
      toast.error("You do not have permission to update courses.");
      return;
    }

    if (togglingCourseId) return;

    const newStatus =
      course.status === "active" ? "inactive" : "active";

    try {
      setTogglingCourseId(course._id);

      const response = await api.put(
        `/course/Edit-Course/${course._id}`,
        { status: newStatus }
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Course status update nahi ho paya."
        );
      }

      toast.success(
        `Course ${
          newStatus === "active" ? "activated" : "deactivated"
        } successfully!`
      );

      await fetchCourses();
    } catch (error) {
      console.error("Toggle Course Status Error:", error);

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Course status update nahi ho paya."
      );
    } finally {
      setTogglingCourseId(null);
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
        <div className={ui.container}>
          <EmptyState
            title="Access Denied"
            hint="You do not have permission to view courses."
          />
        </div>
      </div>
    );
  }

  /* ================= TABLE COLUMNS ================= */

  const columns = [
    {
      header: "Course",
      cell: (course) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900" title={course.name}>
            {course.name}
          </p>
          <p className="truncate text-xs text-slate-500">{course.slug}</p>
        </div>
      ),
    },
    {
      header: "Code",
      hideBelow: "xl",
      className: "w-[10%]",
      cell: (course) => course.code || "-",
    },
    {
      header: "Degree",
      className: "w-[18%]",
      cell: (course) => course.degree?.name || "-",
      truncate: true,
    },
    {
      header: "Stream",
      hideBelow: "lg",
      className: "w-[15%]",
      cell: (course) => course.stream?.name || "-",
      truncate: true,
    },
    {
      header: "Duration",
      hideBelow: "xl",
      className: "w-[10%]",
      cell: (course) => (
        <span className="capitalize">{durationText(course)}</span>
      ),
    },
    {
      header: "Status",
      className: "w-[17%]",
      cell: (course) => (
        <div className="flex items-center gap-2">
          <StatusBadge status={course.status} />
          {canEdit && (
            <StatusToggle
              checked={course.status === "active"}
              onChange={() => toggleCourseStatus(course)}
              disabled={Boolean(togglingCourseId)}
              label="Toggle course status"
            />
          )}
        </div>
      ),
    },
  ];

  /* ================= UI ================= */

  return (
    <div className={ui.page}>
      <div className={ui.container}>
        <PageHeader
          title="Course Management"
          subtitle="Manage courses, degrees and streams"
          actions={
            canCreate && (
              <>
                <BulkCourseImport />
                <button
                  type="button"
                  onClick={openAddForm}
                  className={ui.btnPrimary}
                >
                  <Plus size={16} />
                  Add New Course
                </button>
              </>
            )
          }
        />

        {/* STATS */}

        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className={`${ui.card} p-5`}>
            <p className="text-sm text-slate-500">Total Courses</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {courses.length}
            </p>
          </div>

          <div className={`${ui.card} p-5`}>
            <p className="text-sm text-slate-500">Active Courses</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">
              {courses.filter((course) => course.status === "active").length}
            </p>
          </div>

          <div className={`${ui.card} p-5`}>
            <p className="text-sm text-slate-500">Inactive Courses</p>
            <p className="mt-1 text-2xl font-bold text-rose-600">
              {courses.filter((course) => course.status === "inactive").length}
            </p>
          </div>
        </div>

        {/* FILTERS */}

        <FilterBar
          showClear={Boolean(hasFilters) || sortOrder !== "desc"}
          onClear={resetFilters}
        >
          <div className="col-span-2 lg:col-span-4">
            <SearchInput
              value={search}
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              placeholder="Search course..."
            />
          </div>

          <div className="lg:col-span-2">
            <select
              value={degreeFilter}
              onChange={(event) => {
                setDegreeFilter(event.target.value);
                setPage(1);
              }}
              className={ui.select}
            >
              <option value="">All Degrees</option>
              {degrees.map((degree) => (
                <option key={degree._id} value={degree._id}>
                  {degree.name}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <select
              value={streamFilter}
              onChange={(event) => {
                setStreamFilter(event.target.value);
                setPage(1);
              }}
              className={ui.select}
            >
              <option value="">All Streams</option>
              {streams.map((stream) => (
                <option key={stream._id} value={stream._id}>
                  {stream.name}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
              className={ui.select}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="lg:col-span-1">
            <select
              value={sortOrder}
              onChange={(event) => {
                setSortOrder(event.target.value);
                setPage(1);
              }}
              className={ui.select}
            >
              <option value="desc">Newest</option>
              <option value="asc">Oldest</option>
            </select>
          </div>

          <div className="lg:col-span-1">
            <button
              type="button"
              onClick={resetFilters}
              title="Reset filters"
              className={`${ui.btnSecondary} w-full !px-3`}
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </FilterBar>

        {/* TABLE / MOBILE CARDS */}

        <DataTable
          columns={columns}
          rows={paginatedCourses}
          rowKey={(course) => course._id}
          startIndex={startIndex}
          loading={loading}
          emptyTitle={
            hasFilters ? "No matching courses found" : "No courses found"
          }
          emptyHint={
            hasFilters
              ? "Try changing your search or filters."
              : "Add a new course to get started."
          }
          renderActions={(course) => (
            <RowActions
              onView={canView ? () => setViewCourse(course) : undefined}
              onEdit={canEdit ? () => handleEdit(course) : undefined}
              onDelete={canDelete ? () => openDeleteModal(course) : undefined}
            />
          )}
          renderCard={(course) => (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">
                    {course.name}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {course.slug}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {course.code || "-"}
                  </p>
                </div>

                <StatusBadge status={course.status} />
              </div>

              <div className="mt-3 divide-y divide-slate-100 border-t border-slate-100">
                <DetailRow label="Degree">
                  {course.degree?.name || "-"}
                </DetailRow>
                <DetailRow label="Stream">
                  {course.stream?.name || "-"}
                </DetailRow>
                <DetailRow label="Duration">
                  <span className="capitalize">{durationText(course)}</span>
                </DetailRow>
                {canEdit && (
                  <div className="flex items-center justify-between py-3">
                    <span className="text-sm text-slate-500">Status</span>
                    <StatusToggle
                      checked={course.status === "active"}
                      onChange={() => toggleCourseStatus(course)}
                      disabled={Boolean(togglingCourseId)}
                      label="Toggle course status"
                    />
                  </div>
                )}
              </div>

              {(canView || canEdit || canDelete) && (
                <div className="mt-2 flex justify-end border-t border-slate-100 pt-2">
                  <RowActions
                    onView={canView ? () => setViewCourse(course) : undefined}
                    onEdit={canEdit ? () => handleEdit(course) : undefined}
                    onDelete={canDelete ? () => openDeleteModal(course) : undefined}
                  />
                </div>
              )}
            </>
          )}
        />

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
        footer={
          <div className="flex gap-3">
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
              form="course-form"
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
        }
      >
        <form
          id="course-form"
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
              className={ui.select}
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
              className={ui.select}
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
              className={ui.select}
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
              className={ui.select}
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
        </form>
      </Modal>

      {/* VIEW MODAL */}

      <Modal
        open={!!viewCourse}
        title="Course Details"
        onClose={() => setViewCourse(null)}
        footer={
          <button
            type="button"
            onClick={() => setViewCourse(null)}
            className={`${ui.btnSecondary} w-full`}
          >
            Close
          </button>
        }
      >
        {viewCourse && (
          <div className="divide-y divide-slate-100 rounded-xl bg-slate-50 px-4">
            <DetailRow label="Name">{viewCourse.name}</DetailRow>
            <DetailRow label="Slug">{viewCourse.slug}</DetailRow>
            <DetailRow label="Code">{viewCourse.code}</DetailRow>
            <DetailRow label="Degree">{viewCourse.degree?.name}</DetailRow>
            <DetailRow label="Stream">{viewCourse.stream?.name}</DetailRow>
            <DetailRow label="Duration">
              <span className="capitalize">{durationText(viewCourse)}</span>
            </DetailRow>
            <DetailRow label="Status">
              <StatusBadge status={viewCourse.status} />
            </DetailRow>
            <DetailRow label="Description">
              {viewCourse.description || "No description available."}
            </DetailRow>
          </div>
        )}
      </Modal>

      {/* DELETE MODAL */}

      <Modal
        open={!!selectedCourse}
        title="Delete Course?"
        onClose={closeDeleteModal}
        footer={
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
        }
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <Trash2 size={22} />
        </div>

        <p className="text-sm text-slate-600">
          Are you sure you want to delete{" "}
          <strong className="text-slate-900">
            {selectedCourse?.name}
          </strong>
          ? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
