import { Link } from "react-router-dom";
import { useProviders } from "../api/hooks";
import { Provider } from "../types";
import LookupPage from "../components/forms/LookupPage";

export default function ProvidersPage() {
  return (
    <LookupPage<Provider>
      title="Providers"
      hook={useProviders}
      columns={[
        {
          accessorKey: "name",
          header: "Name",
          cell: ({ row }) => (
            <Link to={`/?providerId=${row.original.id}`} className="text-accent hover:underline">
              {row.original.name}
            </Link>
          ),
        },
        {
          accessorKey: "siteUrl",
          header: "Site URL",
          cell: ({ getValue }) => {
            const v = getValue() as string;
            return v ? <a href={v} target="_blank" rel="noopener" className="text-accent hover:underline">{v}</a> : "—";
          },
        },
        {
          accessorKey: "controlPanelUrl",
          header: "Control Panel",
          cell: ({ getValue }) => {
            const v = getValue() as string;
            return v ? <a href={v} target="_blank" rel="noopener" className="text-accent hover:underline">{v}</a> : "—";
          },
        },
      ]}
      fields={[
        { name: "name", label: "Name", required: true },
        { name: "siteUrl", label: "Site URL" },
        { name: "controlPanelUrl", label: "Control Panel URL" },
      ]}
      getDefaults={(item) => item ? { name: item.name, siteUrl: item.siteUrl || "", controlPanelUrl: item.controlPanelUrl || "" } : { name: "", siteUrl: "", controlPanelUrl: "" }}
      getInventoryLink={(item) => `/?providerId=${item.id}`}
    />
  );
}
