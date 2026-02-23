/**
 * Single nav config: one list of items with route, label, icon, and roles that can see it.
 * Filter this list by current user role when rendering sidebar/header.
 */

export interface NavItem {
  route: string;
  label: string;
  icon: string;
  roles: string[];
}

/** All nav items. Unauthenticated: pass empty role and filter to login/register only. */
export const NAV_ITEMS: NavItem[] = [
  { route: "/", label: "Dashboard", icon: "⌂", roles: ["member", "admin"] },
  { route: "/signup", label: "Sign up for game", icon: "⊕", roles: ["member", "admin"] },
  { route: "/the-list", label: "The list", icon: "≡", roles: ["member", "admin"] },
  { route: "/standings", label: "Standings", icon: "◉", roles: ["member", "admin"] },
  { route: "/profile", label: "Profile", icon: "👤", roles: ["member", "admin"] },
  { route: "/admin", label: "Admin", icon: "⚙", roles: ["admin"] },
  { route: "/admin/players", label: "Players", icon: "👥", roles: ["admin"] },
  { route: "/admin/bars", label: "Bars", icon: "▤", roles: ["admin"] },
];

/** Items shown when not logged in */
export const NAV_ITEMS_GUEST: NavItem[] = [
  { route: "/login", label: "Log in", icon: "→", roles: [] },
  { route: "/register", label: "Sign up", icon: "+", roles: [] },
];

export function getNavItemsForRole(role: string | undefined): NavItem[] {
  if (!role) return NAV_ITEMS_GUEST;
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}
