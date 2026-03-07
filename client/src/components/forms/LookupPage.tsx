import { useState, useMemo, ReactNode } from "react";
import { Link } from "react-router-dom";
import { ColumnDef, SortingState } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { useAuthStore } from "../../stores/authStore";
import DataTable from "../ui/DataTable";
import PageHeader from "../ui/PageHeader";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import ConfirmDialog from "../ui/ConfirmDialog";
import SelectWithAddCustom from "../ui/SelectWithAddCustom";

interface Field {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  /** Preset options for a string-value select field. */
  selectOptions?: { value: string | number; label: string }[];
  /** When true, shows an "Add new" custom value input alongside selectOptions. */
  allowCustom?: boolean;
}

interface Props<T extends { id: number }> {
  title: string;
  hook: () => {
    list: { data: T[] | undefined; isLoading: boolean };
    create: { mutateAsync: (d: any) => Promise<any>; isPending: boolean };
    update: { mutateAsync: (d: any) => Promise<any>; isPending: boolean };
    remove: { mutate: (id: number) => void; isPending: boolean };
  };
  columns: ColumnDef<T, any>[];
  fields: Field[];
  getDefaults: (item: T | null) => Record<string, any>;
  extra?: ReactNode;
  /** Returns an inventory filter URL for a given item, e.g. `/?providerId=3`. */
  getInventoryLink?: (item: T) => string;
  /** Default sort state for the data table. */
  defaultSort?: SortingState;
}

export default function LookupPage<T extends { id: number }>({ title, hook, columns, fields, getDefaults, extra, getInventoryLink, defaultSort }: Props<T>) {
  const { list, create, update, remove } = hook();
  const isEditorOrAdmin = useAuthStore((s) => s.isEditorOrAdmin);
  const [editItem, setEditItem] = useState<T | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const allColumns = useMemo<ColumnDef<T, any>[]>(() => [
    ...columns,
    ...(getInventoryLink ? [{
      id: "inventory" as const,
      header: "Servers",
      cell: ({ row }: any) => (
        <Link to={getInventoryLink(row.original)} className="text-accent hover:underline text-sm">
          View servers
        </Link>
      ),
    }] : []),
    ...(isEditorOrAdmin() ? [{
      id: "actions" as const,
      header: "Actions",
      cell: ({ row }: any) => (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => setEditItem(row.original)}>Edit</Button>
          <Button size="sm" variant="ghost" className="text-danger" onClick={() => setDeleteId(row.original.id)}>Delete</Button>
        </div>
      ),
    }] : []),
  ], [columns, isEditorOrAdmin]);

  const FormModal = ({ open, item, onClose }: { open: boolean; item: T | null; onClose: () => void }) => {
    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({ defaultValues: getDefaults(item) });
    const onSubmit = async (data: any) => {
      const payload = { ...data };
      for (const f of fields) {
        if (f.type === "number" && payload[f.name] !== undefined) {
          payload[f.name] = payload[f.name] === "" ? null : +payload[f.name];
        }
      }
      if (item) await update.mutateAsync({ id: item.id, ...payload });
      else await create.mutateAsync(payload);
      onClose();
    };
    return (
      <Modal open={open} onClose={onClose} title={item ? `Edit ${title.replace(/s$/, "")}` : `Add ${title.replace(/s$/, "")}`}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {fields.map((f) => (
            <div key={f.name}>
              {f.selectOptions ? (
                <SelectWithAddCustom
                  label={f.label}
                  {...register(f.name, f.required ? { required: "Required" } : {})}
                  options={f.selectOptions}
                  onAddCustom={(val) => setValue(f.name, val)}
                  error={(errors as any)[f.name]?.message as string}
                />
              ) : (
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-text-primary">{f.label}</label>
                  <input
                    {...register(f.name, f.required ? { required: "Required" } : {})}
                    type={f.type || "text"}
                    step={f.type === "number" ? "any" : undefined}
                    className="w-full rounded border border-border bg-surface text-text-primary px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  {(errors as any)[f.name] && <p className="text-xs text-danger">{(errors as any)[f.name]?.message as string}</p>}
                </div>
              )}
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit">{item ? "Save" : "Create"}</Button>
          </div>
        </form>
      </Modal>
    );
  };

  return (
    <>
      <PageHeader title={title}>
        {isEditorOrAdmin() && <Button onClick={() => setShowCreate(true)}>Add</Button>}
      </PageHeader>
      {list.isLoading ? (
        <p className="text-text-secondary">Loading...</p>
      ) : (
        <DataTable
          data={list.data || []}
          columns={allColumns}
          defaultSort={defaultSort}
          renderCard={(row) => {
            const item = row.original;
            const vals = fields.map((f) => ({ label: f.label, value: (item as any)[f.name] })).filter((v) => v.value != null && v.value !== "");
            const invLink = getInventoryLink?.(item);
            return (
              <div className="bg-surface border border-border rounded-lg p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0 flex-1">
                    {vals.map((v, i) =>
                      i === 0 ? (
                        <h3 key={v.label} className="font-semibold text-text-primary truncate">
                          {invLink ? (
                            <Link to={invLink} className="text-accent hover:underline">{v.value}</Link>
                          ) : v.value}
                        </h3>
                      ) : (
                        <div key={v.label} className="text-sm"><span className="text-text-secondary text-xs">{v.label}: </span><span className="text-text-primary">{v.value}</span></div>
                      )
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {invLink && (
                      <Link to={invLink} className="text-xs text-accent hover:underline py-1.5">View servers</Link>
                    )}
                    {isEditorOrAdmin() && (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => setEditItem(item)}>Edit</Button>
                        <Button size="sm" variant="ghost" className="text-danger" onClick={() => setDeleteId(item.id)}>Del</Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          }}
        />
      )}
      {extra}
      <FormModal open={showCreate || !!editItem} item={editItem} onClose={() => { setShowCreate(false); setEditItem(null); }} />
      <ConfirmDialog open={deleteId !== null} onClose={() => setDeleteId(null)} onConfirm={() => { remove.mutate(deleteId!); setDeleteId(null); }} title="Confirm Delete" message="Are you sure? This cannot be undone." loading={remove.isPending} />
    </>
  );
}
