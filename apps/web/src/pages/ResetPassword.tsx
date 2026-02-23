import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import PasswordField from "../components/PasswordField";
import { checkPassword } from "../utils/password";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const reqs = checkPassword(password);
  const valid = reqs.length && reqs.upper && reqs.lower && reqs.number && password === confirm;

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
          <ul className="requirements">
            <li className={reqs.length ? "met" : ""}>At least 8 characters</li>
            <li className={reqs.upper ? "met" : ""}>One uppercase letter</li>
            <li className={reqs.lower ? "met" : ""}>One lowercase letter</li>
            <li className={reqs.number ? "met" : ""}>One number</li>
          </ul>
          <PasswordField label="Confirm password" id="confirm" value={confirm} onChange={setConfirm} />
          {password && confirm && password !== confirm && <p className="error">Passwords do not match</p>}
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={loading || !valid}>Reset password</button>
        </form>
      </div>
    </div>
  );
}
