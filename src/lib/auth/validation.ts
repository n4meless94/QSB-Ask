export const PASSWORD_REQUIREMENTS_MESSAGE =
  "Use at least 12 characters with uppercase, lowercase, a number, and a symbol.";

export function normalizeEmail(value: FormDataEntryValue | string | null | undefined) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

export function readFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePasswordStrength(password: string) {
  return (
    password.length >= 12 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}
