import React, { useCallback, useEffect, useState } from "react";
import api from "./Api/axios";
import { Trash2, Plus, X, RefreshCw, Check } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BulkStreamImport from "./assets/Components/BulkStreamImport";
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

/* ============================================================
   PAGE-SPECIFIC SMALL PIECES
   ============================================================ */

const ResultModal = ({ result, onClose }) => {
  if (!result) return null;

  const ok = result.type === "success";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
        <div
          className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
            ok
              ? "bg-emerald-50 text-emerald-600"
              : "bg-rose-50 text-rose-600"
          }`}
        >
          {ok ? <Check size={28} /> : <X size={28} />}
        </div>

        <h2 className="mb-1 text-lg font-bold text-slate-900">
          {ok ? "Success!" : "Something went wrong"}
        </h2>

        <p className="mb-6 break-words text-sm text-slate-500">
          {result.message}
        </p>

        <button
          type="button"
          onClick={onClose}
          className={`w-full ${ok ? ui.btnPrimary : ui.btnDanger}`}
        >
          Okay
        </button>
      </div>
    </div>
  );
};

/* ============================================================
   CONSTANTS
   ============================================================ */

const LIMIT = 10;

const initialForm = {
  name: "",
  slug: "",
  code: "",
  description: "",
  icon: "",
  image: "",
  logo: "",
  streamType: "government",
  parentStream: "",
  displayOrder: 0,
  status: "active",
  isVerified: false,
  createdBy: "",
};

/* ============================================================
   MAIN PAGE
   ============================================================ */

const Stream = () => {
  const [streams, setStreams] = useState([]);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const storedPermissions = JSON.parse(
    localStorage.getItem("permissions") || "[]"
  );

  const role =
    typeof user.role === "object"
      ? user.role?.role || user.role?.name || ""
      : user.role || "";

  const isSuperAdmin = role.toLowerCase() === "superadmin";

  const permissionSource =
    Array.isArray(user.permissions) && user.permissions.length > 0
      ? user.permissions
      : storedPermissions;

  const permissions = permissionSource.map((permission) =>
    typeof permission === "string"
      ? permission.toLowerCase()
      : permission?.name?.toLowerCase() || ""
  );

  const canView = isSuperAdmin || permissions.includes("stream.view");
  const canAdd = isSuperAdmin || permissions.includes("stream.create");
  const canUpdate = isSuperAdmin || permissions.includes("stream.update");
  const canDelete = isSuperAdmin || permissions.includes("stream.delete");

  const [showForm, setShowForm] = useState(false);
  const [viewStream, setViewStream] = useState(null);
  const [editStream, setEditStream] = useState(null);
  const [form, setForm] = useState(initialForm);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [order, setOrder] = useState("desc");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [togglingStreamId, setTogglingStreamId] = useState(null);

  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const [confirmModal, setConfirmModal] = useState({
    open: false,
    type: "",
    ids: [],
  });

  const [result, setResult] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const showResult = (message, type = "success") => {
    setResult({ type, message });

    if (type === "success") {
      toast.success(message);
    } else {
      toast.error(message);
    }
  };

  /* ============================================================
     FETCH STREAMS
     ============================================================ */

  const fetchStreams = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/stream/Get-All-Streams", {
        params: {
          search,
          status,
          page: currentPage,
          limit: LIMIT,
          sortBy,
          order,
        },
      });

      const data = res.data;

      const streamData =
        data.streams ??
        data.data?.streams ??
        (Array.isArray(data.data) ? data.data : []);

      setStreams(Array.isArray(streamData) ? streamData : []);

      setTotalPages(
        Math.max(
          1,
          Number(
            data.totalPages ??
              data.pagination?.totalPages ??
              data.data?.totalPages ??
              1
          )
        )
      );

      setSelectedIds([]);
    } catch (err) {
      console.error("Fetch Streams Error:", err);

      setError(
        err.response?.data?.message || "Streams fetch nahi ho paaye."
      );

      setStreams([]);
    } finally {
      setLoading(false);
    }
  }, [search, status, currentPage, sortBy, order, refreshKey]);

  useEffect(() => {
    if (canView) {
      fetchStreams();
    }
  }, [fetchStreams, canView]);

  /* ============================================================
     FORM HANDLERS
     ============================================================ */

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (error) {
      setError("");
    }
  };

  const openAddForm = () => {
    setEditStream(null);
    setForm({ ...initialForm });
    setError("");
    setShowForm(true);
  };

  const openEditForm = (stream) => {
    setEditStream(stream);

    setForm({
      ...initialForm,
      ...stream,
      parentStream:
        typeof stream.parentStream === "object"
          ? stream.parentStream?._id || ""
          : stream.parentStream || "",
      displayOrder: stream.displayOrder ?? 0,
      isVerified: stream.isVerified ?? false,
    });

    setError("");
    setViewStream(null);
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setError("");
  };

  const fail = (message) => {
    setError(message);
    toast.error(message);
  };

  /* ============================================================
     TOGGLE STREAM STATUS
     ============================================================ */

  const toggleStreamStatus = async (stream) => {
    if (!canUpdate) {
      toast.error("You don't have permission to update streams.");
      return;
    }

    if (togglingStreamId) return;

    const newStatus =
      stream.status === "active" ? "inactive" : "active";

    try {
      setTogglingStreamId(stream._id);

      const response = await api.put("/stream/Edit-Stream", {
        id: stream._id,
        status: newStatus,
      });

      if (response.data?.status === false) {
        throw new Error(
          response.data.message || "Status update nahi ho paya."
        );
      }

      toast.success(
        `Stream ${
          newStatus === "active" ? "activated" : "deactivated"
        } successfully!`
      );

      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error("Toggle Stream Status Error:", err);

      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Stream status update nahi ho paya."
      );
    } finally {
      setTogglingStreamId(null);
    }
  };

  /* ============================================================
     ADD / EDIT STREAM
     ============================================================ */

  const submitStream = async () => {
    if (!form.name.trim()) {
      return fail("Stream name required hai.");
    }

    if (!form.slug.trim()) {
      return fail("Stream slug required hai.");
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug.trim())) {
      return fail(
        "Slug mein sirf lowercase letters, numbers aur hyphens use karo."
      );
    }

    if (!form.code.trim()) {
      return fail("Stream code required hai.");
    }

    if (
      form.displayOrder === "" ||
      !Number.isFinite(Number(form.displayOrder)) ||
      Number(form.displayOrder) < 0
    ) {
      return fail(
        "Display order valid non-negative number hona chahiye."
      );
    }

    const isEditing = Boolean(editStream);

    const payload = {
      ...form,
      name: form.name.trim(),
      slug: form.slug.trim(),
      code: form.code.trim(),
      displayOrder: Number(form.displayOrder),
    };

    if (!payload.parentStream) {
      delete payload.parentStream;
    }

    try {
      setSaving(true);
      setError("");

      const response = isEditing
        ? await api.put("/stream/Edit-Stream", {
            ...payload,
            id: editStream._id,
          })
        : await api.post("/stream/Add-New-Stream", payload);

      if (response.data?.status === false) {
        throw new Error(
          response.data.message || "Stream save nahi ho paayi."
        );
      }

      const message =
        response.data?.message ||
        (isEditing
          ? "Stream updated successfully!"
          : "Stream added successfully!");

      setShowForm(false);
      setEditStream(null);
      setForm({ ...initialForm });

      showResult(message, "success");

      if (!isEditing) {
        setSearch("");
        setStatus("");
        setSortBy("createdAt");
        setOrder("desc");
        setCurrentPage(1);
      }

      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error("Save Stream Error:", err);

      const message =
        err.response?.data?.message ||
        err.message ||
        "Stream save nahi ho paayi.";

      setError(message);
      showResult(message, "error");
    } finally {
      setSaving(false);
    }
  };

  /* ============================================================
     DELETE
     ============================================================ */

  const closeConfirm = () => {
    setConfirmModal({
      open: false,
      type: "",
      ids: [],
    });
  };

  const bulkDelete = () => {
    if (!selectedIds.length) {
      toast.error("Pehle streams select karo.");
      return;
    }

    setConfirmModal({
      open: true,
      type: "bulk",
      ids: [...selectedIds],
    });
  };

  const confirmDelete = async () => {
    const { ids, type } = confirmModal;

    closeConfirm();

    if (!ids.length) return;

    try {
      if (type === "bulk") {
        setBulkDeleting(true);
      }

      if (type === "single") {
        await api.delete("/stream/Delete-Stream", {
          data: { id: ids[0] },
        });

        setSelectedIds((prev) =>
          prev.filter((id) => id !== ids[0])
        );

        showResult("Stream deleted successfully!", "success");
      } else if (type === "bulk") {
        const results = await Promise.allSettled(
          ids.map((id) =>
            api.delete("/stream/Delete-Stream", {
              data: { id },
            })
          )
        );

        const succeeded = results.filter(
          (r) => r.status === "fulfilled"
        ).length;

        const failed = results.length - succeeded;

        setSelectedIds([]);

        if (failed === 0) {
          showResult(
            `${succeeded} selected stream(s) deleted successfully!`,
            "success"
          );
        } else if (succeeded > 0) {
          showResult(
            `${succeeded} stream(s) deleted. ${failed} stream(s) delete nahi hui.`,
            "error"
          );
        } else {
          showResult(
            "Selected streams delete nahi ho paayi.",
            "error"
          );
        }
      }

      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error("Delete Stream Error:", err);

      showResult(
        err.response?.data?.message ||
          "Stream delete nahi ho paayi.",
        "error"
      );
    } finally {
      setBulkDeleting(false);
    }
  };

  /* ============================================================
     SELECTION
     ============================================================ */

  const pageIds = streams.map((s) => s._id);

  const allSelected =
    pageIds.length > 0 &&
    pageIds.every((id) => selectedIds.includes(id));

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((itemId) => itemId !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) =>
      allSelected
        ? prev.filter((id) => !pageIds.includes(id))
        : [...new Set([...prev, ...pageIds])]
    );
  };

  const resetFilters = () => {
    setSearch("");
    setStatus("");
    setSortBy("createdAt");
    setOrder("desc");
    setCurrentPage(1);
  };

  const checkbox = ui.checkbox;

  /* ============================================================
     TABLE CONFIG (UI only)
     ============================================================ */

  const renderToggle = (s) =>
    canUpdate && (
      <StatusToggle
        checked={s.status === "active"}
        onChange={() => toggleStreamStatus(s)}
        disabled={Boolean(togglingStreamId)}
        label={`Click to make ${
          s.status === "active" ? "Inactive" : "Active"
        }`}
      />
    );

  const columns = [
    {
      header: "Stream",
      cell: (s) => (
        <>
          <p
            className="truncate font-semibold text-slate-900"
            title={s.name}
          >
            {s.name}
          </p>

          <p className="truncate text-xs text-slate-500">{s.slug}</p>
        </>
      ),
    },
    {
      header: "Code",
      className: "w-[11%]",
      hideBelow: "lg",
      truncate: true,
      cell: (s) => s.code || "-",
    },
    {
      header: "Type",
      className: "w-[13%]",
      hideBelow: "lg",
      cell: (s) => (
        <span className={`${ui.badge} ${badgeColor.role}`}>
          {s.streamType || "-"}
        </span>
      ),
    },
    {
      header: "Status",
      className: "w-[15%]",
      cell: (s) => (
        <div className="flex flex-col items-start gap-2">
          <StatusBadge status={s.status} />
          {renderToggle(s)}
        </div>
      ),
    },
    {
      header: "Order",
      className: "w-[9%]",
      hideBelow: "xl",
      cell: (s) => s.displayOrder ?? 0,
    },
  ];

  const renderActions = (s) => (
    <RowActions
      onView={() => setViewStream(s)}
      onEdit={canUpdate ? () => openEditForm(s) : undefined}
      onDelete={
        canDelete
          ? () =>
              setConfirmModal({
                open: true,
                type: "single",
                ids: [s._id],
              })
          : undefined
      }
    />
  );

  const renderCard = (s) => (
    <>
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selectedIds.includes(s._id)}
          onChange={() => toggleSelect(s._id)}
          aria-label="Select stream"
          className={`${checkbox} mt-1`}
        />

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-900">
            {s.name}
          </p>

          <p className="truncate text-sm text-slate-500">
            {s.slug}
            {s.code ? ` • ${s.code}` : ""}
          </p>
        </div>

        <StatusBadge status={s.status} />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className={`${ui.badge} ${badgeColor.role}`}>
            {s.streamType || "-"}
          </span>

          {renderToggle(s)}
        </div>

        {renderActions(s)}
      </div>
    </>
  );

  /* ============================================================
     ACCESS CONTROL
     ============================================================ */

  if (!canView) {
    return (
      <div className={ui.page}>
        <div className={`${ui.container} ${ui.card} p-8 text-center`}>
          <h1 className={ui.title}>Access Denied</h1>

          <p className={ui.subtitle}>
            You don't have permission to view streams.
          </p>
        </div>
      </div>
    );
  }

  /* ============================================================
     MAIN UI
     ============================================================ */

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
          title="Stream Management"
          subtitle="Manage university streams"
          actions={
            <>
              {canAdd && <BulkStreamImport />}

              {canAdd && (
                <button
                  type="button"
                  onClick={openAddForm}
                  className={ui.btnPrimary}
                >
                  <Plus size={16} />
                  Add New Stream
                </button>
              )}
            </>
          }
        />

        {/* FILTERS */}

        <FilterBar>
          <SearchInput
            className="col-span-2 lg:col-span-4"
            placeholder="Search streams..."
            value={search}
            onChange={(value) => {
              setSearch(value);
              setCurrentPage(1);
            }}
          />

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setCurrentPage(1);
            }}
            className={`${ui.select} lg:col-span-2`}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setCurrentPage(1);
            }}
            className={`${ui.select} lg:col-span-2`}
          >
            <option value="createdAt">Created Date</option>
            <option value="name">Name</option>
            <option value="displayOrder">Display Order</option>
          </select>

          <select
            value={order}
            onChange={(e) => {
              setOrder(e.target.value);
              setCurrentPage(1);
            }}
            className={`${ui.select} lg:col-span-2`}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>

          <button
            type="button"
            onClick={resetFilters}
            className={`${ui.btnSecondary} !px-3 lg:col-span-2`}
          >
            <RefreshCw size={15} />
            Reset
          </button>
        </FilterBar>

        {/* BULK ACTIONS */}

        {canDelete && selectedIds.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-indigo-50 p-3 ring-1 ring-indigo-100">
            <span className="pl-2 text-sm font-medium text-indigo-800">
              {selectedIds.length} stream(s) selected
            </span>

            <button
              type="button"
              onClick={bulkDelete}
              disabled={bulkDeleting}
              className={ui.btnDanger}
            >
              <Trash2 size={15} />
              {bulkDeleting ? "Deleting..." : "Delete Selected"}
            </button>
          </div>
        )}

        {/* FETCH ERROR */}

        {error && !showForm && (
          <div
            role="alert"
            className="mb-4 flex items-center justify-between gap-3 rounded-2xl bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-rose-100"
          >
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

        {/* TABLE / CARDS */}

        <DataTable
          columns={columns}
          rows={loading ? [] : streams}
          loading={loading}
          startIndex={(currentPage - 1) * LIMIT}
          selection={{
            selectedIds,
            onToggle: toggleSelect,
            onToggleAll: toggleSelectAll,
            allSelected,
          }}
          renderActions={renderActions}
          renderCard={renderCard}
          emptyTitle="No streams found."
        />

        {/* PAGINATION */}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onChange={(page) => {
            if (page >= 1 && page <= totalPages) {
              setCurrentPage(page);
            }
          }}
        />
      </div>

      {/* ========================================================
          ADD / EDIT MODAL
         ======================================================== */}

      <Modal
        open={showForm}
        size="lg"
        title={editStream ? "Edit Stream" : "Add New Stream"}
        onClose={closeForm}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitStream();
          }}
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          {error && (
            <div
              role="alert"
              className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-rose-100 md:col-span-2"
            >
              {error}
            </div>
          )}

          <Field label="Stream Name *">
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="Enter stream name"
              className={ui.input}
            />
          </Field>

          <Field label="Slug *">
            <input
              name="slug"
              value={form.slug}
              onChange={handleChange}
              required
              placeholder="computer-science"
              className={ui.input}
            />
          </Field>

          <Field label="Stream Code *">
            <input
              name="code"
              value={form.code}
              onChange={handleChange}
              required
              placeholder="CS"
              className={ui.input}
            />
          </Field>

          <Field label="Stream Type">
            <select
              name="streamType"
              value={form.streamType}
              onChange={handleChange}
              className={`${ui.select} w-full`}
            >
              <option value="government">Government</option>
              <option value="private">Private</option>
              <option value="deemed">Deemed</option>
              <option value="autonomous">Autonomous</option>
              <option value="public">Public</option>
            </select>
          </Field>

          <Field label="Icon">
            <input
              name="icon"
              value={form.icon}
              onChange={handleChange}
              placeholder="Icon name or URL"
              className={ui.input}
            />
          </Field>

          <Field label="Image URL">
            <input
              name="image"
              value={form.image}
              onChange={handleChange}
              placeholder="Enter image URL"
              className={ui.input}
            />
          </Field>

          <Field label="Logo URL">
            <input
              name="logo"
              value={form.logo}
              onChange={handleChange}
              placeholder="Enter logo URL"
              className={ui.input}
            />
          </Field>

          <Field label="Parent Stream ID">
            <input
              name="parentStream"
              value={form.parentStream}
              onChange={handleChange}
              placeholder="Optional parent stream ID"
              className={ui.input}
            />
          </Field>

          <Field label="Display Order">
            <input
              type="number"
              min="0"
              name="displayOrder"
              value={form.displayOrder}
              onChange={handleChange}
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

          <Field label="Description" className="md:col-span-2">
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows="3"
              placeholder="Enter stream description"
              className={ui.input}
            />
          </Field>

          <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-slate-700 md:col-span-2">
            <input
              type="checkbox"
              name="isVerified"
              checked={Boolean(form.isVerified)}
              onChange={handleChange}
              className={checkbox}
            />
            Mark as verified
          </label>

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
                ? editStream
                  ? "Updating Stream..."
                  : "Adding Stream..."
                : editStream
                  ? "Update Stream"
                  : "Add Stream"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================
          VIEW MODAL
         ======================================================== */}

      <Modal
        open={!!viewStream}
        title="Stream Details"
        onClose={() => setViewStream(null)}
      >
        {viewStream && (
          <div>
            <div className="divide-y divide-slate-100 rounded-xl bg-slate-50 px-4">
              <DetailRow label="Name">{viewStream.name}</DetailRow>
              <DetailRow label="Slug">{viewStream.slug}</DetailRow>
              <DetailRow label="Code">{viewStream.code}</DetailRow>

              <DetailRow label="Type">
                <span className="capitalize">
                  {viewStream.streamType}
                </span>
              </DetailRow>

              <DetailRow label="Status">
                <StatusBadge status={viewStream.status} />
              </DetailRow>

              <DetailRow label="Display Order">
                {viewStream.displayOrder ?? 0}
              </DetailRow>

              <DetailRow label="Parent Stream">
                {typeof viewStream.parentStream === "object"
                  ? viewStream.parentStream?.name
                  : viewStream.parentStream}
              </DetailRow>

              <DetailRow label="Verified">
                {viewStream.isVerified ? "Yes" : "No"}
              </DetailRow>

              <DetailRow label="Description">
                {viewStream.description}
              </DetailRow>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setViewStream(null)}
                className={`${ui.btnSecondary} flex-1`}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================
          DELETE CONFIRMATION
         ======================================================== */}

      <Modal
        open={confirmModal.open}
        title="Confirm Delete"
        onClose={closeConfirm}
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <Trash2 size={22} />
        </div>

        <p className="mb-6 text-sm text-slate-600">
          {confirmModal.type === "bulk"
            ? `Kya tum ${confirmModal.ids.length} selected streams delete karna chahte ho? Ye action undo nahi kiya ja sakta.`
            : "Kya tum ye stream delete karna chahte ho? Ye action undo nahi kiya ja sakta."}
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={closeConfirm}
            className={`${ui.btnSecondary} flex-1`}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={confirmDelete}
            disabled={bulkDeleting}
            className={`${ui.btnDanger} flex-1`}
          >
            {bulkDeleting ? "Deleting..." : "Yes, Delete"}
          </button>
        </div>
      </Modal>

      {/* RESULT MODAL */}

      <ResultModal
        result={result}
        onClose={() => setResult(null)}
      />
    </div>
  );
};

export default Stream;
