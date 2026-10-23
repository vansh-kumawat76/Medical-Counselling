
import React, { useEffect, useState } from "react";
import {
  Eye,
  Pencil,
  Trash2,
  Plus,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "./Api/axios";
import DeletedModel from "./assets/Components/DeletedModel";
import BulkStudentImport from "./assets/Components/BulkStudentImport";
const ui = {
  page: "min-h-screen bg-slate-50 p-6 lg:p-8",
  container: "mx-auto w-full max-w-6xl",
  title: "text-2xl font-bold tracking-tight text-slate-900",
  subtitle: "mt-1 text-sm text-slate-500",
  card: "rounded-2xl bg-white shadow-sm ring-1 ring-slate-200",
  input:
    "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100",
  select:
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100",
  label: "mb-1.5 block text-sm font-medium text-slate-700",
  btnPrimary:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50",
  btnSecondary:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50 active:scale-95",
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

const getRoleName = (role) =>
  typeof role === "object" && role !== null
    ? role.role || role.name || "Student"
    : role || "Student";

const getRoleId = (role) =>
  typeof role === "object" && role !== null
    ? role._id || ""
    : role || "";

const Modal = ({ open, title, onClose, children }) => {
  useEffect(() => {
    if (!open) return;

    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
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

const StatusBadge = ({ status }) => (
  <span
    className={`${ui.badge} ${
      badgeColor[String(status || "").toLowerCase()] || badgeColor.default
    }`}
  >
    {status || "Pending"}
  </span>
);

const RowActions = ({ student, onView, onEdit, onDelete, canUpdate, canDelete}) => (
  <div className="flex items-center justify-end gap-1">
    <button
      type="button"
      title="View"
      onClick={() => onView(student)}
      className={ui.iconBtnView}
    >
      <Eye size={17} />
    </button>
    {canUpdate && (
    <button
      type="button"
      title="Edit"
      onClick={() => onEdit(student)}
      className={ui.iconBtnEdit}
    >
      <Pencil size={17} />
    </button>
    )}
    {canDelete && (
    <button
      type="button"
      title="Delete"
      onClick={() => onDelete(student)}
      className={ui.iconBtnDelete}
    >
      <Trash2 size={17} />
    </button>
    )}
  </div>
);

const getPages = (current, total) => {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const pageSet = new Set([1, total, current - 1, current, current + 1]);
  const list = [...pageSet]
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b);

  const output = [];

  list.forEach((page, index) => {
    if (index > 0 && page - list[index - 1] > 1) {
      output.push("...");
    }

    output.push(page);
  });

  return output;
};

const Pagination = ({ currentPage, totalPages, onChange }) => {
  if (totalPages <= 1) return null;

  const base =
    "flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-medium transition";

  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 py-5">
      <button
        type="button"
        onClick={() => onChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className={`${base} bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-40`}
      >
        <ChevronLeft size={16} />
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
                : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
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
        className={`${base} bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-40`}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
};

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
        <div>
          <label className={ui.label}>Name</label>
          <input
            type="text"
            name="name"
            value={values?.name || ""}
            onChange={handle}
            placeholder="Enter name"
            required
            className={ui.input}
          />
        </div>

        <div>
          <label className={ui.label}>Email</label>
          <input
            type="email"
            name="email"
            value={values?.email || ""}
            onChange={handle}
            placeholder="Enter email"
            required
            disabled={title === "Edit Student"}
            className={`${ui.input} disabled:bg-slate-100`}
          />
        </div>

        <div>
          <label className={ui.label}>Phone</label>
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
        </div>

        <div>
          <label className={ui.label}>Role</label>
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
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className={`${ui.btnSecondary} flex-1`}
          >
            Cancel
          </button>
          <button type="submit" className={`${ui.btnPrimary} flex-1`}>
            {submitText}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const DetailRow = ({ label, children }) => (
  <div className="flex items-center justify-between gap-4 py-3">
    <span className="text-sm text-slate-500">{label}</span>
    <span className="min-w-0 truncate text-right text-sm font-medium text-slate-900">
      {children}
    </span>
  </div>
);

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

// ================= FILTERS =================

const StudentFilters = ({ filters, onChange, roles = [] }) => {
  const { search, sortBy, order, role, status } = filters;

  return (
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
          placeholder="Search name, email or phone..."
          value={search}
          onChange={(event) => onChange({ search: event.target.value })}
          className={`${ui.input} pl-10`}
        />
      </div>

      <select
        value={sortBy}
        onChange={(event) => onChange({ sortBy: event.target.value })}
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
        value={order}
        onChange={(event) => onChange({ order: event.target.value })}
        className={`${ui.select} lg:col-span-2`}
      >
        <option value="asc">Ascending</option>
        <option value="desc">Descending</option>
      </select>

      <select
        value={role}
        onChange={(event) => onChange({ role: event.target.value })}
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
        value={status}
        onChange={(event) => onChange({ status: event.target.value })}
        className={`${ui.select} lg:col-span-2`}
      >
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="pending">Pending</option>
      </select>
    </div>
  );
};

// ================= TABLE + MOBILE CARDS =================

const StudentTable = ({
  students,
  startIndex,
  onView,
  onEdit,
  onDelete,
  canUpdate,
  canDelete
}) => {
  if (students.length === 0) {
    return (
      <div className={`${ui.card} py-14 text-center text-sm text-slate-500`}>
        No student records available at the moment
      </div>
    );
  }

  return (
    <>
      <div className={`${ui.card} hidden overflow-hidden md:block`}>
        <table className="w-full table-fixed text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="w-12 px-4 py-3.5 text-left font-semibold">#</th>
              <th className="w-[20%] px-4 py-3.5 text-left font-semibold">
                Name
              </th>
              <th className="px-4 py-3.5 text-left font-semibold">Email</th>
              <th className="hidden w-[14%] px-4 py-3.5 text-left font-semibold lg:table-cell">
                Phone
              </th>
              <th className="hidden w-[13%] px-4 py-3.5 text-left font-semibold lg:table-cell">
                Role
              </th>
              <th className="w-[12%] px-4 py-3.5 text-left font-semibold">
                Status
              </th>
              <th className="w-32 px-4 py-3.5 text-right font-semibold">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {students.map((student, index) => (
              <tr key={student._id} className="transition hover:bg-slate-50">
                <td className="px-4 py-3.5 text-slate-400">
                  {startIndex + index + 1}
                </td>
                <td
                  className="truncate px-4 py-3.5 font-semibold text-slate-900"
                  title={student.name}
                >
                  {student.name}
                </td>
                <td
                  className="truncate px-4 py-3.5 text-slate-600"
                  title={student.email}
                >
                  {student.email}
                </td>
                <td className="hidden truncate px-4 py-3.5 text-slate-600 lg:table-cell">
                  {student.phone}
                </td>
                <td className="hidden px-4 py-3.5 lg:table-cell">
                  <span className={`${ui.badge} ${badgeColor.role}`}>
                    {getRoleName(student.role)}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <StatusBadge status={student.status} />
                </td>
                <td className="px-4 py-3.5">
                  <RowActions
                    student={student}
                    onView={onView}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    canUpdate={canUpdate}
                    canDelete={canDelete}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {students.map((student) => (
          <div key={student._id} className={`${ui.card} p-4`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-900">
                  {student.name}
                </p>
                <p className="truncate text-sm text-slate-500">
                  {student.email}
                </p>
                <p className="text-sm text-slate-500">{student.phone}</p>
              </div>
              <StatusBadge status={student.status} />
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
              <span className={`${ui.badge} ${badgeColor.role}`}>
                {getRoleName(student.role)}
              </span>
              <RowActions
                student={student}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
                canUpdate={canUpdate}
                canDelete={canDelete}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

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
    localStorage.getItem("permissions") || "[]"
  ).map((permission)=>
  typeof permission === "string" ? permission.toLowerCase() : "");

  const canCreate = permissions.includes("student.create");
  const canUpdate = permissions.includes("student.update");
  const canDelete = permissions.includes("student.delete");
  const canBulkImport = permissions.includes("student.bulk");

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

  const hasFilters = (filterValues) =>
    Boolean(
      filterValues.search.trim() ||
        filterValues.role ||
        filterValues.status ||
        filterValues.sortBy
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
        (item) => item.role !== "SuperAdmin"
      );

      setRoles(assignableRoles);

      const studentRole = assignableRoles.find(
        (item) => item.role?.toLowerCase() === "student"
      );

      setForm((previous) => ({
        ...previous,
        role: previous.role || studentRole?._id || "",
      }));
    } catch (error) {
      console.error("LOAD ROLES ERROR:", error);
      toast.error(
        error.response?.data?.message ||
          "Unable to load roles. Please try again later"
      );
    }
  };

  // ================= LOAD STUDENTS =================

  const loadStudents = async (page = 1, filterValues = filters) => {
    try {
      if (hasFilters(filterValues)) {
        const res = await api.get("/student/Search-Students", {
          params: {
            search: filterValues.search,
            role: filterValues.role,
            status: filterValues.status,
            page,
            limit: LIMIT,
            sortBy: filterValues.sortBy || "createdAt",
            order: filterValues.sortBy ? filterValues.order : "desc",
          },
        });

        setStudents(res.data.students || []);
        setTotalPages(res.data.totalPages || 1);
        setCurrentPage(res.data.currentPage || page);
      } else {
        const res = await api.get("/student/Get-All-Students", {
          params: {
            page,
            limit: LIMIT,
          },
        });

        setStudents(res.data.getStudents || []);
        setTotalPages(res.data.totalPages || 1);
        setCurrentPage(res.data.currentPage || page);
      }
    } catch (error) {
      console.error("LOAD STUDENTS ERROR:", error);
      toast.error(
        error.response?.data?.message || "Unable to load student records. Please try again later"
      );
    }
  };

  useEffect(() => {
    loadStudents(1);
    loadRoles();
  }, []);

  const handleFilterChange = (patch) => {
    const nextFilters = { ...filters, ...patch };
    setFilters(nextFilters);
    loadStudents(1, nextFilters);
  };

  const changePage = (page) => {
    if (page < 1 || page > totalPages) return;
    loadStudents(page);
  };

  const getDefaultForm = () => {
    const studentRole = roles.find(
      (item) => item.role?.toLowerCase() === "student"
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
      toast.error("Please complete all required fields and select a role to continue");
      return;
    }

    const phone = String(form.phone).trim();

    if (!/^\d{10}$/.test(phone)) {
      toast.error("Please enter a valid 10-digit phone number.");
      return;
    }

    try {
      const res = await api.post("/student/Add-New-Students", {
        ...form,
        phone,
        role: form.role,
        status: "active",
      });

      if (res.data.status) {
        toast.success(res.data.message || "Account has been created successfully");
        setShowForm(false);
        setForm(getDefaultForm());
        await loadStudents(1);
      } else {
        toast.error(res.data.message || "Unable to create the account. Please try again.");
      }
    } catch (error) {
      console.error("ADD STUDENT ERROR:", error);
      toast.error(
        error.response?.data?.message || "Unable to create the student record. Please try again."
      );
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
        toast.error(res.data.message || "Unable to update the student record. Please try again");
      }
    } catch (error) {
      console.error("EDIT STUDENT ERROR:", error);
      toast.error(
        error.response?.data?.message || "Unable to update the student record. Please try again"
      );
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
        toast.error(res.data.message || "Unable to delete the student record. Please try again");
      }
    } catch (error) {
      console.error("DELETE STUDENT ERROR:", error);
      toast.error(
        error.response?.data?.message || "Unable to delete the student record. Please try again"
      );
    }

    setSelectedStudent(null);
  };

  // ================= UI =================

  return (
    <div className={ui.page}>
      <div className={ui.container}>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className={ui.title}>Students</h1>
            <p className={ui.subtitle}>Manage all students and assigned roles</p>
          </div>

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
         {canBulkImport && <BulkStudentImport />}
        </div>

        <StudentFilters
          filters={filters}
          onChange={handleFilterChange}
          roles={roles}
        />

        <StudentTable
          students={students}
          startIndex={(currentPage - 1) * LIMIT}
          onView={setViewStudent}
          onEdit={(student) =>
            setEditStudent({
              ...student,
              role: getRoleId(student.role),
            })
          }
          canUpdate={canUpdate}
          canDelete={canDelete}
          onDelete={setSelectedStudent}
        />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onChange={changePage}
        />
      </div>

      <StudentFormModal
        open={showForm}
        title="Add New Student"
        submitText="Create Account"
        values={form}
        onChange={setForm}
        onSubmit={addHandler}
        onClose={() => setShowForm(false)}
        roles={roles}
      />

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

      <StudentViewModal
        student={viewStudent}
        onClose={() => setViewStudent(null)}
      />

      <DeletedModel
        show={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default Students;
