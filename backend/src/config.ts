export const APP_NAME = process.env.APP_NAME || "PROJECT STAR";
export const DEFAULT_LANGUAGE = process.env.DEFAULT_LANGUAGE || "en";
export const SUPPORTED_LANGUAGES = ["en", "tr"];

export const ROLES = {
  USER: "USER",
  MODERATOR: "MODERATOR",
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
} as const;

export const USER_STATUSES = {
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
  BANNED: "BANNED",
  PENDING_DELETION: "PENDING_DELETION",
} as const;

export const GENDERS = {
  MALE: "MALE",
  FEMALE: "FEMALE",
  NON_BINARY: "NON_BINARY",
  OTHER: "OTHER",
  PREFER_NOT_TO_SAY: "PREFER_NOT_TO_SAY",
} as const;

export const PREFERRED_GENDERS = {
  EVERYONE: "EVERYONE",
  MEN: "MEN",
  WOMEN: "WOMEN",
  NON_BINARY: "NON_BINARY",
  OTHER: "OTHER",
} as const;

export const LANGUAGE_LEVELS = {
  NATIVE: "NATIVE",
  FLUENT: "FLUENT",
  INTERMEDIATE: "INTERMEDIATE",
  LEARNING: "LEARNING",
} as const;

export type Role = keyof typeof ROLES;
export type UserStatus = keyof typeof USER_STATUSES;

export function isAdminRole(role: string): boolean {
  return role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN || role === ROLES.MODERATOR;
}
