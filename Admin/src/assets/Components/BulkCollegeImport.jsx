
import { useState } from "react";
import { CSVImporter } from "@importcsv/react";
import { z } from "zod";
import api from "../../Api/axios";
import { Upload } from "lucide-react";
const optionalString = z.string().optional();

const collegeSchema = z.object({
  name: z.string().min(1, "College name is required"),
  slug: z.string().min(1, "Slug is required"),

  logo: optionalString,
  backgroundImage: optionalString,
  description: optionalString,

  university: optionalString,
  collegeType: optionalString,
  ownership: optionalString,
  establishedYear: optionalString,

  address: optionalString,
  city: optionalString,
  state: optionalString,
  country: optionalString,
  pincode: optionalString,
  latitude: optionalString,
  longitude: optionalString,

  website: optionalString,
  contactEmail: optionalString,
  contactPhone: optionalString,

  accreditationName: optionalString,
  accreditationGrade: optionalString,
  accreditationYear: optionalString,

  rankingOrganization: optionalString,
  rankingRank: optionalString,
  rankingYear: optionalString,

  ratingAverage: optionalString,
  ratingCount: optionalString,
  facilitiesIds: optionalString,

  isVerified: optionalString,
  status: optionalString,
});
const formatFieldName = (key) =>
  key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase());

const formatValue = (value) => {
  if (value === undefined || value === null || String(value).trim() === "") {
    return "—";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
};

export default function BulkCollegeImport({onImportSuccess}) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [failedRows, setFailedRows] = useState([]);
  const [importedRows, setImportedRows] = useState([]);

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
        invalidRows.push({
          row: index + 1,
          errors: Object.values(parsed.error.flatten().fieldErrors)
            .flat()
            .join(", "),
        });
      }
    });

    if (invalidRows.length > 0) {
      setFailedRows(invalidRows);
      setMessage(
        `${invalidRows.length} row(s) mein invalid data hai. CSV headers aur values check karo.`
      );
      setIsOpen(false);
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setFailedRows([]);
      setImportedRows([]);

      const response = await api.post(
        "/college/Bulk-Import-Colleges",
        { colleges: validColleges }
      );

      const data = response.data;

      if(data.successful >0) {
        await onImportSuccess?.();
      }

      setMessage(
        `Import complete! Total: ${data.total}, Successful: ${data.successful}, Failed: ${data.failed}`
      );

      const resultByRow = new Map(
        (data.results || []).map((item) => [item.row, item])
      );

      const displayRows = validColleges.map((college, index) => {
        const result = resultByRow.get(index + 1);

        return {
          ...college,
          _importStatus: result?.status || "unknown",
          _importMessage: result?.message || "",
        };
      });

      setImportedRows(displayRows);

      const failures = (data.results || [])
        .filter((item) => item.status === "failed")
        .map((item) => ({
          row: item.row,
          errors: item.message,
        }));

      setFailedRows(failures);
    } catch (error) {
      console.error("College bulk import error:", error);

      setMessage(
        error.response?.data?.message ||
          error.message ||
          "Import failed. Login aur college.create permission check karo."
      );
    } finally {
      setLoading(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="w-full min-w-0 max-w-full p-2 sm:p-4">
      {/* Add Bulk Button */}
      <button
        type="button"
        onClick={() => {
          setMessage("");
          setFailedRows([]);
          setImportedRows([]);
          setIsOpen(true);
        }}
        disabled={loading}
        className="inline-flex max-w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:opacity-50 sm:px-5"
      >
        <Upload size={16} className="shrink-0" />
        {loading ? "Importing..." : "Add Bulk"}
      </button>

      {/* Import Summary */}
      {message && (
        <div className="mt-4 w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:p-4">
          <p className="break-words text-sm font-medium text-slate-700" role="status">
            {message}
          </p>

          {failedRows.length > 0 && (
            <div className="mt-3 min-w-0 space-y-2">
              <h4 className="text-sm font-semibold text-red-700">
                Failed Rows
              </h4>

              {failedRows.map((item, index) => (
                <p
                  key={`${item.row}-${index}`}
                  className="break-words text-sm text-red-600"
                >
                  Row {item.row}: {item.errors}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Imported College Details */}
      {importedRows.length > 0 && (
        <div className="mt-5 w-full min-w-0 space-y-4 sm:mt-6 sm:space-y-5">
          <div className="min-w-0">
            <h3 className="break-words text-base font-bold text-slate-800 sm:text-lg">
              Imported College Details
            </h3>

            <p className="mt-1 break-words text-xs text-slate-500 sm:text-sm">
              Complete college data with import status.
            </p>
          </div>

          {importedRows.map((college, index) => {
            const fields = Object.entries(college).filter(
              ([key]) => !key.startsWith("_")
            );

            return (
              <div
                key={`${college.slug}-${index}`}
                className="w-full min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                {/* College Header */}
                <div className="flex min-w-0 flex-col gap-3 border-b border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                  <div className="w-full min-w-0">
                    <h4 className="break-words text-sm font-semibold text-slate-800 sm:text-base">
                      {index + 1}. {college.name}
                    </h4>

                    <p className="mt-1 break-all text-xs text-slate-500">
                      {college.slug}
                    </p>
                  </div>

                  <span
                    className={`w-fit shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                      college._importStatus === "success"
                        ? "bg-green-100 text-green-700"
                        : college._importStatus === "failed"
                        ? "bg-red-100 text-red-700"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {college._importStatus}
                  </span>
                </div>

                {/* Responsive Field / Data Details */}
                <div className="w-full min-w-0">
                  {fields.map(([key, value]) => (
                    <div
                      key={key}
                      className="grid min-w-0 grid-cols-1 gap-1 border-b border-slate-100 p-3 last:border-b-0 sm:grid-cols-[minmax(120px,35%)_minmax(0,1fr)] sm:gap-3 sm:p-3 md:grid-cols-[minmax(150px,38%)_minmax(0,1fr)]"
                    >
                      <div className="min-w-0">
                        <p className="break-words text-xs font-semibold text-slate-500 sm:text-sm">
                          {formatFieldName(key)}
                        </p>
                      </div>

                      <div className="min-w-0">
                        <p className="break-all text-sm leading-5 text-slate-800">
                          {formatValue(value)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Import Message */}
                {college._importMessage && (
                  <div className="min-w-0 border-t border-slate-200 bg-slate-50 p-3">
                    <p className="break-words text-xs text-slate-600 sm:text-sm">
                      {college._importMessage}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CSV Importer */}
      <CSVImporter
        modalIsOpen={isOpen}
        modalOnCloseTriggered={() => setIsOpen(false)}
        schema={collegeSchema}
        onComplete={handleComplete}
      />
    </div>
  );
}
