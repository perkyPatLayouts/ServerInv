import Modal from "./Modal";
import Button from "./Button";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  loading?: boolean;
}

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, loading }: Props) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm text-text-secondary mb-4">{message}</p>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="danger" onClick={onConfirm} disabled={loading}>
          {loading ? "Deleting..." : "Delete"}
        </Button>
      </div>
    </Modal>
  );
}
