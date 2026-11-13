"use client";

import { useEffect, useRef, useState } from "react";
import type {
  ReactNode,
  ElementType,
  ChangeEvent,
  Ref,
  MouseEvent as ReactMouseEvent,
} from "react";

import gsap from "gsap";
import api from "@/src/lib/axios";
import toast from "react-hot-toast";

import {
  UserRound,
  GraduationCap,
  BookOpen,
  MapPin,
  Wallet,
  ClipboardList,
  Pencil,
  User,
  Save,
  X,
  ChevronRight,
  ChevronLeft,
  Camera,
  ImagePlus,
  Menu,
  Plus,
  Trash2,
} from "lucide-react";

import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileSidebar from "@/components/profile/ProfileSidebar";

type AcademicLevel = "tenth" | "twelfth" | "graduation";

type AcademicField =
  | "board"
  | "percentage"
  | "passingYear"
  | "stream"
  | "course"
  | "college";

type ParentDetails = {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  phone?: string;
  alternatePhone?: string;
  email?: string;
  occupation?: string;
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
  };

  academicDetails?: {
    tenth?: {
      board?: string;
      percentage?: string | number;
      passingYear?: string | number;
    };
    twelfth?: {
      board?: string;
      percentage?: string | number;
      passingYear?: string | number;
      stream?: string;
    };
    graduation?: {
      course?: string;
      college?: string;
      percentage?: string | number;
      passingYear?: string | number;
    };
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

const tabs = [
  {
    label: "Personal Details",
    desc: "Your personal and family information",
    icon: User,
  },
  {
    label: "Academic Details",
    desc: "10th, 12th and graduation records",
    icon: GraduationCap,
  },
  {
    label: "Entrance Exams",
    desc: "Your exam scores and ranks",
    icon: ClipboardList,
  },
  {
    label: "Preferred Courses",
    desc: "Courses you want to pursue",
    icon: BookOpen,
  },
  {
    label: "Preferred Locations",
    desc: "Places where you want to study",
    icon: MapPin,
  },
  {
    label: "Budget Details",
    desc: "Your preferred fee range",
    icon: Wallet,
  },
];

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const imageConfig = {
  profile: {
    endpoint: "/studentProfile/Upload-profileImage",
    field: "profileImage",
    success: "Profile image updated successfully!",
    fail: "Unable to upload profile image",
  },
  cover: {
    endpoint: "/studentProfile/Upload-coverImage",
    field: "coverImage",
    success: "Cover image updated successfully!",
    fail: "Unable to upload cover image",
  },
} as const;

type ImageKind = keyof typeof imageConfig;

/* ------------------------------------------------------------------ */
/* Small UI components                                                  */
/* ------------------------------------------------------------------ */

function Detail({
  label,
  value,
  className = "bg-zinc-50 ring-zinc-100",
}: {
  label: string;
  value?: any;
  className?: string;
}) {
  const hasValue = value !== undefined && value !== null && value !== "";

  return (
    <div className={`rounded-xl p-3.5 ring-1 ${className}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
        {label}
      </p>

      <p
        className={`mt-1 break-words text-sm font-semibold ${
          hasValue ? "text-zinc-900" : "text-zinc-400"
        }`}
      >
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
      <span className="mb-1.5 block text-sm font-medium text-zinc-700">
        {label}
      </span>

      <input
        type={type}
        value={value ?? ""}
        placeholder={placeholder || `Enter ${label.toLowerCase()}`}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-900 outline-none transition placeholder:text-zinc-400 hover:border-zinc-300 focus:border-zinc-900 focus:ring-4 focus:ring-zinc-200"
      />
    </label>
  );
}

function EmptyState({
  icon: Icon,
  text,
}: {
  icon: ElementType;
  text: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/60 px-6 py-10 text-center">
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
  sectionRef?: Ref<HTMLElement>;
}) {
  return (
    <section
      ref={sectionRef}
      className={`rounded-2xl bg-white p-5 shadow-sm transition-shadow sm:p-7 ${
        editing
          ? "ring-2 ring-zinc-400 shadow-zinc-200"
          : "ring-1 ring-zinc-200/70"
      }`}
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-zinc-900 text-white">
            <Icon size={21} />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-900">
              {title}
            </h2>

            <p className="text-sm text-zinc-500">{description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">{actions}</div>
      </div>

      {children}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

const generateFullName = (
  firstName?: string,
  lastName?: string
): string => {
  return [firstName, lastName]
    .map((name) => name?.trim())
    .filter(Boolean)
    .join(" ");
};

function normalizeProfile(data: ProfileData): ProfileData {
  return {
    ...data,

    dob: data.dob ? data.dob.slice(0, 10) : "",

    personalDetails: {
      firstName: data.personalDetails?.firstName || "",
      lastName: data.personalDetails?.lastName || "",
      fullName:
        data.personalDetails?.fullName ||
        generateFullName(
          data.personalDetails?.firstName,
          data.personalDetails?.lastName
        ),

      father: {
        firstName: data.personalDetails?.father?.firstName || "",
        lastName: data.personalDetails?.father?.lastName || "",
        fullName:
          data.personalDetails?.father?.fullName ||
          generateFullName(
            data.personalDetails?.father?.firstName,
            data.personalDetails?.father?.lastName
          ),
        phone: data.personalDetails?.father?.phone || "",
        alternatePhone:
          data.personalDetails?.father?.alternatePhone || "",
        email: data.personalDetails?.father?.email || "",
        occupation: data.personalDetails?.father?.occupation || "",
      },

      mother: {
        firstName: data.personalDetails?.mother?.firstName || "",
        lastName: data.personalDetails?.mother?.lastName || "",
        fullName:
          data.personalDetails?.mother?.fullName ||
          generateFullName(
            data.personalDetails?.mother?.firstName,
            data.personalDetails?.mother?.lastName
          ),
        phone: data.personalDetails?.mother?.phone || "",
        alternatePhone:
          data.personalDetails?.mother?.alternatePhone || "",
        email: data.personalDetails?.mother?.email || "",
        occupation: data.personalDetails?.mother?.occupation || "",
      },

      personalEmail: data.personalDetails?.personalEmail || "",
      mobile: data.personalDetails?.mobile || "",
      alternateMobile: data.personalDetails?.alternateMobile || "",
      currentAddress: data.personalDetails?.currentAddress || "",
      permanentAddress: data.personalDetails?.permanentAddress || "",
      pinCode: data.personalDetails?.pinCode || "",
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

function getCompletion(p: ProfileData | null) {
  if (!p) return 0;

  const a = p.academicDetails;
  const personal = p.personalDetails;

  const checks: any[] = [
    p.profileImage,

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

    p.dob,
    p.gender,
    p.city,
    p.state,
    p.country,

    a?.tenth?.board,
    a?.tenth?.percentage,
    a?.tenth?.passingYear,
    a?.twelfth?.board,
    a?.twelfth?.percentage,
    a?.twelfth?.passingYear,
    a?.twelfth?.stream,
    a?.graduation?.course,
    a?.graduation?.college,

    p.entranceExams?.length ? "added" : "",
    p.preferredCourses?.length ? "added" : "",
    p.preferredLocations?.length ? "added" : "",
    p.budget?.min,
    p.budget?.max,
  ];

  const filled = checks.filter(
    (v) => v !== undefined && v !== null && v !== ""
  ).length;

  return Math.round((filled / checks.length) * 100);
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

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

  const [uploading, setUploading] = useState<Record<ImageKind, boolean>>({
    profile: false,
    cover: false,
  });

  const [previews, setPreviews] = useState<Record<ImageKind, string>>({
    profile: "",
    cover: "",
  });

  const previewRefs = useRef<Record<ImageKind, string>>({
    profile: "",
    cover: "",
  });

  const profileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const bannerRef = useRef<HTMLDivElement>(null);
  const profileImageRef = useRef<HTMLDivElement>(null);
  const sectionCardRef = useRef<HTMLElement>(null);

  // Fetch Profile
  const fetchProfile = async () => {
    try {
      const response = await api.get(
        "/studentProfile/Get-studentProfile"
      );

      if (response.data.status) {
        const data = normalizeProfile(response.data.data);

        setProfile(data);
        setFormData(data);
        setError("");
      } else {
        setError(
          response.data.message || "Unable to fetch student profile"
        );
      }
    } catch (err: any) {
      console.error("Profile API Error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to fetch student profile"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Student name for hero card
  useEffect(() => {
    try {
      const saved = localStorage.getItem("user");
      if (!saved) return;

      const parsed = JSON.parse(saved);
      const user = parsed.user || parsed;

      const name =
        user.name ||
        user.fullName ||
        user.studentName ||
        [user.firstName, user.lastName].filter(Boolean).join(" ");

      if (name) setUserName(name);
    } catch {
      // Ignore malformed localStorage value
    }
  }, []);

  // GSAP Hero entrance
  useEffect(() => {
    if (loading || error || !bannerRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        bannerRef.current,
        {
          y: 60,
          opacity: 0,
          rotateX: -12,
          transformPerspective: 1000,
        },
        {
          y: 0,
          opacity: 1,
          rotateX: 0,
          duration: 1.2,
          ease: "power4.out",
          clearProps: "transform",
        }
      );
    });

    return () => ctx.revert();
  }, [loading, error]);

  // GSAP profile image tilt
  const handleImageMouseMove = (
    event: ReactMouseEvent<HTMLDivElement>
  ) => {
    const element = profileImageRef.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateY = ((x - centerX) / centerX) * 16;
    const rotateX = ((centerY - y) / centerY) * 16;

    gsap.to(element, {
      rotateX,
      rotateY,
      scale: 1.06,
      duration: 0.35,
      ease: "power2.out",
      transformPerspective: 800,
      transformOrigin: "center center",
      overwrite: "auto",
    });
  };

  const handleImageMouseLeave = () => {
    if (!profileImageRef.current) return;

    gsap.to(profileImageRef.current, {
      rotateX: 0,
      rotateY: 0,
      scale: 1,
      duration: 0.7,
      ease: "elastic.out(1, 0.5)",
      overwrite: "auto",
    });
  };

  // GSAP section reveal
  useEffect(() => {
    if (loading || error || !sectionCardRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        sectionCardRef.current,
        {
          y: 25,
          opacity: 0,
          rotateX: -4,
          transformPerspective: 1000,
        },
        {
          y: 0,
          opacity: 1,
          rotateX: 0,
          duration: 0.65,
          ease: "power3.out",
          clearProps: "transform",
        }
      );
    });

    return () => ctx.revert();
  }, [activeTab, editingSection, loading, error]);

  // Cleanup image preview URLs
  useEffect(() => {
    const refs = previewRefs.current;

    return () => {
      (Object.keys(refs) as ImageKind[]).forEach((kind) => {
        if (refs[kind].startsWith("blob:")) {
          URL.revokeObjectURL(refs[kind]);
        }
      });
    };
  }, []);

  // Update image preview
  const updateImagePreview = (kind: ImageKind, url: string) => {
    if (previewRefs.current[kind].startsWith("blob:")) {
      URL.revokeObjectURL(previewRefs.current[kind]);
    }

    previewRefs.current[kind] = url;
    setPreviews((prev) => ({ ...prev, [kind]: url }));
  };

  // Upload profile / cover image
  const handleImageUpload = async (
    kind: ImageKind,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const config = imageConfig[kind];
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

    const previousPreview = previews[kind];

    updateImagePreview(kind, URL.createObjectURL(file));

    try {
      setUploading((prev) => ({ ...prev, [kind]: true }));

      const imageFormData = new FormData();
      imageFormData.append(config.field, file);

      const response = await api.post(config.endpoint, imageFormData);

      if (response.data.status) {
        const imageUrl = response.data.data?.[config.field];

        if (!imageUrl) {
          throw new Error("Image URL was not returned by the server");
        }

        setProfile((prev) =>
          prev ? { ...prev, [config.field]: imageUrl } : prev
        );

        setFormData((prev) =>
          prev ? { ...prev, [config.field]: imageUrl } : prev
        );

        updateImagePreview(kind, imageUrl);
        toast.success(config.success);
      } else {
        updateImagePreview(kind, previousPreview);
        toast.error(response.data.message || config.fail);
      }
    } catch (err: any) {
      console.error(`${kind} image upload error:`, err);

      updateImagePreview(kind, previousPreview);

      toast.error(
        err.response?.data?.message || err.message || config.fail
      );
    } finally {
      setUploading((prev) => ({ ...prev, [kind]: false }));
      event.target.value = "";
    }
  };

  // Update existing top-level fields
  const updateField = (field: string, value: any) => {
    setFormData((prev) =>
      prev ? { ...prev, [field]: value } : prev
    );
  };

  // Update Student Personal Details
  const updatePersonalDetails = (field: string, value: string) => {
    setFormData((prev) => {
      if (!prev) return prev;

      const personalDetails = {
        ...prev.personalDetails,
        [field]: value,
      };

      personalDetails.fullName = generateFullName(
        personalDetails.firstName,
        personalDetails.lastName
      );

      return {
        ...prev,
        personalDetails,
      };
    });
  };

  // Update Father / Mother Details
  const updateParentDetails = (
    parent: "father" | "mother",
    field: string,
    value: string
  ) => {
    setFormData((prev) => {
      if (!prev) return prev;

      const parentDetails = {
        ...prev.personalDetails?.[parent],
        [field]: value,
      };

      parentDetails.fullName = generateFullName(
        parentDetails.firstName,
        parentDetails.lastName
      );

      return {
        ...prev,
        personalDetails: {
          ...prev.personalDetails,
          [parent]: parentDetails,
        },
      };
    });
  };

  // Update Academic Details
  const updateAcademic = (
    level: AcademicLevel,
    field: AcademicField,
    value: string
  ) => {
    setFormData((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        academicDetails: {
          ...prev.academicDetails,
          [level]: {
            ...prev.academicDetails?.[level],
            [field]: value,
          },
        },
      };
    });
  };

  // Update Entrance Exam
  const updateExam = (
    index: number,
    field: string,
    value: string
  ) => {
    setFormData((prev) => {
      if (!prev) return prev;

      const exams = [...(prev.entranceExams || [])];

      exams[index] = {
        ...exams[index],
        [field]: value,
      };

      return {
        ...prev,
        entranceExams: exams,
      };
    });
  };

  // Add Entrance Exam
  const addExam = () => {
    setFormData((prev) =>
      prev
        ? {
            ...prev,
            entranceExams: [
              ...(prev.entranceExams || []),
              {
                exam: "",
                score: "",
                percentile: "",
                rank: "",
              },
            ],
          }
        : prev
    );
  };

  // Remove Entrance Exam
  const removeExam = (index: number) => {
    setFormData((prev) =>
      prev
        ? {
            ...prev,
            entranceExams: (prev.entranceExams || []).filter(
              (_, i) => i !== index
            ),
          }
        : prev
    );
  };

  // Start Editing
  const startEditing = (index: number) => {
    if (!profile) return;

    setFormData(normalizeProfile(profile));
    setEditingSection(index);
  };

  // Cancel Editing
  const cancelEditing = () => {
    if (profile) {
      setFormData(normalizeProfile(profile));
    }

    setEditingSection(null);
  };

  // Save Profile Section
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

          fullName: generateFullName(
            formData.personalDetails?.firstName,
            formData.personalDetails?.lastName
          ),

          father: {
            ...formData.personalDetails?.father,
            fullName: generateFullName(
              formData.personalDetails?.father?.firstName,
              formData.personalDetails?.father?.lastName
            ),
          },

          mother: {
            ...formData.personalDetails?.mother,
            fullName: generateFullName(
              formData.personalDetails?.mother?.firstName,
              formData.personalDetails?.mother?.lastName
            ),
          },
        },

        academicDetails: formData.academicDetails,
        entranceExams: formData.entranceExams,
        preferredLocations: formData.preferredLocations,

        preferredCourses: formData.preferredCourses?.map(
          (course: any) => course?._id || course
        ),

        budget: {
          min:
            formData.budget?.min === ""
              ? null
              : Number(formData.budget?.min),

          max:
            formData.budget?.max === ""
              ? null
              : Number(formData.budget?.max),
        },
      };

      const response = await api.put(
        "/studentProfile/Edit-studentProfile",
        payload
      );

      if (response.data.status) {
        await fetchProfile();

        setEditingSection(null);

        toast.success("Profile section updated successfully!");
      } else {
        toast.error(
          response.data.message || "Unable to update profile"
        );
      }
    } catch (err: any) {
      console.error("Profile Update Error:", err);

      toast.error(
        err.response?.data?.message || "Unable to update profile"
      );
    } finally {
      setSaving(false);
    }
  };

  // Update Preferred Locations
  const updateLocations = (value: string) => {
    updateField(
      "preferredLocations",
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    );
  };

  // Update Preferred Courses
  const updateCourses = (value: string) => {
    updateField(
      "preferredCourses",
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    );
  };

  const current = formData;

  /* ---------------------------------------------------------------- */
  /* Personal Details                                                   */
  /* ---------------------------------------------------------------- */

  const renderPersonal = () => {
    const editing = editingSection === 0;
    const personal = editing
      ? current?.personalDetails
      : profile?.personalDetails;

    const father = personal?.father;
    const mother = personal?.mother;

    return (
      <div className="space-y-6">
        {/* Student Information */}
        <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4 sm:p-5">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-zinc-900">
              Student Information
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              Enter your name as per your official documents.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {editing ? (
              <>
                <Field
                  label="First Name"
                  value={personal?.firstName}
                  onChange={(v) =>
                    updatePersonalDetails("firstName", v)
                  }
                />

                <Field
                  label="Last Name"
                  value={personal?.lastName}
                  onChange={(v) =>
                    updatePersonalDetails("lastName", v)
                  }
                />

                <Detail
                  label="Full Name (Auto-generated)"
                  value={current?.personalDetails?.fullName}
                  className="bg-white ring-zinc-200/70"
                />
              </>
            ) : (
              <>
                <Detail label="First Name" value={personal?.firstName} />
                <Detail label="Last Name" value={personal?.lastName} />
                <Detail
                  label="Full Name"
                  value={
                    personal?.fullName ||
                    generateFullName(
                      personal?.firstName,
                      personal?.lastName
                    )
                  }
                />
              </>
            )}
          </div>
        </div>

        {/* Father Information */}
        <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4 sm:p-5">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-zinc-900">
              Father Information
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              Enter your father's personal and contact details.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {editing ? (
              <>
                <Field
                  label="Father First Name"
                  value={father?.firstName}
                  onChange={(v) =>
                    updateParentDetails("father", "firstName", v)
                  }
                />

                <Field
                  label="Father Last Name"
                  value={father?.lastName}
                  onChange={(v) =>
                    updateParentDetails("father", "lastName", v)
                  }
                />

                <Detail
                  label="Father Full Name (Auto-generated)"
                  value={father?.fullName}
                  className="bg-white ring-zinc-200/70"
                />

                <Field
                  label="Father Phone"
                  value={father?.phone}
                  onChange={(v) =>
                    updateParentDetails("father", "phone", v)
                  }
                />

                <Field
                  label="Father Alternate Phone"
                  value={father?.alternatePhone}
                  onChange={(v) =>
                    updateParentDetails("father", "alternatePhone", v)
                  }
                />

                <Field
                  label="Father Email"
                  type="email"
                  value={father?.email}
                  onChange={(v) =>
                    updateParentDetails("father", "email", v)
                  }
                />

                <Field
                  label="Father Occupation"
                  value={father?.occupation}
                  onChange={(v) =>
                    updateParentDetails("father", "occupation", v)
                  }
                />
              </>
            ) : (
              <>
                <Detail label="Father First Name" value={father?.firstName} />
                <Detail label="Father Last Name" value={father?.lastName} />
                <Detail
                  label="Father Full Name"
                  value={father?.fullName}
                />
                <Detail label="Father Phone" value={father?.phone} />
                <Detail
                  label="Father Alternate Phone"
                  value={father?.alternatePhone}
                />
                <Detail label="Father Email" value={father?.email} />
                <Detail
                  label="Father Occupation"
                  value={father?.occupation}
                />
              </>
            )}
          </div>
        </div>

        {/* Mother Information */}
        <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4 sm:p-5">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-zinc-900">
              Mother Information
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              Enter your mother's personal and contact details.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {editing ? (
              <>
                <Field
                  label="Mother First Name"
                  value={mother?.firstName}
                  onChange={(v) =>
                    updateParentDetails("mother", "firstName", v)
                  }
                />

                <Field
                  label="Mother Last Name"
                  value={mother?.lastName}
                  onChange={(v) =>
                    updateParentDetails("mother", "lastName", v)
                  }
                />

                <Detail
                  label="Mother Full Name (Auto-generated)"
                  value={mother?.fullName}
                  className="bg-white ring-zinc-200/70"
                />

                <Field
                  label="Mother Phone"
                  value={mother?.phone}
                  onChange={(v) =>
                    updateParentDetails("mother", "phone", v)
                  }
                />

                <Field
                  label="Mother Alternate Phone"
                  value={mother?.alternatePhone}
                  onChange={(v) =>
                    updateParentDetails("mother", "alternatePhone", v)
                  }
                />

                <Field
                  label="Mother Email"
                  type="email"
                  value={mother?.email}
                  onChange={(v) =>
                    updateParentDetails("mother", "email", v)
                  }
                />

                <Field
                  label="Mother Occupation"
                  value={mother?.occupation}
                  onChange={(v) =>
                    updateParentDetails("mother", "occupation", v)
                  }
                />
              </>
            ) : (
              <>
                <Detail label="Mother First Name" value={mother?.firstName} />
                <Detail label="Mother Last Name" value={mother?.lastName} />
                <Detail
                  label="Mother Full Name"
                  value={mother?.fullName}
                />
                <Detail label="Mother Phone" value={mother?.phone} />
                <Detail
                  label="Mother Alternate Phone"
                  value={mother?.alternatePhone}
                />
                <Detail label="Mother Email" value={mother?.email} />
                <Detail
                  label="Mother Occupation"
                  value={mother?.occupation}
                />
              </>
            )}
          </div>
        </div>

        {/* Contact Details */}
        <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4 sm:p-5">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-zinc-900">
              Contact Details
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              Your personal contact information.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {editing ? (
              <>
                <Field
                  label="Personal Email"
                  type="email"
                  value={personal?.personalEmail}
                  onChange={(v) =>
                    updatePersonalDetails("personalEmail", v)
                  }
                />

                <Field
                  label="Mobile Number"
                  value={personal?.mobile}
                  onChange={(v) =>
                    updatePersonalDetails("mobile", v)
                  }
                />

                <Field
                  label="Alternate Mobile Number"
                  value={personal?.alternateMobile}
                  onChange={(v) =>
                    updatePersonalDetails("alternateMobile", v)
                  }
                />
              </>
            ) : (
              <>
                <Detail
                  label="Personal Email"
                  value={personal?.personalEmail}
                />
                <Detail
                  label="Mobile Number"
                  value={personal?.mobile}
                />
                <Detail
                  label="Alternate Mobile Number"
                  value={personal?.alternateMobile}
                />
              </>
            )}
          </div>
        </div>

        {/* Address Details */}
        <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4 sm:p-5">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-zinc-900">
              Address Details
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              Enter your current and permanent residential address.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {editing ? (
              <>
                <Field
                  label="Current Address"
                  value={personal?.currentAddress}
                  onChange={(v) =>
                    updatePersonalDetails("currentAddress", v)
                  }
                />

                <Field
                  label="Permanent Address"
                  value={personal?.permanentAddress}
                  onChange={(v) =>
                    updatePersonalDetails("permanentAddress", v)
                  }
                />

                <Field
                  label="PIN Code"
                  value={personal?.pinCode}
                  onChange={(v) =>
                    updatePersonalDetails("pinCode", v)
                  }
                />
              </>
            ) : (
              <>
                <Detail
                  label="Current Address"
                  value={personal?.currentAddress}
                />
                <Detail
                  label="Permanent Address"
                  value={personal?.permanentAddress}
                />
                <Detail label="PIN Code" value={personal?.pinCode} />
              </>
            )}
          </div>
        </div>

        {/* Other Personal Details */}
        <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4 sm:p-5">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-zinc-900">
              Other Personal Details
            </h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {editing ? (
              <>
                <Field
                  label="Date of Birth"
                  type="date"
                  value={current?.dob}
                  onChange={(v) => updateField("dob", v)}
                />

                <Field
                  label="Gender"
                  value={current?.gender}
                  onChange={(v) => updateField("gender", v)}
                />

                <Field
                  label="City"
                  value={current?.city}
                  onChange={(v) => updateField("city", v)}
                />

                <Field
                  label="State"
                  value={current?.state}
                  onChange={(v) => updateField("state", v)}
                />

                <Field
                  label="Country"
                  value={current?.country}
                  onChange={(v) => updateField("country", v)}
                />
              </>
            ) : (
              <>
                <Detail
                  label="Date of Birth"
                  value={
                    profile?.dob
                      ? new Date(profile.dob).toLocaleDateString("en-IN")
                      : ""
                  }
                />

                <Detail label="Gender" value={profile?.gender} />
                <Detail label="City" value={profile?.city} />
                <Detail label="State" value={profile?.state} />
                <Detail label="Country" value={profile?.country} />
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  /* ---------------------------------------------------------------- */
  /* Academic Details                                                   */
  /* ---------------------------------------------------------------- */

  const renderAcademic = () => {
    const levels: {
      key: AcademicLevel;
      title: string;
      fields: AcademicField[];
    }[] = [
      {
        key: "tenth",
        title: "Class 10th",
        fields: ["board", "percentage", "passingYear"],
      },
      {
        key: "twelfth",
        title: "Class 12th",
        fields: ["board", "percentage", "passingYear", "stream"],
      },
      {
        key: "graduation",
        title: "Graduation",
        fields: ["course", "college", "percentage", "passingYear"],
      },
    ];

    return (
      <div className="grid gap-5 md:grid-cols-2">
        {levels.map((level) => {
          const academicRecord = current?.academicDetails?.[level.key] as
            | Record<string, string | number | undefined>
            | undefined;

          const profileRecord = profile?.academicDetails?.[level.key] as
            | Record<string, string | number | undefined>
            | undefined;

          return (
            <div
              key={level.key}
              className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4 sm:p-5"
            >
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-900">
                <span className="h-4 w-1 rounded-full bg-zinc-900" />
                {level.title}
              </h3>

              <div className="grid gap-3 sm:grid-cols-2">
                {level.fields.map((field) => {
                  const label =
                    field === "passingYear"
                      ? "Passing Year"
                      : field.charAt(0).toUpperCase() + field.slice(1);

                  const value = academicRecord?.[field];

                  return editingSection === 1 ? (
                    <Field
                      key={field}
                      label={label}
                      value={value}
                      onChange={(v) =>
                        updateAcademic(level.key, field, v)
                      }
                    />
                  ) : (
                    <Detail
                      key={field}
                      label={label}
                      value={profileRecord?.[field]}
                      className="bg-white ring-zinc-200/70"
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  /* ---------------------------------------------------------------- */
  /* Entrance Exams                                                     */
  /* ---------------------------------------------------------------- */

  const renderExams = () => {
    const exams =
      editingSection === 2
        ? current?.entranceExams
        : profile?.entranceExams;

    return (
      <div className="space-y-4">
        {exams?.length ? (
          exams.map((exam: any, index: number) => (
            <div
              key={exam._id || index}
              className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4 sm:p-5"
            >
              {editingSection === 2 ? (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                      <span className="h-4 w-1 rounded-full bg-zinc-900" />
                      Exam {index + 1}
                    </h3>

                    <button
                      type="button"
                      onClick={() => removeExam(index)}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                    >
                      <Trash2 size={15} />
                      Remove
                    </button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Field
                      label="Exam Name / Exam ID"
                      value={exam.exam?.name || exam.exam}
                      onChange={(v) => updateExam(index, "exam", v)}
                    />

                    <Field
                      label="Score"
                      value={exam.score}
                      onChange={(v) => updateExam(index, "score", v)}
                    />

                    <Field
                      label="Percentile"
                      value={exam.percentile}
                      onChange={(v) =>
                        updateExam(index, "percentile", v)
                      }
                    />

                    <Field
                      label="Rank"
                      value={exam.rank}
                      onChange={(v) => updateExam(index, "rank", v)}
                    />
                  </div>
                </>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Detail
                    label="Exam Name"
                    value={exam.exam?.name || exam.exam?.fullName}
                    className="bg-white ring-zinc-200/70"
                  />

                  <Detail
                    label="Score"
                    value={exam.score}
                    className="bg-white ring-zinc-200/70"
                  />

                  <Detail
                    label="Percentile"
                    value={exam.percentile}
                    className="bg-white ring-zinc-200/70"
                  />

                  <Detail
                    label="Rank"
                    value={exam.rank}
                    className="bg-white ring-zinc-200/70"
                  />
                </div>
              )}
            </div>
          ))
        ) : (
          <EmptyState
            icon={ClipboardList}
            text="No entrance exam details added yet. Click Edit to add your exams."
          />
        )}

        {editingSection === 2 && (
          <button
            type="button"
            onClick={addExam}
            className="inline-flex items-center gap-2 rounded-xl border border-dashed border-zinc-400 bg-zinc-50 px-4 py-2.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100"
          >
            <Plus size={16} />
            Add Exam
          </button>
        )}
      </div>
    );
  };

  /* ---------------------------------------------------------------- */
  /* Preferred Courses                                                  */
  /* ---------------------------------------------------------------- */

  const renderCourses = () =>
    editingSection === 3 ? (
      <div className="max-w-2xl">
        <Field
          label="Preferred Courses"
          value={(current?.preferredCourses || [])
            .map((c: any) => c?.name || c)
            .join(", ")}
          onChange={updateCourses}
          placeholder="Enter courses separated by commas"
        />

        <p className="mt-2 text-xs text-zinc-500">
          Separate course names with commas.
        </p>
      </div>
    ) : profile?.preferredCourses?.length ? (
      <div className="flex flex-wrap gap-2.5">
        {profile.preferredCourses.map((course: any, index: number) => (
          <span
            key={course?._id || index}
            className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
          >
            <BookOpen size={14} />
            {course?.name || course}
          </span>
        ))}
      </div>
    ) : (
      <EmptyState
        icon={BookOpen}
        text="No preferred courses added yet. Click Edit to add the courses you like."
      />
    );

  /* ---------------------------------------------------------------- */
  /* Preferred Locations                                                */
  /* ---------------------------------------------------------------- */

  const renderLocations = () =>
    editingSection === 4 ? (
      <div className="max-w-2xl">
        <Field
          label="Preferred Locations"
          value={(current?.preferredLocations || []).join(", ")}
          onChange={updateLocations}
          placeholder="Jaipur, Delhi, Mumbai"
        />

        <p className="mt-2 text-xs text-zinc-500">
          Separate locations with commas.
        </p>
      </div>
    ) : profile?.preferredLocations?.length ? (
      <div className="flex flex-wrap gap-2.5">
        {profile.preferredLocations.map((location: string) => (
          <span
            key={location}
            className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-800 ring-1 ring-zinc-200"
          >
            <MapPin size={14} />
            {location}
          </span>
        ))}
      </div>
    ) : (
      <EmptyState
        icon={MapPin}
        text="No locations added yet. Click Edit to add the places you prefer."
      />
    );

  /* ---------------------------------------------------------------- */
  /* Budget Details                                                     */
  /* ---------------------------------------------------------------- */

  const renderBudget = () => (
    <div className="grid gap-4 sm:grid-cols-2">
      {editingSection === 5 ? (
        <>
          <Field
            label="Minimum Budget"
            type="number"
            value={current?.budget?.min}
            onChange={(v) =>
              setFormData((prev) =>
                prev
                  ? {
                      ...prev,
                      budget: {
                        ...prev.budget,
                        min: v,
                      },
                    }
                  : prev
              )
            }
          />

          <Field
            label="Maximum Budget"
            type="number"
            value={current?.budget?.max}
            onChange={(v) =>
              setFormData((prev) =>
                prev
                  ? {
                      ...prev,
                      budget: {
                        ...prev.budget,
                        max: v,
                      },
                    }
                  : prev
              )
            }
          />
        </>
      ) : (
        <>
          <Detail
            label="Minimum Budget"
            value={
              profile?.budget?.min != null && profile.budget.min !== ""
                ? `₹${Number(profile.budget.min).toLocaleString("en-IN")}`
                : ""
            }
          />

          <Detail
            label="Maximum Budget"
            value={
              profile?.budget?.max != null && profile.budget.max !== ""
                ? `₹${Number(profile.budget.max).toLocaleString("en-IN")}`
                : ""
            }
          />
        </>
      )}
    </div>
  );

  /* ---------------------------------------------------------------- */
  /* Render Active Tab                                                  */
  /* ---------------------------------------------------------------- */

  const renderContent = () => {
    switch (activeTab) {
      case 0:
        return renderPersonal();

      case 1:
        return renderAcademic();

      case 2:
        return renderExams();

      case 3:
        return renderCourses();

      case 4:
        return renderLocations();

      case 5:
        return renderBudget();

      default:
        return null;
    }
  };

  const ActiveIcon = tabs[activeTab].icon;

  const displayedImage = previews.profile || profile?.profileImage || "";
  const displayedCover = previews.cover || profile?.coverImage || "";

  const completion = getCompletion(profile);

  const locationText = [profile?.city, profile?.state]
    .filter(Boolean)
    .join(", ");

  /* ---------------------------------------------------------------- */
  /* Main UI                                                            */
  /* ---------------------------------------------------------------- */

  return (
   <div className="flex h-screen flex-col overflow-hidden bg-white text-zinc-900">
      <ProfileHeader />

      <div className="flex min-h-0 flex-1">
        {/* Desktop sidebar */}
        <div className="hidden md:flex">
          <ProfileSidebar />
        </div>

        {/* Mobile sidebar */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />

            <div className="relative h-full w-64 shadow-2xl">
              <ProfileSidebar />

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
                className="absolute -right-12 top-4 grid h-9 w-9 place-items-center rounded-full bg-white text-zinc-700 shadow-lg"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}

        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
            {/* Page heading */}
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                  My Profile
                </h1>

                <p className="mt-1 text-sm text-zinc-500">
                  Manage your personal and academic information.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white shadow-sm md:hidden"
              >
                <Menu size={17} />
                Menu
              </button>
            </div>

            {loading ? (
              <div className="animate-pulse space-y-5">
                <div className="h-72 rounded-2xl bg-zinc-200/70" />
                <div className="h-14 rounded-2xl bg-zinc-200/70" />
                <div className="h-64 rounded-2xl bg-zinc-200/70" />
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-rose-100 bg-rose-50 p-6 text-sm font-medium text-rose-700">
                {error}
              </div>
            ) : (
              <>
                {/* Hero */}
                <div
                  ref={bannerRef}
                  className="relative mb-6 overflow-hidden rounded-2xl bg-zinc-950 shadow-lg ring-1 ring-zinc-800"
                >
                  {displayedCover ? (
                    <img
                      src={displayedCover}
                      alt="Profile cover"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <>
                      <div
                        className="absolute inset-0"
                        style={{
                          backgroundColor: "#09090b",
                          backgroundImage:
                            "radial-gradient(circle at 15% 20%, rgba(161,161,170,0.28), transparent 45%), radial-gradient(circle at 85% 80%, rgba(113,113,122,0.30), transparent 50%), linear-gradient(135deg, #18181b 0%, #27272a 55%, #09090b 100%)",
                        }}
                      />

                      <div
                        className="absolute inset-0"
                        style={{
                          backgroundImage:
                            "linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)",
                          backgroundSize: "32px 32px",
                        }}
                      />
                    </>
                  )}

                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage:
                        "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.30) 100%)",
                    }}
                  />

                  {/* Change cover */}
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={uploading.cover}
                    aria-label="Change cover image"
                    className="absolute right-3 top-3 z-20 inline-flex items-center gap-2 rounded-xl bg-black/40 px-3.5 py-2 text-xs font-semibold text-white ring-1 ring-white/25 backdrop-blur transition hover:bg-black/60 disabled:cursor-not-allowed disabled:opacity-60 sm:right-4 sm:top-4"
                  >
                    {uploading.cover ? (
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <ImagePlus size={15} />
                    )}

                    <span className="hidden sm:inline">
                      {displayedCover ? "Change cover" : "Add cover image"}
                    </span>
                  </button>

                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => handleImageUpload("cover", e)}
                  />

                  {/* Hero content */}
                  <div className="relative z-10 flex min-h-[300px] flex-col justify-end gap-5 p-5 pt-24 sm:flex-row sm:items-end sm:p-7">
                    {/* Profile image */}
                    <div
                      ref={profileImageRef}
                      onMouseMove={handleImageMouseMove}
                      onMouseLeave={handleImageMouseLeave}
                      className="relative h-24 w-24 shrink-0 cursor-pointer sm:h-28 sm:w-28"
                      style={{ willChange: "transform" }}
                    >
                      <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-zinc-400 shadow-xl shadow-black/40 ring-4 ring-white/90">
                        {displayedImage ? (
                          <img
                            src={displayedImage}
                            alt="Student Profile"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <UserRound size={44} />
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => profileInputRef.current?.click()}
                        disabled={uploading.profile}
                        title="Change Profile Picture"
                        aria-label="Change profile picture"
                        className="absolute bottom-0.5 right-0.5 grid h-8 w-8 place-items-center rounded-full bg-white text-zinc-900 shadow-md ring-2 ring-zinc-900 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {uploading.profile ? (
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent" />
                        ) : (
                          <Camera size={15} />
                        )}
                      </button>

                      <input
                        ref={profileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => handleImageUpload("profile", e)}
                      />
                    </div>

                    {/* Name and meta */}
                    <div className="min-w-0 flex-1 sm:pb-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                        Student Profile
                      </p>

                      <h2 className="mt-1 truncate text-2xl font-bold tracking-tight text-white sm:text-3xl">
                        {profile?.personalDetails?.fullName ||
                          userName ||
                          "Welcome, Student"}
                      </h2>

                      <div className="mt-3 flex flex-wrap items-center gap-2.5">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-zinc-100 ring-1 ring-white/20">
                          <GraduationCap size={13} />
                          Student
                        </span>

                        {locationText && (
                          <span className="inline-flex items-center gap-1.5 text-sm text-zinc-300">
                            <MapPin size={14} />
                            {locationText}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Completion */}
                    <div className="w-full rounded-xl bg-black/40 p-3.5 ring-1 ring-white/15 backdrop-blur sm:w-60">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="uppercase tracking-wider text-zinc-400">
                          Profile strength
                        </span>

                        <span className="text-white">{completion}%</span>
                      </div>

                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/20">
                        <div
                          className="h-full rounded-full bg-white transition-all duration-700"
                          style={{ width: `${completion}%` }}
                        />
                      </div>

                      <p className="mt-2 text-xs text-zinc-300">
                        {completion === 100
                          ? "Your profile is complete."
                          : "Complete your profile to get better counselling."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="mb-5 flex gap-1.5 overflow-x-auto rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-zinc-200/70 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {tabs.map((tab, index) => {
                    const Icon = tab.icon;

                    return (
                      <button
                        key={tab.label}
                        type="button"
                        onClick={() => {
                          if (editingSection !== null) {
                            toast.error(
                              "Please save or cancel your current changes first."
                            );
                            return;
                          }

                          setActiveTab(index);
                        }}
                        className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                          activeTab === index
                            ? "bg-zinc-900 text-white shadow-md shadow-zinc-900/20"
                            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                        }`}
                      >
                        <Icon size={17} />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* Section card */}
                <SectionCard
                  sectionRef={sectionCardRef}
                  title={tabs[activeTab].label}
                  description={tabs[activeTab].desc}
                  icon={ActiveIcon}
                  editing={editingSection === activeTab}
                  actions={
                    editingSection === activeTab ? (
                      <>
                        <button
                          type="button"
                          onClick={cancelEditing}
                          disabled={saving}
                          aria-label="Cancel editing"
                          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-50"
                        >
                          <X size={16} />
                          <span className="hidden sm:inline">Cancel</span>
                        </button>

                        <button
                          type="button"
                          onClick={saveSection}
                          disabled={saving}
                          aria-label="Save changes"
                          className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-zinc-900/20 transition hover:bg-black disabled:opacity-60"
                        >
                          {saving ? (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          ) : (
                            <Save size={16} />
                          )}

                          {saving ? "Saving..." : "Save"}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEditing(activeTab)}
                        aria-label="Edit section"
                        className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100"
                      >
                        <Pencil size={16} />
                        Edit
                      </button>
                    )
                  }
                >
                  {renderContent()}

                  {/* Bottom navigation */}
                  <div className="mt-8 flex items-center justify-between border-t border-zinc-100 pt-5">
                    <p className="text-xs text-zinc-400">
                      Step {activeTab + 1} of {tabs.length}
                    </p>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveTab((prev) => Math.max(0, prev - 1))
                        }
                        disabled={
                          activeTab === 0 || editingSection !== null
                        }
                        className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ChevronLeft size={16} />
                        Previous
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setActiveTab((prev) =>
                            Math.min(tabs.length - 1, prev + 1)
                          )
                        }
                        disabled={
                          activeTab === tabs.length - 1 ||
                          editingSection !== null
                        }
                        className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Next
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </SectionCard>

                <p className="mt-6 text-center text-xs text-zinc-400">
                  Medical Counselling Platform · Student Profile
                </p>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}