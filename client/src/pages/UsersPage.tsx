import { useState } from "react";
import { useForm } from "react-hook-form";
import { useUsers } from "../api/hooks";
import { useAuthStore } from "../stores/authStore";
import { User } from "../types";
import DataTable from "../components/ui/DataTable";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import ConfirmDialog from "../components/ui/ConfirmDialog";

export default function UsersPage() {
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const { list, create, update, remove } = useUsers();
  const [editUser, setEditUser] = useState<User | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  if (!isAdmin()) return <p className="text-text-secondary">Admin access required</p>;

  return (
    <>
      <PageHeader title="Users">
        <Button onClick={() => setShowCreate(true)}>Add User</Button>
      </PageHeader>

      {list.isLoading ? <p className="text-text-secondary">Loading...</p> : (
        <DataTable
          data={list.data || []}
          columns={[
            { accessorKey: "username", header: "Username" },
            { accessorKey: "role", header: "Role" },
            {
              id: "actions",
              header: "Actions",
              cell: ({ row }) => (
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setEditUser(row.original)}>Edit</Button>
                  <Button size="sm" variant="ghost" className="text-danger" onClick={() => setDeleteId(row.original.id)}>Delete</Button>
                </div>
              ),
            },
          ]}
          defaultSort={[{ id: "username", desc: false }]}
          renderCard={(row) => (
            <div className="bg-surface border border-border rounded-lg p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-semibold text-accent">{row.original.username.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-text-primary truncate">{row.original.username}</h3>
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full mt-0.5 ${row.original.role === "admin" ? "bg-accent/10 text-accent" : "bg-border text-text-secondary"}`}>
                      {row.original.role === "admin" ? "Administrator" : "Viewer"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => setEditUser(row.original)}>Edit</Button>
                  <Button size="sm" variant="ghost" className="text-danger" onClick={() => setDeleteId(row.original.id)}>Del</Button>
                </div>
              </div>
            </div>
          )}
        />
      )}

      <UserFormModal
        open={showCreate || !!editUser}
        user={editUser}
        onClose={() => { setShowCreate(false); setEditUser(null); }}
        create={create}
        update={update}
      />

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { remove.mutate(deleteId!); setDeleteId(null); }}
        title="Delete User"
        message="Are you sure you want to delete this user?"
        loading={remove.isPending}
      />
    </>
  );
}

function UserFormModal({ open, user, onClose, create, update }: {
  open: boolean;
  user: User | null;
  onClose: () => void;
  create: any;
  update: any;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: user ? { username: user.username, password: "", role: user.role } : { username: "", password: "", role: "viewer" },
  });

  const onSubmit = async (data: any) => {
    if (user) {
      const payload: any = { id: user.id, username: data.username, role: data.role };
      if (data.password) payload.password = data.password;
      await update.mutateAsync(payload);
    } else {
      await create.mutateAsync(data);
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={user ? "Edit User" : "Add User"}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Username" {...register("username", { required: "Required" })} error={errors.username?.message as string} />
        <Input label={user ? "New Password (leave blank to keep)" : "Password"} type="password" {...register("password", user ? {} : { required: "Required", minLength: { value: 4, message: "Min 4 chars" } })} error={errors.password?.message as string} />
        <Select
          label="Role"
          {...register("role")}
          options={[{ value: "admin", label: "Administrator" }, { value: "viewer", label: "Viewer" }]}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit">{user ? "Save" : "Create"}</Button>
        </div>
      </form>
    </Modal>
  );
}
