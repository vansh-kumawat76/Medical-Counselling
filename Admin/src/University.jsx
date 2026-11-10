import React, { useCallback, useEffect, useState } from "react";
import api from "./Api/axios";
import { Trash2, X, Plus, Check, ExternalLink } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BulkUniversityImport from "./assets/Components/BulkUniversityImport";
import {
  ui,
  badgeColor,
  PageHeader,
  Modal,
  Field,
  DetailRow,
  RowActions,
  SearchInput,
  DataTable,
} from "./assets/Components/ui/ui";

/* ============================================================
   PAGE-SPECIFIC SMALL PIECES
   ============================================================ */

/* ================= UNIVERSITY LOGO ================= */

const UniversityLogo = ({ item }) =>
  item.logo ? (
    <img
      src={item.logo}
      alt={item.name}
      className="h-10 w-10 shrink-0 rounded-xl bg-white object-contain ring-1 ring-slate-200"
    />
  ) : (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-lg">
      🎓
    </div>
  );

/* ================= LOCATION ================= */

const getLocation = (item) =>
  [item.location?.city, item.location?.state, item.location?.country]
    .filter(Boolean)
    .join(", ") || "-";

/* ================= WEBSITE LINK ================= */

const WebsiteLink = ({ url }) =>
  url ? (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline"
    >
      Visit <ExternalLink size={13} />
    </a>
  ) : (
    <span className="text-slate-400">-</span>
  );

/* ============================================================
   CONSTANTS
   ============================================================ */

const UNIVERSITY_TYPES = [
  "central",
  "state",
  "private",
  "deemed",
  "international",
];

const initialFormData = {
  name: "",
  shortName: "",
  logo: "",
  type: "state",
  establishedYear: "",
  city: "",
  state: "",
  country: "India",
  website: "",
};

/* ============================================================
   MAIN PAGE
   ============================================================ */

