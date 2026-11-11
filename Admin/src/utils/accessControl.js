
export const getUserAccess = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const savedPermissions = JSON.parse(
      localStorage.getItem("permissions") || "null"
    );

    const rawPermissions =
      savedPermissions ??
      user.permissions ??
      user.role?.permissions ??
      [];

    const role =
      typeof user.role === "string"
        ? user.role
        : user.role?.role || "";

    const permissions = rawPermissions
      .map((p) => typeof p === "string" ? p : p?.name)
      .filter(Boolean);

    return {
      user,
      role,
      permissions,
      isSuperAdmin: role.toLowerCase() === "superadmin",
    };
  } catch (error) {
    console.error("Access control error:", error);

    return {
      user: {},
      role: "",
      permissions: [],
      isSuperAdmin: false,
    };
  }
};

export const hasPermission = (permission) => {
  const { isSuperAdmin, permissions } = getUserAccess();

  return isSuperAdmin || permissions.includes(permission);
};

export const getDefaultRoute = () => {
  const { isSuperAdmin, permissions } = getUserAccess();

  if (isSuperAdmin) return "/dashboard";

  const routes = [
    ["/students", "student.view"],
    ["/users", "user.view"],
    ["/counselling/requests", "counsellingRequest.view"],
    ["/counselling/assignments", "counsellingAssignment.view"],
    ["/counselling/appointments", "appointment.view"],
    ["/counselling/sessions", "counsellingSession.view"],
    ["/counselling/notes", "counsellingNotes.view"],
    ["/counselling/followup", "followUp.view"],
    ["/colleges", "college.view"],
    ["/university", "university.view"],
    ["/role", "role.view"],
    ["/stream", "stream.view"],
    ["/degree", "degree.view"],
    ["/course", "course.view"],
    ["/specializations", "specialization.view"],
    ["/settings", "settings.view"],
  ];

  const accessible = routes.find(([path, permission]) =>
    permissions.includes(permission)
  );

  return accessible ? accessible[0] : "/unauthorized";
};
