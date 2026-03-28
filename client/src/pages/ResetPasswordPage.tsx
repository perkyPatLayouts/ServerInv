import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router";
import axios from "axios";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token");
      setVerifying(false);
      return;
    }

    // Verify token validity
    axios
      .get(`/api/auth/verify-reset-token?token=${token}`)
      .then(() => {
        setTokenValid(true);
        setVerifying(false);
      })
      .catch(() => {
        setError("Invalid or expired reset token");
        setVerifying(false);
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 4) {
      setError("Password must be at least 4 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await axios.post("/api/auth/reset-password", {
        token,
        newPassword,
      });
      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => navigate("/login"), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary mx-auto"></div>
          <p className="mt-4 text-text-secondary">Verifying reset token...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-bold text-text-primary">
              Password Reset Successful
            </h2>
          </div>

          <div className="rounded-lg border border-border bg-surface p-6">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-accent-success"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="mt-4 text-sm text-text-secondary">
                Your password has been successfully reset. Redirecting to login...
              </p>
            </div>
          </div>

          <div className="text-center">
            <Link
              to="/login"
              className="text-sm font-medium text-accent-primary hover:text-accent-primary/80"
            >
              Go to login now
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-bold text-text-primary">
              Invalid Reset Link
            </h2>
          </div>

          <div className="rounded-lg border border-border bg-surface p-6">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-accent-error"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="mt-4 text-sm text-text-secondary">
                {error || "This password reset link is invalid or has expired."}
              </p>
            </div>
          </div>

          <div className="text-center space-y-2">
            <Link
              to="/forgot-password"
              className="block text-sm font-medium text-accent-primary hover:text-accent-primary/80"
            >
              Request a new reset link
            </Link>
            <Link
              to="/login"
              className="block text-sm font-medium text-text-secondary hover:text-text-primary"
            >
              Back to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-text-primary">
            Set New Password
          </h2>
          <p className="mt-2 text-center text-sm text-text-secondary">
            Enter your new password below.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-lg border border-border bg-surface p-6 space-y-4">
            {error && (
              <div className="bg-accent-error/10 border border-accent-error text-accent-error px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-text-primary mb-2">
                New Password
              </label>
              <Input
                id="newPassword"
                type="password"
                required
                value={newPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                disabled={loading}
                minLength={4}
              />
              <p className="mt-1 text-xs text-text-secondary">
                Minimum 4 characters
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-primary mb-2">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                disabled={loading}
                minLength={4}
              />
            </div>
          </div>

          <div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </Button>
          </div>

          <div className="text-center">
            <Link
              to="/login"
              className="text-sm font-medium text-accent-primary hover:text-accent-primary/80"
            >
              Back to login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
