import { useEffect } from "react";
import { X, Loader2, Inbox, ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";

/* ── Button ── */
export function Button({ variant = "primary", size = "md", className, children, ...props }) {
  return (
    <button
      className={clsx("btn", `btn-${variant}`, size === "sm" ? "btn-sm" : "btn-md", className)}
      {...props}
    >
      {children}
    </button>
  );
}

/* ── Form field wrapper ── */
export function Field({ label, error, required, hint, children }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-[13px] font-medium" style={{ color: "var(--color-text-secondary)" }}>
          {label} {required && <span style={{ color: "var(--color-danger)" }}>*</span>}
        </span>
      )}
      {children}
      {hint && !error && (
        <span className="mt-1 block text-xs" style={{ color: "var(--color-text-muted)" }}>{hint}</span>
      )}
      {error && (
        <span className="mt-1 block text-xs font-medium" style={{ color: "var(--color-danger)" }}>{error}</span>
      )}
    </label>
  );
}

/* ── Badge with status intent mapping ── */
const INTENT = {
  // asset statuses
  AVAILABLE: "success", ALLOCATED: "info", RESERVED: "info",
  UNDER_MAINTENANCE: "warning", LOST: "danger", RETIRED: "neutral", DISPOSED: "neutral",
  // generic workflow
  ACTIVE: "info", RETURNED: "neutral", PENDING: "warning", APPROVED: "success",
  REJECTED: "danger", IN_PROGRESS: "info", RESOLVED: "success",
  // booking
  UPCOMING: "info", ONGOING: "success", COMPLETED: "neutral", CANCELLED: "neutral",
  // audit
  OPEN: "success", CLOSED: "neutral", FOUND: "success", MISSING: "danger", DAMAGED: "warning",
  // conditions
  GOOD: "success", FAIR: "warning", POOR: "danger",
  // roles
  ADMIN: "danger", ASSET_MANAGER: "info", DEPARTMENT_HEAD: "warning", EMPLOYEE: "neutral",
  INACTIVE: "neutral", OVERDUE: "danger",
};

export function Badge({ value, intent, children }) {
  const kind = intent || INTENT[value] || "neutral";
  return (
    <span
      className="badge"
      style={{ background: `var(--color-${kind}-bg)`, color: `var(--color-${kind})` }}
    >
      {children || String(value || "").replaceAll("_", " ")}
    </span>
  );
}

/* ── Modal ── */
export function Modal({ open, onClose, title, children, footer, wide }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgb(0 0 0 / 0.5)", backdropFilter: "blur(2px)" }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div
        className={clsx("card anim-modal-in w-full overflow-hidden", wide ? "max-w-2xl" : "max-w-md")}
        style={{ boxShadow: "var(--shadow-pop)" }}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <h3 className="text-[15px] font-semibold" style={{ fontFamily: "var(--font-heading)" }}>{title}</h3>
          <button onClick={onClose} className="btn btn-ghost h-7 w-7 rounded-md p-0">
            <X size={15} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 px-5 py-3.5" style={{ borderTop: "1px solid var(--color-border)", background: "var(--color-surface-hover)" }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Loading / Empty ── */
export function Spinner({ label = "Loading…" }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14" style={{ color: "var(--color-text-muted)" }}>
      <Loader2 size={22} className="animate-spin" />
      <span className="text-[13px]">{label}</span>
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title = "Nothing here yet", hint, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 py-14 text-center">
      <div
        className="mb-1 flex h-11 w-11 items-center justify-center rounded-full"
        style={{ background: "var(--color-surface-hover)", color: "var(--color-text-muted)" }}
      >
        <Icon size={20} />
      </div>
      <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{title}</p>
      {hint && <p className="max-w-xs text-[13px]" style={{ color: "var(--color-text-muted)" }}>{hint}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

/* ── Page header ── */
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="anim-fade-up mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>{title}</h1>
        {subtitle && <p className="mt-0.5 text-[13px]" style={{ color: "var(--color-text-muted)" }}>{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ── Pagination bar ── */
export function Pager({ page, totalPages, onPage }) {
  if (!totalPages || totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-end gap-2 px-4 py-3 text-[13px]" style={{ color: "var(--color-text-muted)", borderTop: "1px solid var(--color-border)" }}>
      <span>Page {page} of {totalPages}</span>
      <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        <ChevronLeft size={14} />
      </Button>
      <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
        <ChevronRight size={14} />
      </Button>
    </div>
  );
}

/* ── Stat card (dashboard KPI) ── */
export function StatCard({ icon: Icon, label, value, intent = "info", onClick, sub }) {
  return (
    <button
      onClick={onClick}
      className="card anim-fade-up flex w-full items-center gap-3.5 px-4 py-4 text-left transition-transform hover:-translate-y-0.5"
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
        style={{ background: `var(--color-${intent}-bg)`, color: `var(--color-${intent})` }}
      >
        <Icon size={19} />
      </div>
      <div className="min-w-0">
        <div className="text-[22px] font-bold leading-6 tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
          {value ?? "—"}
        </div>
        <div className="truncate text-[12px] font-medium" style={{ color: "var(--color-text-muted)" }}>
          {label}{sub && <span className="ml-1 opacity-70">· {sub}</span>}
        </div>
      </div>
    </button>
  );
}
