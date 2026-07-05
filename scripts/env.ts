export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export function redact(value?: string): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.search) url.search = "?key=***";
    return url.toString();
  } catch {
    return value.length <= 8 ? "***" : `${value.slice(0, 4)}***${value.slice(-4)}`;
  }
}
