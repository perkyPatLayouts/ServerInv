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
      ]}
      fields={[{ name: "name", label: "Name", required: true }]}
      getDefaults={(item) => item ? { name: item.name } : { name: "" }}
      getInventoryLink={(item) => `/?serverTypeId=${item.id}`}
    />
  );
}
