export function appOrigin(value: string | undefined): string {
  if (!value) throw new Error("Application URL is not configured.");
  const url = new URL(value);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (url.username || url.password || url.search || url.hash || url.pathname !== "/" ||
      (url.protocol !== "https:" && !(local && url.protocol === "http:"))) {
    throw new Error("Application URL must be a valid site origin.");
  }
  return url.origin;
}
