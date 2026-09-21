import { ROLES, isAdminRole } from "../config.js";

export { isAdminRole };

export function canAccessAdmin(role: string): boolean {
  return isAdminRole(role);
}

export function canManageAdmins(role: string): boolean {
  return role === ROLES.SUPER_ADMIN;
}

export function canModerate(role: string): boolean {
  return role === ROLES.MODERATOR || role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN;
}
