import React, { useEffect, useState } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import api from "./Api/axios";

const Students = () => {
  const [showForm, setShowForm] = useState(false);
  const [students, setStudents] = useState([]);
  const [viewStudent, setViewStudent] = useState(null);
  const [editStudent, setEditStudent] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [order, setOrder] = useState("asc");
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  // ================= GET ALL STUDENTS =================

  const getStudents = async (page = currentPage) => {
    try {
      const res = await api.get("/Get-All-Students", {
        params: {
          page,
          limit: 10,
        },
      });

      setStudents(res.data.getStudents || []);
      setTotalPages(res.data.totalPages || 1);
      setCurrentPage(res.data.currentPage || page);
    } catch (error) {
      console.log("GET STUDENTS ERROR:", error);
      toast.error(
        error.response?.data?.message || "Students fetch nahi hue"
      );
    }
  };

  // ================= FORM CHANGE =================

  const changeHandler = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ================= ADD STUDENT =================

  const submitHandler = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      // Automatically generate a password
      const generatedPassword = `Stu@${crypto.randomUUID().slice(0, 8)}A1`;

      const res = await api.post("/Add-New-Students", {
        ...form,
        password: generatedPassword,
      });

      if (res.data.status) {
        toast.success("Student created successfully!");

        // Display generated password for testing purposes
        toast.info(`Generated password: ${generatedPassword}`, {
          autoClose: 10000,
        });

        setShowForm(false);

        setForm({
          name: "",
          email: "",
          phone: "",
        });

        if (search.trim() || role || status) {
          await searchStudents(
            search,
            role,
            status,
            1,
            sortBy,
            order
          );
        } else {
          await getStudents(1);
        }
      } else {
        toast.error(res.data.message || "Student creation failed");
      }
    } catch (error) {
      console.log("ADD STUDENT ERROR:", error);

      toast.error(
        error.response?.data?.message || "Student create nahi hua"
      );
    }
  };

  // ================= PAGE LOAD =================

  useEffect(() => {
    getStudents(1);
  }, []);

  // ================= EDIT STUDENT =================

  const editHandler = async () => {
    if (!editStudent) return;

    try {
      const res = await api.put("/Edit-Data", {
        email: editStudent.email,
        name: editStudent.name,
        phone: editStudent.phone,
      });

      if (res.data.status) {
        toast.success("Student updated successfully!");
        setEditStudent(null);

        if (search.trim() || role || status) {
          await searchStudents(
            search,
            role,
            status,
            currentPage,
            sortBy,
            order
          );
        } else {
          await getStudents(currentPage);
        }
      } else {
        toast.error(res.data.message || "Student update failed");
      }
    } catch (error) {
      console.log("EDIT STUDENT ERROR:", error);

      toast.error(
        error.response?.data?.message || "Student update failed"
      );
    }
  };

  // ================= DELETE STUDENT =================

  const deleteHandler = async (email) => {
    if (!window.confirm("Are you sure you want to delete this student?")) {
      return;
    }

    try {
      const res = await api.delete("/deleted-student", {
        data: { email },
      });

      if (res.data.status) {
        toast.success("Student deleted successfully!");

        if (search.trim() || role || status) {
          await searchStudents(
            search,
            role,
            status,
            currentPage,
            sortBy,
            order
          );
        } else {
          await getStudents(currentPage);
        }
      } else {
        toast.error(res.data.message || "Student delete failed");
      }
    } catch (error) {
      console.log("DELETE STUDENT ERROR:", error);

      toast.error(
        error.response?.data?.message || "Student delete failed"
      );
    }
  };

  // ================= SEARCH STUDENTS =================

  const searchStudents = async (
    value = search,
    selectedRole = role,
    selectedStatus = status,
    page = 1,
    selectedSortBy = sortBy,
    selectedOrder = order
  ) => {
    try {
      const res = await api.get("/Search-Students", {
        params: {
          search: value,
          role: selectedRole,
          status: selectedStatus,
          page,
          limit: 10,
          sortBy: selectedSortBy,
          order: selectedOrder,
        },
      });

      setStudents(res.data.students || []);
      setTotalPages(res.data.totalPages || 1);
      setCurrentPage(res.data.currentPage || page);
    } catch (error) {
      console.log("SEARCH STUDENTS ERROR:", error);

      toast.error(
        error.response?.data?.message || "Students search failed"
      );
    }
  };

  // ================= PAGINATION HANDLER =================

  const changePage = (page) => {
    if (page < 1 || page > totalPages) return;

    if (search.trim() || role || status || sortBy) {
      searchStudents(search, role, status, page, sortBy, order);
    } else {
      getStudents(page);
    }
  };

  // ================= UI =================

  return (
    <div className="ml-64 min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/60 to-slate-100 p-8">

      {/* HEADING */}

      <div className="flex justify-between items-center mb-8 max-w-5xl">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Students
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Manage all students
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold px-6 py-2.5 rounded-xl shadow-lg transition hover:from-indigo-700 hover:to-violet-700 active:scale-95"
        >
          Add New Student
        </button>
      </div>

      {/* SEARCH AND FILTERS */}

      <div className="bg-white/80 backdrop-blur p-4 rounded-2xl shadow-sm ring-1 ring-slate-200/70 mb-6 flex gap-3 flex-wrap items-center max-w-5xl">

        <input
          type="text"
          placeholder="Search student by name, email or phone..."
          value={search}
          onChange={(e) => {
            const value = e.target.value;
            setSearch(value);
            searchStudents(value, role, status, 1, sortBy, order);
          }}
          className="flex-1 min-w-64 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500"
        />

        <select
          value={sortBy}
          onChange={(e) => {
            const value = e.target.value;
            setSortBy(value);
            searchStudents(search, role, status, 1, value, order);
          }}
          className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
        >
          <option value="">Sort By</option>
          <option value="name">Name</option>
          <option value="email">Email</option>
          <option value="phone">Phone</option>
          <option value="role">Role</option>
          <option value="status">Status</option>
        </select>

        <select
          value={order}
          onChange={(e) => {
            const value = e.target.value;
            setOrder(value);
            searchStudents(search, role, status, 1, sortBy, value);
          }}
          className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>

        <select
          value={role}
          onChange={(e) => {
            const value = e.target.value;
            setRole(value);
            searchStudents(search, value, status, 1, sortBy, order);
          }}
          className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
        >
          <option value="">All Roles</option>
          <option value="student">Student</option>
          <option value="admin">Admin</option>
        </select>

        <select
          value={status}
          onChange={(e) => {
            const value = e.target.value;
            setStatus(value);
            searchStudents(search, role, value, 1, sortBy, order);
          }}
          className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* ADD STUDENT MODAL */}

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-96 rounded-3xl p-7 shadow-2xl">

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">
                Add New Student
              </h2>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-slate-400 text-lg rounded-lg px-2 py-0.5 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={submitHandler}>
              <div className="mb-4">
                <label className="block mb-1.5 text-sm font-medium text-slate-700">
                  Enter Name
                </label>

                <input
                  type="text"
                  placeholder="Enter Name"
                  name="name"
                  value={form.name}
                  onChange={changeHandler}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div className="mb-4">
                <label className="block mb-1.5 text-sm font-medium text-slate-700">
                  Enter Email
                </label>

                <input
                  type="email"
                  placeholder="Enter Email"
                  name="email"
                  value={form.email}
                  onChange={changeHandler}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div className="mb-6">
                <label className="block mb-1.5 text-sm font-medium text-slate-700">
                  Enter Phone
                </label>

                <input
                  type="tel"
                  placeholder="Enter Phone Number"
                  name="phone"
                  value={form.phone}
                  onChange={changeHandler}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold py-2.5 rounded-xl shadow-lg transition hover:from-indigo-700 hover:to-violet-700 active:scale-95"
              >
                Create Student
              </button>
            </form>
          </div>
        </div>
      )}

      {/* STUDENTS TABLE */}

      <div className="w-full max-w-5xl mt-6 overflow-x-auto">
        <table className="w-full bg-white rounded-2xl overflow-hidden shadow-xl ring-1 ring-slate-200 text-sm">

          <thead className="bg-gradient-to-r from-slate-900 to-slate-800 text-slate-100 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-5 py-4 text-left">#</th>
              <th className="px-5 py-4 text-left">Name</th>
              <th className="px-5 py-4 text-left">Email</th>
              <th className="px-5 py-4 text-left">Phone</th>
              <th className="px-5 py-4 text-left">Role</th>
              <th className="px-5 py-4 text-left">Status</th>
              <th className="px-5 py-4 text-left">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {students.length > 0 ? (
              students.map((student, index) => {
                const studentRole =
                  typeof student.role === "object"
                    ? student.role?.role || student.role?.name || "Student"
                    : student.role || "Student";

                return (
                  <tr
                    key={student._id}
                    className="odd:bg-white even:bg-slate-50/50 hover:bg-indigo-50/70"
                  >
                    <td className="px-5 py-4 text-slate-400">
                      {(currentPage - 1) * 10 + index + 1}
                    </td>

                    <td className="px-5 py-4 font-semibold text-slate-900">
                      {student.name}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {student.email}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {student.phone}
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold capitalize bg-sky-50 text-sky-700">
                        {studentRole}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                          student.status === "active"
                            ? "bg-emerald-50 text-emerald-700"
                            : student.status === "inactive"
                            ? "bg-rose-50 text-rose-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {student.status || "pending"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">

                        <button
                          type="button"
                          title="Edit Student"
                          onClick={() => setEditStudent({ ...student })}
                          className="bg-amber-50 text-amber-600 p-2 rounded-lg hover:bg-amber-500 hover:text-white"
                        >
                          <Pencil size={18} />
                        </button>

                        <button
                          type="button"
                          title="Delete Student"
                          onClick={() => deleteHandler(student.email)}
                          className="bg-rose-50 text-rose-600 p-2 rounded-lg hover:bg-rose-500 hover:text-white"
                        >
                          <Trash2 size={18} />
                        </button>

                        <button
                          type="button"
                          title="View Student"
                          onClick={() => setViewStudent(student)}
                          className="bg-indigo-50 text-indigo-600 p-2 rounded-lg hover:bg-indigo-500 hover:text-white"
                        >
                          <Eye size={18} />
                        </button>

                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="px-5 py-8 text-center text-slate-500">
                  No students found
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* PAGINATION */}

        <div className="flex items-center justify-center gap-2 mt-6 mb-10 flex-wrap">
          <button
            type="button"
            onClick={() => changePage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-xl hover:bg-slate-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, index) => (
            <button
              type="button"
              key={index + 1}
              onClick={() => changePage(index + 1)}
              className={`min-w-10 px-4 py-2 text-sm font-medium rounded-xl ${
                currentPage === index + 1
                  ? "bg-indigo-600 text-white"
                  : "bg-white ring-1 ring-slate-200 text-slate-700 hover:bg-indigo-50"
              }`}
            >
              {index + 1}
            </button>
          ))}

          <button
            type="button"
            onClick={() => changePage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-xl hover:bg-slate-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>

      {/* EDIT STUDENT MODAL */}

      {editStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-96 rounded-3xl p-7 shadow-2xl">

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">
                Edit Student
              </h2>

              <button
                type="button"
                onClick={() => setEditStudent(null)}
                className="text-slate-400 text-lg rounded-lg px-2.5 py-0.5 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                editHandler();
              }}
            >
              <input
                type="text"
                value={editStudent.name || ""}
                onChange={(e) =>
                  setEditStudent({
                    ...editStudent,
                    name: e.target.value,
                  })
                }
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 mb-4 text-sm"
                placeholder="Enter Name"
              />

              <input
                type="email"
                value={editStudent.email || ""}
                onChange={(e) =>
                  setEditStudent({
                    ...editStudent,
                    email: e.target.value,
                  })
                }
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 mb-4 text-sm"
                placeholder="Enter Email"
              />

              <input
                type="tel"
                value={editStudent.phone || ""}
                onChange={(e) =>
                  setEditStudent({
                    ...editStudent,
                    phone: e.target.value,
                  })
                }
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 mb-6 text-sm"
                placeholder="Enter Phone"
              />

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold py-2.5 rounded-xl shadow-lg hover:from-indigo-700 hover:to-violet-700"
              >
                Update Student
              </button>
            </form>
          </div>
        </div>
      )}

      {/* VIEW STUDENT MODAL */}

      {viewStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-96 rounded-3xl p-7 shadow-2xl">

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">
                Student Details
              </h2>

              <button
                type="button"
                onClick={() => setViewStudent(null)}
                className="text-slate-400 text-lg rounded-lg px-2.5 py-0.5 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-slate-600 bg-slate-50 rounded-2xl p-4">
              <p>
                <strong className="text-slate-900">Name:</strong>{" "}
                {viewStudent.name}
              </p>

              <p>
                <strong className="text-slate-900">Email:</strong>{" "}
                {viewStudent.email}
              </p>

              <p>
                <strong className="text-slate-900">Phone:</strong>{" "}
                {viewStudent.phone}
              </p>

              <p>
                <strong className="text-slate-900">Role:</strong>{" "}
                {typeof viewStudent.role === "object"
                  ? viewStudent.role?.role || viewStudent.role?.name || "Student"
                  : viewStudent.role || "Student"}
              </p>

              <p>
                <strong className="text-slate-900">Status:</strong>{" "}
                {viewStudent.status || "pending"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setViewStudent(null)}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold py-2.5 rounded-xl mt-6"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
