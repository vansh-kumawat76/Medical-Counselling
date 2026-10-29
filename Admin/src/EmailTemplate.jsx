
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import {
  ClassicEditor,
  Essentials,
  Paragraph,
  Bold,
  Italic,
  Heading,
  Link,
  List,
} from "ckeditor5";
import "ckeditor5/ckeditor5.css";

import api from "./Api/axios";
import {
  Eye,
  Pencil,
  Trash2,
  Plus,
  Search,
  X,
  RefreshCw,
  Check,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/* ================= DESIGN SYSTEM ================= */

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
    "inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50",
  btnSecondary:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50",
  btnDanger:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50",
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
  default: "bg-slate-100 text-slate-600",
};

const LIMIT = 10;

/*
  These paths assume REST-style Email Template routes.

  Backend mount:
  app.use("/email-template", emailTemplates);

  If your EmailTemplateRoutes.js uses different paths,
  update these four constants to match that file.
*/
const API = {
  list: "/email-template/all",
  create: "/email-template/create",
  update: (id) => `/email-template/update/${id}`,
  remove: (id) => `/email-template/delete${id}`,
};

const initialForm = {
  title: "",
  slug: "",
  subject: "",
  content: "",
  status: "active",
};

/* ================= REUSABLE COMPONENTS ================= */

const Modal = ({ open, title, onClose, children, size = "md" }) => {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`max-h-[90vh] w-full ${
          size === "lg" ? "max-w-3xl" : "max-w-md"
        } overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

const Field = ({ label, className = "", children }) => (
  <div className={className}>
    <label className={ui.label}>{label}</label>
    {children}
  </div>
);

const StatusBadge = ({ status }) => (
  <span className={`${ui.badge} ${badgeColor[status] || badgeColor.default}`}>
    {status || "unknown"}
  </span>
);

const DetailRow = ({ label, children }) => (
  <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-3 last:border-0">
    <span className="shrink-0 text-sm text-slate-500">{label}</span>
    <span className="min-w-0 break-words text-right text-sm font-medium text-slate-900">
      {children || "-"}
    </span>
  </div>
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

const ResultModal = ({ result, onClose }) => {
  if (!result) return null;

  const success = result.type === "success";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
        <div
          className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
            success
              ? "bg-emerald-50 text-emerald-600"
              : "bg-rose-50 text-rose-600"
          }`}
        >
          {success ? <Check size={28} /> : <X size={28} />}
        </div>
        <h2 className="mb-1 text-lg font-bold text-slate-900">
          {success ? "Success!" : "Something went wrong"}
        </h2>
        <p className="mb-6 break-words text-sm text-slate-500">
          {result.message}
        </p>
        <button
          type="button"
          onClick={onClose}
          className={`w-full ${success ? ui.btnPrimary : ui.btnDanger}`}
        >
          Okay
        </button>
      </div>
    </div>
  );
};

/* ================= MAIN COMPONENT ================= */

