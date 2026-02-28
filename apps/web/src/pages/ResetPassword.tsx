import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import PasswordField from "../components/PasswordField";
import PasswordValidationFeedback from "../components/PasswordValidationFeedback";
import { isPasswordValid } from "../utils/password";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const valid = isPasswordValid(password) && password === confirm;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, newPassword: password }),
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="auth-page">
        <div className="card">
          <p className="muted">Missing or invalid reset link.</p>
          <ul className="link-list">
            <li><Link to="/forgot-password">Request a new link</Link></li>
          </ul>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="auth-page auth-page--reset-success">
        <div className="card">
          <h1>Password updated</h1>
          <p className="muted">You can log in.</p>
          <ul className="link-list">
            <li><Link to="/login">Log in</Link></li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page auth-page--reset-form">
      <div className="card">
        <h1>Reset password</h1>
        <form className="form" onSubmit={handleSubmit}>
          <PasswordField label="New password" id="password" value={password} onChange={setPassword} />
          <PasswordValidationFeedback password={password} confirm={confirm} />
          <PasswordField label="Confirm password" id="confirm" value={confirm} onChange={setConfirm} />
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={loading || !valid}>Reset password</button>
        </form>
      </div>
    </div>
  );
}
