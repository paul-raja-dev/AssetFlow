import useAuth from "../hooks/useAuth";
import { Link } from "react-router-dom";
import { Laptop, Calendar, Wrench, AlertCircle, ArrowRight } from "lucide-react";

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 24,
  marginBottom: 32,
};

const kpiCardStyle = {
  backgroundColor: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: 12,
  padding: 24,
  display: "flex",
  alignItems: "center",
  gap: 16,
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
};

const iconContainerStyle = {
  width: 48,
  height: 48,
  borderRadius: 8,
  backgroundColor: "var(--color-page)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--color-text-primary)",
  border: "1px solid var(--color-border)",
};

const sectionStyle = {
  backgroundColor: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: 12,
  padding: 24,
  marginBottom: 32,
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
};

const listStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
  marginTop: 16,
};

const listItemStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "12px 16px",
  backgroundColor: "var(--color-page)",
  borderRadius: 8,
  border: "1px solid var(--color-border)",
};

export default function DashboardPage() {
  const { user } = useAuth();

  // Mock statistics/data based on the specific test user logged in
  const getMockData = () => {
    switch (user?.email) {
      case "alice@company.com":
        return {
          assetsCount: 1,
          bookingsCount: 0,
          maintenanceCount: 0,
          allocations: [
            { tag: "AF-0022", name: "Dell UltraSharp 32\" 4K Monitor", date: "2026-07-01", status: "Active" },
          ],
          bookings: [],
        };
      case "bob@company.com":
        return {
          assetsCount: 1,
          bookingsCount: 1,
          maintenanceCount: 1,
          allocations: [
            { tag: "AF-0010", name: "iPad Pro 11\" (M2, Cellular)", date: "2026-05-15", status: "Overdue" },
          ],
          bookings: [
            { resource: "Conf Room C", time: "Today, 14:00 - 15:30", status: "Confirmed" }
          ],
        };
      case "charlie@company.com":
        return {
          assetsCount: 0,
          bookingsCount: 2,
          maintenanceCount: 0,
          allocations: [],
          bookings: [
            { resource: "Company Tesla Model 3", time: "2026-07-13, 09:00 - 17:00", status: "Confirmed" },
            { resource: "Conf Room B", time: "2026-07-14, 11:00 - 12:00", status: "Confirmed" }
          ],
        };
      default:
        return {
          assetsCount: 0,
          bookingsCount: 0,
          maintenanceCount: 0,
          allocations: [],
          bookings: [],
        };
    }
  };

  const data = getMockData();

  return (
    <div style={{ fontFamily: "var(--font-sans)", color: "var(--color-text-primary)" }}>
      {/* Header Info */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 6 }}>
          Welcome back, {user?.name}
        </h2>
        <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
          Role: <strong style={{ color: "var(--color-primary)" }}>{user?.role}</strong> · Department: <strong>{user?.department}</strong> · Location: <strong>Main Office</strong>
        </p>
      </div>

      {/* KPI Cards Group */}
      <div style={gridStyle}>
        <div style={kpiCardStyle}>
          <div style={iconContainerStyle}>
            <Laptop size={20} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "var(--color-text-muted)", fontWeight: 500 }}>Allocated Assets</div>
            <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{data.assetsCount}</div>
          </div>
        </div>

        <div style={kpiCardStyle}>
          <div style={iconContainerStyle}>
            <Calendar size={20} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "var(--color-text-muted)", fontWeight: 500 }}>Active Bookings</div>
            <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{data.bookingsCount}</div>
          </div>
        </div>

        <div style={kpiCardStyle}>
          <div style={iconContainerStyle}>
            <Wrench size={20} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "var(--color-text-muted)", fontWeight: 500 }}>Maintenance Tickets</div>
            <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{data.maintenanceCount}</div>
          </div>
        </div>
      </div>

      {/* Main Split Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
        {/* Left Hand: Allocations list */}
        <div style={sectionStyle}>
          <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 16, fontWeight: 700 }}>My Allocated Assets</h3>
          <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 4 }}>
            Physical hardware currently checked out in your possession.
          </p>

          <div style={listStyle}>
            {data.allocations.length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--color-text-muted)", padding: "16px 0", textAlign: "center" }}>
                No active asset allocations.
              </div>
            ) : (
              data.allocations.map((alloc) => (
                <div key={alloc.tag} style={listItemStyle}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{alloc.name}</span>
                    <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>
                      Tag: {alloc.tag} · Assigned: {alloc.date}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: alloc.status === "Overdue" ? "#ef4444" : "#10b981",
                      textTransform: "uppercase",
                    }}
                  >
                    {alloc.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Hand: Bookings and Shortcuts */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Active Bookings */}
          <div style={{ ...sectionStyle, marginBottom: 0 }}>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 16, fontWeight: 700 }}>Upcoming Bookings</h3>
            <div style={listStyle}>
              {data.bookings.length === 0 ? (
                <div style={{ fontSize: 13, color: "var(--color-text-muted)", padding: "16px 0", textAlign: "center" }}>
                  No upcoming room or vehicle bookings.
                </div>
              ) : (
                data.bookings.map((booking) => (
                  <div key={booking.resource} style={listItemStyle}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{booking.resource}</span>
                      <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{booking.time}</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--color-primary)" }}>
                      {booking.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div style={sectionStyle}>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 16, fontWeight: 700 }}>Quick Actions</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
              <Link
                to="/assets"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  borderRadius: 8,
                  backgroundColor: "var(--color-page)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text-primary)",
                  textDecoration: "none",
                  fontSize: 13,
                  fontWeight: 600,
                  transition: "border-color 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-primary)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
              >
                <span>Request Asset Allocation</span>
                <ArrowRight size={14} />
              </Link>

              <Link
                to="/bookings"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  borderRadius: 8,
                  backgroundColor: "var(--color-page)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text-primary)",
                  textDecoration: "none",
                  fontSize: 13,
                  fontWeight: 600,
                  transition: "border-color 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-primary)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
              >
                <span>Book a Shared Resource</span>
                <ArrowRight size={14} />
              </Link>

              <Link
                to="/maintenance"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  borderRadius: 8,
                  backgroundColor: "var(--color-page)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text-primary)",
                  textDecoration: "none",
                  fontSize: 13,
                  fontWeight: 600,
                  transition: "border-color 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-primary)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
              >
                <span>Submit Maintenance Request</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
