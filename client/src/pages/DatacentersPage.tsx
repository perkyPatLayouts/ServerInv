import { Link } from "react-router-dom";
import { useLocations } from "../api/hooks";
import { Location } from "../types";
import LookupPage from "../components/forms/LookupPage";

export default function DatacentersPage() {
  return (
    <LookupPage<Location>
      title="Datacenters"
      hook={useLocations}
      columns={[
        {
          accessorKey: "datacenter",
          header: "Datacenter",
          cell: ({ row }) => {
            const dc = row.original.datacenter;
            return dc ? (
              <Link to={`/?locationId=${row.original.id}`} className="text-accent hover:underline">{dc}</Link>
            ) : "—";
          },
        },
        { accessorKey: "city", header: "City" },
        { accessorKey: "country", header: "Country" },
      ]}
      fields={[
        { name: "datacenter", label: "Datacenter" },
        { name: "city", label: "City", required: true },
        { name: "country", label: "Country", required: true },
      ]}
      getDefaults={(item) => item ? { datacenter: item.datacenter || "", city: item.city, country: item.country } : { datacenter: "", city: "", country: "" }}
      getInventoryLink={(item) => `/?locationId=${item.id}`}
      defaultSort={[{ id: "datacenter", desc: false }]}
    />
  );
}
