import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./stores/authStore";
import LoginPage from "./pages/LoginPage";
import AppLayout from "./components/layout/AppLayout";
import InventoryPage from "./pages/InventoryPage";
import RenewalsPage from "./pages/RenewalsPage";
import CurrenciesPage from "./pages/CurrenciesPage";
import CpuTypesPage from "./pages/CpuTypesPage";
import WebsitesPage from "./pages/WebsitesPage";
import ProvidersPage from "./pages/ProvidersPage";
import LocationsPage from "./pages/LocationsPage";
import ServerTypesPage from "./pages/ServerTypesPage";
import OperatingSystemsPage from "./pages/OperatingSystemsPage";
import ServerUrlsPage from "./pages/ServerUrlsPage";
import ServerIpsPage from "./pages/ServerIpsPage";
import UsersPage from "./pages/UsersPage";
import DatacentersPage from "./pages/DatacentersPage";
import BackupPage from "./pages/BackupPage";

/** Route guard that redirects to login if not authenticated. */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<InventoryPage />} />
        <Route path="renewals" element={<RenewalsPage />} />
        <Route path="currencies" element={<CurrenciesPage />} />
        <Route path="cpu-types" element={<CpuTypesPage />} />
        <Route path="websites" element={<WebsitesPage />} />
        <Route path="providers" element={<ProvidersPage />} />
        <Route path="locations" element={<LocationsPage />} />
        <Route path="datacenters" element={<DatacentersPage />} />
        <Route path="server-types" element={<ServerTypesPage />} />
        <Route path="operating-systems" element={<OperatingSystemsPage />} />
        <Route path="server-urls" element={<ServerUrlsPage />} />
        <Route path="server-ips" element={<ServerIpsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="backup" element={<BackupPage />} />
      </Route>
    </Routes>
  );
}
