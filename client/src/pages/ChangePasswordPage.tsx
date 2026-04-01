import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import api from "../api/client";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

/**
 * Forced password change page for users with mustChangePassword flag.
 * Users cannot access other parts of the app until they change their password.
 */
export default function ChangePasswordPage() {
  const { token, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect if not authenticated
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect if password change is not required
  if (!user.mustChangePassword) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 4) {
      setError("New password must be at least 4 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await api.put("/users/me/password", { currentPassword, newPassword });
      // Password changed successfully - logout and redirect to login
      // User will need to login again with new password
      logout();
      navigate("/login", { state: { message: "Password changed successfully. Please login with your new password." } });
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || "Failed to change password";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-dark">
      <div className="bg-surface border border-border p-8 rounded-lg shadow-xl w-full max-w-md space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-center text-text-primary">Password Change Required</h1>
          <p className="text-sm text-text-secondary text-center">
            You must change your password before accessing the application.
            This is required for security reasons on first login with default credentials.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoFocus
            required
          />
          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          {error && (
            <div className="bg-danger/10 border border-danger text-danger px-4 py-2 rounded text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !currentPassword || !newPassword || !confirmPassword}
          >
            {loading ? "Changing Password..." : "Change Password"}
          </Button>
        </form>

        <div className="text-center pt-2">
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="text-sm text-text-secondary hover:text-text-primary underline"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
