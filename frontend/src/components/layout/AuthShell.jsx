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
    <div className="flex min-h-screen" style={{ background: "var(--color-page)" }}>
      {/* ── Brand panel ── */}
      <div
        className="relative hidden w-[46%] flex-col justify-between overflow-hidden p-10 lg:flex"
        style={{ background: "linear-gradient(160deg, #312e81 0%, #4f46e5 55%, #6366f1 100%)" }}
      >
        {/* decorative grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />
        <div className="relative flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white backdrop-blur">
            <Boxes size={19} />
          </div>
          <span className="text-lg font-bold tracking-tight text-white" style={{ fontFamily: "var(--font-heading)" }}>
            AssetFlow
          </span>
        </div>

        <div className="relative">
          <h2
            className="max-w-md text-[30px] font-bold leading-tight text-white"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Every asset. Every desk. One source of truth.
          </h2>
          <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-indigo-100/90">
            The enterprise asset & resource management platform for teams that
            outgrew spreadsheets.
          </p>
          <ul className="mt-8 space-y-3.5">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-[13.5px] text-indigo-50/95">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/12">
                  <Icon size={14} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-[12px] text-indigo-200/70">
          © {new Date().getFullYear()} AssetFlow — Enterprise Asset & Resource Management
        </p>
      </div>

      {/* ── Form panel ── */}
      <div className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="anim-fade-up w-full max-w-[400px]">
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

          <h1 className="text-[22px] font-bold tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
            {title}
          </h1>
          <p className="mb-7 mt-1 text-[13.5px]" style={{ color: "var(--color-text-muted)" }}>
            {subtitle}
          </p>

          {children}

          {footer && <div className="mt-6 text-center text-[13.5px]" style={{ color: "var(--color-text-muted)" }}>{footer}</div>}
        </div>
      </div>
    </div>
  );
}
