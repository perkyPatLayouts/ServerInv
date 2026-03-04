import { Link } from "react-router-dom";
import { useOperatingSystems } from "../api/hooks";
import { OperatingSystem } from "../types";
import LookupPage from "../components/forms/LookupPage";

export default function OperatingSystemsPage() {
  return (
    <LookupPage<OperatingSystem>
      title="Operating Systems"
      hook={useOperatingSystems}
      columns={[
        {
          accessorKey: "name",
          header: "Name",
          cell: ({ row }) => (
            <Link to={`/?osId=${row.original.id}`} className="text-accent hover:underline">
              {row.original.name}
            </Link>
          ),
        },
        { accessorKey: "version", header: "Version" },
        { accessorKey: "variant", header: "Variant" },
      ]}
      fields={[
        { name: "name", label: "Name", required: true },
        { name: "version", label: "Version", required: true },
        { name: "variant", label: "Variant (server/desktop)" },
      ]}
      getDefaults={(item) => item ? { name: item.name, version: item.version, variant: item.variant } : { name: "", version: "", variant: "server" }}
      getInventoryLink={(item) => `/?osId=${item.id}`}
      defaultSort={[{ id: "name", desc: false }]}
    />
  );
}