const University = () => {
  const [university, setUniversity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialFormData);

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");

  const [viewing, setViewing] = useState(null);

  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [messageModal, setMessageModal] = useState(null);

  /* ============================================================
     PERMISSIONS
     ============================================================ */

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const storedPrmissions = JSON.parse(
    localStorage.getItem("permissions") || "[]"
  );

  const role =
    typeof user.role === "object"
      ? user.role?.role || user.role?.name || ""
      : user.role || "";

  const isSuperAdmin = role.toLowerCase() === "superadmin";

  const permissions = (
    Array.isArray(user.permissions) && user.permissions.length
      ? user.permissions
      : storedPrmissions
  ).map((permission) =>
    typeof permission === "string"
      ? permission.toLowerCase()
      : permission?.name?.toLowerCase() || ""
  );

  const canView = isSuperAdmin || permissions.includes("university.view");
  const canAdd = isSuperAdmin || permissions.includes("university.create");
  const canUpdate = isSuperAdmin || permissions.includes("university.update");
  const canDelete = isSuperAdmin || permissions.includes("university.delete");

  /* ============================================================
     SUCCESS / ERROR MESSAGE
     ============================================================ */

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

  /* ============================================================
     FETCH UNIVERSITIES
     ============================================================ */

  const fetchUniversities = useCallback(async () => {
    try {
      const res = await api.get("/university/get-university");

      const universities = Array.isArray(res.data.universities)
        ? res.data.universities
        : [];

      setUniversity(
        universities.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();

          if (dateA !== dateB) {
            return dateB - dateA;
          }

          return String(b._id).localeCompare(String(a._id));
        })
      );
    } catch (err) {
      console.error(
        "Fetch Universities Error:",
        err.response?.data || err.message
      );

      showMessage(
        err.response?.data?.message ||
          "Universities load nahi hui. Token, permission aur backend check karo.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /* ============================================================
     INITIAL FETCH + BULK IMPORT EVENT
     ============================================================ */

  useEffect(() => {
    fetchUniversities();

    window.addEventListener(
      "universities-imported",
      fetchUniversities
    );

    return () => {
      window.removeEventListener(
        "universities-imported",
        fetchUniversities
      );
    };
  }, [fetchUniversities]);

  /* ============================================================
     FORM CHANGE
     ============================================================ */

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "logo") {
      const file = files?.[0];

      if (file) {
        if (
          !["image/jpeg", "image/png", "image/webp"].includes(file.type)
        ) {
          toast.error("Only JPG, PNG and WEBP images are allowed");
          e.target.value = "";
          return;
        }

        if (file.size > 5 * 1024 * 1024) {
          toast.error("Image size must be less than 5 MB");
          e.target.value = "";
          return;
        }

        setLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
      }

      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* ============================================================
     OPEN ADD FORM
     ============================================================ */

  const openAddForm = () => {
    setEditingId(null);
    setFormData({ ...initialFormData });
    setLogoFile(null);
    setLogoPreview("");
    setShowForm(true);
  };

  /* ============================================================
     OPEN EDIT FORM
     ============================================================ */

  const openEditForm = (item) => {
    setEditingId(item._id);

    setFormData({
      name: item.name || "",
      shortName: item.shortName || "",
      logo: item.logo || "",
      type: item.type || "state",
      establishedYear: item.establishedYear ?? "",
      city: item.location?.city || "",
      state: item.location?.state || "",
      country: item.location?.country || "India",
      website: item.website || "",
    });

    setShowForm(true);
    setViewing(null);
    setLogoFile(null);
    setLogoPreview(item.logo || "");
  };

  /* ============================================================
     CLOSE FORM
     ============================================================ */

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingId(null);
    setFormData({ ...initialFormData });
    setLogoFile(null);
    setLogoPreview("");
  };

  /* ============================================================
     ADD / UPDATE UNIVERSITY
     ============================================================ */

  const handleSubmit = async () => {
    if (saving) return;

    setSaving(true);

    const payload = new FormData();

    payload.append("name", formData.name.trim());
    payload.append("shortName", formData.shortName.trim());
    payload.append("type", formData.type);
    payload.append("establishedYear", formData.establishedYear);

    payload.append(
      "location",
      JSON.stringify({
        city: formData.city.trim(),
        state: formData.state.trim(),
        country: formData.country.trim(),
      })
    );

    payload.append("website", formData.website.trim());

    if (logoFile) {
      payload.append("logo", logoFile);
    } else {
      payload.append("logo", formData.logo || "");
    }

    try {
      const res = editingId
        ? await api.put(
            `/university/university/${editingId}`,
            payload
          )
        : await api.post(
            "/university/university",
            payload
          );

      if (res.data?.status === false) {
        showMessage(
          res.data.message || "University save nahi hui.",
          "error"
        );
        return;
      }

      setShowForm(false);
      setEditingId(null);
      setFormData({ ...initialFormData });
      setLogoFile(null);
      setLogoPreview("");

      showMessage(
        res.data?.message ||
          (editingId
            ? "University updated successfully"
            : "University added successfully"),
        "success"
      );

      await fetchUniversities();
    } catch (err) {
      console.error(
        "Save University Error:",
        err.response?.data || err.message
      );

      showMessage(
        err.response?.data?.message || "University save nahi hui.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  /* ============================================================
     DELETE UNIVERSITY
     ============================================================ */

  const closeDeleteModal = () => {
    if (deleting) return;

    setSelectedUniversity(null);
  };

  const handleDelete = async () => {
    if (!selectedUniversity?._id || deleting) return;

    setDeleting(true);

    try {
      const res = await api.delete(
        `/university/university/${selectedUniversity._id}`
      );

      if (res.data?.status === false) {
        showMessage(
          res.data.message || "University delete nahi hui.",
          "error"
        );
        return;
      }

      const deletedId = selectedUniversity._id;

      setSelectedUniversity(null);

      setViewing((prev) =>
        prev?._id === deletedId ? null : prev
      );

      showMessage(
        res.data?.message || "University deleted successfully",
        "success"
      );

      await fetchUniversities();
    } catch (err) {
      console.error(
        "Delete University Error:",
        err.response?.data || err.message
      );

      showMessage(
        err.response?.data?.message || "University delete nahi hui.",
        "error"
      );
    } finally {
      setDeleting(false);
    }
  };

  /* ============================================================
     SEARCH
     ============================================================ */

  const query = search.toLowerCase();

  const filteredUniversities = university.filter(
    (item) =>
      item.name?.toLowerCase().includes(query) ||
      item.shortName?.toLowerCase().includes(query) ||
      item.type?.toLowerCase().includes(query) ||
      item.location?.city?.toLowerCase().includes(query) ||
      item.location?.state?.toLowerCase().includes(query)
  );

  /* ============================================================
     TABLE CONFIG (UI only)
     ============================================================ */

  const columns = [
    {
      header: "University",
      cell: (item) => (
        <div className="flex items-center gap-3">
          <UniversityLogo item={item} />

          <div className="min-w-0">
            <p
              className="truncate font-semibold text-slate-900"
              title={item.name}
            >
              {item.name}
            </p>

            <p className="truncate text-xs text-slate-500">
              {item.shortName || "-"}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Type",
      className: "w-[12%]",
      hideBelow: "lg",
      cell: (item) => (
        <span className={`${ui.badge} ${badgeColor.role}`}>
          {item.type || "-"}
        </span>
      ),
    },
    {
      header: "Established",
      className: "w-[12%]",
      hideBelow: "xl",
      cell: (item) => item.establishedYear || "-",
    },
    {
      header: "Location",
      className: "w-[24%]",
      cell: (item) => (
        <p className="truncate" title={getLocation(item)}>
          {getLocation(item)}
        </p>
      ),
    },
    {
      header: "Website",
      className: "w-[11%]",
      hideBelow: "xl",
      cell: (item) => <WebsiteLink url={item.website} />,
    },
  ];

  const renderActions = (item) => (
    <RowActions
      onView={() => setViewing(item)}
      onEdit={canUpdate ? () => openEditForm(item) : undefined}
      onDelete={canDelete ? () => setSelectedUniversity(item) : undefined}
    />
  );

  const renderCard = (item) => (
    <>
      <div className="flex items-start gap-3">
        <UniversityLogo item={item} />

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-900">
            {item.name}
          </p>

          <p className="truncate text-sm text-slate-500">
            {item.shortName || "-"}
            {item.establishedYear ? ` • Est. ${item.establishedYear}` : ""}
          </p>

          <p className="truncate text-sm text-slate-500">
            {getLocation(item)}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <div className="flex items-center gap-3">
          <span className={`${ui.badge} ${badgeColor.role}`}>
            {item.type || "-"}
          </span>

          <WebsiteLink url={item.website} />
        </div>

        {renderActions(item)}
      </div>
    </>
  );

  /* ============================================================
     ACCESS DENIED
     ============================================================ */

  if (!canView) {
    return (
      <div className={ui.page}>
        <div className={`${ui.card} p-8 text-center`}>
          <h2 className="text-xl font-bold text-slate-900">
            Access Denied
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            You do not have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  /* ============================================================
     UI
     ============================================================ */

  return (
    <div className={ui.page}>
      <div className={ui.container}>

        {/* HEADER */}

        <PageHeader
          title="University Management"
          subtitle="Manage university information"
          actions={
            <>
              {canAdd && <BulkUniversityImport />}

              {canAdd && (
                <button
                  type="button"
                  onClick={openAddForm}
                  className={ui.btnPrimary}
                >
                  <Plus size={16} />
                  Add University
                </button>
              )}
            </>
          }
        />

        {/* SEARCH BAR */}

        <div
          className={`${ui.card} mb-5 flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4`}
        >
          <p className="text-sm font-semibold text-slate-700">
            University List{" "}
            <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {filteredUniversities.length}
            </span>
          </p>

          <SearchInput
            className="w-full sm:max-w-xs"
            placeholder="Search universities..."
            value={search}
            onChange={setSearch}
          />
        </div>

        {/* TABLE / CARDS */}

        <DataTable
          columns={columns}
          rows={filteredUniversities}
          loading={loading}
          showIndex={false}
          renderActions={renderActions}
          renderCard={renderCard}
          emptyTitle="No universities found."
        />
      </div>

      {/* ========================================================
          ADD / EDIT MODAL
         ======================================================== */}

      <Modal
        open={showForm}
        size="lg"
        title={editingId ? "Edit University" : "Add New University"}
        onClose={closeForm}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          <Field label="University Name">
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="University name"
              required
              className={ui.input}
            />
          </Field>

          <Field label="Short Name">
            <input
              name="shortName"
              value={formData.shortName}
              onChange={handleChange}
              placeholder="e.g. DU"
              className={ui.input}
            />
          </Field>

          {/* UNIVERSITY LOGO */}

          <Field label="University Logo">
            <div className="space-y-3">
              <input
                type="file"
                name="logo"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleChange}
                className={ui.input}
              />

              <p className="text-xs text-slate-500">
                JPG, PNG or WEBP. Maximum size: 5 MB.
              </p>

              {logoPreview && (
                <div className="flex items-center gap-3">
                  <img
                    src={logoPreview}
                    alt="University Logo Preview"
                    className="h-16 w-16 rounded-xl border border-slate-200 bg-white object-contain p-1"
                  />

                  <span className="text-sm text-slate-600">
                    Logo Preview
                  </span>
                </div>
              )}
            </div>
          </Field>

          <Field label="Type">
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              className={`${ui.select} w-full`}
            >
              {UNIVERSITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Established Year">
            <input
              type="number"
              name="establishedYear"
              value={formData.establishedYear}
              onChange={handleChange}
              placeholder="e.g. 1922"
              required
              min="1"
              max={new Date().getFullYear()}
              className={ui.input}
            />
          </Field>

          <Field label="Website">
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleChange}
              placeholder="https://..."
              className={ui.input}
            />
          </Field>

          <Field label="City">
            <input
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="City"
              className={ui.input}
            />
          </Field>

          <Field label="State">
            <input
              name="state"
              value={formData.state}
              onChange={handleChange}
              placeholder="State"
              className={ui.input}
            />
          </Field>

          <Field label="Country" className="md:col-span-2">
            <input
              name="country"
              value={formData.country}
              onChange={handleChange}
              placeholder="Country"
              className={ui.input}
            />
          </Field>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row md:col-span-2">
            <button
              type="button"
              onClick={closeForm}
              disabled={saving}
              className={`${ui.btnSecondary} sm:flex-1`}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className={`${ui.btnPrimary} sm:flex-1`}
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Update University"
                  : "Save University"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================
          VIEW MODAL
         ======================================================== */}

      <Modal
        open={!!viewing}
        title="University Details"
        onClose={() => setViewing(null)}
      >
        {viewing && (
          <>
            <div className="mb-4 flex items-center gap-3">
              <UniversityLogo item={viewing} />

              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-900">
                  {viewing.name}
                </p>

                <p className="truncate text-xs text-slate-500">
                  {viewing.shortName || "-"}
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 rounded-xl bg-slate-50 px-4">
              <DetailRow label="Type">
                <span className="capitalize">{viewing.type}</span>
              </DetailRow>

              <DetailRow label="Established">
                {viewing.establishedYear}
              </DetailRow>

              <DetailRow label="City">
                {viewing.location?.city}
              </DetailRow>

              <DetailRow label="State">
                {viewing.location?.state}
              </DetailRow>

              <DetailRow label="Country">
                {viewing.location?.country}
              </DetailRow>

              <DetailRow label="Website">
                {viewing.website}
              </DetailRow>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setViewing(null)}
                className={`${ui.btnSecondary} flex-1`}
              >
                Close
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* ========================================================
          DELETE CONFIRMATION
         ======================================================== */}

      <Modal
        open={!!selectedUniversity}
        title="Delete University?"
        onClose={closeDeleteModal}
      >
        {selectedUniversity && (
          <>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <Trash2 size={22} />
            </div>

            <p className="mb-6 text-sm text-slate-600">
              Kya tum{" "}
              <strong className="text-slate-900">
                {selectedUniversity.name}
              </strong>{" "}
              ko delete karna chahte ho? Ye action undo nahi kiya ja sakta.
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
                onClick={handleDelete}
                disabled={deleting}
                className={`${ui.btnDanger} flex-1`}
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* ========================================================
          SUCCESS / ERROR RESULT MODAL
         ======================================================== */}

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
              className={`w-full ${
                messageModal.type === "success"
                  ? ui.btnPrimary
                  : ui.btnDanger
              }`}
            >
              OK
            </button>
          </div>
        </div>
      )}

      <ToastContainer
        position="top-right"
        autoClose={3000}
        newestOnTop
      />
    </div>
  );
};

export default University;
