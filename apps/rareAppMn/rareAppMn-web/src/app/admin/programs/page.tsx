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
  CREATE_PROGRAM,
  DELETE_PROGRAM,
  LIST_FACULTIES,
  LIST_PROGRAMS,
  UPDATE_PROGRAM,
} from "@/graphql/admin/operations";

interface Faculty {
  id: string;
  name: string;
  universityId: string;
  university: { id: string; name: string };
}

interface Program {
  id: string;
  name: string;
  degree: string;
  duration: string | null;
  language: string | null;
  isActive: boolean;
  universityId: string;
  facultyId: string;
  university: { id: string; name: string };
  faculty: { id: string; name: string };
}

export default function ProgramsAdminPage() {
  const { data, loading, error: queryError, refetch } = useQuery<{
    programs: Program[];
  }>(LIST_PROGRAMS);
  const { data: facultiesData } = useQuery<{ faculties: Faculty[] }>(LIST_FACULTIES);
  const [createProgram, { loading: creating }] = useMutation(CREATE_PROGRAM);
  const [updateProgram, { loading: updating }] = useMutation(UPDATE_PROGRAM);
  const [deleteProgram] = useMutation(DELETE_PROGRAM);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Program | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const faculties = facultiesData?.faculties ?? [];
  const facultyOptions = faculties.map((f) => ({
    value: f.id,
    label: `${f.name} — ${f.university.name}`,
  }));

  function openCreate() {
    setEditing(null);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEdit(row: Program) {
    setEditing(row);
    setFormError(null);
    setDialogOpen(true);
  }

  async function handleSubmit(values: FormValues) {
    setFormError(null);
    try {
      if (editing) {
        await updateProgram({
          variables: {
            id: editing.id,
            input: {
              name: values.name as string,
              degree: values.degree as string,
              duration: (values.duration as string) || null,
              language: (values.language as string) || null,
              isActive: Boolean(values.isActive),
            },
          },
        });
      } else {
        const facultyId = values.facultyId as string;
        const faculty = faculties.find((f) => f.id === facultyId);
        if (!faculty) {
          setFormError("Select a valid faculty.");
          return;
        }
        await createProgram({
          variables: {
            input: {
              universityId: faculty.universityId,
              facultyId,
              name: values.name as string,
              degree: values.degree as string,
              duration: (values.duration as string) || null,
              language: (values.language as string) || null,
              isActive: Boolean(values.isActive),
            },
          },
        });
      }
      setDialogOpen(false);
      await refetch();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  async function handleDelete(row: Program) {
    if (!confirm(`Delete program "${row.name}"?`)) return;
    try {
      await deleteProgram({ variables: { id: row.id } });
      await refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete.");
    }
  }

  const fields: FieldConfig[] = editing
    ? [
        { name: "name", label: "Name", type: "text", required: true },
        { name: "degree", label: "Degree", type: "text", required: true },
        { name: "duration", label: "Duration", type: "text" },
        { name: "language", label: "Language", type: "text" },
        { name: "isActive", label: "Active", type: "boolean" },
      ]
    : [
        {
          name: "facultyId",
          label: "Faculty",
          type: "select",
          required: true,
          options: facultyOptions,
          helpText: "University is derived from the faculty you pick.",
        },
        { name: "name", label: "Name", type: "text", required: true },
        { name: "degree", label: "Degree", type: "text", required: true },
        { name: "duration", label: "Duration", type: "text" },
        { name: "language", label: "Language", type: "text" },
        { name: "isActive", label: "Active", type: "boolean" },
      ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Programs</h1>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-sm border border-ink bg-ink px-4 py-2 text-xs font-medium uppercase tracking-wide text-paper"
        >
          + Add program
        </button>
      </div>

      {loading && <p className="text-sm text-ink-soft">Loading…</p>}
      {queryError && <p className="text-sm text-accent">{queryError.message}</p>}

      {data && (
        <DataTable
          columns={[
            { header: "Name", render: (r) => r.name },
            { header: "Degree", render: (r) => r.degree },
            { header: "University", render: (r) => r.university.name },
            { header: "Faculty", render: (r) => r.faculty.name },
            { header: "Active", render: (r) => (r.isActive ? "Yes" : "No") },
          ]}
          rows={data.programs}
          getRowId={(r) => r.id}
          onEdit={openEdit}
          onDelete={handleDelete}
          emptyMessage="No programs yet."
        />
      )}

      <EntityFormDialog
        open={dialogOpen}
        title={editing ? "Edit program" : "New program"}
        fields={fields}
        initialValues={
          editing
            ? {
                name: editing.name,
                degree: editing.degree,
                duration: editing.duration,
                language: editing.language,
                isActive: editing.isActive,
              }
            : {
                facultyId: "",
                name: "",
                degree: "",
                duration: "",
                language: "",
                isActive: true,
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
