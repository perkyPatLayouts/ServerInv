import { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { ColumnDef } from "@tanstack/react-table";
import { useServers, useServerTypes, useProviders, useLocations, useCurrencies, useCpuTypes, useOperatingSystems } from "../api/hooks";
import { useAuthStore } from "../stores/authStore";
import { Server } from "../types";
import DataTable from "../components/ui/DataTable";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import ServerFormModal from "../components/forms/ServerFormModal";
import WebsitesModal from "../components/forms/WebsitesModal";
import MultiSelect from "../components/ui/MultiSelect";

/** Returns true if the date is within 14 days from now or already past. */
function isDueSoon(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const days = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
  return days <= 14;
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
        <a
          href={cpUrl}
          target="_blank"
          rel="noopener"
          className="text-[10px] px-1.5 py-0.5 rounded bg-accent/20 text-accent hover:bg-accent/30 font-medium leading-none"
          title="Control Panel"
        >
          CP
        </a>
      )}
    </span>
  );
}

type Filters = Record<string, Set<number>>;

const FILTER_KEYS = ["serverTypeId", "providerId", "locationId", "currencyId", "cpuTypeId", "osId"] as const;

export default function InventoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { list, remove } = useServers();
  const isEditorOrAdmin = useAuthStore((s) => s.isEditorOrAdmin);
  const [editServer, setEditServer] = useState<Server | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [websiteServer, setWebsiteServer] = useState<Server | null>(null);
  const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set());

  const serverTypes = useServerTypes().list;
  const providers = useProviders().list;
  const locations = useLocations().list;
  const currencies = useCurrencies().list;
  const cpuTypes = useCpuTypes().list;
  const operatingSystems = useOperatingSystems().list;

  // Build unique datacenter options from locations (datacenter -> locationIds)
  const datacenterOptions = useMemo(() => {
    const map = new Map<string, number[]>();
    for (const l of locations.data || []) {
      if (l.datacenter) {
        const ids = map.get(l.datacenter) || [];
        ids.push(l.id);
        map.set(l.datacenter, ids);
      }
    }
    return Array.from(map.entries()).map(([name, ids]) => ({ label: name, ids }));
  }, [locations.data]);

  // Initialize filters from URL params
  const [filters, setFilters] = useState<Filters>(() => {
    const init: Filters = {};
    for (const key of FILTER_KEYS) {
      const val = searchParams.get(key);
      if (val) {
        init[key] = new Set(val.split(",").map(Number).filter((n) => !isNaN(n)));
      }
    }
    return init;
  });

  // Sync filters to URL params
  useEffect(() => {
    const params = new URLSearchParams();
    for (const key of FILTER_KEYS) {
      const set = filters[key];
      if (set && set.size > 0) {
        params.set(key, Array.from(set).join(","));
      }
    }
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  const updateFilter = useCallback((key: string, selected: Set<number>) => {
    setFilters((prev) => {
      const next = { ...prev };
      if (selected.size === 0) delete next[key];
      else next[key] = selected;
      return next;
    });
  }, []);

  // Datacenter filter uses string names mapped to locationIds
  const [dcSelected, setDcSelected] = useState<Set<number>>(() => new Set());

  const clearFilters = useCallback(() => {
    setFilters({});
    setDcSelected(new Set());
  }, []);

  const activeFilterCount = Object.values(filters).reduce((acc, s) => acc + s.size, 0) + dcSelected.size;

  // Filter data
  const filteredData = useMemo(() => {
    let data = list.data || [];
    for (const key of FILTER_KEYS) {
      const set = filters[key];
      if (set && set.size > 0) {
        data = data.filter((s) => {
          const val = (s as any)[key];
          return val != null && set.has(val);
        });
      }
    }
    // Datacenter filter: find locationIds for selected datacenter indices, then filter
    if (dcSelected.size > 0) {
      const dcLocationIds = new Set<number>();
      dcSelected.forEach((idx) => {
        const opt = datacenterOptions[idx];
        if (opt) opt.ids.forEach((id) => dcLocationIds.add(id));
      });
      data = data.filter((s) => s.locationId != null && dcLocationIds.has(s.locationId));
    }
    return data;
  }, [list.data, filters, dcSelected, datacenterOptions]);

  const columns = useMemo<ColumnDef<Server, any>[]>(() => [
    { accessorKey: "name", header: "Name" },
    {
      accessorKey: "serverType",
      header: "Type",
      cell: ({ row }) => {
        const s = row.original;
        if (!s.serverType) return "—";
        return s.serverTypeVirtualization ? `${s.serverType} (${s.serverTypeVirtualization})` : s.serverType;
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
    { accessorKey: "ip", header: "IP" },
    {
      id: "location",
      header: "Location",
      accessorFn: (r) => [r.locationCity, r.locationCountry].filter(Boolean).join(", ") || "—",
    },
    {
      id: "price",
      header: "Price",
      accessorFn: (r) => r.price ? `${r.currencySymbol || ""}${r.price}${r.billingPeriod ? ` / ${r.billingPeriod}` : ""}` : "—",
    },
    {
      accessorKey: "renewalDate",
      header: "Renewal",
      cell: ({ row }) => {
        const d = row.original.renewalDate;
        if (!d) return "—";
        return (
          <span className={isDueSoon(d) ? "text-danger font-semibold" : ""}>
            {d}
          </span>
        );
      },
    },
    {
      id: "os",
      header: "OS",
      accessorFn: (r) => r.osName ? `${r.osName} ${r.osVersion}` : "—",
    },
    {
      id: "cpu",
      header: "CPU",
      accessorFn: (r) => r.cpuType ? `${r.cpuType} (${r.cpuCores}c @ ${r.cpuSpeed}GHz)` : "—",
    },
    {
      id: "ram",
      header: "RAM",
      accessorFn: (r) => r.ram ? `${r.ram} MB` : "—",
    },
    {
      id: "disk",
      header: "Disk",
      accessorFn: (r) => r.diskSize ? `${r.diskSize} GB ${r.diskType || ""}` : "—",
    },
    {
      id: "websites",
      header: "Sites",
      cell: ({ row }) => (
        <button
          onClick={() => setWebsiteServer(row.original)}
          className="text-accent hover:underline text-sm"
        >
          {row.original.websites?.length || 0}
        </button>
      ),
    },
    ...(isEditorOrAdmin() ? [{
      id: "actions" as const,
      header: "Actions",
      cell: ({ row }: any) => (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => setEditServer(row.original)}>Edit</Button>
          <Button size="sm" variant="ghost" onClick={() => setDeleteId(row.original.id)} className="text-danger">Delete</Button>
        </div>
      ),
    }] : []),
  ], [isEditorOrAdmin]);

  return (
    <>
      <PageHeader title="Server Inventory">
        {isEditorOrAdmin() && <Button onClick={() => setShowCreate(true)}>Add Server</Button>}
      </PageHeader>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <MultiSelect
          label="Server Type"
          options={(serverTypes.data || []).map((t) => ({ value: t.id, label: t.name }))}
          selected={filters.serverTypeId || new Set()}
          onChange={(s) => updateFilter("serverTypeId", s)}
        />
        <MultiSelect
          label="Provider"
          options={(providers.data || []).map((p) => ({ value: p.id, label: p.name }))}
          selected={filters.providerId || new Set()}
          onChange={(s) => updateFilter("providerId", s)}
        />
        <MultiSelect
          label="Location"
          options={(locations.data || []).map((l) => ({ value: l.id, label: `${l.city}, ${l.country}` }))}
          selected={filters.locationId || new Set()}
          onChange={(s) => updateFilter("locationId", s)}
        />
        <MultiSelect
          label="Datacenter"
          options={datacenterOptions.map((d, i) => ({ value: i, label: d.label }))}
          selected={dcSelected}
          onChange={setDcSelected}
        />
        <MultiSelect
          label="Currency"
          options={(currencies.data || []).map((c) => ({ value: c.id, label: c.code }))}
          selected={filters.currencyId || new Set()}
          onChange={(s) => updateFilter("currencyId", s)}
        />
        <MultiSelect
          label="CPU"
          options={(cpuTypes.data || []).map((c) => ({ value: c.id, label: `${c.type} (${c.cores}c)` }))}
          selected={filters.cpuTypeId || new Set()}
          onChange={(s) => updateFilter("cpuTypeId", s)}
        />
        <MultiSelect
          label="OS"
          options={(operatingSystems.data || []).map((o) => ({ value: o.id, label: `${o.name} ${o.version}` }))}
          selected={filters.osId || new Set()}
          onChange={(s) => updateFilter("osId", s)}
        />
        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="text-xs text-text-secondary hover:text-text-primary px-2 py-1"
          >
            Clear all ({activeFilterCount})
          </button>
        )}
      </div>

      {list.isLoading ? (
        <p className="text-text-secondary">Loading...</p>
      ) : (
        <DataTable
          data={filteredData}
          columns={columns}
          defaultSort={[{ id: "name", desc: false }]}
          renderCard={(row) => {
            const s = row.original;
            return (
              <div className="bg-surface border border-border rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-text-primary">{s.name}</h3>
                    {s.serverType && (
                      <span className="text-xs bg-surface-hover text-text-secondary px-2 py-0.5 rounded">
                        {s.serverType}{s.serverTypeVirtualization ? ` (${s.serverTypeVirtualization})` : ""}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => setWebsiteServer(s)}
                      className="text-xs text-accent hover:underline"
                    >
                      {s.websites?.length || 0} sites
                    </button>
                    {isEditorOrAdmin() && (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => setEditServer(s)}>Edit</Button>
                        <Button size="sm" variant="ghost" onClick={() => setDeleteId(s.id)} className="text-danger">Del</Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  {s.providerName && (
                    <div className="min-w-0">
                      <span className="text-text-secondary text-xs">Provider</span>
                      <div className="truncate">
                        <ProviderLink name={s.providerName} siteUrl={s.providerSiteUrl} cpUrl={s.providerControlPanelUrl} />
                      </div>
                    </div>
                  )}
                  {s.serverTypeVirtualization && <Field label="Virtualization" value={s.serverTypeVirtualization} />}
                  {s.ip && <Field label="IP" value={s.ip} />}
                  {(s.locationCity || s.locationCountry) && (
                    <Field label="Location" value={[s.locationCity, s.locationCountry].filter(Boolean).join(", ")} />
                  )}
                  {s.locationDatacenter && <Field label="Datacenter" value={s.locationDatacenter} />}
                  {s.price && (
                    <Field label="Price" value={`${s.currencySymbol || ""}${s.price}${s.billingPeriod ? ` / ${s.billingPeriod}` : ""}`} />
                  )}
                  {s.paymentMethod && <Field label="Payment" value={s.paymentMethod} />}
                  {(s.recurring || s.autoRenew) && (
                    <div className="min-w-0">
                      <span className="text-text-secondary text-xs">Status</span>
                      <div className="flex gap-1 mt-0.5">
                        {s.recurring && <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/20 text-accent font-medium">Recurring</span>}
                        {s.autoRenew && <span className="text-[10px] px-1.5 py-0.5 rounded bg-success/20 text-success font-medium">Auto Renew</span>}
                      </div>
                    </div>
                  )}
                  {s.renewalDate && <Field label="Renewal" value={s.renewalDate} highlight={isDueSoon(s.renewalDate)} />}
                  {s.osName && <Field label="OS" value={`${s.osName} ${s.osVersion}`} />}
                  {s.cpuType && (
                    <Field label="CPU" value={`${s.cpuType} ${s.cpuCores}c @ ${s.cpuSpeed}GHz`} />
                  )}
                  {s.ram && <Field label="RAM" value={`${s.ram} MB`} />}
                  {s.diskSize && (
                    <Field label="Disk" value={`${s.diskSize} GB ${s.diskType || ""}`} />
                  )}
                </div>

                {s.websites && s.websites.length > 0 && (
                  <div className="border-t border-border pt-2 mt-2">
                    <span className="text-text-secondary text-xs">Websites & Apps</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {s.websites.map((w) => (
                        <a
                          key={w.id}
                          href={w.domain.startsWith("http") ? w.domain : `https://${w.domain}`}
                          target="_blank"
                          rel="noopener"
                          className="text-xs bg-surface-hover text-accent hover:bg-accent/20 px-2 py-0.5 rounded transition-colors"
                        >
                          {w.domain}{w.application ? ` (${w.application})` : ""}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {s.notes && (
                  <>
                    <button
                      onClick={() => setExpandedNotes((prev) => {
                        const next = new Set(prev);
                        if (next.has(s.id)) next.delete(s.id);
                        else next.add(s.id);
                        return next;
                      })}
                      className="w-full border-t border-border pt-2 mt-2 flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary transition-colors"
                    >
                      <svg
                        className={`w-3.5 h-3.5 transition-transform ${expandedNotes.has(s.id) ? "rotate-90" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      Notes
                    </button>
                    {expandedNotes.has(s.id) && (
                      <div className="text-sm text-text-secondary bg-surface-alt rounded px-3 py-2 whitespace-pre-wrap">
                        {s.notes}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          }}
        />
      )}

      <ServerFormModal
        open={showCreate || !!editServer}
        server={editServer}
        onClose={() => { setShowCreate(false); setEditServer(null); }}
      />

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { remove.mutate(deleteId!); setDeleteId(null); }}
        title="Delete Server"
        message="This will permanently delete this server and all its associated websites."
        loading={remove.isPending}
      />

      {websiteServer && (
        <WebsitesModal
          open={!!websiteServer}
          server={websiteServer}
          onClose={() => setWebsiteServer(null)}
        />
      )}
    </>
  );
}

function Field({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="min-w-0">
      <span className="text-text-secondary text-xs">{label}</span>
      <div className={`truncate ${highlight ? "text-danger font-semibold" : "text-text-primary"}`}>{value}</div>
    </div>
  );
}
