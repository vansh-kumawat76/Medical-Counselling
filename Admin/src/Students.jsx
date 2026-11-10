import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "react-toastify";
import api from "./Api/axios";
import DeletedModel from "./assets/Components/DeletedModel";
import BulkStudentImport from "./assets/Components/BulkStudentImport";
import {
  ui,
  badgeColor,
  PageHeader,
  Modal,
  Field,
  DetailRow,
  StatusBadge,
  StatusToggle,
  Avatar,
  RowActions,
  FilterBar,
  SearchInput,
  DataTable,
  Pagination,
} from "./assets/Components/ui/ui";

const getRoleName = (role) =>
  typeof role === "object" && role !== null
    ? role.role || role.name || "Student"
    : role || "Student";

const getRoleId = (role) =>
  typeof role === "object" && role !== null ? role._id || "" : role || "";

// ================= ADD / EDIT FORM =================

const StudentFormModal = ({
  open,
  title,
  submitText,
  values,
  onChange,
  onSubmit,
  onClose,
  roles = [],
  isCreating = false,
}) => {
  const handle = (event) => {
    onChange({
      ...values,
      [event.target.name]: event.target.value,
    });
  };

  return (
    <Modal open={open} title={title} onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
        className="space-y-4"
      >
        <Field label="Name">
          <input
            type="text"
            name="name"
            value={values?.name || ""}
            onChange={handle}
            placeholder="Enter name"
            required
            className={ui.input}
          />
        </Field>

        <Field label="Email">
          <input
            type="email"
            name="email"
            value={values?.email || ""}
            onChange={handle}
            placeholder="Enter email"
            required
            disabled={title === "Edit Student"}
            className={ui.input}
          />
        </Field>

        <Field label="Phone">
          <input
            type="text"
            name="phone"
            value={values?.phone ?? ""}
            onChange={handle}
            placeholder="Enter 10-digit phone number"
            inputMode="numeric"
            autoComplete="tel"
            maxLength={10}
            required
            className={ui.input}
          />
        </Field>

        <Field label="Role">
          <select
            name="role"
            value={getRoleId(values?.role)}
            onChange={handle}
            required
            className={ui.select}
          >
            <option value="">Select Role</option>

            {roles.map((role) => (
              <option key={role._id} value={role._id}>
                {role.role || role.name}
              </option>
            ))}
          </select>
        </Field>

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            className={`${ui.btnSecondary} sm:flex-1`}
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isCreating}
            className={`${ui.btnPrimary} sm:flex-1`}
          >
            {isCreating ? "Creating Account..." : submitText}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ================= STUDENT DETAILS =================

const StudentViewModal = ({ student, onClose }) => (
  <Modal open={!!student} title="Student Details" onClose={onClose}>
    {student && (
      <>
        <div className="divide-y divide-slate-100 rounded-xl bg-slate-50 px-4">
          <DetailRow label="Name">{student.name}</DetailRow>

          <DetailRow label="Email">{student.email}</DetailRow>

          <DetailRow label="Phone">{student.phone}</DetailRow>

          <DetailRow label="Role">
            <span className={`${ui.badge} ${badgeColor.role}`}>
              {getRoleName(student.role)}
            </span>
          </DetailRow>

          <DetailRow label="Status">
            <StatusBadge status={student.status} />
          </DetailRow>
        </div>

        <button
          type="button"
          onClick={onClose}
          className={`${ui.btnPrimary} mt-5 w-full`}
        >
          Close
        </button>
      </>
    )}
  </Modal>
);

// ================= MAIN PAGE =================

const LIMIT = 10;

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  role: "",
};

const defaultFilters = {
  search: "",
  sortBy: "",
  order: "asc",
  role: "",
  status: "",
};

