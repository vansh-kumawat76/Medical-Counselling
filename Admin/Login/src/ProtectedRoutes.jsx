import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = ({children}) => {
  const token = localStorage.getItem("token");

  console.log("ProtecetedRoute executed");
  console.log("token ;", token);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;