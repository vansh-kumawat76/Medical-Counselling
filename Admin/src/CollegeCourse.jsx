
import api from "./Api/axios";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Plus, Trash2 } from "lucide-react";

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
  DataTable,
  Pagination,
} from "./assets/Components/ui/ui";

const LIMIT = 10;

const emptyForm = {
  college: "",
  course: "",
  specialization: "",
  duration: "",
  totalSeats: 0,
  availableSeats: 0,
  mode: "offline",
  admissionOpen: false,
  applicationDeadline: "",
  totalFees: 0,
  yearlyFees: 0,
  currency: "INR",
  additionalCharges: [],
  eligibility: "",
  entranceExams: [],
  scholarshipAvailable: false,
  status: "active",
};

const CollegeCourse = () => {
  // ================= PERMISSIONS =================

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

      return {
        isSuperAdmin:
          user.role === "SuperAdmin" ||
          user.role?.role === "SuperAdmin",
        permissions: Array.isArray(permissions)
          ? permissions
              .map((p) => typeof p === "string" ? p : p?.name)
              .filter(Boolean)
          : [],
      };
    } catch (error) {
      console.error("CollegeCourse permission error:", error);

      return {
        isSuperAdmin: false,
        permissions: [],
      };
    }
  };

  const { isSuperAdmin, permissions } = getUserPermissions();

  const hasPermission = (permission) =>
    isSuperAdmin || permissions.includes(permission);

  const canView = hasPermission("collegeCourse.view");
  const canCreate = hasPermission("collegeCourse.create");
  const canEdit = hasPermission("collegeCourse.update");
  const canDelete = hasPermission("collegeCourse.delete");

  // ================= STATE =================

  const [collegeCourses, setCollegeCourses] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [courses, setCourses] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [entranceExams, setEntranceExams] = useState([]);

  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [page, setPage] = useState(1);

  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ================= HELPERS =================

  const getId = (item) =>
    typeof item === "object" && item !== null
      ? item._id || item.id || ""
      : item || "";

  const getName = (item) => {
    if (!item) return "N/A";

    if (typeof item === "object") {
      return item.name || item.title || item.shortName || "N/A";
    }

    return String(item);
  };

  const extractArray = (response, keys = []) => {
    const body = response?.data;

    if (Array.isArray(body)) return body;

    for (const key of keys) {
      if (Array.isArray(body?.[key])) return body[key];
      if (Array.isArray(body?.data?.[key])) return body.data[key];
    }

    if (Array.isArray(body?.data)) return body.data;

    return [];
  };

  const checkResponse = (response, message) => {
    if (
      response.data?.success === false ||
      response.data?.status === false
    ) {
      throw new Error(response.data?.message || message);
    }
  };

  const getCollegeName = (item) => getName(item.college);
  const getCourseName = (item) => getName(item.course);
  const getSpecializationName = (item) =>
    getName(item.specialization);

  const getExamNames = (item) => {
    if (!Array.isArray(item.entranceExams)) return "-";

    return item.entranceExams
      .map((exam) => getName(exam))
      .join(", ") || "-";
  };

  // ================= FETCH COLLEGE COURSES =================

  const fetchCollegeCourses = async () => {
    if (!canView) return;

    try {
      setLoading(true);

      const response = await api.get(
        "/college-course/get-all-college-courses"
      );

      checkResponse(response, "Failed to fetch college courses");

      const data = extractArray(response, ["collegeCourses"]);

      setCollegeCourses(
        [...data].sort(
          (a, b) =>
            new Date(b.createdAt || 0) -
            new Date(a.createdAt || 0)
        )
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch college courses"
      );
    } finally {
      setLoading(false);
    }
  };

  // ================= FETCH DROPDOWNS =================

  const fetchDropdowns = async () => {
    try {
      const results = await Promise.allSettled([
        api.get("/college/Search-Colleges", {
          params: {
            search: "",
            page: 1,
            limit: 100,
            sortBy: "name",
            order: "asc",
          },
        }),
        api.get("/course/Get-All-Courses"),
        api.get("/specialization/Get-All-Specializations"),
        api.get("/entrance-exam/Get-All-Entrance-Exams"),
      ]);

      if (results[0].status === "fulfilled") {
        const response = results[0].value;
        checkResponse(response, "Failed to fetch colleges");

        setColleges(
          extractArray(response, ["colleges"])
        );
      } else {
        toast.error("Unable to load colleges dropdown");
      }

      if (results[1].status === "fulfilled") {
        const response = results[1].value;
        checkResponse(response, "Failed to fetch courses");

        setCourses(
          extractArray(response, ["courses"])
        );
      } else {
        toast.error("Unable to load courses dropdown");
      }

      if (results[2].status === "fulfilled") {
        const response = results[2].value;
        checkResponse(response, "Failed to fetch specializations");

        setSpecializations(
          extractArray(response, ["specializations"])
        );
      } else {
        toast.error("Unable to load specializations dropdown");
      }

      if (results[3].status === "fulfilled") {
        const response = results[3].value;
        checkResponse(response, "Failed to fetch entrance exams");

        setEntranceExams(
          extractArray(response, ["entranceExams"])
        );
      } else {
        toast.error("Unable to load entrance exams dropdown");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to load dropdown data"
      );
    }
  };

  useEffect(() => {
    if (!canView) return;

    fetchCollegeCourses();
    fetchDropdowns();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView]);

  // ================= SEARCH / FILTER / SORT =================

  const filteredData = useMemo(() => {
    let result = [...collegeCourses];

    const searchText = search.trim().toLowerCase();

    if (searchText) {
      result = result.filter((item) =>
        [
          getCollegeName(item),
          getCourseName(item),
          getSpecializationName(item),
          item.mode,
          item.eligibility,
          item.status,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(searchText)
        )
      );
    }

    if (statusFilter !== "all") {
      result = result.filter(
        (item) =>
          String(item.status || "active").toLowerCase() ===
          statusFilter
      );
    }

    result.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();

      if (sortOrder === "newest") return dateB - dateA;
      if (sortOrder === "oldest") return dateA - dateB;

      return getCollegeName(a).localeCompare(getCollegeName(b));
    });

    return result;
  }, [collegeCourses, search, statusFilter, sortOrder]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredData.length / LIMIT)
  );

  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * LIMIT;

  const paginatedData = filteredData.slice(
    startIndex,
    startIndex + LIMIT
  );

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, sortOrder]);

  // ================= STATS =================

  const activeCount = collegeCourses.filter(
    (item) => String(item.status || "active").toLowerCase() === "active"
  ).length;

  const inactiveCount = collegeCourses.length - activeCount;

  const admissionOpenCount = collegeCourses.filter(
    (item) => item.admissionOpen
  ).length;

  // ================= FORM HELPERS =================

  const openAddModal = () => {
    if (!canCreate) {
      toast.error("You do not have permission to create college courses.");
      return;
    }

    setForm({ ...emptyForm });
    setEditingId(null);
    setShowFormModal(true);
  };

  const openEditModal = (item) => {
    if (!canEdit) {
      toast.error("You do not have permission to update college courses.");
      return;
    }

    setEditingId(getId(item));

    setForm({
      college: getId(item.college),
      course: getId(item.course),
      specialization: getId(item.specialization),
      duration: item.duration ?? "",
      totalSeats: item.totalSeats ?? 0,
      availableSeats: item.availableSeats ?? 0,
      mode: item.mode || "offline",
      admissionOpen: Boolean(item.admissionOpen),
      applicationDeadline: item.applicationDeadline
        ? new Date(item.applicationDeadline).toISOString().slice(0, 10)
        : "",
      totalFees: item.totalFees ?? 0,
      yearlyFees: item.yearlyFees ?? 0,
      currency: item.currency || "INR",
      additionalCharges: Array.isArray(item.additionalCharges)
        ? item.additionalCharges.map((charge) => ({
            name: charge.name || "",
            amount: charge.amount ?? 0,
            isMandatory: charge.isMandatory !== false,
          }))
        : [],
      eligibility: item.eligibility || "",
      entranceExams: Array.isArray(item.entranceExams)
        ? item.entranceExams.map((exam) => getId(exam))
        : [],
      scholarshipAvailable: Boolean(item.scholarshipAvailable),
      status: item.status || "active",
    });

    setSelectedItem(null);
    setShowFormModal(true);
  };

  const closeForm = () => {
    if (saving) return;

    setShowFormModal(false);
    setForm({ ...emptyForm });
    setEditingId(null);
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleExamChange = (event) => {
    const selected = Array.from(
      event.target.selectedOptions,
      (option) => option.value
    );

    setForm((prev) => ({
      ...prev,
      entranceExams: selected,
    }));
  };

  const addCharge = () => {
    setForm((prev) => ({
      ...prev,
      additionalCharges: [
        ...prev.additionalCharges,
        {
          name: "",
          amount: 0,
          isMandatory: true,
        },
      ],
    }));
  };

  const updateCharge = (index, key, value) => {
    setForm((prev) => ({
      ...prev,
      additionalCharges: prev.additionalCharges.map(
        (charge, i) =>
          i === index
            ? { ...charge, [key]: value }
            : charge
      ),
    }));
  };

  const removeCharge = (index) => {
    setForm((prev) => ({
      ...prev,
      additionalCharges: prev.additionalCharges.filter(
        (_, i) => i !== index
      ),
    }));
  };

  // ================= CREATE / UPDATE =================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (editingId ? !canEdit : !canCreate) {
      toast.error("You do not have permission to perform this action.");
      return;
    }

    if (!form.college) {
      toast.error("Please select a college");
      return;
    }

    if (!form.course) {
      toast.error("Please select a course");
      return;
    }

    if (Number(form.availableSeats) > Number(form.totalSeats)) {
      toast.error("Available seats cannot exceed total seats");
      return;
    }

    const invalidCharge = form.additionalCharges.some(
      (charge) => !charge.name.trim()
    );

    if (invalidCharge) {
      toast.error("Please enter a name for every additional charge");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        college: form.college,
        course: form.course,
        specialization: form.specialization || null,
        duration:
          form.duration === "" ? undefined : Number(form.duration),
        totalSeats: Number(form.totalSeats),
        availableSeats: Number(form.availableSeats),
        mode: form.mode,
        admissionOpen: Boolean(form.admissionOpen),
        applicationDeadline: form.applicationDeadline || null,
        totalFees: Number(form.totalFees),
        yearlyFees: Number(form.yearlyFees),
        currency: form.currency.trim().toUpperCase(),
        additionalCharges: form.additionalCharges.map((charge) => ({
          name: charge.name.trim(),
          amount: Number(charge.amount),
          isMandatory: Boolean(charge.isMandatory),
        })),
        eligibility: form.eligibility.trim(),
        entranceExams: form.entranceExams,
        scholarshipAvailable: Boolean(form.scholarshipAvailable),
        status: form.status,
      };

      const response = editingId
        ? await api.put(
            `/college-course/update-college-course/${editingId}`,
            payload
          )
        : await api.post(
            "/college-course/create-college-course",
            payload
          );

      checkResponse(response, "Unable to save college course");

      toast.success(
        response.data?.message ||
          (editingId
            ? "College course updated successfully"
            : "College course created successfully")
      );

      setShowFormModal(false);
      setForm({ ...emptyForm });
      setEditingId(null);
      setPage(1);

      await fetchCollegeCourses();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Unable to save college course"
      );
    } finally {
      setSaving(false);
    }
  };

  // ================= STATUS TOGGLE =================

  const toggleStatus = async (item) => {
    if (!canEdit) {
      toast.error("You do not have permission to update college courses.");
      return;
    }

    const id = getId(item);

    if (!id || togglingId) return;

    const newStatus =
      String(item.status || "active").toLowerCase() === "active"
        ? "inactive"
        : "active";

    try {
      setTogglingId(id);

      const response = await api.put(
        `/college-course/update-college-course/${id}`,
        { status: newStatus }
      );

      checkResponse(response, "Unable to update status");

      toast.success(
        `College course ${newStatus === "active" ? "activated" : "deactivated"} successfully`
      );

      await fetchCollegeCourses();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Unable to update status"
      );
    } finally {
      setTogglingId(null);
    }
  };

  // ================= DELETE =================

  const closeDelete = () => {
    if (deleting) return;
    setDeleteTarget(null);
  };

  const handleDelete = async () => {
    if (!canDelete) {
      toast.error("You do not have permission to delete college courses.");
      return;
    }

    if (!deleteTarget || deleting) return;

    try {
      setDeleting(true);

      const response = await api.delete(
        `/college-course/delete-college-course/${getId(deleteTarget)}`
      );

      checkResponse(response, "Unable to delete college course");

      toast.success(
        response.data?.message || "College course deleted successfully"
      );

      setDeleteTarget(null);
      await fetchCollegeCourses();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Unable to delete college course"
      );
    } finally {
      setDeleting(false);
    }
  };

  // ================= ACCESS CONTROL =================

  if (!canView) {
    return (
      <div className={ui.page}>
        <div className={`${ui.container} ${ui.card} p-8 text-center`}>
          <h1 className="text-xl font-bold text-slate-900">
            Access Denied
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            You do not have permission to view college courses.
          </p>
        </div>
      </div>
    );
  }

  // ================= TABLE COLUMNS =================

  const columns = [
    {
      header: "College",
      className: "min-w-[180px]",
      cell: (item) => (
        <p className="font-semibold text-slate-900">
          {getCollegeName(item)}
        </p>
      ),
    },
    {
      header: "Course",
      className: "min-w-[160px]",
      cell: (item) => getCourseName(item),
    },
    {
      header: "Specialization",
      className: "hidden lg:table-cell",
      cell: (item) => getSpecializationName(item),
    },
    {
      header: "Seats",
      className: "min-w-[110px]",
      cell: (item) =>
        `${item.availableSeats ?? 0} / ${item.totalSeats ?? 0}`,
    },
    {
      header: "Mode",
      className: "hidden md:table-cell",
      cell: (item) => item.mode || "N/A",
    },
    {
      header: "Admission",
      className: "hidden lg:table-cell",
      cell: (item) => (
        <span
          className={
            item.admissionOpen
              ? "font-medium text-emerald-600"
              : "font-medium text-slate-500"
          }
        >
          {item.admissionOpen ? "Open" : "Closed"}
        </span>
      ),
    },
    {
      header: "Status",
      className: "min-w-[145px]",
      cell: (item) => (
        <div className="flex items-center gap-2">
          <StatusBadge status={item.status} />

          {canEdit && (
            <StatusToggle
              checked={
                String(item.status || "active").toLowerCase() === "active"
              }
              onChange={() => toggleStatus(item)}
              disabled={togglingId !== null}
            />
          )}
        </div>
      ),
    },
  ];

  // ================= UI =================

  return (
    <div className={ui.page}>
      <div className={ui.container}>
        <PageHeader
          title="College Courses Management"
          subtitle="Manage courses, fees, seats and admission details for colleges"
          actions={
            canCreate && (
              <button
                type="button"
                onClick={openAddModal}
                className={ui.btnPrimary}
              >
                <Plus size={16} />
                Add College Course
              </button>
            )
          }
        />

        {/* STATS */}

        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className={`${ui.card} p-5`}>
            <p className="text-sm text-slate-500">Total College Courses</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {collegeCourses.length}
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

          <div className={`${ui.card} p-5`}>
            <p className="text-sm text-slate-500">Admissions Open</p>
            <p className="mt-1 text-2xl font-bold text-blue-600">
              {admissionOpenCount}
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
              placeholder="Search college, course, specialization..."
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
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className={`${ui.select} w-full lg:col-span-3`}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="college">College A-Z</option>
          </select>
        </FilterBar>

        {/* TABLE */}

        <DataTable
          columns={columns}
          rows={paginatedData}
          rowKey={(item) => getId(item)}
          startIndex={startIndex}
          loading={loading}
          emptyTitle="No college courses found"
          emptyHint="Try changing your search or filters."
          renderActions={(item) => (
            <RowActions
              onView={() => setSelectedItem(item)}
              onEdit={
                canEdit ? () => openEditModal(item) : undefined
              }
              onDelete={
                canDelete ? () => setDeleteTarget(item) : undefined
              }
            />
          )}
          renderCard={(item, index) => (
            <div
              key={getId(item) || index}
              className={`${ui.card} p-4`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">
                    {getCollegeName(item)}
                  </p>
                  <p className="text-sm text-slate-600">
                    {getCourseName(item)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Seats: {item.availableSeats ?? 0} / {item.totalSeats ?? 0}
                  </p>
                  <p className="text-xs text-slate-500">
                    Mode: {item.mode || "N/A"}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge status={item.status} />
                  {canEdit && (
                    <StatusToggle
                      checked={
                        String(item.status || "active").toLowerCase() === "active"
                      }
                      onChange={() => toggleStatus(item)}
                      disabled={togglingId !== null}
                    />
                  )}
                </div>
              </div>

              <div className="mt-3 flex justify-end border-t border-slate-100 pt-3">
                <RowActions
                  onView={() => setSelectedItem(item)}
                  onEdit={
                    canEdit ? () => openEditModal(item) : undefined
                  }
                  onDelete={
                    canDelete ? () => setDeleteTarget(item) : undefined
                  }
                />
              </div>
            </div>
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
        open={showFormModal}
        size="lg"
        title={editingId ? "Edit College Course" : "Add College Course"}
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
              form="college-course-form"
              disabled={saving}
              className={ui.btnPrimary}
            >
              {saving
                ? "Saving..."
                : editingId
                ? "Update College Course"
                : "Add College Course"}
            </button>
          </>
        }
      >
        <form
          id="college-course-form"
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          <Field label="College *">
            <select
              name="college"
              value={form.college}
              onChange={handleChange}
              required
              className={`${ui.select} w-full`}
            >
              <option value="">Select College</option>
              {colleges.map((college) => (
                <option key={getId(college)} value={getId(college)}>
                  {getName(college)}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Course *">
            <select
              name="course"
              value={form.course}
              onChange={handleChange}
              required
              className={`${ui.select} w-full`}
            >
              <option value="">Select Course</option>
              {courses.map((course) => (
                <option key={getId(course)} value={getId(course)}>
                  {getName(course)}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Specialization">
            <select
              name="specialization"
              value={form.specialization}
              onChange={handleChange}
              className={`${ui.select} w-full`}
            >
              <option value="">Select Specialization</option>
              {specializations.map((specialization) => (
                <option
                  key={getId(specialization)}
                  value={getId(specialization)}
                >
                  {getName(specialization)}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Duration (Years)">
            <input
              type="number"
              min="0"
              step="0.5"
              name="duration"
              value={form.duration}
              onChange={handleChange}
              placeholder="Enter duration"
              className={ui.input}
            />
          </Field>

          <Field label="Total Seats">
            <input
              type="number"
              min="0"
              name="totalSeats"
              value={form.totalSeats}
              onChange={handleChange}
              className={ui.input}
            />
          </Field>

          <Field label="Available Seats">
            <input
              type="number"
              min="0"
              name="availableSeats"
              value={form.availableSeats}
              onChange={handleChange}
              className={ui.input}
            />
          </Field>

          <Field label="Mode">
            <select
              name="mode"
              value={form.mode}
              onChange={handleChange}
              className={`${ui.select} w-full`}
            >
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </Field>

          <Field label="Application Deadline">
            <input
              type="date"
              name="applicationDeadline"
              value={form.applicationDeadline}
              onChange={handleChange}
              className={ui.input}
            />
          </Field>

          <Field label="Total Fees">
            <input
              type="number"
              min="0"
              name="totalFees"
              value={form.totalFees}
              onChange={handleChange}
              className={ui.input}
            />
          </Field>

          <Field label="Yearly Fees">
            <input
              type="number"
              min="0"
              name="yearlyFees"
              value={form.yearlyFees}
              onChange={handleChange}
              className={ui.input}
            />
          </Field>

          <Field label="Currency">
            <select
              name="currency"
              value={form.currency}
              onChange={handleChange}
              className={`${ui.select} w-full`}
            >
              <option value="INR">INR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </Field>

          <Field label="Entrance Exams">
            <select
              multiple
              value={form.entranceExams}
              onChange={handleExamChange}
              className={`${ui.select} w-full min-h-[100px]`}
            >
              {entranceExams.map((exam) => (
                <option key={getId(exam)} value={getId(exam)}>
                  {getName(exam)}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              Hold Ctrl to select multiple exams.
            </p>
          </Field>

         
<Field label="Eligibility Criteria *" className="md:col-span-2">
  <textarea
    name="eligibility"
    value={form.eligibility}
    onChange={handleChange}
    rows={4}
    required
    placeholder="Example: 10+2 with Physics, Chemistry and Biology with minimum 50% marks. NEET qualification required."
    className={ui.input}
  />
  <p className="mt-1 text-xs text-slate-500">
    Enter course-specific qualification, required subjects,
    minimum marks and entrance exam criteria.
  </p>
</Field>


          {/* ADDITIONAL CHARGES */}

          <div className="md:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">
                Additional Charges
              </h3>

              <button
                type="button"
                onClick={addCharge}
                className={ui.btnSecondary}
              >
                <Plus size={15} />
                Add Charge
              </button>
            </div>

            {form.additionalCharges.length === 0 && (
              <p className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">
                No additional charges added.
              </p>
            )}

            <div className="space-y-3">
              {form.additionalCharges.map((charge, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 items-end gap-3 rounded-lg border border-slate-200 p-3 sm:grid-cols-2"
                >
                  <Field label="Charge Name">
                    <input
                      value={charge.name}
                      onChange={(e) =>
                        updateCharge(index, "name", e.target.value)
                      }
                      placeholder="e.g. Hostel Fee"
                      className={ui.input}
                    />
                  </Field>

                  <Field label="Amount">
                    <input
                      type="number"
                      min="0"
                      value={charge.amount}
                      onChange={(e) =>
                        updateCharge(
                          index,
                          "amount",
                          Number(e.target.value)
                        )
                      }
                      className={ui.input}
                    />
                  </Field>

                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={charge.isMandatory}
                      onChange={(e) =>
                        updateCharge(
                          index,
                          "isMandatory",
                          e.target.checked
                        )
                      }
                    />
                    Mandatory charge
                  </label>

                  <button
                    type="button"
                    onClick={() => removeCharge(index)}
                    className="flex items-center justify-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 size={15} />
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* BOOLEAN FIELDS */}

          <div className="flex flex-wrap gap-6 md:col-span-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                name="admissionOpen"
                checked={form.admissionOpen}
                onChange={handleChange}
              />
              Admission Open
            </label>

            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                name="scholarshipAvailable"
                checked={form.scholarshipAvailable}
                onChange={handleChange}
              />
              Scholarship Available
            </label>
          </div>

          <Field label="Status">
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className={`${ui.select} w-full`}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>
        </form>
      </Modal>

      {/* VIEW MODAL */}

      <Modal
        open={!!selectedItem}
        title="College Course Details"
        onClose={() => setSelectedItem(null)}
        footer={
          <button
            type="button"
            onClick={() => setSelectedItem(null)}
            className={ui.btnSecondary}
          >
            Close
          </button>
        }
      >
        {selectedItem && (
          <div className="divide-y divide-slate-100 rounded-xl bg-slate-50 px-4">
            <DetailRow label="College">
              {getCollegeName(selectedItem)}
            </DetailRow>

            <DetailRow label="Course">
              {getCourseName(selectedItem)}
            </DetailRow>

            <DetailRow label="Specialization">
              {getSpecializationName(selectedItem)}
            </DetailRow>

            <DetailRow label="Duration">
              {selectedItem.duration ?? "-"}
            </DetailRow>

            <DetailRow label="Total Seats">
              {selectedItem.totalSeats ?? 0}
            </DetailRow>

            <DetailRow label="Available Seats">
              {selectedItem.availableSeats ?? 0}
            </DetailRow>

            <DetailRow label="Mode">
              {selectedItem.mode || "-"}
            </DetailRow>

            <DetailRow label="Admission Open">
              {selectedItem.admissionOpen ? "Yes" : "No"}
            </DetailRow>

            <DetailRow label="Application Deadline">
              {selectedItem.applicationDeadline
                ? new Date(selectedItem.applicationDeadline).toLocaleDateString()
                : "-"}
            </DetailRow>

            <DetailRow label="Total Fees">
              {selectedItem.currency || "INR"} {selectedItem.totalFees ?? 0}
            </DetailRow>

            <DetailRow label="Yearly Fees">
              {selectedItem.currency || "INR"} {selectedItem.yearlyFees ?? 0}
            </DetailRow>

            <DetailRow label="Entrance Exams">
              {getExamNames(selectedItem)}
            </DetailRow>

            <DetailRow label="Eligibility">
              {selectedItem.eligibility || "-"}
            </DetailRow>

            <DetailRow label="Scholarship Available">
              {selectedItem.scholarshipAvailable ? "Yes" : "No"}
            </DetailRow>

            <DetailRow label="Additional Charges">
              {selectedItem.additionalCharges?.length ? (
                <div className="space-y-2">
                  {selectedItem.additionalCharges.map((charge, index) => (
                    <div key={index}>
                      {charge.name}: {selectedItem.currency || "INR"}{" "}
                      {charge.amount} (
                      {charge.isMandatory ? "Mandatory" : "Optional"})
                    </div>
                  ))}
                </div>
              ) : "-"}
            </DetailRow>

            <DetailRow label="Status">
              <StatusBadge status={selectedItem.status} />
            </DetailRow>
          </div>
        )}
      </Modal>

      {/* DELETE MODAL */}

      <Modal
        open={!!deleteTarget}
        title="Delete College Course?"
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
          Do you really want to delete the course{" "}
          <strong className="text-slate-900">
            {deleteTarget ? getCourseName(deleteTarget) : ""}
          </strong>{" "}
          from{" "}
          <strong className="text-slate-900">
            {deleteTarget ? getCollegeName(deleteTarget) : ""}
          </strong>
          ? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default CollegeCourse;
