import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/context";
import styles from "./Header.module.css";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { token, user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [open]);

  const displayLabel = user?.displayName || user?.email || "Account";

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        {onMenuClick && (
          <button
            type="button"
            className={styles.sidebarToggle}
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            ☰
          </button>
        )}
      </div>
      <div className={styles.dropdownWrap} ref={wrapRef}>
        {token && user ? (
          <>
            <button type="button" className={styles.trigger} onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="true">
              {displayLabel}
              <span aria-hidden>▾</span>
            </button>
            {open && (
              <ul className={styles.menu} role="menu">
                <li className={styles.menuItem} role="none">
                  <Link to="/profile" className={styles.menuLink} role="menuitem" onClick={() => setOpen(false)}>
                    Profile
                  </Link>
                </li>
                {user.role === "admin" && (
                  <li className={styles.menuItem} role="none">
                    <Link to="/admin/players" className={styles.menuLink} role="menuitem" onClick={() => setOpen(false)}>
                      Players
                    </Link>
                  </li>
                )}
                <li className={styles.menuItem} role="none">
                  <span className={styles.divider} />
                </li>
                <li className={styles.menuItem} role="none">
                  <button type="button" className={styles.menuButton} role="menuitem" onClick={() => { setOpen(false); logout(); }}>
                    Log out
                  </button>
                </li>
              </ul>
            )}
          </>
        ) : (
          <>
            <button type="button" className={styles.trigger} onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="true">
              Login
              <span aria-hidden>▾</span>
            </button>
            {open && (
              <ul className={styles.menu} role="menu">
                <li className={styles.menuItem} role="none">
                  <Link to="/login" className={styles.menuLink} role="menuitem" onClick={() => setOpen(false)}>
                    Log in
                  </Link>
                </li>
                <li className={styles.menuItem} role="none">
                  <Link to="/register" className={styles.menuLink} role="menuitem" onClick={() => setOpen(false)}>
                    Sign up
                  </Link>
                </li>
              </ul>
            )}
          </>
        )}
      </div>
    </header>
  );
}
