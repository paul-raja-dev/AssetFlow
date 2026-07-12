import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Building2, Tags, Users, Plus, Pencil } from "lucide-react";
import useApi from "../hooks/useApi";
import useAuth from "../hooks/useAuth";
import {
  listDepartments, createDepartment, updateDepartment,
  listCategories, createCategory, updateCategory,
  listUsers, updateUser,
} from "../api";
import { PageHeader, Button, Field, Modal, Badge, Spinner, EmptyState, Pager } from "../components/ui";
import { ROLE_LABELS } from "../utils/roles";
import clsx from "clsx";

const TABS = [
  { id: "departments", label: "Departments", icon: Building2 },
  { id: "categories", label: "Asset Categories", icon: Tags },
  { id: "employees", label: "Employee Directory", icon: Users },
];

export default function OrganizationPage() {
  const [tab, setTab] = useState("departments");

  return (
    <div>
      <PageHeader title="Organization Setup" subtitle="Master data everything else depends on — Admin only." />

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-xl p-1" style={{ background: "var(--color-surface-hover)", width: "fit-content" }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={clsx("btn btn-sm", tab === id ? "" : "btn-ghost")}
            style={tab === id ? { background: "var(--color-surface)", boxShadow: "var(--shadow-card)", color: "var(--color-text-primary)" } : {}}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {tab === "departments" && <DepartmentsTab />}
      {tab === "categories" && <CategoriesTab />}
      {tab === "employees" && <EmployeesTab />}
    </div>
  );
}

/* ── Tab A: Departments ── */
function DepartmentsTab() {
  const { data, loading, refetch } = useApi(listDepartments);
  const { data: usersData } = useApi(() => listUsers({ pageSize: 100 }));
  const [editing, setEditing] = useState(null); // null | {} (new) | dept
  const depts = data || [];
  const users = usersData?.items || [];
  const headName = (id) => {
    const u = users.find((x) => x.id === id);
    return u ? `${u.firstName} ${u.lastName}` : "—";
  };

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--color-border)" }}>
        <h2 className="text-[13.5px] font-semibold">Departments</h2>
        <Button size="sm" onClick={() => setEditing({})}><Plus size={14} /> New Department</Button>
      </div>
      {loading ? <Spinner /> : depts.length === 0 ? (
        <EmptyState icon={Building2} title="No departments" hint="Create the first department to structure your organization." />
      ) : (
        <table className="table-base">
          <thead><tr><th>Name</th><th>Head</th><th>Parent</th><th>Description</th><th></th></tr></thead>
          <tbody>
            {depts.map((d) => (
              <tr key={d.id}>
                <td className="font-medium" style={{ color: "var(--color-text-primary)" }}>{d.name}</td>
                <td>{headName(d.headId)}</td>
                <td>{depts.find((p) => p.id === d.parentDepartmentId)?.name || "—"}</td>
                <td className="max-w-56 truncate">{d.description || "—"}</td>
                <td className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(d)}><Pencil size={13} /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <DepartmentModal dept={editing} depts={depts} users={users} onClose={() => setEditing(null)} onDone={() => { setEditing(null); refetch(); }} />
    </div>
  );
}

function DepartmentModal({ dept, depts, users, onClose, onDone }) {
  const isNew = dept && !dept.id;
  const [form, setForm] = useState({ name: "", description: "", parentDepartmentId: "", headId: "" });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    if (dept) setForm({
      name: dept.name || "", description: dept.description || "",
      parentDepartmentId: dept.parentDepartmentId || "", headId: dept.headId || "",
    });
  }, [dept]);

  // Only Admin / AM / Department Head roles can head a department (backend rule)
  const eligibleHeads = users.filter((u) => ["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD"].includes(u.role));

  const submit = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        parentDepartmentId: form.parentDepartmentId || null,
        headId: form.headId || null,
      };
      if (isNew) await createDepartment(payload);
      else await updateDepartment(dept.id, payload);
      toast.success(isNew ? "Department created" : "Department updated");
      onDone();
    } catch (err) {
      toast.error(err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={!!dept} onClose={onClose} title={isNew ? "New Department" : `Edit ${dept?.name}`}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
      </>}
    >
      <div className="space-y-3.5">
        <Field label="Name" required>
          <input className="input" placeholder="e.g. Engineering" value={form.name} onChange={set("name")} autoFocus />
        </Field>
        <Field label="Department head" hint="Must be an Admin, Asset Manager or Department Head">
          <select className="input" value={form.headId} onChange={set("headId")}>
            <option value="">No head assigned</option>
            {eligibleHeads.map((u) => <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({ROLE_LABELS[u.role]})</option>)}
          </select>
        </Field>
        <Field label="Parent department">
          <select className="input" value={form.parentDepartmentId} onChange={set("parentDepartmentId")}>
            <option value="">None (top level)</option>
            {depts.filter((d) => d.id !== dept?.id).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </Field>
        <Field label="Description">
          <textarea className="input" value={form.description} onChange={set("description")} />
        </Field>
      </div>
    </Modal>
  );
}

