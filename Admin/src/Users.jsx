
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  clearSelectedUser,
  fetchSingleUser,
  fetchUsers,
  updateUser,
} from "./redux/userSlice";

import { Eye, Pencil } from "lucide-react";

const Users = () => {
  const dispatch = useDispatch();

  const {
    users,
    loading,
    error,
    pagination,
    selectedUser,
  } = useSelector((state) => state.users);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editingUser, setEditingUser] = useState(null);
  const [editEmail, setEditEmail] = useState("");

  // Fetch users with search and pagination
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(
        fetchUsers({
          page,
          limit: 10,
          search,
        })
      );
    }, 400);

    return () => clearTimeout(timer);
  }, [dispatch, page, search]);

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

  // Update User
  const handleUpdate = async () => {
    try {
      await dispatch(
        updateUser({
          id: editingUser._id,
          userData: {
            email: editEmail.trim(),
          },
        })
      ).unwrap();

      setEditingUser(null);
      setEditEmail("");
    } catch (error) {
      console.error("Update User Error:", error);
    }
  };

  return (
    <>
      <div className="p-6 bg-white rounded-xl shadow-sm">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              User Management
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage all registered users
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search users by email..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full md:w-96 px-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Loading */}
        {loading && (
          <p className="text-blue-600 py-4">
            Loading users...
          </p>
        )}

        {/* Error */}
        {error && (
          <p className="text-red-500 py-4">{error}</p>
        )}

        {!loading && !error && (
          <>
            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-3">S.No.</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">User ID</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {users.length > 0 ? (
                    users.map((user, index) => (
                      <tr key={user._id} className="border-b">
                        <td className="p-3">
                          {(pagination.currentPage - 1) *
                            pagination.limit +
                            index +
                            1}
                        </td>

                        <td className="p-3">{user.email}</td>

                        <td className="p-3">
                          {user.role?.role || "N/A"}
                        </td>

                        <td className="p-3 text-xs">
                          {user._id}
                        </td>

                        {/* Actions */}
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() =>
                                dispatch(fetchSingleUser(user._id))
                              }
                              className="text-blue-600 hover:text-blue-800"
                              title="View User"
                            >
                              <Eye size={17} />
                            </button>

                            <button
                              onClick={() => handleEdit(user)}
                              className="text-green-600 hover:text-green-800"
                              title="Edit User"
                            >
                              <Pencil size={17} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        className="p-6 text-center text-slate-500"
                      >
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-6">
              <p className="text-sm text-slate-500">
                Total Users: {pagination.totalUsers}
              </p>

              <div className="flex items-center gap-3">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((prev) => prev - 1)}
                  className="px-4 py-2 border rounded-lg disabled:opacity-40"
                >
                  Previous
                </button>

                <span className="text-sm">
                  Page {pagination.currentPage} of{" "}
                  {pagination.totalPages}
                </span>

                <button
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((prev) => prev + 1)}
                  className="px-4 py-2 border rounded-lg disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-lg rounded-xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">
                User Details
              </h2>

              <button
                onClick={() => dispatch(clearSelectedUser())}
                className="text-slate-500 hover:text-red-600"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-slate-500">Email</p>
            <p className="font-medium mb-4">
              {selectedUser.email}
            </p>

            <p className="text-sm text-slate-500">Role</p>
            <p className="font-medium mb-4">
              {selectedUser.role?.role || "N/A"}
            </p>

            <p className="text-sm text-slate-500">User ID</p>
            <p className="font-medium break-all">
              {selectedUser._id}
            </p>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-md rounded-xl p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-5">
              Edit User
            </h2>

            <label className="block text-sm font-medium mb-2">
              Email Address
            </label>

            <input
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setEditingUser(null);
                  setEditEmail("");
                }}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={handleUpdate}
                disabled={loading || !editEmail.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
              >
                {loading ? "Updating..." : "Update User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Users;
