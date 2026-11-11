import { ApiError } from "../lib";
import type { CustomerApiClient } from "./core/client-core";
import type { CategoryDto, ProductDto } from "../types";
import { asId } from "./core/http-utils";

export function createProductsNamespace(client: CustomerApiClient) {
  return {
    list: () =>
      client.request<ProductDto[]>("/customer/products", { auth: false }),
    get: (productId: number) =>
      client.request<ProductDto>(`/customer/products/${asId(productId)}`, {
        auth: false,
      }),
    byCategory: (categoryId: number) =>
      client.request<ProductDto[]>(
        `/customer/products/category/${asId(categoryId)}`,
        { auth: false },
      ),
    search: (keyword: string) => {
      const value = keyword.trim();
      if (!value)
        throw new ApiError("Từ khóa tìm kiếm không được để trống.", 400);
      return client.request<ProductDto[]>(
        `/customer/products/search?keyword=${encodeURIComponent(value)}`,
        { auth: false },
      );
    },
    categories: () =>
      client.request<CategoryDto[]>("/customer/products/categories", {
        auth: false,
      }),
  };
}

export type ProductsNamespace = ReturnType<typeof createProductsNamespace>;
