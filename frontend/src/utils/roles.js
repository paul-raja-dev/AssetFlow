// Role helpers — mirror of backend guards (PS User Roles section).

export const ROLES = {
  ADMIN: "ADMIN",
  ASSET_MANAGER: "ASSET_MANAGER",
  DEPARTMENT_HEAD: "DEPARTMENT_HEAD",
  EMPLOYEE: "EMPLOYEE",
};

export const ROLE_LABELS = {
  ADMIN: "Admin",
  ASSET_MANAGER: "Asset Manager",
  DEPARTMENT_HEAD: "Department Head",
  EMPLOYEE: "Employee",
};

export const isAdmin = (u) => u?.role === "ADMIN";
export const isManager = (u) => ["ADMIN", "ASSET_MANAGER"].includes(u?.role);
export const canApprove = (u) => ["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD"].includes(u?.role);

export const fullName = (u) =>
  u ? `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email : "";
