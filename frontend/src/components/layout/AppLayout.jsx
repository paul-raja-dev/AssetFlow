import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Building2, Package, ClipboardList, Calendar, Wrench,
  ShieldCheck, Bell, Settings, LogOut, Sun, Moon, ChevronsLeft,
  ChevronsRight, Boxes, ArrowLeftRight,
} from "lucide-react";
import useAuth from "../../hooks/useAuth";
import { listNotifications } from "../../api";
import { ROLE_LABELS, fullName } from "../../utils/roles";

const NAV = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/assets", label: "Assets", icon: Package },
  { path: "/allocations", label: "Allocations", icon: ClipboardList },
  { path: "/transfers", label: "Transfers", icon: ArrowLeftRight },
  { path: "/bookings", label: "Bookings", icon: Calendar },
  { path: "/maintenance", label: "Maintenance", icon: Wrench },
  { path: "/audits", label: "Audits", icon: ShieldCheck },
  { path: "/organization", label: "Organization", icon: Building2, roles: ["ADMIN"] },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("sidebarCollapsed") === "1");
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [menuOpen, setMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const menuRef = useRef(null);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      localStorage.setItem("sidebarCollapsed", c ? "0" : "1");
      return !c;
    });
  };

  // Unread notification count — refresh every 30s
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await listNotifications({ isRead: false });
        if (alive) setUnread((res.data || []).length);
      } catch { /* ignore */ }
    };
    load();
    const t = setInterval(load, 30000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  // Close profile menu on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const visibleNav = NAV.filter((item) => !item.roles || item.roles.includes(user?.role));
  const initials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase() || "?";

  return (
    <div className="flex min-h-screen" style={{ background: "var(--color-page)" }}>
      {/* ── Sidebar ── */}
      <aside
        className="fixed inset-y-0 left-0 z-30 flex flex-col transition-all duration-200"
        style={{
          width: collapsed ? 64 : 232,
          background: "var(--color-sidebar)",
          borderRight: "1px solid var(--color-border)",
        }}
      >
        {/* Brand */}
        <div className="flex h-14 items-center gap-2.5 px-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ background: "var(--color-primary)", color: "var(--color-primary-text)" }}
          >
            <Boxes size={17} />
          </div>
          {!collapsed && (
            <span className="text-[15px] font-bold tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
              AssetFlow
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2.5 py-3">
          {visibleNav.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              title={collapsed ? label : undefined}
              className="group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] font-medium transition-colors"
              style={({ isActive }) => ({
                color: isActive ? "var(--color-sidebar-text-active)" : "var(--color-sidebar-text)",
                background: isActive ? "var(--color-sidebar-bg-active)" : "transparent",
                justifyContent: collapsed ? "center" : "flex-start",
              })}
            >
              <Icon size={17} className="shrink-0" />
              {!collapsed && label}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle */}
        <div className="px-2.5 pb-3">
          <button
            onClick={toggleCollapsed}
            className="btn btn-ghost btn-sm w-full"
            style={{ justifyContent: collapsed ? "center" : "flex-start" }}
          >
            {collapsed ? <ChevronsRight size={15} /> : <><ChevronsLeft size={15} /> Collapse</>}
          </button>
        </div>
      </aside>

      {/* ── Main column ── */}
      <div
        className="flex min-h-screen flex-1 flex-col transition-all duration-200"
        style={{ marginLeft: collapsed ? 64 : 232 }}
      >
        {/* Topbar */}
        <header
          className="sticky top-0 z-20 flex h-14 items-center justify-end gap-1 px-5"
          style={{ background: "var(--color-navbar)", borderBottom: "1px solid var(--color-border)" }}
        >
          {/* Theme */}
          <button onClick={toggleTheme} className="btn btn-ghost h-9 w-9 rounded-lg p-0" title="Toggle theme">
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Notifications */}
          <button
            onClick={() => navigate("/notifications")}
            className="btn btn-ghost relative h-9 w-9 rounded-lg p-0"
            title="Notifications"
          >
            <Bell size={17} />
            {unread > 0 && (
              <span
                className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9.5px] font-bold"
                style={{ background: "var(--color-danger)", color: "#fff" }}
              >
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>

          {/* Profile */}
          <div className="relative ml-1.5" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors"
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-surface-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-bold"
                style={{ background: "var(--color-accent)", color: "var(--color-primary)" }}
              >
                {initials}
              </div>
              <div className="hidden text-left sm:block">
                <div className="text-[13px] font-semibold leading-4">{fullName(user)}</div>
                <div className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                  {ROLE_LABELS[user?.role] || user?.role}
                </div>
              </div>
            </button>

            {menuOpen && (
              <div
                className="card anim-modal-in absolute right-0 top-full mt-1.5 w-52 overflow-hidden py-1"
                style={{ boxShadow: "var(--shadow-pop)" }}
              >
                <div className="px-3.5 py-2.5" style={{ borderBottom: "1px solid var(--color-border-light)" }}>
                  <div className="text-[13px] font-semibold">{fullName(user)}</div>
                  <div className="truncate text-[11.5px]" style={{ color: "var(--color-text-muted)" }}>{user?.email}</div>
                </div>
                <MenuBtn icon={Settings} label="Settings" onClick={() => { setMenuOpen(false); navigate("/settings"); }} />
                <MenuBtn icon={LogOut} label="Sign out" danger onClick={handleLogout} />
              </div>
            )}
          </div>
        </header>

        {/* Page body */}
        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function MenuBtn({ icon: Icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2 text-[13px] transition-colors"
      style={{ color: danger ? "var(--color-danger)" : "var(--color-text-primary)" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-surface-hover)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <Icon size={14} /> {label}
    </button>
  );
}
