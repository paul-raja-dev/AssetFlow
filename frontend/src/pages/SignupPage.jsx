import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import AuthShell from "../components/layout/AuthShell";
import { Button, Field } from "../components/ui";
import useAuth from "../hooks/useAuth";

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup, login } = useAuth();

  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const pwChecks = [
    { ok: form.password.length >= 6, label: "At least 6 characters" },
    { ok: form.password && form.password === form.confirm, label: "Passwords match" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.firstName.trim() || !form.email.trim() || !form.password) {
      setError("Please fill in all required fields.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await signup(`${form.firstName.trim()} ${form.lastName.trim()}`.trim(), form.email.trim(), form.password);
      // auto-login for a smooth first-run experience
      await login(form.email.trim(), form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err?.message || "Could not create your account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join your organization's workspace as an employee."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold" style={{ color: "var(--color-primary)" }}>
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && (
          <div
            className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-[13px] font-medium"
            style={{ background: "var(--color-danger-bg)", color: "var(--color-danger)" }}
            role="alert"
          >
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" required>
            <input className="input" placeholder="Priya" value={form.firstName} autoFocus onChange={set("firstName")} />
          </Field>
          <Field label="Last name">
            <input className="input" placeholder="Sharma" value={form.lastName} onChange={set("lastName")} />
          </Field>
        </div>

        <Field label="Work email" required>
          <input type="email" className="input" placeholder="you@company.com" autoComplete="email" value={form.email} onChange={set("email")} />
        </Field>

        <Field label="Password" required>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              className="input pr-10"
              placeholder="Minimum 6 characters"
              autoComplete="new-password"
              value={form.password}
              onChange={set("password")}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPw((s) => !s)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
              style={{ color: "var(--color-text-muted)" }}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </Field>

        <Field label="Confirm password" required>
          <input
            type={showPw ? "text" : "password"}
            className="input"
            placeholder="Re-enter your password"
            autoComplete="new-password"
            value={form.confirm}
            onChange={set("confirm")}
          />
        </Field>

        {form.password && (
          <ul className="space-y-1">
            {pwChecks.map(({ ok, label }) => (
              <li key={label} className="flex items-center gap-1.5 text-[12px]" style={{ color: ok ? "var(--color-success)" : "var(--color-text-muted)" }}>
                <CheckCircle2 size={13} /> {label}
              </li>
            ))}
          </ul>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 size={15} className="animate-spin" />}
          {loading ? "Creating account…" : "Create account"}
        </Button>

        <p className="text-center text-[12px]" style={{ color: "var(--color-text-muted)" }}>
          Accounts are created with Employee access. Admins assign roles from the Employee Directory.
        </p>
      </form>
    </AuthShell>
  );
}
