
import React, { useEffect, useMemo, useState } from "react";
import api from "./Api/axios";
import { toast } from "react-toastify";

const categories = [
  { value: "academic", label: "Academic" },
  { value: "budget", label: "Budget" },
  { value: "preferences", label: "Preferences" },
  { value: "follow_up", label: "Follow Up" },
  { value: "general", label: "General" },
];

const initialForm = {
  session: "",
  content: "",
  visibility: "internal",
  category: "general",
};

const formatDate = (date) => {
  if (!date) return "N/A";

  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getId = (value) => {
  if (!value) return "";
  return typeof value === "object" ? value._id : value;
};

const CounsellingNotes = () => {
  const [notes, setNotes] = useState([]);
  const [sessions, setSessions] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const [selectedNote, setSelectedNote] = useState(null);
  const [editingNote, setEditingNote] = useState(null);

  const [form, setForm] = useState(initialForm);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState("all");

  // FETCH ALL NOTES
  const fetchNotes = async () => {
    try {
      setLoading(true);

      const response = await api.get(
        "/Notes/Get-All-Counselling-Notes"
      );

      if (response.data.success) {
        setNotes(response.data.data || []);
      } else {
        toast.error(response.data.message || "Failed to fetch notes");
      }
    } catch (error) {
      console.log("Fetch Notes Error:", error);

      toast.error(
        error.response?.data?.message || "Unable to fetch counselling notes"
      );
    } finally {
      setLoading(false);
    }
  };

  // FETCH COUNSELLING SESSIONS
  const fetchSessions = async () => {
    try {
      const response = await api.get(
        "/session/GetAllCounsellingSession"
      );

      const sessionData =
        response.data.sessions ||
        response.data.data ||
        [];

      setSessions(sessionData);
    } catch (error) {
      console.log("Fetch Sessions Error:", error);
      toast.error("Unable to fetch counselling sessions");
    }
  };

  useEffect(() => {
    fetchNotes();
    fetchSessions();
  }, []);

  // SEARCH AND FILTER
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      const searchText = search.toLowerCase();

      const author =
        note.author?.name ||
        note.author?.email ||
        "";

      const sessionNumber =
        note.session?.sessionNumber?.toString() || "";

      const content = note.content || "";

      const matchesSearch =
        content.toLowerCase().includes(searchText) ||
        author.toLowerCase().includes(searchText) ||
        sessionNumber.includes(searchText) ||
        note.category?.toLowerCase().includes(searchText);

      const matchesCategory =
        categoryFilter === "all" ||
        note.category === categoryFilter;

      const matchesVisibility =
        visibilityFilter === "all" ||
        note.visibility === visibilityFilter;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesVisibility
      );
    });
  }, [notes, search, categoryFilter, visibilityFilter]);

  // OPEN ADD MODAL
  const openAddModal = () => {
    setEditingNote(null);
    setForm(initialForm);
    setShowModal(true);
  };

  // OPEN EDIT MODAL
  const openEditModal = (note) => {
    setEditingNote(note);

    setForm({
      session: getId(note.session),
      content: note.content || "",
      visibility: note.visibility || "internal",
      category: note.category || "general",
    });

    setShowModal(true);
  };

  // CLOSE FORM MODAL
  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingNote(null);
    setForm(initialForm);
  };

  // INPUT CHANGE
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // CREATE / UPDATE NOTE
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!editingNote && !form.session) {
      toast.error("Please select a counselling session");
      return;
    }

    if (!form.content.trim()) {
      toast.error("Please enter note content");
      return;
    }

    if (form.content.trim().length > 10000) {
      toast.error("Note cannot exceed 10000 characters");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        content: form.content.trim(),
        visibility: form.visibility,
        category: form.category,
      };

      if (editingNote) {
        const response = await api.put(
          `/Notes/Update-Counselling-Note/${editingNote._id}`,
          payload
        );

        if (response.data.success) {
          toast.success(
            response.data.message || "Note updated successfully"
          );

          closeModal();
          fetchNotes();
        } else {
          toast.error(response.data.message || "Update failed");
        }
      } else {
        const response = await api.post(
          "/Notes/Create-Counselling-Note",
          {
            ...payload,
            session: form.session,
          }
        );

        if (response.data.success) {
          toast.success(
            response.data.message || "Note created successfully"
          );

          closeModal();
          fetchNotes();
        } else {
          toast.error(response.data.message || "Creation failed");
        }
      }
    } catch (error) {
      console.log("Save Note Error:", error);

      toast.error(
        error.response?.data?.message || "Something went wrong"
      );
    } finally {
      setSaving(false);
    }
  };

  // VIEW NOTE
  const handleView = async (note) => {
    try {
      const response = await api.get(
        `/Notes/Get-Single-Counselling-Note/${note._id}`
      );

      if (response.data.success) {
        setSelectedNote(response.data.data);
        setShowViewModal(true);
      } else {
        toast.error(response.data.message || "Unable to view note");
      }
    } catch (error) {
      console.log("View Note Error:", error);

      toast.error(
        error.response?.data?.message || "Unable to fetch note details"
      );
    }
  };

  // DELETE NOTE
  const handleDelete = async (noteId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this counselling note?"
    );

    if (!confirmed) return;

    try {
      setDeleting(true);

      const response = await api.delete(
        `/Notes/Delete-Counselling-Note/${noteId}`
      );

      if (response.data.success) {
        toast.success(
          response.data.message || "Note deleted successfully"
        );

        setNotes((prev) =>
          prev.filter((note) => note._id !== noteId)
        );

        if (selectedNote?._id === noteId) {
          setShowViewModal(false);
          setSelectedNote(null);
        }
      } else {
        toast.error(response.data.message || "Delete failed");
      }
    } catch (error) {
      console.log("Delete Note Error:", error);

      toast.error(
        error.response?.data?.message || "Unable to delete note"
      );
    } finally {
      setDeleting(false);
    }
  };

  const getCategoryLabel = (category) => {
    return (
      categories.find((item) => item.value === category)?.label ||
      category ||
      "General"
    );
  };

  const getSessionLabel = (session) => {
    if (!session) return "Session unavailable";

    const number = session.sessionNumber || "N/A";
    const type = session.type?.replaceAll("_", " ") || "";

    return `Session #${number} ${type ? `(${type})` : ""}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">
              Counselling Notes
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage student counselling notes and session records.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                fetchNotes();
                fetchSessions();
              }}
              disabled={loading}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
            >
              <span className="mr-2">↻</span>
              Refresh
            </button>

            <button
              onClick={openAddModal}
              className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              + Add Note
            </button>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Total Notes
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-800">
              {notes.length}
            </h2>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Internal Notes
            </p>
            <h2 className="mt-2 text-3xl font-bold text-amber-600">
              {notes.filter((note) => note.visibility === "internal").length}
            </h2>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Student Visible
            </p>
            <h2 className="mt-2 text-3xl font-bold text-emerald-600">
              {notes.filter((note) => note.visibility === "student_visible").length}
            </h2>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Academic Notes
            </p>
            <h2 className="mt-2 text-3xl font-bold text-indigo-600">
              {notes.filter((note) => note.category === "academic").length}
            </h2>
          </div>
        </div>

        {/* FILTERS */}
        <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Search Notes
              </label>

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search content, author, session..."
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Category
              </label>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-500"
              >
                <option value="all">All Categories</option>

                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Visibility
              </label>

              <select
                value={visibilityFilter}
                onChange={(e) => setVisibilityFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-500"
              >
                <option value="all">All Visibility</option>
                <option value="internal">Internal</option>
                <option value="student_visible">Student Visible</option>
              </select>
            </div>
          </div>

          {(search || categoryFilter !== "all" || visibilityFilter !== "all") && (
            <button
              onClick={() => {
                setSearch("");
                setCategoryFilter("all");
                setVisibilityFilter("all");
              }}
              className="mt-3 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* NOTES TABLE */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h2 className="font-bold text-slate-800">
              Notes List
            </h2>

            <span className="text-sm text-slate-500">
              {filteredNotes.length} records
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <div className="mb-3 text-4xl">📝</div>

              <h3 className="font-semibold text-slate-700">
                No Counselling Notes Found
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Add a new note or change your search filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-4">#</th>
                    <th className="px-5 py-4">Session</th>
                    <th className="px-5 py-4">Author</th>
                    <th className="px-5 py-4">Content</th>
                    <th className="px-5 py-4">Category</th>
                    <th className="px-5 py-4">Visibility</th>
                    <th className="px-5 py-4">Created</th>
                    <th className="px-5 py-4 text-center">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredNotes.map((note, index) => (
                    <tr
                      key={note._id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4 text-sm text-slate-500">
                        {index + 1}
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-800">
                          {getSessionLabel(note.session)}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {note.session?.status || "N/A"}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {note.author?.name ||
                          note.author?.email ||
                          "Unknown"}
                      </td>

                      <td className="max-w-xs px-5 py-4">
                        <p className="line-clamp-2 text-sm text-slate-600">
                          {note.content}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold capitalize text-indigo-700">
                          {getCategoryLabel(note.category)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {note.visibility === "student_visible" ? (
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            Student Visible
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                            Internal
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-xs text-slate-500">
                        {formatDate(note.createdAt)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleView(note)}
                            title="View"
                            className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                          >
                            View
                          </button>

                          <button
                            onClick={() => openEditModal(note)}
                            title="Edit"
                            className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => handleDelete(note._id)}
                            disabled={deleting}
                            title="Delete"
                            className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                          >
                            Delete
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

        {/* ADD / EDIT MODAL */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
            <div className="my-auto w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    {editingNote ? "Edit Counselling Note" : "Add Counselling Note"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Enter counselling note details below.
                  </p>
                </div>

                <button
                  onClick={closeModal}
                  disabled={saving}
                  className="text-2xl text-slate-400 hover:text-slate-700"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 p-6">

                {!editingNote && (
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Counselling Session <span className="text-red-500">*</span>
                    </label>

                    <select
                      name="session"
                      value={form.session}
                      onChange={handleChange}
                      required
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    >
                      <option value="">Select Counselling Session</option>

                      {sessions.map((session) => (
                        <option key={session._id} value={session._id}>
                          {getSessionLabel(session)} - {session.status}
                        </option>
                      ))}
                    </select>

                    {sessions.length === 0 && (
                      <p className="mt-1 text-xs text-amber-600">
                        No counselling sessions available.
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Note Content <span className="text-red-500">*</span>
                  </label>

                  <textarea
                    name="content"
                    value={form.content}
                    onChange={handleChange}
                    rows={6}
                    maxLength={10000}
                    required
                    placeholder="Write counselling note here..."
                    className="w-full resize-y rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />

                  <p className="mt-1 text-right text-xs text-slate-400">
                    {form.content.length}/10000 characters
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Category
                    </label>

                    <select
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500"
                    >
                      {categories.map((category) => (
                        <option
                          key={category.value}
                          value={category.value}
                        >
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Visibility
                    </label>

                    <select
                      name="visibility"
                      value={form.visibility}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500"
                    >
                      <option value="internal">Internal</option>
                      <option value="student_visible">Student Visible</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving || (!editingNote && sessions.length === 0)}
                    className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : editingNote
                      ? "Update Note"
                      : "Create Note"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* VIEW NOTE MODAL */}
        {showViewModal && selectedNote && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
            <div className="my-auto w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    Counselling Note Details
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Complete note information.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedNote(null);
                  }}
                  className="text-2xl text-slate-400 hover:text-slate-700"
                >
                  ×
                </button>
              </div>

              <div className="space-y-5 p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      Session
                    </p>
                    <p className="mt-2 font-semibold text-slate-800">
                      {getSessionLabel(selectedNote.session)}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      Author
                    </p>
                    <p className="mt-2 break-all font-semibold text-slate-800">
                      {selectedNote.author?.name ||
                        selectedNote.author?.email ||
                        "Unknown"}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      Category
                    </p>
                    <p className="mt-2 font-semibold capitalize text-slate-800">
                      {getCategoryLabel(selectedNote.category)}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      Visibility
                    </p>
                    <p className="mt-2 font-semibold text-slate-800">
                      {selectedNote.visibility === "student_visible"
                        ? "Student Visible"
                        : "Internal"}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-700">
                    Note Content
                  </p>

                  <div className="whitespace-pre-wrap break-words rounded-lg border border-slate-200 bg-white p-4 text-sm leading-7 text-slate-700">
                    {selectedNote.content}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-400">
                      Created At
                    </p>
                    <p className="mt-1 text-slate-700">
                      {formatDate(selectedNote.createdAt)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-400">
                      Last Updated
                    </p>
                    <p className="mt-1 text-slate-700">
                      {formatDate(selectedNote.updatedAt)}
                    </p>
                  </div>

                  {selectedNote.editedAt && (
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Edited At
                      </p>
                      <p className="mt-1 text-slate-700">
                        {formatDate(selectedNote.editedAt)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end border-t border-slate-100 px-6 py-4">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedNote(null);
                  }}
                  className="rounded-lg bg-slate-800 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-900"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default CounsellingNotes;
