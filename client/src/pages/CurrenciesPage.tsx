import { Link } from "react-router-dom";
import { useCurrencies } from "../api/hooks";
import { Currency } from "../types";
import LookupPage from "../components/forms/LookupPage";

export default function CurrenciesPage() {
  return (
    <LookupPage<Currency>
      title="Currencies"
      hook={useCurrencies}
      columns={[
        {
          accessorKey: "code",
          header: "Code",
          cell: ({ row }) => (
            <Link to={`/?currencyId=${row.original.id}`} className="text-accent hover:underline">
              {row.original.code}
            </Link>
          ),
        },
        { accessorKey: "name", header: "Name" },
        { accessorKey: "symbol", header: "Symbol" },
      ]}
      fields={[
        { name: "code", label: "Code", required: true },
        { name: "name", label: "Name", required: true },
        { name: "symbol", label: "Symbol", required: true },
      ]}
      getDefaults={(item) => item ? { code: item.code, name: item.name, symbol: item.symbol } : { code: "", name: "", symbol: "" }}
      getInventoryLink={(item) => `/?currencyId=${item.id}`}
    />
  );
}
