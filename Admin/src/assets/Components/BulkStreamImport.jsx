import { useState } from "react";
import { CSVImporter } from "@importcsv/react";
import { z } from "zod";
import api from "../../Api/axios";
import { Upload } from "lucide-react";
import { toast } from "react-toastify";

const streamSchema = z.object({
  name: z.string().trim().min(1, "Stream name is required"),

  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Stream slug is required")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must contain lowercase letters, numbers and hyphens only"
    ),

  code: z.string().trim().optional().default(""),

  description: z.string().trim().optional().default(""),

  icon: z.string().trim().optional().default(""),
  image: z.string().trim().optional().default(""),
  logo: z.string().trim().optional().default(""),

  streamType: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(
      z.enum([
        "government",
        "private",
        "deemed",
        "autonomous",
        "public",
      ])
    ),

  parentStream: z.string().trim().optional().default(""),

  displayOrder: z.coerce
    .number()
    .int()
    .min(0, "Display order cannot be negative")
    .default(0),

  status: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.enum(["active", "inactive", "pending"]))
    .optional()
    .default("pending"),

  isVerified: z
    .union([z.boolean(), z.string(), z.number()])
    .optional()
    .default(false)
    .transform((value, ctx) => {
      if (typeof value === "boolean") return value;

      const normalized = String(value).trim().toLowerCase();

      if (["true", "1"].includes(normalized)) return true;
      if (["false", "0", ""].includes(normalized)) return false;

      ctx.addIssue({
        code: "custom",
        message: "isVerified must be true, false, 1 or 0",
      });

      return z.NEVER;
    }),
});

const BulkStreamImport = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleComplete = async (rows) => {
    if (importing) return;

    try {
      const inputRows = Array.isArray(rows)
        ? rows
        : rows?.rows || rows?.data || [];

      if (!inputRows.length) {
        toast.error("CSV file mein stream data nahi mila.");
        return;
      }

      if (inputRows.length > 500) {
        toast.error(
          "Ek baar mein maximum 500 streams import kar sakte ho."
        );
        return;
      }

      const streams = [];
      const errors = [];

      inputRows.forEach((row, index) => {
        const parsed = streamSchema.safeParse(row);

        if (!parsed.success) {
          errors.push(
            `Row ${index + 1}: ${
              parsed.error.issues[0]?.message || "Invalid data"
            }`
          );
          return;
        }

        const data = parsed.data;

        streams.push({
          name: data.name,
          slug: data.slug,
          code: data.code || "",
          description: data.description,
          icon: data.icon || null,
          image: data.image || null,
          logo: data.logo || null,
          streamType: data.streamType,
          parentStream: data.parentStream || null,
          displayOrder: data.displayOrder,
          status: data.status,
          isVerified: data.isVerified,
        });
      });

      if (errors.length) {
        toast.error(
          `${errors.length} row(s) mein invalid data hai. CSV check karke dobara import karo.`,
          { autoClose: 5000 }
        );

        console.error("Stream CSV validation errors:", errors);
        return;
      }

      if (!streams.length) {
        toast.error("Import karne ke liye valid stream data nahi hai.");
        return;
      }

      setImporting(true);

      const response = await api.post(
        "/stream/Bulk-Import-Streams",
        { streams }
      );

      if (response.data?.status === false) {
        toast.error(response.data.message || "Stream import failed.");
        return;
      }

      const result = response.data;

      toast.success(
        `Import complete: ${result.successful ?? streams.length} successful, ${result.failed ?? 0} failed.`
      );

      if (result.failed > 0) {
        console.error("Stream import row results:", result.results);
      }

      setIsOpen(false);

      window.dispatchEvent(new CustomEvent("streams-imported"));
    } catch (error) {
      console.error(
        "Bulk Stream Import Error:",
        error.response?.data || error.message
      );

      toast.error(
        error.response?.data?.message ||
          "Stream import failed. Backend route check karo."
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
        schema={streamSchema}
        onComplete={handleComplete}
      />
    </>
  );
};

export default BulkStreamImport;
