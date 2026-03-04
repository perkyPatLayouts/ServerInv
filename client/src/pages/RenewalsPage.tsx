import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useServers } from "../api/hooks";
import { Server } from "../types";
import DataTable from "../components/ui/DataTable";
import PageHeader from "../components/ui/PageHeader";

function urgencyClass(dateStr: string | null): string {
  if (!dateStr) return "";
  const days = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
  if (days < 0) return "text-danger font-semibold";
  if (days <= 7) return "text-danger";
  if (days <= 30) return "text-warning";
  if (days <= 90) return "text-warning/70";
  return "text-success";
}

function daysLabel(dateStr: string): string {
  const days = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
  return days < 0 ? `${Math.abs(days)}d overdue` : `${days}d`;
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

export default function RenewalsPage() {
  const { list } = useServers();

  const data = useMemo(() => {
    return (list.data || []).filter((s) => s.renewalDate);
  }, [list.data]);

  const columns: ColumnDef<Server, any>[] = [
    { accessorKey: "name", header: "Server" },
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
      accessorKey: "renewalDate",
      header: "Renewal Date",
      cell: ({ row }) => {
        const d = row.original.renewalDate;
        return <span className={urgencyClass(d)}>{d}</span>;
      },
    },
    {
      id: "daysLeft",
      header: "Days Left",
      accessorFn: (r) => {
        if (!r.renewalDate) return Infinity;
        return Math.ceil((new Date(r.renewalDate).getTime() - Date.now()) / 86400000);
      },
      cell: ({ row }) => (
        <span className={urgencyClass(row.original.renewalDate)}>
          {daysLabel(row.original.renewalDate!)}
        </span>
      ),
    },
    {
      id: "price",
      header: "Price",
      accessorFn: (r) => r.price ? `${r.currencySymbol || ""}${r.price}${r.billingPeriod ? ` / ${r.billingPeriod}` : ""}` : "—",
    },
    { accessorKey: "serverType", header: "Type" },
  ];

  return (
    <>
      <PageHeader title="Renewals" />
      {list.isLoading ? (
        <p className="text-text-secondary">Loading...</p>
      ) : (
        <DataTable
          data={data}
          columns={columns}
          defaultSort={[{ id: "renewalDate", desc: false }]}
          renderCard={(row) => {
            const s = row.original;
            const cls = urgencyClass(s.renewalDate);
            return (
              <div className="bg-surface border border-border rounded-lg p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-text-primary">{s.name}</h3>
                  <span className={`text-sm font-medium ${cls}`}>{daysLabel(s.renewalDate!)}</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <div><span className="text-text-secondary text-xs">Date</span><div className={cls}>{s.renewalDate}</div></div>
                  {s.providerName && (
                    <div>
                      <span className="text-text-secondary text-xs">Provider</span>
                      <div><ProviderLink name={s.providerName} siteUrl={s.providerSiteUrl} cpUrl={s.providerControlPanelUrl} /></div>
                    </div>
                  )}
                  {s.price && <div><span className="text-text-secondary text-xs">Price</span><div className="text-text-primary">{s.currencySymbol || ""}{s.price}{s.billingPeriod ? ` / ${s.billingPeriod}` : ""}</div></div>}
                  {s.serverType && <div><span className="text-text-secondary text-xs">Type</span><div className="text-text-primary">{s.serverType}</div></div>}
                </div>
              </div>
            );
          }}
        />
      )}
    </>
  );
}
