export function validateCredentials(email: string, password: string, signup: boolean): string | null {
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Enter a valid email address.";
  }
  if (!password || password.length > 128) return "Enter a password of no more than 128 characters.";
  if (signup && password.length < 8) return "Use at least 8 characters for your password.";
  return null;
}
