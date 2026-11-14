
"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode, ElementType, ChangeEvent, MouseEvent as ReactMouseEvent } from "react";
import gsap from "gsap";
import api from "@/src/lib/axios";
import toast from "react-hot-toast";

import {
  User, GraduationCap, BookOpen, MapPin, Wallet, ClipboardList,
  Pencil, Save, X, ChevronRight, ChevronLeft, Camera, Menu,
  Plus, Trash2, Upload, FileText, UploadCloud, Eye, Download,
  RefreshCw, FileImage, File, ShieldCheck, Clock, AlertCircle,
  CheckCircle2, Lock, ImagePlus
} from "lucide-react";

type AcademicLevel = "tenth" | "twelfth" | "graduation";
type DocumentStatus = "Pending" | "Verified" | "Rejected";
type ImageKind = "profile" | "cover";

type StudentDocument = {
  _id: string;
  category: string;
  fileName: string;
  fileUrl?: string;
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

type ParentDetails = {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  phone?: string;
  alternatePhone?: string;
  email?: string;
  occupation?: string;
};

type StateOption = {
  _id: string;
  name: string;
};

type CasteOption = {
  _id: string;
  name: string;
  category: string;
  level: "Central" | "State";
  state?: string | { _id: string; name: string } | null;
};

type ProfileData = {
  profileImage?: string;
  coverImage?: string;
  dob?: string;
  gender?: string;
  city?: string;
  state?: string;
  country?: string;
  personalDetails?: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    father?: ParentDetails;
    mother?: ParentDetails;
    personalEmail?: string;
    mobile?: string;
    alternateMobile?: string;
    currentAddress?: string;
    permanentAddress?: string;
    pinCode?: string;
    casteDetails?: {
  centralCaste?: CasteOption | string | null;
  stateCaste?: CasteOption | string | null;
};
  };
  academicDetails?: {
    tenth?: Record<string, any>;
    twelfth?: Record<string, any>;
    graduation?: Record<string, any>;
  };
  entranceExams?: any[];
  preferredCourses?: any[];
  preferredLocations?: string[];
  budget?: {
    min?: number | string;
    max?: number | string;
  };
  [key: string]: any;
};

const REQUIRED_DOCUMENTS = [
  "10th Marksheet",
  "12th Marksheet",
  "Graduation",
  "Aadhaar",
  "PAN Card",
  "Voter Id",
];

const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const tabs = [
  { label: "Personal Details", desc: "Your personal and family information", icon: User },
  { label: "Academic Details", desc: "10th, 12th and graduation records", icon: GraduationCap },
  { label: "Entrance Exams", desc: "Your exam scores and ranks", icon: ClipboardList },
  { label: "Preferred Courses", desc: "Courses you want to pursue", icon: BookOpen },
  { label: "Preferred Locations", desc: "Places where you want to study", icon: MapPin },
  { label: "Budget Details", desc: "Your preferred fee range", icon: Wallet },
  { label: "Upload Documents", desc: "Upload your required documents", icon: Upload },
];

const imageConfig = {
  profile: {
    endpoint: "/studentProfile/Upload-profileImage",
    field: "profileImage",
    success: "Profile image updated successfully!",
  },
  cover: {
    endpoint: "/studentProfile/Upload-coverImage",
    field: "coverImage",
    success: "Cover image updated successfully!",
  },
} as const;

function generateFullName(firstName?: string, lastName?: string) {
  return [firstName, lastName].map((v) => v?.trim()).filter(Boolean).join(" ");
}

function normalizeProfile(data: ProfileData): ProfileData {
  return {
    ...data,
    dob: data.dob ? data.dob.slice(0, 10) : "",
    personalDetails: {
      ...data.personalDetails,
      firstName: data.personalDetails?.firstName || "",
      lastName: data.personalDetails?.lastName || "",
      fullName: data.personalDetails?.fullName || generateFullName(
        data.personalDetails?.firstName,
        data.personalDetails?.lastName
      ),
      father: { ...data.personalDetails?.father },
      mother: { ...data.personalDetails?.mother },
      personalEmail: data.personalDetails?.personalEmail || "",
      mobile: data.personalDetails?.mobile || "",
      alternateMobile: data.personalDetails?.alternateMobile || "",
      currentAddress: data.personalDetails?.currentAddress || "",
      permanentAddress: data.personalDetails?.permanentAddress || "",
      pinCode: data.personalDetails?.pinCode || "",
      casteDetails: {
  centralCaste: data.personalDetails?.casteDetails?.centralCaste || null,
  stateCaste: data.personalDetails?.casteDetails?.stateCaste || null,
},
    },
    academicDetails: {
      tenth: { ...data.academicDetails?.tenth },
      twelfth: { ...data.academicDetails?.twelfth },
      graduation: { ...data.academicDetails?.graduation },
    },
    entranceExams: data.entranceExams || [],
    preferredCourses: data.preferredCourses || [],
    preferredLocations: data.preferredLocations || [],
    budget: {
      min: data.budget?.min ?? "",
      max: data.budget?.max ?? "",
    },
  };
}

