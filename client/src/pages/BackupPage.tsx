import { useState, useRef } from "react";
import { useBackupDownload, useBackupRestore } from "../api/hooks";
import { useAuthStore } from "../stores/authStore";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";

export default function BackupPage() {
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const downloadMutation = useBackupDownload();
  const restoreMutation = useBackupRestore();
  const [status, setStatus] = useState("");
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isAdmin()) return <p className="text-text-secondary">Admin access required</p>;

  const handleDownload = async () => {
    setStatus("Downloading backup...");
    try {
      const result = await downloadMutation.mutateAsync();
      setStatus(`Backup downloaded: ${result.filename}`);
    } catch (e: any) {
      setStatus(`Download failed: ${e.response?.data?.error || e.message}`);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".sql")) {
      setStatus("Only .sql backup files are accepted");
      return;
    }
    setSelectedFile(file);
    setShowRestoreConfirm(true);
  };

  const handleRestore = async () => {
    if (!selectedFile) return;
    setShowRestoreConfirm(false);
    setStatus("Restoring backup...");
    try {
      await restoreMutation.mutateAsync(selectedFile);
      setStatus("Restore complete. Please refresh the page.");
    } catch (e: any) {
      setStatus(`Restore failed: ${e.response?.data?.error || e.message}`);
    }
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const cancelRestore = () => {
    setShowRestoreConfirm(false);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <>
      <PageHeader title="Backup & Restore" />
      <div className="max-w-xl space-y-6">
        <div className="bg-surface rounded-lg border border-border p-6 space-y-4">
          <h2 className="text-lg font-semibold text-text-primary">Download Backup</h2>
          <p className="text-sm text-text-secondary">
            Download a full database backup as a .sql file to your computer.
          </p>
          <Button onClick={handleDownload} disabled={downloadMutation.isPending}>
            {downloadMutation.isPending ? "Downloading..." : "Download Backup"}
          </Button>
        </div>

        <div className="bg-surface rounded-lg border border-border p-6 space-y-4">
          <h2 className="text-lg font-semibold text-text-primary">Restore Backup</h2>
          <p className="text-sm text-text-secondary">
            Upload a .sql backup file to restore the database. This will replace all existing data.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".sql"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button variant="secondary" onClick={handleFileSelect} disabled={restoreMutation.isPending}>
            {restoreMutation.isPending ? "Restoring..." : "Upload & Restore"}
          </Button>
        </div>

        {status && (
          <p className="text-sm text-text-secondary bg-surface rounded-lg border border-border p-4">{status}</p>
        )}
      </div>

      {showRestoreConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-surface border border-border rounded-lg p-6 max-w-md mx-4 space-y-4">
            <h3 className="text-lg font-semibold text-danger">Warning: Database Restore</h3>
            <p className="text-sm text-text-primary">
              You are about to restore from <strong>{selectedFile?.name}</strong>.
            </p>
            <p className="text-sm text-danger font-medium">
              This will completely replace the existing database. All current data will be lost.
            </p>
            <p className="text-sm text-text-secondary">Are you sure you want to continue?</p>
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={cancelRestore}>Cancel</Button>
              <Button variant="danger" onClick={handleRestore}>Yes, Restore</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
