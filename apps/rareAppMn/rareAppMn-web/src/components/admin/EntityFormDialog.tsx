"use client";

import { useEffect, useState } from "react";

export type FieldValue = string | number | boolean | string[] | null;
export type FormValues = Record<string, FieldValue>;

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldConfig {
  name: string;
  label: string;
  type: "text" | "textarea" | "number" | "boolean" | "select" | "multiselect";
  required?: boolean;
  options?: FieldOption[];
  helpText?: string;
}

interface EntityFormDialogProps {
  open: boolean;
  title: string;
  fields: FieldConfig[];
  initialValues: FormValues;
  submitting?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (values: FormValues) => void;
}

const inputClasses =
  "rounded-sm border border-border-ink bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-ink";

export function EntityFormDialog({
  open,
  title,
  fields,
  initialValues,
  submitting,
  error,
  onClose,
  onSubmit,
}: EntityFormDialogProps) {
  const [values, setValues] = useState<FormValues>(initialValues);

  useEffect(() => {
    if (open) setValues(initialValues);
    // Intentionally re-runs only on `open`: re-including `initialValues`
    // would reset the form on every parent re-render while it's open.
  }, [open]);

  if (!open) return null;

  function setField(name: string, value: FieldValue) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-md border border-border-ink bg-card p-6 shadow-xl">
        <h2 className="mb-5 font-display text-lg font-semibold text-ink">{title}</h2>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(values);
          }}
          className="flex flex-col gap-4"
        >
          {fields.map((field) => (
            <div key={field.name} className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-[0.06em] text-ink-soft">
                {field.label}
                {field.required && <span className="text-accent"> *</span>}
              </label>

              {field.type === "text" && (
                <input
                  type="text"
                  required={field.required}
                  value={(values[field.name] as string) ?? ""}
                  onChange={(e) => setField(field.name, e.target.value)}
                  className={inputClasses}
                />
              )}

              {field.type === "textarea" && (
                <textarea
                  required={field.required}
                  value={(values[field.name] as string) ?? ""}
                  onChange={(e) => setField(field.name, e.target.value)}
                  rows={3}
                  className={inputClasses}
                />
              )}

              {field.type === "number" && (
                <input
                  type="number"
                  required={field.required}
                  value={values[field.name] === null || values[field.name] === undefined ? "" : (values[field.name] as number)}
                  onChange={(e) =>
                    setField(field.name, e.target.value === "" ? null : Number(e.target.value))
                  }
                  className={inputClasses}
                />
              )}

              {field.type === "boolean" && (
                <input
                  type="checkbox"
                  checked={Boolean(values[field.name])}
                  onChange={(e) => setField(field.name, e.target.checked)}
                  className="h-4 w-4 self-start"
                />
              )}

              {field.type === "select" && (
                <select
                  required={field.required}
                  value={(values[field.name] as string) ?? ""}
                  onChange={(e) => setField(field.name, e.target.value)}
                  className={inputClasses}
                >
                  <option value="" disabled>
                    Select…
                  </option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}

              {field.type === "multiselect" && (
                <select
                  multiple
                  value={(values[field.name] as string[]) ?? []}
                  onChange={(e) =>
                    setField(
                      field.name,
                      Array.from(e.target.selectedOptions, (opt) => opt.value)
                    )
                  }
                  className={`${inputClasses} min-h-[110px]`}
                >
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}

              {field.helpText && (
                <p className="text-xs text-ink-soft">{field.helpText}</p>
              )}
            </div>
          ))}

          {error && (
            <p className="rounded-sm bg-accent-soft px-3 py-2 text-sm text-accent">{error}</p>
          )}

          <div className="mt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm border border-border-ink px-4 py-2 text-xs font-medium uppercase tracking-wide text-ink"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-sm border border-ink bg-ink px-4 py-2 text-xs font-medium uppercase tracking-wide text-paper disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
