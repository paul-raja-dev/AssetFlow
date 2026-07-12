import { useState } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Package,
  ClipboardList,
  Calendar,
  Wrench,
  ShieldCheck,
  BarChart3,
  History,
  Menu,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Sun,
  Moon,
} from "lucide-react";
import useAuth from "../../hooks/useAuth";

const navbarHeight = 56;
const expandedSidebarWidth = 240;
const collapsedSidebarWidth = 64;

export default function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [profileHovered, setProfileHovered] = useState(false);
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );

  const toggleTheme = () => {
    const nextDark = !dark;
    setDark(nextDark);
    document.documentElement.classList.toggle("dark", nextDark);
  };

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/organization-setup", label: "Org Setup", icon: Building2 },
    { path: "/assets", label: "Asset Directory", icon: Package },
    { path: "/allocations", label: "Allocations", icon: ClipboardList },
    { path: "/bookings", label: "Bookings", icon: Calendar },
    { path: "/maintenance", label: "Maintenance", icon: Wrench },
    { path: "/audits", label: "Audits", icon: ShieldCheck },
    { path: "/reports", label: "Reports", icon: BarChart3 },
    { path: "/activity-logs", label: "Activity Logs", icon: History },
  ];

  // Derive page title from active path
  const currentItem = navItems.find((item) => location.pathname.startsWith(item.path));
  const pageTitle = currentItem ? currentItem.label : "AssetFlow";

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const sidebarWidth = isCollapsed ? collapsedSidebarWidth : expandedSidebarWidth;

  return (
    <div style={{ minHeight: "100vh", display: "flex", backgroundColor: "var(--color-page)" }}>
      {/* TOP NAVBAR */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: navbarHeight,
          backgroundColor: "var(--color-navbar)",
          borderBottom: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          zIndex: 40,
        }}
      >
        {/* Left: Brand + Title */}
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <span
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: 16,
              fontWeight: 700,
              color: "var(--color-text-primary)",
              letterSpacing: "-0.01em",
            }}
          >
            AssetFlow
          </span>
          <span
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "var(--color-text-secondary)",
              borderLeft: "1px solid var(--color-border)",
              paddingLeft: 16,
            }}
          >
            {pageTitle}
          </span>
        </div>

        {/* Right: User + Theme */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* User profile brief (hoverable) */}
          <div
            onMouseEnter={() => setProfileHovered(true)}
            onMouseLeave={() => setProfileHovered(false)}
            style={{
              position: "relative",
              cursor: "pointer",
              padding: "6px 12px",
              borderRadius: 6,
              transition: "background-color 0.15s",
              backgroundColor: profileHovered ? "var(--color-border-light)" : "transparent",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  backgroundColor: "var(--color-border-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--color-text-secondary)",
                }}
              >
                <User size={14} />
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{user?.name}</span>
                <span style={{ fontSize: 10, color: "var(--color-text-muted)", textTransform: "capitalize" }}>
                  {user?.role?.toLowerCase()?.replace("_", " ")}
                </span>
              </div>
            </div>

            {/* Profile Dropdown Menu */}
            {profileHovered && (
              <div
                style={{
                  position: "absolute",
                  top: 40,
                  right: 0,
                  width: 260,
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  padding: 16,
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
                  zIndex: 100,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  cursor: "default",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ borderBottom: "1px solid var(--color-border)", paddingBottom: 8, marginBottom: 4 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "var(--color-text-primary)" }}>{user?.name}</div>
                  <div style={{ fontSize: 12, color: "var(--color-text-muted)", wordBreak: "break-all" }}>{user?.email}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--color-text-secondary)" }}>Role</span>
                    <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{user?.role}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--color-text-secondary)" }}>Department</span>
                    <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{user?.department}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--color-text-secondary)" }}>Status</span>
                    <span style={{ fontWeight: 600, color: "#10b981" }}>{user?.status}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--color-text-secondary)" }}>User ID</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-text-muted)" }}>
                      {user?.id?.substring(0, 8)}...
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            style={{
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 6,
              border: "1px solid var(--color-border)",
              background: "transparent",
              color: "var(--color-text-secondary)",
              cursor: "pointer",
            }}
            title="Toggle Theme"
          >
            {dark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
      </nav>

      {/* LEFT SIDEBAR */}
      <aside
        style={{
          position: "fixed",
          top: navbarHeight,
          bottom: 0,
          left: 0,
          width: sidebarWidth,
          backgroundColor: "var(--color-sidebar)",
          borderRight: "1px solid var(--color-border)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "16px 0",
          zIndex: 30,
          transition: "width 0.15s ease-in-out",
        }}
      >
        {/* Navigation list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {/* Collapse toggle button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: isCollapsed ? "center" : "flex-end",
              padding: "8px 16px",
              background: "none",
              border: "none",
              color: "var(--color-text-muted)",
              cursor: "pointer",
              width: "100%",
            }}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>

          {/* Nav Links */}
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "10px 16px",
                  color: isActive ? "var(--color-sidebar-text-active)" : "var(--color-sidebar-text)",
                  backgroundColor: isActive ? "var(--color-sidebar-bg-active)" : "transparent",
                  textDecoration: "none",
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 500,
                  gap: 12,
                  borderRadius: 6,
                  margin: "0 8px",
                  transition: "background-color 0.1s, color 0.1s",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = "var(--color-sidebar-text-hover)";
                    e.currentTarget.style.backgroundColor = "var(--color-sidebar-bg-active)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = "var(--color-sidebar-text)";
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
                title={isCollapsed ? item.label : ""}
              >
                <Icon size={16} />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>

        {/* Logout action */}
        <div>
          <button
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "10px 16px",
              color: "#ef4444",
              background: "none",
              border: "none",
              fontSize: 13,
              fontWeight: 500,
              gap: 12,
              cursor: "pointer",
              width: "calc(100% - 16px)",
              margin: "0 8px",
              borderRadius: 6,
              textAlign: "left",
              transition: "background-color 0.1s, color 0.1s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--color-sidebar-bg-active)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
            title={isCollapsed ? "Sign Out" : ""}
          >
            <LogOut size={16} />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main
        style={{
          marginLeft: sidebarWidth,
          marginTop: navbarHeight,
          flex: 1,
          padding: "32px 40px",
          transition: "margin-left 0.15s ease-in-out",
          overflowY: "auto",
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}
