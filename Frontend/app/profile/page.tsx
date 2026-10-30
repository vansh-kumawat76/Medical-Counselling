
"use client";

import { useEffect, useState } from "react";
import api from "@/src/lib/axios";
import toast from "react-hot-toast";
import {
  Pencil,
  Save,
  X,
  Plus,
  Trash2,
  UserRound,
  GraduationCap,
  BookOpen,
  MapPin,
  Wallet,
  ClipboardList,
  LoaderCircle,
} from "lucide-react";

import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileSidebar from "@/components/profile/ProfileSidebar";

/* =========================================================
   TYPES
========================================================= */

type AcademicField = {
  board?: string;
  percentage?: string | number;
  passingYear?: string | number;
  stream?: string;
  college?: string;
  course?: string;
};

type EntranceExam = {
  exam: any;
  score?: string | number;
  percentile?: string | number;
  rank?: string | number;
  year?: string | number;
};

type ProfileForm = {
  dob: string;
  gender: string;
  city: string;
  state: string;
  country: string;

  academicDetails: {
    tenth: AcademicField;
    twelfth: AcademicField;
    graduation: AcademicField;
  };

  entranceExams: EntranceExam[];
  preferredLocations: string[];
  preferredCourses: any[];
  budget: {
    min: string | number;
    max: string | number;
  };
};

/* =========================================================
   HELPERS
========================================================= */

const emptyForm: ProfileForm = {
  dob: "",
  gender: "",
  city: "",
  state: "",
  country: "",

  academicDetails: {
    tenth: {},
    twelfth: {},
    graduation: {},
  },

  entranceExams: [],
  preferredLocations: [],
  preferredCourses: [],
  budget: {
    min: "",
    max: "",
  },
};

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const labelClass = "mb-1.5 block text-sm font-medium text-gray-600";

function getCourseId(course: any) {
  if (!course) return "";
  return typeof course === "string" ? course : course._id || course.id || "";
}

function getCourseName(course: any) {
  if (!course) return "Unknown course";
  if (typeof course === "string") return course;

  return (
    course.name ||
    course.courseName ||
    course.title ||
    course.shortName ||
    "Unknown course"
  );
}

function getExamId(exam: any) {
  if (!exam) return "";
  return typeof exam === "string" ? exam : exam._id || exam.id || "";
}

function getExamName(exam: any) {
  if (!exam) return "Unknown exam";
  if (typeof exam === "string") return exam;

  return exam.name || exam.examName || exam.title || "Unknown exam";
}

function formatDate(value: any) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().split("T")[0];
}

function createFormData(data: any): ProfileForm {
  const academic = data?.academicDetails || {};
  const budget = data?.budget || {};

  return {
    dob: formatDate(data?.dob),
    gender: data?.gender || "",
    city: data?.city || "",
    state: data?.state || "",
    country: data?.country || "",

    academicDetails: {
      tenth: {
        board: academic?.tenth?.board || "",
        percentage: academic?.tenth?.percentage ?? "",
        passingYear: academic?.tenth?.passingYear ?? "",
      },

      twelfth: {
        board: academic?.twelfth?.board || "",
        percentage: academic?.twelfth?.percentage ?? "",
        passingYear: academic?.twelfth?.passingYear ?? "",
        stream: academic?.twelfth?.stream || "",
      },

      graduation: {
        college: academic?.graduation?.college || "",
        course: academic?.graduation?.course || "",
        percentage: academic?.graduation?.percentage ?? "",
        passingYear: academic?.graduation?.passingYear ?? "",
      },
    },

    entranceExams: (data?.entranceExams || []).map((item: any) => ({
      exam: item?.exam?._id || item?.exam || "",
      score: item?.score ?? "",
      percentile: item?.percentile ?? "",
      rank: item?.rank ?? "",
      year: item?.year ?? "",
    })),

    preferredLocations: data?.preferredLocations || [],

    preferredCourses: (data?.preferredCourses || []).map((course: any) =>
      getCourseId(course)
    ),

    budget: {
      min: budget?.min ?? "",
      max: budget?.max ?? "",
    },
  };
}

/* =========================================================
   REUSABLE COMPONENTS
========================================================= */

