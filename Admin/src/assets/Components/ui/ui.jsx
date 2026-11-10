
// src/assets/Components/ui/index.jsx
// ============================================================
// StudentHub Shared UI Kit
// Students, Colleges, University, Stream, Degree, Course,
// Specialization, EmailTemplate and other Admin modules.
// ============================================================

import React, { useEffect, useState } from "react";
import {
  Eye,
  Pencil,
  Trash2,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Inbox,
} from "lucide-react";

// ================= TOKENS =================

export const ui = {
  page: "min-h-screen bg-slate-50 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8",
  container: "mx-auto w-full max-w-7xl",
  title: "text-xl font-bold tracking-tight text-slate-900 sm:text-2xl",
  subtitle: "mt-1 text-sm text-slate-500",
  card: "rounded-2xl bg-white shadow-sm ring-1 ring-slate-200",

  input:
    "w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 sm:text-sm",

  select:
    "w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 sm:text-sm",

  label: "mb-1.5 block text-sm font-medium text-slate-700",
  checkbox: "h-4 w-4 rounded border-slate-300 accent-indigo-600",

  btnPrimary:
    "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50",

  btnSecondary:
    "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50",

  btnDanger:
    "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50",

  btnLink:
    "text-sm font-semibold text-indigo-600 transition hover:text-indigo-700 focus:outline-none focus-visible:underline",

  iconBtn:
    "inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 sm:h-9 sm:w-9",

  iconBtnView: "hover:bg-indigo-50 hover:text-indigo-600",
  iconBtnEdit: "hover:bg-amber-50 hover:text-amber-600",
  iconBtnDelete: "hover:bg-rose-50 hover:text-rose-600",

  badge:
    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
};

export const badgeColor = {
  active: "bg-emerald-50 text-emerald-700",
  inactive: "bg-rose-50 text-rose-700",
  pending: "bg-amber-50 text-amber-700",
  role: "bg-sky-50 text-sky-700",
  default: "bg-slate-100 text-slate-600",
};

const dotColor = {
  active: "bg-emerald-500",
  inactive: "bg-rose-500",
  pending: "bg-amber-500",
  default: "bg-slate-400",
};

const hideBelowClass = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
  xl: "hidden xl:table-cell",
};

// ================= HOOKS =================

export const useDebounce = (value, delay = 400) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
};

// ================= PAGE HEADER =================

export const PageHeader = ({ title, subtitle, actions }) => (
  <div className="mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
    <div className="min-w-0">
      <h1 className={ui.title}>{title}</h1>
      {subtitle && <p className={ui.subtitle}>{subtitle}</p>}
    </div>

    {actions && (
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        {actions}
      </div>
    )}
  </div>
);

// ================= MODAL =================

const modalSize = {
  sm: "sm:max-w-md",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-3xl",
};

export const Modal = ({
  open,
  title,
  onClose,
  children,
  size = "sm",
  footer,
}) => {
  useEffect(() => {
    if (!open) return;

    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`flex max-h-[92vh] w-full flex-col rounded-t-3xl bg-white shadow-2xl sm:rounded-2xl ${
          modalSize[size] || modalSize.sm
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          {children}
        </div>

        {footer && (
          <div className="border-t border-slate-100 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// ================= SMALL PIECES =================

export const Field = ({ label, className = "", children }) => (
  <div className={className}>
    <label className={ui.label}>{label}</label>
    {children}
  </div>
);

export const DetailRow = ({ label, children }) => (
  <div className="flex items-start justify-between gap-4 py-3">
    <span className="shrink-0 text-sm text-slate-500">{label}</span>
    <span className="min-w-0 break-words text-right text-sm font-medium text-slate-900">
      {children}
    </span>
  </div>
);

export const StatusBadge = ({ status }) => {
  const key = String(status || "pending").toLowerCase();

  return (
    <span className={`${ui.badge} ${badgeColor[key] || badgeColor.default}`}>
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          dotColor[key] || dotColor.default
        }`}
      />
      {status || "Pending"}
    </span>
  );
};

