import React, { useEffect, useState } from "react";
import axios from "axios";
import { Eye, Pencil, Trash2 } from "lucide-react";
const Colleges = () => {
  const [colleges, setColleges] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [viewCollege, setViewCollege] = useState(null);
  const [editCollege, setEditCollege] = useState(null);

  const [search, setSearch] = useState("");
  const [collegeType, setCollegeType] = useState("");
  const [status, setStatus] = useState("");

  const [sortBy, setSortBy] = useState("");
  const [order, setOrder] = useState("asc");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    logo: "",
    description: "",
    collegeType: "",
    ownership: "",
    establishedYear: "",
    address: "",
    city: "",
    state: "",
    country: "",
    pincode: "",
    website: "",
    contactEmail: "",
    contactPhone: "",
    isVerified: false,
    status: "pending",
  });

  // ================= GET COLLEGES =================
const fetchColleges = async (
  searchValue = search,
  typeValue = collegeType,
  statusValue = status,
  page = 1,
  sortValue = sortBy,
  orderValue = order
) => {
  try {
    const token = localStorage.getItem("token");

    const res = await axios.get(
      "http://localhost:8090/Search-Colleges",
      {
        params: {
          search: searchValue,
          collegeType: typeValue,
          status: statusValue,
          page,
          limit: 10,
          sortBy: sortValue || "createdAt",
          order: orderValue,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log(res.data);

    setColleges(res.data.colleges);
    setTotalPages(res.data.totalPages);
    setCurrentPage(res.data.currentPage);
  } catch (error) {
    console.log("Fetch Colleges Error:", error.response?.data || error.message);
  }
};

useEffect(() => {
  fetchColleges();
}, []);


  // ================= INPUT CHANGE =================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // ================= ADD COLLEGE =================
  const addCollege = async (e) => {
    e.preventDefault();

    try {
      const data = {
        name: form.name,
        slug: form.slug,
        logo: form.logo,
        description: form.description,
        collegeType: form.collegeType,
        ownership: form.ownership,
        establishedYear: Number(form.establishedYear),

        location: {
          address: form.address,
          city: form.city,
          state: form.state,
          country: form.country,
          pincode: form.pincode,
        },

        website: form.website,

        contact: {
          email: form.contactEmail,
          phone: form.contactPhone,
        },

        isVerified: form.isVerified,
        status: form.status,
      };

      const res = await axios.post(
        "http://localhost:8090/Add-New-College",
        data
      );

      console.log(res.data);

      if (res.data.status) {
        alert("College Added Successfully");

        setShowForm(false);
        resetForm();
        fetchColleges();
      } else {
        alert(res.data.message);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // ================= DELETE COLLEGE =================
  const deleteCollege = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this college?"
    );

    if (!confirmDelete) return;

    try {
      const res = await axios.delete(
        "http://localhost:8090/Delete-College",
        {
          data: { id },
        }
      );

      console.log(res.data);

      if (res.data.status) {
        alert("College Deleted Successfully");
        fetchColleges();
      }
    } catch (error) {
      console.log(error);
    }
  };

  // ================= EDIT COLLEGE =================
  const editCollegeHandler = async (e) => {
    e.preventDefault();

    try {
      const data = {
        id: editCollege._id,

        name: form.name,
        slug: form.slug,
        logo: form.logo,
        description: form.description,
        collegeType: form.collegeType,
        ownership: form.ownership,
        establishedYear: Number(form.establishedYear),

        location: {
          address: form.address,
          city: form.city,
          state: form.state,
          country: form.country,
          pincode: form.pincode,
        },

        website: form.website,

        contact: {
          email: form.contactEmail,
          phone: form.contactPhone,
        },

        isVerified: form.isVerified,
        status: form.status,
      };

      const res = await axios.put(
        "http://localhost:8090/Edit-College",
        data
      );

      console.log(res.data);

      if (res.data.status) {
        alert("College Updated Successfully");

        setEditCollege(null);
        resetForm();
        fetchColleges();
      } else {
        alert(res.data.message);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // ================= EDIT BUTTON =================
  const openEdit = (college) => {
    setEditCollege(college);

    setForm({
      name: college.name || "",
      slug: college.slug || "",
      logo: college.logo || "",
      description: college.description || "",
      collegeType: college.collegeType || "",
      ownership: college.ownership || "",
      establishedYear: college.establishedYear || "",

      address: college.location?.address || "",
      city: college.location?.city || "",
      state: college.location?.state || "",
      country: college.location?.country || "",
      pincode: college.location?.pincode || "",

      website: college.website || "",

      contactEmail: college.contact?.email || "",
      contactPhone: college.contact?.phone || "",

      isVerified: college.isVerified || false,
      status: college.status || "pending",
    });
  };

  // ================= RESET FORM =================
  const resetForm = () => {
    setForm({
      name: "",
      slug: "",
      logo: "",
      description: "",
      collegeType: "",
      ownership: "",
      establishedYear: "",
      address: "",
      city: "",
      state: "",
      country: "",
      pincode: "",
      website: "",
      contactEmail: "",
      contactPhone: "",
      isVerified: false,
      status: "pending",
    });
  };

  // ================= SEARCH =================
  const handleSearch = (e) => {
    const value = e.target.value;

    setSearch(value);

    fetchColleges(
      value,
      collegeType,
      status,
      1,
      sortBy,
      order
    );
  };

  return (
    <div className="ml-70 min-h-screen bg-slate-100 p-6">

      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Colleges
          </h1>

          <p className="text-slate-500 mt-1">
            Manage all colleges
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setEditCollege(null);
            setShowForm(true);
          }}
          className="bg-slate-900 text-white px-5 py-3 rounded-lg hover:bg-slate-700"
        >
          + Add College
        </button>
      </div>

      {/* ================= FILTER SECTION ================= */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-5 flex gap-3 flex-wrap">

        {/* Search */}
        <input
          type="text"
          placeholder="Search college, city, state..."
          value={search}
          onChange={handleSearch}
          className="border border-slate-300 px-4 py-2 rounded-lg w-72 outline-none"
        />

        {/* College Type */}
        <select
          value={collegeType}
          onChange={(e) => {
            const value = e.target.value;
            setCollegeType(value);

            fetchColleges(
              search,
              value,
              status,
              1,
              sortBy,
              order
            );
          }}
          className="border border-slate-300 px-4 py-2 rounded-lg"
        >
          <option value="">All Types</option>
          <option value="government">Government</option>
          <option value="private">Private</option>
          <option value="deemed">Deemed</option>
          <option value="autonomous">Autonomous</option>
          <option value="public">Public</option>
        </select>

        {/* Status */}
        <select
          value={status}
          onChange={(e) => {
            const value = e.target.value;
            setStatus(value);

            fetchColleges(
              search,
              collegeType,
              value,
              1,
              sortBy,
              order
            );
          }}
          className="border border-slate-300 px-4 py-2 rounded-lg"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="pending">Pending</option>
        </select>

        {/* Sort By */}
        <select
          value={sortBy}
          onChange={(e) => {
            const value = e.target.value;

            setSortBy(value);

            fetchColleges(
              search,
              collegeType,
              status,
              1,
              value,
              order
            );
          }}
          className="border border-slate-300 px-4 py-2 rounded-lg"
        >
          <option value="">Sort By</option>
          <option value="name">Name</option>
          <option value="establishedYear">
            Established Year
          </option>
          <option value="createdAt">Created Date</option>
        </select>

        {/* Order */}
        <select
          value={order}
          onChange={(e) => {
            const value = e.target.value;

            setOrder(value);

            fetchColleges(
              search,
              collegeType,
              status,
              1,
              sortBy,
              value
            );
          }}
          className="border border-slate-300 px-4 py-2 rounded-lg"
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>

      {/* ================= TABLE ================= */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-slate-900 text-white">

              <tr>
                <th className="px-4 py-4 text-left">#</th>
                <th className="px-4 py-4 text-left">
                  College
                </th>
                <th className="px-4 py-4 text-left">
                  Type
                </th>
                <th className="px-4 py-4 text-left">
                  Location
                </th>
                <th className="px-4 py-4 text-left">
                  Contact
                </th>
                <th className="px-4 py-4 text-left">
                  Status
                </th>
                <th className="px-4 py-4 text-left">
                  Verified
                </th>
                <th className="px-4 py-4 text-left">
                  Actions
                </th>
              </tr>

            </thead>

            <tbody>

              {colleges.length === 0 ? (

                <tr>
                  <td
                    colSpan="8"
                    className="text-center py-10 text-slate-500"
                  >
                    No colleges found
                  </td>
                </tr>

              ) : (

                colleges.map((college, index) => (

                  <tr
                    key={college._id}
                    className="border-b hover:bg-slate-50"
                  >

                    {/* Number */}
                    <td className="px-4 py-4">
                      {(currentPage - 1) * 10 +
                        index +
                        1}
                    </td>

                    {/* College */}
                    <td className="px-4 py-4">

                      <div className="flex items-center gap-3">

                        {college.logo ? (
                          <img
                            src={college.logo}
                            alt={college.name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center">
                            🏫
                          </div>
                        )}

                        <div>
                          <p className="font-semibold text-slate-800">
                            {college.name}
                          </p>

                          <p className="text-xs text-slate-500">
                            {college.slug}
                          </p>
                        </div>

                      </div>

                    </td>

                    {/* Type */}
                    <td className="px-4 py-4 capitalize">
                      {college.collegeType || "-"}
                    </td>

                    {/* Location */}
                    <td className="px-4 py-4">

                      <p>
                        {college.location?.city || "-"}
                      </p>

                      <p className="text-xs text-slate-500">
                        {college.location?.state || "-"}
                      </p>

                    </td>

                    {/* Contact */}
                    <td className="px-4 py-4">

                      <p className="text-sm">
                        {college.contact?.email || "-"}
                      </p>

                      <p className="text-xs text-slate-500">
                        {college.contact?.phone || "-"}
                      </p>

                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                          college.status === "active"
                            ? "bg-green-100 text-green-700"
                            : college.status === "inactive"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {college.status}
                      </span>

                    </td>

                    {/* Verified */}
                    <td className="px-4 py-4">

                      {college.isVerified ? (
                        <span className="text-green-600 font-semibold">
                          ✓ Verified
                        </span>
                      ) : (
                        <span className="text-slate-400">
                          Not Verified
                        </span>
                      )}

                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4">

                      <div className="flex gap-2">

                        <button
                          onClick={() =>
                            setViewCollege(college)
                          }
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded"
                        >
                          <Eye size={18} />
                        </button>

                        <button
                          onClick={() =>
                            openEdit(college)
                          }
                          className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded"
                        >
                          <Pencil size={18}/>
                        </button>

                        <button
                          onClick={() =>
                            deleteCollege(college._id)
                          }
                          className="px-3 py-1 bg-red-100 text-red-700 rounded"
                        >
                          <Trash2 size={18}/>
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

      {/* ================= PAGINATION ================= */}
      <div className="flex justify-center items-center gap-4 mt-6">

        <button
          disabled={currentPage === 1}
          onClick={() =>
            fetchColleges(
              search,
              collegeType,
              status,
              currentPage - 1,
              sortBy,
              order
            )
          }
          className="px-4 py-2 bg-white border rounded-lg disabled:opacity-50"
        >
          Previous
        </button>

        <span className="font-medium">
          Page {currentPage} of {totalPages}
        </span>

        <button
          disabled={currentPage === totalPages}
          onClick={() =>
            fetchColleges(
              search,
              collegeType,
              status,
              currentPage + 1,
              sortBy,
              order
            )
          }
          className="px-4 py-2 bg-white border rounded-lg disabled:opacity-50"
        >
          Next
        </button>

      </div>

      {/* ================= ADD / EDIT MODAL ================= */}
      {(showForm || editCollege) && (

        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">

          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">

            <div className="flex justify-between items-center mb-5">

              <h2 className="text-2xl font-bold">
                {editCollege
                  ? "Edit College"
                  : "Add College"}
              </h2>

              <button
                onClick={() => {
                  setShowForm(false);
                  setEditCollege(null);
                  resetForm();
                }}
                className="text-2xl text-slate-500"
              >
                ×
              </button>

            </div>

            <form
              onSubmit={
                editCollege
                  ? editCollegeHandler
                  : addCollege
              }
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >

              {/* Name */}
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="College Name"
                required
                className="border p-3 rounded-lg"
              />

              {/* Slug */}
              <input
                name="slug"
                value={form.slug}
                onChange={handleChange}
                placeholder="Slug"
                className="border p-3 rounded-lg"
              />

              {/* Logo */}
              <input
                name="logo"
                value={form.logo}
                onChange={handleChange}
                placeholder="Logo URL"
                className="border p-3 rounded-lg"
              />

              {/* Ownership */}
              <input
                name="ownership"
                value={form.ownership}
                onChange={handleChange}
                placeholder="Ownership"
                className="border p-3 rounded-lg"
              />

              {/* College Type */}
              <select
                name="collegeType"
                value={form.collegeType}
                onChange={handleChange}
                required
                className="border p-3 rounded-lg"
              >
                <option value="">
                  Select College Type
                </option>
                <option value="government">
                  Government
                </option>
                <option value="private">
                  Private
                </option>
                <option value="deemed">
                  Deemed
                </option>
                <option value="autonomous">
                  Autonomous
                </option>
                <option value="public">
                  Public
                </option>
              </select>

              {/* Established */}
              <input
                type="number"
                name="establishedYear"
                value={form.establishedYear}
                onChange={handleChange}
                placeholder="Established Year"
                className="border p-3 rounded-lg"
              />

              {/* Address */}
              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Address"
                className="border p-3 rounded-lg"
              />

              {/* City */}
              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="City"
                className="border p-3 rounded-lg"
              />

              {/* State */}
              <input
                name="state"
                value={form.state}
                onChange={handleChange}
                placeholder="State"
                className="border p-3 rounded-lg"
              />

              {/* Country */}
              <input
                name="country"
                value={form.country}
                onChange={handleChange}
                placeholder="Country"
                className="border p-3 rounded-lg"
              />

              {/* Pincode */}
              <input
                name="pincode"
                value={form.pincode}
                onChange={handleChange}
                placeholder="Pincode"
                className="border p-3 rounded-lg"
              />

              {/* Website */}
              <input
                name="website"
                value={form.website}
                onChange={handleChange}
                placeholder="Website"
                className="border p-3 rounded-lg"
              />

              {/* Email */}
              <input
                type="email"
                name="contactEmail"
                value={form.contactEmail}
                onChange={handleChange}
                placeholder="Contact Email"
                className="border p-3 rounded-lg"
              />

              {/* Phone */}
              <input
                name="contactPhone"
                value={form.contactPhone}
                onChange={handleChange}
                placeholder="Contact Phone"
                className="border p-3 rounded-lg"
              />

              {/* Status */}
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="border p-3 rounded-lg"
              >
                <option value="pending">
                  Pending
                </option>
                <option value="active">
                  Active
                </option>
                <option value="inactive">
                  Inactive
                </option>
              </select>

              {/* Description */}
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Description"
                rows="3"
                className="border p-3 rounded-lg md:col-span-2"
              />

              {/* Verified */}
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isVerified"
                  checked={form.isVerified}
                  onChange={handleChange}
                />

                College Verified
              </label>

              {/* Submit */}
              <button
                type="submit"
                className="bg-slate-900 text-white py-3 rounded-lg hover:bg-slate-700 md:col-span-2"
              >
                {editCollege
                  ? "Update College"
                  : "Add College"}
              </button>

            </form>

          </div>

        </div>

      )}

      {/* ================= VIEW MODAL ================= */}
      {viewCollege && (

        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">

          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">

            <div className="flex justify-between items-center mb-5">

              <h2 className="text-2xl font-bold">
                College Details
              </h2>

              <button
                onClick={() => setViewCollege(null)}
                className="text-2xl text-slate-500"
              >
                ×
              </button>

            </div>

            <div className="space-y-3">

              <p>
                <b>Name:</b> {viewCollege.name}
              </p>

              <p>
                <b>Slug:</b> {viewCollege.slug || "-"}
              </p>

              <p>
                <b>Type:</b>{" "}
                {viewCollege.collegeType || "-"}
              </p>

              <p>
                <b>Ownership:</b>{" "}
                {viewCollege.ownership || "-"}
              </p>

              <p>
                <b>Established:</b>{" "}
                {viewCollege.establishedYear || "-"}
              </p>

              <p>
                <b>Address:</b>{" "}
                {viewCollege.location?.address || "-"}
              </p>

              <p>
                <b>City:</b>{" "}
                {viewCollege.location?.city || "-"}
              </p>

              <p>
                <b>State:</b>{" "}
                {viewCollege.location?.state || "-"}
              </p>

              <p>
                <b>Country:</b>{" "}
                {viewCollege.location?.country || "-"}
              </p>

              <p>
                <b>Pincode:</b>{" "}
                {viewCollege.location?.pincode || "-"}
              </p>

              <p>
                <b>Website:</b>{" "}
                {viewCollege.website || "-"}
              </p>

              <p>
                <b>Email:</b>{" "}
                {viewCollege.contact?.email || "-"}
              </p>

              <p>
                <b>Phone:</b>{" "}
                {viewCollege.contact?.phone || "-"}
              </p>

              <p>
                <b>Status:</b>{" "}
                {viewCollege.status}
              </p>

              <p>
                <b>Verified:</b>{" "}
                {viewCollege.isVerified
                  ? "Yes"
                  : "No"}
              </p>

              <p>
                <b>Description:</b>{" "}
                {viewCollege.description || "-"}
              </p>

            </div>

          </div>

        </div>

      )}

    </div>
  );
};

export default Colleges;