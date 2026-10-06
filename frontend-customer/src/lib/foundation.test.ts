// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CustomerApiClient, resolveApiBaseUrl } from "../api";
import {
  ApiError,
  formatMoney,
  normalizeError,
  getStoredToken,
  setStoredToken,
} from "./index";

describe("customer API foundation", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("normalizes API base URLs without duplicating /api", () => {
    expect(resolveApiBaseUrl()).toBe("/api");
    expect(resolveApiBaseUrl("/api/")).toBe("/api");
    expect(resolveApiBaseUrl("http://localhost:7000/")).toBe(
      "http://localhost:7000/api",
    );
    expect(resolveApiBaseUrl("http://localhost:7000/api")).toBe(
      "http://localhost:7000/api",
    );
  });

  it("encodes product search query before sending it", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
    const client = new CustomerApiClient({
      baseUrl: "http://localhost:7000",
      fetcher,
    });

    await client.products.search("rau & củ?");

    expect(fetcher).toHaveBeenCalledOnce();
    const [url] = fetcher.mock.calls[0] ?? [];
    expect(String(url)).toContain("keyword=rau%20%26%20c%E1%BB%A7%3F");
  });

  it("normalizes lower-case anonymous auth responses", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          message: "ok",
          token: "jwt",
          customer: { customerId: 7, name: "A", email: "a@example.test" },
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    );
    const client = new CustomerApiClient({
      baseUrl: "http://localhost:7000",
      fetcher,
    });

    await expect(
      client.auth.login({ Email: "a@example.test", Password: "secret" }),
    ).resolves.toMatchObject({
      Token: "jwt",
      Customer: { CustomerId: 7, Name: "A" },
    });
  });

  it("normalizes errors while preserving API status and payload", () => {
    const error = new ApiError("Không tìm thấy", 404, {
      message: "Không tìm thấy",
    });
    expect(normalizeError(error)).toMatchObject({
      message: "Không tìm thấy",
      status: 404,
    });
    expect(normalizeError(new Error("mất kết nối")).message).toBe(
      "mất kết nối",
    );
  });

  it("keeps the default fetcher bound to its receiver", () => {
    const client = new CustomerApiClient({ baseUrl: "http://localhost:7000" });
    const fetcher = (
      client as unknown as { fetcher: (...args: unknown[]) => unknown }
    ).fetcher;
    expect(fetcher.name).toBe("bound fetch");
  });
  it("formats invalid money safely and stores token", () => {
    expect(formatMoney(125000)).toContain("125.000");
    expect(formatMoney(Number.NaN)).toContain("0");
    setStoredToken(" token-123 ");
    expect(getStoredToken()).toBe("token-123");
    setStoredToken(null);
    expect(getStoredToken()).toBeNull();
  });
});
