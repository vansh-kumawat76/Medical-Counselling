
import { useState } from "react";
import { CSVImporter } from "@importcsv/react";
import { z } from "zod";
import api from "../../Api/axios";
import { Upload } from "lucide-react";
import { toast } from "react-toastify";

const universitySchema = z.object({
  name: z.string().trim().min(1, "University name is required"),
  shortName: z.string().trim().optional().default(""),
  logo: z.string().trim().optional().default(""),
  type: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(
      z.enum([
        "central",
        "state",
        "private",
        "deemed",
        "international",
      ])
    ),
  establishedYear: z.coerce
    .number()
    .int()
    .min(1)
    .max(new Date().getFullYear()),
  city: z.string().trim().optional().default(""),
  state: z.string().trim().optional().default(""),
  country: z.string().trim().optional().default("India"),
  website: z.string().trim().optional().default(""),
});

const BulkUniversityImport = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleComplete = async (rows) => {
    if (importing) return;

    try {
      const inputRows = Array.isArray(rows)
        ? rows
        : rows?.rows || rows?.data || [];

      if (!inputRows.length) {
        toast.error("CSV file mein university data nahi mila.");
        return;
      }

      if (inputRows.length > 500) {
        toast.error("Ek baar mein maximum 500 universities import kar sakte ho.");
        return;
      }

      const universities = [];
      const errors = [];

      inputRows.forEach((row, index) => {
        const parsed = universitySchema.safeParse(row);

        if (!parsed.success) {
          errors.push(
            `Row ${index + 1}: ${
              parsed.error.issues[0]?.message || "Invalid data"
            }`
          );
          return;
        }

        const data = parsed.data;

        universities.push({
          name: data.name,
          shortName: data.shortName,
          logo: data.logo,
          type: data.type,
          establishedYear: data.establishedYear,
          location: {
            city: data.city,
            state: data.state,
            country: data.country || "India",
          },
          website: data.website,
        });
      });

      if (errors.length) {
        toast.error(
          `${errors.length} row(s) mein invalid data hai. CSV check karke dobara import karo.`,
          { autoClose: 5000 }
        );
        console.error("University CSV validation errors:", errors);
        return;
      }

      if (!universities.length) {
        toast.error("Import karne ke liye valid university data nahi hai.");
        return;
      }

      setImporting(true);

      const response = await api.post(
        "/university/Bulk-Import-Universities",
        { universities }
      );

      if (response.data?.status === false) {
        toast.error(response.data.message || "Import failed.");
        return;
      }

      const result = response.data;

      toast.success(
        `Import complete: ${result.successful ?? universities.length} successful, ${result.failed ?? 0} failed.`
      );

      setIsOpen(false);
      window.dispatchEvent(new CustomEvent("universities-imported"));
    } catch (error) {
      console.error(
        "Bulk University Import Error:",
        error.response?.data || error.message
      );

      toast.error(
        error.response?.data?.message ||
          "University import failed. Backend route check karo."
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
        schema={universitySchema}
        onComplete={handleComplete}
      />
    </>
  );
};

export default BulkUniversityImport;
