
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Eye,
  Pencil,
  Trash2,
  Plus,
  Search,
  X,
  BadgeCheck,
  Check,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DeletedModel from "./assets/Components/DeletedModel";
import BulkCollegeImport from "./assets/Components/BulkCollegeImport";
const API = "http://localhost:8090";

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

/* ================= REUSABLE COMPONENTS ================= */

const Modal = ({ open, title, onClose, children, size = "md" }) => {
  useEffect(() => {
    if (!open) return;

    const onKey = (e) => {
      if (e.key === "Escape") onClose();
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
    {status || "pending"}
  </span>
);

const RowActions = ({ item, onView, onEdit, onDelete }) => (
  <div className="flex items-center justify-end gap-1">
    <button
      type="button"
      title="View"
      onClick={() => onView(item)}
      className={ui.iconBtnView}
    >
      <Eye size={17} />
    </button>

    <button
      type="button"
      title="Edit"
      onClick={() => onEdit(item)}
      className={ui.iconBtnEdit}
    >
      <Pencil size={17} />
    </button>

    <button
      type="button"
      title="Delete"
      onClick={() => onDelete(item)}
      className={ui.iconBtnDelete}
    >
      <Trash2 size={17} />
    </button>
  </div>
);

const getPages = (current, total) => {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pageSet = new Set([1, total, current - 1, current, current + 1]);

  const list = [...pageSet]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);

  const output = [];

  list.forEach((p, i) => {
    if (i > 0 && p - list[i - 1] > 1) {
      output.push("...");
    }
    output.push(p);
  });

  return output;
};

const Pagination = ({ currentPage, totalPages, onChange }) => {
  if (totalPages <= 1) return null;

  const base = "h-9 min-w-9 rounded-lg px-3 text-sm font-medium transition";
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

      {getPages(currentPage, totalPages).map((p, i) =>
        p === "..." ? (
          <span key={`dots-${i}`} className="px-1 text-slate-400">
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
                : idle
            }`}
          >
            {p}
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

const CollegeLogo = ({ college }) =>
  college.logo ? (
    <img
      src={college.logo}
      alt={college.name || "College logo"}
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
      className="h-10 w-10 shrink-0 rounded-xl object-cover ring-1 ring-slate-200"
    />
  ) : (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-lg">
      🏫
    </div>
  );

const VerifiedMark = ({ verified }) =>
  verified ? (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
      <BadgeCheck size={14} /> Verified
    </span>
  ) : (
    <span className="text-xs text-slate-400">Not verified</span>
  );

/* ================= CONSTANTS ================= */

const COLLEGE_TYPES = [
  "government",
  "private",
  "deemed",
  "autonomous",
  "public",
];

const LIMIT = 10;

const initialForm = {
  name: "",
  slug: "",
  logo: "",
  description: "",
  collegeType: "",
  ownership: "",
  establishedYear: "",
  address: "",
  city: "",
  state: "",
  country: "",
  pincode: "",
  website: "",
  contactEmail: "",
  contactPhone: "",
  isVerified: false,
  status: "pending",
};

const defaultFilters = {
  search: "",
  collegeType: "",
  status: "",
  sortBy: "",
  order: "desc",
};

/* ================= MAIN PAGE ================= */

const Colleges = () => {
  const [colleges, setColleges] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [editCollege, setEditCollege] = useState(null);
  const [viewCollege, setViewCollege] = useState(null);
  const [form, setForm] = useState(initialForm);

  const [selectedCollege, setSelectedCollege] = useState(null);
  const [messageModal, setMessageModal] = useState(null);

  // ================= AUTH HEADERS =================

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  // ================= SUCCESS / ERROR MESSAGE =================

  const showMessage = (message, type = "success") => {
    setMessageModal({
      title: type === "success" ? "Success!" : "Operation Failed",
      message,
      type,
    });

    if (type === "success") {
      toast.success(message);
    } else {
      toast.error(message);
    }
  };

  // ================= GET COLLEGES =================

  const fetchColleges = async (page = 1, f = filters) => {
    try {
      const res = await axios.get(`${API}/college/Search-Colleges`, {
        params: {
          search: f.search,
          collegeType: f.collegeType,
          status: f.status,
          page,
          limit: LIMIT,

          // Default sorting: newest college first.
          sortBy: f.sortBy || "createdAt",
          order: f.order || "desc",
        },
        headers: getHeaders(),
      });

      const data = res.data;

      setColleges(Array.isArray(data.colleges) ? data.colleges : []);
      setTotalPages(Math.max(1, Number(data.totalPages) || 1));
      setCurrentPage(Number(data.currentPage) || page);
    } catch (error) {
      console.error(
        "Fetch Colleges Error:",
        error.response?.data || error.message
      );

      toast.error(
        error.response?.data?.message || "Colleges could not be loaded"
      );
    }
  };

  useEffect(() => {
    fetchColleges(1, defaultFilters);
  }, []);

  // ================= FILTERS =================

  const handleFilterChange = (patch) => {
    const next = { ...filters, ...patch };

    setFilters(next);
    fetchColleges(1, next);
  };

  // ================= FORM CHANGE =================

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Phone number: digits only, maximum 10 digits.
    if (name === "contactPhone") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 10);

      setForm((prev) => ({
        ...prev,
        contactPhone: digitsOnly,
      }));

      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ================= PHONE VALIDATION =================

  const validateCollegeForm = () => {
    if (!/^\d{10}$/.test(form.contactPhone)) {
      showMessage(
        "Phone number must contain exactly 10 digits",
        "error"
      );
      return false;
    }

    return true;
  };

  // ================= RESET FORM =================

  const resetForm = () => {
    setForm({ ...initialForm });
  };

  const closeForm = () => {
    setShowForm(false);
    setEditCollege(null);
    resetForm();
  };

  const openAdd = () => {
    resetForm();
    setEditCollege(null);
    setShowForm(true);
  };

  // ================= PREPARE COLLEGE DATA =================

  const getCollegeData = () => ({
    name: form.name.trim(),
    slug: form.slug.trim(),
    logo: form.logo.trim(),
    description: form.description,
    collegeType: form.collegeType,
    ownership: form.ownership,
    establishedYear: form.establishedYear
      ? Number(form.establishedYear)
      : undefined,

    location: {
      address: form.address,
      city: form.city,
      state: form.state,
      country: form.country,
      pincode: form.pincode,
    },

    website: form.website,
    contact: {
      email: form.contactEmail,
      phone: form.contactPhone,
    },

    isVerified: form.isVerified,
    status: form.status,
  });

  // ================= ADD COLLEGE =================

  const addCollege = async () => {
    if (!validateCollegeForm()) return;

    try {
      const res = await axios.post(
        `${API}/college/Add-New-College`,
        getCollegeData(),
        {
          headers: getHeaders(),
        }
      );

      if (res.data.status) {
        closeForm();
        showMessage(
          res.data.message || "College added successfully",
          "success"
        );

        // Refresh page 1 after adding so the newest college is visible.
        await fetchColleges(1, filters);
      } else {
        showMessage(
          res.data.message || "College could not be added",
          "error"
        );
      }
    } catch (error) {
      console.error(
        "Add College Error:",
        error.response?.data || error.message
      );

      showMessage(
        error.response?.data?.message || "College creation failed",
        "error"
      );
    }
  };

  // ================= OPEN EDIT =================

  const openEdit = (college) => {
    setEditCollege(college);
    setShowForm(true);

    setForm({
      name: college.name || "",
      slug: college.slug || "",
      logo: college.logo || "",
      description: college.description || "",
      collegeType: college.collegeType || "",
      ownership: college.ownership || "",
      establishedYear: college.establishedYear ?? "",

      address: college.location?.address || "",
      city: college.location?.city || "",
      state: college.location?.state || "",
      country: college.location?.country || "",
      pincode: college.location?.pincode || "",

      website: college.website || "",
      contactEmail: college.contact?.email || "",
      contactPhone:
        college.contact?.phone == null
          ? ""
          : String(college.contact.phone),

      isVerified: college.isVerified || false,
      status: college.status || "pending",
    });
  };

  // ================= UPDATE COLLEGE =================

  const editCollegeHandler = async () => {
    if (!validateCollegeForm()) return;

    if (!editCollege?._id) {
      showMessage("Please select a college to update", "error");
      return;
    }

    try {
      const res = await axios.put(
        `${API}/college/Edit-College`,
        {
          ...getCollegeData(),
          id: editCollege._id,
        },
        {
          headers: getHeaders(),
        }
      );

      if (res.data.status) {
        closeForm();

        showMessage(
          res.data.message || "College updated successfully",
          "success"
        );

        await fetchColleges(currentPage, filters);
      } else {
        showMessage(
          res.data.message || "College could not be updated",
          "error"
        );
      }
    } catch (error) {
      console.error(
        "Edit College Error:",
        error.response?.data || error.message
      );

      showMessage(
        error.response?.data?.message || "College update failed",
        "error"
      );
    }
  };

  // ================= DELETE COLLEGE =================

  const confirmDelete = async () => {
    if (!selectedCollege) return;

    try {
      const res = await axios.delete(`${API}/college/Delete-College`, {
        data: { id: selectedCollege._id },
        headers: getHeaders(),
      });

      if (res.data.status) {
        showMessage(
          res.data.message || "College deleted successfully",
          "success"
        );

        setSelectedCollege(null);

        // If the last row on a page is deleted, move to the previous page.
        const pageToLoad =
          colleges.length === 1 && currentPage > 1
            ? currentPage - 1
            : currentPage;

        await fetchColleges(pageToLoad, filters);
      } else {
        showMessage(
          res.data.message || "College could not be deleted",
          "error"
        );
      }
    } catch (error) {
      console.error(
        "Delete College Error:",
        error.response?.data || error.message
      );

      showMessage(
        error.response?.data?.message || "College deletion failed",
        "error"
      );
    }
  };

  const startIndex = (currentPage - 1) * LIMIT;

  // ================= UI =================

  return (
    <div className={ui.page}>
      <div className={ui.container}>
        {/* HEADER */}

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className={ui.title}>Colleges</h1>
            <p className={ui.subtitle}>Manage all colleges</p>
          </div>

         <div className="flex flex-wrap items-center gap-3">
  <BulkCollegeImport />

  <button onClick={openAdd} className={ui.btnPrimary}>
    <Plus size={16} />
    Add College
  </button>
</div>
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
              type="text"
              placeholder="Search college, city, state..."
              value={filters.search}
              onChange={(e) =>
                handleFilterChange({ search: e.target.value })
              }
              className={`${ui.input} pl-10`}
            />
          </div>

          <select
            value={filters.collegeType}
            onChange={(e) =>
              handleFilterChange({ collegeType: e.target.value })
            }
            className={`${ui.select} lg:col-span-2`}
          >
            <option value="">All Types</option>

            {COLLEGE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(e) =>
              handleFilterChange({ status: e.target.value })
            }
            className={`${ui.select} lg:col-span-2`}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>

          <select
            value={filters.sortBy}
            onChange={(e) =>
              handleFilterChange({ sortBy: e.target.value })
            }
            className={`${ui.select} lg:col-span-2`}
          >
            <option value="">Newest First</option>
            <option value="name">Name</option>
            <option value="establishedYear">Established Year</option>
            <option value="createdAt">Created Date</option>
          </select>

          <select
            value={filters.order}
            onChange={(e) =>
              handleFilterChange({ order: e.target.value })
            }
            className={`${ui.select} lg:col-span-2`}
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>

        {/* TABLE / CARDS */}

        {colleges.length === 0 ? (
          <div
            className={`${ui.card} py-14 text-center text-sm text-slate-500`}
          >
            No colleges found
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
                      College
                    </th>

                    <th className="hidden w-[11%] px-4 py-3.5 text-left font-semibold lg:table-cell">
                      Type
                    </th>

                    <th className="w-[18%] px-4 py-3.5 text-left font-semibold">
                      Location
                    </th>

                    <th className="hidden w-[20%] px-4 py-3.5 text-left font-semibold xl:table-cell">
                      Contact
                    </th>

                    <th className="w-[14%] px-4 py-3.5 text-left font-semibold">
                      Status
                    </th>

                    <th className="w-32 px-4 py-3.5 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {colleges.map((college, i) => (
                    <tr
                      key={college._id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-4 py-3.5 text-slate-400">
                        {startIndex + i + 1}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <CollegeLogo college={college} />

                          <div className="min-w-0">
                            <p
                              className="truncate font-semibold text-slate-900"
                              title={college.name}
                            >
                              {college.name}
                            </p>

                            <p className="truncate text-xs text-slate-500">
                              {college.slug || "-"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="hidden px-4 py-3.5 lg:table-cell">
                        <span className={`${ui.badge} ${badgeColor.role}`}>
                          {college.collegeType || "-"}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <p className="truncate text-slate-700">
                          {college.location?.city || "-"}
                        </p>

                        <p className="truncate text-xs text-slate-500">
                          {college.location?.state || "-"}
                        </p>
                      </td>

                      <td className="hidden px-4 py-3.5 xl:table-cell">
                        <p
                          className="truncate text-slate-700"
                          title={college.contact?.email}
                        >
                          {college.contact?.email || "-"}
                        </p>

                        <p className="truncate text-xs text-slate-500">
                          {college.contact?.phone || "-"}
                        </p>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex flex-col items-start gap-1">
                          <StatusBadge status={college.status} />
                          <VerifiedMark verified={college.isVerified} />
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <RowActions
                          item={college}
                          onView={setViewCollege}
                          onEdit={openEdit}
                          onDelete={setSelectedCollege}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARDS */}

            <div className="space-y-3 md:hidden">
              {colleges.map((college) => (
                <div key={college._id} className={`${ui.card} p-4`}>
                  <div className="flex items-start gap-3">
                    <CollegeLogo college={college} />

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">
                        {college.name}
                      </p>

                      <p className="truncate text-sm text-slate-500">
                        {[
                          college.location?.city,
                          college.location?.state,
                        ]
                          .filter(Boolean)
                          .join(", ") || "-"}
                      </p>

                      <p className="truncate text-sm text-slate-500">
                        {college.contact?.email || "-"}
                      </p>
                    </div>

                    <StatusBadge status={college.status} />
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-3">
                      <span className={`${ui.badge} ${badgeColor.role}`}>
                        {college.collegeType || "-"}
                      </span>

                      <VerifiedMark verified={college.isVerified} />
                    </div>

                    <RowActions
                      item={college}
                      onView={setViewCollege}
                      onEdit={openEdit}
                      onDelete={setSelectedCollege}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* PAGINATION */}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onChange={(page) => {
            if (page >= 1 && page <= totalPages) {
              fetchColleges(page, filters);
            }
          }}
        />
      </div>

      {/* ADD / EDIT MODAL */}

      <Modal
        open={showForm}
        size="lg"
        title={editCollege ? "Edit College" : "Add College"}
        onClose={closeForm}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            editCollege ? editCollegeHandler() : addCollege();
          }}
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          <Field label="College Name">
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="College name"
              required
              className={ui.input}
            />
          </Field>

          <Field label="Slug">
            <input
              name="slug"
              value={form.slug}
              onChange={handleChange}
              placeholder="college-slug"
              className={ui.input}
            />
          </Field>

          <Field label="Logo URL">
            <input
              type="url"
              name="logo"
              value={form.logo}
              onChange={handleChange}
              placeholder="https://..."
              className={ui.input}
            />

            {form.logo && (
              <div className="mt-2 flex items-center gap-3">
                <img
                  src={form.logo}
                  alt="Logo preview"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                  className="h-12 w-12 rounded-lg border border-slate-200 object-cover"
                />

                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({ ...prev, logo: "" }))
                  }
                  className="text-xs font-medium text-rose-600 hover:text-rose-700"
                >
                  Remove logo
                </button>
              </div>
            )}
          </Field>

          <Field label="Ownership">
            <input
              name="ownership"
              value={form.ownership}
              onChange={handleChange}
              placeholder="Ownership"
              className={ui.input}
            />
          </Field>

          <Field label="College Type">
            <select
              name="collegeType"
              value={form.collegeType}
              onChange={handleChange}
              required
              className={`${ui.select} w-full`}
            >
              <option value="">Select college type</option>

              {COLLEGE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Established Year">
            <input
              type="number"
              name="establishedYear"
              value={form.establishedYear}
              onChange={handleChange}
              placeholder="e.g. 1998"
              min="1800"
              max={new Date().getFullYear()}
              className={ui.input}
            />
          </Field>

          <Field label="Address" className="md:col-span-2">
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Address"
              className={ui.input}
            />
          </Field>

          <Field label="City">
            <input
              name="city"
              value={form.city}
              onChange={handleChange}
              placeholder="City"
              className={ui.input}
            />
          </Field>

          <Field label="State">
            <input
              name="state"
              value={form.state}
              onChange={handleChange}
              placeholder="State"
              className={ui.input}
            />
          </Field>

          <Field label="Country">
            <input
              name="country"
              value={form.country}
              onChange={handleChange}
              placeholder="Country"
              className={ui.input}
            />
          </Field>

          <Field label="Pincode">
            <input
              name="pincode"
              value={form.pincode}
              onChange={handleChange}
              placeholder="Pincode"
              inputMode="numeric"
              maxLength={6}
              className={ui.input}
            />
          </Field>

          <Field label="Website">
            <input
              type="url"
              name="website"
              value={form.website}
              onChange={handleChange}
              placeholder="https://..."
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
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>

          <Field label="Contact Email">
            <input
              type="email"
              name="contactEmail"
              value={form.contactEmail}
              onChange={handleChange}
              placeholder="contact@college.com"
              className={ui.input}
            />
          </Field>

          <Field label="Contact Phone">
            <input
              type="tel"
              name="contactPhone"
              value={form.contactPhone}
              onChange={handleChange}
              placeholder="Enter 10-digit phone number"
              inputMode="numeric"
              maxLength={10}
              pattern="[0-9]{10}"
              required
              title="Phone number must contain exactly 10 digits"
              className={ui.input}
            />

            <p className="mt-1 text-xs text-slate-500">
              Enter exactly 10 digits.
            </p>
          </Field>

          <Field label="Description" className="md:col-span-2">
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Short description"
              rows="3"
              className={ui.input}
            />
          </Field>

          <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-slate-700 md:col-span-2">
            <input
              type="checkbox"
              name="isVerified"
              checked={form.isVerified}
              onChange={handleChange}
              className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
            />
            College Verified
          </label>

          <div className="flex gap-3 pt-2 md:col-span-2">
            <button
              type="button"
              onClick={closeForm}
              className={`${ui.btnSecondary} flex-1`}
            >
              Cancel
            </button>

            <button type="submit" className={`${ui.btnPrimary} flex-1`}>
              {editCollege ? "Update College" : "Add College"}
            </button>
          </div>
        </form>
      </Modal>

      {/* VIEW MODAL */}

      <Modal
        open={!!viewCollege}
        title="College Details"
        onClose={() => setViewCollege(null)}
      >
        {viewCollege && (
          <>
            <div className="mb-4 flex items-center gap-3">
              <CollegeLogo college={viewCollege} />

              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-900">
                  {viewCollege.name}
                </p>

                <VerifiedMark verified={viewCollege.isVerified} />
              </div>
            </div>

            <div className="divide-y divide-slate-100 rounded-xl bg-slate-50 px-4">
              <DetailRow label="Slug">{viewCollege.slug}</DetailRow>

              <DetailRow label="Type">
                <span className="capitalize">
                  {viewCollege.collegeType}
                </span>
              </DetailRow>

              <DetailRow label="Ownership">
                {viewCollege.ownership}
              </DetailRow>

              <DetailRow label="Established">
                {viewCollege.establishedYear}
              </DetailRow>

              <DetailRow label="Address">
                {viewCollege.location?.address}
              </DetailRow>

              <DetailRow label="City">
                {viewCollege.location?.city}
              </DetailRow>

              <DetailRow label="State">
                {viewCollege.location?.state}
              </DetailRow>

              <DetailRow label="Country">
                {viewCollege.location?.country}
              </DetailRow>

              <DetailRow label="Pincode">
                {viewCollege.location?.pincode}
              </DetailRow>

              <DetailRow label="Website">
                {viewCollege.website}
              </DetailRow>

              <DetailRow label="Email">
                {viewCollege.contact?.email}
              </DetailRow>

              <DetailRow label="Phone">
                {viewCollege.contact?.phone}
              </DetailRow>

              <DetailRow label="Status">
                <StatusBadge status={viewCollege.status} />
              </DetailRow>

              <DetailRow label="Description">
                {viewCollege.description}
              </DetailRow>
            </div>

            <button
              type="button"
              onClick={() => setViewCollege(null)}
              className={`${ui.btnPrimary} mt-5 w-full`}
            >
              Close
            </button>
          </>
        )}
      </Modal>

      {/* DELETE CONFIRMATION */}

      <DeletedModel
        show={!!selectedCollege}
        onClose={() => setSelectedCollege(null)}
        onConfirm={confirmDelete}
      />

      {/* SUCCESS / ERROR RESULT MODAL */}

      {messageModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
            <div
              className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
                messageModal.type === "success"
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-rose-50 text-rose-600"
              }`}
            >
              {messageModal.type === "success" ? (
                <Check size={28} />
              ) : (
                <X size={28} />
              )}
            </div>

            <h2 className="mb-1 text-lg font-bold text-slate-900">
              {messageModal.title}
            </h2>

            <p className="mb-6 text-sm text-slate-500">
              {messageModal.message}
            </p>

            <button
              type="button"
              onClick={() => setMessageModal(null)}
              className={`${ui.btnPrimary} w-full ${
                messageModal.type === "success"
                  ? ""
                  : "!bg-rose-600 hover:!bg-rose-700"
              }`}
            >
              OK
            </button>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default Colleges;
