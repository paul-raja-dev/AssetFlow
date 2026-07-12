import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup, login } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      // 1. Create the account
      await signup(name, email, password);
      // 2. Perform automatic login to transition smoothly
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create an account"
      subtitle="Join your organization on AssetFlow"
      submitText="Create account"
      onSubmit={handleSubmit}
      footerText="Already have an account?"
      footerLinkText="Sign in"
      footerLinkTo="/login"
      loading={loading}
    >
      {/* error banner */}
      {error && <div style={errorContainer}>{error}</div>}

      {/* full name */}
      <div>
        <label htmlFor="signup-name" style={label}>
          Full name
        </label>
        <input
          id="signup-name"
          type="text"
          autoComplete="name"
          placeholder="Jane Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = "var(--color-primary)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
        />
      </div>

      {/* email */}
      <div>
        <label htmlFor="signup-email" style={label}>
          Email address
        </label>
        <input
          id="signup-email"
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
        <label htmlFor="signup-password" style={label}>
          Password
        </label>
        <input
          id="signup-password"
          type="password"
          autoComplete="new-password"
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
