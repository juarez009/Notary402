import { createHash, randomUUID } from "node:crypto";
export function sha256Hex(input) {
    const stable = typeof input === "string" ? input : JSON.stringify(input, Object.keys(input).sort());
    return `0x${createHash("sha256").update(stable).digest("hex")}`;
}
export function id(prefix) {
    return `${prefix}_${randomUUID().replaceAll("-", "").slice(0, 16)}`;
}
export function now() {
    return new Date().toISOString();
}
