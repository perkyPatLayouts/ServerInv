import { ColumnDef } from "@tanstack/react-table";
import { useServers } from "../api/hooks";
import { Server } from "../types";
import DataTable from "../components/ui/DataTable";
import PageHeader from "../components/ui/PageHeader";

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

export default function ServerIpsPage() {
  const { list } = useServers();
  const columns: ColumnDef<Server, any>[] = [
    { accessorKey: "name", header: "Server" },
    { accessorKey: "ip", header: "IP Address" },
    {
      accessorKey: "providerName",
      header: "Provider",
      cell: ({ row }) => {
        const s = row.original;
        return s.providerName ? (
          <ProviderLink name={s.providerName} siteUrl={s.providerSiteUrl} cpUrl={s.providerControlPanelUrl} />
        ) : "—";
      },
    },
    {
      id: "location",
      header: "Location",
      accessorFn: (r) => [r.locationCity, r.locationCountry].filter(Boolean).join(", ") || "—",
    },
    { accessorKey: "serverType", header: "Type" },
  ];

  return (
    <>
      <PageHeader title="Server IPs" />
      {list.isLoading ? (
        <p className="text-text-secondary">Loading...</p>
      ) : (
        <DataTable
          data={list.data || []}
          columns={columns}
          defaultSort={[{ id: "name", desc: false }]}
          renderCard={(row) => {
            const s = row.original;
            return (
              <div className="bg-surface border border-border rounded-lg p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-text-primary">{s.name}</h3>
                  <span className="text-sm font-mono text-text-primary">{s.ip || "—"}</span>
                </div>
                <div className="mt-2 flex gap-4 text-sm text-text-secondary">
                  {s.providerName && (
                    <ProviderLink name={s.providerName} siteUrl={s.providerSiteUrl} cpUrl={s.providerControlPanelUrl} />
                  )}
                  {(s.locationCity || s.locationCountry) && (
                    <span>{[s.locationCity, s.locationCountry].filter(Boolean).join(", ")}</span>
                  )}
                  {s.serverType && <span>{s.serverType}</span>}
                </div>
              </div>
            );
          }}
        />
      )}
    </>
  );
}
