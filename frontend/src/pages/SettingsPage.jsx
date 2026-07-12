import { useState } from "react";
import toast from "react-hot-toast";
import { UserRound, Palette, Info, Sun, Moon, Monitor } from "lucide-react";
import useAuth from "../hooks/useAuth";
import { updateUser } from "../api";
import { PageHeader, Button, Field, Badge } from "../components/ui";
import { ROLE_LABELS } from "../utils/roles";

export default function SettingsPage() {
  const { user, validateSession } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

  const saveProfile = async () => {
    if (!firstName.trim()) { toast.error("First name is required"); return; }
    setSaving(true);
    try {
      await updateUser(user.id, { firstName: firstName.trim(), lastName: lastName.trim() });
      await validateSession();
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err?.message || "Could not update profile");
    } finally {
      setSaving(false);
    }
  };

  const applyTheme = (t) => {
    setTheme(t);
    const dark = t === "dark" || (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", t);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Settings" subtitle="Your profile and workspace preferences." />

      {/* Profile */}
      <section className="card mb-4 p-5">
        <h2 className="mb-1 flex items-center gap-2 text-[13.5px] font-semibold">
          <UserRound size={15} /> Profile
        </h2>
        <p className="mb-4 text-[12.5px]" style={{ color: "var(--color-text-muted)" }}>
          Role and department are managed by your Admin from the Employee Directory.
        </p>
        <div className="mb-4 flex items-center gap-3 rounded-lg px-3.5 py-3" style={{ background: "var(--color-surface-hover)" }}>
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full text-[13px] font-bold"
            style={{ background: "var(--color-accent)", color: "var(--color-primary)" }}
          >
            {`${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="text-[13.5px] font-semibold">{user?.email}</div>
            <div className="mt-0.5 flex items-center gap-2">
              <Badge value={user?.role}>{ROLE_LABELS[user?.role]}</Badge>
              <Badge value={user?.status} intent={user?.status === "ACTIVE" ? "success" : "neutral"} />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" required>
            <input className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </Field>
          <Field label="Last name">
            <input className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </Field>
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={saveProfile} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
        </div>
      </section>

      {/* Appearance */}
      <section className="card mb-4 p-5">
        <h2 className="mb-4 flex items-center gap-2 text-[13.5px] font-semibold">
          <Palette size={15} /> Appearance
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: "light", label: "Light", icon: Sun },
            { id: "dark", label: "Dark", icon: Moon },
            { id: "system", label: "System", icon: Monitor },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => applyTheme(id)}
              className="flex cursor-pointer flex-col items-center gap-2 rounded-xl px-3 py-4 text-[13px] font-medium transition-all"
              style={{
                border: `2px solid ${theme === id ? "var(--color-primary)" : "var(--color-border)"}`,
                color: theme === id ? "var(--color-primary)" : "var(--color-text-secondary)",
                background: theme === id ? "color-mix(in srgb, var(--color-primary) 6%, transparent)" : "transparent",
              }}
            >
              <Icon size={18} /> {label}
            </button>
          ))}
        </div>
      </section>

      {/* About */}
      <section className="card p-5">
        <h2 className="mb-3 flex items-center gap-2 text-[13.5px] font-semibold">
          <Info size={15} /> About
        </h2>
        <dl className="space-y-2 text-[13px]">
          <div className="flex justify-between">
            <dt style={{ color: "var(--color-text-muted)" }}>Product</dt>
            <dd className="font-medium">AssetFlow — Enterprise Asset & Resource Management</dd>
          </div>
          <div className="flex justify-between">
            <dt style={{ color: "var(--color-text-muted)" }}>Version</dt>
            <dd className="font-mono text-[12px]">1.0.0</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
