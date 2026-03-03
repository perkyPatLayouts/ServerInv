import { Link } from "react-router-dom";
import { useLocations } from "../api/hooks";
import { Location } from "../types";
import LookupPage from "../components/forms/LookupPage";

export default function LocationsPage() {
  return (
    <LookupPage<Location>
      title="Locations"
      hook={useLocations}
      columns={[
        {
          accessorKey: "city",
          header: "City",
          cell: ({ row }) => (
            <Link to={`/?locationId=${row.original.id}`} className="text-accent hover:underline">
              {row.original.city}
            </Link>
          ),
        },
        { accessorKey: "country", header: "Country" },
        { accessorKey: "datacenter", header: "Datacenter" },
      ]}
      fields={[
        { name: "city", label: "City", required: true },
        { name: "country", label: "Country", required: true },
        { name: "datacenter", label: "Datacenter" },
      ]}
      getDefaults={(item) => item ? { city: item.city, country: item.country, datacenter: item.datacenter || "" } : { city: "", country: "", datacenter: "" }}
      getInventoryLink={(item) => `/?locationId=${item.id}`}
    />
  );
}
