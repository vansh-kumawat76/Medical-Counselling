import React, { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import api from "./Api/axios";

const RolesPermissions = () => {
  const [roles, setRoles] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [newRole, setNewRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
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

      const response = await api.get("/roles-permissions");
      const data = response.data;

      if (!data.status) {
        throw new Error(
          data.message || "Roles aur permissions fetch nahi hue.",
        );
      }

      const fetchedPermissions = data.permissions || [];

      const fetchedRoles = (data.roles || [])
        .filter((role) => role.role !== "SuperAdmin")
        .map((role) => ({
          id: role._id,
          name: role.role,
          users: 0,
          description: `${role.role} role`,
          color: "blue",
          assignedPermissions: (role.permissions || []).map((permission) =>
            typeof permission === "object" ? permission._id : permission,
          ),
        }));

      setAllPermissions(fetchedPermissions);
      setRoles(fetchedRoles);

      // Existing selected role ko preserve karo;
      // warna Admin ya first available role select karo.
      setSelectedRole((currentRole) => {
        const roleExists = fetchedRoles.some(
          (role) => role.name === currentRole,
        );

        if (roleExists) {
          return currentRole;
        }

        const adminRole = fetchedRoles.find((role) => role.name === "Admin");

        return adminRole?.name || fetchedRoles[0]?.name || "";
      });

      // Permission checkbox state prepare karo
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
              (permissionId) => String(permissionId) === String(permission._id),
            );
        });
      });

      setPermissionState(updatedPermissionState);
    } catch (err) {
      console.error("Fetch Roles Permissions Error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Roles aur permissions load nahi ho sake.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRolesPermissions();
  }, []);

  // Currently selected role
  const selectedRoleData = roles.find((role) => role.name === selectedRole);

  // Change permission checkbox
  const handlePermissionChange = (moduleName, actionName, checked) => {
    if (!selectedRoleData || selectedRoleData.name === "SuperAdmin") {
      return;
    }

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

  // Find permission ID from module and action
  const getPermissionId = (moduleName, actionName) => {
    return allPermissions.find(
      (permission) =>
        (permission.resource || "General") === moduleName &&
        (permission.action || permission.name) === actionName,
    )?._id;
  };

  // Save selected role permissions
  const savePermissions = async () => {
    if (!selectedRoleData) {
      setError("Pehle ek role select karo.");
      return;
    }

    if (selectedRoleData.name === "SuperAdmin") {
      setError("SuperAdmin permissions change nahi kar sakte.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const selectedPermissions = permissionState[selectedRole] || {};

      const selectedPermissionIds = [];

      Object.entries(selectedPermissions).forEach(([moduleName, actions]) => {
        Object.entries(actions).forEach(([actionName, isChecked]) => {
          if (isChecked) {
            const permissionId = getPermissionId(moduleName, actionName);

            if (permissionId) {
              selectedPermissionIds.push(permissionId);
            }
          }
        });
      });

      const response = await api.put(
        `/roles/${selectedRoleData.id}/permissions`,
        {
          permissions: selectedPermissionIds,
        },
      );

      if (response.data?.status === false) {
        throw new Error(response.data.message || "Permissions save nahi hui.");
      }

      setSuccess(
        response.data?.message || "Permissions successfully save ho gayi.",
      );

      await fetchRolesPermissions();
    } catch (err) {
      console.error("Save Permissions Error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Permissions save nahi ho saki.",
      );
    } finally {
      setSaving(false);
    }
  };

  // Create role
  const createRole = async (event) => {
    event.preventDefault();

    if (!newRole) {
      setError("Role select karo.");
      return;
    }

    setCreating(true);
    setError("");
    setSuccess("");

    try {
      const response = await api.post("/roles/create-role", {
        role: newRole,
      });

      if (response.data?.status === false) {
        throw new Error(response.data.message || "Role create nahi hua.");
      }

      await fetchRolesPermissions();

      setSelectedRole(response.data?.role?.role || newRole);
      setNewRole("");
      setShowForm(false);

      setSuccess(response.data?.message || "Role successfully create ho gaya.");
    } catch (err) {
      console.error("Create Role Error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Role create nahi ho saka.",
      );
    } finally {
      setCreating(false);
    }
  };

  // Delete is intentionally not connected because no delete API was provided
  const handleDeleteRole = (role) => {
    setError(
      `${role.name} delete karne ke liye backend delete API required hai.`,
    );
  };

  // Display permission labels
  const formatLabel = (value) => {
    if (!value) return "";

    return String(value)
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (character) => character.toUpperCase());
  };

  const isSuperAdmin = selectedRoleData?.name === "SuperAdmin";

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
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
              setSuccess("");
              setShowForm((previous) => !previous);
            }}
            className="rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-700"
          >
            {showForm ? "Cancel" : "+ Create Role"}
          </button>
        </div>

        {/* Success message */}
        {success && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* Error message */}
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
              <select
                value={newRole}
                onChange={(event) => setNewRole(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-blue-500 sm:max-w-sm"
                required
              >
                <option value="" disabled>
                  Select a role
                </option>

                {/* <option value="SuperAdmin">SuperAdmin</option> */}
                <option value="Admin">Admin</option>
                <option value="Student">Student</option>
              </select>

              <button
                type="submit"
                disabled={creating}
                className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creating ? "Creating..." : "Create Role"}
              </button>
            </div>

            <p className="mt-3 text-xs text-slate-500">
              Backend currently supports SuperAdmin, Admin and Student. Already
              existing roles cannot be created again.
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
                    <th className="px-5 py-3 font-semibold">Role Name</th>
                    <th className="px-5 py-3 font-semibold">Description</th>
                    <th className="px-5 py-3 font-semibold">Permissions</th>
                    <th className="px-5 py-3 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {roles.map((role) => (
                    <tr
                      key={role.id}
                      className={
                        selectedRole === role.name
                          ? "bg-blue-50"
                          : "hover:bg-slate-50"
                      }
                    >
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRole(role.name);
                            setError("");
                            setSuccess("");
                          }}
                          className={`cursor-pointer font-semibold ${
                            selectedRole === role.name
                              ? "text-blue-700"
                              : "text-slate-800 hover:text-blue-600"
                          }`}
                        >
                          {role.name}
                        </button>
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
                              setSuccess("");

                              document
                                .getElementById("permissions-section")
                                ?.scrollIntoView({
                                  behavior: "smooth",
                                  block: "start",
                                });
                            }}
                            className="rounded-md p-2 text-blue-600 hover:bg-blue-50"
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            type="button"
                            title="Delete role"
                            onClick={() => handleDeleteRole(role)}
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

        {/* Permissions Section */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                Manage Permissions
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Select a role and update its permissions.
              </p>
            </div>

            <div className="w-full sm:max-w-xs">
              <label
                htmlFor="selectedRole"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Select Role
              </label>

              <select
                id="selectedRole"
                value={selectedRole}
                onChange={(event) => {
                  setSelectedRole(event.target.value);
                  setError("");
                  setSuccess("");
                }}
                disabled={loading || roles.length === 0}
                className="w-full cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                <option value="" disabled>
                  Select a role
                </option>

                {roles.map((role) => (
                  <option key={role.id} value={role.name}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-5">
            {!selectedRoleData ? (
              <p className="py-6 text-center text-slate-500">
                Select a role to view its permissions.
              </p>
            ) : allPermissions.length === 0 ? (
              <p className="py-6 text-center text-slate-500">
                No permissions found in the backend.
              </p>
            ) : (
              <>
                {isSuperAdmin && (
                  <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    SuperAdmin permissions are read-only in this interface.
                  </div>
                )}

                <div className="space-y-5">
                  {Object.entries(permissionState[selectedRole] || {}).map(
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
                                className={`flex items-center gap-3 rounded-lg border border-slate-200 p-3 ${
                                  isSuperAdmin
                                    ? "cursor-not-allowed opacity-70"
                                    : "cursor-pointer hover:bg-slate-50"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={Boolean(checked)}
                                  disabled={isSuperAdmin || saving}
                                  onChange={(event) =>
                                    handlePermissionChange(
                                      moduleName,
                                      actionName,
                                      event.target.checked,
                                    )
                                  }
                                  className="h-4 w-4 cursor-pointer accent-blue-600 disabled:cursor-not-allowed"
                                />

                                <span className="text-sm text-slate-700">
                                  {formatLabel(actionName)}
                                </span>
                              </label>
                            ),
                          )}
                        </div>
                      </div>
                    ),
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={savePermissions}
                    disabled={
                      saving || loading || isSuperAdmin || !selectedRoleData
                    }
                    className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Permissions"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RolesPermissions;
