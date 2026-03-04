import { Link } from "react-router-dom";
import { useServerTypes } from "../api/hooks";
import { ServerType } from "../types";
import LookupPage from "../components/forms/LookupPage";

export default function ServerTypesPage() {
  return (
    <LookupPage<ServerType>
      title="Server Types"
      hook={useServerTypes}
      columns={[
        {
          accessorKey: "name",
          header: "Name",
          cell: ({ row }) => (
            <Link to={`/?serverTypeId=${row.original.id}`} className="text-accent hover:underline">
              {row.original.name}
            </Link>
          ),
        },
        {
          accessorKey: "virtualizationType",
          header: "Virtualization",
          cell: ({ getValue }) => getValue() || "—",
        },
      ]}
      fields={[
        { name: "name", label: "Name", required: true },
        { name: "virtualizationType", label: "Virtualization Type" },
      ]}
      getDefaults={(item) => item ? { name: item.name, virtualizationType: item.virtualizationType || "" } : { name: "", virtualizationType: "" }}
      getInventoryLink={(item) => `/?serverTypeId=${item.id}`}
      defaultSort={[{ id: "name", desc: false }]}
    />
  );
}
