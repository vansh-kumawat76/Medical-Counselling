import React, { useEffect, useState } from "react";
import axios from "axios";
import { Plus, X, BadgeCheck, Check } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DeletedModel from "./assets/Components/DeletedModel";
import BulkCollegeImport from "./assets/Components/BulkCollegeImport";
import {
  ui,
  badgeColor,
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

const API = "http://localhost:8090";

/* ================= PAGE-SPECIFIC SMALL COMPONENTS ================= */

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
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const role = user.role?.role || user.role || "";
  const permissions = user.permissions || [];

  const isSuperAdmin = role.toLowerCase() === "superadmin";

  const canView = isSuperAdmin || permissions.includes("college.view");
  const canAdd = isSuperAdmin || permissions.includes("college.create");
  const canUpdate = isSuperAdmin || permissions.includes("college.update");
  const canDelete = isSuperAdmin || permissions.includes("college.delete");

  const [colleges, setColleges] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [isAddingCollege, setIsAddingCollege] = useState(false);
  const [editCollege, setEditCollege] = useState(null);
  const [viewCollege, setViewCollege] = useState(null);

  const [form, setForm] = useState(initialForm);

  // Image states
  const [logoFile, setLogoFile] = useState(null);
  const [backgroundImageFile, setBackgroundImageFile] = useState(null);

  const [logoPreview, setLogoPreview] = useState("");
  const [backgroundPreview, setBackgroundPreview] = useState("");

  const [selectedCollege, setSelectedCollege] = useState(null);
  const [messageModal, setMessageModal] = useState(null);

  const [updatingStatus, setUpdatingStatus] = useState(null);
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

  // ================= IMAGE CHANGE =================

  const handleImageChange = (e, type) => {
    const file = e.target.files[0];

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPG, PNG and WEBP images are allowed");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5 MB");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      if (type === "logo") {
        setLogoFile(file);
        setLogoPreview(reader.result);
      } else {
        setBackgroundImageFile(file);
        setBackgroundPreview(reader.result);
      }
    };

    reader.readAsDataURL(file);
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

    setLogoFile(null);
    setBackgroundImageFile(null);

    setLogoPreview("");
    setBackgroundPreview("");
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

  // ================= PREPARE COLLEGE FORM DATA =================

  const getCollegeFormData = () => {
    const data = new FormData();

    data.append("name", form.name.trim());
    data.append("slug", form.slug.trim());
    data.append("description", form.description);
    data.append("collegeType", form.collegeType);
    data.append("ownership", form.ownership);

    if (form.establishedYear) {
      data.append("establishedYear", form.establishedYear);
    }

    data.append(
      "location",
      JSON.stringify({
        address: form.address,
        city: form.city,
        state: form.state,
        country: form.country,
        pincode: form.pincode,
      })
    );

    data.append("website", form.website);

    data.append(
      "contact",
      JSON.stringify({
        email: form.contactEmail,
        phone: form.contactPhone,
      })
    );

    data.append("isVerified", String(form.isVerified));
    data.append("status", form.status);

    if (logoFile) {
      data.append("logo", logoFile);
    }

    if (backgroundImageFile) {
      data.append("backgroundImage", backgroundImageFile);
    }

    return data;
  };

  // ================= ADD COLLEGE =================

  const addCollege = async () => {
    if (!validateCollegeForm()) return;

    try {
      setIsAddingCollege(true);
      const res = await axios.post(
        `${API}/college/Add-New-College`,
        getCollegeFormData(),
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
    finally{
      setIsAddingCollege(false);
    }
  };

  // ================= OPEN EDIT =================

  const openEdit = (college) => {
    if (!college) {
      console.log("College data is missing:", college);
      return;
    }

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

    // Existing images are shown in preview.
    // No new file is selected until the user chooses one.
    setLogoFile(null);
    setBackgroundImageFile(null);

    setLogoPreview(college.logo || "");
    setBackgroundPreview(college.backgroundImage || "");
  };

  // ================= UPDATE COLLEGE =================

  const editCollegeHandler = async () => {
    if (!validateCollegeForm()) return;

    if (!editCollege?._id) {
      showMessage("Please select a college to update", "error");
      return;
    }

    try {
      const data = getCollegeFormData();

      data.append("id", editCollege._id);

      const res = await axios.put(
        `${API}/college/Edit-College`,
        data,
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

  // ================= TOGGLE COLLEGE STATUS =================

const toggleCollegeStatus = async (college) => {
  if (updatingStatus) return;

  const newStatus =
    college.status?.toLowerCase() === "active"
      ? "inactive"
      : "active";

  try {
    setUpdatingStatus(college._id);

    const data = new FormData();

    data.append("id", college._id);
    data.append("status", newStatus);

    const res = await axios.put(
      `${API}/college/Edit-College`,
      data,
      {
        headers: getHeaders(),
      }
    );

    if (res.data.status) {
      toast.success(`College status updated to ${newStatus}`);

      await fetchColleges(currentPage, filters);

      if (viewCollege?._id === college._id) {
        setViewCollege(res.data.college);
      }
    } else {
      toast.error(res.data.message || "Status update failed");
    }
  } catch (error) {
    console.error(
      "College Status Update Error:",
      error.response?.data || error.message
    );

    toast.error(
      error.response?.data?.message ||
        "Unable to update college status"
    );
  } finally {
    setUpdatingStatus(null);
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

  // ================= TABLE CONFIG (UI only) =================

  const hasFilters = Boolean(
    filters.search.trim() ||
      filters.collegeType ||
      filters.status ||
      filters.sortBy
  );

  const renderToggle = (college) =>
    canUpdate && (
      <StatusToggle
        checked={college.status?.toLowerCase() === "active"}
        disabled={updatingStatus === college._id}
        onChange={() => toggleCollegeStatus(college)}
        label={`Click to make ${
          college.status?.toLowerCase() === "active" ? "Inactive" : "Active"
        }`}
      />
    );

  const columns = [
    {
      header: "College",
      cell: (college) => (
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
      ),
    },
    {
      header: "Type",
      className: "w-[11%]",
      hideBelow: "lg",
      cell: (college) => (
        <span className={`${ui.badge} ${badgeColor.role}`}>
          {college.collegeType || "-"}
        </span>
      ),
    },
    {
      header: "Location",
      className: "w-[18%]",
      cell: (college) => (
        <>
          <p className="truncate text-slate-700">
            {college.location?.city || "-"}
          </p>

          <p className="truncate text-xs text-slate-500">
            {college.location?.state || "-"}
          </p>
        </>
      ),
    },
    {
      header: "Contact",
      className: "w-[20%]",
      hideBelow: "xl",
      cell: (college) => (
        <>
          <p
            className="truncate text-slate-700"
            title={college.contact?.email}
          >
            {college.contact?.email || "-"}
          </p>

          <p className="truncate text-xs text-slate-500">
            {college.contact?.phone || "-"}
          </p>
        </>
      ),
    },
    {
      header: "Status",
      className: "w-[18%]",
      cell: (college) => (
        <div className="flex flex-col items-start gap-2">
          <div className="flex items-center gap-3">
            <StatusBadge status={college.status} />
            {renderToggle(college)}
          </div>

          <VerifiedMark verified={college.isVerified} />
        </div>
      ),
    },
  ];

  const renderActions = (college) => (
    <RowActions
      onView={() => setViewCollege(college)}
      onEdit={canUpdate ? () => openEdit(college) : undefined}
      onDelete={canDelete ? () => setSelectedCollege(college) : undefined}
    />
  );

  const renderCard = (college) => (
    <>
      <div className="flex items-start gap-3">
        <CollegeLogo college={college} />

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-900">
            {college.name}
          </p>

          <p className="truncate text-sm text-slate-500">
            {[college.location?.city, college.location?.state]
              .filter(Boolean)
              .join(", ") || "-"}
          </p>

          <p className="truncate text-sm text-slate-500">
            {college.contact?.email || "-"}
          </p>
        </div>

        <StatusBadge status={college.status} />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className={`${ui.badge} ${badgeColor.role}`}>
            {college.collegeType || "-"}
          </span>

          <VerifiedMark verified={college.isVerified} />

          {renderToggle(college)}
        </div>

        {renderActions(college)}
      </div>
    </>
  );

  // ================= UI =================

  if (!canView) {
    return (
      <div className={ui.page}>
        <div className={`${ui.card} p-8 text-center`}>
          <h2 className="text-xl font-bold text-slate-900">
            Access Denied
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            You do not have permission to access Colleges.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={ui.page}>
      <div className={ui.container}>
        {/* HEADER */}

        <PageHeader
          title="College Management"
          subtitle="Manage all colleges"
          actions={
            <>
              {canAdd && (
                <BulkCollegeImport
                  onImportSuccess={() => fetchColleges(1, filters)}
                />
              )}

              {canAdd && (
                <button onClick={openAdd} className={ui.btnPrimary}>
                  <Plus size={16} />
                  Add College
                </button>
              )}
            </>
          }
        />

        {/* FILTERS */}

        <FilterBar
          showClear={hasFilters}
          onClear={() => handleFilterChange(defaultFilters)}
        >
          <SearchInput
            className="col-span-2 lg:col-span-4"
            placeholder="Search college, city, state..."
            value={filters.search}
            onChange={(value) => handleFilterChange({ search: value })}
          />

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
        </FilterBar>

        {/* TABLE / CARDS */}

        <DataTable
          columns={columns}
          rows={colleges}
          startIndex={startIndex}
          renderActions={renderActions}
          renderCard={renderCard}
          emptyTitle="No colleges found"
        />

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

          {/* COLLEGE LOGO */}

          <Field label="College Logo">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => handleImageChange(e, "logo")}
              className={ui.input}
            />

            {logoPreview && (
              <div className="mt-3">
                <img
                  src={logoPreview}
                  alt="Logo Preview"
                  className="h-20 w-20 rounded-xl border border-slate-200 object-cover"
                />
              </div>
            )}
          </Field>

          {/* BACKGROUND IMAGE */}

          <Field label="Background Image (Optional)">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => handleImageChange(e, "background")}
              className={ui.input}
            />

            {backgroundPreview && (
              <div className="mt-3">
                <img
                  src={backgroundPreview}
                  alt="Background Preview"
                  className="h-28 w-full rounded-xl border border-slate-200 object-cover"
                />
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

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row md:col-span-2">
            <button
              type="button"
              onClick={closeForm}
              disabled={isAddingCollege}
              className={`${ui.btnSecondary} sm:flex-1`}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isAddingCollege}
              className={`${ui.btnPrimary} sm:flex-1`}
            >
              {isAddingCollege
                ? "Adding College..."
                : editCollege
                  ? "Update College"
                  : "Add College"}
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
            {/* BACKGROUND BANNER */}

            <div
              className="mb-4 h-36 w-full rounded-xl bg-slate-100 bg-cover bg-center"
              style={
                viewCollege.backgroundImage
                  ? {
                      backgroundImage: `url(${viewCollege.backgroundImage})`,
                    }
                  : {}
              }
            />

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
              <DetailRow label="Slug">
                {viewCollege.slug}
              </DetailRow>

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
