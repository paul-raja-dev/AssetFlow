import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./context/AuthContext";

// Apply saved theme before first paint
const savedTheme = localStorage.getItem("theme");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
if (savedTheme === "dark" || (savedTheme === "system" && prefersDark) || (!savedTheme && prefersDark)) {
    document.documentElement.classList.add("dark");
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
                <Toaster
                    position="top-right"
                    toastOptions={{
                        style: {
                            background: "var(--color-surface)",
                            color: "var(--color-text-primary)",
                            border: "1px solid var(--color-border)",
                            fontSize: "13.5px",
                        },
                    }}
                />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;