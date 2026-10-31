
"use client";

import { useEffect, useRef, useState } from "react";
import type {
  ReactNode,
  ElementType,
  ChangeEvent,
  Ref,
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

type ProfileData = {
  profileImage?: string;
  dob?: string;
  gender?: string;
  city?: string;
  state?: string;
  country?: string;

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
  { label: "Personal Details", icon: User },
  { label: "Academic Details", icon: GraduationCap },
  { label: "Entrance Exams", icon: ClipboardList },
  { label: "Preferred Courses", icon: BookOpen },
  { label: "Preferred Locations", icon: MapPin },
  { label: "Budget Details", icon: Wallet },
];

function Detail({
  label,
  value,
}: {
  label: string;
  value?: any;
}) {
  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>

      <p className="mt-1 break-words font-medium text-gray-800">
        {value !== undefined && value !== null && value !== ""
          ? value
          : "Not added"}
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
      <span className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </span>

      <input
        type={type}
        value={value ?? ""}
        placeholder={placeholder || `Enter ${label.toLowerCase()}`}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
}

function SectionCard({
  title,
  icon: Icon,
  children,
  actions,
  sectionRef,
}: {
  title: string;
  icon: ElementType;
  children: ReactNode;
  actions: ReactNode;
  sectionRef?: Ref<HTMLElement>;
}) {
  return (
    <section
      ref={sectionRef}
      className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="mb-5 flex items-center justify-between border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
            <Icon size={20} />
          </div>

          <h2 className="text-lg font-semibold text-gray-900">
            {title}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {actions}
        </div>
      </div>

      {children}
    </section>
  );
}

function normalizeProfile(data: ProfileData): ProfileData {
  return {
    ...data,

    dob: data.dob ? data.dob.slice(0, 10) : "",

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

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [formData, setFormData] = useState<ProfileData | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState(0);
  const [editingSection, setEditingSection] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef("");

  // GSAP refs
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

  // GSAP: Profile banner entrance
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

  // GSAP: 3D profile image tilt
  const handleImageMouseMove = (
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    const element = profileImageRef.current;

    if (!element) return;

    const rect = element.getBoundingClientRect();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateY = ((x - centerX) / centerX) * 18;
    const rotateX = ((centerY - y) / centerY) * 18;

    gsap.to(element, {
      rotateX,
      rotateY,
      scale: 1.08,
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

  // GSAP: Section card reveal on tab/edit change
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

  // Cleanup image preview URL
  useEffect(() => {
    return () => {
      if (previewRef.current.startsWith("blob:")) {
        URL.revokeObjectURL(previewRef.current);
      }
    };
  }, []);

  // Update image preview safely
  const updateImagePreview = (url: string) => {
    if (previewRef.current.startsWith("blob:")) {
      URL.revokeObjectURL(previewRef.current);
    }

    previewRef.current = url;
    setImagePreview(url);
  };

  // Upload Profile Image
  const handleProfileImageUpload = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPG, PNG and WEBP images are allowed");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      event.target.value = "";
      return;
    }

    const previousPreview = imagePreview;
    const previewUrl = URL.createObjectURL(file);

    updateImagePreview(previewUrl);

    try {
      setUploadingImage(true);

      const imageFormData = new FormData();
      imageFormData.append("profileImage", file);

      const response = await api.post(
        "/studentProfile/Upload-profileImage",
        imageFormData
      );

      if (response.data.status) {
        const imageUrl = response.data.data.profileImage;

        if (!imageUrl) {
          throw new Error("Image URL was not returned by the server");
        }

        setProfile((prev) =>
          prev
            ? {
                ...prev,
                profileImage: imageUrl,
              }
            : prev
        );

        setFormData((prev) =>
          prev
            ? {
                ...prev,
                profileImage: imageUrl,
              }
            : prev
        );

        updateImagePreview(imageUrl);

        toast.success("Profile image updated successfully!");
      } else {
        updateImagePreview(previousPreview);
        toast.error(
          response.data.message || "Image upload failed"
        );
      }
    } catch (err: any) {
      console.error("Profile Image Upload Error:", err);

      updateImagePreview(previousPreview);

      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Unable to upload profile image"
      );
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  };

  // Update Personal Details
  const updateField = (field: string, value: any) => {
    setFormData((prev) =>
      prev ? { ...prev, [field]: value } : prev
    );
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
        err.response?.data?.message ||
          "Unable to update profile"
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

  // Personal Details
  const renderPersonal = () => (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {editingSection === 0 ? (
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
  );

  // Academic Details
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
              className="rounded-lg border border-gray-100 bg-gray-50 p-4"
            >
              <h3 className="mb-4 font-semibold text-gray-800">
                {level.title}
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
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

  // Entrance Exams
  const renderExams = () => (
    <div className="space-y-4">
      {(
        editingSection === 2
          ? current?.entranceExams
          : profile?.entranceExams
      )?.length ? (
        (
          editingSection === 2
            ? current?.entranceExams
            : profile?.entranceExams
        )?.map((exam: any, index: number) => (
          <div
            key={exam._id || index}
            className="rounded-lg border border-gray-200 p-4"
          >
            {editingSection === 2 ? (
              <>
                <div className="mb-4 flex justify-between">
                  <h3 className="font-semibold text-gray-800">
                    Exam {index + 1}
                  </h3>

                  <button
                    onClick={() => removeExam(index)}
                    className="text-sm text-red-600"
                  >
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
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Detail
                  label="Exam Name"
                  value={
                    exam.exam?.name ||
                    exam.exam?.fullName ||
                    "Not added"
                  }
                />

                <Detail label="Score" value={exam.score} />

                <Detail
                  label="Percentile"
                  value={exam.percentile}
                />

                <Detail label="Rank" value={exam.rank} />
              </div>
            )}
          </div>
        ))
      ) : (
        <p className="text-sm text-gray-500">
          No entrance exam details added yet.
        </p>
      )}

      {editingSection === 2 && (
        <button
          onClick={addExam}
          className="rounded-lg border border-blue-200 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
        >
          + Add Exam
        </button>
      )}
    </div>
  );

  // Preferred Courses
  const renderCourses = () =>
    editingSection === 3 ? (
      <div>
        <Field
          label="Preferred Courses"
          value={(current?.preferredCourses || [])
            .map((c: any) => c?.name || c)
            .join(", ")}
          onChange={updateCourses}
          placeholder="Enter courses separated by commas"
        />

        <p className="mt-2 text-xs text-gray-500">
          Separate course names with commas.
        </p>
      </div>
    ) : (
      <div className="flex flex-wrap gap-3">
        {profile?.preferredCourses?.length ? (
          profile.preferredCourses.map(
            (course: any, index: number) => (
              <span
                key={course?._id || index}
                className="rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700"
              >
                {course?.name || course}
              </span>
            )
          )
        ) : (
          <p className="text-sm text-gray-500">
            No preferred courses added yet.
          </p>
        )}
      </div>
    );

  // Preferred Locations
  const renderLocations = () =>
    editingSection === 4 ? (
      <div>
        <Field
          label="Preferred Locations"
          value={(current?.preferredLocations || []).join(", ")}
          onChange={updateLocations}
          placeholder="Jaipur, Delhi, Mumbai"
        />

        <p className="mt-2 text-xs text-gray-500">
          Separate locations with commas.
        </p>
      </div>
    ) : (
      <div className="flex flex-wrap gap-3">
        {profile?.preferredLocations?.length ? (
          profile.preferredLocations.map(
            (location: string) => (
              <span
                key={location}
                className="rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700"
              >
                {location}
              </span>
            )
          )
        ) : (
          <p className="text-sm text-gray-500">
            No locations added yet.
          </p>
        )}
      </div>
    );

  // Budget Details
  const renderBudget = () => (
    <div className="grid gap-5 sm:grid-cols-2">
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
              profile?.budget?.min != null
                ? `₹${Number(
                    profile.budget.min
                  ).toLocaleString("en-IN")}`
                : ""
            }
          />

          <Detail
            label="Maximum Budget"
            value={
              profile?.budget?.max != null
                ? `₹${Number(
                    profile.budget.max
                  ).toLocaleString("en-IN")}`
                : ""
            }
          />
        </>
      )}
    </div>
  );

  // Render Active Tab Content
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

  const displayedImage =
    imagePreview || profile?.profileImage || "";

  return (
    <div className="min-h-screen bg-gray-50">
      <ProfileHeader />

      {loading ? (
        <p className="p-6 text-gray-600">
          Loading profile...
        </p>
      ) : error ? (
        <p className="p-6 text-red-600">{error}</p>
      ) : (
        <div className="flex min-h-[calc(100vh-64px)]">
          {/* Sidebar */}
          <div className="hidden md:block">
            <ProfileSidebar />
          </div>

          <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
            {/* Page Heading */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                My Profile
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Manage your personal and academic information.
              </p>
            </div>

            {/* Profile Banner */}
            <div
              ref={bannerRef}
              className="mb-6 rounded-xl bg-gradient-to-r from-blue-700 to-blue-500 p-6 text-white shadow-sm"
              style={{ transformStyle: "preserve-3d" }}
            >
              <div className="flex items-center gap-5">
                {/* Profile Image */}
                <div
                  ref={profileImageRef}
                  onMouseMove={handleImageMouseMove}
                  onMouseLeave={handleImageMouseLeave}
                  className="relative h-20 w-20 shrink-0 cursor-pointer"
                  style={{
                    transformStyle: "preserve-3d",
                    willChange: "transform",
                  }}
                >
                  <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-white/50 bg-white/20">
                    {displayedImage ? (
                      <img
                        src={displayedImage}
                        alt="Student Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserRound size={42} />
                    )}
                  </div>

                  {/* Camera Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    title="Change Profile Picture"
                    aria-label="Change profile picture"
                    className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white shadow-md transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {uploadingImage ? (
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <Camera size={14} />
                    )}
                  </button>

                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleProfileImageUpload}
                  />
                </div>

                {/* Profile Information */}
                <div>
                  <h2 className="text-xl font-bold">
                    Student Profile
                  </h2>

                  <p className="mt-1 text-sm text-blue-100">
                    Welcome to your student dashboard
                  </p>

                  <span className="mt-3 inline-block rounded-full bg-white/20 px-3 py-1 text-xs">
                    Profile Information
                  </span>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="mb-5 flex gap-2 overflow-x-auto rounded-xl border border-gray-200 bg-white p-2">
              {tabs.map((tab, index) => {
                const Icon = tab.icon;

                return (
                  <button
                    key={tab.label}
                    onClick={() => {
                      if (editingSection !== null) {
                        toast.error(
                          "Please save or cancel your current changes first."
                        );
                        return;
                      }

                      setActiveTab(index);
                    }}
                    className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition ${
                      activeTab === index
                        ? "bg-blue-600 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Icon size={17} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Section Card */}
            <SectionCard
              sectionRef={sectionCardRef}
              title={tabs[activeTab].label}
              icon={ActiveIcon}
              actions={
                editingSection === activeTab ? (
                  <>
                    <button
                      onClick={cancelEditing}
                      disabled={saving}
                      title="Cancel"
                      aria-label="Cancel editing"
                      className="rounded-lg border border-gray-300 p-2 text-gray-600 transition hover:bg-gray-100 disabled:opacity-50"
                    >
                      <X size={18} />
                    </button>

                    <button
                      onClick={saveSection}
                      disabled={saving}
                      title="Save Changes"
                      aria-label="Save changes"
                      className="rounded-lg bg-blue-600 p-2 text-white transition hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Save size={18} />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => startEditing(activeTab)}
                    title="Edit"
                    aria-label="Edit section"
                    className="rounded-lg border border-blue-200 p-2 text-blue-600 transition hover:bg-blue-50"
                  >
                    <Pencil size={18} />
                  </button>
                )
              }
            >
              {/* Section Content */}
              {renderContent()}

              {/* Bottom Navigation */}
              <div className="mt-7 flex justify-end gap-2 border-t border-gray-100 pt-5">
                <button
                  onClick={() =>
                    setActiveTab((prev) =>
                      Math.max(0, prev - 1)
                    )
                  }
                  disabled={
                    activeTab === 0 ||
                    editingSection !== null
                  }
                  className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                <button
                  onClick={() =>
                    setActiveTab((prev) =>
                      Math.min(tabs.length - 1, prev + 1)
                    )
                  }
                  disabled={
                    activeTab === tabs.length - 1 ||
                    editingSection !== null
                  }
                  className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </SectionCard>

            {/* Footer Text */}
            <p className="mt-6 text-center text-xs text-gray-400">
              Medical Counselling Platform · Student Profile
            </p>
          </main>
        </div>
      )}
    </div>
  );
}
