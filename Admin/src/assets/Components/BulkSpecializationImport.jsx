
import { useState } from "react";
import { CSVImporter } from "@importcsv/react";
import { z } from "zod";
import { Upload } from "lucide-react";
import { toast } from "react-toastify";
import api from "../../Api/axios";

const specializationSchema = z.object({
  name: z.string().trim().min(1, "Specialization name is required"),
  slug: z.string().trim().min(1, "Slug is required"),
  code: z.string().optional().default(""),
  course: z.string().trim().min(1, "Course ID is required"),
  description: z.string().optional().default(""),
  durationValue: z.union([z.string(), z.number()]).optional(),
  durationUnit: z.enum(["months", "years"]).optional(),
  minimumPercentage: z.union([z.string(), z.number()]).optional(),
  requiredSubjects: z.string().optional().default(""),
  requiredQualification: z.string().optional().default(""),
  careerOptions: z.string().optional().default(""),
  status: z.enum(["active", "inactive"]).optional(),
});

const BulkSpecializationImport = ({ onImported }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleImport = async (data) => {
    if (loading) return;

    try {
      const inputRows = Array.isArray(data)
        ? data
        : data?.rows || data?.data || [];

      if (!Array.isArray(inputRows) || inputRows.length === 0) {
        toast.error("CSV file mein specialization data nahi mila.");
        return;
      }

      if (inputRows.length > 500) {
        toast.error("Ek baar mein maximum 500 specializations import kar sakte ho.");
        return;
      }

      const specializations = [];

      inputRows.forEach((row, index) => {
        const result = specializationSchema.safeParse(row);

        if (!result.success) {
          throw new Error(
            `CSV row ${index + 2}: ${result.error.issues[0]?.message || "Invalid data"}`
          );
        }

        const item = result.data;

        const durationValue =
          item.durationValue === "" || item.durationValue == null
            ? undefined
            : Number(item.durationValue);

        const minimumPercentage =
          item.minimumPercentage === "" ||
          item.minimumPercentage == null
            ? undefined
            : Number(item.minimumPercentage);

        if (
          durationValue !== undefined &&
          (!Number.isFinite(durationValue) || durationValue < 0)
        ) {
          throw new Error(
            `CSV row ${index + 2}: Duration must be a valid non-negative number`
          );
        }

        if (
          minimumPercentage !== undefined &&
          (!Number.isFinite(minimumPercentage) ||
            minimumPercentage < 0 ||
            minimumPercentage > 100)
        ) {
          throw new Error(
            `CSV row ${index + 2}: Minimum percentage must be between 0 and 100`
          );
        }

        specializations.push({
          name: item.name,
          slug: item.slug.toLowerCase(),
          code: item.code.toUpperCase(),
          course: item.course,
          description: item.description,

          ...(durationValue !== undefined && {
            duration: {
              value: durationValue,
              unit: item.durationUnit || "years",
            },
          }),

          ...(minimumPercentage !== undefined && {
            eligibility: {
              minimumPercentage,
              requiredSubjects: item.requiredSubjects
                .split(",")
                .map((subject) => subject.trim())
                .filter(Boolean),
              requiredQualification: item.requiredQualification,
            },
          }),

          careerOptions: item.careerOptions
            .split(",")
            .map((career) => career.trim())
            .filter(Boolean),

          status: item.status || "active",
        });
      });

      setLoading(true);

      const response = await api.post(
        "/specialization/Bulk-Import-Specializations",
        { specializations }
      );

      const result = response.data;

      if (result.status === false) {
        throw new Error(result.message || "Import failed");
      }

      toast.success(
        `Import complete: ${result.successful ?? specializations.length} successful, ${result.failed ?? 0} failed`
      );

      window.dispatchEvent(new CustomEvent("specializations-imported"));
      onImported?.();
      setOpen(false);
    } catch (error) {
      console.error(
        "Bulk specialization import error:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to import specializations"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:opacity-50"
      >
        <Upload size={16} />
        {loading ? "Importing..." : "Add Bulk"}
      </button>

      <CSVImporter
        modalIsOpen={open}
        modalOnCloseTriggered={() => setOpen(false)}
        schema={specializationSchema}
        onComplete={handleImport}
      />
    </>
  );
};

export default BulkSpecializationImport;
