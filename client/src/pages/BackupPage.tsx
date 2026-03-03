import { useState } from "react";
import { useForm } from "react-hook-form";
import { useBackupConfig, useBackupList, useBackupExport, useBackupRestore } from "../api/hooks";
import { useAuthStore } from "../stores/authStore";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

export default function BackupPage() {
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const { query: configQuery, save: saveConfig } = useBackupConfig();
  const backupList = useBackupList();
  const exportMutation = useBackupExport();
  const restoreMutation = useBackupRestore();
  const [status, setStatus] = useState("");

  if (!isAdmin()) return <p className="text-text-secondary">Admin access required</p>;

  const config = configQuery.data;

  return (
    <>
      <PageHeader title="Backup" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">SFTP Configuration</h2>
          <BackupConfigForm config={config} onSave={saveConfig.mutateAsync} />
        </div>

        <div className="bg-surface rounded-lg border border-border p-6 space-y-4">
          <h2 className="text-lg font-semibold text-text-primary">Actions</h2>
          <Button
            onClick={async () => {
              setStatus("Exporting...");
              try {
                const result = await exportMutation.mutateAsync();
                setStatus(`Backup created: ${result.filename}`);
                backupList.refetch();
              } catch (e: any) {
                setStatus(`Export failed: ${e.response?.data?.error || e.message}`);
              }
            }}
            disabled={exportMutation.isPending || !config}
          >
            Create Backup
          </Button>
          {status && <p className="text-sm text-text-secondary">{status}</p>}

          <h3 className="text-sm font-semibold text-text-primary mt-4">Remote Backups</h3>
          {backupList.isLoading && <p className="text-sm text-text-secondary">Loading...</p>}
          {backupList.isError && <p className="text-sm text-danger">Could not load backups</p>}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {(backupList.data || []).map((f: any) => (
              <div key={f.name} className="flex items-center justify-between border border-border rounded px-3 py-2">
                <div>
                  <div className="text-sm font-medium text-text-primary">{f.name}</div>
                  <div className="text-xs text-text-secondary">{(f.size / 1024).toFixed(1)} KB</div>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={async () => {
                    if (!confirm("Restore this backup? This will overwrite current data.")) return;
                    setStatus("Restoring...");
                    try {
                      await restoreMutation.mutateAsync(f.name);
                      setStatus("Restore complete. Refresh the page.");
                    } catch (e: any) {
                      setStatus(`Restore failed: ${e.response?.data?.error || e.message}`);
                    }
                  }}
                  disabled={restoreMutation.isPending}
                >
                  Restore
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function BackupConfigForm({ config, onSave }: { config: any; onSave: (d: any) => Promise<any> }) {
  const { register, handleSubmit } = useForm({
    defaultValues: config || { host: "", port: 22, username: "", password: "", privateKey: "", remotePath: "/backups" },
  });

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-4">
      <Input label="Host" {...register("host", { required: true })} />
      <Input label="Port" type="number" {...register("port", { valueAsNumber: true })} />
      <Input label="Username" {...register("username", { required: true })} />
      <Input label="Password" type="password" {...register("password")} />
      <div className="space-y-1">
        <label className="block text-sm font-medium text-text-primary">Private Key (optional)</label>
        <textarea {...register("privateKey")} className="w-full rounded border border-border bg-surface text-text-primary px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent" rows={3} />
      </div>
      <Input label="Remote Path" {...register("remotePath", { required: true })} />
      <Button type="submit">Save Config</Button>
    </form>
  );
}
