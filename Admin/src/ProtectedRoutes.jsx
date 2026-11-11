
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import {
  getDefaultRoute,
  hasPermission,
  getUserAccess,
} from "./utils/accessControl";

const ProtectedRoute = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export const PermissionRoute = ({
  children,
  permission,
  superAdminOnly = false,
}) => {
  const { isSuperAdmin } = getUserAccess();

  const allowed = superAdminOnly
    ? isSuperAdmin
    : hasPermission(permission);

  if (!allowed) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
