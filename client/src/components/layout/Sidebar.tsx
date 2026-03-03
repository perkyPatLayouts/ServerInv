import { NavLink } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";

const navItems = [
  { to: "/", label: "Inventory" },
  { to: "/renewals", label: "Renewals" },
  { to: "/currencies", label: "Currencies" },
  { to: "/cpu-types", label: "CPUs" },
  { to: "/websites", label: "Websites & Apps" },
  { to: "/providers", label: "Providers" },
  { to: "/locations", label: "Locations" },
  { to: "/datacenters", label: "Datacenters" },
  { to: "/server-types", label: "Server Types" },
  { to: "/billing-periods", label: "Billing Periods" },
  { to: "/payment-methods", label: "Payment Methods" },
  { to: "/operating-systems", label: "OS & Versions" },
  { to: "/server-urls", label: "Server URLs" },
  { to: "/server-ips", label: "Server IPs" },
];

const adminItems = [
  { to: "/users", label: "Users" },
  { to: "/backup", label: "Backup" },
];

interface Props {
  onNavigate?: () => void;
}

export default function Sidebar({ onNavigate }: Props) {
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `block px-4 py-2 rounded text-sm transition-colors ${isActive ? "bg-accent text-white" : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"}`;

  return (
    <aside className="w-56 h-full bg-surface-alt border-r border-border flex flex-col">
      <div className="px-4 py-4 border-b border-border">
        <h1 className="text-lg font-bold text-text-primary">ServerInv</h1>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-2">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === "/"} className={linkClass} onClick={onNavigate}>
            {item.label}
          </NavLink>
        ))}
        {isAdmin() && (
          <>
            <div className="pt-4 pb-1 px-2 text-xs font-semibold text-text-secondary uppercase">Admin</div>
            {adminItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={linkClass} onClick={onNavigate}>
                {item.label}
              </NavLink>
            ))}
          </>
        )}
      </nav>
    </aside>
  );
}
