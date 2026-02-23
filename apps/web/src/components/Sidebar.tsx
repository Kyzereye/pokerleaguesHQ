import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/context";
import { getNavItemsForRole } from "../config/nav";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const { user } = useAuth();
  const role = user?.role;
  const items = getNavItemsForRole(role);
  const location = useLocation();

  const handleLinkClick = () => {
    onCloseMobile?.();
  };

  return (
    <aside
      className={`${styles.sidebar} ${mobileOpen ? styles.mobileOpen : ""}`}
      aria-label="Main navigation"
    >
      <div className={styles.brand}>
        <span className={styles.brandIcon}>◆</span>
        <span className={styles.brandText}>Poker Leagues</span>
      </div>
      <nav className={styles.nav}>
        <ul className={styles.list} role="list">
          {items.map((item) => {
            const isActive = location.pathname === item.route || (item.route !== "/" && location.pathname.startsWith(item.route));
            return (
              <li key={item.route} className={styles.item}>
                <Link
                  to={item.route}
                  className={`${styles.link} ${isActive ? styles.active : ""}`}
                  onClick={handleLinkClick}
                >
                  <span className={styles.icon} aria-hidden>{item.icon}</span>
                  <span className={styles.label}>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
