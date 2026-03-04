import { usePaymentMethods } from "../api/hooks";
import { PaymentMethod } from "../types";
import LookupPage from "../components/forms/LookupPage";

export default function PaymentMethodsPage() {
  return (
    <LookupPage<PaymentMethod>
      title="Payment Methods"
      hook={usePaymentMethods}
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
