const MIN_LENGTH = 8;
const HAS_UPPER = /[A-Z]/;
const HAS_LOWER = /[a-z]/;
const HAS_NUMBER = /[0-9]/;

export function validatePassword(password: string): { ok: boolean; message?: string } {
  if (password.length < MIN_LENGTH) {
    return { ok: false, message: `Password must be at least ${MIN_LENGTH} characters` };
  }
  if (!HAS_UPPER.test(password)) {
    return { ok: false, message: "Password must contain at least one uppercase letter" };
  }
  if (!HAS_LOWER.test(password)) {
    return { ok: false, message: "Password must contain at least one lowercase letter" };
  }
  if (!HAS_NUMBER.test(password)) {
    return { ok: false, message: "Password must contain at least one number" };
  }
  return { ok: true };
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
