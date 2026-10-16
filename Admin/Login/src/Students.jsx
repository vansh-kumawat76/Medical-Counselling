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

/* ============================================================
   DESIGN SYSTEM — aage har component me yehi classes use karna
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

/* ============================================================
   SMALL REUSABLE PIECES
   ============================================================ */

const getRoleName = (role) =>
  typeof role === "object" && role !== null
    ? role.role || role.name || "Student"
    : role || "Student";

const Modal = ({ open, title, onClose, children }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
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

const StatusBadge = ({ status }) => (
  <span className={`${ui.badge} ${badgeColor[status] || badgeColor.default}`}>
    {status || "Pending"}
  </span>
);

const RowActions = ({ student, onView, onEdit, onDelete }) => (
  <div className="flex items-center justify-end gap-1">
    <button
      type="button"
      title="View"
      onClick={() => onView(student)}
      className={ui.iconBtnView}
    >
      <Eye size={17} />
    </button>
    <button
      type="button"
      title="Edit"
      onClick={() => onEdit(student)}
      className={ui.iconBtnEdit}
    >
      <Pencil size={17} />
    </button>
    <button
      type="button"
      title="Delete"
      onClick={() => onDelete(student)}
      className={ui.iconBtnDelete}
    >
      <Trash2 size={17} />
    </button>
  </div>
);

// Bahut pages ho to sirf aas-paas ke pages dikhata hai
const getPages = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, total, current - 1, current, current + 1]);
  const list = [...set]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
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

      {getPages(currentPage, totalPages).map((p, i) =>
        p === "..." ? (
          <span key={`d${i}`} className="px-1 text-slate-400">
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
                : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {p}
          </button>
        ),
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

// Add aur Edit dono ke liye ek hi form
const StudentFormModal = ({
  open,
  title,
  submitText,
  values,
  onChange,
  onSubmit,
  onClose,
}) => {
  const handle = (e) =>
    onChange({ ...values, [e.target.name]: e.target.value });

  return (
    <Modal open={open} title={title} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="space-y-4"
      >
        <div>
          <label className={ui.label}>Name</label>
          <input
            type="text"
            name="name"
            value={values.name || ""}
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
            value={values.email || ""}
            onChange={handle}
            placeholder="Enter email"
            required
            className={ui.input}
          />
        </div>
        <div>
          <label className={ui.label}>Phone</label>
          <input
            type="text"
            name="phone"
            value={values.phone || ""}
            onChange={handle}
            placeholder="Enter 10-digit phone number"
            inputMode="numeric"
            autoComplete="tel"
            required
            className={ui.input}
          />
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
    <span className="min-w-0 truncate text-sm font-medium text-slate-900">
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

const StudentFilters = ({ filters, onChange }) => {
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
          onChange={(e) => onChange({ search: e.target.value })}
          className={`${ui.input} pl-10`}
        />
      </div>

      <select
        value={sortBy}
        onChange={(e) => onChange({ sortBy: e.target.value })}
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
        onChange={(e) => onChange({ order: e.target.value })}
        className={`${ui.select} lg:col-span-2`}
      >
        <option value="asc">Ascending</option>
        <option value="desc">Descending</option>
      </select>

      <select
        value={role}
        onChange={(e) => onChange({ role: e.target.value })}
        className={`${ui.select} lg:col-span-2`}
      >
        <option value="">All Roles</option>
        <option value="student">Student</option>
        <option value="admin">Admin</option>
      </select>

      <select
        value={status}
        onChange={(e) => onChange({ status: e.target.value })}
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

// Desktop: table-fixed + truncate => horizontal scrollbar kabhi nahi aayega
// Mobile: cards
const StudentTable = ({ students, startIndex, onView, onEdit, onDelete }) => {
  if (students.length === 0) {
    return (
      <div className={`${ui.card} py-14 text-center text-sm text-slate-500`}>
        No students found
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
              <th className="hidden w-[11%] px-4 py-3.5 text-left font-semibold lg:table-cell">
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
            {students.map((s, i) => (
              <tr key={s._id} className="transition hover:bg-slate-50">
                <td className="px-4 py-3.5 text-slate-400">
                  {startIndex + i + 1}
                </td>
                <td
                  className="truncate px-4 py-3.5 font-semibold text-slate-900"
                  title={s.name}
                >
                  {s.name}
                </td>
                <td
                  className="truncate px-4 py-3.5 text-slate-600"
                  title={s.email}
                >
                  {s.email}
                </td>
                <td className="hidden truncate px-4 py-3.5 text-slate-600 lg:table-cell">
                  {s.phone}
                </td>
                <td className="hidden px-4 py-3.5 lg:table-cell">
                  <span className={`${ui.badge} ${badgeColor.role}`}>
                    {getRoleName(s.role)}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <StatusBadge status={s.status} />
                </td>
                <td className="px-4 py-3.5">
                  <RowActions
                    student={s}
                    onView={onView}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {students.map((s) => (
          <div key={s._id} className={`${ui.card} p-4`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-900">
                  {s.name}
                </p>
                <p className="truncate text-sm text-slate-500">{s.email}</p>
                <p className="text-sm text-slate-500">{s.phone}</p>
              </div>
              <StatusBadge status={s.status} />
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
              <span className={`${ui.badge} ${badgeColor.role}`}>
                {getRoleName(s.role)}
              </span>
              <RowActions
                student={s}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

/* ============================================================
   MAIN PAGE
   ============================================================ */

const LIMIT = 10;
const emptyForm = { name: "", email: "", phone: "" };
const defaultFilters = {
  search: "",
  sortBy: "",
  order: "asc",
  role: "",
  status: "",
};

const Students = () => {
  const [students, setStudents] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState(defaultFilters);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editStudent, setEditStudent] = useState(null);
  const [viewStudent, setViewStudent] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null); // delete

  const hasFilters = (f) => f.search.trim() || f.role || f.status || f.sortBy;

  // ================= LOAD (list ya search, dono yahin se) =================

  const loadStudents = async (page = 1, f = filters) => {
    try {
      if (hasFilters(f)) {
        const res = await api.get("/Search-Students", {
          params: {
            ...f,
            page,
            limit: LIMIT,
            sortBy: f.sortBy || "createdAt",
            order: f.sortBy ? f.order : "desc",
          },
        });
        setStudents(res.data.students || []);
        setTotalPages(res.data.totalPages || 1);
        setCurrentPage(res.data.currentPage || page);
      } else {
        const res = await api.get("/Get-All-Students", {
          params: { page, limit: LIMIT, sortBy: "createdAt", order: "desc" },
        });
        setStudents(res.data.getStudents || []);
        setTotalPages(res.data.totalPages || 1);
        setCurrentPage(res.data.currentPage || page);
      }
    } catch (error) {
      console.log("LOAD STUDENTS ERROR:", error);
      toast.error(error.response?.data?.message || "Students fetch nahi hue");
    }
  };

  useEffect(() => {
    loadStudents(1);
  }, []);

  const handleFilterChange = (patch) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    loadStudents(1, next);
  };

  const changePage = (page) => {
    if (page < 1 || page > totalPages) return;
    loadStudents(page);
  };

  // ================= ADD =================

  const addHandler = async () => {
    if (!form.name.trim() || !form.email.trim() || !String(form.phone || "").trim()) {
      toast.error("Please fill all fields");
      return;
    }

    const phone = String(form.phone).trim();
    if (!/^\d{10}$/.test(phone)) {
      toast.error("Phone number exactly 10 digits ka hona chahiye");
      return;
    }

    try {
      const generatedPassword = `Stu@${crypto.randomUUID().slice(0, 8)}A1`;

      const res = await api.post("/Add-New-Students", {
        ...form,
        phone,
        status: "active",
        password: generatedPassword,
      });

      if (res.data.status) {
        toast.success("Student created successfully!");
        toast.info(`Generated password: ${generatedPassword}`, {
          autoClose: 10000,
        });
        setShowForm(false);
        setForm(emptyForm);
        loadStudents(1);
      } else {
        toast.error(res.data.message || "Student creation failed");
      }
    } catch (error) {
      console.log("ADD STUDENT ERROR:", error);
      toast.error(error.response?.data?.message || "Student create nahi hua");
    }
  };

  // ================= EDIT =================

  const editHandler = async () => {
    if (!editStudent) return;

    const phone = String(editStudent.phone || "").trim();
    if (!/^\d{10}$/.test(phone)) {
      toast.error("Phone number exactly 10 digits ka hona chahiye");
      return;
    }

    try {
      const res = await api.put("/Edit-Data", {
        email: editStudent.email,
        name: editStudent.name,
        phone,
      });

      if (res.data.status) {
        toast.success("Student updated successfully!");
        setEditStudent(null);
        loadStudents(currentPage);
      } else {
        toast.error(res.data.message || "Student update failed");
      }
    } catch (error) {
      console.log("EDIT STUDENT ERROR:", error);
      toast.error(error.response?.data?.message || "Student update failed");
    }
  };

  // ================= DELETE =================

  const confirmDelete = async () => {
    if (!selectedStudent) return;

    try {
      const res = await api.delete("/deleted-student", {
        data: { email: selectedStudent.email },
      });

      if (res.data.status) {
        toast.success("Student deleted successfully!");
        const pageToLoad =
          students.length === 1 && currentPage > 1
            ? currentPage - 1
            : currentPage;
        loadStudents(pageToLoad);
      } else {
        toast.error(res.data.message || "Student delete failed");
      }
    } catch (error) {
      console.log("DELETE STUDENT ERROR:", error);
      toast.error(error.response?.data?.message || "Student delete failed");
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
            <p className={ui.subtitle}>Manage all students</p>
          </div>

          <button onClick={() => setShowForm(true)} className={ui.btnPrimary}>
            <Plus size={16} />
            Add New Student
          </button>
        </div>

        <StudentFilters filters={filters} onChange={handleFilterChange} />

        <StudentTable
          students={students}
          startIndex={(currentPage - 1) * LIMIT}
          onView={setViewStudent}
          onEdit={(s) => setEditStudent({ ...s })}
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
        submitText="Create Student"
        values={form}
        onChange={setForm}
        onSubmit={addHandler}
        onClose={() => setShowForm(false)}
      />

      <StudentFormModal
        open={!!editStudent}
        title="Edit Student"
        submitText="Update Student"
        values={editStudent || emptyForm}
        onChange={setEditStudent}
        onSubmit={editHandler}
        onClose={() => setEditStudent(null)}
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
