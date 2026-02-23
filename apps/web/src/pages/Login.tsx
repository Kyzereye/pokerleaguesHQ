import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/context";
import { api } from "../api/client";
import PasswordField from "../components/PasswordField";

export default function Login() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const verified = searchParams.get("verified");
    const err = searchParams.get("error");
    if (verified === "1") {
      setSearchParams({}, { replace: true });
    } else if (err === "invalid_token") {
      setError("Verification link expired or invalid.");
      setSearchParams({}, { replace: true });
    } else if (err === "missing_token") {
      setError("Missing verification link.");
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setAuth(data.token, data.user);
      navigate("/", { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message === "Email not verified" || (err as { message?: string }).message?.includes("EMAIL_NOT_VERIFIED")
        ? "Check your email to verify your account."
        : "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page auth-page--login">
      <div className="card">
        <h1>Log in</h1>
        {success && <p style={{ color: "#16a34a", marginBottom: 16 }}>{success}</p>}
        <form className="form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <PasswordField label="Password" id="password" value={password} onChange={setPassword} />
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-inline" aria-hidden />
                <span>Logging in…</span>
              </>
            ) : (
              "Log in"
            )}
          </button>
        </form>
        <ul className="link-list">
          <li><Link to="/forgot-password">Forgot password?</Link></li>
          <li><Link to="/register">Sign up</Link></li>
        </ul>
      </div>
    </div>
  );
}
