import { Boxes, Package, CalendarCheck2, ShieldCheck, Wrench } from "lucide-react";

const FEATURES = [
  { icon: Package, text: "Track every asset through its full lifecycle" },
  { icon: CalendarCheck2, text: "Book shared resources without conflicts" },
  { icon: Wrench, text: "Approval-driven maintenance workflows" },
  { icon: ShieldCheck, text: "Structured audit cycles & discrepancy reports" },
];

/** Split-panel auth shell: brand story on the left, form on the right. */
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="relative flex min-h-screen overflow-hidden" style={{ background: "var(--color-page)" }}>
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(circle at 20% 20%, color-mix(in srgb, var(--color-primary) 18%, transparent), transparent 28%), radial-gradient(circle at 80% 10%, color-mix(in srgb, var(--color-info) 15%, transparent), transparent 26%), linear-gradient(180deg, transparent, color-mix(in srgb, var(--color-page) 92%, white))",
        }}
      />
      {/* ── Brand panel ── */}
      <div
        className="relative hidden w-[46%] flex-col justify-between overflow-hidden p-10 lg:flex"
        style={{
          background:
            "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.14), transparent 28%), linear-gradient(160deg, #1e1b4b 0%, #4338ca 44%, #6366f1 100%)",
        }}
      >
        {/* decorative grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="pointer-events-none absolute -left-20 top-28 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-20 right-10 h-40 w-40 rounded-full bg-indigo-300/15 blur-3xl" />
        <div className="relative flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur">
            <Boxes size={19} />
          </div>
          <span className="text-lg font-bold tracking-tight text-white" style={{ fontFamily: "var(--font-heading)" }}>
            AssetFlow
          </span>
        </div>

        <div className="relative max-w-md">
          <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/90">
            Enterprise workspace
          </span>
          <h2
            className="mt-5 max-w-md text-[36px] font-bold leading-tight text-white"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Every asset. Every desk. One source of truth.
          </h2>
          <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-indigo-50/88">
            Built for teams that need the app to feel as organized as the work it manages.
          </p>
          <div className="mt-8 grid gap-3">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-[13.5px] text-indigo-50/95 backdrop-blur-sm"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/12">
                  <Icon size={14} />
                </span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center justify-between rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white/90 backdrop-blur-sm">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/60">Workspace mode</p>
            <p className="mt-1 text-[13px] font-medium">Track assets, approvals, and teams in one place.</p>
          </div>
          <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold">
            Live
          </div>
        </div>

        <p className="relative text-[12px] text-indigo-100/70">
          © {new Date().getFullYear()} AssetFlow — Enterprise Asset & Resource Management
        </p>
      </div>

      {/* ── Form panel ── */}
      <div className="relative flex flex-1 items-center justify-center px-5 py-10">
        <div className="anim-fade-up card relative w-full max-w-[430px] border-white/10 bg-[color:var(--color-surface)]/95 p-6 shadow-[0_24px_70px_-28px_rgba(15,23,42,0.42)] backdrop-blur-xl sm:p-8">
          {/* mobile brand */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: "var(--color-primary)", color: "var(--color-primary-text)" }}
            >
              <Boxes size={19} />
            </div>
            <span className="text-lg font-bold tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
              AssetFlow
            </span>
          </div>

          <h1 className="text-[28px] font-bold tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
            {title}
          </h1>
          <p className="mb-7 mt-2 text-[14px] leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
            {subtitle}
          </p>

          {children}

          {footer && <div className="mt-6 text-center text-[13.5px]" style={{ color: "var(--color-text-muted)" }}>{footer}</div>}
        </div>
      </div>
    </div>
  );
}
