import { useState, useEffect } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { useThemeStore } from "../stores/themeStore";
import api from "../api/client";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

export default function LoginPage() {
  const { token, setAuth } = useAuthStore();
  const theme = useThemeStore((s) => s.theme);
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  if (token) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { username, password });
      setAuth(data.token, data.user);
      navigate("/");
    } catch {
      setError("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-dark">
      <form onSubmit={handleSubmit} className="bg-surface border border-border p-8 rounded-lg shadow-xl w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-center text-text-primary">ServerInv</h1>
        {error && <p className="text-sm text-danger text-center">{error}</p>}
        <Input label="Username" value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
        <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </Button>
        <div className="text-center pt-2">
          <Link to="/forgot-password" className="text-sm text-accent hover:text-accent/80 underline">
            Forgot password?
          </Link>
        </div>
      </form>
    </div>
  );
}