function Detail({
  label,
  value,
}: {
  label: string;
  value: any;
}) {
  return (
    <div className="min-w-0">
      <p className="mb-1 text-xs font-medium text-gray-500">{label}</p>
      <p className="break-words text-sm font-medium text-gray-800">
        {value || "Not provided"}
      </p>
    </div>
  );
}

function EditableField({
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
    <div className="min-w-0">
      <label className={labelClass}>{label}</label>
      <input
        type={type}
        value={value ?? ""}
        placeholder={placeholder || `Enter ${label.toLowerCase()}`}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
    </div>
  );
}

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
        <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
          {icon}
        </div>
        <h2 className="font-semibold text-gray-800">{title}</h2>
      </div>

      <div className="p-5">{children}</div>
    </section>
  );
}

function EmptyMessage({ text }: { text: string }) {
  return (
    <p className="py-3 text-sm text-gray-500">{text}</p>
  );
}

/* =========================================================
   MAIN PROFILE PAGE
========================================================= */

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState<ProfileForm>(emptyForm);

  const [courses, setCourses] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* ---------------------------------------------------------
     FETCH PROFILE
  --------------------------------------------------------- */

  const fetchProfile = async () => {
    try {
      const response = await api.get(
        "/studentProfile/Get-studentProfile"
      );

      const result = response.data?.data;

      if (!response.data?.status || !result) {
        throw new Error(
          response.data?.message || "Unable to fetch profile"
        );
      }

      setProfile(result);
      setFormData(createFormData(result));
    } catch (error: any) {
      console.error("Profile fetch error:", error);

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to load profile"
      );
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------------------------------
     FETCH COURSES
  --------------------------------------------------------- */

  const fetchCourses = async () => {
    try {
      const response = await api.get(
        "/course/Get-All-Courses?limit=1000"
      );

      const result = response.data?.data;

      const courseList = Array.isArray(result)
        ? result
        : result?.courses ||
          result?.getCourses ||
          result?.data ||
          response.data?.courses ||
          [];

      setCourses(Array.isArray(courseList) ? courseList : []);
    } catch (error) {
      console.error("Courses fetch error:", error);
      toast.error("Unable to load courses");
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchCourses();
  }, []);

  /* ---------------------------------------------------------
     GENERAL INPUT HANDLER
  --------------------------------------------------------- */

  const handleInputChange = (
    field: keyof ProfileForm,
    value: any
  ) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  /* ---------------------------------------------------------
     ACADEMIC DETAILS HANDLER
  --------------------------------------------------------- */

  const handleAcademicChange = (
    level: "tenth" | "twelfth" | "graduation",
    field: string,
    value: string
  ) => {
    setFormData((previous) => ({
      ...previous,
      academicDetails: {
        ...previous.academicDetails,
        [level]: {
          ...previous.academicDetails[level],
          [field]: value,
        },
      },
    }));
  };

  /* ---------------------------------------------------------
     ENTRANCE EXAM HANDLERS
  --------------------------------------------------------- */

  const handleAddExam = () => {
    setFormData((previous) => ({
      ...previous,
      entranceExams: [
        ...previous.entranceExams,
        {
          exam: "",
          score: "",
          percentile: "",
          rank: "",
          year: "",
        },
      ],
    }));
  };

  const handleExamChange = (
    index: number,
    field: keyof EntranceExam,
    value: any
  ) => {
    setFormData((previous) => ({
      ...previous,
      entranceExams: previous.entranceExams.map((exam, i) =>
        i === index ? { ...exam, [field]: value } : exam
      ),
    }));
  };

  const handleRemoveExam = (index: number) => {
    setFormData((previous) => ({
      ...previous,
      entranceExams: previous.entranceExams.filter(
        (_, i) => i !== index
      ),
    }));
  };

  /* ---------------------------------------------------------
     PREFERRED LOCATION HANDLERS
  --------------------------------------------------------- */

  const handleAddLocation = () => {
    setFormData((previous) => ({
      ...previous,
      preferredLocations: [
        ...previous.preferredLocations,
        "",
      ],
    }));
  };

  const handleLocationChange = (
    index: number,
    value: string
  ) => {
    setFormData((previous) => ({
      ...previous,
      preferredLocations: previous.preferredLocations.map(
        (location, i) => (i === index ? value : location)
      ),
    }));
  };

  const handleRemoveLocation = (index: number) => {
    setFormData((previous) => ({
      ...previous,
      preferredLocations: previous.preferredLocations.filter(
        (_, i) => i !== index
      ),
    }));
  };

  /* ---------------------------------------------------------
     COURSE HANDLERS
  --------------------------------------------------------- */

  const handleCourseChange = (
    courseId: string,
    checked: boolean
  ) => {
    setFormData((previous) => {
      const current = previous.preferredCourses || [];

      return {
        ...previous,
        preferredCourses: checked
          ? [...current, courseId]
          : current.filter(
              (id) => getCourseId(id) !== courseId
            ),
      };
    });
  };

  /* ---------------------------------------------------------
     CANCEL EDITING
  --------------------------------------------------------- */

  const handleCancelEdit = () => {
    if (profile) {
      setFormData(createFormData(profile));
    }

    setIsEditing(false);
  };

  /* ---------------------------------------------------------
     SAVE PROFILE
  --------------------------------------------------------- */

  const handleSaveProfile = async () => {
    try {
      setSaving(true);

      const payload = {
        dob: formData.dob || null,
        gender: formData.gender,
        city: formData.city,
        state: formData.state,
        country: formData.country,

        academicDetails: {
          tenth: {
            board: formData.academicDetails.tenth.board || "",
            percentage:
              formData.academicDetails.tenth.percentage === ""
                ? null
                : Number(formData.academicDetails.tenth.percentage),
            passingYear:
              formData.academicDetails.tenth.passingYear === ""
                ? null
                : Number(formData.academicDetails.tenth.passingYear),
          },

          twelfth: {
            board: formData.academicDetails.twelfth.board || "",
            percentage:
              formData.academicDetails.twelfth.percentage === ""
                ? null
                : Number(formData.academicDetails.twelfth.percentage),
            passingYear:
              formData.academicDetails.twelfth.passingYear === ""
                ? null
                : Number(formData.academicDetails.twelfth.passingYear),
            stream: formData.academicDetails.twelfth.stream || "",
          },

          graduation: {
            college: formData.academicDetails.graduation.college || "",
            course: formData.academicDetails.graduation.course || "",
            percentage:
              formData.academicDetails.graduation.percentage === ""
                ? null
                : Number(formData.academicDetails.graduation.percentage),
            passingYear:
              formData.academicDetails.graduation.passingYear === ""
                ? null
                : Number(formData.academicDetails.graduation.passingYear),
          },
        },

        entranceExams: formData.entranceExams
          .filter((exam) => exam.exam)
          .map((exam) => ({
            exam: getExamId(exam.exam),
            score:
              exam.score === "" ? null : Number(exam.score),
            percentile:
              exam.percentile === ""
                ? null
                : Number(exam.percentile),
            rank:
              exam.rank === "" ? null : Number(exam.rank),
            year:
              exam.year === "" ? null : Number(exam.year),
          })),

        preferredLocations: formData.preferredLocations
          .map((location) => location.trim())
          .filter(Boolean),

        preferredCourses: formData.preferredCourses
          .map((course) => getCourseId(course))
          .filter(Boolean),

        budget: {
          min:
            formData.budget.min === ""
              ? null
              : Number(formData.budget.min),
          max:
            formData.budget.max === ""
              ? null
              : Number(formData.budget.max),
        },
      };

      if (
        payload.budget.min !== null &&
        payload.budget.max !== null &&
        payload.budget.min > payload.budget.max
      ) {
        toast.error("Minimum budget cannot be greater than maximum budget");
        return;
      }

      const response = await api.put(
        "/studentProfile/Edit-studentProfile",
        payload
      );

      if (!response.data?.status) {
        throw new Error(
          response.data?.message || "Profile update failed"
        );
      }

      await fetchProfile();

      setIsEditing(false);
      toast.success(
        response.data?.message || "Profile updated successfully"
      );
    } catch (error: any) {
      console.error("Profile update error:", error);

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to update profile"
      );
    } finally {
      setSaving(false);
    }
  };

  /* ---------------------------------------------------------
     LOADING
  --------------------------------------------------------- */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoaderCircle className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  /* ---------------------------------------------------------
     MAIN UI
  --------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-gray-50">
      <ProfileHeader />

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-8 lg:grid-cols-[260px_1fr]">
        <aside>
          <ProfileSidebar />
        </aside>

        <main className="min-w-0">
          {/* PAGE HEADING */}

          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                My Profile
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Manage your personal and academic information
              </p>
            </div>

            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                disabled={!profile}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                <Pencil size={16} />
                Edit Profile
              </button>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  <X size={16} />
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? (
                    <LoaderCircle className="animate-spin" size={16} />
                  ) : (
                    <Save size={16} />
                  )}

                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </div>

          {/* PERSONAL DETAILS */}

          <SectionCard
            title="Personal Details"
            icon={<UserRound size={20} />}
          >
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {isEditing ? (
                <>
                  <EditableField
                    label="Date of Birth"
                    type="date"
                    value={formData.dob}
                    onChange={(value) =>
                      handleInputChange("dob", value)
                    }
                  />

                  <div>
                    <label className={labelClass}>Gender</label>

                    <select
                      className={inputClass}
                      value={formData.gender}
                      onChange={(e) =>
                        handleInputChange("gender", e.target.value)
                      }
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <EditableField
                    label="City"
                    value={formData.city}
                    onChange={(value) =>
                      handleInputChange("city", value)
                    }
                  />

                  <EditableField
                    label="State"
                    value={formData.state}
                    onChange={(value) =>
                      handleInputChange("state", value)
                    }
                  />

                  <EditableField
                    label="Country"
                    value={formData.country}
                    onChange={(value) =>
                      handleInputChange("country", value)
                    }
                  />
                </>
              ) : (
                <>
                  <Detail
                    label="Date of Birth"
                    value={
                      profile?.dob
                        ? new Date(profile.dob).toLocaleDateString()
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
          </SectionCard>

          {/* ACADEMIC DETAILS */}

          <SectionCard
            title="Academic Details"
            icon={<GraduationCap size={20} />}
          >
            {/* 10TH */}

            <div className="mb-6">
              <h3 className="mb-4 font-semibold text-gray-800">
                10th Standard
              </h3>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                {isEditing ? (
                  <>
                    <EditableField
                      label="Board"
                      value={formData.academicDetails.tenth.board}
                      onChange={(value) =>
                        handleAcademicChange("tenth", "board", value)
                      }
                    />

                    <EditableField
                      label="Percentage"
                      type="number"
                      value={formData.academicDetails.tenth.percentage}
                      onChange={(value) =>
                        handleAcademicChange("tenth", "percentage", value)
                      }
                    />

                    <EditableField
                      label="Passing Year"
                      type="number"
                      value={formData.academicDetails.tenth.passingYear}
                      onChange={(value) =>
                        handleAcademicChange("tenth", "passingYear", value)
                      }
                    />
                  </>
                ) : (
                  <>
                    <Detail
                      label="Board"
                      value={profile?.academicDetails?.tenth?.board}
                    />
                    <Detail
                      label="Percentage"
                      value={profile?.academicDetails?.tenth?.percentage}
                    />
                    <Detail
                      label="Passing Year"
                      value={profile?.academicDetails?.tenth?.passingYear}
                    />
                  </>
                )}
              </div>
            </div>

            <div className="mb-6 border-t border-gray-100 pt-6">
              <h3 className="mb-4 font-semibold text-gray-800">
                12th Standard
              </h3>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {isEditing ? (
                  <>
                    <EditableField
                      label="Board"
                      value={formData.academicDetails.twelfth.board}
                      onChange={(value) =>
                        handleAcademicChange("twelfth", "board", value)
                      }
                    />

                    <EditableField
                      label="Stream"
                      value={formData.academicDetails.twelfth.stream}
                      onChange={(value) =>
                        handleAcademicChange("twelfth", "stream", value)
                      }
                    />

                    <EditableField
                      label="Percentage"
                      type="number"
                      value={formData.academicDetails.twelfth.percentage}
                      onChange={(value) =>
                        handleAcademicChange("twelfth", "percentage", value)
                      }
                    />

                    <EditableField
                      label="Passing Year"
                      type="number"
                      value={formData.academicDetails.twelfth.passingYear}
                      onChange={(value) =>
                        handleAcademicChange("twelfth", "passingYear", value)
                      }
                    />
                  </>
                ) : (
                  <>
                    <Detail
                      label="Board"
                      value={profile?.academicDetails?.twelfth?.board}
                    />
                    <Detail
                      label="Stream"
                      value={profile?.academicDetails?.twelfth?.stream}
                    />
                    <Detail
                      label="Percentage"
                      value={profile?.academicDetails?.twelfth?.percentage}
                    />
                    <Detail
                      label="Passing Year"
                      value={profile?.academicDetails?.twelfth?.passingYear}
                    />
                  </>
                )}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h3 className="mb-4 font-semibold text-gray-800">
                Graduation
              </h3>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {isEditing ? (
                  <>
                    <EditableField
                      label="College"
                      value={formData.academicDetails.graduation.college}
                      onChange={(value) =>
                        handleAcademicChange("graduation", "college", value)
                      }
                    />

                    <EditableField
                      label="Course"
                      value={formData.academicDetails.graduation.course}
                      onChange={(value) =>
                        handleAcademicChange("graduation", "course", value)
                      }
                    />

                    <EditableField
                      label="Percentage"
                      type="number"
                      value={formData.academicDetails.graduation.percentage}
                      onChange={(value) =>
                        handleAcademicChange("graduation", "percentage", value)
                      }
                    />

                    <EditableField
                      label="Passing Year"
                      type="number"
                      value={formData.academicDetails.graduation.passingYear}
                      onChange={(value) =>
                        handleAcademicChange("graduation", "passingYear", value)
                      }
                    />
                  </>
                ) : (
                  <>
                    <Detail
                      label="College"
                      value={profile?.academicDetails?.graduation?.college}
                    />
                    <Detail
                      label="Course"
                      value={profile?.academicDetails?.graduation?.course}
                    />
                    <Detail
                      label="Percentage"
                      value={profile?.academicDetails?.graduation?.percentage}
                    />
                    <Detail
                      label="Passing Year"
                      value={profile?.academicDetails?.graduation?.passingYear}
                    />
                  </>
                )}
              </div>
            </div>
          </SectionCard>

          {/* ENTRANCE EXAMS */}

          <SectionCard
            title="Entrance Exams"
            icon={<ClipboardList size={20} />}
          >
            {isEditing && (
              <div className="mb-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleAddExam}
                  className="flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-100"
                >
                  <Plus size={16} />
                  Add Exam
                </button>
              </div>
            )}

            {formData.entranceExams.length === 0 ? (
              <EmptyMessage text="No entrance exam details added." />
            ) : (
              <div className="space-y-5">
                {formData.entranceExams.map((exam, index) => {
                  const originalExam = profile?.entranceExams?.find(
                    (item: any) =>
                      getExamId(item.exam) === getExamId(exam.exam)
                  )?.exam;

                  return (
                    <div
                      key={index}
                      className="rounded-lg border border-gray-200 p-4"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-800">
                          Exam {index + 1}
                        </h3>

                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => handleRemoveExam(index)}
                            className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                            title="Remove exam"
                          >
                            <Trash2 size={17} />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {isEditing ? (
                          <>
                            <div>
                              <label className={labelClass}>
                                Entrance Exam
                              </label>

                              <select
                                className={inputClass}
                                value={getExamId(exam.exam)}
                                onChange={(e) =>
                                  handleExamChange(
                                    index,
                                    "exam",
                                    e.target.value
                                  )
                                }
                              >
                                <option value="">
                                  Select an existing exam
                                </option>

                                {profile?.entranceExams?.map(
                                  (item: any, i: number) => (
                                    <option
                                      key={getExamId(item.exam) || i}
                                      value={getExamId(item.exam)}
                                    >
                                      {getExamName(item.exam)}
                                    </option>
                                  )
                                )}
                              </select>

                              <p className="mt-1 text-xs text-gray-400">
                                Only exams already present in your profile
                                are available here.
                              </p>
                            </div>

                            <EditableField
                              label="Score"
                              type="number"
                              value={exam.score}
                              onChange={(value) =>
                                handleExamChange(index, "score", value)
                              }
                            />

                            <EditableField
                              label="Percentile"
                              type="number"
                              value={exam.percentile}
                              onChange={(value) =>
                                handleExamChange(index, "percentile", value)
                              }
                            />

                            <EditableField
                              label="Rank"
                              type="number"
                              value={exam.rank}
                              onChange={(value) =>
                                handleExamChange(index, "rank", value)
                              }
                            />

                            <EditableField
                              label="Year"
                              type="number"
                              value={exam.year}
                              onChange={(value) =>
                                handleExamChange(index, "year", value)
                              }
                            />
                          </>
                        ) : (
                          <>
                            <Detail
                              label="Exam"
                              value={
                                getExamName(originalExam) ||
                                getExamName(exam.exam)
                              }
                            />
                            <Detail label="Score" value={exam.score} />
                            <Detail
                              label="Percentile"
                              value={exam.percentile}
                            />
                            <Detail label="Rank" value={exam.rank} />
                            <Detail label="Year" value={exam.year} />
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>

          {/* PREFERRED COURSES */}

          <SectionCard
            title="Preferred Courses"
            icon={<BookOpen size={20} />}
          >
            {isEditing ? (
              <>
                {courses.length === 0 ? (
                  <EmptyMessage text="No courses available from the courses API." />
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {courses.map((course: any, index: number) => {
                      const courseId = getCourseId(course);
                      const selected = formData.preferredCourses.some(
                        (item) => getCourseId(item) === courseId
                      );

                      return (
                        <label
                          key={courseId || index}
                          className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={(e) =>
                              handleCourseChange(
                                courseId,
                                e.target.checked
                              )
                            }
                            className="h-4 w-4 accent-blue-600"
                          />

                          <span className="text-sm text-gray-700">
                            {getCourseName(course)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(profile?.preferredCourses || []).length > 0 ? (
                  profile.preferredCourses.map(
                    (course: any, index: number) => (
                      <span
                        key={getCourseId(course) || index}
                        className="rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700"
                      >
                        {getCourseName(course)}
                      </span>
                    )
                  )
                ) : (
                  <EmptyMessage text="No preferred courses selected." />
                )}
              </div>
            )}
          </SectionCard>

          {/* PREFERRED LOCATIONS */}

          <SectionCard
            title="Preferred Locations"
            icon={<MapPin size={20} />}
          >
            {isEditing && (
              <div className="mb-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleAddLocation}
                  className="flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-100"
                >
                  <Plus size={16} />
                  Add Location
                </button>
              </div>
            )}

            {formData.preferredLocations.length === 0 ? (
              <EmptyMessage text="No preferred locations added." />
            ) : (
              <div className="space-y-3">
                {formData.preferredLocations.map(
                  (location, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3"
                    >
                      {isEditing ? (
                        <>
                          <input
                            className={inputClass}
                            value={location}
                            placeholder="Enter city or location"
                            onChange={(e) =>
                              handleLocationChange(
                                index,
                                e.target.value
                              )
                            }
                          />

                          <button
                            type="button"
                            onClick={() =>
                              handleRemoveLocation(index)
                            }
                            className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                            title="Remove location"
                          >
                            <Trash2 size={17} />
                          </button>
                        </>
                      ) : (
                        <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
                          {location}
                        </span>
                      )}
                    </div>
                  )
                )}
              </div>
            )}
          </SectionCard>

          {/* BUDGET */}

          <SectionCard
            title="Budget"
            icon={<Wallet size={20} />}
          >
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {isEditing ? (
                <>
                  <EditableField
                    label="Minimum Budget"
                    type="number"
                    value={formData.budget.min}
                    onChange={(value) =>
                      handleInputChange("budget", {
                        ...formData.budget,
                        min: value,
                      })
                    }
                  />

                  <EditableField
                    label="Maximum Budget"
                    type="number"
                    value={formData.budget.max}
                    onChange={(value) =>
                      handleInputChange("budget", {
                        ...formData.budget,
                        max: value,
                      })
                    }
                  />
                </>
              ) : (
                <>
                  <Detail
                    label="Minimum Budget"
                    value={profile?.budget?.min}
                  />

                  <Detail
                    label="Maximum Budget"
                    value={profile?.budget?.max}
                  />
                </>
              )}
            </div>
          </SectionCard>

          {/* BOTTOM SAVE BUTTON */}

          {isEditing && (
            <div className="mb-8 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={saving}
                className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? (
                  <LoaderCircle className="animate-spin" size={16} />
                ) : (
                  <Save size={16} />
                )}

                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
