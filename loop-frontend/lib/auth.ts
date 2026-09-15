export type UserRole =
  | "ADMIN"
  | "OWNER"
  | "ANALYST"
  | "VIEWER";

export function getRole(): UserRole | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(
    "user_role",
  ) as UserRole | null;
}

export function isAdmin() {
  return getRole() === "ADMIN";
}

export function isOwner() {
  return getRole() === "OWNER";
}

export function isAnalyst() {
  return getRole() === "ANALYST";
}

export function isViewer() {
  return getRole() === "VIEWER";
}

export function canAccessCompanies() {
  const role = getRole();

  return (
    role === "ADMIN" ||
    role === "OWNER"
  );
}

export function canAccessUsers() {
  return getRole() === "ADMIN";
}

export function canAccessFeedback() {
  const role = getRole();

  return (
    role === "ADMIN" ||
    role === "OWNER" ||
    role === "ANALYST" ||
    role === "VIEWER"
  );
}

export function canAccessAnalytics() {
  const role = getRole();

  return (
    role === "ADMIN" ||
    role === "OWNER" ||
    role === "ANALYST" ||
    role === "VIEWER"
  );
}

export function clearAuth() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user_role");
  localStorage.removeItem("user");
}