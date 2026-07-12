import { Link, useLocation } from "react-router-dom";
import AuthNavbar from "../components/layout/AuthNavbar";

/* ─── shared inline styles ─────────────────────────────────────────────── */
const card = {
  width: "100%",
  maxWidth: 400,
  backgroundColor: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: 12,
  boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.05)",
  overflow: "hidden",
};

const tabBase = {
  flex: 1,
  padding: "11px 0",
  fontSize: 13,
  fontWeight: 500,
  textAlign: "center",
  textDecoration: "none",
  transition: "color 0.15s",
  borderBottom: "2px solid transparent",
  background: "none",
};

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

const btn = {
  display: "block",
  width: "100%",
  height: 38,
  borderRadius: 8,
  border: "none",
  backgroundColor: "var(--color-primary)",
  color: "#ffffff",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  transition: "background-color 0.15s",
  marginTop: 4,
};

export default function LoginPage() {
  const location = useLocation();

  return (
    <>
      <AuthNavbar />

      {/* full-viewport centering */}
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--color-page)",
          padding: "72px 16px 32px",
        }}
      >
        <div style={{ width: "100%", maxWidth: 400 }}>
          {/* heading above card */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <h1
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: 22,
                fontWeight: 700,
                color: "var(--color-text-primary)",
                letterSpacing: "-0.02em",
              }}
            >
              Welcome back
            </h1>
            <p
              style={{
                marginTop: 4,
                fontSize: 13,
                color: "var(--color-text-muted)",
              }}
            >
              Sign in to your AssetFlow account
            </p>
          </div>

          {/* card */}
          <div style={card}>
            {/* tab row */}
            <div
              style={{
                display: "flex",
                borderBottom: "1px solid var(--color-border)",
                backgroundColor: "var(--color-surface)",
              }}
            >
              <Link
                to="/login"
                style={{
                  ...tabBase,
                  color: location.pathname === "/login" ? "var(--color-primary)" : "var(--color-text-muted)",
                  borderBottomColor: location.pathname === "/login" ? "var(--color-primary)" : "transparent",
                }}
              >
                Login
              </Link>
              <Link
                to="/signup"
                style={{
                  ...tabBase,
                  color: location.pathname === "/signup" ? "var(--color-primary)" : "var(--color-text-muted)",
                  borderBottomColor: location.pathname === "/signup" ? "var(--color-primary)" : "transparent",
                }}
              >
                Register
              </Link>
            </div>

            {/* form body — fixed minHeight matches the 3-field Register card so size never shifts */}
            <div style={{ padding: "28px 28px 32px", minHeight: 284 }}>
              <form
                onSubmit={(e) => e.preventDefault()}
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
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

                {/* submit */}
                <button
                  type="submit"
                  style={btn}
                  onMouseEnter={(e) => (e.target.style.backgroundColor = "var(--color-primary-hover)")}
                  onMouseLeave={(e) => (e.target.style.backgroundColor = "var(--color-primary)")}
                >
                  Sign in
                </button>
              </form>

              <p
                style={{
                  marginTop: 20,
                  textAlign: "center",
                  fontSize: 13,
                  color: "var(--color-text-muted)",
                }}
              >
                Don&apos;t have an account?{" "}
                <Link
                  to="/signup"
                  style={{ color: "var(--color-primary)", fontWeight: 500, textDecoration: "none" }}
                >
                  Register
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
