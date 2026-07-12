import axiosClient from "./axiosClient";

// Every backend response is { success, message, data } — axiosClient already
// unwraps response.data, so callers read res.data for the payload.

/* ── Dashboard ── */
export const getDashboardStats = () => axiosClient.get("dashboard/stats");

/* ── Users ── */
export const listUsers = (params) => axiosClient.get("users", { params });
export const updateUser = (id, payload) => axiosClient.patch(`users/${id}`, payload);

/* ── Departments ── */
export const listDepartments = () => axiosClient.get("departments");
export const createDepartment = (payload) => axiosClient.post("departments", payload);
export const updateDepartment = (id, payload) => axiosClient.patch(`departments/${id}`, payload);
export const deleteDepartment = (id) => axiosClient.delete(`departments/${id}`);

/* ── Asset categories ── */
export const listCategories = () => axiosClient.get("asset-categories");
export const createCategory = (payload) => axiosClient.post("asset-categories", payload);
export const updateCategory = (id, payload) => axiosClient.patch(`asset-categories/${id}`, payload);

/* ── Assets ── */
export const listAssets = (params) => axiosClient.get("assets", { params });
export const getAsset = (id) => axiosClient.get(`assets/${id}`);
export const createAsset = (payload) => axiosClient.post("assets", payload);
export const updateAsset = (id, payload) => axiosClient.patch(`assets/${id}`, payload);
export const updateAssetStatus = (id, status) => axiosClient.patch(`assets/${id}/status`, { status });
export const getAssetHistory = (id, params) => axiosClient.get(`allocations/asset/${id}/history`, { params });

/* ── Allocations ── */
export const listAllocations = (params) => axiosClient.get("allocations", { params });
export const createAllocation = (payload) => axiosClient.post("allocations", payload);
export const returnAllocation = (id, payload) => axiosClient.patch(`allocations/${id}/return`, payload || {});

/* ── Transfer requests ── */
export const listTransfers = (params) => axiosClient.get("transfer-requests", { params });
export const createTransfer = (payload) => axiosClient.post("transfer-requests", payload);
export const approveTransfer = (id, payload) => axiosClient.patch(`transfer-requests/${id}/approve`, payload || {});
export const rejectTransfer = (id, payload) => axiosClient.patch(`transfer-requests/${id}/reject`, payload || {});

/* ── Bookings ── */
export const listBookings = (params) => axiosClient.get("bookings", { params });
export const createBooking = (payload) => axiosClient.post("bookings", payload);
export const cancelBooking = (id) => axiosClient.delete(`bookings/${id}/cancel`);

/* ── Maintenance ── */
export const listMaintenance = (params) => axiosClient.get("maintenance-requests", { params });
export const createMaintenance = (payload) => axiosClient.post("maintenance-requests", payload);
export const updateMaintenanceStatus = (id, payload) => axiosClient.patch(`maintenance-requests/${id}/status`, payload);

/* ── Audit cycles ── */
export const listAuditCycles = () => axiosClient.get("audit-cycles");
export const createAuditCycle = (payload) => axiosClient.post("audit-cycles", payload);
export const getAuditCycle = (id) => axiosClient.get(`audit-cycles/${id}`);
export const closeAuditCycle = (id) => axiosClient.post(`audit-cycles/${id}/close`);
export const listAuditItems = (id, params) => axiosClient.get(`audit-cycles/${id}/items`, { params });
export const updateAuditItem = (cycleId, itemId, payload) =>
  axiosClient.patch(`audit-cycles/${cycleId}/items/${itemId}`, payload);
export const listDiscrepancies = (id) => axiosClient.get(`audit-cycles/${id}/discrepancies`);

/* ── Notifications ── */
export const listNotifications = (params) => axiosClient.get("notifications", { params });
export const markNotificationRead = (id) => axiosClient.patch(`notifications/${id}/read`);
export const markAllNotificationsRead = () => axiosClient.patch("notifications/read-all");
