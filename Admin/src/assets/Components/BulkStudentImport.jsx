
import { useState } from "react";
import { CSVImporter } from "@importcsv/react";
import { z } from "zod";
import api from "../../Api/axios";

const studentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().regex(/^\d{10}$/, "Phone must be 10 digits"),
});

export default function BulkStudentImport() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleComplete = async (result) => {
    const rows = result?.rows ?? [];

    if (!rows.length) {
      setMessage("CSV file mein koi student data nahi mila.");
      setIsOpen(false);
      return;
    }

    const validStudents = [];
    const invalidRows = [];

    rows.forEach((row, index) => {
      const parsed = studentSchema.safeParse(row);

      if (parsed.success) {
        validStudents.push(parsed.data);
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
        "/student/Bulk-Import-Students",
        { students: validStudents }
      );

      const data = response.data;

      setMessage(
        `Import complete! Total: ${data.total}, Successful: ${data.successful}, Failed: ${data.failed}`
      );
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Import failed. Login aur create permission check karo."
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
        {loading ? "Importing..." : "Add Bulk"}
      </button>

      {message && (
        <p className="mt-4 text-sm" role="status">
          {message}
        </p>
      )}

      <CSVImporter
        modalIsOpen={isOpen}
        modalOnCloseTriggered={() => setIsOpen(false)}
        schema={studentSchema}
        onComplete={handleComplete}
      />
    </div>
  );
}
