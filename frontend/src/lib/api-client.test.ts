import { describe, expect, it, vi } from "vitest";
import {
  ApiClient,
  ApiError,
  normalizeListResponse,
  type TokenStore,
} from "./api-client";

const store = (
  accessToken: string | null,
  refreshToken: string | null,
): TokenStore => ({
  getAccessToken: () => accessToken,
  getRefreshToken: () => refreshToken,
  setTokens: vi.fn(),
  clear: vi.fn(),
});

describe("normalizeListResponse", () => {
  it("normalizes raw arrays and .NET paged results", () => {
    expect(normalizeListResponse([1, 2])).toMatchObject({
      items: [1, 2],
      totalCount: 2,
      page: 1,
      pageSize: 2,
    });
    expect(
      normalizeListResponse({
        Items: ["x"],
        TotalCount: 8,
        Page: 2,
        PageSize: 1,
      }),
    ).toMatchObject({ items: ["x"], totalCount: 8, page: 2, pageSize: 1 });
  });
});

describe("ApiClient", () => {
  it("refreshes once after 401, then retries with new bearer token", async () => {
    const tokenStore = store("expired", "refresh");
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "expired" }), { status: 401 }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            AccessToken: "new-access",
            RefreshToken: "new-refresh",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    const client = new ApiClient({
      baseUrl: "http://test",
      fetchImpl,
      tokenStore,
    });
    await expect(client.get("api/orders")).resolves.toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect((fetchImpl.mock.calls[2][1] as RequestInit).headers).toBeInstanceOf(
      Headers,
    );
    expect(tokenStore.setTokens).toHaveBeenCalledWith({
      accessToken: "new-access",
      refreshToken: "new-refresh",
    });
  });

  it("raises ApiError with normalized server message", async () => {
    const client = new ApiClient({
      baseUrl: "http://test",
      fetchImpl: vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ Message: "No access" }), {
          status: 403,
        }),
      ),
      tokenStore: store(null, null),
    });
    await expect(client.get("api/private")).rejects.toMatchObject({
      name: "ApiError",
      status: 403,
      message: "No access",
    } satisfies Partial<ApiError>);
  });
});

it("keeps local requests under the Vite /api proxy by default", async () => {
  const fetchImpl = vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  );
  const client = new ApiClient({ fetchImpl, tokenStore: store(null, null) });
  await client.get("api/order/dashboard-stats");
  expect(fetchImpl.mock.calls[0][0]).toBe("/api/order/dashboard-stats");
});

it("keeps the default fetch impl bound to its receiver", () => {
  const client = new ApiClient({ tokenStore: store(null, null) });
  const fetchImpl = (
    client as unknown as { fetchImpl: (...args: unknown[]) => unknown }
  ).fetchImpl;
  expect(fetchImpl.name).toBe("bound fetch");
});
