import { Link } from "react-router-dom";
import AuthLayout from "../components/layout/AuthLayout";

/* ─── shared inline styles ─────────────────────────────────────────────── */
const label = {
  display: "block",
  marginBottom: 6,
  fontSize: 13,
  fontWeight: 500,
  color: "var(--color-text-secondary)",
};

const input = {
  display: "block",
  width: "100%",
  height: 38,
  padding: "0 12px",
  fontSize: 14,
  color: "var(--color-text-primary)",
  backgroundColor: "var(--color-input-bg)",
  border: "1px solid var(--color-border)",
  borderRadius: 8,
  outline: "none",
  transition: "border-color 0.15s",
};

export default function LoginPage() {
  const handleSubmit = (e) => {
    e.preventDefault();
    // handle login logic
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your AssetFlow account"
      submitText="Sign in"
      onSubmit={handleSubmit}
      footerText="Don't have an account?"
      footerLinkText="Register"
      footerLinkTo="/signup"
    >
      {/* email */}
      <div>
        <label htmlFor="login-email" style={label}>
          Email address
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          style={input}
          onFocus={(e) => (e.target.style.borderColor = "var(--color-primary)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
        />
      </div>

      {/* password */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <label htmlFor="login-password" style={{ ...label, margin: 0 }}>
            Password
          </label>
          <Link
            to="/forgot-password"
            style={{ fontSize: 12, fontWeight: 500, color: "var(--color-primary)", textDecoration: "none" }}
          >
            Forgot password?
          </Link>
        </div>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          style={input}
          onFocus={(e) => (e.target.style.borderColor = "var(--color-primary)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
        />
      </div>
    </AuthLayout>
  );
}
