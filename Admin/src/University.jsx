import React, { useEffect, useState } from "react";
import api from "./Api/axios";
import { Eye, Pencil, Trash2, X, Plus, Search, Check, ExternalLink } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BulkUniversityImport from "./assets/Components/BulkUniversityImport";
/* ============================================================
   DESIGN SYSTEM — Students / Colleges wala hi same (sab pages me yehi rakhna)
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
  role: "bg-sky-50 text-sky-700",
  default: "bg-slate-100 text-slate-600",
};

/* ============================================================
   REUSABLE PIECES
   ============================================================ */

const Modal = ({ open, title, onClose, children, size = "md" }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
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

const RowActions = ({ item, onView, onEdit, onDelete }) => (
  <div className="flex items-center justify-end gap-1">
    <button type="button" title="View" onClick={() => onView(item)} className={ui.iconBtnView}>
      <Eye size={17} />
    </button>
    <button type="button" title="Edit" onClick={() => onEdit(item)} className={ui.iconBtnEdit}>
      <Pencil size={17} />
    </button>
    <button type="button" title="Delete" onClick={() => onDelete(item)} className={ui.iconBtnDelete}>
      <Trash2 size={17} />
    </button>
  </div>
);

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

const getLocation = (item) =>
  [item.location?.city, item.location?.state, item.location?.country]
    .filter(Boolean)
    .join(", ") || "-";

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

const UNIVERSITY_TYPES = ["central", "state", "private", "deemed", "international"];

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

  const [viewing, setViewing] = useState(null);

  const [selectedUniversity, setSelectedUniversity] = useState(null); // delete
  const [deleting, setDeleting] = useState(false);

  const [messageModal, setMessageModal] = useState(null); // {title, message, type}

  // ================= SUCCESS / ERROR MESSAGE =================
  const showMessage = (message, type = "success") => {
    setMessageModal({
      title: type === "success" ? "Success!" : "Operation Failed",
      message,
      type,
    });

    if (type === "success") toast.success(message);
    else toast.error(message);
  };

  // ================= FETCH =================
 
const fetchUniversities = async () => {
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
};


  useEffect(() => {
    fetchUniversities();
  }, []);

  // ================= FORM =================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openAddForm = () => {
    setEditingId(null);
    setFormData({ ...initialFormData });
    setShowForm(true);
  };

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
  };

  const closeForm = () => {
    if (saving) return;
    setShowForm(false);
    setEditingId(null);
    setFormData({ ...initialFormData });
  };

  // ================= ADD / UPDATE =================
  const handleSubmit = async () => {
    if (saving) return;
    setSaving(true);

    const payload = {
      name: formData.name.trim(),
      shortName: formData.shortName.trim(),
      logo: formData.logo.trim(),
      type: formData.type,
      establishedYear: Number(formData.establishedYear),
      location: {
        city: formData.city.trim(),
        state: formData.state.trim(),
        country: formData.country.trim(),
      },
      website: formData.website.trim(),
    };

    try {
      const res = editingId
        ? await api.put(`/university/university/${editingId}`, payload)
        : await api.post("/university/university", payload);

      // Kuch APIs status:false return karti hain bina throw kiye
      if (res.data?.status === false) {
        showMessage(res.data.message || "University save nahi hui.", "error");
        return;
      }

      setShowForm(false);
      setEditingId(null);
      setFormData({ ...initialFormData });

      showMessage(
        res.data?.message ||
          (editingId ? "University updated successfully" : "University added successfully"),
        "success"
      );

      await fetchUniversities();
    } catch (err) {
      console.error("Save University Error:", err.response?.data || err.message);
      showMessage(err.response?.data?.message || "University save nahi hui.", "error");
    } finally {
      setSaving(false);
    }
  };

  // ================= DELETE =================
  const closeDeleteModal = () => {
    if (deleting) return;
    setSelectedUniversity(null);
  };

  const handleDelete = async () => {
    if (!selectedUniversity?._id || deleting) return;
    setDeleting(true);

    try {
      const res = await api.delete(`/university/university/${selectedUniversity._id}`);

      if (res.data?.status === false) {
        showMessage(res.data.message || "University delete nahi hui.", "error");
        return;
      }

      const deletedId = selectedUniversity._id;
      setSelectedUniversity(null);
      setViewing((prev) => (prev?._id === deletedId ? null : prev));

      showMessage(res.data?.message || "University deleted successfully", "success");

      await fetchUniversities();
    } catch (err) {
      console.error("Delete University Error:", err.response?.data || err.message);
      showMessage(err.response?.data?.message || "University delete nahi hui.", "error");
    } finally {
      setDeleting(false);
    }
  };

  // ================= SEARCH =================
  const query = search.toLowerCase();
  const filteredUniversities = university.filter(
    (item) =>
      item.name?.toLowerCase().includes(query) ||
      item.shortName?.toLowerCase().includes(query) ||
      item.type?.toLowerCase().includes(query) ||
      item.location?.city?.toLowerCase().includes(query) ||
      item.location?.state?.toLowerCase().includes(query)
  );

  // ================= UI =================
  return (
    <div className={ui.page}>
      <div className={ui.container}>
        {/* HEADER */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className={ui.title}>Universities</h1>
            <p className={ui.subtitle}>Manage university information</p>
          </div>

         <div className="flex flex-wrap items-center gap-3">
  <BulkUniversityImport />

  <button type="button" onClick={openAddForm} className={ui.btnPrimary}>
    <Plus size={16} />
    Add University
  </button>
</div>
        </div>

        {/* SEARCH BAR */}
        <div className={`${ui.card} mb-5 flex flex-wrap items-center justify-between gap-3 p-4`}>
          <p className="text-sm font-semibold text-slate-700">
            University List{" "}
            <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {filteredUniversities.length}
            </span>
          </p>

          <div className="relative w-full sm:max-w-xs">
            <Search
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search universities..."
              className={`${ui.input} pl-10`}
            />
          </div>
        </div>

        {/* TABLE / CARDS */}
        {loading ? (
          <div className={`${ui.card} py-14 text-center text-sm text-slate-500`}>
            Loading universities...
          </div>
        ) : filteredUniversities.length === 0 ? (
          <div className={`${ui.card} py-14 text-center text-sm text-slate-500`}>
            No universities found.
          </div>
        ) : (
          <>
            {/* Desktop: table-fixed + truncate => horizontal scrollbar nahi aayega */}
            <div className={`${ui.card} hidden overflow-hidden md:block`}>
              <table className="w-full table-fixed text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3.5 text-left font-semibold">University</th>
                    <th className="hidden w-[12%] px-4 py-3.5 text-left font-semibold lg:table-cell">
                      Type
                    </th>
                    <th className="hidden w-[12%] px-4 py-3.5 text-left font-semibold xl:table-cell">
                      Established
                    </th>
                    <th className="w-[24%] px-4 py-3.5 text-left font-semibold">Location</th>
                    <th className="hidden w-[11%] px-4 py-3.5 text-left font-semibold xl:table-cell">
                      Website
                    </th>
                    <th className="w-32 px-4 py-3.5 text-right font-semibold">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredUniversities.map((item) => (
                    <tr key={item._id} className="transition hover:bg-slate-50">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <UniversityLogo item={item} />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900" title={item.name}>
                              {item.name}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              {item.shortName || "-"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="hidden px-4 py-3.5 lg:table-cell">
                        <span className={`${ui.badge} ${badgeColor.role}`}>
                          {item.type || "-"}
                        </span>
                      </td>

                      <td className="hidden px-4 py-3.5 text-slate-600 xl:table-cell">
                        {item.establishedYear || "-"}
                      </td>

                      <td className="px-4 py-3.5 text-slate-600">
                        <p className="truncate" title={getLocation(item)}>
                          {getLocation(item)}
                        </p>
                      </td>

                      <td className="hidden px-4 py-3.5 xl:table-cell">
                        <WebsiteLink url={item.website} />
                      </td>

                      <td className="px-4 py-3.5">
                        <RowActions
                          item={item}
                          onView={setViewing}
                          onEdit={openEditForm}
                          onDelete={setSelectedUniversity}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: cards */}
            <div className="space-y-3 md:hidden">
              {filteredUniversities.map((item) => (
                <div key={item._id} className={`${ui.card} p-4`}>
                  <div className="flex items-start gap-3">
                    <UniversityLogo item={item} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">{item.name}</p>
                      <p className="truncate text-sm text-slate-500">
                        {item.shortName || "-"}
                        {item.establishedYear ? ` • Est. ${item.establishedYear}` : ""}
                      </p>
                      <p className="truncate text-sm text-slate-500">{getLocation(item)}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-3">
                      <span className={`${ui.badge} ${badgeColor.role}`}>{item.type || "-"}</span>
                      <WebsiteLink url={item.website} />
                    </div>
                    <RowActions
                      item={item}
                      onView={setViewing}
                      onEdit={openEditForm}
                      onDelete={setSelectedUniversity}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ADD / EDIT MODAL */}
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
            <input name="name" value={formData.name} onChange={handleChange}
              placeholder="University name" required className={ui.input} />
          </Field>

          <Field label="Short Name">
            <input name="shortName" value={formData.shortName} onChange={handleChange}
              placeholder="e.g. DU" className={ui.input} />
          </Field>

          <Field label="Logo URL">
            <input name="logo" type="url" value={formData.logo} onChange={handleChange}
              placeholder="https://... (optional)" className={ui.input} />
          </Field>

          <Field label="Type">
            <select name="type" value={formData.type} onChange={handleChange}
              required className={`${ui.select} w-full`}>
              {UNIVERSITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Established Year">
            <input type="number" name="establishedYear" value={formData.establishedYear}
              onChange={handleChange} placeholder="e.g. 1922" required min="1"
              max={new Date().getFullYear()} className={ui.input} />
          </Field>

          <Field label="Website">
            <input type="url" name="website" value={formData.website}
              onChange={handleChange} placeholder="https://..." className={ui.input} />
          </Field>

          <Field label="City">
            <input name="city" value={formData.city} onChange={handleChange}
              placeholder="City" className={ui.input} />
          </Field>

          <Field label="State">
            <input name="state" value={formData.state} onChange={handleChange}
              placeholder="State" className={ui.input} />
          </Field>

          <Field label="Country" className="md:col-span-2">
            <input name="country" value={formData.country} onChange={handleChange}
              placeholder="Country" className={ui.input} />
          </Field>

          <div className="flex gap-3 pt-2 md:col-span-2">
            <button type="button" onClick={closeForm} disabled={saving}
              className={`${ui.btnSecondary} flex-1`}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className={`${ui.btnPrimary} flex-1`}>
              {saving ? "Saving..." : editingId ? "Update University" : "Save University"}
            </button>
          </div>
        </form>
      </Modal>

      {/* VIEW MODAL */}
      <Modal open={!!viewing} title="University Details" onClose={() => setViewing(null)}>
        {viewing && (
          <>
            <div className="mb-4 flex items-center gap-3">
              <UniversityLogo item={viewing} />
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-900">{viewing.name}</p>
                <p className="truncate text-xs text-slate-500">{viewing.shortName || "-"}</p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 rounded-xl bg-slate-50 px-4">
              <DetailRow label="Type">
                <span className="capitalize">{viewing.type}</span>
              </DetailRow>
              <DetailRow label="Established">{viewing.establishedYear}</DetailRow>
              <DetailRow label="City">{viewing.location?.city}</DetailRow>
              <DetailRow label="State">{viewing.location?.state}</DetailRow>
              <DetailRow label="Country">{viewing.location?.country}</DetailRow>
              <DetailRow label="Website">{viewing.website}</DetailRow>
            </div>

            <div className="mt-5 flex gap-3">
              <button type="button" onClick={() => setViewing(null)}
                className={`${ui.btnSecondary} flex-1`}>
                Close
              </button>
             
            </div>
          </>
        )}
      </Modal>

      {/* DELETE CONFIRMATION */}
      <Modal open={!!selectedUniversity} title="Delete University?" onClose={closeDeleteModal}>
        {selectedUniversity && (
          <>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <Trash2 size={22} />
            </div>

            <p className="mb-6 text-sm text-slate-600">
              Kya tum <strong className="text-slate-900">{selectedUniversity.name}</strong> ko
              delete karna chahte ho? Ye action undo nahi kiya ja sakta.
            </p>

            <div className="flex gap-3">
              <button type="button" onClick={closeDeleteModal} disabled={deleting}
                className={`${ui.btnSecondary} flex-1`}>
                Cancel
              </button>
              <button type="button" onClick={handleDelete} disabled={deleting}
                className={`${ui.btnDanger} flex-1`}>
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </>
        )}
      </Modal>

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
              {messageModal.type === "success" ? <Check size={28} /> : <X size={28} />}
            </div>

            <h2 className="mb-1 text-lg font-bold text-slate-900">{messageModal.title}</h2>
            <p className="mb-6 text-sm text-slate-500">{messageModal.message}</p>

            <button
              type="button"
              onClick={() => setMessageModal(null)}
              className={`w-full ${
                messageModal.type === "success" ? ui.btnPrimary : ui.btnDanger
              }`}
            >
              OK
            </button>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} newestOnTop />
    </div>
  );
};

export default University;
