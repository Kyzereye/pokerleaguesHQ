import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="auth-page auth-page--forgot">
        <div className="card">
          <h1>Check your email</h1>
          <p className="muted">If an account exists, we sent a password reset link.</p>
          <ul className="link-list">
            <li><Link to="/login">Back to login</Link></li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page auth-page--forgot">
      <div className="card">
        <h1>Forgot password</h1>
        <form className="form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={loading}>Send reset link</button>
        </form>
        <ul className="link-list">
          <li><Link to="/login">Back to login</Link></li>
        </ul>
      </div>
    </div>
  );
}
