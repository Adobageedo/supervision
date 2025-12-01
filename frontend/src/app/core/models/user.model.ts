export enum UserRole {
  ADMIN = 'admin',
  WRITE = 'write',
  READ = 'read',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  fullName?: string;
  firebaseUid?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