/* ── Tab B: Asset Categories ── */
function CategoriesTab() {
  const { data, loading, refetch } = useApi(listCategories);
  const [editing, setEditing] = useState(null);
  const cats = data || [];

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--color-border)" }}>
        <h2 className="text-[13.5px] font-semibold">Asset Categories</h2>
        <Button size="sm" onClick={() => setEditing({})}><Plus size={14} /> New Category</Button>
      </div>
      {loading ? <Spinner /> : cats.length === 0 ? (
        <EmptyState icon={Tags} title="No categories" hint="e.g. Electronics, Furniture, Vehicles…" />
      ) : (
        <table className="table-base">
          <thead><tr><th>Name</th><th>Description</th><th></th></tr></thead>
          <tbody>
            {cats.map((c) => (
              <tr key={c.id}>
                <td className="font-medium" style={{ color: "var(--color-text-primary)" }}>{c.name}</td>
                <td className="max-w-72 truncate">{c.description || "—"}</td>
                <td className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(c)}><Pencil size={13} /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <CategoryModal cat={editing} onClose={() => setEditing(null)} onDone={() => { setEditing(null); refetch(); }} />
    </div>
  );
}

function CategoryModal({ cat, onClose, onDone }) {
  const isNew = cat && !cat.id;
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (cat) setForm({ name: cat.name || "", description: cat.description || "" });
  }, [cat]);

  const submit = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const payload = { name: form.name.trim(), description: form.description.trim() || null };
      if (isNew) await createCategory(payload);
      else await updateCategory(cat.id, payload);
      toast.success(isNew ? "Category created" : "Category updated");
      onDone();
    } catch (err) {
      toast.error(err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={!!cat} onClose={onClose} title={isNew ? "New Category" : `Edit ${cat?.name}`}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
      </>}
    >
      <div className="space-y-3.5">
        <Field label="Name" required>
          <input className="input" placeholder="e.g. Electronics" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} autoFocus />
        </Field>
        <Field label="Description">
          <textarea className="input" placeholder="What belongs in this category?" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        </Field>
      </div>
    </Modal>
  );
}

/* ── Tab C: Employee Directory (the ONLY place roles are assigned — PS) ── */
function EmployeesTab() {
  const { user: me } = useAuth();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const query = useMemo(() => ({ search: debounced || undefined, page, pageSize: 12 }), [debounced, page]);
  const { data, loading, refetch } = useApi(() => listUsers(query), [query]);
  const { data: deptsData } = useApi(listDepartments);
  const depts = deptsData || [];

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3" style={{ borderBottom: "1px solid var(--color-border)" }}>
        <h2 className="text-[13.5px] font-semibold">Employee Directory</h2>
        <input className="input h-8 w-64 text-[13px]" placeholder="Search employees…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>
      {loading ? <Spinner /> : (data?.items || []).length === 0 ? (
        <EmptyState icon={Users} title="No employees found" />
      ) : (
        <>
          <table className="table-base">
            <thead><tr><th>Name</th><th>Email</th><th>Department</th><th>Role</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {data.items.map((u) => (
                <tr key={u.id}>
                  <td className="font-medium" style={{ color: "var(--color-text-primary)" }}>{u.firstName} {u.lastName}{u.id === me?.id && <span className="ml-1.5 text-[11px]" style={{ color: "var(--color-text-muted)" }}>(you)</span>}</td>
                  <td>{u.email}</td>
                  <td>{depts.find((d) => d.id === u.departmentId)?.name || "—"}</td>
                  <td><Badge value={u.role} /></td>
                  <td><Badge value={u.status} intent={u.status === "ACTIVE" ? "success" : "neutral"} /></td>
                  <td className="text-right">
                    {u.role !== "ADMIN" && (
                      <Button variant="ghost" size="sm" onClick={() => setEditing(u)}><Pencil size={13} /> Manage</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pager page={data.page} totalPages={data.totalPages} onPage={setPage} />
        </>
      )}

      <PromoteModal user={editing} depts={depts} onClose={() => setEditing(null)} onDone={() => { setEditing(null); refetch(); }} />
    </div>
  );
}

function PromoteModal({ user, depts, onClose, onDone }) {
  const [form, setForm] = useState({ role: "", status: "", departmentId: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) setForm({ role: user.role, status: user.status, departmentId: user.departmentId || "" });
  }, [user]);

  const submit = async () => {
    setSaving(true);
    try {
      await updateUser(user.id, {
        role: form.role,
        status: form.status,
        departmentId: form.departmentId || null,
      });
      toast.success("Employee updated");
      onDone();
    } catch (err) {
      toast.error(err?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={!!user} onClose={onClose} title={`Manage ${user?.firstName} ${user?.lastName}`}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
      </>}
    >
      <div className="space-y-3.5">
        <Field label="Role" hint="This directory is the only place roles are assigned">
          <select className="input" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
            {["EMPLOYEE", "DEPARTMENT_HEAD", "ASSET_MANAGER"].map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
        </Field>
        <Field label="Department">
          <select className="input" value={form.departmentId} onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))}>
            <option value="">No department</option>
            {depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </Field>
        <Field label="Status" hint="Inactive users cannot sign in">
          <select className="input" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </Field>
      </div>
    </Modal>
  );
}
