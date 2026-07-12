import { useNavigate } from "react-router-dom";
import {
  Package, PackageCheck, Wrench, CalendarClock, ArrowLeftRight,
  AlertTriangle, Clock4, PlusCircle, CalendarPlus, Hammer,
} from "lucide-react";
import useAuth from "../hooks/useAuth";
import useApi from "../hooks/useApi";
import { getDashboardStats, listAllocations } from "../api";
import { PageHeader, StatCard, Spinner, EmptyState, Badge, Button } from "../components/ui";
import { isManager, fullName } from "../utils/roles";
import dayjs from "dayjs";

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: stats, loading } = useApi(getDashboardStats);
  const { data: overdue } = useApi(() => listAllocations({ overdueOnly: true, pageSize: 5 }));
  const { data: upcoming } = useApi(() => listAllocations({ status: "ACTIVE", pageSize: 5 }));

  const kpis = [
    { icon: Package, label: "Assets Available", value: stats?.assetsAvailable, intent: "success", to: "/assets?status=AVAILABLE" },
    { icon: PackageCheck, label: "Assets Allocated", value: stats?.assetsAllocated, intent: "info", to: "/assets?status=ALLOCATED" },
    { icon: Wrench, label: "Open Maintenance", value: stats?.openMaintenance, intent: "warning", to: "/maintenance" },
    { icon: CalendarClock, label: "Active Bookings", value: stats?.activeBookings, intent: "info", to: "/bookings" },
    { icon: ArrowLeftRight, label: "Pending Transfers", value: stats?.pendingTransfers, intent: "warning", to: "/transfers" },
    { icon: Clock4, label: "Upcoming Returns", value: stats?.upcomingReturns, intent: "neutral", to: "/allocations" },
  ];

  const quickActions = [
    isManager(user) && { icon: PlusCircle, label: "Register Asset", to: "/assets?new=1" },
    { icon: CalendarPlus, label: "Book Resource", to: "/bookings?new=1" },
    { icon: Hammer, label: "Raise Maintenance Request", to: "/maintenance?new=1" },
  ].filter(Boolean);

  const upcomingRows = (upcoming?.items || []).filter(
    (a) => a.expectedReturnDate && !a.isOverdue
  ).slice(0, 5);

  return (
    <div>
      <PageHeader
        title={`Good ${greeting()}, ${user?.firstName || fullName(user)}`}
        subtitle="Here's your operational snapshot."
        actions={quickActions.map(({ icon: Icon, label, to }) => (
          <Button key={label} variant="secondary" size="sm" onClick={() => navigate(to)}>
            <Icon size={14} /> {label}
          </Button>
        ))}
      />

      {loading ? (
        <Spinner label="Loading dashboard…" />
      ) : (
        <>
          {/* KPI grid */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {kpis.map((k) => (
              <StatCard key={k.label} icon={k.icon} label={k.label} value={k.value} intent={k.intent} onClick={() => navigate(k.to)} />
            ))}
          </div>

          {/* Overdue vs upcoming returns */}
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <section className="card overflow-hidden">
              <header className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid var(--color-border)" }}>
                <AlertTriangle size={15} style={{ color: "var(--color-danger)" }} />
                <h2 className="text-[13.5px] font-semibold">Overdue Returns</h2>
                {overdue?.totalItems > 0 && <Badge intent="danger">{overdue.totalItems}</Badge>}
              </header>
              {(overdue?.items || []).length === 0 ? (
                <EmptyState title="No overdue returns" hint="Everything is back on time." />
              ) : (
                <ReturnList rows={overdue.items} danger onOpen={() => navigate("/allocations?overdue=1")} />
              )}
            </section>

            <section className="card overflow-hidden">
              <header className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid var(--color-border)" }}>
                <Clock4 size={15} style={{ color: "var(--color-info)" }} />
                <h2 className="text-[13.5px] font-semibold">Upcoming Returns</h2>
              </header>
              {upcomingRows.length === 0 ? (
                <EmptyState title="No upcoming returns" hint="Allocations with a return date show up here." />
              ) : (
                <ReturnList rows={upcomingRows} onOpen={() => navigate("/allocations")} />
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}

function ReturnList({ rows, danger, onOpen }) {
  return (
    <ul>
      {rows.map((a) => (
        <li
          key={a.id}
          className="flex cursor-pointer items-center justify-between px-4 py-2.5 text-[13px] transition-colors"
          style={{ borderBottom: "1px solid var(--color-border-light)" }}
          onClick={onOpen}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-surface-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <span className="font-mono text-[12px]" style={{ color: "var(--color-text-secondary)" }}>
            Asset {String(a.assetId).slice(0, 8)}…
          </span>
          <span className="font-medium" style={{ color: danger ? "var(--color-danger)" : "var(--color-text-secondary)" }}>
            {a.expectedReturnDate ? dayjs(a.expectedReturnDate).format("DD MMM YYYY") : "—"}
          </span>
        </li>
      ))}
    </ul>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
