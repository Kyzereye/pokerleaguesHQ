import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const TITLE_SUFFIX = " | Poker Leagues HQ";

const PATH_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/login": "Log in",
  "/register": "Sign up",
  "/forgot-password": "Forgot password",
  "/reset-password": "Reset password",
  "/profile": "Profile",
  "/signup": "Sign up for game",
  "/the-list": "The list",
  "/standings": "Standings",
  "/admin": "Admin",
  "/admin/players": "Players",
  "/admin/venues": "Venues",
  "/admin/games": "Games",
};

function getTitleForPath(pathname: string): string {
  if (PATH_TITLES[pathname]) return PATH_TITLES[pathname] + TITLE_SUFFIX;
  if (pathname.startsWith("/reset-password")) return "Reset password" + TITLE_SUFFIX;
  return "Page not found" + TITLE_SUFFIX;
}

export function DocumentTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = getTitleForPath(pathname);
  }, [pathname]);

  return null;
}
