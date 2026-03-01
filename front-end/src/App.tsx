import { Navigate, Route, Routes } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import GlobalSpotlight from "./components/GlobalSpotlight";
import RequireAuth from "./components/RequireAuth";
import RegisterPage from "./pages/Register";
import DashboardPage from "./pages/Dashboard";
import MyPropertiesPage from "./pages/MyProperties";
import LoginPage from "./pages/Login";
import SignupPage from "./pages/Signup";
import LandingPage from "./pages/Landing";

const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.25, ease: "easeOut" as const },
};

export default function App() {
  const location = useLocation();
  const isHeroRoute =
    location.pathname === "/" ||
    location.pathname === "/dashboard" ||
    location.pathname === "/register" ||
    location.pathname === "/my-properties";

  return (
    <div className="app-shell relative text-ink">
      <Navbar />
      <GlobalSpotlight />
      <main
        className={
          isHeroRoute
            ? "relative z-10 w-full"
            : "relative z-10 mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8"
        }
      >
        <AnimatePresence mode="wait">
          <Routes>
            <Route
              path="/"
              element={
                <motion.div key="landing" {...pageTransition}>
                  <LandingPage />
                </motion.div>
              }
            />
            <Route
              path="/register"
              element={
                <motion.div key="register" {...pageTransition}>
                  <RequireAuth>
                    <RegisterPage />
                  </RequireAuth>
                </motion.div>
              }
            />
            <Route
              path="/dashboard"
              element={
                <motion.div key="dashboard" {...pageTransition}>
                  <DashboardPage />
                </motion.div>
              }
            />
            <Route
              path="/my-properties"
              element={
                <motion.div key="my-properties" {...pageTransition}>
                  <RequireAuth>
                    <MyPropertiesPage />
                  </RequireAuth>
                </motion.div>
              }
            />
            <Route
              path="/login"
              element={
                <motion.div key="login" {...pageTransition}>
                  <LoginPage />
                </motion.div>
              }
            />
            <Route
              path="/signup"
              element={
                <motion.div key="signup" {...pageTransition}>
                  <SignupPage />
                </motion.div>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  );
}
