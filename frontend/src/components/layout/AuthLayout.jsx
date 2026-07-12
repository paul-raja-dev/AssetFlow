import { Link, useLocation } from "react-router-dom";
import AuthNavbar from "./AuthNavbar";

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

const btn = {
  display: "block",
  width: "100%",
  height: 38,
  borderRadius: 8,
  border: "none",
  backgroundColor: "var(--color-primary)",
  color: "var(--color-primary-text)",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  transition: "background-color 0.15s",
  marginTop: 4,
};

export default function AuthLayout({
  title,
  subtitle,
  submitText,
  onSubmit,
  footerText,
  footerLinkText,
  footerLinkTo,
  loading = false,
  children,
}) {
  const location = useLocation();
  const isLogin = location.pathname === "/login";

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
              {title}
            </h1>
            <p
              style={{
                marginTop: 4,
                fontSize: 13,
                color: "var(--color-text-muted)",
              }}
            >
              {subtitle}
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
                  color: isLogin ? "var(--color-primary)" : "var(--color-text-muted)",
                  borderBottomColor: isLogin ? "var(--color-primary)" : "transparent",
                }}
              >
                Login
              </Link>
              <Link
                to="/signup"
                style={{
                  ...tabBase,
                  color: !isLogin ? "var(--color-primary)" : "var(--color-text-muted)",
                  borderBottomColor: !isLogin ? "var(--color-primary)" : "transparent",
                }}
              >
                Register
              </Link>
            </div>

            {/* form body — same height and flex structure so size never shifts */}
            <div style={{ padding: "28px 28px 32px", height: 380, display: "flex", flexDirection: "column" }}>
              <form
                onSubmit={onSubmit}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  flex: 1,
                }}
              >
                {/* top inputs container */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {children}
                </div>

                {/* bottom action container */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      ...btn,
                      opacity: loading ? 0.7 : 1,
                      cursor: loading ? "not-allowed" : "pointer",
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) e.target.style.backgroundColor = "var(--color-primary-hover)";
                    }}
                    onMouseLeave={(e) => {
                      if (!loading) e.target.style.backgroundColor = "var(--color-primary)";
                    }}
                  >
                    {loading ? "Processing..." : submitText}
                  </button>

                  <p
                    style={{
                      textAlign: "center",
                      fontSize: 13,
                      color: "var(--color-text-muted)",
                      margin: 0,
                    }}
                  >
                    {footerText}{" "}
                    <Link
                      to={footerLinkTo}
                      style={{ color: "var(--color-primary)", fontWeight: 500, textDecoration: "none" }}
                    >
                      {footerLinkText}
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
