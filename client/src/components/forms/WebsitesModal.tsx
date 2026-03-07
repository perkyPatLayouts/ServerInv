import { useState } from "react";
import { useWebsites } from "../../api/hooks";
import { useAuthStore } from "../../stores/authStore";
import { Server, Website } from "../../types";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Button from "../ui/Button";

interface Props {
  open: boolean;
  server: Server;
  onClose: () => void;
}

export default function WebsitesModal({ open, server, onClose }: Props) {
  const { list, create, update, remove } = useWebsites(server.id);
  const isEditorOrAdmin = useAuthStore((s) => s.isEditorOrAdmin);
  const [editing, setEditing] = useState<Website | null>(null);
  const [domain, setDomain] = useState("");
  const [application, setApplication] = useState("");
  const [notes, setNotes] = useState("");

  const startEdit = (w: Website) => {
    setEditing(w);
    setDomain(w.domain);
    setApplication(w.application || "");
    setNotes(w.notes || "");
  };

  const resetForm = () => {
    setEditing(null);
    setDomain("");
    setApplication("");
    setNotes("");
  };

  const handleSave = async () => {
    if (!domain.trim()) return;
    const payload = { domain, application: application || null, notes: notes || null };
    if (editing) {
      await update.mutateAsync({ id: editing.id, ...payload });
    } else {
      await create.mutateAsync(payload);
    }
    resetForm();
  };

  return (
    <Modal open={open} onClose={onClose} title={`Websites — ${server.name}`}>
      <div className="space-y-4">
        {list.data?.map((w: Website) => (
          <div key={w.id} className="flex items-center justify-between border border-border rounded px-3 py-2">
            <div>
              <div className="text-sm font-medium text-text-primary">{w.domain}</div>
              {w.application && <div className="text-xs text-text-secondary">{w.application}</div>}
            </div>
            {isEditorOrAdmin() && (
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => startEdit(w)}>Edit</Button>
                <Button size="sm" variant="ghost" className="text-danger" onClick={() => remove.mutate(w.id)}>Delete</Button>
              </div>
            )}
          </div>
        ))}
        {list.data?.length === 0 && <p className="text-sm text-text-secondary">No websites</p>}

        {isEditorOrAdmin() && (
          <div className="border-t border-border pt-4 space-y-3">
            <h3 className="text-sm font-medium text-text-primary">{editing ? "Edit Website" : "Add Website"}</h3>
            <Input label="Domain" value={domain} onChange={(e) => setDomain(e.target.value)} />
            <Input label="Application" value={application} onChange={(e) => setApplication(e.target.value)} />
            <Input label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={create.isPending || update.isPending}>
                {editing ? "Update" : "Add"}
              </Button>
              {editing && <Button size="sm" variant="secondary" onClick={resetForm}>Cancel</Button>}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