function getCompletion(profile: ProfileData | null) {
  if (!profile) return 0;

  const personal = profile.personalDetails;
  const academic = profile.academicDetails;

  const checks = [
    profile.profileImage,
    personal?.firstName,
    personal?.lastName,
    personal?.father?.firstName,
    personal?.father?.lastName,
    personal?.mother?.firstName,
    personal?.mother?.lastName,
    personal?.personalEmail,
    personal?.mobile,
    personal?.currentAddress,
    personal?.permanentAddress,
    personal?.pinCode,
    profile.dob,
    profile.gender,
    profile.city,
    profile.state,
    profile.country,
    academic?.tenth?.board,
    academic?.tenth?.percentage,
    academic?.tenth?.passingYear,
    academic?.twelfth?.board,
    academic?.twelfth?.percentage,
    academic?.twelfth?.passingYear,
    academic?.twelfth?.stream,
    academic?.graduation?.course,
    academic?.graduation?.college,
    profile.entranceExams?.length ? "yes" : "",
    profile.preferredCourses?.length ? "yes" : "",
    profile.preferredLocations?.length ? "yes" : "",
    profile.budget?.min,
    profile.budget?.max,
  ];

  const filled = checks.filter((v) => v !== undefined && v !== null && v !== "").length;
  return Math.round((filled / checks.length) * 100);
}

function Detail({ label, value }: { label: string; value?: any }) {
  const hasValue = value !== undefined && value !== null && value !== "";

  return (
    <div className="rounded-xl bg-zinc-50 p-3.5 ring-1 ring-zinc-100">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">{label}</p>
      <p className={`mt-1 break-words text-sm font-semibold ${hasValue ? "text-zinc-900" : "text-zinc-400"}`}>
        {hasValue ? value : "Not added"}
      </p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: any;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-zinc-700">{label}</span>
      <input
        type={type}
        value={value ?? ""}
        placeholder={placeholder || `Enter ${label.toLowerCase()}`}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-4 focus:ring-zinc-100"
      />
    </label>
  );
}

function EmptyState({ icon: Icon, text }: { icon: ElementType; text: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-10 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-white text-zinc-500 shadow-sm ring-1 ring-zinc-200">
        <Icon size={22} />
      </div>
      <p className="max-w-xs text-sm text-zinc-500">{text}</p>
    </div>
  );
}

function SectionCard({
  title,
  description,
  icon: Icon,
  children,
  actions,
  editing,
  sectionRef,
}: {
  title: string;
  description: string;
  icon: ElementType;
  children: ReactNode;
  actions: ReactNode;
  editing: boolean;
  sectionRef?: React.Ref<HTMLElement>;
}) {
  return (
    <section
      ref={sectionRef}
      className={`rounded-2xl bg-white p-5 shadow-sm transition-shadow sm:p-7 ${
        editing ? "ring-2 ring-zinc-400" : "ring-1 ring-zinc-200/70"
      }`}
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-zinc-900 text-white">
            <Icon size={21} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
            <p className="text-sm text-zinc-500">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">{actions}</div>
      </div>
      {children}
    </section>
  );
}

