// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { StoreFooter } from "./StoreFooter";
import { ProductCard } from "./store-ui";
import { LocaleProvider, useLocale } from "../app/providers";
import { translator } from "../lib/translator";
import type { Product } from "../app/types";

const product: Product = {
  ProductId: 7,
  ProductName: "Test greens",
  Price: 25000,
  Quantity: 12,
  Deleted: false,
  ImageUrl: "https://example.test/greens.png",
};

function Probe() {
  const { t } = useLocale();
  return <span data-testid="probe-text">{t("nav.cart")}</span>;
}

describe("storefront card image and footer", () => {
  afterEach(() => cleanup());

  it("renders the product image edge to edge without inset padding", () => {
    const { container } = render(
      <MemoryRouter>
        <LocaleProvider>
          <ProductCard product={product} />
        </LocaleProvider>
      </MemoryRouter>,
    );
    const img = container.querySelector("article img");
    expect(img?.classList.contains("object-cover")).toBe(true);
    expect(img).not.toBeNull();
    for (const padded of ["p-1", "p-2", "p-3", "p-4", "p-6", "p-8", "p-14"]) {
      expect(img?.classList.contains(padded)).toBe(false);
    }
  });

  it("exposes the Vietnamese add-to-cart tooltip on the quick add button", () => {
    const { container } = render(
      <MemoryRouter>
        <LocaleProvider>
          <ProductCard product={product} />
        </LocaleProvider>
      </MemoryRouter>,
    );
    const button = container.querySelector("article button[title]");
    expect(button?.getAttribute("title")).toBe("Thêm vào giỏ hàng");
  });

  it("renders footer shop links that land on real routes", () => {
    render(
      <MemoryRouter initialEntries={["/products"]}>
        <LocaleProvider>
          <Routes>
            <Route path="*" element={<StoreFooter />} />
          </Routes>
        </LocaleProvider>
      </MemoryRouter>,
    );
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    for (const name of ["Tất cả sản phẩm", "Giỏ hàng", "Tài khoản của tôi", "Đăng nhập"]) {
      expect(screen.getByRole("link", { name })).toBeInTheDocument();
    }
  });
});

describe("storefront translator (Vietnamese only)", () => {
  afterEach(() => cleanup());

  it("translates shared keys with interpolation", () => {
    expect(translator("nav.cart")).toBe("Giỏ hàng");
    expect(translator("product.addProductToCart", { name: "Rau" })).toBe(
      "Thêm Rau vào giỏ hàng",
    );
  });

  it("falls back to the key for unknown translations", () => {
    expect(translator("unknown.key")).toBe("unknown.key");
  });

  it("exposes Vietnamese-only text through the locale context", () => {
    render(
      <LocaleProvider>
        <Probe />
      </LocaleProvider>,
    );
    expect(screen.getByTestId("probe-text")).toHaveTextContent("Giỏ hàng");
  });
});
