import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import { ClipboardList, Plus, Undo2, ArrowLeftRight } from "lucide-react";
import useAuth from "../hooks/useAuth";
import useApi from "../hooks/useApi";
import useLookups from "../hooks/useLookups";
import { listAllocations, createAllocation, returnAllocation, createTransfer, listAssets } from "../api";
import { PageHeader, Button, Field, Modal, Badge, Spinner, EmptyState, Pager } from "../components/ui";
import { isManager } from "../utils/roles";

export default function AllocationsPage() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const { users, departments, userName, departmentName } = useLookups();

  const [status, setStatus] = useState("");
  const [overdueOnly, setOverdueOnly] = useState(params.get("overdue") === "1");
  const [page, setPage] = useState(1);
  const [showNew, setShowNew] = useState(false);
  const [returning, setReturning] = useState(null); // allocation being returned
  const [conflict, setConflict] = useState(null);   // {assetId, holderName} for transfer suggestion

  const query = useMemo(
    () => ({ status: status || undefined, overdueOnly: overdueOnly || undefined, page, pageSize: 12 }),
    [status, overdueOnly, page]
  );
  const { data, loading, refetch } = useApi(() => listAllocations(query), [query]);

  const manager = isManager(user);

  return (
    <div>
      <PageHeader
        title={manager ? "Allocations" : "My Assets"}
        subtitle={manager ? "Who holds what, with conflict-safe allocation." : "Assets currently allocated to you."}
        actions={manager && (
          <Button onClick={() => setShowNew(true)}><Plus size={15} /> Allocate Asset</Button>
        )}
      />

      <div className="card mb-4 flex flex-wrap items-center gap-2.5 px-4 py-3">
        <select className="input w-44" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="RETURNED">Returned</option>
        </select>
        <label className="flex cursor-pointer items-center gap-2 text-[13px] font-medium" style={{ color: "var(--color-text-secondary)" }}>
          <input type="checkbox" checked={overdueOnly} onChange={(e) => { setOverdueOnly(e.target.checked); setPage(1); }} />
          Overdue only
        </label>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <Spinner label="Loading allocations…" />
        ) : (data?.items || []).length === 0 ? (
          <EmptyState icon={ClipboardList} title="No allocations" hint={manager ? "Allocate an available asset to an employee or department." : "Nothing is allocated to you right now."} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Asset</th><th>Allocated to</th><th>Status</th>
                    <th>Expected return</th><th>Returned on</th>{manager && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((a) => (
                    <tr key={a.id}>
                      <td className="font-mono text-[12px]">{String(a.assetId).slice(0, 8)}…</td>
                      <td className="font-medium" style={{ color: "var(--color-text-primary)" }}>
                        {a.allocatedToUserId ? userName(a.allocatedToUserId) : departmentName(a.allocatedToDepartmentId)}
                        {a.allocatedToDepartmentId && <span className="ml-1.5 text-[11px]" style={{ color: "var(--color-text-muted)" }}>(dept)</span>}
                      </td>
                      <td><Badge value={a.isOverdue ? "OVERDUE" : a.status} /></td>
                      <td>{a.expectedReturnDate ? dayjs(a.expectedReturnDate).format("DD MMM YYYY") : "—"}</td>
                      <td>{a.actualReturnDate ? dayjs(a.actualReturnDate).format("DD MMM YYYY") : "—"}</td>
                      {manager && (
                        <td className="text-right">
                          {a.status === "ACTIVE" && (
                            <Button variant="secondary" size="sm" onClick={() => setReturning(a)}>
                              <Undo2 size={13} /> Return
                            </Button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager page={data.page} totalPages={data.totalPages} onPage={setPage} />
          </>
        )}
      </div>

      <AllocateModal
        open={showNew}
        onClose={() => setShowNew(false)}
        users={users}
        departments={departments}
        onDone={() => { setShowNew(false); refetch(); }}
        onConflict={(info) => { setShowNew(false); setConflict(info); }}
      />
      <ReturnModal
        alloc={returning}
        onClose={() => setReturning(null)}
        onDone={() => { setReturning(null); refetch(); }}
      />
      <ConflictTransferModal
        conflict={conflict}
        users={users}
        departments={departments}
        onClose={() => setConflict(null)}
        onDone={() => { setConflict(null); toast.success("Transfer request submitted for approval"); }}
      />
    </div>
  );
}

/* ── Allocate (PS conflict rule surfaces holder + offers transfer) ── */
function AllocateModal({ open, onClose, users, departments, onDone, onConflict }) {
  const [assets, setAssets] = useState([]);
  const [form, setForm] = useState({ assetId: "", targetType: "USER", targetId: "", expectedReturnDate: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // load available assets when opened
  useEffect(() => {
    if (!open) return;
    listAssets({ status: "AVAILABLE", pageSize: 100 })
      .then((res) => setAssets(res.data?.items || []))
      .catch(() => {});
    setForm({ assetId: "", targetType: "USER", targetId: "", expectedReturnDate: "", notes: "" });
  }, [open]);

  const submit = async () => {
    if (!form.assetId || !form.targetId) {
      toast.error("Pick an asset and a recipient");
      return;
    }
    setSaving(true);
    try {
      await createAllocation({
        assetId: form.assetId,
        allocatedToUserId: form.targetType === "USER" ? form.targetId : null,
        allocatedToDepartmentId: form.targetType === "DEPARTMENT" ? form.targetId : null,
        expectedReturnDate: form.expectedReturnDate || null,
        notes: form.notes || null,
      });
      toast.success("Asset allocated");
      onDone();
    } catch (err) {
      if (err?.code === "ASSET_NOT_AVAILABLE") {
        const holder = err?.details?.holderName;
        toast.error(holder ? `Currently held by ${holder}` : "Asset is not available");
        onConflict({ assetId: form.assetId, holderName: holder });
      } else {
        toast.error(err?.message || "Could not allocate");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open} onClose={onClose} title="Allocate Asset"
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} disabled={saving}>{saving ? "Allocating…" : "Allocate"}</Button>
      </>}
    >
      <div className="space-y-3.5">
        <Field label="Asset" required hint="Only AVAILABLE assets are listed">
          <select className="input" value={form.assetId} onChange={set("assetId")}>
            <option value="">Select asset…</option>
            {assets.map((a) => <option key={a.id} value={a.id}>{a.assetTag} — {a.name}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Allocate to">
            <select className="input" value={form.targetType} onChange={(e) => setForm((f) => ({ ...f, targetType: e.target.value, targetId: "" }))}>
              <option value="USER">Employee</option>
              <option value="DEPARTMENT">Department</option>
            </select>
          </Field>
          <Field label={form.targetType === "USER" ? "Employee" : "Department"} required>
            <select className="input" value={form.targetId} onChange={set("targetId")}>
              <option value="">Select…</option>
              {form.targetType === "USER"
                ? users.map((u) => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)
                : departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Expected return date" hint="Overdue returns are flagged automatically">
          <input type="date" className="input" value={form.expectedReturnDate} onChange={set("expectedReturnDate")} />
        </Field>
        <Field label="Notes">
          <textarea className="input" placeholder="Optional handover notes…" value={form.notes} onChange={set("notes")} />
        </Field>
      </div>
    </Modal>
  );
}

/* ── Return with condition check-in (PS return flow) ── */
function ReturnModal({ alloc, onClose, onDone }) {
  const [condition, setCondition] = useState("GOOD");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await returnAllocation(alloc.id, { condition, returnNotes: notes || null });
      toast.success("Asset returned — status back to AVAILABLE");
      onDone();
    } catch (err) {
      toast.error(err?.message || "Could not return asset");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={!!alloc} onClose={onClose} title="Return Asset"
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} disabled={saving}>{saving ? "Returning…" : "Mark Returned"}</Button>
      </>}
    >
      <div className="space-y-3.5">
        <Field label="Condition at check-in">
          <select className="input" value={condition} onChange={(e) => setCondition(e.target.value)}>
            {["GOOD", "FAIR", "POOR", "DAMAGED"].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Check-in notes">
          <textarea className="input" placeholder="Scratches, missing accessories, etc." value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}

/* ── Conflict → offer a transfer request instead (PS example: Priya/Raj) ── */
function ConflictTransferModal({ conflict, users, departments, onClose, onDone }) {
  const [form, setForm] = useState({ targetType: "USER", targetId: "", notes: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (conflict) setForm({ targetType: "USER", targetId: "", notes: "" }); }, [conflict]);

  const submit = async () => {
    if (!form.targetId) { toast.error("Pick a transfer target"); return; }
    setSaving(true);
    try {
      await createTransfer({
        assetId: conflict.assetId,
        type: "TRANSFER",
        toUserId: form.targetType === "USER" ? form.targetId : null,
        toDepartmentId: form.targetType === "DEPARTMENT" ? form.targetId : null,
        notes: form.notes || null,
      });
      onDone();
    } catch (err) {
      toast.error(err?.message || "Could not create transfer request");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={!!conflict} onClose={onClose} title="Asset already allocated"
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} disabled={saving}><ArrowLeftRight size={14} /> {saving ? "Submitting…" : "Request Transfer"}</Button>
      </>}
    >
      <div
        className="mb-4 rounded-lg px-3.5 py-3 text-[13px]"
        style={{ background: "var(--color-warning-bg)", color: "var(--color-warning)" }}
      >
        This asset is currently held by <b>{conflict?.holderName || "someone else"}</b>.
        You can raise a transfer request instead — it re-allocates automatically once approved.
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Transfer to">
          <select className="input" value={form.targetType} onChange={(e) => setForm((f) => ({ ...f, targetType: e.target.value, targetId: "" }))}>
            <option value="USER">Employee</option>
            <option value="DEPARTMENT">Department</option>
          </select>
        </Field>
        <Field label={form.targetType === "USER" ? "Employee" : "Department"} required>
          <select className="input" value={form.targetId} onChange={(e) => setForm((f) => ({ ...f, targetId: e.target.value }))}>
            <option value="">Select…</option>
            {form.targetType === "USER"
              ? users.map((u) => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)
              : departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </Field>
      </div>
      <div className="mt-3">
        <Field label="Reason">
          <textarea className="input" placeholder="Why is this transfer needed?" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
        </Field>
      </div>
    </Modal>
  );
}
