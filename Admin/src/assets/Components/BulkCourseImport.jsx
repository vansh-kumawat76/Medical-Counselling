
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
  degree: z.string().min(1, "Degree is required"),
  stream: z.string().min(1, "Stream is required"),
  durationValue: z.union([z.string(), z.number()]).optional(),
  durationUnit: z.enum(["months", "years"]).optional(),
  description: z.string().optional().default(""),
  status: z.enum(["active", "inactive"]).optional(),
  displayOrder: z.union([z.string(), z.number()]).optional(),
});

const normalize = (value) =>
  String(value || "").trim().toLowerCase();

const BulkCourseImport = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Find Degree or Stream by MongoDB ID, name, shortName, slug or code.
  const findRecord = (value, records) => {
    const searchValue = normalize(value);

    if (!searchValue) return null;

    return records.find((item) => {
      const possibleValues = [
        item._id,
        item.name,
        item.shortName,
        item.slug,
        item.code,
      ];

      return possibleValues.some(
        (field) => normalize(field) === searchValue
      );
    });
  };

  const handleImport = async (data) => {
    try {
      setLoading(true);

      console.log("ImportCSV Original Response:", data);

      // Step 1: Extract CSV rows
      const rows = Array.isArray(data)
        ? data
        : Array.isArray(data?.rows)
        ? data.rows.map((row) => row.values ?? row)
        : [];

      if (!rows.length) {
        throw new Error("CSV file se koi data nahi mila.");
      }

      // Step 2: Fetch Degree and Stream records
      const [degreeResponse, streamResponse] = await Promise.all([
        api.get("/degree/GetAllDegree"),
        api.get("/stream/Get-All-Streams"),
      ]);

      const degrees = degreeResponse.data?.data || [];
      const streams = streamResponse.data?.streams || [];

      if (!degrees.length) {
        throw new Error("Database mein koi Degree available nahi hai.");
      }

      if (!streams.length) {
        throw new Error("Database mein koi Stream available nahi hai.");
      }

      console.log("Available Degrees:", degrees);
      console.log("Available Streams:", streams);

      // Step 3: Map CSV names to MongoDB IDs
      const courses = rows.map((row, index) => {
        const degreeInput = String(row.degree || "").trim();
        const streamInput = String(row.stream || "").trim();

        const matchedDegree = findRecord(degreeInput, degrees);

        if (!matchedDegree) {
          throw new Error(
            `CSV Row ${index + 2}: Degree "${degreeInput}" database mein nahi mili.`
          );
        }

        // Prefer streams associated with the selected degree.
        const degreeStreams = Array.isArray(matchedDegree.streams)
          ? matchedDegree.streams
          : [];

        const availableStreams =
          degreeStreams.length > 0 ? degreeStreams : streams;

        let matchedStream = findRecord(
          streamInput,
          availableStreams
        );

        // If degree has no matching populated stream, search all streams.
        if (!matchedStream) {
          matchedStream = findRecord(streamInput, streams);
        }

        if (!matchedStream) {
          throw new Error(
            `CSV Row ${index + 2}: Stream "${streamInput}" database mein nahi mili.`
          );
        }

        return {
          name: String(row.name || "").trim(),
          shortName: String(row.shortName || "").trim(),
          slug: String(row.slug || "").trim().toLowerCase(),
          code: String(row.code || "").trim().toUpperCase(),

          // Send actual MongoDB ObjectIds
          degree: String(matchedDegree._id),
          stream: String(matchedStream._id),

          durationValue:
            row.durationValue === "" || row.durationValue == null
              ? undefined
              : Number(row.durationValue),

          durationUnit: String(row.durationUnit || "years")
            .trim()
            .toLowerCase(),

          description: String(row.description || "").trim(),

          status: String(row.status || "active")
            .trim()
            .toLowerCase(),

          displayOrder:
            row.displayOrder === "" || row.displayOrder == null
              ? 0
              : Number(row.displayOrder),
        };
      });

      console.log("Mapped Courses:", courses);

      // Step 4: Validate mapped courses
      for (let i = 0; i < courses.length; i++) {
        const validation = courseSchema.safeParse(courses[i]);

        if (!validation.success) {
          throw new Error(
            `CSV Row ${i + 2}: ${validation.error.issues[0].message}`
          );
        }
      }

      // Step 5: Send courses to backend
      const response = await api.post(
        "/course/Bulk-Import-Courses",
        { courses }
      );

      const result = response.data;

      console.log("Bulk Import Result:", result);
      console.table(result.results || []);

      if (!result.status) {
        throw new Error(result.message || "Import failed");
      }

      // Step 6: Separate successful and failed records
      const successfulCourses = (result.results || []).filter(
        (item) => item.status === "success"
      );

      const failedCourses = (result.results || []).filter(
        (item) => item.status === "failed"
      );

      console.log("Successful Courses:", successfulCourses);
      console.log("Failed Courses:", failedCourses);

      // Step 7: Show import summary
      if (successfulCourses.length > 0) {
        toast.success(
          `${successfulCourses.length} courses imported successfully!`
        );

        window.dispatchEvent(
          new CustomEvent("courses-imported")
        );
      }

      if (failedCourses.length > 0) {
        const firstError = failedCourses[0];

        toast.error(
          `${failedCourses.length} failed. Row ${firstError.row}: ${firstError.message}`,
          { autoClose: 10000 }
        );
      }

      if (failedCourses.length === 0) {
        setOpen(false);
      }
    } catch (error) {
      console.error("Bulk Course Import Error:", error);

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to import courses",
        { autoClose: 10000 }
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

      {open && (
        <CSVImporter
          modalIsOpen={open}
          modalOnCloseTriggered={() => {
            if (!loading) setOpen(false);
          }}
          schema={courseSchema}
          onComplete={handleImport}
        />
      )}
    </>
  );
};

export default BulkCourseImport;
