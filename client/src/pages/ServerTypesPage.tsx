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
        {
          name: "virtualizationType",
          label: "Virtualization Type",
          selectOptions: [
            { value: "", label: "None" },
            { value: "KVM", label: "KVM" },
            { value: "OpenVZ 9", label: "OpenVZ 9" },
            { value: "OpenVZ 8", label: "OpenVZ 8" },
            { value: "OpenVZ 7", label: "OpenVZ 7" },
            { value: "OpenVZ 6", label: "OpenVZ 6" },
          ],
          allowCustom: true,
        },
      ]}
      getDefaults={(item) => item ? { name: item.name, virtualizationType: item.virtualizationType || "" } : { name: "", virtualizationType: "" }}
      getInventoryLink={(item) => `/?serverTypeId=${item.id}`}
      defaultSort={[{ id: "name", desc: false }]}
    />
  );
}
