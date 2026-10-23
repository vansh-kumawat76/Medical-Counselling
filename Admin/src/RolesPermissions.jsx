
import React, { useEffect, useState } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "./Api/axios";

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

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="colored"
      />

      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Roles & Permissions
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage roles and control access permissions.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setError("");
              setShowForm((previous) => !previous);
            }}
            className="rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-700"
          >
            {showForm ? "Cancel" : "+ Create Role"}
          </button>
        </div>

        {/* Fetch error */}
        {error && (
          <div className="flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h2 className="mb-4 text-lg font-semibold text-slate-800">
              Create New Role
            </h2>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={newRole}
                onChange={(event) => setNewRole(event.target.value)}
                placeholder="Enter role name (e.g. Teacher, Manager)"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-blue-500 sm:max-w-sm"
                required
              />

              <button
                type="submit"
                disabled={creating}
                className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
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
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-800">
              Available Roles
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500">
              Loading roles and permissions...
            </div>
          ) : roles.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No roles found. Check the API response and backend.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-5 py-3 font-semibold">
                      Role Name
                    </th>
                    <th className="px-5 py-3 font-semibold">
                      Description
                    </th>
                    <th className="px-5 py-3 font-semibold">
                      Permissions
                    </th>
                    <th className="px-5 py-3 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {roles.map((role) => (
                    <tr key={role.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <span className="font-semibold text-slate-800">
                          {role.name}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-slate-500">
                        {role.description}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {role.assignedPermissions.length} assigned
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-3">
                          <button
                            type="button"
                            title="Edit Permissions"
                            onClick={() => {
                              setSelectedRole(role.name);
                              setError("");
                              setShowPermissionsModal(true);
                            }}
                            className="rounded-md p-2 text-blue-600 hover:bg-blue-50"
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            type="button"
                            title="Delete role"
                            onClick={() => openDeleteModal(role)}
                            className="rounded-md p-2 text-red-500 hover:bg-red-50"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {roleToDelete && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          onClick={closeDeleteModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-role-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
              <Trash2 size={26} className="text-red-600" />
            </div>

            <h2
              id="delete-role-title"
              className="mt-4 text-center text-xl font-bold text-slate-800"
            >
              Delete Role?
            </h2>

            <p className="mt-2 text-center text-sm leading-6 text-slate-600">
              Kya tum{" "}
              <span className="font-semibold text-slate-900">
                {roleToDelete.name}
              </span>{" "}
              role ko delete karna chahte ho? Ye action undo nahi ho
              sakta.
            </p>

            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={closeDeleteModal}
                className="rounded-lg border border-slate-300 px-5 py-2.5 font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteRole}
                className="rounded-lg bg-red-600 px-5 py-2.5 font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {showPermissionsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-6"
          onClick={() => {
            if (!saving) setShowPermissionsModal(false);
          }}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Edit Role Permissions
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Role: {selectedRoleData?.name || selectedRole}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowPermissionsModal(false)}
                disabled={saving}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                aria-label="Close modal"
              >
                <X size={22} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 space-y-5 overflow-y-auto p-5">
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
                      className="rounded-lg border border-slate-200"
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
                              className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50"
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
                                className="h-4 w-4 accent-blue-600"
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

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 border-t border-slate-200 p-4">
              <button
                type="button"
                disabled={saving}
                onClick={() => setShowPermissionsModal(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={savePermissions}
                disabled={saving || loading || !selectedRoleData}
                className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Permissions"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolesPermissions;
