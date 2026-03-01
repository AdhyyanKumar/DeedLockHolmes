import { useEffect, useState } from "react";
import { UserCircle2 } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { beginOAuthLogin } from "../api/authApi";
import { showToast } from "../utils/toast";
import { useAuth } from "./AuthProvider";

function linkClass(isActive: boolean) {
  return [
    "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
    isActive
      ? "bg-emerald-300/20 text-white"
      : "text-emerald-100 hover:bg-white/10 hover:text-white",
  ].join(" ");
}

type ModalMode = "login" | "signup" | null;

export default function Navbar() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isHeroRoute =
    location.pathname === "/" ||
    location.pathname === "/dashboard" ||
    location.pathname === "/register" ||
    location.pathname === "/my-properties" ||
    location.pathname === "/about";

  const [menuOpen, setMenuOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [loading, setLoading] = useState(false);
  const authParam = new URLSearchParams(location.search).get("auth");

  useEffect(() => {
    if (authParam === "login" || authParam === "signup") {
      setModalMode(authParam);
      setMenuOpen(false);
    }
  }, [authParam]);

  function closeModal() {
    setModalMode(null);
    if (location.pathname === "/" && location.search) {
      navigate("/", { replace: true });
    }
  }

  async function onContinueWithGoogle() {
    setLoading(true);
    beginOAuthLogin("/register");
  }

  return (
    <>
      <header
        className={[
          "sticky top-0 z-40",
          isHeroRoute
            ? "border-b border-emerald-900/30 bg-[#000000]"
            : "border-b border-emerald-900/30 bg-[#000000]/95 backdrop-blur",
        ].join(" ")}
      >
        {isHeroRoute ? (
          <div className="pointer-events-none absolute -bottom-8 left-0 right-0 h-10 bg-gradient-to-b from-[#000000] to-transparent" />
        ) : null}
        <div
          className={[
            "relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8",
            isHeroRoute ? "h-20" : "h-16",
          ].join(" ")}
        >
          <NavLink to="/" className="flex items-center gap-2">
            <span
              className={[
                "font-semibold tracking-tight",
                isHeroRoute ? "text-2xl text-white sm:text-3xl" : "text-lg text-white",
              ].join(" ")}
            >
              DeedLock Holmes
            </span>
          </NavLink>

          <div className="relative flex items-center gap-2">
            <nav className="flex items-center gap-2">
              <NavLink to="/" className={({ isActive }) => linkClass(isActive)}>
                Home
              </NavLink>
              <NavLink to="/about" className={({ isActive }) => linkClass(isActive)}>
                About
              </NavLink>
              {isAuthenticated ? (
                <NavLink to="/register" className={({ isActive }) => linkClass(isActive)}>
                  Register Property
                </NavLink>
              ) : null}
              <NavLink to="/dashboard" className={({ isActive }) => linkClass(isActive)}>
                Browse Properties
              </NavLink>
              {isAuthenticated ? (
                <NavLink to="/my-properties" className={({ isActive }) => linkClass(isActive)}>
                  My Properties
                </NavLink>
              ) : null}
            </nav>

            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-emerald-200/50 bg-white/10 text-white transition hover:bg-white/20"
              aria-label="Account menu"
            >
              <UserCircle2 className="h-6 w-6" />
            </button>

            {menuOpen ? (
              <div className="absolute right-0 top-12 z-50 w-64 rounded-2xl border border-emerald-200/30 bg-[#052018] p-3 text-white shadow-card">
                {isLoading ? null : isAuthenticated ? (
                  <div className="space-y-2">
                    <p className="text-sm text-emerald-100">{user?.name}</p>
                    <p className="text-xs text-emerald-200/80">{user?.email}</p>
                    <button
                      type="button"
                      onClick={async () => {
                        await logout();
                        setMenuOpen(false);
                        showToast("Logged out");
                        navigate("/", { replace: true });
                      }}
                      className="mt-2 w-full rounded-lg bg-white/15 px-3 py-2 text-sm font-semibold text-white hover:bg-white/20"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-emerald-100">Google OAuth</p>
                    <button
                      type="button"
                      onClick={() => {
                        setModalMode("login");
                        setMenuOpen(false);
                      }}
                      className="w-full rounded-lg bg-white px-3 py-2 text-sm font-semibold text-[#0F3B2E] hover:bg-emerald-100"
                    >
                      Continue
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setModalMode("signup");
                        setMenuOpen(false);
                      }}
                      className="w-full rounded-lg border border-emerald-100/60 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10"
                    >
                      Learn More
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {modalMode ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[#061E17]/70 px-4 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-emerald-200/35 bg-[#114637]/92 p-6 text-emerald-50 shadow-card">
            <h2 className="text-xl font-semibold text-white">
              {modalMode === "signup" ? "Create Account" : "Login"}
            </h2>
            <p className="mt-1 text-sm text-emerald-100/80">
              Authenticate with Google. The backend exchanges the authorization code,
              stores the user profile in MongoDB, and creates a secure session cookie.
            </p>

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="w-full rounded-xl border border-emerald-200/40 px-4 py-2.5 text-sm font-semibold text-emerald-50 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onContinueWithGoogle}
                disabled={loading}
                className="w-full rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#0F3B2E] hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Redirecting..." : "Continue with Google"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
