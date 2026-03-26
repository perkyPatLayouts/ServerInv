import { useState } from "react";
import { useServerApps, useApps } from "../../api/hooks";
import { useAuthStore } from "../../stores/authStore";
import { Server, ServerApp } from "../../types";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";

interface Props {
  open: boolean;
  server: Server;
  onClose: () => void;
}

export default function ServerAppsModal({ open, server, onClose }: Props) {
  const { list: serverAppsList, create, update, remove } = useServerApps(server.id);
  const { list: appsList } = useApps();
  const isEditorOrAdmin = useAuthStore((s) => s.isEditorOrAdmin);
  const [editing, setEditing] = useState<ServerApp | null>(null);
  const [selectedAppId, setSelectedAppId] = useState<number>(0);
  const [url, setUrl] = useState("");

  const startEdit = (sa: ServerApp) => {
    setEditing(sa);
    setSelectedAppId(sa.appId);
    setUrl(sa.url || "");
  };

  const resetForm = () => {
    setEditing(null);
    setSelectedAppId(0);
    setUrl("");
  };

  const handleSave = async () => {
    if (!selectedAppId && !editing) return;
    const payload = editing
      ? { url: url || null }
      : { appId: selectedAppId, url: url || null };

    if (editing) {
      await update.mutateAsync({ id: editing.id, ...payload });
    } else {
      await create.mutateAsync(payload);
    }
    resetForm();
  };

  // Get list of apps already assigned to this server
  const assignedAppIds = new Set(serverAppsList.data?.map((sa: ServerApp) => sa.appId) || []);

  // Filter available apps (exclude already assigned ones)
  const availableApps = (appsList.data || [])
    .filter((app) => !assignedAppIds.has(app.id))
    .map((app) => ({ value: app.id, label: app.name }));

  return (
    <Modal open={open} onClose={onClose} title={`Applications — ${server.name}`}>
      <div className="space-y-4">
        {serverAppsList.data?.map((sa: ServerApp) => (
          <div key={sa.id} className="flex items-start justify-between border border-border rounded px-3 py-2 gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-text-primary">{sa.appName}</div>
              {sa.url && (
                <a
                  href={sa.url.startsWith("http") ? sa.url : `https://${sa.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-accent hover:underline break-all"
                >
                  {sa.url}
                </a>
              )}
              {!sa.url && <div className="text-xs text-text-secondary">No URL</div>}
            </div>
            {isEditorOrAdmin() && (
              <div className="flex gap-1 shrink-0">
                <Button size="sm" variant="ghost" onClick={() => startEdit(sa)}>Edit</Button>
                <Button size="sm" variant="ghost" className="text-danger" onClick={() => remove.mutate(sa.id)}>Del</Button>
              </div>
            )}
          </div>
        ))}
        {serverAppsList.data?.length === 0 && <p className="text-sm text-text-secondary">No applications</p>}

        {isEditorOrAdmin() && (
          <div className="border-t border-border pt-4 space-y-3">
            <h3 className="text-sm font-medium text-text-primary">{editing ? "Edit Application" : "Add Application"}</h3>
            {!editing && (
              <Select
                label="Application"
                value={selectedAppId}
                onChange={(e) => setSelectedAppId(+e.target.value)}
                options={availableApps}
                placeholder="Select application..."
                disabled={availableApps.length === 0}
              />
            )}
            {editing && (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-text-primary">Application</label>
                <div className="text-sm text-text-secondary">{editing.appName}</div>
              </div>
            )}
            <Input
              label="URL (optional)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="example.com/app or https://example.com"
              maxLength={500}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={create.isPending || update.isPending || (!editing && !selectedAppId)}
              >
                {editing ? "Update" : "Add"}
              </Button>
              {editing && <Button size="sm" variant="secondary" onClick={resetForm}>Cancel</Button>}
            </div>
            {availableApps.length === 0 && !editing && (
              <p className="text-xs text-text-secondary">All apps are already assigned to this server.</p>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
