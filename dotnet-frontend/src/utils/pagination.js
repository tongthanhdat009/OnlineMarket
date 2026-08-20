/**
 * Unified paged response parser.
 * Supports: array, {Items, TotalCount}, {items, total}, {Items, TotalCount, Page, PageSize}
 */
export function parsePagedResponse(data) {
  if (Array.isArray(data)) {
    return { items: data, total: data.length };
  }
  if (data && typeof data === "object") {
    // PagedResultDto: { Items, TotalCount, Page, PageSize } (PascalCase) or camelCase
    if (Array.isArray(data.Items) || Array.isArray(data.items)) {
      const items = data.Items ?? data.items ?? [];
      const total = data.TotalCount ?? data.total ?? data.Total ?? items.length;
      return { items: Array.isArray(items) ? items : [], total: Number(total) || 0 };
    }
    // Sometimes backend wraps as { data: [...] } already unwrapped by apiClient, but handle { Data/Items }
    if (Array.isArray(data.Data)) {
      return { items: data.Data, total: data.TotalCount ?? data.total ?? data.Data.length };
    }
  }
  // Fallback: treat as empty
  return { items: [], total: 0 };
}

export function buildPagedParams({ page, pageSize, search, searchField } = {}) {
  const params = {};
  if (page != null) params.page = page;
  if (pageSize != null) params.pageSize = pageSize;
  if (search != null && String(search).trim() !== "") params.search = String(search).trim();
  if (searchField != null && String(searchField).trim() !== "") params.searchField = String(searchField).trim();
  return params;
}
