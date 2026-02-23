import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/context";
import { api } from "../api/client";
import PasswordField from "../components/PasswordField";
import ConfirmDialog from "../components/ConfirmDialog";
import { checkPassword, isPasswordValid } from "../utils/password";
import styles from "./Profile.module.css";

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [accountExpanded, setAccountExpanded] = useState(false);
  const [passwordExpanded, setPasswordExpanded] = useState(false);
  const [deletePanelExpanded, setDeletePanelExpanded] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? "");
      setLastName(user.lastName ?? "");
      setEmail(user.email ?? "");
    }
  }, [user]);

  function handleCancel() {
    if (user) {
      setFirstName(user.firstName ?? "");
      setLastName(user.lastName ?? "");
      setEmail(user.email ?? "");
      setMessage(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      const data = await api("/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim() }),
      });
      setMessage({
        type: "ok",
        text: data?.emailVerificationSent ? "Profile updated. Check your new email to verify it." : "Profile updated.",
      });
      if (data?.user) {
        setUser(data.user);
        setFirstName(data.user.firstName ?? "");
        setLastName(data.user.lastName ?? "");
        setEmail(data.user.email ?? "");
      }
    } catch (err) {
      setMessage({ type: "err", text: err instanceof Error ? err.message : "Update failed" });
    } finally {
      setSaving(false);
    }
  }

  const newPasswordReqs = checkPassword(newPassword);
  const passwordFormValid =
    currentPassword.trim() !== "" &&
    isPasswordValid(newPassword) &&
    newPassword === confirmPassword;

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMessage(null);
    setChangingPassword(true);
    try {
      await api("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: currentPassword.trim(), newPassword }),
      });
      setPasswordMessage({ type: "ok", text: "Password updated." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordMessage({
        type: "err",
        text: err instanceof Error ? err.message : "Failed to change password.",
      });
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleteError(null);
    setDeleting(true);
    try {
      await api("/auth/account", { method: "DELETE" });
      setDeleteDialogOpen(false);
      logout();
      navigate("/", { replace: true });
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete account.");
    } finally {
      setDeleting(false);
    }
  }

  function handleCloseDeleteDialog() {
    setDeleteDialogOpen(false);
    setDeleteError(null);
  }

  return (
    <div className={styles.profile}>
      <h1>Profile</h1>

      <div className={`panel ${accountExpanded ? "panel--expanded" : ""}`}>
        <button
          type="button"
          className="panel-header"
          onClick={() => setAccountExpanded((e) => !e)}
          aria-expanded={accountExpanded}
          aria-controls="profile-account-body"
          id="profile-account-header"
        >
          <span className="panel-header__title">Account</span>
          <span className="panel-header__icon" aria-hidden>
            ▼
          </span>
        </button>
        <div id="profile-account-body" className="panel-body" role="region" aria-labelledby="profile-account-header">
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
            {message && <p className={message.type === "ok" ? "success" : "error"}>{message.text}</p>}
            <div className="actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? (
                  <>
                    <span className="spinner-inline" aria-hidden />
                    <span>Saving…</span>
                  </>
                ) : (
                  "Save"
                )}
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleCancel} disabled={saving}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className={`panel ${passwordExpanded ? "panel--expanded" : ""}`}>
        <button
          type="button"
          className="panel-header"
          onClick={() => setPasswordExpanded((e) => !e)}
          aria-expanded={passwordExpanded}
          aria-controls="profile-password-body"
          id="profile-password-header"
        >
          <span className="panel-header__title">Change Password</span>
          <span className="panel-header__icon" aria-hidden>
            ▼
          </span>
        </button>
        <div id="profile-password-body" className="panel-body" role="region" aria-labelledby="profile-password-header">
          <form className="form" onSubmit={handleChangePassword}>
            <PasswordField
              label="Current password"
              id="currentPassword"
              value={currentPassword}
              onChange={setCurrentPassword}
            />
            <PasswordField
              label="New password"
              id="newPassword"
              value={newPassword}
              onChange={setNewPassword}
            />
            <ul className="requirements">
              <li className={newPasswordReqs.length ? "met" : ""}>At least 8 characters</li>
              <li className={newPasswordReqs.upper ? "met" : ""}>One uppercase letter</li>
              <li className={newPasswordReqs.lower ? "met" : ""}>One lowercase letter</li>
              <li className={newPasswordReqs.number ? "met" : ""}>One number</li>
            </ul>
            <PasswordField
              label="Confirm new password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={setConfirmPassword}
            />
            {newPassword !== "" && confirmPassword !== "" && newPassword !== confirmPassword && (
              <p className="error">Passwords do not match</p>
            )}
            {passwordMessage && (
              <p className={passwordMessage.type === "ok" ? "success" : "error"}>{passwordMessage.text}</p>
            )}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={changingPassword || !passwordFormValid}
            >
              {changingPassword ? (
                <>
                  <span className="spinner-inline" aria-hidden />
                  <span>Updating…</span>
                </>
              ) : (
                "Change password"
              )}
            </button>
          </form>
        </div>
      </div>

      <div className={`panel ${deletePanelExpanded ? "panel--expanded" : ""}`}>
        <button
          type="button"
          className="panel-header"
          onClick={() => setDeletePanelExpanded((e) => !e)}
          aria-expanded={deletePanelExpanded}
          aria-controls="profile-delete-body"
          id="profile-delete-header"
        >
          <span className="panel-header__title">Delete Account</span>
          <span className="panel-header__icon" aria-hidden>
            ▼
          </span>
        </button>
        <div id="profile-delete-body" className="panel-body" role="region" aria-labelledby="profile-delete-header">
          <p className="muted" style={{ marginBottom: "var(--space-md)" }}>
            Permanently delete your account and all associated data. This cannot be undone.
          </p>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => setDeleteDialogOpen(true)}
          >
            Delete account
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleDeleteAccount}
        title="Delete account?"
        confirmLabel="Delete account"
        variant="danger"
        loading={deleting}
      >
        Are you sure? This cannot be undone.
        {deleteError && <p className="error" style={{ marginTop: "var(--space-sm)", marginBottom: 0 }}>{deleteError}</p>}
      </ConfirmDialog>
    </div>
  );
}
