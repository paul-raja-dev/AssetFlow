import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Package, Plus, Search } from "lucide-react";
import useAuth from "../hooks/useAuth";
import useApi from "../hooks/useApi";
import useLookups from "../hooks/useLookups";
import { listAssets, createAsset } from "../api";
import { PageHeader, Button, Field, Modal, Badge, Spinner, EmptyState, Pager } from "../components/ui";
import { isManager } from "../utils/roles";

const STATUSES = ["AVAILABLE", "ALLOCATED", "UNDER_MAINTENANCE", "LOST", "DISPOSED"];
const CONDITIONS = ["GOOD", "FAIR", "POOR", "DAMAGED"];

export default function AssetsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { categories, departments, categoryName, departmentName } = useLookups();

  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [status, setStatus] = useState(params.get("status") || "");
  const [categoryId, setCategoryId] = useState("");
  const [page, setPage] = useState(1);
  const [showNew, setShowNew] = useState(params.get("new") === "1");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const query = useMemo(
    () => ({ search: debounced || undefined, status: status || undefined, categoryId: categoryId || undefined, page, pageSize: 12 }),
    [debounced, status, categoryId, page]
  );
  const { data, loading, refetch } = useApi(() => listAssets(query), [query]);

  const clearNewParam = () => {
    setShowNew(false);
    params.delete("new");
    setParams(params, { replace: true });
  };

  return (
    <div>
      <PageHeader
        title="Asset Directory"
        subtitle="Search, register and track every asset in the organization."
        actions={
          isManager(user) && (
            <Button onClick={() => setShowNew(true)}>
              <Plus size={15} /> Register Asset
            </Button>
          )
        }
      />

      {/* Filters */}
      <div className="card mb-4 flex flex-wrap items-center gap-2.5 px-4 py-3">
        <div className="relative min-w-56 flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }} />
          <input
            className="input pl-9"
            placeholder="Search by name, tag or serial number…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select className="input w-44" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replaceAll("_", " ")}</option>)}
        </select>
        <select className="input w-44" value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <Spinner label="Loading assets…" />
        ) : (data?.items || []).length === 0 ? (
          <EmptyState
            icon={Package}
            title="No assets found"
            hint={isManager(user) ? "Register your first asset to get started." : "Try adjusting your search or filters."}
            action={isManager(user) && <Button size="sm" onClick={() => setShowNew(true)}><Plus size={14} /> Register Asset</Button>}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Tag</th><th>Name</th><th>Category</th><th>Department</th>
                    <th>Status</th><th>Condition</th><th>Location</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((a) => (
                    <tr key={a.id} className="cursor-pointer" onClick={() => navigate(`/assets/${a.id}`)}>
                      <td className="font-mono text-[12.5px] font-medium" style={{ color: "var(--color-primary)" }}>{a.assetTag}</td>
                      <td className="font-medium" style={{ color: "var(--color-text-primary)" }}>{a.name}</td>
                      <td>{categoryName(a.categoryId)}</td>
                      <td>{departmentName(a.departmentId)}</td>
                      <td><Badge value={a.status} /></td>
                      <td><Badge value={a.condition} /></td>
                      <td className="max-w-40 truncate">{a.location || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager page={data.page} totalPages={data.totalPages} onPage={setPage} />
          </>
        )}
      </div>

      <RegisterAssetModal
        open={showNew}
        onClose={clearNewParam}
        categories={categories}
        departments={departments}
        onCreated={() => { clearNewParam(); refetch(); }}
      />
    </div>
  );
}

function RegisterAssetModal({ open, onClose, categories, departments, onCreated }) {
  const empty = {
    name: "", categoryId: "", serialNumber: "", departmentId: "",
    condition: "GOOD", purchaseDate: "", purchaseCost: "", warrantyExpiry: "", location: "", notes: "",
  };
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => { if (open) setForm(empty); /* eslint-disable-line */ }, [open]);

  const submit = async () => {
    if (!form.name.trim() || !form.categoryId) {
      toast.error("Name and category are required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        categoryId: form.categoryId,
        serialNumber: form.serialNumber.trim() || null,
        departmentId: form.departmentId || null,
        condition: form.condition,
        purchaseDate: form.purchaseDate || null,
        purchaseCost: form.purchaseCost ? Number(form.purchaseCost) : null,
        warrantyExpiry: form.warrantyExpiry || null,
        location: form.location.trim() || null,
        notes: form.notes.trim() || null,
      };
      const res = await createAsset(payload);
      toast.success(`Asset registered — ${res.data?.assetTag || "tag assigned"}`);
      onCreated();
    } catch (err) {
      toast.error(err?.message || "Could not register asset");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Register Asset"
      wide
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Registering…" : "Register Asset"}</Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3.5">
        <Field label="Asset name" required>
          <input className="input" placeholder='e.g. MacBook Pro 14"' value={form.name} onChange={set("name")} autoFocus />
        </Field>
        <Field label="Category" required>
          <select className="input" value={form.categoryId} onChange={set("categoryId")}>
            <option value="">Select category…</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Serial number" hint="Must be unique if provided">
          <input className="input" placeholder="SN-…" value={form.serialNumber} onChange={set("serialNumber")} />
        </Field>
        <Field label="Department">
          <select className="input" value={form.departmentId} onChange={set("departmentId")}>
            <option value="">Unassigned</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </Field>
        <Field label="Condition">
          <select className="input" value={form.condition} onChange={set("condition")}>
            {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Location">
          <input className="input" placeholder="e.g. HQ · Floor 3" value={form.location} onChange={set("location")} />
        </Field>
        <Field label="Acquisition date">
          <input type="date" className="input" value={form.purchaseDate} onChange={set("purchaseDate")} />
        </Field>
        <Field label="Acquisition cost" hint="For reports only — not linked to accounting">
          <input type="number" min="0" className="input" placeholder="0.00" value={form.purchaseCost} onChange={set("purchaseCost")} />
        </Field>
        <Field label="Warranty expiry">
          <input type="date" className="input" value={form.warrantyExpiry} onChange={set("warrantyExpiry")} />
        </Field>
        <div className="col-span-2">
          <Field label="Notes">
            <textarea className="input" placeholder="Anything worth remembering about this asset…" value={form.notes} onChange={set("notes")} />
          </Field>
        </div>
      </div>
    </Modal>
  );
}