export const StatusToggle = ({
  checked,
  onChange,
  disabled,
  label,
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label || "Toggle status"}
    disabled={disabled}
    onClick={onChange}
    title={label}
    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-50 ${
      checked ? "bg-emerald-500" : "bg-slate-300"
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
        checked ? "translate-x-6" : "translate-x-1"
      }`}
    />
  </button>
);

const avatarColors = [
  "bg-indigo-100 text-indigo-700",
  "bg-sky-100 text-sky-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-violet-100 text-violet-700",
];

export const Avatar = ({ name = "", size = "md" }) => {
  const text = String(name).trim();

  const initials =
    text
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?";

  const color = avatarColors[(text.charCodeAt(0) || 0) % avatarColors.length];
  const dimension = size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${dimension} ${color}`}
    >
      {initials}
    </span>
  );
};

// ================= ROW ACTIONS =================

export const RowActions = ({ onView, onEdit, onDelete }) => (
  <div className="flex items-center justify-end gap-2">
    {onView && (
      <button
        type="button"
        title="View"
        aria-label="View"
        onClick={onView}
        className={`${ui.iconBtn} ${ui.iconBtnView}`}
      >
        <Eye size={17} />
      </button>
    )}

    {onEdit && (
      <button
        type="button"
        title="Edit"
        aria-label="Edit"
        onClick={onEdit}
        className={`${ui.iconBtn} ${ui.iconBtnEdit}`}
      >
        <Pencil size={17} />
      </button>
    )}

    {onDelete && (
      <button
        type="button"
        title="Delete"
        aria-label="Delete"
        onClick={onDelete}
        className={`${ui.iconBtn} ${ui.iconBtnDelete}`}
      >
        <Trash2 size={17} />
      </button>
    )}
  </div>
);

// ================= FILTER BAR =================

export const FilterBar = ({ children, onClear, showClear }) => (
  <div className={`${ui.card} mb-5 space-y-3 p-3 sm:p-4`}>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-12">
      {children}
    </div>

    {showClear && (
      <div className="flex justify-end">
        <button type="button" onClick={onClear} className={ui.btnLink}>
          Clear filters
        </button>
      </div>
    )}
  </div>
);

export const SearchInput = ({
  value,
  onChange,
  placeholder,
  className = "",
}) => (
  <div className={`relative ${className}`}>
    <Search
      size={16}
      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
    />

    <input
      type="search"
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className={`${ui.input} pl-10`}
    />
  </div>
);

// ================= EMPTY + LOADING =================

export const EmptyState = ({ title, hint }) => (
  <div className={`${ui.card} flex flex-col items-center px-6 py-14 text-center`}>
    <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
      <Inbox size={22} />
    </span>

    <p className="text-sm font-semibold text-slate-700">{title}</p>

    {hint && (
      <p className="mt-1 max-w-xs text-sm text-slate-500">{hint}</p>
    )}
  </div>
);

export const ListSkeleton = ({ rows = 6 }) => (
  <div className={`${ui.card} divide-y divide-slate-100`} aria-busy="true">
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} className="flex animate-pulse items-center gap-3 p-4">
        <div className="h-10 w-10 rounded-full bg-slate-100" />

        <div className="flex-1 space-y-2">
          <div className="h-3 w-1/3 rounded bg-slate-100" />
          <div className="h-3 w-2/3 rounded bg-slate-100" />
        </div>

        <div className="hidden h-6 w-16 rounded-full bg-slate-100 sm:block" />
      </div>
    ))}
  </div>
);

// ================= DATA TABLE =================
// Supports:
// rowKey="_id"
// rowKey={(row) => row._id}

