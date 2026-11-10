
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { RefreshCw, Eye, Mail, Phone, MessageSquare } from "lucide-react";

import {
  ui,
  PageHeader,
  Modal,
  DetailRow,
  FilterBar,
  SearchInput,
  DataTable,
  Pagination,
} from "./assets/Components/ui/ui";

const Contact = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [enquiryFilter, setEnquiryFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ================= FETCH CONTACTS =================

  const fetchContacts = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        "http://localhost:8090/get-contacts"
      );

      if (response.data.status) {
        setContacts(response.data.contacts || []);
      } else {
        toast.error(
          response.data.message || "Failed to fetch enquiries"
        );
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to fetch contact enquiries"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  // ================= ENQUIRY TYPE OPTIONS =================

  const enquiryTypes = useMemo(() => {
    return [
      ...new Set(
        contacts
          .map((contact) => contact.enquiryType)
          .filter(Boolean)
      ),
    ].sort();
  }, [contacts]);

  // ================= SEARCH + FILTER + SORT =================

  const filteredContacts = useMemo(() => {
    let result = [...contacts];

    // Search
    if (search.trim()) {
      const searchValue = search.toLowerCase().trim();

      result = result.filter((contact) => {
        return [
          contact.name,
          contact.email,
          contact.phone,
          contact.enquiryType,
          contact.subject,
          contact.message,
        ].some((value) =>
          String(value || "").toLowerCase().includes(searchValue)
        );
      });
    }

    // Enquiry Type Filter
    if (enquiryFilter) {
      result = result.filter(
        (contact) => contact.enquiryType === enquiryFilter
      );
    }

    // Sorting
    if (sortOrder === "name-asc") {
      result.sort((a, b) =>
        String(a.name || "").localeCompare(String(b.name || ""))
      );
    } else if (sortOrder === "name-desc") {
      result.sort((a, b) =>
        String(b.name || "").localeCompare(String(a.name || ""))
      );
    } else if (sortOrder === "newest") {
      result.reverse();
    }

    return result;
  }, [contacts, search, enquiryFilter, sortOrder]);

  // ================= PAGINATION =================

  const totalPages = Math.ceil(
    filteredContacts.length / itemsPerPage
  );

  const paginatedContacts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;

    return filteredContacts.slice(
      startIndex,
      startIndex + itemsPerPage
    );
  }, [filteredContacts, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, enquiryFilter, sortOrder]);

  // ================= CLEAR FILTERS =================

  const clearFilters = () => {
    setSearch("");
    setEnquiryFilter("");
    setSortOrder("newest");
    setCurrentPage(1);
  };

  const hasFilters =
    search !== "" ||
    enquiryFilter !== "" ||
    sortOrder !== "newest";

  // ================= TABLE COLUMNS =================

  const columns = [
    {
      header: "Name",
      className: "w-[20%]",
      cell: (contact) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-800">
            {contact.name || "—"}
          </p>
        </div>
      ),
    },
    {
      header: "Email",
      className: "w-[22%]",
      cell: (contact) => (
        <span className="block truncate text-slate-600">
          {contact.email || "—"}
        </span>
      ),
    },
    {
      header: "Phone",
      className: "w-[15%]",
      hideBelow: "lg",
      cell: (contact) => (
        <span className="text-slate-600">
          {contact.phone || "—"}
        </span>
      ),
    },
    {
      header: "Enquiry Type",
      className: "w-[20%]",
      cell: (contact) => (
        <span className="inline-flex max-w-full truncate rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
          {contact.enquiryType || "General"}
        </span>
      ),
    },
    {
      header: "Subject",
      className: "w-[18%]",
      hideBelow: "md",
      truncate: true,
      cell: (contact) => (
        <span title={contact.subject || ""}>
          {contact.subject || "—"}
        </span>
      ),
    },
  ];

  // ================= ROW ACTIONS =================

  const renderActions = (contact) => (
    <div className="flex justify-end">
      <button
        type="button"
        onClick={() => setSelectedContact(contact)}
        title="View enquiry"
        className={`${ui.iconBtn} ${ui.iconBtnView}`}
      >
        <Eye size={17} />
      </button>
    </div>
  );

  // ================= MOBILE CARD =================

  const renderCard = (contact, index) => (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-slate-800">
            {contact.name || "—"}
          </p>

          <p className="mt-1 break-all text-xs text-slate-500">
            {contact.email || "—"}
          </p>
        </div>

        <span className="shrink-0 rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-700">
          {contact.enquiryType || "General"}
        </span>
      </div>

      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Phone size={14} />
        {contact.phone || "Phone not provided"}
      </div>

      {contact.subject && (
        <p className="truncate text-sm text-slate-600">
          <span className="font-medium text-slate-700">Subject:</span>{" "}
          {contact.subject}
        </p>
      )}

      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="text-xs text-slate-400">
          #{(currentPage - 1) * itemsPerPage + index + 1}
        </span>

        <button
          type="button"
          onClick={() => setSelectedContact(contact)}
          className={ui.btnSecondary}
        >
          <Eye size={15} />
          View Details
        </button>
      </div>
    </div>
  );

  // ================= RENDER =================

  return (
    <div className={ui.page}>
      <div className={ui.container}>

        {/* PAGE HEADER */}

        <PageHeader
          title="Contact Enquiries"
          subtitle="View and manage submitted contact enquiries."
          actions={
            <button
              type="button"
              onClick={fetchContacts}
              disabled={loading}
              className={ui.btnSecondary}
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          }
        />

        {/* SUMMARY */}

        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className={`${ui.card} p-4`}>
            <p className="text-sm font-medium text-slate-500">
              Total Enquiries
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-800">
              {contacts.length}
            </p>
          </div>

          <div className={`${ui.card} p-4`}>
            <p className="text-sm font-medium text-slate-500">
              Filtered Enquiries
            </p>

            <p className="mt-2 text-2xl font-bold text-indigo-600">
              {filteredContacts.length}
            </p>
          </div>
        </div>

        {/* FILTERS */}

        <FilterBar
          onClear={clearFilters}
          showClear={hasFilters}
        >
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search name, email, phone, subject..."
            className="col-span-2 lg:col-span-6"
          />

          <div className="col-span-1 lg:col-span-3">
            <select
              value={enquiryFilter}
              onChange={(e) => setEnquiryFilter(e.target.value)}
              className={ui.select}
            >
              <option value="">All Enquiry Types</option>

              {enquiryTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-1 lg:col-span-3">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className={ui.select}
            >
              <option value="newest">Newest First</option>
              <option value="name-asc">Name A - Z</option>
              <option value="name-desc">Name Z - A</option>
            </select>
          </div>
        </FilterBar>

        {/* CONTACT TABLE */}

        <DataTable
          columns={columns}
          rows={paginatedContacts}
          rowKey="_id"
          startIndex={(currentPage - 1) * itemsPerPage}
          renderActions={renderActions}
          renderCard={renderCard}
          loading={loading}
          emptyTitle="No contact enquiries found"
          emptyHint="Try changing your search or filters."
        />

        {/* TABLE FOOTER */}

        {!loading && filteredContacts.length > 0 && (
          <>
            <div className="mt-3 flex flex-col justify-between gap-2 px-1 text-sm text-slate-500 sm:flex-row sm:items-center">
              <p>
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {(currentPage - 1) * itemsPerPage + 1}
                </span>
                {" "}to{" "}
                <span className="font-semibold text-slate-700">
                  {Math.min(
                    currentPage * itemsPerPage,
                    filteredContacts.length
                  )}
                </span>
                {" "}of{" "}
                <span className="font-semibold text-slate-700">
                  {filteredContacts.length}
                </span>
                {" "}enquiries
              </p>
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onChange={setCurrentPage}
            />
          </>
        )}

        {/* VIEW DETAILS MODAL */}

        <Modal
          open={!!selectedContact}
          title="Enquiry Details"
          onClose={() => setSelectedContact(null)}
          size="lg"
          footer={
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedContact(null)}
                className={ui.btnSecondary}
              >
                Close
              </button>
            </div>
          }
        >
          {selectedContact && (
            <div className="space-y-5">

              {/* CONTACT INFORMATION */}

              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-800">
                  Contact Information
                </h3>

                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 px-4">
                  <DetailRow label="Full Name">
                    {selectedContact.name || "—"}
                  </DetailRow>

                  <DetailRow label="Email Address">
                    <span className="break-all">
                      {selectedContact.email || "—"}
                    </span>
                  </DetailRow>

                  <DetailRow label="Phone Number">
                    {selectedContact.phone || "Not provided"}
                  </DetailRow>

                  <DetailRow label="Enquiry Type">
                    <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                      {selectedContact.enquiryType || "General"}
                    </span>
                  </DetailRow>
                </div>
              </div>

              {/* SUBJECT */}

              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-800">
                  Subject
                </h3>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  {selectedContact.subject || "No subject provided"}
                </div>
              </div>

              {/* MESSAGE */}

              <div>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <MessageSquare size={16} />
                  Message
                </h3>

                <div className="whitespace-pre-wrap break-words rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700">
                  {selectedContact.message || "No message provided"}
                </div>
              </div>

            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default Contact;
