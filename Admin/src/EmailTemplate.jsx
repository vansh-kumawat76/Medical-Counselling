
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
import { Trash2, Plus } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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

/* ================= API ROUTES ================= */

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

  /* ================= RESULT MESSAGE ================= */

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
          "API response mein templates ki list nahi mili. Response format check karo."
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
      ].some((value) =>
        String(value || "").toLowerCase().includes(query)
      );

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

  /* ================= STATUS TOGGLE ================= */

  const handleStatusToggle = async (template) => {
    const newStatus =
      template.status === "active" ? "inactive" : "active";

    try {
      const payload = {
        title: template.title,
        slug: template.slug,
        subject: template.subject,
        content: template.content,
        status: newStatus,
      };

      const response = await api.put(
        API.update(template._id),
        payload
      );

      if (response.data?.status === false) {
        throw new Error(
          response.data.message || "Status update failed."
        );
      }

      setTemplates((previous) =>
        previous.map((item) =>
          item._id === template._id
            ? { ...item, status: newStatus }
            : item
        )
      );

      toast.success(`Template ${newStatus} successfully.`);
    } catch (err) {
      console.error("Email Template Status Error:", err);

      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Status update failed."
      );
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

    setConfirmModal({
      open: false,
      ids: [],
    });
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

      setConfirmModal({
        open: false,
        ids: [],
      });

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

  /* ================= RESET FILTERS ================= */

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("");
    setSortBy("createdAt");
    setOrder("desc");
    setCurrentPage(1);
  };

  /* ================= TABLE COLUMNS ================= */

  const columns = [
    {
      header: (
        <input
          type="checkbox"
          checked={allSelected}
          onChange={toggleSelectAll}
          className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
          title="Select all on this page"
        />
      ),
      className: "w-12",
      cell: (template) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(template._id)}
          onChange={() => toggleSelect(template._id)}
          className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
        />
      ),
    },
    {
      header: "Title / Slug",
      cell: (template) => (
        <div className="min-w-0">
          <p
            className="truncate font-semibold text-slate-900"
            title={template.title}
          >
            {template.title}
          </p>
          <p className="truncate text-xs text-slate-500">
            {template.slug}
          </p>
        </div>
      ),
    },
    {
      header: "Subject",
      className: "w-[30%]",
      cell: (template) => (
        <span
          className="block truncate text-slate-600"
          title={template.subject}
        >
          {template.subject}
        </span>
      ),
    },
    {
  header: "Status",
  className: "w-[18%]",
  cell: (template) => (
    <div className="flex items-center gap-2">
       <span
        className={`text-xs font-semibold ${
          template.status === "active"
            ? "text-emerald-600"
            : "text-red-500"
        }`}
      >
        {template.status === "active" ? "Active" : "Inactive"}
      </span>
      <StatusToggle
        checked={template.status === "active"}
        onChange={() => handleStatusToggle(template)}
      />

     
    </div>
  ),
},
  ];

  /* ================= MOBILE CARD ================= */

  const renderCard = (template, index) => (
    <div className={`${ui.card} p-4`}>
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selectedIds.includes(template._id)}
          onChange={() => toggleSelect(template._id)}
          className="mt-1 h-4 w-4 rounded border-slate-300 accent-indigo-600"
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

         <div className="mt-3 flex items-center gap-2">
           <span
    className={`text-xs font-semibold ${
      template.status === "active"
        ? "text-emerald-600"
        : "text-red-500"
    }`}
  >
    {template.status === "active" ? "Active" : "Inactive"}
  </span>
  <StatusToggle
    checked={template.status === "active"}
    onChange={() => handleStatusToggle(template)}
  />

 
</div>
        </div>
      </div>

      <div className="mt-3 flex justify-end border-t border-slate-100 pt-3">
        <RowActions
          onView={() => setViewTemplate(template)}
          onEdit={() => openEditForm(template)}
          onDelete={() => requestDelete(template)}
        />
      </div>
    </div>
  );

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

        <PageHeader
          title="Email Templates"
          subtitle="Create and manage reusable email templates"
          actions={
            <button
              type="button"
              onClick={openAddForm}
              className={ui.btnPrimary}
            >
              <Plus size={16} />
              Add Email Template
            </button>
          }
        />

        {/* FILTERS */}

        <FilterBar
          onClear={resetFilters}
          showClear={
            Boolean(
              search ||
                statusFilter ||
                sortBy !== "createdAt" ||
                order !== "desc"
            )
          }
        >
          <div className="lg:col-span-4">
            <SearchInput
              value={search}
              onChange={(value) => {
                setSearch(value);
                setCurrentPage(1);
              }}
              placeholder="Search title, slug or subject..."
            />
          </div>

          <div className="lg:col-span-2">
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setCurrentPage(1);
              }}
              className={ui.select}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <select
              value={sortBy}
              onChange={(event) => {
                setSortBy(event.target.value);
                setCurrentPage(1);
              }}
              className={ui.select}
            >
              <option value="createdAt">Created Date</option>
              <option value="title">Title</option>
              <option value="slug">Slug</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <select
              value={order}
              onChange={(event) => {
                setOrder(event.target.value);
                setCurrentPage(1);
              }}
              className={ui.select}
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </FilterBar>

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

        <DataTable
          columns={columns}
          rows={paginatedTemplates}
          rowKey="_id"
          startIndex={(currentPage - 1) * LIMIT}
          loading={loading}
          emptyTitle="No email templates found"
          emptyHint="Add an email template to get started."
          renderActions={(template) => (
            <RowActions
              onView={() => setViewTemplate(template)}
              onEdit={() => openEditForm(template)}
              onDelete={() => requestDelete(template)}
            />
          )}
          renderCard={renderCard}
        />

        {/* PAGINATION */}

        {totalPages > 1 && (
          <div className="py-5">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onChange={setCurrentPage}
            />
          </div>
        )}

        {/* ADD / EDIT MODAL */}

        <Modal
          open={showForm}
          size="lg"
          title={editTemplate ? "Edit Email Template" : "Add Email Template"}
          onClose={closeForm}
        >
          <form
            id="email-template-form"
            onSubmit={submitTemplate}
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
          >
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
                    ...(previous.slug === "" ||
                    previous.slug === makeSlug(previous.title)
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
                form="email-template-form"
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
                <DetailRow label="Title">
                  {viewTemplate.title}
                </DetailRow>

                <DetailRow label="Slug">
                  {viewTemplate.slug}
                </DetailRow>

                <DetailRow label="Subject">
                  {viewTemplate.subject}
                </DetailRow>

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
                <p className="mb-2 text-sm font-medium text-slate-700">
                  Email Content
                </p>

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
            Kya tum {confirmModal.ids.length} selected email template(s)
            delete karna chahte ho? Ye action undo nahi kiya ja sakta.
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

        {/* RESULT MODAL */}

        <Modal
          open={!!result}
          title={
            result?.type === "success"
              ? "Success!"
              : "Something went wrong"
          }
          onClose={() => setResult(null)}
        >
          <p className="mb-6 break-words text-sm text-slate-600">
            {result?.message}
          </p>

          <button
            type="button"
            onClick={() => setResult(null)}
            className={`${ui.btnPrimary} w-full`}
          >
            Okay
          </button>
        </Modal>
      </div>
    </div>
  );
};

export default EmailTemplate;
