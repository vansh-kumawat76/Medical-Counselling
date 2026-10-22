
import { useState } from "react";
import { CSVImporter } from "@importcsv/react";
import { z } from "zod";
import { Upload } from "lucide-react";
import { toast } from "react-toastify";
import api from "../../Api/axios";

const courseSchema = z.object({
  name: z.string().min(1, "Course name is required"),
  shortName: z.string().optional().default(""),
  slug: z.string().min(1, "Slug is required"),
  code: z.string().optional().default(""),
  degree: z.string().min(1, "Degree ID is required"),
  stream: z.string().min(1, "Stream ID is required"),
  durationValue: z.union([
    z.string(),
    z.number(),
  ]).optional(),
  durationUnit: z.enum(["months", "years"]).optional(),
  description: z.string().optional().default(""),
  status: z.enum(["active", "inactive"]).optional(),
  displayOrder: z.union([
    z.string(),
    z.number(),
  ]).optional(),
});

const BulkCourseImport = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleImport = async (data) => {
    try {
      setLoading(true);

      const courses = data.map((row) => ({
        name: String(row.name || "").trim(),
        shortName: String(row.shortName || "").trim(),
        slug: String(row.slug || "").trim().toLowerCase(),
        code: String(row.code || "").trim().toUpperCase(),
        degree: String(row.degree || "").trim(),
        stream: String(row.stream || "").trim(),
        durationValue:
          row.durationValue === "" || row.durationValue == null
            ? undefined
            : Number(row.durationValue),
        durationUnit: String(row.durationUnit || "years").trim().toLowerCase(),
        description: String(row.description || "").trim(),
        status: String(row.status || "active").trim().toLowerCase(),
        displayOrder:
          row.displayOrder === "" || row.displayOrder == null
            ? 0
            : Number(row.displayOrder),
      }));

      for (let i = 0; i < courses.length; i++) {
        const result = courseSchema.safeParse(courses[i]);

        if (!result.success) {
          throw new Error(
            `CSV row ${i + 2}: ${result.error.issues[0].message}`
          );
        }
      }

      const response = await api.post(
        "/course/Bulk-Import-Courses",
        { courses }
      );

      const result = response.data;

      if (!result.status) {
        throw new Error(result.message || "Import failed");
      }

      toast.success(
        `Import complete: ${result.successful} successful, ${result.failed} failed`
      );

      window.dispatchEvent(new CustomEvent("courses-imported"));
      setOpen(false);
    } catch (error) {
      console.error("Bulk course import error:", error);

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to import courses"
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
          schema={courseSchema}
          onComplete={(data) => {
            handleImport(data);
          }}
        />
      )}
    </>
  );
};

export default BulkCourseImport;
