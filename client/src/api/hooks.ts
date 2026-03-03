import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "./client";
import type { Server, Currency, Location, Provider, CpuType, OperatingSystem, ServerType, User } from "../types";

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

export function useBackupConfig() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ["backupConfig"], queryFn: () => api.get("/backup/config").then((r) => r.data) });
  const save = useMutation({ mutationFn: (data: any) => api.post("/backup/config", data).then((r) => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ["backupConfig"] }) });
  return { query, save };
}

export function useBackupList() {
  return useQuery({ queryKey: ["backupList"], queryFn: () => api.get("/backup/list").then((r) => r.data) });
}

export function useBackupExport() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: () => api.post("/backup/export").then((r) => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ["backupList"] }) });
}

export function useBackupRestore() {
  return useMutation({ mutationFn: (filename: string) => api.post("/backup/restore", { filename }).then((r) => r.data) });
}
