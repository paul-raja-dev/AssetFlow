import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import SignupPage from "../pages/SignupPage";
import DashboardPage from "../pages/DashboardPage";
import AssetsPage from "../pages/AssetsPage";
import AssetDetailPage from "../pages/AssetDetailPage";
import AllocationsPage from "../pages/AllocationsPage";
import TransfersPage from "../pages/TransfersPage";
import BookingsPage from "../pages/BookingsPage";
import MaintenancePage from "../pages/MaintenancePage";
import AuditsPage from "../pages/AuditsPage";
import AuditCycleDetailPage from "../pages/AuditCycleDetailPage";
import OrganizationPage from "../pages/OrganizationPage";
import NotificationsPage from "../pages/NotificationsPage";
import SettingsPage from "../pages/SettingsPage";
import AppLayout from "../components/layout/AppLayout";
import ProtectedRoute from "../components/common/ProtectedRoute";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Authenticated app */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/assets" element={<AssetsPage />} />
        <Route path="/assets/:assetId" element={<AssetDetailPage />} />
        <Route path="/allocations" element={<AllocationsPage />} />
        <Route path="/transfers" element={<TransfersPage />} />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="/maintenance" element={<MaintenancePage />} />
        <Route path="/audits" element={<AuditsPage />} />
        <Route path="/audits/:auditCycleId" element={<AuditCycleDetailPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        {/* Admin only — Organization Setup (PS Screen 3) */}
        <Route
          path="/organization"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <OrganizationPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Default */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
