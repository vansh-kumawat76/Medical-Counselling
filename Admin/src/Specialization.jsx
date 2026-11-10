
import api from "./Api/axios";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Plus, Trash2 } from "lucide-react";
import BulkSpecializationImport from "./assets/Components/BulkSpecializationImport";

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
  /* ================= PERMISSIONS ================= */

  const getUserPermissions = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      const savedPermissions = JSON.parse(
        localStorage.getItem("permissions") || "null"
      );

      const permissions =
        savedPermissions ??
        user.permissions ??
        user.role?.permissions ??
        [];

      const permissionList = Array.isArray(permissions)
        ? permissions
            .map((permission) =>
              typeof permission === "string"
                ? permission
                : permission?.name
            )
            .filter(Boolean)
        : [];

      return {
        isSuperAdmin:
          user.role === "SuperAdmin" ||
          user.role?.role === "SuperAdmin",
        permissions: permissionList,
      };
    } catch (error) {
      console.error("Specialization permission error:", error);

      return {
        isSuperAdmin: false,
        permissions: [],
      };
    }
  };

  const { isSuperAdmin, permissions } = getUserPermissions();

  const hasPermission = (permission) =>
    isSuperAdmin || permissions.includes(permission);

  const canView = hasPermission("specialization.view");
  const canCreate = hasPermission("specialization.create");
  const canEdit = hasPermission("specialization.edit");
  const canDelete = hasPermission("specialization.delete");

  /* ================= STATE ================= */

  const [specializations, setSpecializations] = useState([]);
  const [courses, setCourses] = useState([]);

  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [page, setPage] = useState(1);

  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedSpecialization, setSelectedSpecialization] =
    useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [togglingSpecializationId, setTogglingSpecializationId] =
    useState(null);

  /* ================= FETCH ================= */

  const fetchSpecializations = async () => {
    if (!canView) return;

    try {
      setLoading(true);

      const response = await api.get(
        "/specialization/Get-All-Specializations"
      );

      if (
        response.data?.status === false ||
        response.data?.success === false
      ) {
        throw new Error(
          response.data?.message || "Failed to fetch specializations"
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
    if (!canView) return;

    try {
      const response = await api.get("/course/Get-All-Courses");

      if (
        response.data?.status === false ||
        response.data?.success === false
      ) {
        throw new Error(
          response.data?.message || "Failed to fetch courses"
        );
      }

      const data = response.data?.data ?? response.data?.courses ?? [];

      setCourses(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch courses"
      );
    }
  };

  useEffect(() => {
    if (!canView) return;

    fetchSpecializations();
    fetchCourses();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView]);

  useEffect(() => {
    const handleImported = () => {
      if (canView && canCreate) fetchSpecializations();
    };

    window.addEventListener("specializations-imported", handleImported);

    return () => {
      window.removeEventListener(
        "specializations-imported",
        handleImported
      );
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView, canCreate]);

  /* ================= HELPERS ================= */

  const getId = (item) => item?._id || item?.id;

  const getCourseName = (item) => {
    if (!item?.course) return "N/A";

    if (typeof item.course === "object") {
      return item.course.name || item.course.title || "N/A";
    }

    const course = courses.find((c) => getId(c) === item.course);

    return course?.name || course?.title || item.course;
  };

  /* ================= STATUS TOGGLE ================= */

  const toggleSpecializationStatus = async (item) => {
    if (!canEdit) {
      toast.error(
        "You do not have permission to update specializations."
      );
      return;
    }

    if (togglingSpecializationId) return;

    const specializationId = getId(item);

    if (!specializationId) {
      toast.error("Invalid specialization ID.");
      return;
    }

    const currentStatus = String(item.status || "active").toLowerCase();

    const newStatus = currentStatus === "active" ? "inactive" : "active";

    try {
      setTogglingSpecializationId(specializationId);

      const response = await api.put(
        `/specialization/Edit-Specialization/${specializationId}`,
        { status: newStatus }
      );

      if (
        response.data?.status === false ||
        response.data?.success === false
      ) {
        throw new Error(
          response.data?.message ||
            "Unable to update specialization status."
        );
      }

      toast.success(
        `Specialization ${
          newStatus === "active" ? "activated" : "deactivated"
        } successfully!`
      );

      await fetchSpecializations();
    } catch (error) {
      console.error("Toggle Specialization Status Error:", error);

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Unable to update specialization status."
      );
    } finally {
      setTogglingSpecializationId(null);
    }
  };

  /* ================= SEARCH, FILTER & SORT ================= */

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
        ].some((value) =>
          String(value || "").toLowerCase().includes(searchText)
        )
      );
    }

    if (statusFilter !== "all") {
      result = result.filter(
        (item) =>
          String(item.status || "active").toLowerCase() === statusFilter
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

  /* ================= PAGINATION ================= */

  const totalPages = Math.max(
    1,
    Math.ceil(filteredSpecializations.length / LIMIT)
  );

  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * LIMIT;

  const paginatedSpecializations = filteredSpecializations.slice(
    startIndex,
    startIndex + LIMIT
  );

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, sortOrder]);

  /* ================= FORM ================= */

  const openAddModal = () => {
    if (!canCreate) {
      toast.error(
        "You do not have permission to create specializations."
      );
      return;
    }

    setForm({ ...emptyForm });
    setEditingId(null);
    setShowFormModal(true);
  };

  const openEditModal = (item) => {
    if (!canEdit) {
      toast.error(
        "You do not have permission to edit specializations."
      );
      return;
    }

    setEditingId(getId(item));

    setForm({
      name: item.name || "",
      slug: item.slug || "",
      code: item.code || "",
      degree:
        typeof item.degree === "object"
          ? item.degree?._id || ""
          : item.degree || "",
      stream:
        typeof item.stream === "object"
          ? item.stream?._id || ""
          : item.stream || "",
      course:
        typeof item.course === "object"
          ? item.course?._id || ""
          : item.course || "",
      description: item.description || "",
      duration:
        typeof item.duration === "object"
          ? item.duration?.value ?? ""
          : item.duration ?? "",
      status: item.status || "active",
    });

    setSelectedSpecialization(null);
    setShowFormModal(true);
  };

  const closeForm = () => {
    if (saving) return;

    setShowFormModal(false);
    setForm({ ...emptyForm });
    setEditingId(null);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* ================= ADD / UPDATE ================= */

  const handleSubmit = async (e) => {
    e?.preventDefault();

    if (editingId ? !canEdit : !canCreate) {
      toast.error("You do not have permission to perform this action.");
      return;
    }

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
      setForm({ ...emptyForm });
      setEditingId(null);
      setPage(1);

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

  /* ================= DELETE ================= */

  const closeDelete = () => {
    if (deleting) return;

    setDeleteTarget(null);
  };

  const handleDelete = async () => {
    if (!canDelete) {
      toast.error(
        "You do not have permission to delete specializations."
      );
      return;
    }

    if (!deleteTarget || deleting) return;

    try {
      setDeleting(true);

      const response = await api.delete(
        `/specialization/Delete-Specialization/${getId(deleteTarget)}`
      );

      if (
        response.data?.status === false ||
        response.data?.success === false
      ) {
        throw new Error(
          response.data?.message || "Unable to delete specialization"
        );
      }

      toast.success(
        response.data?.message || "Specialization deleted successfully"
      );

      setDeleteTarget(null);

      await fetchSpecializations();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Unable to delete specialization"
      );
    } finally {
      setDeleting(false);
    }
  };

  /* ================= STATS ================= */

  const activeCount = specializations.filter(
    (item) => String(item.status || "active").toLowerCase() === "active"
  ).length;

  const inactiveCount = specializations.length - activeCount;

  /* ================= TABLE COLUMNS ================= */

  const columns = [
    {
      header: "Name",
      className: "min-w-[180px]",
      cell: (item) => (
        <div className="min-w-0">
          <p
            className="truncate font-semibold text-slate-900"
            title={item.name}
          >
            {item.name || "N/A"}
          </p>
          <p className="truncate text-xs text-slate-500">
            {item.slug || "-"}
          </p>
        </div>
      ),
    },
    {
      header: "Code",
      className: "hidden xl:table-cell",
      cell: (item) => item.code || "N/A",
    },
    {
      header: "Degree",
      className: "hidden lg:table-cell",
      cell: (item) =>
        typeof item.degree === "object"
          ? item.degree?.name || "N/A"
          : item.degree || "N/A",
    },
    {
      header: "Course",
      className: "min-w-[140px]",
      cell: (item) => (
        <span title={getCourseName(item)}>{getCourseName(item)}</span>
      ),
    },
    {
      header: "Status",
      className: "min-w-[150px]",
      cell: (item) => (
        <div className="flex items-center gap-2">
          <StatusBadge status={item.status} />

          {canEdit && (
            <StatusToggle
              checked={
                String(item.status || "active").toLowerCase() === "active"
              }
              onChange={() => toggleSpecializationStatus(item)}
              disabled={togglingSpecializationId !== null}
            />
          )}
        </div>
      ),
    },
  ];

  /* ================= ACCESS CONTROL ================= */

  if (!canView) {
    return (
      <div className={ui.page}>
        <div className={`${ui.container} ${ui.card} p-8 text-center`}>
          <h1 className="text-xl font-bold text-slate-900">
            Access Denied
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            You do not have permission to view specializations.
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

        <PageHeader
          title="Specializations Management"
          subtitle="Manage your course specializations"
          actions={
            <>
              {canCreate && (
                <BulkSpecializationImport
                  onImported={() => {
                    window.dispatchEvent(
                      new CustomEvent("specializations-imported")
                    );
                  }}
                />
              )}

              {canCreate && (
                <button
                  type="button"
                  onClick={openAddModal}
                  className={ui.btnPrimary}
                >
                  <Plus size={16} />
                  Add Specialization
                </button>
              )}
            </>
          }
        />

        {/* STATS */}

        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className={`${ui.card} p-5`}>
            <p className="text-sm text-slate-500">
              Total Specializations
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {specializations.length}
            </p>
          </div>

          <div className={`${ui.card} p-5`}>
            <p className="text-sm text-slate-500">Active</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">
              {activeCount}
            </p>
          </div>

          <div className={`${ui.card} p-5`}>
            <p className="text-sm text-slate-500">Inactive</p>
            <p className="mt-1 text-2xl font-bold text-rose-600">
              {inactiveCount}
            </p>
          </div>
        </div>

        {/* FILTERS */}

        <FilterBar
          onClear={() => {
            setSearch("");
            setStatusFilter("all");
            setSortOrder("newest");
          }}
          showClear={
            search !== "" ||
            statusFilter !== "all" ||
            sortOrder !== "newest"
          }
        >
          <div className="sm:col-span-2 lg:col-span-6">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search specializations..."
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`${ui.select} w-full lg:col-span-3`}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className={`${ui.select} w-full lg:col-span-3`}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Name A-Z</option>
          </select>
        </FilterBar>

        {/* TABLE / MOBILE CARDS */}

        <DataTable
          columns={columns}
          rows={paginatedSpecializations}
          rowKey={(item) => getId(item)}
          startIndex={startIndex}
          loading={loading}
          emptyTitle="No specializations found"
          emptyHint="Try changing your search or filters."
          renderActions={
            canView || canEdit || canDelete
              ? (item) => (
                  <RowActions
                    onView={
                      canView
                        ? () => setSelectedSpecialization(item)
                        : undefined
                    }
                    onEdit={
                      canEdit ? () => openEditModal(item) : undefined
                    }
                    onDelete={
                      canDelete ? () => setDeleteTarget(item) : undefined
                    }
                  />
                )
              : undefined
          }
          renderCard={(item, index) => (
            <div
              key={getId(item) || index}
              className={`${ui.card} p-4`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">
                    {item.name || "N/A"}
                  </p>

                  <p className="truncate text-sm text-slate-500">
                    {getCourseName(item)}
                  </p>

                  <p className="truncate text-sm text-slate-500">
                    {[
                      typeof item.degree === "object"
                        ? item.degree?.name
                        : item.degree,
                      item.code,
                    ]
                      .filter(Boolean)
                      .join(" • ") || "-"}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge status={item.status} />

                  {canEdit && (
                    <StatusToggle
                      checked={
                        String(item.status || "active").toLowerCase() ===
                        "active"
                      }
                      onChange={() => toggleSpecializationStatus(item)}
                      disabled={togglingSpecializationId !== null}
                    />
                  )}
                </div>
              </div>

              {(canView || canEdit || canDelete) && (
                <div className="mt-3 flex items-center justify-end border-t border-slate-100 pt-3">
                  <RowActions
                    onView={
                      canView
                        ? () => setSelectedSpecialization(item)
                        : undefined
                    }
                    onEdit={
                      canEdit ? () => openEditModal(item) : undefined
                    }
                    onDelete={
                      canDelete ? () => setDeleteTarget(item) : undefined
                    }
                  />
                </div>
              )}
            </div>
          )}
        />

        {/* PAGINATION */}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onChange={setPage}
        />
      </div>

      {/* ADD / EDIT MODAL */}

      <Modal
        open={showFormModal}
        size="lg"
        title={editingId ? "Edit Specialization" : "Add Specialization"}
        onClose={closeForm}
        footer={
          <>
            <button
              type="button"
              onClick={closeForm}
              disabled={saving}
              className={ui.btnSecondary}
            >
              Cancel
            </button>

            <button
              type="submit"
              form="specialization-form"
              disabled={saving}
              className={ui.btnPrimary}
            >
              {saving
                ? "Saving..."
                : editingId
                ? "Update Specialization"
                : "Add Specialization"}
            </button>
          </>
        }
      >
        <form
          id="specialization-form"
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          <Field label="Specialization Name *">
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="Enter specialization name"
              className={ui.input}
            />
          </Field>

          <Field label="Slug">
            <input
              name="slug"
              value={form.slug}
              onChange={handleChange}
              required
              placeholder="Enter slug"
              className={ui.input}
            />
          </Field>

          <Field label="Code">
            <input
              name="code"
              value={form.code}
              onChange={handleChange}
              placeholder="Enter code"
              className={ui.input}
            />
          </Field>

          <Field label="Degree">
            <input
              name="degree"
              value={form.degree}
              onChange={handleChange}
              placeholder="Enter degree"
              className={ui.input}
            />
          </Field>

          <Field label="Stream">
            <input
              name="stream"
              value={form.stream}
              onChange={handleChange}
              placeholder="Enter stream ID or name"
              className={ui.input}
            />
          </Field>

          <Field label="Course">
            <select
              name="course"
              value={form.course}
              onChange={handleChange}
              required
              className={`${ui.select} w-full`}
            >
              <option value="">Select course</option>

              {courses.map((course) => (
                <option key={getId(course)} value={getId(course)}>
                  {course.name || course.title || "Unnamed Course"}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Duration">
            <input
              type="number"
              min="0"
              name="duration"
              value={
                typeof form.duration === "object"
                  ? form.duration?.value ?? ""
                  : form.duration
              }
              onChange={handleChange}
              placeholder="Enter duration"
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
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </Field>

          <Field label="Description" className="md:col-span-2">
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              placeholder="Enter description"
              className={ui.input}
            />
          </Field>
        </form>
      </Modal>

      {/* VIEW MODAL */}

      <Modal
        open={!!selectedSpecialization}
        title="Specialization Details"
        onClose={() => setSelectedSpecialization(null)}
        footer={
          <button
            type="button"
            onClick={() => setSelectedSpecialization(null)}
            className={ui.btnSecondary}
          >
            Close
          </button>
        }
      >
        {selectedSpecialization && (
          <div className="divide-y divide-slate-100 rounded-xl bg-slate-50 px-4">
            <DetailRow label="Name">
              {selectedSpecialization.name}
            </DetailRow>

            <DetailRow label="Slug">
              {selectedSpecialization.slug}
            </DetailRow>

            <DetailRow label="Code">
              {selectedSpecialization.code}
            </DetailRow>

            <DetailRow label="Degree">
              {typeof selectedSpecialization.degree === "object"
                ? selectedSpecialization.degree?.name
                : selectedSpecialization.degree}
            </DetailRow>

            <DetailRow label="Stream">
              {typeof selectedSpecialization.stream === "object"
                ? selectedSpecialization.stream?.name
                : selectedSpecialization.stream}
            </DetailRow>

            <DetailRow label="Course">
              {getCourseName(selectedSpecialization)}
            </DetailRow>

            <DetailRow label="Duration">
              {typeof selectedSpecialization.duration === "object" &&
              selectedSpecialization.duration !== null
                ? `${selectedSpecialization.duration.value ?? ""} ${
                    selectedSpecialization.duration.unit ?? ""
                  }`.trim() || "-"
                : selectedSpecialization.duration ?? "-"}
            </DetailRow>

            <DetailRow label="Status">
              <StatusBadge status={selectedSpecialization.status} />
            </DetailRow>

            <DetailRow label="Description">
              {selectedSpecialization.description}
            </DetailRow>
          </div>
        )}
      </Modal>

      {/* DELETE CONFIRMATION */}

      <Modal
        open={!!deleteTarget}
        title="Delete Specialization?"
        onClose={closeDelete}
        footer={
          <>
            <button
              type="button"
              onClick={closeDelete}
              disabled={deleting}
              className={ui.btnSecondary}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className={ui.btnDanger}
            >
              {deleting ? "Deleting..." : "Yes, Delete"}
            </button>
          </>
        }
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <Trash2 size={22} />
        </div>

        <p className="text-sm text-slate-600">
          Do you really want to delete{" "}
          <strong className="text-slate-900">
            {deleteTarget?.name}
          </strong>
          ? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default Specialization;
