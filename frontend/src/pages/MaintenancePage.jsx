import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import { Wrench, Plus, Check, X, Play, Flag } from "lucide-react";
import useAuth from "../hooks/useAuth";
import useApi from "../hooks/useApi";
import useLookups from "../hooks/useLookups";
import { listMaintenance, createMaintenance, updateMaintenanceStatus, listAssets } from "../api";
import { PageHeader, Button, Field, Modal, Badge, Spinner, EmptyState, Pager } from "../components/ui";
import { isManager } from "../utils/roles";

const PRIORITY_INTENT = { LOW: "neutral", MEDIUM: "warning", HIGH: "danger", CRITICAL: "danger" };

export default function MaintenancePage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const { userName } = useLookups();
  const [assets, setAssets] = useState([]);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [showNew, setShowNew] = useState(params.get("new") === "1");
  const [resolving, setResolving] = useState(null);
  const [acting, setActing] = useState(null);

  useEffect(() => {
    listAssets({ pageSize: 100 }).then((res) => setAssets(res.data?.items || [])).catch(() => {});
  }, []);

  const query = useMemo(() => ({ status: status || undefined, page, pageSize: 12 }), [status, page]);
  const { data, loading, refetch } = useApi(() => listMaintenance(query), [query]);

  const assetName = (id) => {
    const a = assets.find((x) => x.id === id);
    return a ? `${a.assetTag} — ${a.name}` : `${String(id).slice(0, 8)}…`;
  };

  const transition = async (req, newStatus, extra = {}) => {
    setActing(req.id);
    try {
      await updateMaintenanceStatus(req.id, { status: newStatus, ...extra });
      const msg = {
        APPROVED: "Approved — asset moved to UNDER MAINTENANCE",
        REJECTED: "Request rejected",
        IN_PROGRESS: "Marked in progress",
        RESOLVED: "Resolved — asset status restored",
      }[newStatus];
      toast.success(msg || "Updated");
      refetch();
    } catch (err) {
      toast.error(err?.message || "Could not update");
    } finally {
      setActing(null);
    }
  };

  const clearNew = () => {
    setShowNew(false);
    params.delete("new");
    setParams(params, { replace: true });
  };

  return (
    <div>
      <PageHeader
        title="Maintenance"
        subtitle="Pending → Approved → In Progress → Resolved. Approval flips the asset to Under Maintenance."
        actions={<Button onClick={() => setShowNew(true)}><Plus size={15} /> Raise Request</Button>}
      />

      <div className="card mb-4 flex items-center gap-2.5 px-4 py-3">
        <select className="input w-44" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          {["PENDING", "APPROVED", "IN_PROGRESS", "RESOLVED", "REJECTED"].map((s) => (
            <option key={s} value={s}>{s.replaceAll("_", " ")}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <Spinner label="Loading requests…" />
        ) : (data?.items || []).length === 0 ? (
          <EmptyState icon={Wrench} title="No maintenance requests" hint="Anyone can raise a request; asset managers approve before repair starts." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Asset</th><th>Issue</th><th>Priority</th><th>Status</th>
                    <th>Raised by</th><th>Raised</th>{isManager(user) && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((m) => (
                    <tr key={m.id}>
                      <td className="font-medium" style={{ color: "var(--color-text-primary)" }}>{assetName(m.assetId)}</td>
                      <td className="max-w-52 truncate" title={m.description}>{m.description}</td>
                      <td><Badge value={m.priority} intent={PRIORITY_INTENT[m.priority]} /></td>
                      <td><Badge value={m.status} /></td>
                      <td>{userName(m.requestedById)}</td>
                      <td>{dayjs(m.createdAt).format("DD MMM")}</td>
                      {isManager(user) && (
                        <td className="text-right">
                          <div className="flex justify-end gap-1.5">
                            {m.status === "PENDING" && (
                              <>
                                <Button variant="success" size="sm" disabled={acting === m.id} onClick={() => transition(m, "APPROVED")}>
                                  <Check size={13} /> Approve
                                </Button>
                                <Button variant="secondary" size="sm" disabled={acting === m.id} onClick={() => transition(m, "REJECTED")}>
                                  <X size={13} /> Reject
                                </Button>
                              </>
                            )}
                            {m.status === "APPROVED" && (
                              <Button variant="secondary" size="sm" disabled={acting === m.id} onClick={() => transition(m, "IN_PROGRESS")}>
                                <Play size={13} /> Start work
                              </Button>
                            )}
                            {(m.status === "APPROVED" || m.status === "IN_PROGRESS") && (
                              <Button variant="primary" size="sm" disabled={acting === m.id} onClick={() => setResolving(m)}>
                                <Flag size={13} /> Resolve
                              </Button>
                            )}
                          </div>
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

      <RaiseModal open={showNew} assets={assets} onClose={clearNew} onDone={() => { clearNew(); refetch(); }} />
      <ResolveModal req={resolving} onClose={() => setResolving(null)} onDone={(req, notes) => { setResolving(null); transition(req, "RESOLVED", { technicianNotes: notes || undefined }); }} />
    </div>
  );
}

function RaiseModal({ open, assets, onClose, onDone }) {
  const [form, setForm] = useState({ assetId: "", description: "", priority: "MEDIUM" });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => { if (open) setForm({ assetId: "", description: "", priority: "MEDIUM" }); }, [open]);

  const submit = async () => {
    if (!form.assetId || !form.description.trim()) {
      toast.error("Asset and issue description are required");
      return;
    }
    setSaving(true);
    try {
      await createMaintenance({ assetId: form.assetId, description: form.description.trim(), priority: form.priority });
      toast.success("Request submitted for approval");
      onDone();
    } catch (err) {
      toast.error(err?.message || "Could not raise request");
    } finally {
      setSaving(false);
    }
  };

  const usable = assets.filter((a) => !["DISPOSED", "LOST"].includes(a.status));

  return (
    <Modal
      open={open} onClose={onClose} title="Raise Maintenance Request"
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} disabled={saving}>{saving ? "Submitting…" : "Submit Request"}</Button>
      </>}
    >
      <div className="space-y-3.5">
        <Field label="Asset" required>
          <select className="input" value={form.assetId} onChange={set("assetId")}>
            <option value="">Select asset…</option>
            {usable.map((a) => <option key={a.id} value={a.id}>{a.assetTag} — {a.name}</option>)}
          </select>
        </Field>
        <Field label="What's wrong?" required>
          <textarea className="input" placeholder="Describe the issue…" value={form.description} onChange={set("description")} />
        </Field>
        <Field label="Priority">
          <select className="input" value={form.priority} onChange={set("priority")}>
            {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
      </div>
    </Modal>
  );
}

function ResolveModal({ req, onClose, onDone }) {
  const [notes, setNotes] = useState("");
  useEffect(() => { if (req) setNotes(""); }, [req]);

  return (
    <Modal
      open={!!req} onClose={onClose} title="Resolve Maintenance Request"
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={() => onDone(req, notes)}>Mark Resolved</Button>
      </>}
    >
      <Field label="Technician notes" hint="What was done to fix it?">
        <textarea className="input" placeholder="Replaced battery, cleaned fans…" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
    </Modal>
  );
}
