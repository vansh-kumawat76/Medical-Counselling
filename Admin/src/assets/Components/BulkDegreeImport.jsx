import { useState } from "react";
import { CSVImporter } from "@importcsv/react";
import { z } from "zod";
import api from "../../Api/axios";
import { Upload } from "lucide-react";
import { toast } from "react-toastify";

const degreeSchema = z.object({
  name: z.string().trim().min(1, "Degree name is required"),

  shortName: z
    .string()
    .trim()
    .min(1, "Short name is required"),

  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Slug is required")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must contain lowercase letters, numbers and hyphens only"
    ),

  code: z.string().trim().optional().default(""),

  level: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(
      z.enum([
        "certificate",
        "diploma",
        "undergraduate",
        "postgraduate",
        "doctoral",
        "postdoctoral",
        "other",
      ])
    ),

  degreeType: z
    .string()
    .trim()
    .toLowerCase()
    .optional()
    .default("academic")
    .pipe(
      z.enum([
        "academic",
        "professional",
        "vocational",
        "research",
        "other",
      ])
    ),

  durationValue: z.union([
    z.literal(""),
    z.coerce.number().min(0),
  ]).optional().default(""),

  durationUnit: z
    .string()
    .trim()
    .toLowerCase()
    .optional()
    .default("years"),

  description: z.string().trim().optional().default(""),

  streams: z.string().trim().optional().default(""),

  status: z
    .string()
    .trim()
    .toLowerCase()
    .optional()
    .default("active")
    .pipe(z.enum(["active", "inactive"])),

  displayOrder: z.coerce.number().int().min(0).default(0),
});

const BulkDegreeImport = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleComplete = async (rows) => {
    if (importing) return;

    try {
      const inputRows = Array.isArray(rows)
        ? rows
        : rows?.rows || rows?.data || [];

      if (!inputRows.length) {
        toast.error("CSV file mein degree data nahi mila.");
        return;
      }

      if (inputRows.length > 500) {
        toast.error(
          "Ek baar mein maximum 500 degrees import kar sakte ho."
        );
        return;
      }

      const degrees = [];
      const errors = [];

      inputRows.forEach((row, index) => {
        const parsed = degreeSchema.safeParse(row);

        if (!parsed.success) {
          errors.push(
            `Row ${index + 1}: ${
              parsed.error.issues[0]?.message || "Invalid data"
            }`
          );
          return;
        }

        const data = parsed.data;

        const streamIds = data.streams
          ? data.streams
              .split(",")
              .map((id) => id.trim())
              .filter(Boolean)
          : [];

        let defaultDuration;

        if (
          data.durationValue !== "" &&
          data.durationValue !== undefined
        ) {
          if (!["months", "years"].includes(data.durationUnit)) {
            errors.push(
              `Row ${index + 1}: Duration unit must be months or years.`
            );
            return;
          }

          defaultDuration = {
            value: Number(data.durationValue),
            unit: data.durationUnit,
          };
        }

        degrees.push({
          name: data.name,
          shortName: data.shortName,
          slug: data.slug,
          code: data.code || undefined,
          level: data.level,
          degreeType: data.degreeType,
          ...(defaultDuration ? { defaultDuration } : {}),
          description: data.description,
          streams: streamIds,
          status: data.status,
          displayOrder: data.displayOrder,
        });
      });

      if (errors.length) {
        toast.error(
          `${errors.length} row(s) mein invalid data hai. CSV check karo.`,
          { autoClose: 5000 }
        );

        console.error("Degree CSV validation errors:", errors);
        return;
      }

      if (!degrees.length) {
        toast.error("Import karne ke liye valid degree data nahi hai.");
        return;
      }

      setImporting(true);

      const response = await api.post(
        "/degree/Bulk-Import-Degrees",
        { degrees }
      );

      if (response.data?.status === false) {
        toast.error(response.data.message || "Degree import failed.");
        return;
      }

      const result = response.data;

      toast.success(
        `Import complete: ${result.successful ?? degrees.length} successful, ${result.failed ?? 0} failed.`
      );

      if (result.failed > 0) {
        console.error("Degree import row results:", result.results);
      }

      setIsOpen(false);

      window.dispatchEvent(new CustomEvent("degrees-imported"));
    } catch (error) {
      console.error(
        "Bulk Degree Import Error:",
        error.response?.data || error.message
      );

      toast.error(
        error.response?.data?.message ||
          "Degree import failed. Backend route check karo."
      );
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        disabled={importing}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:opacity-50"
      >
        <Upload size={16} />
        {importing ? "Importing..." : "Add Bulk"}
      </button>

      <CSVImporter
        modalIsOpen={isOpen}
        modalOnCloseTriggered={() => setIsOpen(false)}
        schema={degreeSchema}
        onComplete={handleComplete}
      />
    </>
  );
};

export default BulkDegreeImport;
