import React, { useEffect, useState } from "react";
import userService from "./services/userService";
import {
  ui,
  badgeColor,
  PageHeader,
  Modal,
  Field,
  DetailRow,
  Avatar,
  RowActions,
  SearchInput,
  DataTable,
  Pagination,
} from "./assets/Components/ui/ui";

const Users = () => {
  // Local states
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  const [pagination, setPagination] = useState({
    totalUsers: 0,
    currentPage: 1,
    totalPages: 0,
    limit: 10,
  });

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [editingUser, setEditingUser] = useState(null);
  const [editEmail, setEditEmail] = useState("");

  // Fetch users with search and pagination
  useEffect(() => {
    let isMounted = true;

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError("");

        const response = await userService.getAllUsers({
          page,
          limit: 10,
          search,
        });

        if (isMounted) {
          setUsers(response.data || []);

          setPagination(
            response.pagination || {
              totalUsers: 0,
              currentPage: page,
              totalPages: 0,
              limit: 10,
            }
          );
        }
      } catch (error) {
        if (isMounted) {
          setError(
            error.response?.data?.message || "Failed to fetch users"
          );
          setUsers([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }, 400);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [page, search]);

  // Search users
  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);
  };

  // Open Edit Modal
  const handleEdit = (user) => {
    setEditingUser(user);
    setEditEmail(user.email);
  };

  // Close Edit Modal
  const handleCloseEdit = () => {
    setEditingUser(null);
    setEditEmail("");
  };

  // View Single User
  const handleView = async (id) => {
    try {
      setError("");

      const response = await userService.getSingleUser(id);
      setSelectedUser(response.data);
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to fetch user"
      );
    }
  };

  // Close Details Modal
  const handleCloseDetails = () => {
    setSelectedUser(null);
  };

  // Update User
  const handleUpdate = async () => {
    if (!editingUser || !editEmail.trim()) return;

    try {
      setUpdating(true);
      setError("");

      const response = await userService.updateUser(
        editingUser._id,
        {
          email: editEmail.trim(),
        }
      );

      const updatedUser = response.data;

      // Update local users list
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === updatedUser._id
            ? { ...user, ...updatedUser }
            : user
        )
      );

      // Update selected user if same user is open
      setSelectedUser((prevUser) =>
        prevUser?._id === updatedUser._id
          ? { ...prevUser, ...updatedUser }
          : prevUser
      );

      setEditingUser(null);
      setEditEmail("");
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to update user"
      );
    } finally {
      setUpdating(false);
    }
  };

  // ================= TABLE CONFIG (UI only) =================

  const columns = [
    {
      header: "Email",
      cell: (user) => (
        <div className="flex items-center gap-3">
          <Avatar name={user.email} size="sm" />
          <span
            className="truncate font-semibold text-slate-900"
            title={user.email}
          >
            {user.email}
          </span>
        </div>
      ),
    },
    {
      header: "Role",
      className: "w-[18%]",
      cell: (user) => (
        <span className={`${ui.badge} ${badgeColor.role}`}>
          {user.role?.role || "N/A"}
        </span>
      ),
    },
    {
      header: "User ID",
      className: "w-[30%]",
      hideBelow: "lg",
      truncate: true,
      cell: (user) => (
        <span className="font-mono text-xs" title={user._id}>
          {user._id}
        </span>
      ),
    },
  ];

  const renderActions = (user) => (
    <RowActions
      onView={() => handleView(user._id)}
      onEdit={() => handleEdit(user)}
    />
  );

  const renderCard = (user) => (
    <>
      <div className="flex items-start gap-3">
        <Avatar name={user.email} />

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-900">
            {user.email}
          </p>

          <p className="truncate font-mono text-xs text-slate-500">
            {user._id}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <span className={`${ui.badge} ${badgeColor.role}`}>
          {user.role?.role || "N/A"}
        </span>

        {renderActions(user)}
      </div>
    </>
  );

  return (
    <div className={ui.page}>
      <div className={ui.container}>
        {/* Header */}
        <PageHeader
          title="User Management"
          subtitle="Manage all registered users"
        />

        {/* Search */}
        <div
          className={`${ui.card} mb-5 flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4`}
        >
          <p className="text-sm font-semibold text-slate-700">
            Total Users{" "}
            <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {pagination.totalUsers}
            </span>
          </p>

          <SearchInput
            className="w-full sm:max-w-xs"
            placeholder="Search users by email..."
            value={search}
            onChange={handleSearch}
          />
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200"
          >
            {error}
          </div>
        )}

        {/* Users Table / Cards (loading me skeleton dikhega) */}
        <DataTable
          columns={columns}
          rows={loading ? [] : users}
          loading={loading}
          startIndex={(pagination.currentPage - 1) * pagination.limit}
          renderActions={renderActions}
          renderCard={renderCard}
          emptyTitle="No users found"
        />

        {/* Pagination */}
        {!loading && (
          <Pagination
            currentPage={page}
            totalPages={pagination.totalPages}
            onChange={(nextPage) => setPage(nextPage)}
          />
        )}
      </div>

      {/* User Details Modal */}
      <Modal
        open={!!selectedUser}
        size="md"
        title="User Details"
        onClose={handleCloseDetails}
      >
        {selectedUser && (
          <div className="divide-y divide-slate-100 rounded-xl bg-slate-50 px-4">
            <DetailRow label="Email">{selectedUser.email}</DetailRow>

            <DetailRow label="Role">
              {selectedUser.role?.role || "N/A"}
            </DetailRow>

            <DetailRow label="User ID">
              <span className="break-all">{selectedUser._id}</span>
            </DetailRow>
          </div>
        )}
      </Modal>

      {/* Edit User Modal */}
      <Modal
        open={!!editingUser}
        title="Edit User"
        onClose={handleCloseEdit}
      >
        <Field label="Email Address">
          <input
            type="email"
            value={editEmail}
            onChange={(e) => setEditEmail(e.target.value)}
            className={ui.input}
          />
        </Field>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleCloseEdit}
            className={ui.btnSecondary}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleUpdate}
            disabled={updating || !editEmail.trim()}
            className={ui.btnPrimary}
          >
            {updating ? "Updating..." : "Update User"}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Users;
