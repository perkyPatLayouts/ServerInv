import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useServers, useCurrencies, useLocations, useProviders, useCpuTypes, useOperatingSystems, useServerTypes, useBillingPeriods, usePaymentMethods } from "../../api/hooks";
import { Server } from "../../types";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Select from "../ui/Select";
import SelectWithAdd from "../ui/SelectWithAdd";
import Button from "../ui/Button";

interface Props {
  open: boolean;
  server: Server | null;
  onClose: () => void;
}

export default function ServerFormModal({ open, server, onClose }: Props) {
  const { create, update } = useServers();
  const currencies = useCurrencies().list;
  const { list: locationsList, create: createLocation } = useLocations();
  const { list: providersList, create: createProvider } = useProviders();
  const cpuTypes = useCpuTypes().list;
  const { list: osList, create: createOs } = useOperatingSystems();
  const serverTypes = useServerTypes().list;
  const billingPeriods = useBillingPeriods().list;
  const paymentMethods = usePaymentMethods().list;

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({ defaultValues: getDefaults(server) });

  useEffect(() => { reset(getDefaults(server)); }, [server, open]);

  const onSubmit = async (data: any) => {
    const payload = {
      ...data,
      serverTypeId: data.serverTypeId ? +data.serverTypeId : null,
      providerId: data.providerId ? +data.providerId : null,
      locationId: data.locationId ? +data.locationId : null,
      currencyId: data.currencyId ? +data.currencyId : null,
      cpuTypeId: data.cpuTypeId ? +data.cpuTypeId : null,
      osId: data.osId ? +data.osId : null,
      billingPeriodId: data.billingPeriodId ? +data.billingPeriodId : null,
      paymentMethodId: data.paymentMethodId ? +data.paymentMethodId : null,
      recurring: !!data.recurring,
      autoRenew: !!data.autoRenew,
      ram: data.ram ? +data.ram : null,
      diskSize: data.diskSize ? +data.diskSize : null,
      price: data.price || null,
      renewalDate: data.renewalDate || null,
    };
    if (server) {
      await update.mutateAsync({ id: server.id, ...payload });
    } else {
      await create.mutateAsync(payload);
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={server ? "Edit Server" : "Add Server"}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Name" {...register("name", { required: "Required" })} error={errors.name?.message as string} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="URL" {...register("url")} />
          <Input label="IP Address" {...register("ip")} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Server Type"
            {...register("serverTypeId")}
            placeholder="Select..."
            options={(serverTypes.data || []).map((t) => ({ value: t.id, label: t.name }))}
          />
          <SelectWithAdd
            label="Provider"
            {...register("providerId")}
            placeholder="Select..."
            options={(providersList.data || []).map((p) => ({ value: p.id, label: p.name }))}
            renderAdd={(onDone) => (
              <InlineProviderForm
                onSave={async (created) => {
                  setValue("providerId", String(created.id));
                  onDone();
                }}
                onCancel={onDone}
                createProvider={createProvider}
              />
            )}
          />
        </div>
        <SelectWithAdd
          label="Location"
          {...register("locationId")}
          placeholder="Select..."
          options={(locationsList.data || []).map((l) => ({ value: l.id, label: `${l.city}, ${l.country}` }))}
          renderAdd={(onDone) => (
            <InlineLocationForm
              onSave={async (created) => {
                setValue("locationId", String(created.id));
                onDone();
              }}
              onCancel={onDone}
              createLocation={createLocation}
            />
          )}
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input label="Price" {...register("price")} type="number" step="0.01" />
          <Select
            label="Billing Period"
            {...register("billingPeriodId")}
            placeholder="Select..."
            options={(billingPeriods.data || []).map((b) => ({ value: b.id, label: b.name }))}
          />
          <Select
            label="Currency"
            {...register("currencyId")}
            placeholder="Select..."
            options={(currencies.data || []).map((c) => ({ value: c.id, label: `${c.code} (${c.symbol})` }))}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            label="Payment Method"
            {...register("paymentMethodId")}
            placeholder="Select..."
            options={(paymentMethods.data || []).map((p) => ({ value: p.id, label: p.name }))}
          />
          <div className="flex items-center gap-4 pt-6">
            <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
              <input type="checkbox" {...register("recurring")} className="rounded border-border" />
              Recurring
            </label>
            <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
              <input type="checkbox" {...register("autoRenew")} className="rounded border-border" />
              Auto Renew
            </label>
          </div>
        </div>
        <Input label="Renewal Date" {...register("renewalDate")} type="date" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input label="RAM (MB)" {...register("ram")} type="number" />
          <Input label="Disk Size (GB)" {...register("diskSize")} type="number" />
          <Select
            label="Disk Type"
            {...register("diskType")}
            placeholder="Select..."
            options={[{ value: "SSD", label: "SSD" }, { value: "HDD", label: "HDD" }, { value: "NVMe", label: "NVMe" }]}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="CPU"
            {...register("cpuTypeId")}
            placeholder="Select..."
            options={(cpuTypes.data || []).map((c) => ({ value: c.id, label: `${c.type} (${c.cores}c @ ${c.speed}GHz)` }))}
          />
          <SelectWithAdd
            label="OS"
            {...register("osId")}
            placeholder="Select..."
            options={(osList.data || []).map((o) => ({ value: o.id, label: `${o.name} ${o.version}` }))}
            renderAdd={(onDone) => (
              <InlineOsForm
                onSave={async (created) => {
                  setValue("osId", String(created.id));
                  onDone();
                }}
                onCancel={onDone}
                createOs={createOs}
              />
            )}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Notes</label>
          <textarea {...register("notes")} className="w-full rounded border border-border bg-surface text-text-primary px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent" rows={3} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={create.isPending || update.isPending}>
            {server ? "Save" : "Create"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/** Inline form to create a new Provider. */
function InlineProviderForm({ onSave, onCancel, createProvider }: { onSave: (p: any) => void; onCancel: () => void; createProvider: any }) {
  const [name, setName] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [controlPanelUrl, setControlPanelUrl] = useState("");

  const handleSubmit = async () => {
    if (!name.trim()) return;
    const result = await createProvider.mutateAsync({ name, siteUrl: siteUrl || null, controlPanelUrl: controlPanelUrl || null });
    onSave(result);
  };

  return (
    <>
      <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      <Input label="Site URL" value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} />
      <Input label="Control Panel URL" value={controlPanelUrl} onChange={(e) => setControlPanelUrl(e.target.value)} />
      <div className="flex gap-2">
        <Button type="button" size="sm" onClick={handleSubmit} disabled={createProvider.isPending || !name.trim()}>
          {createProvider.isPending ? "Adding..." : "Add Provider"}
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </>
  );
}

/** Inline form to create a new Location. */
function InlineLocationForm({ onSave, onCancel, createLocation }: { onSave: (l: any) => void; onCancel: () => void; createLocation: any }) {
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [datacenter, setDatacenter] = useState("");

  const handleSubmit = async () => {
    if (!city.trim() || !country.trim()) return;
    const result = await createLocation.mutateAsync({ city, country, datacenter: datacenter || null });
    onSave(result);
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} autoFocus />
        <Input label="Country" value={country} onChange={(e) => setCountry(e.target.value)} />
      </div>
      <Input label="Datacenter" value={datacenter} onChange={(e) => setDatacenter(e.target.value)} />
      <div className="flex gap-2">
        <Button type="button" size="sm" onClick={handleSubmit} disabled={createLocation.isPending || !city.trim() || !country.trim()}>
          {createLocation.isPending ? "Adding..." : "Add Location"}
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </>
  );
}

/** Inline form to create a new Operating System. */
function InlineOsForm({ onSave, onCancel, createOs }: { onSave: (o: any) => void; onCancel: () => void; createOs: any }) {
  const [name, setName] = useState("");
  const [version, setVersion] = useState("");
  const [variant, setVariant] = useState("server");

  const handleSubmit = async () => {
    if (!name.trim() || !version.trim()) return;
    const result = await createOs.mutateAsync({ name, version, variant });
    onSave(result);
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        <Input label="Version" value={version} onChange={(e) => setVersion(e.target.value)} />
        <div className="space-y-1">
          <label className="block text-sm font-medium text-text-primary">Variant</label>
          <select
            value={variant}
            onChange={(e) => setVariant(e.target.value)}
            className="w-full rounded border border-border bg-surface text-text-primary px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="server">Server</option>
            <option value="desktop">Desktop</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="button" size="sm" onClick={handleSubmit} disabled={createOs.isPending || !name.trim() || !version.trim()}>
          {createOs.isPending ? "Adding..." : "Add OS"}
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </>
  );
}

function getDefaults(server: Server | null) {
  if (!server) return { name: "", url: "", ip: "", serverTypeId: "", providerId: "", locationId: "", price: "", billingPeriodId: "", paymentMethodId: "", recurring: false, autoRenew: false, currencyId: "", renewalDate: "", ram: "", diskSize: "", diskType: "", cpuTypeId: "", osId: "", notes: "" };
  return {
    name: server.name,
    url: server.url || "",
    ip: server.ip || "",
    serverTypeId: server.serverTypeId?.toString() || "",
    providerId: server.providerId?.toString() || "",
    locationId: server.locationId?.toString() || "",
    price: server.price || "",
    billingPeriodId: server.billingPeriodId?.toString() || "",
    paymentMethodId: server.paymentMethodId?.toString() || "",
    recurring: server.recurring ?? false,
    autoRenew: server.autoRenew ?? false,
    currencyId: server.currencyId?.toString() || "",
    renewalDate: server.renewalDate || "",
    ram: server.ram?.toString() || "",
    diskSize: server.diskSize?.toString() || "",
    diskType: server.diskType || "",
    cpuTypeId: server.cpuTypeId?.toString() || "",
    osId: server.osId?.toString() || "",
    notes: server.notes || "",
  };
}
