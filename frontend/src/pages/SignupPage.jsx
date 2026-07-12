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

export default function SignupPage() {
  const handleSubmit = (e) => {
    e.preventDefault();
    // handle register logic
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
    >
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
          style={input}
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
          style={input}
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
          style={input}
          onFocus={(e) => (e.target.style.borderColor = "var(--color-primary)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
        />
      </div>
    </AuthLayout>
  );
}
