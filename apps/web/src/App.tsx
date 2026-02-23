import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./auth/context";
import { Layout } from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Signup from "./pages/Signup";
import TheList from "./pages/TheList";
import Standings from "./pages/Standings";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminBars from "./pages/AdminBars";
import NotFound from "./pages/NotFound";

function Protected({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (user?.role !== "admin") return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/" element={<Protected><Dashboard /></Protected>} />
        <Route path="/signup" element={<Protected><Signup /></Protected>} />
        <Route path="/the-list" element={<Protected><TheList /></Protected>} />
        <Route path="/standings" element={<Protected><Standings /></Protected>} />
        <Route path="/profile" element={<Protected><Profile /></Protected>} />
        <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
        <Route path="/admin/players" element={<RequireAdmin><AdminUsers /></RequireAdmin>} />
        <Route path="/admin/bars" element={<RequireAdmin><AdminBars /></RequireAdmin>} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