const Students = () => {
  const permissions = JSON.parse(
    localStorage.getItem("permissions") || "[]",
  ).map((permission) =>
    typeof permission === "string" ? permission.toLowerCase() : "",
  );

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const isSuperAdmin = user?.role?.toLowerCase() === "superadmin";

  const canCreate = isSuperAdmin || permissions.includes("student.create");
  const canUpdate = isSuperAdmin || permissions.includes("student.update");
  const canDelete = isSuperAdmin || permissions.includes("student.delete");
  const canBulkImport = isSuperAdmin || permissions.includes("student.bulk");

  console.log("User :", user);
  console.log("isSuperAdmin :", isSuperAdmin);
  console.log("permissions:", permissions);
  console.log("canBulkImport:", canBulkImport);

  const [students, setStudents] = useState([]);
  const [roles, setRoles] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [filters, setFilters] = useState(defaultFilters);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const [editStudent, setEditStudent] = useState(null);
  const [viewStudent, setViewStudent] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [isCreating, setIsCreating] = useState(false);

  // STATUS UPDATE LOADING STATE
  const [updatingStatus, setUpdatingStatus] = useState(null);

  const hasFilters = (filterValues) =>
    Boolean(
      filterValues.search.trim() ||
      filterValues.role ||
      filterValues.status ||
      filterValues.sortBy,
    );

  // ================= LOAD ROLES =================

  const loadRoles = async () => {
    try {
      const res = await api.get("/roles/Get-Roles");

      const data = res.data;

      const roleList = Array.isArray(data)
        ? data
        : data.roles || data.getRoles || data.data || [];

      if (!Array.isArray(roleList)) {
        throw new Error("Unable to retrieve roles. Please try again later");
      }

      const assignableRoles = roleList.filter(
        (item) => item.role !== "SuperAdmin",
      );

      setRoles(assignableRoles);

      const studentRole = assignableRoles.find(
        (item) => item.role?.toLowerCase() === "student",
      );

      setForm((previous) => ({
        ...previous,
        role: previous.role || studentRole?._id || "",
      }));
    } catch (error) {
      console.error("LOAD ROLES ERROR:", error);

      toast.error(
        error.response?.data?.message ||
          "Unable to load roles. Please try again later",
      );
    }
  };

  // ================= LOAD STUDENTS =================

  const loadStudents = async (page = 1, filterValues = filters) => {
    try {
      const params = {
        search: filterValues.search,
        role: filterValues.role,
        status: filterValues.status,
        page,
        limit: LIMIT,
        sortBy: filterValues.sortBy || "createdAt",
        order: filterValues.order || "desc",
      };

      if (hasFilters(filterValues)) {
        const res = await api.get("/student/Search-Students", { params });

        setStudents(res.data.students || []);
        setTotalPages(res.data.totalPages || 1);
        setCurrentPage(res.data.currentPage || page);
      } else {
        const res = await api.get("/student/Get-All-Students", {
          params: {
            page,
            limit: LIMIT,
            sortBy: params.sortBy,
            order: params.order,
          },
        });

        setStudents(res.data.getStudents || []);
        setTotalPages(res.data.totalPages || 1);
        setCurrentPage(res.data.currentPage || page);
      }
    } catch (error) {
      console.error("LOAD STUDENTS ERROR:", error);

      toast.error(
        error.response?.data?.message ||
          "Unable to load student records. Please try again later",
      );
    }
  };

  useEffect(() => {
    loadStudents(1);
    loadRoles();
  }, []);

  // ================= FILTER CHANGE =================

  const handleFilterChange = (patch) => {
    const nextFilters = { ...filters, ...patch };

    setFilters(nextFilters);
    loadStudents(1, nextFilters);
  };

  // ================= PAGE CHANGE =================

  const changePage = (page) => {
    if (page < 1 || page > totalPages) return;

    loadStudents(page);
  };

  // ================= DEFAULT FORM =================

  const getDefaultForm = () => {
    const studentRole = roles.find(
      (item) => item.role?.toLowerCase() === "student",
    );

    return {
      ...emptyForm,
      role: studentRole?._id || "",
    };
  };

  // ================= ADD =================

  const addHandler = async () => {
    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !String(form.phone || "").trim() ||
      !form.role
    ) {
      toast.error(
        "Please complete all required fields and select a role to continue",
      );
      return;
    }

    const phone = String(form.phone).trim();

    if (!/^\d{10}$/.test(phone)) {
      toast.error("Please enter a valid 10-digit phone number.");
      return;
    }

    if (isCreating) return;

    setIsCreating(true);

    try {
      const res = await api.post("/student/Add-New-Students", {
        ...form,
        phone,
        role: form.role,
        status: "active",
      });

      if (res.data.status) {
        toast.success(
          res.data.message || "Account has been created successfully",
        );

        setShowForm(false);
        setForm(getDefaultForm());

        await loadStudents(1);
      } else {
        toast.error(
          res.data.message || "Unable to create the account. Please try again.",
        );
      }
    } catch (error) {
      console.error("ADD STUDENT ERROR:", error);

      toast.error(
        error.response?.data?.message ||
          "Unable to create the student record. Please try again.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  // ================= EDIT =================

  const editHandler = async () => {
    if (!editStudent) return;

    const phone = String(editStudent.phone || "").trim();

    if (!/^\d{10}$/.test(phone)) {
      toast.error("Please enter a valid 10-digit phone number.");
      return;
    }

    if (!getRoleId(editStudent.role)) {
      toast.error("Please select a role to continue.");
      return;
    }

    try {
      const res = await api.put("/student/Edit-Data", {
        email: editStudent.email,
        name: editStudent.name,
        phone,
        role: getRoleId(editStudent.role),
      });

      if (res.data.status) {
        toast.success("Student record has been updated successfully.");

        setEditStudent(null);

        await loadStudents(currentPage);
      } else {
        toast.error(
          res.data.message ||
            "Unable to update the student record. Please try again",
        );
      }
    } catch (error) {
      console.error("EDIT STUDENT ERROR:", error);

      toast.error(
        error.response?.data?.message ||
          "Unable to update the student record. Please try again",
      );
    }
  };

  // ================= STATUS TOGGLE =================

  const toggleStudentStatus = async (student) => {
    if (updatingStatus) return;

    const newStatus =
      student.status?.toLowerCase() === "active" ? "inactive" : "active";

    try {
      setUpdatingStatus(student._id);

      const res = await api.put("/student/Edit-Data", {
        email: student.email,
        status: newStatus,
      });

      if (res.data.status) {
        toast.success(`Student status updated to ${newStatus}`);

        // Reload list so active/inactive filters remain accurate.
        await loadStudents(currentPage);
      } else {
        toast.error(res.data.message || "Status update failed");
      }
    } catch (error) {
      console.error("STATUS UPDATE ERROR:", error);

      toast.error(
        error.response?.data?.message || "Unable to update student status",
      );
    } finally {
      setUpdatingStatus(null);
    }
  };

  // ================= DELETE =================

  const confirmDelete = async () => {
    if (!selectedStudent) return;

    try {
      const res = await api.delete("/student/deleted-student", {
        data: { email: selectedStudent.email },
      });

      if (res.data.status) {
        toast.success("Student record has been deleted successfully");

        const pageToLoad =
          students.length === 1 && currentPage > 1
            ? currentPage - 1
            : currentPage;

        await loadStudents(pageToLoad);
      } else {
        toast.error(
          res.data.message ||
            "Unable to delete the student record. Please try again",
        );
      }
    } catch (error) {
      console.error("DELETE STUDENT ERROR:", error);

      toast.error(
        error.response?.data?.message ||
          "Unable to delete the student record. Please try again",
      );
    }

    setSelectedStudent(null);
  };

  // ================= TABLE CONFIG (UI only) =================

  const renderToggle = (student) =>
    canUpdate && (
      <StatusToggle
        checked={student.status?.toLowerCase() === "active"}
        disabled={updatingStatus === student._id}
        onChange={() => toggleStudentStatus(student)}
        label={`Click to make ${
          student.status?.toLowerCase() === "active" ? "Inactive" : "Active"
        }`}
      />
    );

  const columns = [
    {
      header: "Name",
      className: "w-[22%]",
      cell: (student) => (
        <div className="flex items-center gap-3">
          <Avatar name={student.name} size="sm" />
          <span
            className="truncate font-semibold text-slate-900"
            title={student.name}
          >
            {student.name}
          </span>
        </div>
      ),
    },
    {
      header: "Email",
      truncate: true,
      cell: (student) => <span title={student.email}>{student.email}</span>,
    },
    {
      header: "Phone",
      className: "w-[14%]",
      hideBelow: "lg",
      cell: (student) => student.phone,
    },
    {
      header: "Role",
      className: "w-[13%]",
      hideBelow: "lg",
      cell: (student) => (
        <span className={`${ui.badge} ${badgeColor.role}`}>
          {getRoleName(student.role)}
        </span>
      ),
    },
    {
      header: "Status",
      className: "w-[22%]",
      cell: (student) => (
        <div className="flex items-center gap-3">
          <StatusBadge status={student.status} />
          {renderToggle(student)}
        </div>
      ),
    },
  ];

  const renderActions = (student) => (
    <RowActions
      onView={() => setViewStudent(student)}
      onEdit={
        canUpdate
          ? () => setEditStudent({ ...student, role: getRoleId(student.role) })
          : undefined
      }
      onDelete={canDelete ? () => setSelectedStudent(student) : undefined}
    />
  );

  const renderCard = (student) => (
    <>
      <div className="flex items-start gap-3">
        <Avatar name={student.name} />

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-900">
            {student.name}
          </p>
          <p className="truncate text-sm text-slate-500">{student.email}</p>
          <p className="text-sm text-slate-500">{student.phone}</p>
        </div>

        <StatusBadge status={student.status} />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <div className="flex items-center gap-3">
          <span className={`${ui.badge} ${badgeColor.role}`}>
            {getRoleName(student.role)}
          </span>
          {renderToggle(student)}
        </div>

        {renderActions(student)}
      </div>
    </>
  );

  // ================= UI =================

  return (
    <div className={ui.page}>
      <div className={ui.container}>
        <PageHeader
          title="Student Management"
          subtitle="Manage all students and assigned roles"
          actions={
            <>
              {canBulkImport && <BulkStudentImport />}

              {canCreate && (
                <button
                  type="button"
                  onClick={() => {
                    setForm(getDefaultForm());
                    setShowForm(true);
                  }}
                  className={ui.btnPrimary}
                >
                  <Plus size={16} />
                  Add New Student
                </button>
              )}
            </>
          }
        />

        <FilterBar
          showClear={hasFilters(filters)}
          onClear={() => handleFilterChange(defaultFilters)}
        >
          <SearchInput
            className="col-span-2 lg:col-span-4"
            placeholder="Search name, email or phone..."
            value={filters.search}
            onChange={(value) => handleFilterChange({ search: value })}
          />

          <select
            value={filters.sortBy}
            onChange={(event) =>
              handleFilterChange({ sortBy: event.target.value })
            }
            className={`${ui.select} lg:col-span-2`}
          >
            <option value="">Sort By</option>
            <option value="name">Name</option>
            <option value="email">Email</option>
            <option value="phone">Phone</option>
            <option value="role">Role</option>
            <option value="status">Status</option>
          </select>

          <select
            value={filters.order}
            onChange={(event) =>
              handleFilterChange({ order: event.target.value })
            }
            className={`${ui.select} lg:col-span-2`}
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>

          <select
            value={filters.role}
            onChange={(event) =>
              handleFilterChange({ role: event.target.value })
            }
            className={`${ui.select} lg:col-span-2`}
          >
            <option value="">All Roles</option>

            {roles.map((item) => (
              <option key={item._id} value={item.role}>
                {item.role || item.name}
              </option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(event) =>
              handleFilterChange({ status: event.target.value })
            }
            className={`${ui.select} lg:col-span-2`}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
        </FilterBar>

        <DataTable
          columns={columns}
          rows={students}
          startIndex={(currentPage - 1) * LIMIT}
          renderActions={renderActions}
          renderCard={renderCard}
          emptyTitle="No student records available at the moment"
        />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onChange={changePage}
        />
      </div>

      {/* ADD STUDENT MODAL */}

      <StudentFormModal
        open={showForm}
        title="Add New Student"
        submitText="Create Account"
        isCreating={isCreating}
        values={form}
        onChange={setForm}
        onSubmit={addHandler}
        onClose={() => setShowForm(false)}
        roles={roles}
      />

      {/* EDIT STUDENT MODAL */}

      <StudentFormModal
        open={!!editStudent}
        title="Edit Student"
        submitText="Update Student"
        values={editStudent || emptyForm}
        onChange={setEditStudent}
        onSubmit={editHandler}
        onClose={() => setEditStudent(null)}
        roles={roles}
      />

      {/* VIEW STUDENT MODAL */}

      <StudentViewModal
        student={viewStudent}
        onClose={() => setViewStudent(null)}
      />

      {/* DELETE STUDENT MODAL */}

      <DeletedModel
        show={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default Students;
