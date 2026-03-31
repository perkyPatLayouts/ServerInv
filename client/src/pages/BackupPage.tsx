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

  // Backup options
  const [excludeUsersBackup, setExcludeUsersBackup] = useState(false);

  // Restore options
  const [excludeUsersRestore, setExcludeUsersRestore] = useState(false);
  const [mergeMode, setMergeMode] = useState(false);
  const [conflictResolution, setConflictResolution] = useState<'keep-existing' | 'use-restored'>('keep-existing');

  if (!isAdmin()) return <p className="text-text-secondary">Admin access required</p>;

  const handleDownload = async () => {
    setStatus("Downloading backup...");
    try {
      const result = await downloadMutation.mutateAsync({ excludeUsers: excludeUsersBackup });
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
      await restoreMutation.mutateAsync({
        file: selectedFile,
        excludeUsers: excludeUsersRestore,
        mergeMode,
        conflictResolution
      });
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

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={excludeUsersBackup}
                onChange={(e) => setExcludeUsersBackup(e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-text-primary">Exclude users from backup</span>
              <span className="text-text-secondary">(for security/privacy)</span>
            </label>
          </div>

          <Button onClick={handleDownload} disabled={downloadMutation.isPending}>
            {downloadMutation.isPending ? "Downloading..." : "Download Backup"}
          </Button>
        </div>

        <div className="bg-surface rounded-lg border border-border p-6 space-y-4">
          <h2 className="text-lg font-semibold text-text-primary">Restore Backup</h2>
          <p className="text-sm text-text-secondary">
            Upload a .sql backup file to restore the database.
          </p>

          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={excludeUsersRestore}
                onChange={(e) => setExcludeUsersRestore(e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-text-primary">Exclude users from restore</span>
              <span className="text-text-secondary">(keep existing users)</span>
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={mergeMode}
                onChange={(e) => setMergeMode(e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-text-primary">Merge with existing data</span>
              <span className="text-text-secondary">(don't drop tables)</span>
            </label>

            {mergeMode && (
              <div className="ml-6 space-y-2 border-l-2 border-border pl-4">
                <p className="text-xs font-medium text-text-primary">On duplicate keys:</p>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="conflictResolution"
                    value="keep-existing"
                    checked={conflictResolution === 'keep-existing'}
                    onChange={(e) => setConflictResolution(e.target.value as 'keep-existing')}
                    className="border-border"
                  />
                  <span className="text-text-primary">Keep existing rows</span>
                  <span className="text-text-secondary">(skip duplicates)</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="conflictResolution"
                    value="use-restored"
                    checked={conflictResolution === 'use-restored'}
                    onChange={(e) => setConflictResolution(e.target.value as 'use-restored')}
                    className="border-border"
                  />
                  <span className="text-text-primary">Use restored rows</span>
                  <span className="text-text-secondary">(replace duplicates)</span>
                </label>
              </div>
            )}
          </div>

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
            {!mergeMode && (
              <p className="text-sm text-danger font-medium">
                This will completely replace the existing database. All current data will be lost.
              </p>
            )}
            {mergeMode && (
              <p className="text-sm text-warning font-medium">
                This will merge with existing data. Conflicts will be handled by{' '}
                {conflictResolution === 'keep-existing' ? 'keeping existing rows' : 'using restored rows'}.
              </p>
            )}
            <div className="text-xs text-text-secondary space-y-1 bg-background p-3 rounded border border-border">
              <p>Options selected:</p>
              <ul className="list-disc list-inside space-y-1">
                {excludeUsersRestore && <li>Exclude users from restore</li>}
                {mergeMode && <li>Merge mode (preserve existing tables)</li>}
                {!mergeMode && <li>Clean restore (drop all tables)</li>}
                {mergeMode && (
                  <li>
                    Conflict resolution:{' '}
                    {conflictResolution === 'keep-existing' ? 'Keep existing' : 'Use restored'}
                  </li>
                )}
              </ul>
            </div>
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
