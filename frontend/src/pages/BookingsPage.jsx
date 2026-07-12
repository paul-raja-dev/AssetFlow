import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import { Calendar, Plus, Ban } from "lucide-react";
import useAuth from "../hooks/useAuth";
import useApi from "../hooks/useApi";
import { listBookings, createBooking, cancelBooking, listAssets } from "../api";
import { PageHeader, Button, Field, Modal, Badge, Spinner, EmptyState, Pager } from "../components/ui";
import { isManager } from "../utils/roles";

export default function BookingsPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [assets, setAssets] = useState([]);
  const [assetId, setAssetId] = useState("");
  const [mineOnly, setMineOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [showNew, setShowNew] = useState(params.get("new") === "1");
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    listAssets({ pageSize: 100 }).then((res) => setAssets(res.data?.items || [])).catch(() => {});
  }, []);

  const query = useMemo(
    () => ({ assetId: assetId || undefined, bookedById: mineOnly ? user?.id : undefined, page, pageSize: 12 }),
    [assetId, mineOnly, page, user]
  );
  const { data, loading, refetch } = useApi(() => listBookings(query), [query]);

  const assetName = (id) => {
    const a = assets.find((x) => x.id === id);
    return a ? `${a.assetTag} — ${a.name}` : `${String(id).slice(0, 8)}…`;
  };

  const doCancel = async (b) => {
    setCancelling(b.id);
    try {
      await cancelBooking(b.id);
      toast.success("Booking cancelled");
      refetch();
    } catch (err) {
      toast.error(err?.message || "Could not cancel booking");
    } finally {
      setCancelling(null);
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
        title="Resource Bookings"
        subtitle="Time-slot booking of shared resources — overlaps are rejected automatically."
        actions={<Button onClick={() => setShowNew(true)}><Plus size={15} /> Book Resource</Button>}
      />

      <div className="card mb-4 flex flex-wrap items-center gap-2.5 px-4 py-3">
        <select className="input w-72" value={assetId} onChange={(e) => { setAssetId(e.target.value); setPage(1); }}>
          <option value="">All resources</option>
          {assets.map((a) => <option key={a.id} value={a.id}>{a.assetTag} — {a.name}</option>)}
        </select>
        <label className="flex cursor-pointer items-center gap-2 text-[13px] font-medium" style={{ color: "var(--color-text-secondary)" }}>
          <input type="checkbox" checked={mineOnly} onChange={(e) => { setMineOnly(e.target.checked); setPage(1); }} />
          My bookings only
        </label>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <Spinner label="Loading bookings…" />
        ) : (data?.items || []).length === 0 ? (
          <EmptyState icon={Calendar} title="No bookings" hint="Book a room, vehicle or shared equipment by time slot." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr><th>Resource</th><th>Slot</th><th>Status</th><th>Purpose</th><th></th></tr>
                </thead>
                <tbody>
                  {data.items.map((b) => {
                    const canCancel = (b.status === "UPCOMING" || b.status === "ONGOING") &&
                      (b.bookedById === user?.id || isManager(user));
                    return (
                      <tr key={b.id}>
                        <td className="font-medium" style={{ color: "var(--color-text-primary)" }}>{assetName(b.assetId)}</td>
                        <td className="whitespace-nowrap">
                          {dayjs(b.startTime).format("DD MMM, HH:mm")} → {dayjs(b.endTime).format("HH:mm")}
                          <span className="ml-1.5 text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                            ({dayjs(b.endTime).diff(dayjs(b.startTime), "minute")} min)
                          </span>
                        </td>
                        <td><Badge value={b.status} /></td>
                        <td className="max-w-56 truncate">{b.purpose || "—"}</td>
                        <td className="text-right">
                          {canCancel && (
                            <Button variant="secondary" size="sm" disabled={cancelling === b.id} onClick={() => doCancel(b)}>
                              <Ban size={13} /> Cancel
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pager page={data.page} totalPages={data.totalPages} onPage={setPage} />
          </>
        )}
      </div>

      <NewBookingModal open={showNew} assets={assets} onClose={clearNew} onDone={() => { clearNew(); refetch(); }} />
    </div>
  );
}

function NewBookingModal({ open, assets, onClose, onDone }) {
  const [form, setForm] = useState({ assetId: "", date: "", start: "", end: "", purpose: "" });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    if (open) setForm({ assetId: "", date: dayjs().format("YYYY-MM-DD"), start: "", end: "", purpose: "" });
  }, [open]);

  const submit = async () => {
    if (!form.assetId || !form.date || !form.start || !form.end) {
      toast.error("Resource, date and time slot are required");
      return;
    }
    const startTime = dayjs(`${form.date}T${form.start}`);
    const endTime = dayjs(`${form.date}T${form.end}`);
    if (!endTime.isAfter(startTime)) {
      toast.error("End time must be after start time");
      return;
    }
    setSaving(true);
    try {
      await createBooking({
        assetId: form.assetId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        purpose: form.purpose || null,
      });
      toast.success("Booking confirmed");
      onDone();
    } catch (err) {
      if (err?.code === "BOOKING_OVERLAP") {
        toast.error("That slot overlaps an existing booking — pick another time");
      } else {
        toast.error(err?.message || "Could not create booking");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open} onClose={onClose} title="Book a Resource"
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} disabled={saving}>{saving ? "Booking…" : "Confirm Booking"}</Button>
      </>}
    >
      <div className="space-y-3.5">
        <Field label="Resource" required>
          <select className="input" value={form.assetId} onChange={set("assetId")}>
            <option value="">Select resource…</option>
            {assets.map((a) => <option key={a.id} value={a.id}>{a.assetTag} — {a.name}</option>)}
          </select>
        </Field>
        <Field label="Date" required>
          <input type="date" className="input" value={form.date} onChange={set("date")} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="From" required>
            <input type="time" className="input" value={form.start} onChange={set("start")} />
          </Field>
          <Field label="To" required>
            <input type="time" className="input" value={form.end} onChange={set("end")} />
          </Field>
        </div>
        <Field label="Purpose">
          <input className="input" placeholder="e.g. Sprint planning" value={form.purpose} onChange={set("purpose")} />
        </Field>
        <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
          Back-to-back bookings are fine — a slot ending at 10:00 doesn't clash with one starting at 10:00.
        </p>
      </div>
    </Modal>
  );
}
