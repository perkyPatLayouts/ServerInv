import { ColumnDef } from "@tanstack/react-table";
import { useServers } from "../api/hooks";
import { Server } from "../types";
import DataTable from "../components/ui/DataTable";
import PageHeader from "../components/ui/PageHeader";
import { safeHref } from "../utils/url";

/** Renders a provider name as a link with optional CP badge. */
function ProviderLink({ name, siteUrl, cpUrl }: { name: string; siteUrl?: string | null; cpUrl?: string | null }) {
  const safeSite = safeHref(siteUrl);
  const safeCp = safeHref(cpUrl);
  return (
    <span className="inline-flex items-center gap-1.5">
      {safeSite ? (
        <a href={safeSite} target="_blank" rel="noopener" className="text-accent hover:underline">{name}</a>
      ) : (
        <span>{name}</span>
      )}
      {safeCp && (
        <a href={safeCp} target="_blank" rel="noopener" className="text-[10px] px-1.5 py-0.5 rounded bg-accent/20 text-accent hover:bg-accent/30 font-medium leading-none" title="Control Panel">CP</a>
      )}
    </span>
  );
}

export default function ServerUrlsPage() {
  const { list } = useServers();
  const columns: ColumnDef<Server, any>[] = [
    { accessorKey: "name", header: "Server" },
    {
      accessorKey: "url",
      header: "URL",
      cell: ({ getValue }) => {
        const v = getValue() as string;
        const safe = safeHref(v);
        return safe ? <a href={safe} target="_blank" rel="noopener" className="text-accent hover:underline">{v}</a> : (v || "—");
      },
    },
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
    { accessorKey: "serverType", header: "Type" },
  ];

  return (
    <>
      <PageHeader title="Server URLs" />
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
                <h3 className="font-semibold text-text-primary">{s.name}</h3>
                {s.url && safeHref(s.url) ? (
                  <a href={safeHref(s.url)} target="_blank" rel="noopener" className="text-accent hover:underline text-sm break-all">{s.url}</a>
                ) : (
                  <span className="text-sm text-text-secondary">No URL</span>
                )}
                <div className="mt-2 flex gap-4 text-sm text-text-secondary">
                  {s.providerName && (
                    <ProviderLink name={s.providerName} siteUrl={s.providerSiteUrl} cpUrl={s.providerControlPanelUrl} />
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
