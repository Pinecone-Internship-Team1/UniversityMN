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
  CREATE_UNIVERSITY,
  DELETE_UNIVERSITY,
  LIST_UNIVERSITIES,
  UPDATE_UNIVERSITY,
} from "@/graphql/admin/operations";

interface University {
  id: string;
  name: string;
  shortName: string | null;
  type: string | null;
  location: string | null;
  isActive: boolean;
}

const FIELDS: FieldConfig[] = [
  { name: "name", label: "Name", type: "text", required: true },
  { name: "shortName", label: "Short name", type: "text" },
  { name: "type", label: "Type", type: "text" },
  { name: "location", label: "Location", type: "text" },
  { name: "isActive", label: "Active", type: "boolean" },
];

export default function UniversitiesAdminPage() {
  const { data, loading, error: queryError, refetch } = useQuery<{
    universities: University[];
  }>(LIST_UNIVERSITIES);
  const [createUniversity, { loading: creating }] = useMutation(CREATE_UNIVERSITY);
  const [updateUniversity, { loading: updating }] = useMutation(UPDATE_UNIVERSITY);
  const [deleteUniversity] = useMutation(DELETE_UNIVERSITY);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<University | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEdit(row: University) {
    setEditing(row);
    setFormError(null);
    setDialogOpen(true);
  }

  async function handleSubmit(values: FormValues) {
    setFormError(null);
    try {
      const input = {
        name: values.name as string,
        shortName: (values.shortName as string) || null,
        type: (values.type as string) || null,
        location: (values.location as string) || null,
        isActive: Boolean(values.isActive),
      };
      if (editing) {
        await updateUniversity({ variables: { id: editing.id, input } });
      } else {
        await createUniversity({ variables: { input } });
      }
      setDialogOpen(false);
      await refetch();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  async function handleDelete(row: University) {
    if (
      !confirm(
        `Delete university "${row.name}"? This also deletes its faculties and programs.`
      )
    ) {
      return;
    }
    try {
      await deleteUniversity({ variables: { id: row.id } });
      await refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete.");
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Universities</h1>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-sm border border-ink bg-ink px-4 py-2 text-xs font-medium uppercase tracking-wide text-paper"
        >
          + Add university
        </button>
      </div>

      {loading && <p className="text-sm text-ink-soft">Loading…</p>}
      {queryError && <p className="text-sm text-accent">{queryError.message}</p>}

      {data && (
        <DataTable
          columns={[
            { header: "Name", render: (r) => r.name },
            { header: "Short name", render: (r) => r.shortName ?? "—" },
            { header: "Type", render: (r) => r.type ?? "—" },
            { header: "Location", render: (r) => r.location ?? "—" },
            { header: "Active", render: (r) => (r.isActive ? "Yes" : "No") },
          ]}
          rows={data.universities}
          getRowId={(r) => r.id}
          onEdit={openEdit}
          onDelete={handleDelete}
          emptyMessage="No universities yet."
        />
      )}

      <EntityFormDialog
        open={dialogOpen}
        title={editing ? "Edit university" : "New university"}
        fields={FIELDS}
        initialValues={
          editing
            ? {
                name: editing.name,
                shortName: editing.shortName,
                type: editing.type,
                location: editing.location,
                isActive: editing.isActive,
              }
            : { name: "", shortName: "", type: "", location: "", isActive: true }
        }
        submitting={creating || updating}
        error={formError}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
