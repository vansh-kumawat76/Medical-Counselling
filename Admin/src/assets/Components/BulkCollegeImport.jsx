import { useState } from "react";
import { CSVImporter } from "@importcsv/react";
import { z } from "zod";
import api from "../../Api/axios";

const collegeSchema = z.object({
  name: z.string().min(1, "College name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  university: z.string().optional(),
  collegeType: z.string().optional(),
  ownership: z.string().optional(),
  establishedYear: z.string().optional(),
  location: z.string().optional(),
  website: z.string().optional(),
  contact: z.string().optional(),
  accreditation: z.string().optional(),
  ranking: z.string().optional(),
  rating: z.string().optional(),
  facilities: z.string().optional(),
  isVerified: z.string().optional(),
  status: z.string().optional(),
});

export default function BulkCollegeImport() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleComplete = async (result) => {
    const rows = result?.rows ?? [];

    if (!rows.length) {
      setMessage("CSV file mein koi college data nahi mila.");
      setIsOpen(false);
      return;
    }

    if (rows.length > 500) {
      setMessage("Ek baar mein maximum 500 colleges import kar sakte ho.");
      setIsOpen(false);
      return;
    }

    const validColleges = [];
    const invalidRows = [];

    rows.forEach((row, index) => {
      const parsed = collegeSchema.safeParse(row);

      if (parsed.success) {
        validColleges.push(parsed.data);
      } else {
        invalidRows.push(index + 1);
      }
    });

    if (invalidRows.length > 0) {
      setMessage(
        `Rows ${invalidRows.join(", ")} mein invalid data hai. CSV check karke dobara import karo.`
      );
      setIsOpen(false);
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const response = await api.post(
        "/college/Bulk-Import-Colleges",
        { colleges: validColleges }
      );

      const data = response.data;

      setMessage(
        `Import complete! Total: ${data.total}, Successful: ${data.successful}, Failed: ${data.failed}`
      );
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Import failed. Login aur college.create permission check karo."
      );
    } finally {
      setLoading(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="p-4">
      <button
        type="button"
        onClick={() => {
          setMessage("");
          setIsOpen(true);
        }}
        disabled={loading}
        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Importing..." : "Import Colleges"}
      </button>

      {message && (
        <p className="mt-4 text-sm" role="status">
          {message}
        </p>
      )}

      <CSVImporter
        modalIsOpen={isOpen}
        modalOnCloseTriggered={() => setIsOpen(false)}
        schema={collegeSchema}
        onComplete={handleComplete}
      />
    </div>
  );
}
