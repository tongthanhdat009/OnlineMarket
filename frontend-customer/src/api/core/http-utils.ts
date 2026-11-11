import type { CustomerInfo } from "../../types";

export function resolveApiBaseUrl(configured?: string): string {
  const value = (configured ?? "").trim().replace(/\/+$/, "");
  if (!value) return "/api";
  if (value === "/api" || value.endsWith("/api")) return value;
  return `${value}/api`;
}

export function responseMessage(payload: unknown): string | undefined {
  if (typeof payload === "string" && payload.trim()) return payload.trim();
  if (!payload || typeof payload !== "object") return undefined;
  const record = payload as Record<string, unknown>;
  for (const key of [
    "Message",
    "message",
    "error",
    "Error",
    "title",
    "Title",
  ]) {
    if (typeof record[key] === "string" && (record[key] as string).trim())
      return record[key] as string;
  }
  return undefined;
}

export function customerFromPayload(payload: unknown): CustomerInfo | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  const customerId = record.CustomerId ?? record.customerId;
  if (customerId === undefined || customerId === null) return null;
  return {
    CustomerId: Number(customerId),
    Name: String(record.Name ?? record.name ?? ""),
    Email: String(record.Email ?? record.email ?? ""),
    Phone: (record.Phone ?? record.phone) as string | null | undefined,
    Address: (record.Address ?? record.address) as string | null | undefined,
    CreatedAt: (record.CreatedAt ?? record.createdAt) as
      | string
      | null
      | undefined,
  };
}

export async function parseErrorPayload(
  response: Response,
): Promise<unknown> {
  const type = response.headers.get("content-type") ?? "";
  try {
    if (type.includes("application/json")) return await response.json();
    const text = await response.text();
    return text || undefined;
  } catch {
    return undefined;
  }
}

export function requestUrl(baseUrl: string, path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

export function asId(value: number): string {
  if (!Number.isInteger(value) || value <= 0)
    throw new TypeError(`ID không hợp lệ: ${value}`);
  return encodeURIComponent(String(value));
}

export function queryString(query: object): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query as Record<string, unknown>)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  return params.toString();
}
