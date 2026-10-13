import React, { useEffect, useState } from "react";
import api from "./Api/axios";
import { Eye, Pencil, Trash2 } from "lucide-react";

const initialFormData = {
  name: "",
  shortName: "",
  logo: "",
  type: "state",
  establishedYear: "",
  city: "",
  state: "",
  country: "India",
  website: "",
};

const University = () => {
  const [university, setUniversity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [formData, setFormData] = useState(initialFormData);

  // Fetch universities
  const fetchUniversities = async () => {
    try {
      setError("");

      const res = await api.get("/get-university");

      setUniversity(res.data.universities || []);
    } catch (err) {
      console.error("Fetch Universities Error:", err);
      console.log("Status:", err.response?.status);
      console.log("Response:", err.response?.data);

      setError(
        err.response?.data?.message ||
          "Universities load nahi hui. Token, permission aur backend check karo."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUniversities();
  }, []);

  // Form input change
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Open add form
  const openAddForm = () => {
    setEditingId(null);
    setFormData(initialFormData);
    setError("");
    setShowForm(true);
  };

  // Open edit form
  const openEditForm = (item) => {
    setEditingId(item._id);

    setFormData({
      name: item.name || "",
      shortName: item.shortName || "",
      logo: item.logo || "",
      type: item.type || "state",
      establishedYear: item.establishedYear || "",
      city: item.location?.city || "",
      state: item.location?.state || "",
      country: item.location?.country || "India",
      website: item.website || "",
    });

    setError("");
    setShowForm(true);
    setViewing(null);
  };

  // Add / Update university
  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setError("");

    const payload = {
      name: formData.name.trim(),
      shortName: formData.shortName.trim(),
      logo: formData.logo.trim(),
      type: formData.type,
      establishedYear: Number(formData.establishedYear),
      location: {
        city: formData.city.trim(),
        state: formData.state.trim(),
        country: formData.country.trim(),
      },
      website: formData.website.trim(),
    };

    try {
      if (editingId) {
        await api.put(`/university/${editingId}`, payload);
      } else {
        await api.post("/university", payload);
      }

      setShowForm(false);
      setEditingId(null);
      setFormData(initialFormData);

      await fetchUniversities();
    } catch (err) {
      console.error("Save University Error:", err);
      console.log("Status:", err.response?.status);
      console.log("Response:", err.response?.data);

      setError(
        err.response?.data?.message || "University save nahi hui."
      );
    } finally {
      setSaving(false);
    }
  };

  // Delete university
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Kya tum is university ko delete karna chahte ho?"
    );

    if (!confirmed) return;

    try {
      setError("");

      await api.delete(`/university/${id}`);

      await fetchUniversities();
    } catch (err) {
      console.error("Delete University Error:", err);
      console.log("Status:", err.response?.status);
      console.log("Response:", err.response?.data);

      setError(
        err.response?.data?.message || "University delete nahi hui."
      );
    }
  };

  // Search universities
  const filteredUniversities = university.filter((item) => {
    const query = search.toLowerCase();

    return (
      item.name?.toLowerCase().includes(query) ||
      item.shortName?.toLowerCase().includes(query) ||
      item.type?.toLowerCase().includes(query) ||
      item.location?.city?.toLowerCase().includes(query) ||
      item.location?.state?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="ml-64 min-h-screen bg-slate-100 p-6">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Universities
          </h1>

          <p className="mt-1 text-slate-500">
            Manage university information
          </p>
        </div>

        <button
          onClick={openAddForm}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          + Add University
        </button>
      </div>

      {error && (
        <div className="mb-5 rounded-lg bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 rounded-xl bg-white p-6 shadow-sm"
        >
          <h2 className="mb-5 text-xl font-bold text-slate-800">
            {editingId ? "Edit University" : "Add New University"}
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="University Name"
              required
              className="rounded-lg border p-3"
            />

            <input
              name="shortName"
              value={formData.shortName}
              onChange={handleChange}
              placeholder="Short Name"
              className="rounded-lg border p-3"
            />

            <input
              name="logo"
              type="url"
              value={formData.logo}
              onChange={handleChange}
              placeholder="Logo URL (optional)"
              className="rounded-lg border p-3"
            />

            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="rounded-lg border p-3"
            >
              <option value="central">Central</option>
              <option value="state">State</option>
              <option value="private">Private</option>
              <option value="deemed">Deemed</option>
              <option value="international">International</option>
            </select>

            <input
              type="number"
              name="establishedYear"
              value={formData.establishedYear}
              onChange={handleChange}
              placeholder="Established Year"
              required
              min="1"
              max={new Date().getFullYear()}
              className="rounded-lg border p-3"
            />

            <input
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="City"
              className="rounded-lg border p-3"
            />

            <input
              name="state"
              value={formData.state}
              onChange={handleChange}
              placeholder="State"
              className="rounded-lg border p-3"
            />

            <input
              name="country"
              value={formData.country}
              onChange={handleChange}
              placeholder="Country"
              className="rounded-lg border p-3"
            />

            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleChange}
              placeholder="Website URL"
              className="rounded-lg border p-3"
            />
          </div>

          <div className="mt-5 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-5 py-2 text-white disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : editingId
                ? "Update University"
                : "Save University"}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setFormData(initialFormData);
              }}
              className="rounded-lg bg-slate-200 px-5 py-2"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="rounded-xl bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <h2 className="text-lg font-semibold">
            University List ({filteredUniversities.length})
          </h2>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search universities..."
            className="w-full rounded-lg border px-4 py-2 sm:max-w-xs"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="p-3">Logo</th>
                <th className="p-3">University</th>
                <th className="p-3">Type</th>
                <th className="p-3">Established</th>
                <th className="p-3">Location</th>
                <th className="p-3">Website</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center">
                    Loading...
                  </td>
                </tr>
              ) : filteredUniversities.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="p-8 text-center text-slate-500"
                  >
                    No universities found.
                  </td>
                </tr>
              ) : (
                filteredUniversities.map((item) => (
                  <tr
                    key={item._id}
                    className="border-b hover:bg-slate-50"
                  >
                    <td className="p-3">
                      {item.logo ? (
                        <img
                          src={item.logo}
                          alt={item.name}
                          className="h-10 w-10 rounded object-contain"
                        />
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="p-3 font-medium">
                      {item.name}
                      <div className="text-sm text-slate-500">
                        {item.shortName}
                      </div>
                    </td>

                    <td className="p-3 capitalize">{item.type}</td>

                    <td className="p-3">{item.establishedYear}</td>

                    <td className="p-3">
                      {[
                        item.location?.city,
                        item.location?.state,
                        item.location?.country,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </td>

                    <td className="p-3">
                      {item.website ? (
                        <a
                          href={item.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Visit Website
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setViewing(item)}
                          aria-label="View university"
                          className="rounded bg-slate-100 px-2 py-1 text-sm hover:bg-slate-200"
                        >
                          <Eye size={18} />
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditForm(item)}
                          aria-label="Edit university"
                          className="rounded bg-amber-100 px-2 py-1 text-sm text-amber-800 hover:bg-amber-200"
                        >
                          <Pencil size={18} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(item._id)}
                          aria-label="Delete university"
                          className="rounded bg-red-100 px-2 py-1 text-sm text-red-700 hover:bg-red-200"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">University Details</h2>

              <button
                type="button"
                onClick={() => setViewing(null)}
                className="rounded px-3 py-1 text-xl hover:bg-slate-100"
              >
                ×
              </button>
            </div>

            {viewing.logo && (
              <img
                src={viewing.logo}
                alt={viewing.name}
                className="mb-4 h-16 w-16 object-contain"
              />
            )}

            <div className="space-y-3 text-slate-700">
              <p>
                <strong>Name:</strong> {viewing.name}
              </p>
              <p>
                <strong>Short Name:</strong> {viewing.shortName || "—"}
              </p>
              <p>
                <strong>Type:</strong> {viewing.type || "—"}
              </p>
              <p>
                <strong>Established:</strong>{" "}
                {viewing.establishedYear || "—"}
              </p>
              <p>
                <strong>City:</strong> {viewing.location?.city || "—"}
              </p>
              <p>
                <strong>State:</strong> {viewing.location?.state || "—"}
              </p>
              <p>
                <strong>Country:</strong>{" "}
                {viewing.location?.country || "—"}
              </p>
              <p>
                <strong>Website:</strong> {viewing.website || "—"}
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => openEditForm(viewing)}
                className="rounded-lg bg-amber-500 px-4 py-2 text-white hover:bg-amber-600"
              >
                Edit
              </button>

              <button
                type="button"
                onClick={() => setViewing(null)}
                className="rounded-lg bg-slate-200 px-4 py-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default University;
