
import React, { useCallback, useEffect, useState } from "react";
import api from "./Api/axios";
import {
  Plus,
  Trash2,
  RefreshCw,
  Star,
  Layers,
} from "lucide-react";
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

const initialForm = {
  name: "",
  price: "",
  description: "",
  features: "",
  isPopular: false,
  isActive: true,
  displayOrder: 0,
};

const CounsellingPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [editPlan, setEditPlan] = useState(null);
  const [viewPlan, setViewPlan] = useState(null);
  const [deletePlan, setDeletePlan] = useState(null);

  const [form, setForm] = useState(initialForm);
  const [refreshKey, setRefreshKey] = useState(0);
  const [togglingId, setTogglingId] = useState(null);

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
    Array.isArray(user.permissions) && user.permissions.length
      ? user.permissions
      : storedPermissions;

  const permissions = permissionSource.map((permission) =>
    typeof permission === "string"
      ? permission.toLowerCase()
      : permission?.name?.toLowerCase() || ""
  );

  const canView =
    isSuperAdmin || permissions.includes("counsellingplan.view");

  const canAdd =
    isSuperAdmin || permissions.includes("counsellingplan.create");

  const canUpdate =
    isSuperAdmin || permissions.includes("counsellingplan.update");

  const canDelete =
    isSuperAdmin || permissions.includes("counsellingplan.delete");

  // FETCH PLANS
  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);

      const response = await api.get("/plans");

      const data = response.data;

      const planData =
        data.plans ||
        data.data?.plans ||
        (Array.isArray(data.data) ? data.data : []);

      setPlans(Array.isArray(planData) ? planData : []);
    } catch (error) {
      console.error("Fetch Plans Error:", error);

      toast.error(
        error.response?.data?.message || "Plans fetch nahi ho paaye."
      );

      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canView) {
      fetchPlans();
    }
  }, [canView, fetchPlans, refreshKey]);

  // FILTER
  const filteredPlans = plans.filter((plan) => {
    const searchMatch =
      plan.name?.toLowerCase().includes(search.toLowerCase()) ||
      plan.description?.toLowerCase().includes(search.toLowerCase());

    const statusMatch =
      status === "" ||
      (status === "active" && plan.isActive) ||
      (status === "inactive" && !plan.isActive);

    return searchMatch && statusMatch;
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPlans.length / LIMIT)
  );

  const paginatedPlans = filteredPlans.slice(
    (currentPage - 1) * LIMIT,
    currentPage * LIMIT
  );

  // FORM HANDLERS
  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const openAddForm = () => {
    setEditPlan(null);
    setForm({ ...initialForm });
    setShowForm(true);
  };

  const openEditForm = (plan) => {
    setEditPlan(plan);

    setForm({
      name: plan.name || "",
      price: plan.price ?? "",
      description: plan.description || "",
      features: Array.isArray(plan.features)
        ? plan.features.join("\n")
        : "",
      isPopular: Boolean(plan.isPopular),
      isActive: Boolean(plan.isActive),
      displayOrder: plan.displayOrder ?? 0,
    });

    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;
    setShowForm(false);
    setEditPlan(null);
  };

  // CREATE / UPDATE
  const submitPlan = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      return toast.error("Plan name required hai.");
    }

    if (
      form.price === "" ||
      !Number.isFinite(Number(form.price)) ||
      Number(form.price) < 0
    ) {
      return toast.error("Valid plan price enter karo.");
    }

    if (!form.description.trim()) {
      return toast.error("Plan description required hai.");
    }

    if (
      form.displayOrder === "" ||
      !Number.isFinite(Number(form.displayOrder)) ||
      Number(form.displayOrder) < 0
    ) {
      return toast.error("Valid display order enter karo.");
    }

    const payload = {
      name: form.name.trim(),
      price: Number(form.price),
      description: form.description.trim(),
      features: form.features
        .split("\n")
        .map((feature) => feature.trim())
        .filter(Boolean),
      isPopular: form.isPopular,
      isActive: form.isActive,
      displayOrder: Number(form.displayOrder),
    };

    try {
      setSaving(true);

      const response = editPlan
        ? await api.put(`/plans/${editPlan._id}`, payload)
        : await api.post("/plans", payload);

      if (response.data?.success === false) {
        throw new Error(response.data.message || "Plan save nahi hua.");
      }

      toast.success(
        response.data?.message ||
          (editPlan
            ? "Plan updated successfully!"
            : "Plan created successfully!")
      );

      setShowForm(false);
      setEditPlan(null);
      setForm({ ...initialForm });
      setCurrentPage(1);
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Save Plan Error:", error);

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Plan save nahi ho paya."
      );
    } finally {
      setSaving(false);
    }
  };

  // ACTIVE / INACTIVE
  const togglePlanStatus = async (plan) => {
    if (togglingId) return;

    try {
      setTogglingId(plan._id);

      const response = await api.put(`/plans/${plan._id}`, {
        isActive: !plan.isActive,
      });

      if (response.data?.success === false) {
        throw new Error(response.data.message || "Status update failed.");
      }

      toast.success(
        `Plan ${!plan.isActive ? "activated" : "deactivated"} successfully!`
      );

      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Toggle Plan Error:", error);

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Plan status update nahi ho paya."
      );
    } finally {
      setTogglingId(null);
    }
  };

  // DELETE
  const confirmDelete = async () => {
    if (!deletePlan) return;

    try {
      const response = await api.delete(`/plans/${deletePlan._id}`);

      if (response.data?.success === false) {
        throw new Error(response.data.message || "Delete failed.");
      }

      toast.success(
        response.data?.message || "Plan deleted successfully!"
      );

      setDeletePlan(null);
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Delete Plan Error:", error);

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Plan delete nahi ho paya."
      );
    }
  };

  const resetFilters = () => {
    setSearch("");
    setStatus("");
    setCurrentPage(1);
  };

  // TABLE COLUMNS
  const columns = [
    {
      header: "Plan",
      cell: (plan) => (
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate font-semibold text-slate-900">
              {plan.name}
            </p>

            {plan.isPopular && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                <Star size={11} fill="currentColor" />
                Popular
              </span>
            )}
          </div>

          <p className="truncate text-xs text-slate-500">
            {plan.description}
          </p>
        </div>
      ),
    },
    {
      header: "Price",
      className: "w-[15%]",
      cell: (plan) => (
        <span className="font-semibold text-slate-900">
          ₹{Number(plan.price).toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      header: "Features",
      className: "w-[12%]",
      hideBelow: "lg",
      cell: (plan) => `${plan.features?.length || 0} Features`,
    },
    {
      header: "Order",
      className: "w-[9%]",
      hideBelow: "lg",
      cell: (plan) => plan.displayOrder ?? 0,
    },
    {
      header: "Status",
      className: "w-[20%]",
      cell: (plan) => (
        <div className="flex items-center gap-2">
          <StatusBadge status={plan.isActive ? "active" : "inactive"} />

          {canUpdate && (
            <StatusToggle
              checked={Boolean(plan.isActive)}
              onChange={() => togglePlanStatus(plan)}
              disabled={Boolean(togglingId)}
              label="Toggle plan status"
            />
          )}
        </div>
      ),
    },
  ];

  const renderActions = (plan) => (
    <RowActions
      onView={() => setViewPlan(plan)}
      onEdit={canUpdate ? () => openEditForm(plan) : undefined}
      onDelete={canDelete ? () => setDeletePlan(plan) : undefined}
    />
  );

  const renderCard = (plan) => (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-slate-900">{plan.name}</p>

            {plan.isPopular && (
              <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                Popular
              </span>
            )}
          </div>

          <p className="mt-1 text-sm text-slate-500">
            {plan.description}
          </p>

          <p className="mt-2 text-lg font-bold text-indigo-600">
            ₹{Number(plan.price).toLocaleString("en-IN")}
          </p>
        </div>

        <StatusBadge status={plan.isActive ? "active" : "inactive"} />
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="text-xs text-slate-500">
          {plan.features?.length || 0} Features
        </span>

        <div className="flex items-center gap-3">
          {canUpdate && (
            <StatusToggle
              checked={Boolean(plan.isActive)}
              onChange={() => togglePlanStatus(plan)}
              disabled={Boolean(togglingId)}
            />
          )}

          {renderActions(plan)}
        </div>
      </div>
    </>
  );

  // ACCESS CONTROL
  if (!canView) {
    return (
      <div className={ui.page}>
        <div className={`${ui.container} ${ui.card} p-8 text-center`}>
          <h1 className={ui.title}>Access Denied</h1>
          <p className={ui.subtitle}>
            You don't have permission to view counselling plans.
          </p>
        </div>
      </div>
    );
  }

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
        <PageHeader
          title="Counselling Plans"
          subtitle="Manage counselling packages, pricing and features"
          actions={
            canAdd && (
              <button
                type="button"
                onClick={openAddForm}
                className={ui.btnPrimary}
              >
                <Plus size={16} />
                Add New Plan
              </button>
            )
          }
        />

        {/* FILTERS */}
        <FilterBar>
          <SearchInput
            className="col-span-2 lg:col-span-8"
            placeholder="Search counselling plans..."
            value={search}
            onChange={(value) => {
              setSearch(value);
              setCurrentPage(1);
            }}
          />

          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setCurrentPage(1);
            }}
            className={`${ui.select} lg:col-span-2`}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
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

        {/* SUMMARY */}
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className={`${ui.card} p-4`}>
            <p className="text-sm text-slate-500">Total Plans</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {plans.length}
            </p>
          </div>

          <div className={`${ui.card} p-4`}>
            <p className="text-sm text-slate-500">Active Plans</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">
              {plans.filter((plan) => plan.isActive).length}
            </p>
          </div>

          <div className={`${ui.card} p-4`}>
            <p className="text-sm text-slate-500">Popular Plans</p>
            <p className="mt-1 text-2xl font-bold text-amber-600">
              {plans.filter((plan) => plan.isPopular).length}
            </p>
          </div>
        </div>

        {/* TABLE */}
        <DataTable
          columns={columns}
          rows={loading ? [] : paginatedPlans}
          loading={loading}
          startIndex={(currentPage - 1) * LIMIT}
          renderActions={renderActions}
          renderCard={renderCard}
          emptyTitle="No counselling plans found"
          emptyHint="Add a new plan to get started."
        />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onChange={setCurrentPage}
        />
      </div>

      {/* ADD / EDIT MODAL */}
      <Modal
        open={showForm}
        size="lg"
        title={editPlan ? "Edit Counselling Plan" : "Add Counselling Plan"}
        onClose={closeForm}
      >
        <form
          onSubmit={submitPlan}
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          <Field label="Plan Name *">
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Silver"
              required
              className={ui.input}
            />
          </Field>

          <Field label="Price (₹) *">
            <input
              type="number"
              name="price"
              min="0"
              value={form.price}
              onChange={handleChange}
              placeholder="Enter price"
              required
              className={ui.input}
            />
          </Field>

          <Field label="Display Order">
            <input
              type="number"
              name="displayOrder"
              min="0"
              value={form.displayOrder}
              onChange={handleChange}
              className={ui.input}
            />
          </Field>

          <Field label="Description *" className="md:col-span-2">
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              required
              placeholder="Enter plan description"
              className={ui.input}
            />
          </Field>

          <Field label="Features (one per line)" className="md:col-span-2">
            <textarea
              name="features"
              value={form.features}
              onChange={handleChange}
              rows={5}
              placeholder={"Career Guidance\nUniversity Suggestions\nEmail Support"}
              className={ui.input}
            />
          </Field>

          <div className="flex flex-wrap gap-6 md:col-span-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                name="isPopular"
                checked={form.isPopular}
                onChange={handleChange}
                className={ui.checkbox}
              />
              <Star size={15} className="text-amber-500" />
              Mark as Popular
            </label>

            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                name="isActive"
                checked={form.isActive}
                onChange={handleChange}
                className={ui.checkbox}
              />
              Active Plan
            </label>
          </div>

          <div className="flex flex-col-reverse gap-3 pt-3 sm:flex-row md:col-span-2">
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
                : editPlan
                  ? "Update Plan"
                  : "Create Plan"}
            </button>
          </div>
        </form>
      </Modal>

      {/* VIEW MODAL */}
      <Modal
        open={!!viewPlan}
        title="Counselling Plan Details"
        onClose={() => setViewPlan(null)}
      >
        {viewPlan && (
          <div>
            <div className="mb-4 flex items-center gap-3 rounded-xl bg-indigo-50 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-indigo-600">
                <Layers size={23} />
              </div>

              <div>
                <h3 className="font-bold text-slate-900">
                  {viewPlan.name}
                </h3>

                <p className="text-lg font-bold text-indigo-600">
                  ₹{Number(viewPlan.price).toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 rounded-xl bg-slate-50 px-4">
              <DetailRow label="Description">
                {viewPlan.description}
              </DetailRow>

              <DetailRow label="Status">
                <StatusBadge
                  status={viewPlan.isActive ? "active" : "inactive"}
                />
              </DetailRow>

              <DetailRow label="Popular">
                {viewPlan.isPopular ? "Yes" : "No"}
              </DetailRow>

              <DetailRow label="Display Order">
                {viewPlan.displayOrder ?? 0}
              </DetailRow>

              <DetailRow label="Features">
                {viewPlan.features?.length || 0}
              </DetailRow>
            </div>

            <div className="mt-4 rounded-xl border border-slate-100 p-4">
              <h4 className="mb-3 text-sm font-semibold text-slate-900">
                Plan Features
              </h4>

              {viewPlan.features?.length ? (
                <ul className="space-y-2">
                  {viewPlan.features.map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm text-slate-600"
                    >
                      <span className="mt-1 text-emerald-600">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-400">
                  No features added.
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* DELETE CONFIRMATION */}
      <Modal
        open={!!deletePlan}
        title="Delete Counselling Plan"
        onClose={() => setDeletePlan(null)}
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <Trash2 size={22} />
        </div>

        <p className="mb-6 text-sm text-slate-600">
          Are you sure you want to delete{" "}
          <strong>{deletePlan?.name}</strong>? This action cannot be undone.
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setDeletePlan(null)}
            className={`${ui.btnSecondary} flex-1`}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={confirmDelete}
            className={`${ui.btnDanger} flex-1`}
          >
            Yes, Delete
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default CounsellingPlans;
