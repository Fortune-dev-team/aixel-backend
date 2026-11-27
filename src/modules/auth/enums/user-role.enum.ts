export enum UserRole {
  TEAM = 'tim',
  ADMIN = 'admin',
}

export function normalizeUserRole(
  value: string | null | undefined,
): UserRole | null {
  switch (value?.trim().toLowerCase()) {
    case UserRole.TEAM:
      return UserRole.TEAM;
    case UserRole.ADMIN:
      return UserRole.ADMIN;
    default:
      return null;
  }
}
