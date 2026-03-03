import { Link } from "react-router-dom";
import { useCpuTypes } from "../api/hooks";
import { CpuType } from "../types";
import LookupPage from "../components/forms/LookupPage";

export default function CpuTypesPage() {
  return (
    <LookupPage<CpuType>
      title="CPU Types"
      hook={useCpuTypes}
      columns={[
        {
          accessorKey: "type",
          header: "Type",
          cell: ({ row }) => (
            <Link to={`/?cpuTypeId=${row.original.id}`} className="text-accent hover:underline">
              {row.original.type}
            </Link>
          ),
        },
        { accessorKey: "cores", header: "Cores" },
        { accessorKey: "speed", header: "Speed (GHz)" },
      ]}
      fields={[
        { name: "type", label: "Type", required: true },
        { name: "cores", label: "Cores", type: "number", required: true },
        { name: "speed", label: "Speed (GHz)", type: "number", required: true },
      ]}
      getDefaults={(item) => item ? { type: item.type, cores: item.cores, speed: item.speed } : { type: "", cores: "", speed: "" }}
      getInventoryLink={(item) => `/?cpuTypeId=${item.id}`}
    />
  );
}
