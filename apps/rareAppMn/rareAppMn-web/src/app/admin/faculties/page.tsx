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
  CREATE_FACULTY,
  DELETE_FACULTY,
  LIST_FACULTIES,
  LIST_UNIVERSITIES,
  UPDATE_FACULTY,
} from "@/graphql/admin/operations";

interface University {
  id: string;
  name: string;
}

interface Faculty {
  id: string;
  name: string;
  description: string | null;
  universityId: string;
  university: University;
}

export default function FacultiesAdminPage() {
  const { data, loading, error: queryError, refetch } = useQuery<{
    faculties: Faculty[];
  }>(LIST_FACULTIES);
  const { data: universitiesData } = useQuery<{ universities: University[] }>(
    LIST_UNIVERSITIES
  );
  const [createFaculty, { loading: creating }] = useMutation(CREATE_FACULTY);
  const [updateFaculty, { loading: updating }] = useMutation(UPDATE_FACULTY);
  const [deleteFaculty] = useMutation(DELETE_FACULTY);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Faculty | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const universityOptions =
    universitiesData?.universities.map((u) => ({ value: u.id, label: u.name })) ?? [];

  function openCreate() {
    setEditing(null);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEdit(row: Faculty) {
    setEditing(row);
    setFormError(null);
    setDialogOpen(true);
  }

  async function handleSubmit(values: FormValues) {
    setFormError(null);
    try {
      if (editing) {
        await updateFaculty({
          variables: {
            id: editing.id,
            input: {
              name: values.name as string,
              description: (values.description as string) || null,
            },
          },
        });
      } else {
        await createFaculty({
          variables: {
            input: {
              universityId: values.universityId as string,
              name: values.name as string,
              description: (values.description as string) || null,
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

  async function handleDelete(row: Faculty) {
    if (
      !confirm(`Delete faculty "${row.name}"? This also deletes its programs.`)
    ) {
      return;
    }
    try {
      await deleteFaculty({ variables: { id: row.id } });
      await refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete.");
    }
  }

  const fields: FieldConfig[] = editing
    ? [
        { name: "name", label: "Name", type: "text", required: true },
        { name: "description", label: "Description", type: "textarea" },
      ]
    : [
        {
          name: "universityId",
          label: "University",
          type: "select",
          required: true,
          options: universityOptions,
        },
        { name: "name", label: "Name", type: "text", required: true },
        { name: "description", label: "Description", type: "textarea" },
      ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Faculties</h1>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-sm border border-ink bg-ink px-4 py-2 text-xs font-medium uppercase tracking-wide text-paper"
        >
          + Add faculty
        </button>
      </div>

      {loading && <p className="text-sm text-ink-soft">Loading…</p>}
      {queryError && <p className="text-sm text-accent">{queryError.message}</p>}

      {data && (
        <DataTable
          columns={[
            { header: "Name", render: (r) => r.name },
            { header: "University", render: (r) => r.university.name },
            { header: "Description", render: (r) => r.description ?? "—" },
          ]}
          rows={data.faculties}
          getRowId={(r) => r.id}
          onEdit={openEdit}
          onDelete={handleDelete}
          emptyMessage="No faculties yet."
        />
      )}

      <EntityFormDialog
        open={dialogOpen}
        title={editing ? "Edit faculty" : "New faculty"}
        fields={fields}
        initialValues={
          editing
            ? { name: editing.name, description: editing.description }
            : { universityId: "", name: "", description: "" }
        }
        submitting={creating || updating}
        error={formError}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
