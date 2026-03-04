import { useBillingPeriods } from "../api/hooks";
import { BillingPeriod } from "../types";
import LookupPage from "../components/forms/LookupPage";

export default function BillingPeriodsPage() {
  return (
    <LookupPage<BillingPeriod>
      title="Billing Periods"
      hook={useBillingPeriods}
      columns={[
        { accessorKey: "name", header: "Name" },
      ]}
      fields={[
        { name: "name", label: "Name", required: true },
      ]}
      getDefaults={(item) => item ? { name: item.name } : { name: "" }}
      defaultSort={[{ id: "name", desc: false }]}
    />
  );
}
