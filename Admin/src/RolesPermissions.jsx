import React, { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "./Api/axios";
import {
  ui,
  badgeColor,
  PageHeader,
  Modal,
  Avatar,
  RowActions,
  DataTable,
} from "./assets/Components/ui/ui";

const RolesPermissions = () => {
  const [roles, setRoles] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [newRole, setNewRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [permissionState, setPermissionState] = useState({});

  // Fetch roles and permissions
  const fetchRolesPermissions = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Login token nahi mila. Pehle login karo.");
      }

      const response = await api.get("/roles/permissions");
      const data = response.data;

      if (!data.status) {
        throw new Error(
          data.message || "Roles aur permissions fetch nahi hue."
        );
      }

      const fetchedPermissions = data.permissions || [];

      const fetchedRoles = (data.roles || [])
        .filter(
          (role) =>
            String(role.role).toLowerCase() !== "superadmin"
        )
        .map((role) => ({
          id: role._id,
          name: role.role,
          users: 0,
          description: `${role.role} role`,
          color: "blue",
          assignedPermissions: (role.permissions || []).map(
            (permission) =>
              typeof permission === "object"
                ? permission._id
                : permission
          ),
        }));

      setAllPermissions(fetchedPermissions);
      setRoles(fetchedRoles);

      setSelectedRole((currentRole) => {
        const roleExists = fetchedRoles.some(
          (role) => role.name === currentRole
        );

        if (roleExists) {
          return currentRole;
        }

        const adminRole = fetchedRoles.find(
          (role) => role.name === "Admin"
        );

        return adminRole?.name || fetchedRoles[0]?.name || "";
      });

      const updatedPermissionState = {};

      fetchedRoles.forEach((role) => {
        updatedPermissionState[role.name] = {};

        fetchedPermissions.forEach((permission) => {
          const moduleName = permission.resource || "General";
          const actionName = permission.action || permission.name;

          if (!updatedPermissionState[role.name][moduleName]) {
            updatedPermissionState[role.name][moduleName] = {};
          }

          updatedPermissionState[role.name][moduleName][actionName] =
            role.assignedPermissions.some(
              (permissionId) =>
                String(permissionId) === String(permission._id)
            );
        });
      });

      setPermissionState(updatedPermissionState);
    } catch (err) {
      console.error("Fetch Roles Permissions Error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Roles aur permissions load nahi ho sake."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRolesPermissions();
  }, []);

  // Currently selected role
  const selectedRoleData = roles.find(
    (role) => role.name === selectedRole
  );

  // Change permission checkbox
  const handlePermissionChange = (
    moduleName,
    actionName,
    checked
  ) => {
    if (!selectedRoleData) return;

    setPermissionState((previousState) => ({
      ...previousState,
      [selectedRole]: {
        ...previousState[selectedRole],
        [moduleName]: {
          ...previousState[selectedRole]?.[moduleName],
          [actionName]: checked,
        },
      },
    }));
  };

  // Find permission ID
  const getPermissionId = (moduleName, actionName) => {
    return allPermissions.find(
      (permission) =>
        (permission.resource || "General") === moduleName &&
        (permission.action || permission.name) === actionName
    )?._id;
  };

  // Save selected role permissions
  const savePermissions = async () => {
    if (!selectedRoleData) {
      toast.error("Pehle ek role select karo.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const selectedPermissions = permissionState[selectedRole] || {};
      const selectedPermissionIds = [];

      Object.entries(selectedPermissions).forEach(
        ([moduleName, actions]) => {
          Object.entries(actions).forEach(
            ([actionName, isChecked]) => {
              if (isChecked) {
                const permissionId = getPermissionId(
                  moduleName,
                  actionName
                );

                if (permissionId) {
                  selectedPermissionIds.push(permissionId);
                }
              }
            }
          );
        }
      );

      const response = await api.put(
  `/permission/${selectedRoleData.id}/permissions`,
  {
    permissions: selectedPermissionIds,
  }
);

      if (response.data?.status === false) {
        throw new Error(
          response.data.message || "Permissions save nahi hui."
        );
      }

      toast.success(
        response.data?.message ||
          "Permissions successfully save ho gayi."
      );

      setShowPermissionsModal(false);
      await fetchRolesPermissions();
    } catch (err) {
      console.error("Save Permissions Error:", err);

      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Permissions save nahi ho saki."
      );
    } finally {
      setSaving(false);
    }
  };

  // Create role
  const createRole = async (event) => {
    event.preventDefault();

    const roleName = newRole.trim();

    if (!roleName) {
      toast.error("Role name enter karo.");
      return;
    }

    setCreating(true);
    setError("");

    try {
      const response = await api.post("/roles/create-role", {
        role: roleName,
      });

      if (response.data?.status === false) {
        throw new Error(
          response.data.message || "Role create nahi hua."
        );
      }

      setNewRole("");
      setShowForm(false);

      await fetchRolesPermissions();

      setSelectedRole(response.data?.role?.role || roleName);

      toast.success(
        response.data?.message || "Role successfully create ho gaya."
      );
    } catch (err) {
      console.error("Create Role Error:", err);

      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Role create nahi ho saka."
      );
    } finally {
      setCreating(false);
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (role) => {
    setError("");
    setRoleToDelete(role);
  };

  // Close delete confirmation modal
  const closeDeleteModal = () => {
    if (deleting) return;
    setRoleToDelete(null);
  };

  // Delete role using backend API
  const handleDeleteRole = async () => {
    if (!roleToDelete || deleting) return;

    setDeleting(true);

    try {
      const response = await api.delete(
        `/roles/delete-role/${roleToDelete.id}`
      );

      if (response.data?.status === false) {
        throw new Error(
          response.data.message || "Role delete nahi hua."
        );
      }

      const deletedRoleName = roleToDelete.name;

      setRoleToDelete(null);

      toast.success(
        response.data?.message ||
          `${deletedRoleName} role successfully delete ho gaya.`
      );

      await fetchRolesPermissions();
    } catch (err) {
      console.error("Delete Role Error:", err);

      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Role delete nahi ho saka."
      );
    } finally {
      setDeleting(false);
    }
  };

  // Display permission labels
  const formatLabel = (value) => {
    if (!value) return "";

    return String(value)
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (character) => character.toUpperCase());
  };

  // ================= TABLE CONFIG (UI only) =================

  const columns = [
    {
      header: "Role Name",
      cell: (role) => (
        <div className="flex items-center gap-3">
          <Avatar name={role.name} size="sm" />
          <span className="truncate font-semibold text-slate-900">
            {role.name}
          </span>
        </div>
      ),
    },
    {
      header: "Description",
      className: "w-[28%]",
      hideBelow: "lg",
      cell: (role) => role.description,
    },
    {
      header: "Permissions",
      className: "w-[22%]",
      cell: (role) => (
        <span className={`${ui.badge} ${badgeColor.role}`}>
          {role.assignedPermissions.length} assigned
        </span>
      ),
    },
  ];

  const renderActions = (role) => (
    <RowActions
      onEdit={() => {
        setSelectedRole(role.name);
        setError("");
        setShowPermissionsModal(true);
      }}
      onDelete={() => openDeleteModal(role)}
    />
  );

  const renderCard = (role) => (
    <>
      <div className="flex items-start gap-3">
        <Avatar name={role.name} />

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-900">
            {role.name}
          </p>

          <p className="truncate text-sm text-slate-500">
            {role.description}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <span className={`${ui.badge} ${badgeColor.role}`}>
          {role.assignedPermissions.length} assigned
        </span>

        {renderActions(role)}
      </div>
    </>
  );

  return (
    <div className={ui.page}>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="colored"
      />

      <div className={ui.container}>
        {/* Header */}
        <PageHeader
          title="Roles & Permissions Management"
          subtitle="Manage roles and control access permissions."
          actions={
            <button
              type="button"
              onClick={() => {
                setError("");
                setShowForm((previous) => !previous);
              }}
              className={showForm ? ui.btnSecondary : ui.btnPrimary}
            >
              {showForm ? "Cancel" : "+ Create Role"}
            </button>
          }
        />

        {/* Fetch error */}
        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start justify-between gap-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200"
          >
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="font-bold"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        {/* Create Role Form */}
        {showForm && (
          <form
            onSubmit={createRole}
            className={`${ui.card} mb-5 p-4 sm:p-5`}
          >
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              Create New Role
            </h2>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={newRole}
                onChange={(event) => setNewRole(event.target.value)}
                placeholder="Enter role name (e.g. Teacher, Manager)"
                className={`${ui.input} sm:max-w-sm`}
                required
              />

              <button
                type="submit"
                disabled={creating}
                className={ui.btnPrimary}
              >
                {creating ? "Creating..." : "Create Role"}
              </button>
            </div>

            <p className="mt-3 text-xs text-slate-500">
              Enter a unique role name. Existing roles cannot be created
              again.
            </p>
          </form>
        )}

        {/* Roles Table */}
        <h2 className="mb-3 text-lg font-semibold text-slate-900">
          Available Roles
        </h2>

        <DataTable
          columns={columns}
          rows={loading ? [] : roles}
          rowKey={(role) => role.id}
          showIndex={false}
          loading={loading}
          renderActions={renderActions}
          renderCard={renderCard}
          emptyTitle="No roles found."
          emptyHint="Check the API response and backend."
        />
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!roleToDelete}
        title="Delete Role?"
        onClose={closeDeleteModal}
      >
        {roleToDelete && (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50">
              <Trash2 size={26} className="text-rose-600" />
            </div>

            <p className="mt-4 text-center text-sm leading-6 text-slate-600">
              Kya tum{" "}
              <span className="font-semibold text-slate-900">
                {roleToDelete.name}
              </span>{" "}
              role ko delete karna chahte ho? Ye action undo nahi ho
              sakta.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                disabled={deleting}
                onClick={closeDeleteModal}
                className={ui.btnSecondary}
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteRole}
                className={ui.btnDanger}
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* Permissions Modal */}
      <Modal
        open={showPermissionsModal}
        size="xl"
        title="Edit Role Permissions"
        onClose={() => {
          if (!saving) setShowPermissionsModal(false);
        }}
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={saving}
              onClick={() => setShowPermissionsModal(false)}
              className={ui.btnSecondary}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={savePermissions}
              disabled={saving || loading || !selectedRoleData}
              className={ui.btnPrimary}
            >
              {saving ? "Saving..." : "Save Permissions"}
            </button>
          </div>
        }
      >
        <p className="mb-4 text-sm text-slate-500">
          Role:{" "}
          <span className="font-semibold text-slate-800">
            {selectedRoleData?.name || selectedRole}
          </span>
        </p>

        <div className="space-y-4">
          {!selectedRoleData ? (
            <p className="py-6 text-center text-slate-500">
              Selected role nahi mila.
            </p>
          ) : allPermissions.length === 0 ? (
            <p className="py-6 text-center text-slate-500">
              No permissions found in the backend.
            </p>
          ) : (
            Object.entries(permissionState[selectedRole] || {}).map(
              ([moduleName, actions]) => (
                <div
                  key={moduleName}
                  className="overflow-hidden rounded-xl ring-1 ring-slate-200"
                >
                  <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                    <h3 className="font-semibold text-slate-800">
                      {formatLabel(moduleName)}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(actions).map(
                      ([actionName, checked]) => (
                        <label
                          key={actionName}
                          className={`flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${
                            checked
                              ? "border-indigo-200 bg-indigo-50"
                              : "border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(checked)}
                            disabled={saving}
                            onChange={(event) =>
                              handlePermissionChange(
                                moduleName,
                                actionName,
                                event.target.checked
                              )
                            }
                            className="h-4 w-4 accent-indigo-600"
                          />

                          <span className="text-sm text-slate-700">
                            {formatLabel(actionName)}
                          </span>
                        </label>
                      )
                    )}
                  </div>
                </div>
              )
            )
          )}
        </div>
      </Modal>
    </div>
  );
};

export default RolesPermissions;
