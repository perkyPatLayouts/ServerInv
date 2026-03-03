import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "./client";
import type { Server, Currency, Location, Provider, CpuType, OperatingSystem, ServerType, BillingPeriod, PaymentMethod, User } from "../types";

/** Generic list + CRUD hooks factory. */
function useCrud<T extends { id: number }>(key: string, path: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: [key] });

  const list = useQuery<T[]>({ queryKey: [key], queryFn: () => api.get(path).then((r) => r.data) });
  const create = useMutation({ mutationFn: (data: Partial<T>) => api.post(path, data).then((r) => r.data), onSuccess: invalidate });
  const update = useMutation({ mutationFn: ({ id, ...data }: Partial<T> & { id: number }) => api.put(`${path}/${id}`, data).then((r) => r.data), onSuccess: invalidate });
  const remove = useMutation({ mutationFn: (id: number) => api.delete(`${path}/${id}`).then((r) => r.data), onSuccess: invalidate });

  return { list, create, update, remove };
}

export function useServers() { return useCrud<Server>("servers", "/servers"); }
export function useCurrencies() { return useCrud<Currency>("currencies", "/currencies"); }
export function useLocations() { return useCrud<Location>("locations", "/locations"); }
export function useProviders() { return useCrud<Provider>("providers", "/providers"); }
export function useCpuTypes() { return useCrud<CpuType>("cpuTypes", "/cpu-types"); }
export function useOperatingSystems() { return useCrud<OperatingSystem>("os", "/os"); }
export function useServerTypes() { return useCrud<ServerType>("serverTypes", "/server-types"); }
export function useBillingPeriods() { return useCrud<BillingPeriod>("billingPeriods", "/billing-periods"); }
export function usePaymentMethods() { return useCrud<PaymentMethod>("paymentMethods", "/payment-methods"); }
export function useUsers() { return useCrud<User>("users", "/users"); }

export function useWebsites(serverId: number) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["websites", serverId] });
    qc.invalidateQueries({ queryKey: ["servers"] });
  };
  const path = `/servers/${serverId}/websites`;

  const list = useQuery({
    queryKey: ["websites", serverId],
    queryFn: () => api.get(path).then((r) => r.data),
    enabled: !!serverId,
  });
  const create = useMutation({ mutationFn: (data: any) => api.post(path, data).then((r) => r.data), onSuccess: invalidate });
  const update = useMutation({ mutationFn: ({ id, ...data }: any) => api.put(`${path}/${id}`, data).then((r) => r.data), onSuccess: invalidate });
  const remove = useMutation({ mutationFn: (id: number) => api.delete(`${path}/${id}`).then((r) => r.data), onSuccess: invalidate });

  return { list, create, update, remove };
}

/** Download database backup as .sql file to browser. */
export function useBackupDownload() {
  return useMutation({
    mutationFn: async () => {
      const res = await api.get("/backup/download", { responseType: "blob" });
      const disposition = res.headers["content-disposition"] || "";
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match ? match[1] : "serverinv-backup.sql";
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      return { filename };
    },
  });
}

/** Upload .sql backup file to restore database. */
export function useBackupRestore() {
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("backup", file);
      return api.post("/backup/restore", form, {
        headers: { "Content-Type": "multipart/form-data" },
      }).then((r) => r.data);
    },
  });
}
