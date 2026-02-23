export interface User {
  id: string;
  email: string;
  displayName: string | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const AUTH_ERROR_CODES = {
  EMAIL_NOT_VERIFIED: "EMAIL_NOT_VERIFIED",
} as const;
