import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import { ArrowLeftRight, Check, X, Plus } from "lucide-react";
import useAuth from "../hooks/useAuth";
import useApi from "../hooks/useApi";
import useLookups from "../hooks/useLookups";
import { listTransfers, approveTransfer, rejectTransfer, createTransfer, listAssets } from "../api";
import { PageHeader, Button, Field, Modal, Badge, Spinner, EmptyState, Pager } from "../components/ui";
import { canApprove } from "../utils/roles";

export default function TransfersPage() {
  const { user } = useAuth();
  const { users, departments, userName, departmentName } = useLookups();
  const [status, setStatus] = useState("PENDING");
  const [page, setPage] = useState(1);
  const [showNew, setShowNew] = useState(false);
  const [acting, setActing] = useState(null);

  const query = useMemo(() => ({ status: status || undefined, page, pageSize: 12 }), [status, page]);
  const { data, loading, refetch } = useApi(() => listTransfers(query), [query]);

  const act = async (id, action) => {
    setActing(id);
    try {
      if (action === "approve") await approveTransfer(id);
      else await rejectTransfer(id);
      toast.success(action === "approve" ? "Approved — asset re-allocated" : "Request rejected");
      refetch();
    } catch (err) {
      toast.error(err?.message || "Action failed");
    } finally {
      setActing(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Transfer & Return Requests"
        subtitle="Requested → Approved → Re-allocated, with history updated automatically."
        actions={<Button onClick={() => setShowNew(true)}><Plus size={15} /> New Request</Button>}
      />

      <div className="card mb-4 flex items-center gap-2.5 px-4 py-3">
        <select className="input w-44" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          {["PENDING", "APPROVED", "REJECTED"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <Spinner label="Loading requests…" />
        ) : (data?.items || []).length === 0 ? (
          <EmptyState icon={ArrowLeftRight} title="No requests" hint="Transfer and return requests appear here." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Type</th><th>Asset</th><th>Requested by</th><th>To</th>
                    <th>Status</th><th>Raised</th>{canApprove(user) && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((t) => (
                    <tr key={t.id}>
                      <td><Badge value={t.type} intent={t.type === "TRANSFER" ? "info" : "neutral"} /></td>
                      <td className="font-mono text-[12px]">{String(t.assetId).slice(0, 8)}…</td>
                      <td>{userName(t.requestedById)}</td>
                      <td className="font-medium" style={{ color: "var(--color-text-primary)" }}>
                        {t.toUserId ? userName(t.toUserId) : t.toDepartmentId ? `${departmentName(t.toDepartmentId)} (dept)` : "—"}
                      </td>
                      <td><Badge value={t.status} /></td>
                      <td>{dayjs(t.createdAt).format("DD MMM, HH:mm")}</td>
                      {canApprove(user) && (
                        <td className="text-right">
                          {t.status === "PENDING" && (
                            <div className="flex justify-end gap-1.5">
                              <Button variant="success" size="sm" disabled={acting === t.id} onClick={() => act(t.id, "approve")}>
                                <Check size={13} /> Approve
                              </Button>
                              <Button variant="secondary" size="sm" disabled={acting === t.id} onClick={() => act(t.id, "reject")}>
                                <X size={13} /> Reject
                              </Button>
                            </div>
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

      <NewRequestModal
        open={showNew}
        users={users}
        departments={departments}
        onClose={() => setShowNew(false)}
        onDone={() => { setShowNew(false); refetch(); }}
      />
    </div>
  );
}

function NewRequestModal({ open, users, departments, onClose, onDone }) {
  const [assets, setAssets] = useState([]);
  const [form, setForm] = useState({ assetId: "", type: "TRANSFER", targetType: "USER", targetId: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    if (!open) return;
    // allocated assets are the ones that can be transferred/returned
    listAssets({ status: "ALLOCATED", pageSize: 100 })
      .then((res) => setAssets(res.data?.items || []))
      .catch(() => {});
    setForm({ assetId: "", type: "TRANSFER", targetType: "USER", targetId: "", notes: "" });
  }, [open]);

  const submit = async () => {
    if (!form.assetId) { toast.error("Pick an asset"); return; }
    if (form.type === "TRANSFER" && !form.targetId) { toast.error("Pick a transfer target"); return; }
    setSaving(true);
    try {
      await createTransfer({
        assetId: form.assetId,
        type: form.type,
        toUserId: form.type === "TRANSFER" && form.targetType === "USER" ? form.targetId : null,
        toDepartmentId: form.type === "TRANSFER" && form.targetType === "DEPARTMENT" ? form.targetId : null,
        notes: form.notes || null,
      });
      toast.success("Request submitted for approval");
      onDone();
    } catch (err) {
      toast.error(err?.message || "Could not create request");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open} onClose={onClose} title="New Transfer / Return Request"
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} disabled={saving}>{saving ? "Submitting…" : "Submit Request"}</Button>
      </>}
    >
      <div className="space-y-3.5">
        <Field label="Request type">
          <select className="input" value={form.type} onChange={set("type")}>
            <option value="TRANSFER">Transfer to someone else</option>
            <option value="RETURN">Return to pool</option>
          </select>
        </Field>
        <Field label="Asset" required hint="Only ALLOCATED assets are listed">
          <select className="input" value={form.assetId} onChange={set("assetId")}>
            <option value="">Select asset…</option>
            {assets.map((a) => <option key={a.id} value={a.id}>{a.assetTag} — {a.name}</option>)}
          </select>
        </Field>
        {form.type === "TRANSFER" && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Transfer to">
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
        )}
        <Field label="Notes">
          <textarea className="input" placeholder="Context for the approver…" value={form.notes} onChange={set("notes")} />
        </Field>
      </div>
    </Modal>
  );
}
