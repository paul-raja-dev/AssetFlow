import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import { ArrowLeft, History, UserRound, Building2, Hammer } from "lucide-react";
import useAuth from "../hooks/useAuth";
import useApi from "../hooks/useApi";
import useLookups from "../hooks/useLookups";
import { getAsset, getAssetHistory, listMaintenance, updateAssetStatus } from "../api";
import { PageHeader, Button, Badge, Spinner, EmptyState, Field, Modal } from "../components/ui";
import { isManager } from "../utils/roles";

export default function AssetDetailPage() {
  const { assetId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { categoryName, departmentName } = useLookups();
  const [statusModal, setStatusModal] = useState(false);

  const { data: asset, loading, refetch } = useApi(() => getAsset(assetId), [assetId]);
  const { data: history } = useApi(() => getAssetHistory(assetId, { pageSize: 10 }), [assetId]);
  const { data: maint } = useApi(() => listMaintenance({ assetId, pageSize: 10 }), [assetId]);

  if (loading) return <Spinner label="Loading asset…" />;
  if (!asset) return <EmptyState title="Asset not found" />;

  const holder = asset.currentHolder;
  const rows = [
    ["Category", categoryName(asset.categoryId)],
    ["Department", departmentName(asset.departmentId)],
    ["Serial number", asset.serialNumber || "—"],
    ["Location", asset.location || "—"],
    ["Acquired", asset.purchaseDate ? dayjs(asset.purchaseDate).format("DD MMM YYYY") : "—"],
    ["Cost", asset.purchaseCost != null ? `₹ ${Number(asset.purchaseCost).toLocaleString()}` : "—"],
    ["Warranty until", asset.warrantyExpiry ? dayjs(asset.warrantyExpiry).format("DD MMM YYYY") : "—"],
    ["Registered", dayjs(asset.createdAt).format("DD MMM YYYY")],
  ];

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="mb-3 flex cursor-pointer items-center gap-1.5 text-[13px] font-medium"
        style={{ color: "var(--color-text-muted)" }}
      >
        <ArrowLeft size={14} /> Back to assets
      </button>

      <PageHeader
        title={
          <span className="flex items-center gap-3">
            {asset.name}
            <Badge value={asset.status} />
            <Badge value={asset.condition} />
          </span>
        }
        subtitle={<span className="font-mono">{asset.assetTag}</span>}
        actions={isManager(user) && (
          <Button variant="secondary" size="sm" onClick={() => setStatusModal(true)}>Change status</Button>
        )}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Details */}
        <section className="card p-5 lg:col-span-1">
          <h2 className="mb-3 text-[13.5px] font-semibold">Details</h2>
          <dl className="space-y-2.5">
            {rows.map(([k, v]) => (
              <div key={k} className="flex items-start justify-between gap-3 text-[13px]">
                <dt style={{ color: "var(--color-text-muted)" }}>{k}</dt>
                <dd className="text-right font-medium" style={{ color: "var(--color-text-primary)" }}>{v}</dd>
              </div>
            ))}
          </dl>

          {holder && (
            <div className="mt-4 flex items-center gap-2.5 rounded-lg px-3 py-2.5" style={{ background: "var(--color-info-bg)" }}>
              {holder.type === "USER" ? <UserRound size={15} style={{ color: "var(--color-info)" }} /> : <Building2 size={15} style={{ color: "var(--color-info)" }} />}
              <div className="text-[13px]">
                <span style={{ color: "var(--color-text-muted)" }}>Currently held by </span>
                <span className="font-semibold" style={{ color: "var(--color-info)" }}>{holder.name}</span>
              </div>
            </div>
          )}

          {asset.notes && (
            <p className="mt-4 rounded-lg px-3 py-2.5 text-[13px]" style={{ background: "var(--color-surface-hover)", color: "var(--color-text-secondary)" }}>
              {asset.notes}
            </p>
          )}
        </section>

        {/* Histories */}
        <div className="space-y-4 lg:col-span-2">
          <section className="card overflow-hidden">
            <header className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid var(--color-border)" }}>
              <History size={15} style={{ color: "var(--color-text-muted)" }} />
              <h2 className="text-[13.5px] font-semibold">Allocation History</h2>
            </header>
            {(history?.items || []).length === 0 ? (
              <EmptyState title="Never allocated" hint="Allocations of this asset will appear here." />
            ) : (
              <table className="table-base">
                <thead><tr><th>Status</th><th>Allocated</th><th>Expected return</th><th>Returned</th><th>Notes</th></tr></thead>
                <tbody>
                  {history.items.map((h) => (
                    <tr key={h.id}>
                      <td><Badge value={h.isOverdue ? "OVERDUE" : h.status} /></td>
                      <td>{dayjs(h.createdAt).format("DD MMM YYYY")}</td>
                      <td>{h.expectedReturnDate ? dayjs(h.expectedReturnDate).format("DD MMM YYYY") : "—"}</td>
                      <td>{h.actualReturnDate ? dayjs(h.actualReturnDate).format("DD MMM YYYY") : "—"}</td>
                      <td className="max-w-56 truncate">{h.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="card overflow-hidden">
            <header className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid var(--color-border)" }}>
              <Hammer size={15} style={{ color: "var(--color-text-muted)" }} />
              <h2 className="text-[13.5px] font-semibold">Maintenance History</h2>
            </header>
            {(maint?.items || []).length === 0 ? (
              <EmptyState title="No maintenance yet" hint="Requests raised for this asset show up here." />
            ) : (
              <table className="table-base">
                <thead><tr><th>Status</th><th>Priority</th><th>Issue</th><th>Raised</th><th>Resolved</th></tr></thead>
                <tbody>
                  {maint.items.map((m) => (
                    <tr key={m.id}>
                      <td><Badge value={m.status} /></td>
                      <td><Badge value={m.priority} intent={m.priority === "CRITICAL" || m.priority === "HIGH" ? "danger" : m.priority === "MEDIUM" ? "warning" : "neutral"} /></td>
                      <td className="max-w-64 truncate">{m.description}</td>
                      <td>{dayjs(m.createdAt).format("DD MMM YYYY")}</td>
                      <td>{m.resolutionDate ? dayjs(m.resolutionDate).format("DD MMM YYYY") : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      </div>

      <StatusModal
        open={statusModal}
        current={asset.status}
        onClose={() => setStatusModal(false)}
        assetId={assetId}
        onChanged={() => { setStatusModal(false); refetch(); }}
      />
    </div>
  );
}

function StatusModal({ open, onClose, current, assetId, onChanged }) {
  const OPTIONS = ["AVAILABLE", "RESERVED", "RETIRED", "LOST", "DISPOSED"];
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!status) return;
    setSaving(true);
    try {
      await updateAssetStatus(assetId, status);
      toast.success("Status updated");
      onChanged();
    } catch (err) {
      toast.error(err?.message || "Could not update status");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open} onClose={onClose} title="Change asset status"
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} disabled={saving || !status}>{saving ? "Saving…" : "Update status"}</Button>
      </>}
    >
      <p className="mb-3 text-[13px]" style={{ color: "var(--color-text-muted)" }}>
        Current status: <Badge value={current} />. Allocation, maintenance and audit flows update statuses
        automatically — use this only for manual lifecycle changes.
      </p>
      <Field label="New status">
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Select status…</option>
          {OPTIONS.filter((s) => s !== current).map((s) => <option key={s} value={s}>{s.replaceAll("_", " ")}</option>)}
        </select>
      </Field>
    </Modal>
  );
}
