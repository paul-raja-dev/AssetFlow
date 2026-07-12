import { Link, useLocation } from "react-router-dom";

export default function LoginPage() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm">
        {/* Tabs */}
        <div className="flex border-b">
          <Link
            to="/login"
            className={`flex-1 pb-2 text-center text-sm font-medium ${
              location.pathname === "/login"
                ? "border-b-2 border-black"
                : ""
            }`}
          >
            Login
          </Link>
          <Link
            to="/signup"
            className={`flex-1 pb-2 text-center text-sm font-medium ${
              location.pathname === "/signup"
                ? "border-b-2 border-black"
                : ""
            }`}
          >
            Register
          </Link>
        </div>

        {/* Form */}
        <form className="mt-6 space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-sm">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              className="mt-1 block w-full border px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              className="mt-1 block w-full border px-3 py-2 text-sm"
            />
          </div>

          <button
            type="submit"
            className="w-full border px-3 py-2 text-sm font-medium"
          >
            Sign in
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link to="/forgot-password" className="text-sm underline">
            Forgot password?
          </Link>
        </div>
      </div>
    </div>
  );
}
