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
  CREATE_SUBJECT,
  DELETE_SUBJECT,
  LIST_SUBJECTS,
  UPDATE_SUBJECT,
} from "@/graphql/admin/operations";

interface Subject {
  id: string;
  name: string;
}

const FIELDS: FieldConfig[] = [
  { name: "name", label: "Name", type: "text", required: true },
];

export default function SubjectsAdminPage() {
  const { data, loading, error: queryError, refetch } = useQuery<{
    subjects: Subject[];
  }>(LIST_SUBJECTS);
  const [createSubject, { loading: creating }] = useMutation(CREATE_SUBJECT);
  const [updateSubject, { loading: updating }] = useMutation(UPDATE_SUBJECT);
  const [deleteSubject] = useMutation(DELETE_SUBJECT);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEdit(row: Subject) {
    setEditing(row);
    setFormError(null);
    setDialogOpen(true);
  }

  async function handleSubmit(values: FormValues) {
    setFormError(null);
    try {
      const input = { name: values.name as string };
      if (editing) {
        await updateSubject({ variables: { id: editing.id, input } });
      } else {
        await createSubject({ variables: { input } });
      }
      setDialogOpen(false);
      await refetch();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  async function handleDelete(row: Subject) {
    if (
      !confirm(
        `Delete subject "${row.name}"? This removes it from any admission requirements that reference it.`
      )
    ) {
      return;
    }
    try {
      await deleteSubject({ variables: { id: row.id } });
      await refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete.");
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Subjects</h1>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-sm border border-ink bg-ink px-4 py-2 text-xs font-medium uppercase tracking-wide text-paper"
        >
          + Add subject
        </button>
      </div>

      {loading && <p className="text-sm text-ink-soft">Loading…</p>}
      {queryError && <p className="text-sm text-accent">{queryError.message}</p>}

      {data && (
        <DataTable
          columns={[{ header: "Name", render: (r) => r.name }]}
          rows={data.subjects}
          getRowId={(r) => r.id}
          onEdit={openEdit}
          onDelete={handleDelete}
          emptyMessage="No subjects yet."
        />
      )}

      <EntityFormDialog
        open={dialogOpen}
        title={editing ? "Edit subject" : "New subject"}
        fields={FIELDS}
        initialValues={editing ? { name: editing.name } : { name: "" }}
        submitting={creating || updating}
        error={formError}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
