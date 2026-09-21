"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { DataTable } from "@/components/admin/DataTable";
import {
  EntityFormDialog,
  type FieldConfig,
  type FormValues,
} from "@/components/admin/EntityFormDialog";
import {
  CREATE_ADMISSION_REQUIREMENT,
  DELETE_ADMISSION_REQUIREMENT,
  LIST_ADMISSION_REQUIREMENTS,
  LIST_PROGRAMS,
  LIST_SUBJECTS,
  UPDATE_ADMISSION_REQUIREMENT,
} from "@/graphql/admin/operations";

interface Program {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
}

interface AdmissionRequirement {
  id: string;
  programId: string;
  academicYear: string;
  minimumScore: number | null;
  description: string | null;
  program: Program;
  subjects: Subject[];
}

export default function AdmissionRequirementsAdminPage() {
  const { data, loading, error: queryError, refetch } = useQuery<{
    admissionRequirements: AdmissionRequirement[];
  }>(LIST_ADMISSION_REQUIREMENTS);
  const { data: programsData } = useQuery<{ programs: Program[] }>(LIST_PROGRAMS);
  const { data: subjectsData } = useQuery<{ subjects: Subject[] }>(LIST_SUBJECTS);
  const [createAdmissionRequirement, { loading: creating }] = useMutation(
    CREATE_ADMISSION_REQUIREMENT
  );
  const [updateAdmissionRequirement, { loading: updating }] = useMutation(
    UPDATE_ADMISSION_REQUIREMENT
  );
  const [deleteAdmissionRequirement] = useMutation(DELETE_ADMISSION_REQUIREMENT);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdmissionRequirement | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const programOptions =
    programsData?.programs.map((p) => ({ value: p.id, label: p.name })) ?? [];
  const subjectOptions =
    subjectsData?.subjects.map((s) => ({ value: s.id, label: s.name })) ?? [];

  function openCreate() {
    setEditing(null);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEdit(row: AdmissionRequirement) {
    setEditing(row);
    setFormError(null);
    setDialogOpen(true);
  }

  async function handleSubmit(values: FormValues) {
    setFormError(null);
    try {
      const shared = {
        academicYear: values.academicYear as string,
        minimumScore:
          values.minimumScore === null || values.minimumScore === undefined
            ? null
            : Number(values.minimumScore),
        description: (values.description as string) || null,
        subjectIds: (values.subjectIds as string[]) ?? [],
      };

      if (editing) {
        await updateAdmissionRequirement({
          variables: { id: editing.id, input: shared },
        });
      } else {
        await createAdmissionRequirement({
          variables: {
            input: { programId: values.programId as string, ...shared },
          },
        });
      }
      setDialogOpen(false);
      await refetch();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  async function handleDelete(row: AdmissionRequirement) {
    if (!confirm(`Delete this admission requirement for "${row.program.name}"?`)) return;
    try {
      await deleteAdmissionRequirement({ variables: { id: row.id } });
      await refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete.");
    }
  }

  const fields: FieldConfig[] = editing
    ? [
        { name: "academicYear", label: "Academic year", type: "text", required: true },
        { name: "minimumScore", label: "Minimum score", type: "number" },
        { name: "description", label: "Description", type: "textarea" },
        {
          name: "subjectIds",
          label: "Required subjects",
          type: "multiselect",
          options: subjectOptions,
          helpText: "Cmd/Ctrl-click to select multiple.",
        },
      ]
    : [
        {
          name: "programId",
          label: "Program",
          type: "select",
          required: true,
          options: programOptions,
        },
        { name: "academicYear", label: "Academic year", type: "text", required: true },
        { name: "minimumScore", label: "Minimum score", type: "number" },
        { name: "description", label: "Description", type: "textarea" },
        {
          name: "subjectIds",
          label: "Required subjects",
          type: "multiselect",
          options: subjectOptions,
          helpText: "Cmd/Ctrl-click to select multiple.",
        },
      ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Admission Requirements</h1>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-sm border border-ink bg-ink px-4 py-2 text-xs font-medium uppercase tracking-wide text-paper"
        >
          + Add requirement
        </button>
      </div>

      {loading && <p className="text-sm text-ink-soft">Loading…</p>}
      {queryError && <p className="text-sm text-accent">{queryError.message}</p>}

      {data && (
        <DataTable
          columns={[
            { header: "Program", render: (r) => r.program.name },
            { header: "Academic year", render: (r) => r.academicYear },
            { header: "Min. score", render: (r) => r.minimumScore ?? "—" },
            {
              header: "Subjects",
              render: (r) => r.subjects.map((s) => s.name).join(", ") || "—",
            },
          ]}
          rows={data.admissionRequirements}
          getRowId={(r) => r.id}
          onEdit={openEdit}
          onDelete={handleDelete}
          emptyMessage="No admission requirements yet."
        />
      )}

      <EntityFormDialog
        open={dialogOpen}
        title={editing ? "Edit admission requirement" : "New admission requirement"}
        fields={fields}
        initialValues={
          editing
            ? {
                academicYear: editing.academicYear,
                minimumScore: editing.minimumScore,
                description: editing.description,
                subjectIds: editing.subjects.map((s) => s.id),
              }
            : {
                programId: "",
                academicYear: "",
                minimumScore: null,
                description: "",
                subjectIds: [],
              }
        }
        submitting={creating || updating}
        error={formError}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
