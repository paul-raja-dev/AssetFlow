import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import { ShieldCheck, Plus } from "lucide-react";
import useAuth from "../hooks/useAuth";
import useApi from "../hooks/useApi";
import useLookups from "../hooks/useLookups";
import { listAuditCycles, createAuditCycle } from "../api";
import { PageHeader, Button, Field, Modal, Badge, Spinner, EmptyState } from "../components/ui";
import { isManager } from "../utils/roles";

export default function AuditsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { departments, users } = useLookups();
  const [showNew, setShowNew] = useState(false);

  const { data, loading, refetch } = useApi(listAuditCycles);
  const cycles = data || [];

  return (
    <div>
      <PageHeader
        title="Audit Cycles"
        subtitle="Structured verification cycles with assigned auditors and discrepancy reports."
        actions={isManager(user) && (
          <Button onClick={() => setShowNew(true)}><Plus size={15} /> New Audit Cycle</Button>
        )}
      />

      <div className="card overflow-hidden">
        {loading ? (
          <Spinner label="Loading audit cycles…" />
        ) : cycles.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="No audit cycles yet"
            hint="Create a cycle scoped to a department or location — items are generated automatically."
            action={isManager(user) && <Button size="sm" onClick={() => setShowNew(true)}><Plus size={14} /> New Audit Cycle</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Name</th><th>Status</th><th>Scope</th><th>Progress</th>
                  <th>Flagged</th><th>Created</th>
                </tr>
              </thead>
              <tbody>
                {cycles.map((c) => {
                  const done = c.totalItems - c.pendingCount;
                  const pct = c.totalItems ? Math.round((done / c.totalItems) * 100) : 0;
                  return (
                    <tr key={c.id} className="cursor-pointer" onClick={() => navigate(`/audits/${c.id}`)}>
                      <td className="font-medium" style={{ color: "var(--color-text-primary)" }}>{c.name}</td>
                      <td><Badge value={c.status} /></td>
                      <td>
                        {c.departmentId
                          ? departments.find((d) => d.id === c.departmentId)?.name || "Department"
                          : c.location || "All assets"}
                      </td>
                      <td className="min-w-36">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: "var(--color-border-light)" }}>
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--color-primary)" }} />
                          </div>
                          <span className="text-[11.5px] font-medium" style={{ color: "var(--color-text-muted)" }}>
                            {done}/{c.totalItems}
                          </span>
                        </div>
                      </td>
                      <td>
                        {c.missingCount + c.damagedCount > 0
                          ? <Badge intent="danger">{c.missingCount + c.damagedCount} flagged</Badge>
                          : <span style={{ color: "var(--color-text-muted)" }}>—</span>}
                      </td>
                      <td>{dayjs(c.createdAt).format("DD MMM YYYY")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <NewCycleModal
        open={showNew}
        departments={departments}
        users={users}
        onClose={() => setShowNew(false)}
        onDone={() => { setShowNew(false); refetch(); }}
      />
    </div>
  );
}

function NewCycleModal({ open, departments, users, onClose, onDone }) {
  const [form, setForm] = useState({ name: "", scope: "ALL", departmentId: "", location: "", auditorIds: [] });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm({ name: "", scope: "ALL", departmentId: "", location: "", auditorIds: [] });
  }, [open]);

  const toggleAuditor = (id) =>
    setForm((f) => ({
      ...f,
      auditorIds: f.auditorIds.includes(id) ? f.auditorIds.filter((x) => x !== id) : [...f.auditorIds, id],
    }));

  const submit = async () => {
    if (!form.name.trim()) { toast.error("Give the cycle a name"); return; }
    if (form.scope === "DEPARTMENT" && !form.departmentId) { toast.error("Pick a department"); return; }
    if (form.scope === "LOCATION" && !form.location.trim()) { toast.error("Enter a location"); return; }
    if (form.auditorIds.length === 0) { toast.error("Assign at least one auditor"); return; }
    setSaving(true);
    try {
      await createAuditCycle({
        name: form.name.trim(),
        departmentId: form.scope === "DEPARTMENT" ? form.departmentId : null,
        location: form.scope === "LOCATION" ? form.location.trim() : null,
        auditorIds: form.auditorIds,
      });
      toast.success("Audit cycle created — items generated");
      onDone();
    } catch (err) {
      toast.error(err?.message || "Could not create cycle");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open} onClose={onClose} title="New Audit Cycle" wide
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} disabled={saving}>{saving ? "Creating…" : "Create Cycle"}</Button>
      </>}
    >
      <div className="space-y-3.5">
        <Field label="Cycle name" required>
          <input className="input" placeholder="e.g. Q3 IT Equipment Audit" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} autoFocus />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Scope">
            <select className="input" value={form.scope} onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value }))}>
              <option value="ALL">All assets</option>
              <option value="DEPARTMENT">By department</option>
              <option value="LOCATION">By location</option>
            </select>
          </Field>
          {form.scope === "DEPARTMENT" && (
            <Field label="Department" required>
              <select className="input" value={form.departmentId} onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))}>
                <option value="">Select…</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </Field>
          )}
          {form.scope === "LOCATION" && (
            <Field label="Location" required>
              <input className="input" placeholder="e.g. HQ · Floor 3" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
            </Field>
          )}
        </div>
        <Field label="Auditors" required hint="Auditors are notified and can mark items Found / Missing / Damaged">
          <div className="max-h-44 space-y-1 overflow-y-auto rounded-lg p-2" style={{ border: "1px solid var(--color-border)" }}>
            {users.length === 0 && <p className="px-2 py-1 text-[13px]" style={{ color: "var(--color-text-muted)" }}>No users found</p>}
            {users.map((u) => (
              <label
                key={u.id}
                className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] transition-colors"
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-surface-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <input type="checkbox" checked={form.auditorIds.includes(u.id)} onChange={() => toggleAuditor(u.id)} />
                <span className="font-medium">{u.firstName} {u.lastName}</span>
                <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>{u.email}</span>
              </label>
            ))}
          </div>
        </Field>
      </div>
    </Modal>
  );
}
