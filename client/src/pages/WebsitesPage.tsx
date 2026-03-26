import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useApps, useServers } from "../api/hooks";
import { useAuthStore } from "../stores/authStore";
import { App } from "../types";
import DataTable from "../components/ui/DataTable";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import Input from "../components/ui/Input";
import Textarea from "../components/ui/Textarea";
import ConfirmDialog from "../components/ui/ConfirmDialog";

interface AppRow extends App {
  serverCount: number;
}

export default function WebsitesPage() {
  const { list: appsList, create, update, remove } = useApps();
  const { list: serversList } = useServers();
  const isEditorOrAdmin = useAuthStore((s) => s.isEditorOrAdmin);
  const [editItem, setEditItem] = useState<App | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteItem, setDeleteItem] = useState<App | null>(null);
  const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set());

  const data = useMemo<AppRow[]>(() => {
    const servers = serversList.data || [];
    const apps = appsList.data || [];

    return apps.map((app) => {
      const serverCount = servers.filter((s) =>
        s.apps?.some((sa) => sa.appId === app.id)
      ).length;
      return { ...app, serverCount };
    });
  }, [appsList.data, serversList.data]);

  const toggleNotes = (id: number) => {
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const columns: ColumnDef<AppRow, any>[] = [
    { accessorKey: "name", header: "App Name" },
    {
      accessorKey: "notes",
      header: "Notes",
      cell: ({ row }) => {
        const app = row.original;
        if (!app.notes) return "—";
        const isExpanded = expandedNotes.has(app.id);
        const truncated = app.notes.length > 100 ? app.notes.slice(0, 100) + "..." : app.notes;
        return (
          <div>
            <p className="whitespace-pre-wrap break-words">
              {isExpanded ? app.notes : truncated}
            </p>
            {app.notes.length > 100 && (
              <button
                onClick={() => toggleNotes(app.id)}
                className="text-xs text-accent hover:underline mt-1"
              >
                {isExpanded ? "Show less" : "Show more"}
              </button>
            )}
          </div>
        );
      },
    },
    { accessorKey: "serverCount", header: "Servers" },
    ...(isEditorOrAdmin() ? [{
      id: "actions" as const,
      header: "Actions",
      cell: ({ row }: any) => (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => setEditItem(row.original)}>Edit</Button>
          <Button size="sm" variant="ghost" className="text-danger" onClick={() => setDeleteItem(row.original)}>Delete</Button>
        </div>
      ),
    }] : []),
  ];

  return (
    <>
      <PageHeader title="Apps">
        {isEditorOrAdmin() && <Button onClick={() => setShowCreate(true)}>Add App</Button>}
      </PageHeader>
      {appsList.isLoading ? (
        <p className="text-text-secondary">Loading...</p>
      ) : (
        <DataTable
          data={data}
          columns={columns}
          defaultSort={[{ id: "name", desc: false }]}
          renderCard={(row) => {
            const app = row.original;
            const isExpanded = expandedNotes.has(app.id);
            const truncated = app.notes && app.notes.length > 200 ? app.notes.slice(0, 200) + "..." : app.notes;
            return (
              <div className="bg-surface border border-border rounded-lg p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-text-primary">{app.name}</h3>
                  {isEditorOrAdmin() && (
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" variant="ghost" onClick={() => setEditItem(app)}>Edit</Button>
                      <Button size="sm" variant="ghost" className="text-danger" onClick={() => setDeleteItem(app)}>Del</Button>
                    </div>
                  )}
                </div>
                <div className="mt-2 space-y-2 text-sm">
                  {app.notes && (
                    <div>
                      <span className="text-text-secondary text-xs">Notes</span>
                      <div className="text-text-primary whitespace-pre-wrap break-words">
                        {isExpanded ? app.notes : truncated}
                      </div>
                      {app.notes.length > 200 && (
                        <button
                          onClick={() => toggleNotes(app.id)}
                          className="text-xs text-accent hover:underline mt-1"
                        >
                          {isExpanded ? "Show less" : "Show more"}
                        </button>
                      )}
                    </div>
                  )}
                  <div>
                    <span className="text-text-secondary text-xs">Servers</span>
                    <div className="text-text-primary">{app.serverCount}</div>
                  </div>
                </div>
              </div>
            );
          }}
        />
      )}

      {(showCreate || editItem) && (
        <AppFormModal
          open={showCreate || !!editItem}
          app={editItem}
          create={create}
          update={update}
          onClose={() => { setShowCreate(false); setEditItem(null); }}
        />
      )}

      {deleteItem && (
        <DeleteAppDialog
          open={!!deleteItem}
          app={deleteItem}
          remove={remove}
          onClose={() => setDeleteItem(null)}
        />
      )}
    </>
  );
}

/** Modal for creating or editing an app. */
function AppFormModal({ open, app, create, update, onClose }: {
  open: boolean;
  app: App | null;
  create: any;
  update: any;
  onClose: () => void;
}) {
  const [name, setName] = useState(app?.name || "");
  const [notes, setNotes] = useState(app?.notes || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const payload = { name, notes: notes || null };
    if (app) {
      await update.mutateAsync({ id: app.id, ...payload });
    } else {
      await create.mutateAsync(payload);
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={app ? "Edit App" : "Add App"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="App Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          maxLength={200}
        />
        <Textarea
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={6}
          maxLength={32000}
        />
        <div className="text-xs text-text-secondary text-right">
          {notes.length} / 32,000 characters
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={create.isPending || update.isPending || !name.trim()}>
            {app ? "Save" : "Create"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/** Confirm dialog for deleting an app. */
function DeleteAppDialog({ open, app, remove, onClose }: {
  open: boolean;
  app: App;
  remove: any;
  onClose: () => void;
}) {
  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={() => { remove.mutate(app.id); onClose(); }}
      title="Delete App"
      message={`Delete "${app.name}"? This will remove it from all servers.`}
      loading={remove.isPending}
    />
  );
}
