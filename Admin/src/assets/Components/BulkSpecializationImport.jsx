
import { useState } from "react";
import { CSVImporter } from "@importcsv/react";
import { z } from "zod";
import { Upload } from "lucide-react";
import { toast } from "react-toastify";
import api from "../../Api/axios";

const specializationSchema = z.object({
  name: z.string().min(1, "Specialization name is required"),
  slug: z.string().min(1, "Slug is required"),
  code: z.string().optional().default(""),
  course: z.string().min(1, "Course ID is required"),
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
    try {
      setLoading(true);

      const specializations = data.map((row) => {
        const durationValue =
          row.durationValue === "" || row.durationValue == null
            ? undefined
            : Number(row.durationValue);

        const minimumPercentage =
          row.minimumPercentage === "" || row.minimumPercentage == null
            ? undefined
            : Number(row.minimumPercentage);

        return {
          name: String(row.name || "").trim(),
          slug: String(row.slug || "").trim().toLowerCase(),
          code: String(row.code || "").trim().toUpperCase(),
          course: String(row.course || "").trim(),
          description: String(row.description || "").trim(),

          ...(durationValue !== undefined && {
            duration: {
              value: durationValue,
              unit: String(row.durationUnit || "years")
                .trim()
                .toLowerCase(),
            },
          }),

          ...(minimumPercentage !== undefined && {
            eligibility: {
              minimumPercentage,
              requiredSubjects: String(row.requiredSubjects || "")
                .split(",")
                .map((subject) => subject.trim())
                .filter(Boolean),
              requiredQualification: String(
                row.requiredQualification || ""
              ).trim(),
            },
          }),

          careerOptions: String(row.careerOptions || "")
            .split(",")
            .map((career) => career.trim())
            .filter(Boolean),

          status: String(row.status || "active")
            .trim()
            .toLowerCase(),
        };
      });

      for (let i = 0; i < specializations.length; i++) {
        const result = specializationSchema.safeParse(data[i]);

        if (!result.success) {
          throw new Error(
            `CSV row ${i + 2}: ${result.error.issues[0].message}`
          );
        }

        const item = specializations[i];

        if (
          item.duration &&
          (!Number.isFinite(item.duration.value) ||
            item.duration.value < 0)
        ) {
          throw new Error(
            `CSV row ${i + 2}: Duration must be a valid non-negative number`
          );
        }

        if (
          item.eligibility &&
          (!Number.isFinite(item.eligibility.minimumPercentage) ||
            item.eligibility.minimumPercentage < 0 ||
            item.eligibility.minimumPercentage > 100)
        ) {
          throw new Error(
            `CSV row ${i + 2}: Minimum percentage must be between 0 and 100`
          );
        }
      }

      const response = await api.post(
        "/specialization/Bulk-Import-Specializations",
        { specializations }
      );

      const result = response.data;

      if (!result.status) {
        throw new Error(result.message || "Import failed");
      }

      toast.success(
        `Import complete: ${result.successful} successful, ${result.failed} failed`
      );

      window.dispatchEvent(new CustomEvent("specializations-imported"));
      onImported?.();
      setOpen(false);
    } catch (error) {
      console.error("Bulk specialization import error:", error);

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
        className="ui-btn-secondary inline-flex items-center gap-2"
      >
        <Upload size={16} />
        {loading ? "Importing..." : "Bulk Import"}
      </button>

      {open && (
        <CSVImporter
          isOpen={open}
          onClose={() => setOpen(false)}
          schema={specializationSchema}
          onComplete={handleImport}
        />
      )}
    </>
  );
};

export default BulkSpecializationImport;
