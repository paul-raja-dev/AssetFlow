import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export default function AuthNavbar() {
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        backgroundColor: "var(--color-navbar)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: 16,
          fontWeight: 600,
          color: "var(--color-text-primary)",
          letterSpacing: "-0.01em",
        }}
      >
        AssetFlow
      </span>

      <button
        type="button"
        onClick={() => setDark((d) => !d)}
        aria-label="Toggle theme"
        style={{
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 6,
          border: "1px solid var(--color-border)",
          background: "transparent",
          color: "var(--color-text-secondary)",
          cursor: "pointer",
        }}
      >
        {dark ? <Sun size={15} /> : <Moon size={15} />}
      </button>
    </nav>
  );
}
