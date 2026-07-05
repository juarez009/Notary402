import { createHash, randomUUID } from "node:crypto";

export function sha256Hex(input: unknown): string {
  const stable = typeof input === "string" ? input : JSON.stringify(input, Object.keys(input as object).sort());
  return `0x${createHash("sha256").update(stable).digest("hex")}`;
}

export function id(prefix: string): string {
  return `${prefix}_${randomUUID().replaceAll("-", "").slice(0, 16)}`;
}

export function now(): string {
  return new Date().toISOString();
}