function StatusBadge({ status }: { status: DocumentStatus }) {
  const styles = {
    Verified: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Pending: "bg-amber-50 text-amber-700 ring-amber-200",
    Rejected: "bg-rose-50 text-rose-700 ring-rose-200",
  };

  const Icon = status === "Verified" ? CheckCircle2 : status === "Rejected" ? AlertCircle : Clock;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${styles[status]}`}>
      <Icon size={13} />
      {status}
    </span>
  );
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [formData, setFormData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [editingSection, setEditingSection] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [userName, setUserName] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [states, setStates] = useState<StateOption[]>([]);
const [centralCastes, setCentralCastes] = useState<CasteOption[]>([]);
const [stateCastes, setStateCastes] = useState<CasteOption[]>([]);
  const [uploading, setUploading] = useState<Record<ImageKind, boolean>>({
    profile: false,
    cover: false,
  });
  const [previews, setPreviews] = useState<Record<ImageKind, string>>({
    profile: "",
    cover: "",
  });

  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [requiredDocuments, setRequiredDocuments] = useState<string[]>(REQUIRED_DOCUMENTS);
  const [missingDocuments, setMissingDocuments] = useState<string[]>(REQUIRED_DOCUMENTS);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentUploading, setDocumentUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(REQUIRED_DOCUMENTS[0]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewDocument, setPreviewDocument] = useState<PreviewDocument | null>(null);
  const [viewLoading, setViewLoading] = useState<string | null>(null);
  const [deletingDocument, setDeletingDocument] = useState<string | null>(null);

  const profileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLDivElement>(null);
  const profileImageRef = useRef<HTMLDivElement>(null);
  const sectionCardRef = useRef<HTMLElement>(null);
  const previewRefs = useRef<Record<ImageKind, string>>({ profile: "", cover: "" });

  const current = formData;

  const fetchProfile = async () => {
    try {
      const response = await api.get("/studentProfile/Get-studentProfile");

      if (response.data.status) {
        const data = normalizeProfile(response.data.data);
        setProfile(data);
        setFormData(data);
        setError("");
      } else {
        setError(response.data.message || "Unable to fetch student profile");
      }
    } catch (err: any) {
      console.error("Profile API Error:", err);
      setError(err.response?.data?.message || "Unable to fetch student profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      setDocumentsLoading(true);
      const response = await api.get("/upload-documents/");

      if (response.data.status) {
        setDocuments(response.data.data || []);
        setRequiredDocuments(response.data.requiredDocuments || REQUIRED_DOCUMENTS);
        setMissingDocuments(response.data.missingDocuments || REQUIRED_DOCUMENTS);
      } else {
        toast.error(response.data.message || "Unable to load documents");
      }
    } catch (err: any) {
      console.error("Documents API Error:", err);
      toast.error(err.response?.data?.message || "Unable to load documents");
    } finally {
      setDocumentsLoading(false);
    }
  };

  const fetchCasteOptions = async () => {
  try {
    const [stateResponse, centralResponse] = await Promise.all([
      api.get("/state/all"),
      api.get("/caste/level?level=Central"),
    ]);

    if (stateResponse.data.status) {
      setStates(stateResponse.data.data || []);
    }

    if (centralResponse.data.status) {
      setCentralCastes(centralResponse.data.data || []);
    }
  } catch (err: any) {
    console.error("Caste Options API Error:", err);
    toast.error(
      err.response?.data?.message || "Unable to load caste options"
    );
  }
};

  useEffect(() => {
    fetchProfile();
    fetchDocuments();
    fetchCasteOptions();

    try {
      const saved = localStorage.getItem("user");
      if (saved) {
        const parsed = JSON.parse(saved);
        const user = parsed.user || parsed;
        const name =
          user.name ||
          user.fullName ||
          user.studentName ||
          [user.firstName, user.lastName].filter(Boolean).join(" ");
        if (name) setUserName(name);
      }
    } catch {
      // Ignore malformed localStorage data.
    }
  }, []);

  useEffect(() => {
    if (loading || error || !bannerRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        bannerRef.current,
        { y: 45, opacity: 0, rotateX: -8, transformPerspective: 1000 },
        { y: 0, opacity: 1, rotateX: 0, duration: 0.9, ease: "power4.out", clearProps: "transform" }
      );
    });

    return () => ctx.revert();
  }, [loading, error]);

  useEffect(() => {
    if (loading || error || !sectionCardRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        sectionCardRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power3.out", clearProps: "transform" }
      );
    });

    return () => ctx.revert();
  }, [activeTab, editingSection, loading, error]);

  useEffect(() => {
    return () => {
      (Object.keys(previewRefs.current) as ImageKind[]).forEach((kind) => {
        const url = previewRefs.current[kind];
        if (url.startsWith("blob:")) URL.revokeObjectURL(url);
      });
    };
  }, []);

  const updateImagePreview = (kind: ImageKind, url: string) => {
    const oldUrl = previewRefs.current[kind];
    if (oldUrl.startsWith("blob:")) URL.revokeObjectURL(oldUrl);
    previewRefs.current[kind] = url;
    setPreviews((prev) => ({ ...prev, [kind]: url }));
  };

  const handleImageMouseMove = (event: ReactMouseEvent<HTMLDivElement>) => {
    const element = profileImageRef.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 12;
    const rotateX = ((rect.height / 2 - y) / (rect.height / 2)) * 12;

    gsap.to(element, {
      rotateX,
      rotateY,
      scale: 1.04,
      duration: 0.3,
      ease: "power2.out",
      transformPerspective: 800,
      overwrite: "auto",
    });
  };

  const handleImageMouseLeave = () => {
    if (!profileImageRef.current) return;
    gsap.to(profileImageRef.current, {
      rotateX: 0,
      rotateY: 0,
      scale: 1,
      duration: 0.5,
      ease: "power2.out",
      overwrite: "auto",
    });
  };

  const handleImageUpload = async (kind: ImageKind, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!IMAGE_TYPES.includes(file.type)) {
      toast.error("Only JPG, PNG and WEBP images are allowed");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("Image size must be less than 5MB");
      event.target.value = "";
      return;
    }

    const config = imageConfig[kind];
    const oldPreview = previews[kind];
    updateImagePreview(kind, URL.createObjectURL(file));

    try {
      setUploading((prev) => ({ ...prev, [kind]: true }));
      const body = new FormData();
      body.append(config.field, file);

      const response = await api.post(config.endpoint, body);

      if (!response.data.status) {
        throw new Error(response.data.message || "Image upload failed");
      }

      const imageUrl = response.data.data?.[config.field];
      if (!imageUrl) throw new Error("Image URL was not returned by server");

      setProfile((prev) => prev ? { ...prev, [config.field]: imageUrl } : prev);
      setFormData((prev) => prev ? { ...prev, [config.field]: imageUrl } : prev);
      updateImagePreview(kind, imageUrl);
      toast.success(config.success);
    } catch (err: any) {
      updateImagePreview(kind, oldPreview);
      toast.error(err.response?.data?.message || err.message || "Image upload failed");
    } finally {
      setUploading((prev) => ({ ...prev, [kind]: false }));
      event.target.value = "";
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev) => prev ? { ...prev, [field]: value } : prev);
  };

  const updatePersonalDetails = (field: string, value: string) => {
    setFormData((prev) => {
      if (!prev) return prev;
      const personalDetails = { ...prev.personalDetails, [field]: value };
      personalDetails.fullName = generateFullName(personalDetails.firstName, personalDetails.lastName);
      return { ...prev, personalDetails };
    });
  };

  const updateParentDetails = (parent: "father" | "mother", field: string, value: string) => {
    setFormData((prev) => {
      if (!prev) return prev;
      const parentDetails = { ...prev.personalDetails?.[parent], [field]: value };
      parentDetails.fullName = generateFullName(parentDetails.firstName, parentDetails.lastName);
      return {
        ...prev,
        personalDetails: { ...prev.personalDetails, [parent]: parentDetails },
      };
    });
  };

  const updateAcademic = (level: AcademicLevel, field: string, value: string) => {
    setFormData((prev) => prev ? {
      ...prev,
      academicDetails: {
        ...prev.academicDetails,
        [level]: { ...prev.academicDetails?.[level], [field]: value },
      },
    } : prev);
  };

  const updateExam = (index: number, field: string, value: string) => {
    setFormData((prev) => {
      if (!prev) return prev;
      const exams = [...(prev.entranceExams || [])];
      exams[index] = { ...exams[index], [field]: value };
      return { ...prev, entranceExams: exams };
    });
  };

  const addExam = () => {
    setFormData((prev) => prev ? {
      ...prev,
      entranceExams: [...(prev.entranceExams || []), { exam: "", score: "", percentile: "", rank: "" }],
    } : prev);
  };

  const removeExam = (index: number) => {
    setFormData((prev) => prev ? {
      ...prev,
      entranceExams: (prev.entranceExams || []).filter((_, i) => i !== index),
    } : prev);
  };

  const startEditing = (index: number) => {
    if (!profile) return;
    setFormData(normalizeProfile(profile));
    setEditingSection(index);
  };

  const cancelEditing = () => {
    if (profile) setFormData(normalizeProfile(profile));
    setEditingSection(null);
  };

  const saveSection = async () => {
    if (!formData || !profile) return;

    try {
      setSaving(true);

      const payload = {
        dob: formData.dob || null,
        gender: formData.gender || "",
        city: formData.city || "",
        state: formData.state || "",
        country: formData.country || "",
        personalDetails: {
          ...formData.personalDetails,
          fullName: generateFullName(formData.personalDetails?.firstName, formData.personalDetails?.lastName),
          father: {
            ...formData.personalDetails?.father,
            fullName: generateFullName(formData.personalDetails?.father?.firstName, formData.personalDetails?.father?.lastName),
          },
          mother: {
            ...formData.personalDetails?.mother,
            fullName: generateFullName(formData.personalDetails?.mother?.firstName, formData.personalDetails?.mother?.lastName),
          },
        },
        academicDetails: formData.academicDetails,
        entranceExams: formData.entranceExams,
        preferredLocations: formData.preferredLocations,
        preferredCourses: formData.preferredCourses?.map((course: any) => course?._id || course),
        budget: {
          min: formData.budget?.min === "" ? null : Number(formData.budget?.min),
          max: formData.budget?.max === "" ? null : Number(formData.budget?.max),
        },
      };

      const response = await api.put("/studentProfile/Edit-studentProfile", payload);

      if (!response.data.status) throw new Error(response.data.message || "Unable to update profile");

      await fetchProfile();
      setEditingSection(null);
      toast.success("Profile section updated successfully!");
    } catch (err: any) {
      console.error("Profile Update Error:", err);
      toast.error(err.response?.data?.message || err.message || "Unable to update profile");
    } finally {
      setSaving(false);
    }
  };

  const updateLocations = (value: string) => {
    updateField("preferredLocations", value.split(",").map((v) => v.trim()).filter(Boolean));
  };

  const updateCourses = (value: string) => {
    updateField("preferredCourses", value.split(",").map((v) => v.trim()).filter(Boolean));
  };

  const handleDocumentUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a document first");
      return;
    }

    if (!ALLOWED_DOCUMENT_TYPES.includes(selectedFile.type)) {
      toast.error("Only PDF, JPG, PNG and WEBP files are allowed");
      return;
    }

    if (selectedFile.size > MAX_DOCUMENT_SIZE) {
      toast.error("Document size must not exceed 10 MB");
      return;
    }

    const alreadyUploaded = documents.find((doc) => doc.category === selectedCategory);
    if (alreadyUploaded) {
      toast.error(
        alreadyUploaded.status === "Rejected"
          ? "Delete the rejected document before uploading again"
          : "This document category has already been uploaded"
      );
      return;
    }

    try {
      setDocumentUploading(true);
      const body = new FormData();
      body.append("category", selectedCategory);
      body.append("document", selectedFile);

      const response = await api.post("/upload-documents/upload", body);

      if (!response.data.status) throw new Error(response.data.message || "Upload failed");

      toast.success(response.data.message || "Document uploaded successfully");
      setSelectedFile(null);
      if (documentInputRef.current) documentInputRef.current.value = "";
      await fetchDocuments();
    } catch (err: any) {
      console.error("Document Upload Error:", err);
      toast.error(err.response?.data?.message || err.message || "Unable to upload document");
    } finally {
      setDocumentUploading(false);
    }
  };

  const handleDocumentView = async (document: StudentDocument) => {
    try {
      setViewLoading(document._id);
      const response = await api.get(`/upload-documents/${document._id}/view`);

      if (!response.data.status) throw new Error(response.data.message || "Unable to open document");

      const data = response.data.data;
      setPreviewDocument({
        fileName: data.fileName,
        fileType: data.fileType,
        fileUrl: data.fileUrl,
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Unable to open document");
    } finally {
      setViewLoading(null);
    }
  };

  const handleDocumentDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;

    try {
      setDeletingDocument(id);
      const response = await api.delete(`/upload-documents/${id}`);

      if (!response.data.status) throw new Error(response.data.message || "Delete failed");

      toast.success(response.data.message || "Document deleted successfully");
      await fetchDocuments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Unable to delete document");
    } finally {
      setDeletingDocument(null);
    }
  };

  const renderPersonal = () => {
    const editing = editingSection === 0;
    const personal = editing ? current?.personalDetails : profile?.personalDetails;
    const father = personal?.father;
    const mother = personal?.mother;

    const parentFields = (parent: "father" | "mother", data?: ParentDetails) => {
      const title = parent === "father" ? "Father" : "Mother";
      return (
        <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4 sm:p-5">
          <h3 className="mb-4 text-base font-semibold text-zinc-900">{title} Information</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(["firstName", "lastName", "phone", "alternatePhone", "email", "occupation"] as const).map((field) => {
              const label = `${title} ${field.replace(/([A-Z])/g, " $1").replace(/^./, (v) => v.toUpperCase())}`;
              return editing ? (
                <Field
                  key={field}
                  label={label}
                  type={field === "email" ? "email" : "text"}
                  value={data?.[field]}
                  onChange={(v) => updateParentDetails(parent, field, v)}
                />
              ) : (
                <Detail key={field} label={label} value={data?.[field]} />
              );
            })}
            <Detail label={`${title} Full Name`} value={data?.fullName || generateFullName(data?.firstName, data?.lastName)} />
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4 sm:p-5">
          <h3 className="mb-4 text-base font-semibold text-zinc-900">Student Information</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {editing ? (
              <>
                <Field label="First Name" value={personal?.firstName} onChange={(v) => updatePersonalDetails("firstName", v)} />
                <Field label="Last Name" value={personal?.lastName} onChange={(v) => updatePersonalDetails("lastName", v)} />
                <Detail label="Full Name (Auto-generated)" value={current?.personalDetails?.fullName} />
              </>
            ) : (
              <>
                <Detail label="First Name" value={personal?.firstName} />
                <Detail label="Last Name" value={personal?.lastName} />
                <Detail label="Full Name" value={personal?.fullName} />
              </>
            )}
          </div>
        </div>

        {parentFields("father", father)}
        {parentFields("mother", mother)}

        <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4 sm:p-5">
          <h3 className="mb-4 text-base font-semibold text-zinc-900">Contact Details</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(["personalEmail", "mobile", "alternateMobile"] as const).map((field) => {
              const label = field === "personalEmail" ? "Personal Email" : field === "mobile" ? "Mobile Number" : "Alternate Mobile Number";
              return editing ? (
                <Field key={field} label={label} type={field === "personalEmail" ? "email" : "text"} value={personal?.[field]} onChange={(v) => updatePersonalDetails(field, v)} />
              ) : (
                <Detail key={field} label={label} value={personal?.[field]} />
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4 sm:p-5">
          <h3 className="mb-4 text-base font-semibold text-zinc-900">Address Details</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(["currentAddress", "permanentAddress", "pinCode"] as const).map((field) => {
              const label = field === "pinCode" ? "PIN Code" : field === "currentAddress" ? "Current Address" : "Permanent Address";
              return editing ? (
                <Field key={field} label={label} value={personal?.[field]} onChange={(v) => updatePersonalDetails(field, v)} />
              ) : (
                <Detail key={field} label={label} value={personal?.[field]} />
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4 sm:p-5">
          <h3 className="mb-4 text-base font-semibold text-zinc-900">Other Personal Details</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(["dob", "gender", "city", "state", "country"] as const).map((field) => {
              const label = field === "dob" ? "Date of Birth" : field.charAt(0).toUpperCase() + field.slice(1);
              const value = field === "dob" ? current?.dob : current?.[field];
              return editing ? (
                <Field key={field} label={label} type={field === "dob" ? "date" : "text"} value={value} onChange={(v) => updateField(field, v)} />
              ) : (
                <Detail key={field} label={label} value={field === "dob" && profile?.dob ? new Date(profile.dob).toLocaleDateString("en-IN") : profile?.[field]} />
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderAcademic = () => {
    const levels: { key: AcademicLevel; title: string; fields: string[] }[] = [
      { key: "tenth", title: "Class 10th", fields: ["board", "percentage", "passingYear"] },
      { key: "twelfth", title: "Class 12th", fields: ["board", "percentage", "passingYear", "stream"] },
      { key: "graduation", title: "Graduation", fields: ["course", "college", "percentage", "passingYear"] },
    ];

    return (
      <div className="grid gap-5 md:grid-cols-2">
        {levels.map((level) => {
          const editing = editingSection === 1;
          const record = (editing ? current : profile)?.academicDetails?.[level.key] || {};
          return (
            <div key={level.key} className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4 sm:p-5">
              <h3 className="mb-4 text-sm font-semibold text-zinc-900">{level.title}</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {level.fields.map((field) => {
                  const label = field === "passingYear" ? "Passing Year" : field.charAt(0).toUpperCase() + field.slice(1);
                  return editing ? (
                    <Field key={field} label={label} value={record[field]} onChange={(v) => updateAcademic(level.key, field, v)} />
                  ) : (
                    <Detail key={field} label={label} value={record[field]} />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderExams = () => {
    const editing = editingSection === 2;
    const exams = editing ? current?.entranceExams : profile?.entranceExams;

    return (
      <div className="space-y-4">
        {exams?.length ? exams.map((exam: any, index: number) => (
          <div key={exam._id || index} className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-900">Exam {index + 1}</h3>
              {editing && (
                <button type="button" onClick={() => removeExam(index)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-rose-600 hover:bg-rose-50">
                  <Trash2 size={15} /> Remove
                </button>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(["exam", "score", "percentile", "rank"] as const).map((field) => {
                const label = field === "exam" ? "Exam Name / Exam ID" : field.charAt(0).toUpperCase() + field.slice(1);
                const value = field === "exam" ? exam.exam?.name || exam.exam?.fullName || exam.exam : exam[field];
                return editing ? (
                  <Field key={field} label={label} value={value} onChange={(v) => updateExam(index, field, v)} />
                ) : (
                  <Detail key={field} label={label} value={value} />
                );
              })}
            </div>
          </div>
        )) : (
          <EmptyState icon={ClipboardList} text="No entrance exam details added yet." />
        )}
       {editing && (
  <button
    type="button"
    onClick={addExam}
    className="inline-flex items-center gap-2 rounded-xl border border-zinc-900 bg-zinc-900 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:border-zinc-700 hover:bg-zinc-700"
  >
    <Plus size={16} className="text-white" />
    <span className="text-white">Add Exam</span>
  </button>
)}
      </div>
    );
  };

  const renderCourses = () => editingSection === 3 ? (
    <div className="max-w-2xl">
      <Field
        label="Preferred Courses"
        value={(current?.preferredCourses || []).map((c: any) => c?.name || c).join(", ")}
        onChange={updateCourses}
        placeholder="Enter course names separated by commas"
      />
      <p className="mt-2 text-xs text-zinc-500">Separate course names with commas.</p>
    </div>
  ) : profile?.preferredCourses?.length ? (
    <div className="flex flex-wrap gap-2.5">
      {profile.preferredCourses.map((course: any, index: number) => (
        <span key={course?._id || index} className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white">
          <BookOpen size={14} /> {course?.name || course}
        </span>
      ))}
    </div>
  ) : <EmptyState icon={BookOpen} text="No preferred courses added yet." />;

  const renderLocations = () => editingSection === 4 ? (
    <div className="max-w-2xl">
      <Field
        label="Preferred Locations"
        value={(current?.preferredLocations || []).join(", ")}
        onChange={updateLocations}
        placeholder="Jaipur, Delhi, Mumbai"
      />
      <p className="mt-2 text-xs text-zinc-500">Separate locations with commas.</p>
    </div>
  ) : profile?.preferredLocations?.length ? (
    <div className="flex flex-wrap gap-2.5">
      {profile.preferredLocations.map((location: string) => (
        <span key={location} className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-800 ring-1 ring-zinc-200">
          <MapPin size={14} /> {location}
        </span>
      ))}
    </div>
  ) : <EmptyState icon={MapPin} text="No preferred locations added yet." />;

  const renderBudget = () => (
    <div className="grid gap-4 sm:grid-cols-2">
      {editingSection === 5 ? (
        <>
          <Field label="Minimum Budget" type="number" value={current?.budget?.min} onChange={(v) => setFormData((prev) => prev ? { ...prev, budget: { ...prev.budget, min: v } } : prev)} />
          <Field label="Maximum Budget" type="number" value={current?.budget?.max} onChange={(v) => setFormData((prev) => prev ? { ...prev, budget: { ...prev.budget, max: v } } : prev)} />
        </>
      ) : (
        <>
          <Detail label="Minimum Budget" value={profile?.budget?.min != null && profile.budget.min !== "" ? `₹${Number(profile.budget.min).toLocaleString("en-IN")}` : ""} />
          <Detail label="Maximum Budget" value={profile?.budget?.max != null && profile.budget.max !== "" ? `₹${Number(profile.budget.max).toLocaleString("en-IN")}` : ""} />
        </>
      )}
    </div>
  );

  
const renderDocuments = () => {
  const uploadedCategories = documents
    .filter((doc) => doc.status !== "Rejected")
    .map((doc) => doc.category);

  const uploadedCount = requiredDocuments.filter((category) =>
    uploadedCategories.includes(category)
  ).length;

  const progress = requiredDocuments.length
    ? Math.round((uploadedCount / requiredDocuments.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Document Completion */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-zinc-900">
              Document Completion
            </h3>
            <p className="mt-1 text-sm text-zinc-600">
              {uploadedCount} of {requiredDocuments.length} required documents
              uploaded
            </p>
          </div>

          <span className="text-2xl font-bold text-zinc-900">
            {progress}%
          </span>
        </div>

        <div className="h-2.5 overflow-hidden rounded-full bg-zinc-200">
          <div
            className="h-full rounded-full bg-zinc-900 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        {progress === 100 ? (
          <p className="mt-3 flex items-center gap-2 text-sm font-medium text-emerald-700">
            <CheckCircle2 size={16} />
            All required documents uploaded
          </p>
        ) : (
          <p className="mt-3 flex items-center gap-2 text-sm font-medium text-amber-700">
            <AlertCircle size={16} />
            {requiredDocuments.length - uploadedCount} document(s) still missing
          </p>
        )}
      </div>

      {/* Upload New Document */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="mb-4">
          <h3 className="font-semibold text-zinc-900">
            Upload New Document
          </h3>
          <p className="mt-1 text-sm text-zinc-600">
            PDF, JPG, PNG or WEBP. Maximum file size: 10 MB.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-zinc-800">
              Document Category
            </span>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-3 text-sm font-medium text-zinc-900 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-200"
            >
              <option value="" disabled>
                Select Document Category
              </option>

              {requiredDocuments.map((category) => {
                const existing = documents.find(
                  (doc) => doc.category === category
                );

                return (
                  <option
                    key={category}
                    value={category}
                    className="bg-white py-2 text-zinc-900"
                  >
                    {category}
                    {existing ? ` (Uploaded - ${existing.status})` : ""}
                  </option>
                );
              })}
            </select>
          </label>

          <div>
            <span className="mb-1.5 block text-sm font-semibold text-zinc-800">
              Choose File
            </span>

            <input
              ref={documentInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
              onChange={(e) =>
                setSelectedFile(e.target.files?.[0] || null)
              }
              className="block w-full rounded-xl border border-zinc-300 bg-white text-sm text-zinc-900 file:mr-3 file:border-0 file:bg-zinc-100 file:px-4 file:py-3 file:font-semibold file:text-zinc-900 hover:file:bg-zinc-200"
            />
          </div>
        </div>

        {selectedFile && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-zinc-50 p-3 text-sm">
            <span className="min-w-0 truncate font-medium text-zinc-800">
              {selectedFile.name}
            </span>

            <span className="shrink-0 text-xs font-medium text-zinc-600">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={handleDocumentUpload}
          disabled={documentUploading || !selectedFile || !selectedCategory}
          className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {documentUploading ? (
            <RefreshCw size={16} className="animate-spin" />
          ) : (
            <UploadCloud size={16} />
          )}

          {documentUploading ? "Uploading..." : "Upload Document"}
        </button>
      </div>

      {/* Required Documents */}
      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-zinc-900">
              Required Documents
            </h3>
            <p className="mt-1 text-sm text-zinc-600">
              Upload each required document to complete your profile.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchDocuments}
            disabled={documentsLoading}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-100 disabled:opacity-50"
          >
            <RefreshCw
              size={15}
              className={documentsLoading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {requiredDocuments.map((category) => {
            const doc = documents.find(
              (item) => item.category === category
            );

            const completed = !!doc && doc.status !== "Rejected";

            return (
              <div
                key={category}
                className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                      completed
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-zinc-100 text-zinc-700"
                    }`}
                  >
                    {completed ? (
                      <CheckCircle2 size={20} />
                    ) : (
                      <FileText size={20} />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-zinc-900">
                      {category}
                    </p>

                    <p className="mt-0.5 truncate text-xs text-zinc-600">
                      {doc ? doc.fileName : "Not uploaded yet"}
                    </p>

                    {doc && (
                      <div className="mt-1">
                        <StatusBadge status={doc.status} />
                      </div>
                    )}
                  </div>
                </div>

                {!completed && (
                  <span className="shrink-0 text-xs font-semibold text-rose-600">
                    {doc ? "Rejected" : "Missing"}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Uploaded Documents */}
      <div>
        <h3 className="mb-4 font-semibold text-zinc-900">
          Uploaded Documents
        </h3>

        {documentsLoading ? (
          <div className="flex items-center justify-center rounded-2xl border border-zinc-200 py-12 text-sm text-zinc-600">
            <RefreshCw size={17} className="mr-2 animate-spin" />
            Loading documents...
          </div>
        ) : documents.length ? (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc._id}
                className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-zinc-100 text-zinc-700">
                    {doc.fileType === "pdf" ? (
                      <FileText size={21} />
                    ) : (
                      <FileImage size={21} />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="font-semibold text-zinc-900">
                      {doc.category}
                    </p>

                    <p className="truncate text-sm text-zinc-600">
                      {doc.fileName}
                    </p>

                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <StatusBadge status={doc.status} />

                      <span className="text-xs text-zinc-500">
                        {new Date(doc.createdAt).toLocaleDateString("en-IN")}
                      </span>
                    </div>

                    {doc.status === "Rejected" && doc.rejectionReason && (
                      <p className="mt-2 text-xs text-rose-600">
                        Reason: {doc.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDocumentView(doc)}
                    disabled={viewLoading === doc._id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-100 disabled:opacity-50"
                  >
                    {viewLoading === doc._id ? (
                      <RefreshCw size={15} className="animate-spin" />
                    ) : (
                      <Eye size={15} />
                    )}
                    View
                  </button>

                  {doc.status !== "Verified" ? (
                    <button
                      type="button"
                      onClick={() => handleDocumentDelete(doc._id)}
                      disabled={deletingDocument === doc._id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                    >
                      {deletingDocument === doc._id ? (
                        <RefreshCw size={15} className="animate-spin" />
                      ) : (
                        <Trash2 size={15} />
                      )}
                      Delete
                    </button>
                  ) : (
                    <span
                      title="Verified documents cannot be deleted"
                      className="text-emerald-600"
                    >
                      <Lock size={18} />
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={FileText}
            text="You have not uploaded any documents yet."
          />
        )}
      </div>
    </div>
  );
};


  const sectionContent = [
    renderPersonal(),
    renderAcademic(),
    renderExams(),
    renderCourses(),
    renderLocations(),
    renderBudget(),
    renderDocuments(),
  ];

  const active = tabs[activeTab];
  const ActiveIcon = active.icon;
  const completion = getCompletion(profile);

  const handleTabChange = (index: number) => {
    setActiveTab(index);
    setEditingSection(null);
    setMobileMenuOpen(false);
    if (index === 6) fetchDocuments();
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-zinc-50">
        <div className="text-center">
          <RefreshCw size={30} className="mx-auto animate-spin text-zinc-700" />
          <p className="mt-4 text-sm font-medium text-zinc-500">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-zinc-50 px-4">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-zinc-200">
          <AlertCircle size={36} className="mx-auto text-rose-500" />
          <h2 className="mt-4 text-lg font-semibold text-zinc-900">Unable to load profile</h2>
          <p className="mt-2 text-sm text-zinc-500">{error}</p>
          <button type="button" onClick={() => { setLoading(true); fetchProfile(); }} className="mt-5 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-3 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Hero */}
        <div ref={bannerRef} className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-zinc-200">
          <div className="relative h-40 bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-500 sm:h-40">
            {(previews.cover || profile?.coverImage) && (
              <img src={previews.cover || profile?.coverImage} alt="Cover" className="h-full w-full object-cover" />
            )}
            <div className="absolute inset-0 bg-black/20" />
            <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handleImageUpload("cover", e)} />
            <button type="button" onClick={() => coverInputRef.current?.click()} disabled={uploading.cover} className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-xl bg-white/90 px-3 py-2 text-xs font-semibold text-zinc-900 shadow-sm hover:bg-white disabled:opacity-50">
              {uploading.cover ? <RefreshCw size={14} className="animate-spin" /> : <ImagePlus size={14} />}
              Change Cover
            </button>
          </div>

          
<div className="relative px-5 pb-5 sm:px-8">
  <div className="-mt-14 flex flex-col gap-5 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between">

    {/* Profile Image + Student Details */}
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
      <div
        ref={profileImageRef}
        onMouseMove={handleImageMouseMove}
        onMouseLeave={handleImageMouseLeave}
        className="relative h-28 w-28 shrink-0 overflow-hidden rounded-3xl border-4 border-white bg-zinc-100 shadow-lg sm:h-32 sm:w-32"
      >
        {(previews.profile || profile?.profileImage) ? (
          <img
            src={previews.profile || profile?.profileImage}
            alt="Profile"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-zinc-400">
            <User size={42} />
          </div>
        )}

        <input
          ref={profileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => handleImageUpload("profile", e)}
        />

        <button
          type="button"
          onClick={() => profileInputRef.current?.click()}
          disabled={uploading.profile}
          className="absolute bottom-1.5 right-1.5 grid h-8 w-8 place-items-center rounded-lg bg-zinc-900 text-white shadow hover:bg-zinc-700 disabled:opacity-50"
        >
          {uploading.profile ? (
            <RefreshCw size={14} className="animate-spin" />
          ) : (
            <Camera size={15} />
          )}
        </button>
      </div>

      <div className="">
      

        <h1 className="mt-1 text-xl font-bold text-zinc-900 sm:text-2xl">
          {userName ||
            profile?.personalDetails?.fullName ||
            generateFullName(
              profile?.personalDetails?.firstName,
              profile?.personalDetails?.lastName
            ) ||
            "Welcome"}
        </h1>

        <p className="mt-1 text-sm text-zinc-500">
          {profile?.personalDetails?.personalEmail ||
            "Manage your profile information"}
        </p>
      </div>
    </div>

    {/* Profile Completion */}
    <div className="w-full pb-1 sm:w-52 sm:text-right">
      <div className="flex items-center justify-between sm:justify-end sm:gap-3">
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-700">
          Profile Completion
        </p>

        <p className="text-2xl font-bold text-zinc-900">
          {completion}%
        </p>
      </div>

      <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-zinc-200">
        <div
          className="h-full rounded-full bg-emerald-700 transition-all duration-500"
          style={{ width: `${completion}%` }}
        />
      </div>
    </div>

  </div>
</div>

        </div>

        {/* Main layout */}
      
        {/* Sticky Tabs + Scrollable Content */}
        <div className="relative">
          {/* Sticky Tabs */}
          <div className="sticky top-0 z-40 mb-5 rounded-2xl border border-zinc-200 bg-white/95 p-2 shadow-md backdrop-blur-xl">
            <nav className="flex gap-2 overflow-x-auto scrollbar-hide">
              {tabs.map((tab, index) => {
                const Icon = tab.icon;
                const selected = activeTab === index;

                return (
                  <button
                    type="button"
                    key={tab.label}
                    onClick={() => handleTabChange(index)}
                    className={`flex min-w-fit shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-left transition ${
  selected
    ? "bg-zinc-900 text-white shadow-sm"
    : "bg-white text-zinc-800 hover:bg-zinc-100"
}`}
                  >
                    <Icon size={17} />

                    <span className="whitespace-nowrap text-sm font-semibold">
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Selected Tab Content */}
          <main className="min-w-0 space-y-5">
            <SectionCard
              sectionRef={sectionCardRef}
              title={active.label}
              description={active.desc}
              icon={ActiveIcon}
              editing={editingSection === activeTab}
              actions={
                activeTab === 6 ? (
                  <button
                    type="button"
                    onClick={fetchDocuments}
                    disabled={documentsLoading}
                    className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                  >
                    <RefreshCw
                      size={15}
                      className={documentsLoading ? "animate-spin" : ""}
                    />
                    Refresh
                  </button>
                ) : editingSection === activeTab ? (
                  <>
                    <button
                      type="button"
                      onClick={cancelEditing}
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-50"
                    >
                      <X size={15} />
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={saveSection}
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3.5 py-2 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-50"
                    >
                      {saving ? (
                        <RefreshCw size={15} className="animate-spin" />
                      ) : (
                        <Save size={15} />
                      )}
                      {saving ? "Saving..." : "Save"}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => startEditing(activeTab)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3.5 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
                  >
                    <Pencil size={15} />
                    Edit
                  </button>
                )
              }
            >
              {sectionContent[activeTab]}
            </SectionCard>

            {/* Previous / Next Navigation */}
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={activeTab === 0}
                onClick={() => handleTabChange(activeTab - 1)}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <span className="text-xs font-medium text-zinc-400">
                Section {activeTab + 1} of {tabs.length}
              </span>

              <button
                type="button"
                disabled={activeTab === tabs.length - 1}
                onClick={() => handleTabChange(activeTab + 1)}
                className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </main>
        </div>

      </div>

      {/* Document preview modal */}
      {previewDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-6" onClick={() => setPreviewDocument(null)}>
          <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-zinc-900">{previewDocument.fileName}</h3>
                <p className="text-xs text-zinc-500">Document Preview</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <a href={previewDocument.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50">
                  <Download size={14} /> Open
                </a>
                <button type="button" onClick={() => setPreviewDocument(null)} className="grid h-9 w-9 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100">
                  <X size={19} />
                </button>
              </div>
            </div>
            <div className="min-h-[50vh] flex-1 bg-zinc-100">
              {["jpg", "jpeg", "png", "webp"].includes(previewDocument.fileType.toLowerCase()) ? (
                <img src={previewDocument.fileUrl} alt={previewDocument.fileName} className="mx-auto max-h-[78vh] max-w-full object-contain" />
              ) : (
                <iframe src={previewDocument.fileUrl} title={previewDocument.fileName} className="h-[75vh] w-full border-0" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
