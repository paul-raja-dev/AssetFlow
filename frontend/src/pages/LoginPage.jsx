import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/layout/AuthLayout";
import useAuth from "../hooks/useAuth";

/* ─── shared inline styles ─────────────────────────────────────────────── */
const label = {
  display: "block",
  marginBottom: 6,
  fontSize: 13,
  fontWeight: 500,
  color: "var(--color-text-secondary)",
};

const inputStyle = {
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

const errorContainer = {
  padding: "8px 12px",
  backgroundColor: "var(--color-page)",
  border: "1px solid #ef4444",
  borderRadius: 6,
  color: "#ef4444",
  fontSize: 13,
  fontWeight: 500,
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
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
      loading={loading}
    >
      {/* error banner */}
      {error && <div style={errorContainer}>{error}</div>}

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
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
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
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = "var(--color-primary)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
        />
      </div>
    </AuthLayout>
  );
}
