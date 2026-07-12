import useAuth from "../hooks/useAuth";

const cardStyle = {
  backgroundColor: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: 12,
  padding: 24,
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  marginBottom: 24,
};

const tableHeaderStyle = {
  textAlign: "left",
  padding: "12px 16px",
  borderBottom: "2px solid var(--color-border)",
  fontSize: 12,
  fontWeight: 600,
  textTransform: "uppercase",
  color: "var(--color-text-secondary)",
  letterSpacing: "0.05em",
};

const tableCellStyle = {
  padding: "14px 16px",
  borderBottom: "1px solid var(--color-border)",
  fontSize: 13,
  color: "var(--color-text-primary)",
};

const codeStyle = {
  fontFamily: "var(--font-mono)",
  fontSize: 12,
  backgroundColor: "var(--color-page)",
  padding: "2px 6px",
  borderRadius: 4,
  border: "1px solid var(--color-border)",
};

export default function PlaceholderPage({ title }) {
  const { user } = useAuth();

  // Helper to generate relevant mock details depending on page type
  const renderContent = () => {
    switch (title) {
      case "Organization Setup":
        return (
          <>
            <p style={{ color: "var(--color-text-secondary)", marginBottom: 16 }}>
              Centrally manage your departments, category custom schemas, and promote employees.
            </p>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginTop: 20 }}>
              <div style={{ ...cardStyle, flex: 1, minWidth: 260 }}>
                <h3 style={{ marginBottom: 12, fontSize: 15, fontWeight: 600 }}>Departments</h3>
                <ul style={{ paddingLeft: 20, fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.8 }}>
                  <li>Engineering (Head: Priya Kumar)</li>
                  <li>Operations (Head: Sarah Connor)</li>
                  <li>Finance (Head: Bruce Wayne)</li>
                  <li>Human Resources (Head: Clark Kent)</li>
                </ul>
              </div>
              <div style={{ ...cardStyle, flex: 1, minWidth: 260 }}>
                <h3 style={{ marginBottom: 12, fontSize: 15, fontWeight: 600 }}>Asset Categories</h3>
                <ul style={{ paddingLeft: 20, fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.8 }}>
                  <li>IT Hardware (Laptops, Screens, Servers)</li>
                  <li>Vehicles (Delivery vans, Company cars)</li>
                  <li>Office Furniture (Desks, Chairs)</li>
                </ul>
              </div>
            </div>
          </>
        );

      case "Asset Directory":
        return (
          <>
            <p style={{ color: "var(--color-text-secondary)", marginBottom: 16 }}>
              Enterprise directory of all physical assets and shared resources in circulation.
            </p>
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>Asset Tag</th>
                  <th style={tableHeaderStyle}>Name</th>
                  <th style={tableHeaderStyle}>Category</th>
                  <th style={tableHeaderStyle}>Status</th>
                  <th style={tableHeaderStyle}>Location</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={tableCellStyle}><span style={codeStyle}>AF-0021</span></td>
                  <td style={tableCellStyle}>MacBook Pro 16" (M3 Max)</td>
                  <td style={tableCellStyle}>IT Hardware</td>
                  <td style={tableCellStyle}><span style={{ color: "#10b981", fontWeight: 600 }}>AVAILABLE</span></td>
                  <td style={tableCellStyle}>Main Office - Desk 14</td>
                </tr>
                <tr>
                  <td style={tableCellStyle}><span style={codeStyle}>AF-0022</span></td>
                  <td style={tableCellStyle}>Dell UltraSharp 32" 4K</td>
                  <td style={tableCellStyle}>IT Hardware</td>
                  <td style={tableCellStyle}><span style={{ color: "#3b82f6", fontWeight: 600 }}>ALLOCATED</span></td>
                  <td style={tableCellStyle}>Remote - Priya's Home</td>
                </tr>
                <tr>
                  <td style={tableCellStyle}><span style={codeStyle}>AF-0023</span></td>
                  <td style={tableCellStyle}>Conference Room A Projector</td>
                  <td style={tableCellStyle}>IT Hardware</td>
                  <td style={tableCellStyle}><span style={{ color: "#f59e0b", fontWeight: 600 }}>RESERVED</span></td>
                  <td style={tableCellStyle}>Conf Room A</td>
                </tr>
              </tbody>
            </table>
          </>
        );

      case "Allocations":
        return (
          <>
            <p style={{ color: "var(--color-text-secondary)", marginBottom: 16 }}>
              Track active hardware assignments and incoming transfer requests.
            </p>
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>Asset</th>
                  <th style={tableHeaderStyle}>Allocated To</th>
                  <th style={tableHeaderStyle}>Allocation Date</th>
                  <th style={tableHeaderStyle}>Expected Return</th>
                  <th style={tableHeaderStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={tableCellStyle}>AF-0022 - Dell UltraSharp 32"</td>
                  <td style={tableCellStyle}>Alice Smith (Engineering)</td>
                  <td style={tableCellStyle}>2026-07-01</td>
                  <td style={tableCellStyle}>2026-12-31</td>
                  <td style={tableCellStyle}><span style={{ color: "#10b981", fontWeight: 600 }}>ACTIVE</span></td>
                </tr>
                <tr>
                  <td style={tableCellStyle}>AF-0010 - iPad Pro 11"</td>
                  <td style={tableCellStyle}>Bob Jones (Operations)</td>
                  <td style={tableCellStyle}>2026-05-15</td>
                  <td style={tableCellStyle}>2026-07-01</td>
                  <td style={tableCellStyle}><span style={{ color: "#ef4444", fontWeight: 600 }}>OVERDUE</span></td>
                </tr>
              </tbody>
            </table>
          </>
        );

      case "Bookings":
        return (
          <>
            <p style={{ color: "var(--color-text-secondary)", marginBottom: 16 }}>
              Reserve company vehicles, training rooms, and specialized presentation screens.
            </p>
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>Resource</th>
                  <th style={tableHeaderStyle}>Booked By</th>
                  <th style={tableHeaderStyle}>Start Time</th>
                  <th style={tableHeaderStyle}>End Time</th>
                  <th style={tableHeaderStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={tableCellStyle}>Conf Room C (Capacity: 12)</td>
                  <td style={tableCellStyle}>Charlie Brown</td>
                  <td style={tableCellStyle}>Today, 14:00</td>
                  <td style={tableCellStyle}>Today, 15:30</td>
                  <td style={tableCellStyle}><span style={{ color: "#3b82f6", fontWeight: 600 }}>UPCOMING</span></td>
                </tr>
                <tr>
                  <td style={tableCellStyle}>Company Tesla Model 3</td>
                  <td style={tableCellStyle}>Sarah Connor</td>
                  <td style={tableCellStyle}>2026-07-13, 09:00</td>
                  <td style={tableCellStyle}>2026-07-15, 17:00</td>
                  <td style={tableCellStyle}><span style={{ color: "#3b82f6", fontWeight: 600 }}>UPCOMING</span></td>
                </tr>
              </tbody>
            </table>
          </>
        );

      case "Maintenance":
        return (
          <>
            <p style={{ color: "var(--color-text-secondary)", marginBottom: 16 }}>
              Workflow for equipment repairs, status changes, and technician assignees.
            </p>
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>Ticket ID</th>
                  <th style={tableHeaderStyle}>Asset</th>
                  <th style={tableHeaderStyle}>Issue Description</th>
                  <th style={tableHeaderStyle}>Priority</th>
                  <th style={tableHeaderStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={tableCellStyle}><span style={codeStyle}>M-9104</span></td>
                  <td style={tableCellStyle}>AF-0012 - MacBook Pro</td>
                  <td style={tableCellStyle}>Keyboard keys unresponsive (liquid spill)</td>
                  <td style={tableCellStyle}><span style={{ color: "#ef4444", fontWeight: 600 }}>HIGH</span></td>
                  <td style={tableCellStyle}><span style={{ color: "#f59e0b", fontWeight: 600 }}>IN_PROGRESS</span></td>
                </tr>
                <tr>
                  <td style={tableCellStyle}><span style={codeStyle}>M-9105</span></td>
                  <td style={tableCellStyle}>AF-0044 - Delivery Van A</td>
                  <td style={tableCellStyle}>Annual oil change and safety inspection</td>
                  <td style={tableCellStyle}>LOW</td>
                  <td style={tableCellStyle}><span style={{ color: "#10b981", fontWeight: 600 }}>RESOLVED</span></td>
                </tr>
              </tbody>
            </table>
          </>
        );

      case "Audits":
        return (
          <>
            <p style={{ color: "var(--color-text-secondary)", marginBottom: 16 }}>
              Run regular physical inventories and reconcile discrepancies.
            </p>
            <div style={{ ...cardStyle }}>
              <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 700 }}>Active Cycle: Q2 IT Equipment Audit</h3>
              <div style={{ display: "flex", gap: 32, marginBottom: 16, fontSize: 13 }}>
                <div><strong>Start Date:</strong> 2026-07-01</div>
                <div><strong>Due Date:</strong> 2026-07-31</div>
                <div><strong>Auditors:</strong> Charlie Brown, Priya K.</div>
                <div><strong>Status:</strong> <span style={{ color: "#3b82f6", fontWeight: 600 }}>IN_PROGRESS</span></div>
              </div>
              <div style={{ height: 8, backgroundColor: "var(--color-page)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: "65%", height: "100%", backgroundColor: "var(--color-primary)" }}></div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: "var(--color-text-muted)" }}>
                <span>65% Verified</span>
                <span>35 / 54 Assets Inspected</span>
              </div>
            </div>
          </>
        );

      case "Reports":
        return (
          <>
            <p style={{ color: "var(--color-text-secondary)", marginBottom: 16 }}>
              Operational efficiency, utilization heatmaps, and cost summaries.
            </p>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginTop: 12 }}>
              <div style={{ ...cardStyle, flex: 1, minWidth: 200, textAlign: "center" }}>
                <h4 style={{ color: "var(--color-text-secondary)", fontSize: 13, marginBottom: 8 }}>Total Fleet Value</h4>
                <div style={{ fontSize: 28, fontWeight: 700 }}>$142,500</div>
              </div>
              <div style={{ ...cardStyle, flex: 1, minWidth: 200, textAlign: "center" }}>
                <h4 style={{ color: "var(--color-text-secondary)", fontSize: 13, marginBottom: 8 }}>Asset Utilization Rate</h4>
                <div style={{ fontSize: 28, fontWeight: 700 }}>88.4%</div>
              </div>
              <div style={{ ...cardStyle, flex: 1, minWidth: 200, textAlign: "center" }}>
                <h4 style={{ color: "var(--color-text-secondary)", fontSize: 13, marginBottom: 8 }}>Maintenance Frequency</h4>
                <div style={{ fontSize: 28, fontWeight: 700 }}>1.2 / yr</div>
              </div>
            </div>
          </>
        );

      case "Activity Logs":
        return (
          <>
            <p style={{ color: "var(--color-text-secondary)", marginBottom: 16 }}>
              System audit logs detailing resource edits, login events, and workflow approvals.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 13, padding: "8px 12px", borderLeft: "4px solid var(--color-border)", display: "flex", justifyContent: "space-between" }}>
                <span><strong>Alice Smith</strong> logged in from IP 192.168.1.15</span>
                <span style={{ color: "var(--color-text-muted)" }}>Today, 12:05:12</span>
              </div>
              <div style={{ fontSize: 13, padding: "8px 12px", borderLeft: "4px solid var(--color-border)", display: "flex", justifyContent: "space-between" }}>
                <span><strong>AF-0022 (Dell UltraSharp)</strong> allocated to <strong>Alice Smith</strong> by Administrator</span>
                <span style={{ color: "var(--color-text-muted)" }}>Yesterday, 14:22:45</span>
              </div>
              <div style={{ fontSize: 13, padding: "8px 12px", borderLeft: "4px solid var(--color-border)", display: "flex", justifyContent: "space-between" }}>
                <span>Maintenance request raised for <strong>AF-0012</strong> by <strong>Bob Jones</strong></span>
                <span style={{ color: "var(--color-text-muted)" }}>2026-07-10, 09:12:00</span>
              </div>
            </div>
          </>
        );

      default:
        return (
          <p style={{ color: "var(--color-text-secondary)" }}>
            Welcome to the {title} page. This is a secure area for department staff and asset operations.
          </p>
        );
    }
  };

  return (
    <div style={{ fontFamily: "var(--font-sans)", color: "var(--color-text-primary)" }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 6 }}>
          {title}
        </h2>
        <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
          Signed in as <strong>{user?.name}</strong> ({user?.email}) · Role: <strong style={{ color: "var(--color-primary)" }}>{user?.role}</strong> · Dept: <strong>{user?.department || "Operations"}</strong>
        </div>
      </div>
      <div style={cardStyle}>{renderContent()}</div>
    </div>
  );
}
