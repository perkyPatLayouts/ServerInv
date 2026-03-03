import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useServers, useWebsites } from "../api/hooks";
import { useAuthStore } from "../stores/authStore";
import DataTable from "../components/ui/DataTable";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import ConfirmDialog from "../components/ui/ConfirmDialog";

interface WebsiteRow {
  id: number;
  domain: string;
  application: string | null;
  notes: string | null;
  serverName: string;
  serverId: number;
  serverIp: string | null;
  providerName: string | null;
  providerSiteUrl: string | null;
  providerControlPanelUrl: string | null;
}

/** Renders a provider name as a link with optional CP badge. */
function ProviderLink({ name, siteUrl, cpUrl }: { name: string; siteUrl?: string | null; cpUrl?: string | null }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {siteUrl ? (
        <a href={siteUrl} target="_blank" rel="noopener" className="text-accent hover:underline">{name}</a>
      ) : (
        <span>{name}</span>
      )}
      {cpUrl && (
        <a href={cpUrl} target="_blank" rel="noopener" className="text-[10px] px-1.5 py-0.5 rounded bg-accent/20 text-accent hover:bg-accent/30 font-medium leading-none" title="Control Panel">CP</a>
      )}
    </span>
  );
}

export default function WebsitesPage() {
  const { list } = useServers();
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const [editItem, setEditItem] = useState<WebsiteRow | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteItem, setDeleteItem] = useState<WebsiteRow | null>(null);

  const data = useMemo<WebsiteRow[]>(() => {
    return (list.data || []).flatMap((s) =>
      (s.websites || []).map((w) => ({
        id: w.id,
        domain: w.domain,
        application: w.application,
        notes: w.notes,
        serverName: s.name,
        serverId: s.id,
        serverIp: s.ip,
        providerName: s.providerName || null,
        providerSiteUrl: s.providerSiteUrl || null,
        providerControlPanelUrl: s.providerControlPanelUrl || null,
      }))
    );
  }, [list.data]);

  const columns: ColumnDef<WebsiteRow, any>[] = [
    { accessorKey: "domain", header: "Domain" },
    { accessorKey: "application", header: "Application", cell: ({ getValue }) => getValue() || "—" },
    { accessorKey: "serverName", header: "Server" },
    { accessorKey: "serverIp", header: "IP" },
    {
      accessorKey: "providerName",
      header: "Provider",
      cell: ({ row }) => {
        const w = row.original;
        return w.providerName ? (
          <ProviderLink name={w.providerName} siteUrl={w.providerSiteUrl} cpUrl={w.providerControlPanelUrl} />
        ) : "—";
      },
    },
    ...(isAdmin() ? [{
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

  const servers = list.data || [];

  return (
    <>
      <PageHeader title="Websites & Applications">
        {isAdmin() && <Button onClick={() => setShowCreate(true)}>Add Website</Button>}
      </PageHeader>
      {list.isLoading ? (
        <p className="text-text-secondary">Loading...</p>
      ) : (
        <DataTable
          data={data}
          columns={columns}
          renderCard={(row) => {
            const w = row.original;
            return (
              <div className="bg-surface border border-border rounded-lg p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-text-primary break-all">{w.domain}</h3>
                  {isAdmin() && (
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" variant="ghost" onClick={() => setEditItem(w)}>Edit</Button>
                      <Button size="sm" variant="ghost" className="text-danger" onClick={() => setDeleteItem(w)}>Del</Button>
                    </div>
                  )}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  {w.application && <div><span className="text-text-secondary text-xs">App</span><div className="text-text-primary">{w.application}</div></div>}
                  <div><span className="text-text-secondary text-xs">Server</span><div className="text-text-primary">{w.serverName}</div></div>
                  {w.serverIp && <div><span className="text-text-secondary text-xs">IP</span><div className="text-text-primary">{w.serverIp}</div></div>}
                  {w.providerName && (
                    <div>
                      <span className="text-text-secondary text-xs">Provider</span>
                      <div><ProviderLink name={w.providerName} siteUrl={w.providerSiteUrl} cpUrl={w.providerControlPanelUrl} /></div>
                    </div>
                  )}
                </div>
              </div>
            );
          }}
        />
      )}

      {(showCreate || editItem) && (
        <WebsiteFormModal
          open={showCreate || !!editItem}
          website={editItem}
          servers={servers.map((s) => ({ value: s.id, label: s.name }))}
          onClose={() => { setShowCreate(false); setEditItem(null); }}
        />
      )}

      {deleteItem && (
        <DeleteWebsiteDialog
          open={!!deleteItem}
          website={deleteItem}
          onClose={() => setDeleteItem(null)}
        />
      )}
    </>
  );
}

/** Modal for creating or editing a website. */
function WebsiteFormModal({ open, website, servers, onClose }: {
  open: boolean;
  website: WebsiteRow | null;
  servers: { value: number; label: string }[];
  onClose: () => void;
}) {
  const [serverId, setServerId] = useState<number>(website?.serverId || (servers[0]?.value ?? 0));
  const [domain, setDomain] = useState(website?.domain || "");
  const [application, setApplication] = useState(website?.application || "");
  const [notes, setNotes] = useState(website?.notes || "");

  // Use the hook for the selected server
  const activeServerId = website ? website.serverId : serverId;
  const { create, update } = useWebsites(activeServerId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) return;
    const payload = { domain, application: application || null, notes: notes || null };
    if (website) {
      await update.mutateAsync({ id: website.id, ...payload });
    } else {
      await create.mutateAsync(payload);
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={website ? "Edit Website" : "Add Website"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {!website && (
          <Select
            label="Server"
            value={serverId}
            onChange={(e) => setServerId(+e.target.value)}
            options={servers}
            placeholder="Select server..."
          />
        )}
        {website && (
          <div className="space-y-1">
            <label className="block text-sm font-medium text-text-primary">Server</label>
            <div className="text-sm text-text-secondary">{website.serverName}</div>
          </div>
        )}
        <Input label="Domain" value={domain} onChange={(e) => setDomain(e.target.value)} autoFocus />
        <Input label="Application" value={application} onChange={(e) => setApplication(e.target.value)} />
        <Input label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={create.isPending || update.isPending || !domain.trim()}>
            {website ? "Save" : "Create"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/** Confirm dialog for deleting a website. */
function DeleteWebsiteDialog({ open, website, onClose }: {
  open: boolean;
  website: WebsiteRow;
  onClose: () => void;
}) {
  const { remove } = useWebsites(website.serverId);

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={() => { remove.mutate(website.id); onClose(); }}
      title="Delete Website"
      message={`Delete "${website.domain}" from ${website.serverName}?`}
      loading={remove.isPending}
    />
  );
}
