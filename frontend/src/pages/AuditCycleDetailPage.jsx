import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import { ArrowLeft, Lock, FileWarning, CheckCircle2, HelpCircle, AlertTriangle } from "lucide-react";
import useAuth from "../hooks/useAuth";
import useApi from "../hooks/useApi";
import { getAuditCycle, listAuditItems, updateAuditItem, closeAuditCycle, listDiscrepancies, listAssets } from "../api";
import { PageHeader, Button, Badge, Spinner, EmptyState, Modal, Field } from "../components/ui";
import { isManager } from "../utils/roles";

export default function AuditCycleDetailPage() {
  const { auditCycleId: id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filter, setFilter] = useState("");
  const [assets, setAssets] = useState([]);
  const [marking, setMarking] = useState(null); // item being marked
  const [confirmClose, setConfirmClose] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const { data: cycle, loading, refetch } = useApi(() => getAuditCycle(id), [id]);
  const { data: items, refetch: refetchItems } = useApi(
    () => listAuditItems(id, filter ? { result: filter } : undefined), [id, filter]
  );
  const { data: discrepancies, refetch: refetchDisc } = useApi(() => listDiscrepancies(id), [id]);

  useEffect(() => {
    listAssets({ pageSize: 100 }).then((res) => setAssets(res.data?.items || [])).catch(() => {});
  }, []);

  if (loading) return <Spinner label="Loading audit cycle…" />;
  if (!cycle) return <EmptyState title="Audit cycle not found" />;

  const assetName = (aid) => {
    const a = assets.find((x) => x.id === aid);
    return a ? `${a.assetTag} — ${a.name}` : `${String(aid).slice(0, 8)}…`;
  };

  const open = cycle.status === "OPEN";
  const done = cycle.totalItems - cycle.pendingCount;
  const pct = cycle.totalItems ? Math.round((done / cycle.totalItems) * 100) : 0;
  const flagged = cycle.missingCount + cycle.damagedCount;

  const doClose = async () => {
    try {
      await closeAuditCycle(id);
      toast.success("Cycle closed — missing items marked LOST");
      setConfirmClose(false);
      refetch(); refetchItems(); refetchDisc();
    } catch (err) {
      toast.error(err?.message || "Could not close cycle");
    }
  };

  return (
    <div>
      <button
        onClick={() => navigate("/audits")}
        className="mb-3 flex cursor-pointer items-center gap-1.5 text-[13px] font-medium"
        style={{ color: "var(--color-text-muted)" }}
      >
        <ArrowLeft size={14} /> All audit cycles
      </button>

      <PageHeader
        title={<span className="flex items-center gap-3">{cycle.name} <Badge value={cycle.status} /></span>}
        subtitle={`Created ${dayjs(cycle.createdAt).format("DD MMM YYYY")}${cycle.closedAt ? ` · closed ${dayjs(cycle.closedAt).format("DD MMM YYYY")}` : ""}`}
        actions={
          <>
            {flagged > 0 && (
              <Button variant="secondary" size="sm" onClick={() => setShowReport(true)}>
                <FileWarning size={14} /> Discrepancy Report ({flagged})
              </Button>
            )}
            {open && isManager(user) && (
              <Button variant="danger" size="sm" onClick={() => setConfirmClose(true)}>
                <Lock size={14} /> Close Cycle
              </Button>
            )}
          </>
        }
      />

      {/* Summary strip */}
      <div className="card mb-4 grid grid-cols-2 gap-4 px-5 py-4 sm:grid-cols-5">
        <Summary label="Total items" value={cycle.totalItems} />
        <Summary label="Pending" value={cycle.pendingCount} color="var(--color-warning)" />
        <Summary label="Found" value={cycle.foundCount} color="var(--color-success)" />
        <Summary label="Missing" value={cycle.missingCount} color="var(--color-danger)" />
        <Summary label="Damaged" value={cycle.damagedCount} color="var(--color-warning)" />
        <div className="col-span-full">
          <div className="h-1.5 overflow-hidden rounded-full" style={{ background: "var(--color-border-light)" }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: "var(--color-primary)" }} />
          </div>
          <p className="mt-1 text-[11.5px]" style={{ color: "var(--color-text-muted)" }}>{pct}% verified</p>
        </div>
      </div>

      {/* Items */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <h2 className="mr-auto text-[13.5px] font-semibold">Audit Items</h2>
          <select className="input h-8 w-40 text-[13px]" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All results</option>
            {["PENDING", "FOUND", "MISSING", "DAMAGED"].map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        {(items || []).length === 0 ? (
          <EmptyState title="No items" hint="Adjust the filter to see other results." />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr><th>Asset</th><th>Result</th><th>Condition</th><th>Notes</th><th>Verified</th>{open && <th></th>}</tr>
              </thead>
              <tbody>
                {(items || []).map((it) => (
                  <tr key={it.id}>
                    <td className="font-medium" style={{ color: "var(--color-text-primary)" }}>{assetName(it.assetId)}</td>
                    <td><Badge value={it.result} /></td>
                    <td>{it.condition ? <Badge value={it.condition} /> : "—"}</td>
                    <td className="max-w-48 truncate">{it.notes || "—"}</td>
                    <td>{it.verifiedAt ? dayjs(it.verifiedAt).format("DD MMM, HH:mm") : "—"}</td>
                    {open && (
                      <td className="text-right">
                        <Button variant="secondary" size="sm" onClick={() => setMarking(it)}>
                          {it.result === "PENDING" ? "Verify" : "Re-mark"}
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <MarkItemModal
        item={marking}
        assetName={marking ? assetName(marking.assetId) : ""}
        cycleId={id}
        onClose={() => setMarking(null)}
        onDone={() => { setMarking(null); refetch(); refetchItems(); refetchDisc(); }}
      />

      {/* Close confirm */}
      <Modal
        open={confirmClose} onClose={() => setConfirmClose(false)} title="Close audit cycle?"
        footer={<>
          <Button variant="secondary" onClick={() => setConfirmClose(false)}>Cancel</Button>
          <Button variant="danger" onClick={doClose}><Lock size={14} /> Close Cycle</Button>
        </>}
      >
        <div className="space-y-2 text-[13.5px]" style={{ color: "var(--color-text-secondary)" }}>
          <p>Closing locks the cycle — items can no longer be updated.</p>
          <p className="flex items-center gap-2" style={{ color: "var(--color-danger)" }}>
            <AlertTriangle size={15} /> {cycle.missingCount} missing item{cycle.missingCount === 1 ? "" : "s"} will be marked LOST.
          </p>
          {cycle.pendingCount > 0 && (
            <p style={{ color: "var(--color-warning)" }}>{cycle.pendingCount} item(s) are still pending verification.</p>
          )}
        </div>
      </Modal>

      {/* Discrepancy report */}
      <Modal open={showReport} onClose={() => setShowReport(false)} title="Discrepancy Report" wide>
        {(discrepancies || []).length === 0 ? (
          <EmptyState icon={CheckCircle2} title="No discrepancies" hint="All verified items were found in good order." />
        ) : (
          <table className="table-base">
            <thead><tr><th>Tag</th><th>Asset</th><th>Result</th><th>Notes</th></tr></thead>
            <tbody>
              {discrepancies.map((d) => (
                <tr key={d.assetId}>
                  <td className="font-mono text-[12px]">{d.assetTag}</td>
                  <td className="font-medium" style={{ color: "var(--color-text-primary)" }}>{d.assetName}</td>
                  <td><Badge value={d.result} /></td>
                  <td className="max-w-52 truncate">{d.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Modal>
    </div>
  );
}

function Summary({ label, value, color }) {
  return (
    <div>
      <div className="text-[20px] font-bold" style={{ fontFamily: "var(--font-heading)", color: color || "var(--color-text-primary)" }}>
        {value}
      </div>
      <div className="text-[11.5px] font-medium" style={{ color: "var(--color-text-muted)" }}>{label}</div>
    </div>
  );
}

function MarkItemModal({ item, assetName, cycleId, onClose, onDone }) {
  const [result, setResult] = useState("FOUND");
  const [condition, setCondition] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setResult(item.result === "PENDING" ? "FOUND" : item.result);
      setCondition(item.condition || "");
      setNotes(item.notes || "");
    }
  }, [item]);

  const submit = async () => {
    setSaving(true);
    try {
      await updateAuditItem(cycleId, item.id, {
        result,
        condition: condition || null,
        notes: notes || null,
      });
      toast.success("Item verified");
      onDone();
    } catch (err) {
      toast.error(err?.message || "Could not update item");
    } finally {
      setSaving(false);
    }
  };

  const OPTIONS = [
    { v: "FOUND", icon: CheckCircle2, color: "var(--color-success)", label: "Found" },
    { v: "MISSING", icon: HelpCircle, color: "var(--color-danger)", label: "Missing" },
    { v: "DAMAGED", icon: AlertTriangle, color: "var(--color-warning)", label: "Damaged" },
  ];

  return (
    <Modal
      open={!!item} onClose={onClose} title="Verify Asset"
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} disabled={saving}>{saving ? "Saving…" : "Save Result"}</Button>
      </>}
    >
      <p className="mb-4 text-[13.5px] font-medium">{assetName}</p>
      <div className="mb-4 grid grid-cols-3 gap-2">
        {OPTIONS.map(({ v, icon: Icon, color, label }) => (
          <button
            key={v}
            onClick={() => setResult(v)}
            className="flex cursor-pointer flex-col items-center gap-1.5 rounded-xl px-3 py-3.5 text-[13px] font-semibold transition-all"
            style={{
              border: `2px solid ${result === v ? color : "var(--color-border)"}`,
              color: result === v ? color : "var(--color-text-muted)",
              background: result === v ? `color-mix(in srgb, ${color} 8%, transparent)` : "transparent",
            }}
          >
            <Icon size={19} /> {label}
          </button>
        ))}
      </div>
      <div className="space-y-3.5">
        <Field label="Condition observed">
          <select className="input" value={condition} onChange={(e) => setCondition(e.target.value)}>
            <option value="">Not recorded</option>
            {["GOOD", "FAIR", "POOR", "DAMAGED"].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Notes">
          <textarea className="input" placeholder="Where was it found? What's damaged?…" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}
