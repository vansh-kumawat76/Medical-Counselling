
"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  FileText,
  UploadCloud,
  Eye,
  Download,
  Trash2,
  RefreshCw,
  X,
  FileImage,
  File,
  ShieldCheck,
  Clock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/src/lib/axios";

type DocumentStatus = "Pending" | "Verified" | "Rejected";

type StudentDocument = {
  _id: string;
  category: string;
  fileName: string;
  fileType: string;
  status: DocumentStatus;
  rejectionReason?: string;
  createdAt: string;
};

type PreviewDocument = {
  fileName: string;
  fileType: string;
  fileUrl: string;
};

const REQUIRED_DOCUMENTS = [
  "10th Marksheet",
  "12th Marksheet",
  "Graduation",
  "Aadhaar",
  "PAN Card",
  "Voter Id",
];

const allowedTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";

export default function DocumentsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);

  const [requiredDocuments, setRequiredDocuments] =
    useState<string[]>(REQUIRED_DOCUMENTS);

  const [missingDocuments, setMissingDocuments] =
    useState<string[]>(REQUIRED_DOCUMENTS);

  const [isComplete, setIsComplete] = useState(false);

  const [category, setCategory] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [uploadLoading, setUploadLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  const [previewDocument, setPreviewDocument] =
    useState<PreviewDocument | null>(null);

  const [previewLoading, setPreviewLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState<string | null>(null);

  // ================= FETCH DOCUMENTS =================

  const fetchDocuments = async () => {
    try {
      setDocumentsLoading(true);

      const response = await api.get("/upload-documents");

      if (response.data?.status) {
        const responseData = response.data;

        const fetchedDocuments: StudentDocument[] =
          Array.isArray(responseData.data) ? responseData.data : [];

        const required: string[] =
          Array.isArray(responseData.requiredDocuments)
            ? responseData.requiredDocuments
            : REQUIRED_DOCUMENTS;

        const missing: string[] =
          Array.isArray(responseData.missingDocuments)
            ? responseData.missingDocuments
            : required.filter(
                (item) =>
                  !fetchedDocuments.some(
                    (doc) =>
                      doc.category === item && doc.status !== "Rejected"
                  )
              );

        setDocuments(fetchedDocuments);
        setRequiredDocuments(required);
        setMissingDocuments(missing);

        setIsComplete(
          typeof responseData.isComplete === "boolean"
            ? responseData.isComplete
            : missing.length === 0
        );
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          "Unable to load your documents."
      );
    } finally {
      setDocumentsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // ================= SELECT FILE =================

  const handleFileChange = (file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      toast.error("Only PDF, JPG, PNG and WEBP files are allowed.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must not exceed 10 MB.");
      return;
    }

    setSelectedFile(file);
  };

  // ================= UPLOAD DOCUMENT =================

  const handleUpload = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!category) {
      toast.error("Please select a document category.");
      return;
    }

    if (!selectedFile) {
      toast.error("Please select a document.");
      return;
    }

    if (!missingDocuments.includes(category)) {
      toast.error("This document category is already uploaded.");
      return;
    }

    const existingDocument = documents.find(
      (doc) => doc.category === category
    );

    if (existingDocument && existingDocument.status !== "Rejected") {
      toast.error("This document category is already uploaded.");
      return;
    }

    if (existingDocument?.status === "Rejected") {
      toast.error(
        "Please delete the rejected document before uploading it again."
      );
      return;
    }

    const formData = new FormData();

    formData.append("category", category);
    formData.append("document", selectedFile);

    try {
      setUploadLoading(true);

      const response = await api.post(
        "/upload-documents/upload",
        formData
      );

      if (response.data?.status) {
        toast.success(
          response.data.message || "Document uploaded successfully."
        );

        setCategory("");
        setSelectedFile(null);

        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        await fetchDocuments();
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          "Unable to upload document."
      );
    } finally {
      setUploadLoading(false);
    }
  };

  // ================= GET SECURE FILE URL =================

  const getSecureFileUrl = async (documentId: string) => {
    const response = await api.get(
      `/upload-documents/${documentId}/view`
    );

    if (!response.data?.status || !response.data?.data?.fileUrl) {
      throw new Error("Unable to generate document access URL.");
    }

    return response.data.data;
  };

  // ================= PREVIEW DOCUMENT =================

  const handlePreview = async (uploadedDoc: StudentDocument) => {
    try {
      setPreviewLoading(true);

      const data = await getSecureFileUrl(uploadedDoc._id);

      setPreviewDocument({
        fileName: data.fileName,
        fileType: data.fileType,
        fileUrl: data.fileUrl,
      });
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Unable to preview document."
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  // ================= DOWNLOAD DOCUMENT =================

  const handleDownload = async (uploadedDoc: StudentDocument) => {
    try {
      setDownloadLoading(uploadedDoc._id);

      const data = await getSecureFileUrl(uploadedDoc._id);

      const response = await fetch(data.fileUrl);

      if (!response.ok) {
        throw new Error("Unable to download document.");
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = window.document.createElement("a");

      link.href = blobUrl;
      link.download = data.fileName || uploadedDoc.fileName;

      window.document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 1000);

      toast.success("Document downloaded successfully.");
    } catch (error: any) {
      toast.error(
        error.message || "Unable to download document."
      );
    } finally {
      setDownloadLoading(null);
    }
  };

  // ================= DELETE DOCUMENT =================

  const handleDelete = async (uploadedDoc: StudentDocument) => {
    if (uploadedDoc.status === "Verified") {
      toast.error("Verified documents cannot be deleted.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${uploadedDoc.fileName}"?`
    );

    if (!confirmed) return;

    try {
      setDeleteLoading(uploadedDoc._id);

      const response = await api.delete(
        `/upload-documents/${uploadedDoc._id}`
      );

      if (response.data?.status) {
        toast.success(
          response.data.message || "Document deleted successfully."
        );

        if (category === uploadedDoc.category) {
          setCategory("");
        }

        await fetchDocuments();
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          "Unable to delete document."
      );
    } finally {
      setDeleteLoading(null);
    }
  };

  // ================= STATUS BADGE =================

  const getStatusClass = (status: DocumentStatus) => {
    switch (status) {
      case "Verified":
        return "bg-green-100 text-green-700";

      case "Rejected":
        return "bg-red-100 text-red-700";

      default:
        return "bg-amber-100 text-amber-700";
    }
  };

  // ================= SUMMARY =================

  const verifiedCount = documents.filter(
    (doc) => doc.status === "Verified"
  ).length;

  const pendingCount = documents.filter(
    (doc) => doc.status === "Pending"
  ).length;

  const rejectedCount = documents.filter(
    (doc) => doc.status === "Rejected"
  ).length;

  const uploadedCount = requiredDocuments.length - missingDocuments.length;

  const progressPercentage =
    requiredDocuments.length > 0
      ? Math.round((uploadedCount / requiredDocuments.length) * 100)
      : 0;

  // ================= UI =================

  return (
    <div className="flex min-h-screen bg-slate-50">
      <main className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-5xl">

          {/* PAGE HEADER */}

          <div className="mb-8">
            <p className="text-sm font-semibold text-indigo-600">
              Student Profile
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              My Documents
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Upload all your mandatory academic and identity documents.
            </p>
          </div>

          {/* MANDATORY DOCUMENT CHECKLIST */}

          <section className="mb-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Mandatory Documents
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  All six documents are required.
                </p>
              </div>

              <span
                className={`rounded-full px-4 py-2 text-sm font-bold ${
                  isComplete
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {uploadedCount}/{requiredDocuments.length} Uploaded
              </span>
            </div>

            {/* PROGRESS BAR */}

            <div className="mb-6">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-600">
                  Upload Progress
                </span>

                <span className="text-indigo-600">
                  {progressPercentage}%
                </span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {/* CHECKLIST */}

            <div className="grid gap-3 sm:grid-cols-2">
              {requiredDocuments.map((item) => {
                const uploadedDocument = documents.find(
                  (doc) =>
                    doc.category === item && doc.status !== "Rejected"
                );

                const rejectedDocument = documents.find(
                  (doc) =>
                    doc.category === item && doc.status === "Rejected"
                );

                const isUploaded = Boolean(uploadedDocument);

                return (
                  <div
                    key={item}
                    className={`flex items-center justify-between gap-3 rounded-xl border p-4 ${
                      isUploaded
                        ? "border-green-200 bg-green-50"
                        : rejectedDocument
                        ? "border-red-200 bg-red-50"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {isUploaded ? (
                        <CheckCircle2
                          size={22}
                          className="shrink-0 text-green-600"
                        />
                      ) : rejectedDocument ? (
                        <AlertCircle
                          size={22}
                          className="shrink-0 text-red-600"
                        />
                      ) : (
                        <Clock
                          size={22}
                          className="shrink-0 text-amber-500"
                        />
                      )}

                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800">
                          {item}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {isUploaded
                            ? `${uploadedDocument.status}`
                            : rejectedDocument
                            ? "Rejected - Upload again"
                            : "Not uploaded"}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 text-xs font-bold ${
                        isUploaded
                          ? "text-green-700"
                          : rejectedDocument
                          ? "text-red-600"
                          : "text-amber-600"
                      }`}
                    >
                      {isUploaded
                        ? "Completed"
                        : rejectedDocument
                        ? "Rejected"
                        : "Required"}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* COMPLETION MESSAGE */}

            {isComplete ? (
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
                <ShieldCheck
                  size={22}
                  className="shrink-0 text-green-600"
                />

                <div>
                  <p className="text-sm font-bold text-green-800">
                    All mandatory documents uploaded!
                  </p>

                  <p className="mt-1 text-xs text-green-700">
                    Your documents have been submitted for verification.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <AlertCircle
                  size={21}
                  className="shrink-0 text-amber-600"
                />

                <div>
                  <p className="text-sm font-bold text-amber-800">
                    Documents are incomplete
                  </p>

                  <p className="mt-1 text-xs text-amber-700">
                    Please upload all {missingDocuments.length} remaining
                    mandatory document(s).
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* SUMMARY CARDS */}

          <div className="mb-7 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                  <FileText size={22} />
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Total Documents
                  </p>

                  <h3 className="text-2xl font-bold text-slate-900">
                    {documents.length}
                  </h3>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-amber-50 text-amber-600">
                  <Clock size={22} />
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Pending
                  </p>

                  <h3 className="text-2xl font-bold text-slate-900">
                    {pendingCount}
                  </h3>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-green-50 text-green-600">
                  <ShieldCheck size={22} />
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Verified
                  </p>

                  <h3 className="text-2xl font-bold text-slate-900">
                    {verifiedCount}
                  </h3>
                </div>
              </div>
            </div>
          </div>

          {/* UPLOAD DOCUMENT */}

          <section className="mb-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                <UploadCloud size={22} />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  Upload New Document
                </h2>

                <p className="text-xs text-slate-500">
                  Select a mandatory document and upload it.
                </p>
              </div>
            </div>

            <form onSubmit={handleUpload} className="space-y-5 p-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Document Category
                </label>

                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={inputClass}
                  required
                  disabled={missingDocuments.length === 0}
                >
                  <option value="">
                    Select document category
                  </option>

                  {missingDocuments.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                {missingDocuments.length === 0 && (
                  <p className="mt-2 text-xs font-medium text-green-600">
                    All mandatory documents have been uploaded.
                  </p>
                )}

                {category &&
                  documents.some(
                    (doc) =>
                      doc.category === category &&
                      doc.status === "Rejected"
                  ) && (
                    <p className="mt-2 text-xs text-red-600">
                      Delete the rejected document from the list below
                      before uploading it again.
                    </p>
                  )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Choose Document
                </label>

                <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center transition hover:border-indigo-300">
                  <UploadCloud
                    size={34}
                    className="mx-auto text-indigo-500"
                  />

                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    Select a document from your device
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    PDF, JPG, PNG or WEBP · Maximum 10 MB
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                    onChange={(e) =>
                      handleFileChange(e.target.files?.[0] || null)
                    }
                    className="mt-4 block w-full cursor-pointer text-sm text-slate-500 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-600 hover:file:bg-indigo-100"
                  />

                  {selectedFile && (
                    <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-indigo-100 bg-white p-3 text-left">
                      <div className="flex min-w-0 items-center gap-3">
                        <File
                          size={22}
                          className="shrink-0 text-indigo-600"
                        />

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {selectedFile.name}
                          </p>

                          <p className="text-xs text-slate-500">
                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);

                          if (fileInputRef.current) {
                            fileInputRef.current.value = "";
                          }
                        }}
                        className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        aria-label="Remove selected file"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end border-t border-slate-100 pt-5">
                <button
                  type="submit"
                  disabled={
                    uploadLoading ||
                    !category ||
                    !selectedFile ||
                    missingDocuments.length === 0
                  }
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <UploadCloud size={18} />

                  {uploadLoading ? "Uploading..." : "Upload Document"}
                </button>
              </div>
            </form>
          </section>

          {/* DOCUMENT LIST */}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                  <FileText size={22} />
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">
                    Uploaded Documents
                  </h2>

                  <p className="text-xs text-slate-500">
                    View and manage your uploaded documents.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={fetchDocuments}
                disabled={documentsLoading}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
              >
                <RefreshCw
                  size={16}
                  className={documentsLoading ? "animate-spin" : ""}
                />
                Refresh
              </button>
            </div>

            <div className="p-6">
              {documentsLoading ? (
                <div className="py-12 text-center text-sm text-slate-500">
                  Loading your documents...
                </div>
              ) : documents.length === 0 ? (
                <div className="py-12 text-center">
                  <FileImage
                    size={42}
                    className="mx-auto text-slate-300"
                  />

                  <h3 className="mt-4 font-semibold text-slate-700">
                    No documents uploaded yet
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Upload your first document using the form above.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {documents.map((uploadedDoc) => (
                    <div
                      key={uploadedDoc._id}
                      className="rounded-xl border border-slate-200 p-4 transition hover:border-indigo-200 sm:p-5"
                    >
                      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                            {uploadedDoc.fileType === "pdf" ? (
                              <FileText size={23} />
                            ) : (
                              <FileImage size={23} />
                            )}
                          </div>

                          <div className="min-w-0">
                            <h3 className="break-all text-sm font-semibold text-slate-800">
                              {uploadedDoc.fileName}
                            </h3>

                            <p className="mt-1 text-xs text-slate-500">
                              {uploadedDoc.category} ·{" "}
                              {uploadedDoc.fileType.toUpperCase()}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              Uploaded:{" "}
                              {new Date(
                                uploadedDoc.createdAt
                              ).toLocaleDateString("en-IN")}
                            </p>

                            <span
                              className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                                uploadedDoc.status
                              )}`}
                            >
                              {uploadedDoc.status}
                            </span>

                            {uploadedDoc.status === "Rejected" &&
                              uploadedDoc.rejectionReason && (
                                <p className="mt-2 flex items-start gap-2 text-xs text-red-600">
                                  <AlertCircle
                                    size={15}
                                    className="shrink-0"
                                  />
                                  {uploadedDoc.rejectionReason}
                                </p>
                              )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                          <button
                            type="button"
                            onClick={() => handlePreview(uploadedDoc)}
                            disabled={previewLoading}
                            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                          >
                            <Eye size={16} />
                            Preview
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownload(uploadedDoc)}
                            disabled={downloadLoading === uploadedDoc._id}
                            className="flex items-center gap-2 rounded-lg border border-indigo-200 px-3 py-2 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50 disabled:opacity-50"
                          >
                            <Download size={16} />
                            {downloadLoading === uploadedDoc._id
                              ? "Downloading..."
                              : "Download"}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(uploadedDoc)}
                            disabled={
                              deleteLoading === uploadedDoc._id ||
                              uploadedDoc.status === "Verified"
                            }
                            title={
                              uploadedDoc.status === "Verified"
                                ? "Verified documents cannot be deleted"
                                : "Delete document"
                            }
                            className="flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Trash2 size={16} />
                            {deleteLoading === uploadedDoc._id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!documentsLoading && documents.length > 0 && (
                <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-5">
                  <p className="text-xs text-slate-500">
                    Total documents: {documents.length}
                  </p>

                  <p className="text-xs text-slate-500">
                    Rejected: {rejectedCount}
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* PREVIEW MODAL */}

      {previewDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 sm:p-6">
          <div className="flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div className="min-w-0">
                <h2 className="truncate text-sm font-bold text-slate-900">
                  {previewDocument.fileName}
                </h2>

                <p className="text-xs text-slate-500">
                  Document Preview
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPreviewDocument(null)}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-red-600"
                aria-label="Close preview"
              >
                <X size={21} />
              </button>
            </div>

            <div className="min-h-[300px] flex-1 overflow-auto bg-slate-100 p-3 sm:p-5">
              {previewDocument.fileType === "pdf" ? (
                <iframe
                  src={previewDocument.fileUrl}
                  title={previewDocument.fileName}
                  className="h-[70vh] w-full rounded-lg border border-slate-200 bg-white"
                />
              ) : (
                <div className="flex min-h-[60vh] items-center justify-center">
                  <img
                    src={previewDocument.fileUrl}
                    alt={previewDocument.fileName}
                    className="max-h-[70vh] max-w-full rounded-lg object-contain"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
