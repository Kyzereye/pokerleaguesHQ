import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import PasswordField from "../components/PasswordField";
import { checkPassword } from "../utils/password";

export default function Register() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const reqs = checkPassword(password);
  const valid = reqs.length && reqs.upper && reqs.lower && reqs.number && password === confirm && firstName.trim() && lastName.trim();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, firstName: firstName.trim(), lastName: lastName.trim() }),
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="auth-page auth-page--register">
        <div className="card">
          <h1>Check your email</h1>
          <p className="muted">We sent a verification link. After verifying, <Link to="/login">log in</Link>.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page auth-page--register">
      <div className="card">
        <h1>Sign up</h1>
        <form className="form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="firstName">First name</label>
            <input id="firstName" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="lastName">Last name</label>
            <input id="lastName" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </div>
          <PasswordField label="Password" id="password" value={password} onChange={setPassword} />
          <ul className="requirements">
            <li className={reqs.length ? "met" : ""}>At least 8 characters</li>
            <li className={reqs.upper ? "met" : ""}>One uppercase letter</li>
            <li className={reqs.lower ? "met" : ""}>One lowercase letter</li>
            <li className={reqs.number ? "met" : ""}>One number</li>
          </ul>
          <PasswordField label="Confirm password" id="confirm" value={confirm} onChange={setConfirm} />
          {password && confirm && password !== confirm && <p className="error">Passwords do not match</p>}
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={loading || !valid}>Sign up</button>
        </form>
        <ul className="link-list">
          <li><Link to="/login">Already have an account? Log in</Link></li>
        </ul>
      </div>
    </div>
  );
}
