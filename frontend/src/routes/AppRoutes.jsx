import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import SignupPage from "../pages/SignupPage";
import DashboardPage from "../pages/DashboardPage";
import PlaceholderPage from "../pages/PlaceholderPage";
import AppLayout from "../components/layout/AppLayout";
import ProtectedRoute from "../components/common/ProtectedRoute";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Protected Layout Routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/organization-setup" element={<PlaceholderPage title="Organization Setup" />} />
        <Route path="/assets" element={<PlaceholderPage title="Asset Directory" />} />
        <Route path="/assets/:assetId" element={<PlaceholderPage title="Asset Detail" />} />
        <Route path="/allocations" element={<PlaceholderPage title="Allocations" />} />
        <Route path="/bookings" element={<PlaceholderPage title="Bookings" />} />
        <Route path="/maintenance" element={<PlaceholderPage title="Maintenance" />} />
        <Route path="/audits" element={<PlaceholderPage title="Audits" />} />
        <Route path="/audits/:auditCycleId" element={<PlaceholderPage title="Audit Cycle Detail" />} />
        <Route path="/reports" element={<PlaceholderPage title="Reports" />} />
        <Route path="/activity-logs" element={<PlaceholderPage title="Activity Logs" />} />
      </Route>

      {/* Default redirect */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