export const DataTable = ({
  columns,
  rows,
  rowKey = (row) => row._id,
  startIndex = 0,
  showIndex = true,
  selection,
  renderActions,
  renderCard,
  loading = false,
  emptyTitle = "No records found",
  emptyHint,
}) => {
  if (loading && rows.length === 0) return <ListSkeleton />;

  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} hint={emptyHint} />;
  }

  const getRowKey = (row, index) => {
    if (typeof rowKey === "function") {
      return rowKey(row);
    }

    return row?.[rowKey] ?? index;
  };

  return (
    <div className={`transition-opacity ${loading ? "opacity-60" : ""}`}>
      {/* DESKTOP / TABLET TABLE */}

      <div className={`${ui.card} hidden overflow-hidden md:block`}>
        <table className="w-full table-fixed text-sm">
          <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
            <tr>
              {selection && (
                <th className="w-12 px-4 py-3.5 text-left">
                  <input
                    type="checkbox"
                    checked={selection.allSelected}
                    onChange={selection.onToggleAll}
                    title="Select all on this page"
                    aria-label="Select all on this page"
                    className={ui.checkbox}
                  />
                </th>
              )}

              {showIndex && (
                <th className="w-12 px-4 py-3.5 text-left">#</th>
              )}

              {columns.map((column) => (
                <th
                  key={column.header}
                  className={`px-4 py-3.5 text-left ${
                    column.className || ""
                  } ${
                    column.hideBelow
                      ? hideBelowClass[column.hideBelow]
                      : ""
                  }`}
                >
                  {column.header}
                </th>
              ))}

              {renderActions && (
                <th className="w-32 px-4 py-3.5 text-right">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {rows.map((row, index) => {
              const id = getRowKey(row, index);

              return (
                <tr
                  key={id}
                  className="transition hover:bg-slate-50"
                >
                  {selection && (
                    <td className="px-4 py-3.5">
                      <input
                        type="checkbox"
                        checked={selection.selectedIds.includes(id)}
                        onChange={() => selection.onToggle(id)}
                        aria-label="Select row"
                        className={ui.checkbox}
                      />
                    </td>
                  )}

                  {showIndex && (
                    <td className="px-4 py-3.5 text-slate-400">
                      {startIndex + index + 1}
                    </td>
                  )}

                  {columns.map((column) => (
                    <td
                      key={column.header}
                      className={`px-4 py-3.5 text-slate-600 ${
                        column.truncate ? "truncate" : ""
                      } ${
                        column.hideBelow
                          ? hideBelowClass[column.hideBelow]
                          : ""
                      }`}
                    >
                      {column.cell(row)}
                    </td>
                  ))}

                  {renderActions && (
                    <td className="px-4 py-3.5">
                      {renderActions(row)}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MOBILE CARDS */}

      <div className="space-y-3 md:hidden">
        {rows.map((row, index) => (
          <div
            key={getRowKey(row, index)}
            className={`${ui.card} p-4`}
          >
            {renderCard && renderCard(row, index)}
          </div>
        ))}
      </div>
    </div>
  );
};

// ================= PAGINATION =================

const getPages = (current, total) => {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pageSet = new Set([
    1,
    total,
    current - 1,
    current,
    current + 1,
  ]);

  const list = [...pageSet]
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b);

  const output = [];

  list.forEach((page, index) => {
    if (index > 0 && page - list[index - 1] > 1) {
      output.push("...");
    }

    output.push(page);
  });

  return output;
};

export const Pagination = ({
  currentPage,
  totalPages,
  onChange,
}) => {
  if (totalPages <= 1) return null;

  const base =
    "flex h-10 min-w-[2.5rem] items-center justify-center rounded-lg px-3 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300";

  const idle =
    "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50";

  return (
    <div className="flex items-center justify-center gap-1.5 py-5">
      <button
        type="button"
        aria-label="Previous page"
        onClick={() => onChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className={`${base} ${idle} disabled:opacity-40`}
      >
        <ChevronLeft size={16} />
      </button>

      {/* MOBILE */}

      <span className="px-3 text-sm font-medium text-slate-600 sm:hidden">
        Page {currentPage} of {totalPages}
      </span>

      {/* TABLET / DESKTOP */}

      <div className="hidden items-center gap-1.5 sm:flex">
        {getPages(currentPage, totalPages).map((page, index) =>
          page === "..." ? (
            <span
              key={`dots-${index}`}
              className="px-1 text-slate-400"
            >
              …
            </span>
          ) : (
            <button
              type="button"
              key={page}
              onClick={() => onChange(page)}
              aria-current={page === currentPage ? "page" : undefined}
              className={`${base} ${
                page === currentPage
                  ? "bg-indigo-600 text-white shadow-sm"
                  : idle
              }`}
            >
              {page}
            </button>
          )
        )}
      </div>

      <button
        type="button"
        aria-label="Next page"
        onClick={() => onChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className={`${base} ${idle} disabled:opacity-40`}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
};
