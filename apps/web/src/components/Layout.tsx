import { useState, useCallback } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "../auth/context";
import { DocumentTitle } from "./DocumentTitle";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import styles from "./Layout.module.css";

export function Layout() {
  const { ready } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const openMobileSidebar = useCallback(() => {
    setMobileOpen(true);
  }, []);

  const closeMobileSidebar = useCallback(() => {
    setMobileOpen(false);
  }, []);

  if (!ready) {
    return (
      <div className="loading-screen" aria-busy="true" aria-live="polite">
        <div className="spinner" aria-hidden />
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <DocumentTitle />
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={closeMobileSidebar} />
      <div className={styles.body}>
        <Header onMenuClick={openMobileSidebar} />
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
      {mobileOpen && (
        <button
          type="button"
          className={styles.backdrop}
          onClick={closeMobileSidebar}
          aria-label="Close menu"
        />
      )}
    </div>
  );
}
