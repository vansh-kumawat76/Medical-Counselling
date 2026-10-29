
import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const Contact = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState(null);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
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

    fetchContacts();
  }, []);

  return (
    <div className="min-h-screen space-y-6">
      {/* Page Heading */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Contact Enquiries
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            View and manage submitted contact enquiries.
          </p>
        </div>
      </div>

      {/* Enquiries Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] table-fixed text-left">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200">
                <th className="w-14 px-4 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                  #
                </th>
                <th className="w-48 px-4 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Name
                </th>
                <th className="w-56 px-4 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Email
                </th>
                <th className="w-36 px-4 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Phone
                </th>
                <th className="w-56 px-4 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Enquiry Type
                </th>
                <th className="w-28 px-4 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-sm text-slate-500"
                  >
                    Loading enquiries...
                  </td>
                </tr>
              ) : contacts.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-sm text-slate-500"
                  >
                    No contact enquiries found.
                  </td>
                </tr>
              ) : (
                contacts.map((contact, index) => (
                  <tr
                    key={contact._id}
                    className="transition-colors hover:bg-slate-50"
                  >
                    <td className="px-4 py-4 text-sm text-slate-500">
                      {index + 1}
                    </td>

                    <td className="truncate px-4 py-4 text-sm font-semibold text-slate-800">
                      {contact.name}
                    </td>

                    <td className="truncate px-4 py-4 text-sm text-slate-600">
                      {contact.email}
                    </td>

                    <td className="truncate px-4 py-4 text-sm text-slate-600">
                      {contact.phone || "—"}
                    </td>

                    <td className="px-4 py-4">
                      <span className="inline-block max-w-full truncate rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-700">
                        {contact.enquiryType}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => setSelectedContact(contact)}
                        className="rounded-lg bg-[#103d69] px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && contacts.length > 0 && (
          <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 text-sm text-slate-500">
            Showing {contacts.length} enquiries
          </div>
        )}
      </div>

      {/* View Details Modal */}
      {selectedContact && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
          onClick={() => setSelectedContact(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-modal-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-5">
              <div>
                <h2
                  id="contact-modal-title"
                  className="text-xl font-bold text-slate-800"
                >
                  Enquiry Details
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Complete contact enquiry information
                </p>
              </div>

              <button
                type="button"
                aria-label="Close details"
                onClick={() => setSelectedContact(null)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
              >
                ×
              </button>
            </div>

            <div className="grid gap-5 p-6 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Full Name
                </p>
                <p className="mt-2 break-words font-medium text-slate-800">
                  {selectedContact.name}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Email Address
                </p>
                <p className="mt-2 break-words font-medium text-slate-800">
                  {selectedContact.email}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Phone Number
                </p>
                <p className="mt-2 break-words font-medium text-slate-800">
                  {selectedContact.phone || "Not provided"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Enquiry Type
                </p>
                <p className="mt-2 break-words font-medium text-slate-800">
                  {selectedContact.enquiryType}
                </p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Subject
                </p>
                <p className="mt-2 break-words font-medium text-slate-800">
                  {selectedContact.subject}
                </p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Message
                </p>
                <div className="mt-2 whitespace-pre-wrap break-words rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700">
                  {selectedContact.message}
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={() => setSelectedContact(null)}
                className="rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
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

export default Contact;
