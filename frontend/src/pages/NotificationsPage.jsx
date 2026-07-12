import { useState } from "react";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  Bell, CheckCheck, Package, ArrowLeftRight, Wrench, Calendar, ShieldCheck, AlertTriangle,
} from "lucide-react";
import useApi from "../hooks/useApi";
import { listNotifications, markNotificationRead, markAllNotificationsRead } from "../api";
import { PageHeader, Button, Spinner, EmptyState } from "../components/ui";
import clsx from "clsx";

dayjs.extend(relativeTime);

const TYPE_META = {
  ASSET_ALLOCATED: { icon: Package, intent: "info" },
  ASSET_RETURNED: { icon: Package, intent: "success" },
  TRANSFER_REQUESTED: { icon: ArrowLeftRight, intent: "warning" },
  TRANSFER_APPROVED: { icon: ArrowLeftRight, intent: "success" },
  TRANSFER_REJECTED: { icon: ArrowLeftRight, intent: "danger" },
  MAINTENANCE_REQUESTED: { icon: Wrench, intent: "warning" },
  MAINTENANCE_APPROVED: { icon: Wrench, intent: "success" },
  MAINTENANCE_REJECTED: { icon: Wrench, intent: "danger" },
  MAINTENANCE_RESOLVED: { icon: Wrench, intent: "success" },
  BOOKING_CONFIRMED: { icon: Calendar, intent: "success" },
  BOOKING_CANCELLED: { icon: Calendar, intent: "neutral" },
  BOOKING_REMINDER: { icon: Calendar, intent: "info" },
  OVERDUE_RETURN: { icon: AlertTriangle, intent: "danger" },
  AUDIT_ASSIGNED: { icon: ShieldCheck, intent: "info" },
  AUDIT_DISCREPANCY: { icon: ShieldCheck, intent: "danger" },
};

export default function NotificationsPage() {
  const [filter, setFilter] = useState("all");
  const { data, loading, refetch } = useApi(
    () => listNotifications(filter === "unread" ? { isRead: false } : undefined),
    [filter]
  );
  const items = data || [];
  const unreadCount = items.filter((n) => !n.isRead).length;

  const markOne = async (n) => {
    if (n.isRead) return;
    try {
      await markNotificationRead(n.id);
      refetch(true);
    } catch { /* ignore */ }
  };

  const markAll = async () => {
    try {
      const res = await markAllNotificationsRead();
      toast.success(`${res.data?.updated ?? 0} marked as read`);
      refetch();
    } catch (err) {
      toast.error(err?.message || "Could not mark all read");
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Notifications"
        subtitle="Allocations, transfers, maintenance, bookings and audits — all in one stream."
        actions={unreadCount > 0 && (
          <Button variant="secondary" size="sm" onClick={markAll}><CheckCheck size={14} /> Mark all read</Button>
        )}
      />

      <div className="mb-4 flex gap-1 rounded-xl p-1" style={{ background: "var(--color-surface-hover)", width: "fit-content" }}>
        {["all", "unread"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={clsx("btn btn-sm capitalize", filter === f ? "" : "btn-ghost")}
            style={filter === f ? { background: "var(--color-surface)", boxShadow: "var(--shadow-card)", color: "var(--color-text-primary)" } : {}}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <Spinner label="Loading notifications…" />
        ) : items.length === 0 ? (
          <EmptyState icon={Bell} title="You're all caught up" hint="New notifications will appear here." />
        ) : (
          <ul>
            {items.map((n) => {
              const meta = TYPE_META[n.type] || { icon: Bell, intent: "neutral" };
              const Icon = meta.icon;
              return (
                <li
                  key={n.id}
                  onClick={() => markOne(n)}
                  className="flex cursor-pointer items-start gap-3.5 px-4 py-3.5 transition-colors"
                  style={{
                    borderBottom: "1px solid var(--color-border-light)",
                    background: n.isRead ? "transparent" : "color-mix(in srgb, var(--color-primary) 4%, transparent)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-surface-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = n.isRead ? "transparent" : "color-mix(in srgb, var(--color-primary) 4%, transparent)")}
                >
                  <span
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: `var(--color-${meta.intent}-bg)`, color: `var(--color-${meta.intent})` }}
                  >
                    <Icon size={15} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px]" style={{ color: "var(--color-text-primary)", fontWeight: n.isRead ? 400 : 600 }}>
                      {n.message}
                    </p>
                    <p className="mt-0.5 text-[11.5px]" style={{ color: "var(--color-text-muted)" }}>
                      {dayjs(n.createdAt).fromNow()} · {String(n.type).replaceAll("_", " ").toLowerCase()}
                    </p>
                  </div>
                  {!n.isRead && (
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full" style={{ background: "var(--color-primary)" }} />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
