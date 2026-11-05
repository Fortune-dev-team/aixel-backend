import type { UserRole } from '../enums/user-role.enum';

export interface AuthenticatedUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
}