const EmailTemplate = () => {
  const [templates, setTemplates] = useState([]);
  const [form, setForm] = useState(initialForm);

  const [showForm, setShowForm] = useState(false);
  const [editTemplate, setEditTemplate] = useState(null);
  const [viewTemplate, setViewTemplate] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [order, setOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [selectedIds, setSelectedIds] = useState([]);
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    ids: [],
  });
  const [deleting, setDeleting] = useState(false);
  const [result, setResult] = useState(null);

  const showResult = (message, type = "success") => {
    setResult({ message, type });

    if (type === "success") {
      toast.success(message);
    } else {
      toast.error(message);
    }
  };

  /* ================= FETCH TEMPLATES ================= */

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(API.list);
      const responseData = response.data;

      const list =
        responseData.data?.templates ??
        responseData.data?.emailTemplates ??
        responseData.templates ??
        responseData.emailTemplates ??
        responseData.data;

      if (responseData.status === false) {
        throw new Error(
          responseData.message || "Email templates fetch nahi ho paaye."
        );
      }

      if (!Array.isArray(list)) {
        throw new Error(
          "API response mein templates ki list nahi mili. Route aur response format check karo."
        );
      }

      setTemplates(list);
      setSelectedIds([]);
    } catch (err) {
      console.error("Fetch Email Templates Error:", err);
      const message =
        err.response?.data?.message ||
        err.message ||
        "Email templates fetch nahi ho paaye.";

      setError(message);
      toast.error(message);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates, refreshKey]);

  /* ================= SEARCH / FILTER / SORT ================= */

  const filteredTemplates = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = templates.filter((template) => {
      const matchesSearch = [
        template.title,
        template.slug,
        template.subject,
      ].some((value) => String(value || "").toLowerCase().includes(query));

      const matchesStatus =
        !statusFilter || template.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      let valueA = a[sortBy] ?? "";
      let valueB = b[sortBy] ?? "";

      if (sortBy === "createdAt") {
        valueA = new Date(valueA).getTime() || 0;
        valueB = new Date(valueB).getTime() || 0;
      } else {
        valueA = String(valueA).toLowerCase();
        valueB = String(valueB).toLowerCase();
      }

      if (valueA < valueB) return order === "asc" ? -1 : 1;
      if (valueA > valueB) return order === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [templates, search, statusFilter, sortBy, order]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTemplates.length / LIMIT)
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedTemplates = useMemo(() => {
    const start = (currentPage - 1) * LIMIT;
    return filteredTemplates.slice(start, start + LIMIT);
  }, [filteredTemplates, currentPage]);

  const pageIds = paginatedTemplates.map((template) => template._id);

  const allSelected =
    pageIds.length > 0 &&
    pageIds.every((id) => selectedIds.includes(id));

  /* ================= FORM HANDLERS ================= */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const makeSlug = (value) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const openAddForm = () => {
    setEditTemplate(null);
    setForm({ ...initialForm });
    setError("");
    setShowForm(true);
  };

  const openEditForm = (template) => {
    setEditTemplate(template);
    setForm({
      title: template.title || "",
      slug: template.slug || "",
      subject: template.subject || "",
      content: template.content || "",
      status: template.status || "active",
    });
    setError("");
    setViewTemplate(null);
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;
    setShowForm(false);
    setError("");
  };

  /* ================= CREATE / UPDATE ================= */

  const submitTemplate = async (event) => {
    event.preventDefault();

    const title = form.title.trim();
    const slug = form.slug.trim().toLowerCase();
    const subject = form.subject.trim();
    const content = form.content.trim();

    if (!title || !slug || !subject || !content) {
      setError("Title, slug, subject aur content sab required hain.");
      toast.error("Saare required fields fill karo.");
      return;
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      setError(
        "Slug mein lowercase letters, numbers aur single hyphens use karo."
      );
      toast.error("Email template slug valid nahi hai.");
      return;
    }

    const payload = {
      title,
      slug,
      subject,
      content,
      status: form.status,
    };

    try {
      setSaving(true);
      setError("");

      const response = editTemplate
        ? await api.put(API.update(editTemplate._id), payload)
        : await api.post(API.create, payload);

      if (response.data?.status === false) {
        throw new Error(
          response.data.message || "Email template save nahi hua."
        );
      }

      showResult(
        response.data?.message ||
          (editTemplate
            ? "Email template updated successfully."
            : "Email template created successfully."),
        "success"
      );

      setShowForm(false);
      setEditTemplate(null);
      setForm({ ...initialForm });
      setCurrentPage(1);
      setRefreshKey((previous) => previous + 1);
    } catch (err) {
      console.error("Save Email Template Error:", err);

      const message =
        err.response?.data?.message ||
        err.message ||
        "Email template save nahi hua.";

      setError(message);
      showResult(message, "error");
    } finally {
      setSaving(false);
    }
  };

  /* ================= DELETE ================= */

  const requestDelete = (template) => {
    setConfirmModal({
      open: true,
      ids: [template._id],
    });
  };

  const requestBulkDelete = () => {
    if (!selectedIds.length) {
      toast.error("Pehle email templates select karo.");
      return;
    }

    setConfirmModal({
      open: true,
      ids: [...selectedIds],
    });
  };

  const closeConfirm = () => {
    if (deleting) return;
    setConfirmModal({ open: false, ids: [] });
  };

  const confirmDelete = async () => {
    const ids = confirmModal.ids;
    if (!ids.length) return;

    try {
      setDeleting(true);

      const results = await Promise.allSettled(
        ids.map((id) => api.delete(API.remove(id)))
      );

      const succeeded = results.filter(
        (item) => item.status === "fulfilled"
      ).length;

      const failed = results.length - succeeded;

      setConfirmModal({ open: false, ids: [] });
      setSelectedIds([]);
      setRefreshKey((previous) => previous + 1);

      if (failed === 0) {
        showResult(
          `${succeeded} email template(s) deleted successfully.`,
          "success"
        );
      } else {
        showResult(
          `${succeeded} deleted, ${failed} failed. Check the API routes.`,
          "error"
        );
      }
    } catch (err) {
      console.error("Delete Email Template Error:", err);
      showResult(
        err.response?.data?.message ||
          "Email template delete nahi ho paaya.",
        "error"
      );
    } finally {
      setDeleting(false);
    }
  };

  /* ================= SELECTION ================= */

  const toggleSelect = (id) => {
    setSelectedIds((previous) =>
      previous.includes(id)
        ? previous.filter((selectedId) => selectedId !== id)
        : [...previous, id]
    );
  };

  const toggleSelectAll = () => {
    setSelectedIds((previous) =>
      allSelected
        ? previous.filter((id) => !pageIds.includes(id))
        : [...new Set([...previous, ...pageIds])]
    );
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("");
    setSortBy("createdAt");
    setOrder("desc");
    setCurrentPage(1);
  };

  const checkbox =
    "h-4 w-4 rounded border-slate-300 accent-indigo-600";

  /* ================= UI ================= */

  return (
    <div className={ui.page}>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        newestOnTop
        closeOnClick
        pauseOnHover
      />

      <div className={ui.container}>
        {/* HEADER */}

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className={ui.title}>Email Templates</h1>
            <p className={ui.subtitle}>
              Create and manage reusable email templates
            </p>
          </div>

          <button
            type="button"
            onClick={openAddForm}
            className={ui.btnPrimary}
          >
            <Plus size={16} />
            Add Email Template
          </button>
        </div>

        {/* FILTERS */}

        <div
          className={`${ui.card} mb-5 grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-12`}
        >
          <div className="relative sm:col-span-2 lg:col-span-5">
            <Search
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search title, slug or subject..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setCurrentPage(1);
              }}
              className={`${ui.input} pl-10`}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setCurrentPage(1);
            }}
            className="lg:col-span-2"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={sortBy}
            onChange={(event) => {
              setSortBy(event.target.value);
              setCurrentPage(1);
            }}
            className="lg:col-span-2"
          >
            <option value="createdAt">Created Date</option>
            <option value="title">Title</option>
            <option value="slug">Slug</option>
          </select>

          <select
            value={order}
            onChange={(event) => {
              setOrder(event.target.value);
              setCurrentPage(1);
            }}
            className="lg:col-span-1"
          >
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>

          <button
            type="button"
            onClick={resetFilters}
            className={`${ui.btnSecondary} !px-3 lg:col-span-2`}
          >
            <RefreshCw size={15} />
            Reset
          </button>
        </div>

        {/* BULK ACTIONS */}

        {selectedIds.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-indigo-50 p-3 ring-1 ring-indigo-100">
            <span className="pl-2 text-sm font-medium text-indigo-800">
              {selectedIds.length} template(s) selected
            </span>
            <button
              type="button"
              onClick={requestBulkDelete}
              disabled={deleting}
              className={ui.btnDanger}
            >
              <Trash2 size={15} />
              Delete Selected
            </button>
          </div>
        )}

        {/* ERROR */}

        {error && !showForm && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-rose-100">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              className="font-semibold underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* TABLE */}

        {loading ? (
          <div className={`${ui.card} py-14 text-center text-sm text-slate-500`}>
            Loading email templates...
          </div>
        ) : paginatedTemplates.length === 0 ? (
          <div className={`${ui.card} py-14 text-center text-sm text-slate-500`}>
            No email templates found.
          </div>
        ) : (
          <>
            <div className={`${ui.card} hidden overflow-hidden md:block`}>
              <table className="w-full table-fixed text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="w-12 px-4 py-3.5 text-left">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        className={checkbox}
                        title="Select all on this page"
                      />
                    </th>
                    <th className="w-12 px-4 py-3.5 text-left">#</th>
                    <th className="px-4 py-3.5 text-left">Title / Slug</th>
                    <th className="w-[30%] px-4 py-3.5 text-left">Subject</th>
                    <th className="w-[14%] px-4 py-3.5 text-left">Status</th>
                    <th className="w-32 px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedTemplates.map((template, index) => (
                    <tr key={template._id} className="transition hover:bg-slate-50">
                      <td className="px-4 py-3.5">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(template._id)}
                          onChange={() => toggleSelect(template._id)}
                          className={checkbox}
                        />
                      </td>
                      <td className="px-4 py-3.5 text-slate-400">
                        {(currentPage - 1) * LIMIT + index + 1}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="truncate font-semibold text-slate-900" title={template.title}>
                          {template.title}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {template.slug}
                        </p>
                      </td>
                      <td className="truncate px-4 py-3.5 text-slate-600" title={template.subject}>
                        {template.subject}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={template.status} />
                      </td>
                      <td className="px-4 py-3.5">
                        <RowActions
                          item={template}
                          onView={setViewTemplate}
                          onEdit={openEditForm}
                          onDelete={requestDelete}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARDS */}

            <div className="space-y-3 md:hidden">
              {paginatedTemplates.map((template, index) => (
                <div key={template._id} className={`${ui.card} p-4`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(template._id)}
                      onChange={() => toggleSelect(template._id)}
                      className={`${checkbox} mt-1`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="break-words font-semibold text-slate-900">
                        {(currentPage - 1) * LIMIT + index + 1}. {template.title}
                      </p>
                      <p className="break-words text-xs text-slate-500">
                        {template.slug}
                      </p>
                      <p className="mt-2 break-words text-sm text-slate-600">
                        {template.subject}
                      </p>
                    </div>
                    <StatusBadge status={template.status} />
                  </div>

                  <div className="mt-3 flex justify-end border-t border-slate-100 pt-3">
                    <RowActions
                      item={template}
                      onView={setViewTemplate}
                      onEdit={openEditForm}
                      onDelete={requestDelete}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* PAGINATION */}

        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-center gap-2 py-5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((page) => page - 1)}
              className={ui.btnSecondary}
            >
              Previous
            </button>
            <span className="px-3 text-sm text-slate-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((page) => page + 1)}
              className={ui.btnSecondary}
            >
              Next
            </button>
          </div>
        )}

        {/* ADD / EDIT MODAL */}

        <Modal
          open={showForm}
          size="lg"
          title={editTemplate ? "Edit Email Template" : "Add Email Template"}
          onClose={closeForm}
        >
          <form onSubmit={submitTemplate} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {error && (
              <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 md:col-span-2">
                {error}
              </div>
            )}

            <Field label="Template Title *">
              <input
                name="title"
                value={form.title}
                onChange={(event) => {
                  const title = event.target.value;

                  setForm((previous) => ({
                    ...previous,
                    title,
                    ...(previous.slug === "" || previous.slug === makeSlug(previous.title)
                      ? { slug: makeSlug(title) }
                      : {}),
                  }));
                  setError("");
                }}
                required
                placeholder="Welcome Email"
                className={ui.input}
              />
            </Field>

            <Field label="Slug *">
              <input
                name="slug"
                value={form.slug}
                onChange={handleChange}
                required
                placeholder="welcome-email"
                className={ui.input}
              />
            </Field>

            <Field label="Email Subject *" className="md:col-span-2">
              <input
                name="subject"
                value={form.subject}
                onChange={handleChange}
                required
                placeholder="Welcome to Medical Counselling"
                className={ui.input}
              />
            </Field>

            <Field label="Email Content *" className="md:col-span-2">
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <CKEditor
                  editor={ClassicEditor}
                  data={form.content}
                  config={{
                    licenseKey: "GPL",
                    plugins: [
                      Essentials,
                      Paragraph,
                      Bold,
                      Italic,
                      Heading,
                      Link,
                      List,
                    ],
                    toolbar: [
                      "undo",
                      "redo",
                      "|",
                      "heading",
                      "|",
                      "bold",
                      "italic",
                      "|",
                      "link",
                      "|",
                      "bulletedList",
                      "numberedList",
                    ],
                  }}
                  onChange={(event, editor) => {
                    setForm((previous) => ({
                      ...previous,
                      content: editor.getData(),
                    }));
                    setError("");
                  }}
                />
              </div>
            </Field>

            <Field label="Status">
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className={ui.select}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </Field>

            <div className="flex items-end gap-3">
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
                disabled={saving}
                className={`${ui.btnPrimary} flex-1`}
              >
                {saving
                  ? "Saving..."
                  : editTemplate
                  ? "Update Template"
                  : "Create Template"}
              </button>
            </div>
          </form>
        </Modal>

        {/* VIEW MODAL */}

        <Modal
          open={!!viewTemplate}
          title="Email Template Details"
          onClose={() => setViewTemplate(null)}
        >
          {viewTemplate && (
            <>
              <div className="rounded-xl bg-slate-50 px-4">
                <DetailRow label="Title">{viewTemplate.title}</DetailRow>
                <DetailRow label="Slug">{viewTemplate.slug}</DetailRow>
                <DetailRow label="Subject">{viewTemplate.subject}</DetailRow>
                <DetailRow label="Status">
                  <StatusBadge status={viewTemplate.status} />
                </DetailRow>
                <DetailRow label="Created">
                  {viewTemplate.createdAt
                    ? new Date(viewTemplate.createdAt).toLocaleString()
                    : "-"}
                </DetailRow>
              </div>

              <div className="mt-4">
                <p className={ui.label}>Email Content</p>
                <div
                  className="max-h-64 overflow-auto rounded-xl border border-slate-200 p-4 text-sm"
                  dangerouslySetInnerHTML={{
                    __html: viewTemplate.content || "",
                  }}
                />
              </div>

              <button
                type="button"
                onClick={() => setViewTemplate(null)}
                className={`${ui.btnSecondary} mt-5 w-full`}
              >
                Close
              </button>
            </>
          )}
        </Modal>

        {/* DELETE CONFIRMATION */}

        <Modal
          open={confirmModal.open}
          title="Confirm Delete"
          onClose={closeConfirm}
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <Trash2 size={22} />
          </div>

          <p className="mb-6 text-sm text-slate-600">
            Kya tum {confirmModal.ids.length} selected email template(s) delete
            karna chahte ho? Ye action undo nahi kiya ja sakta.
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={closeConfirm}
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
        </Modal>

        <ResultModal
          result={result}
          onClose={() => setResult(null)}
        />
      </div>
    </div>
  );
};

export default EmailTemplate;
