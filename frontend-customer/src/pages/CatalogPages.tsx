import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Clock3, Leaf, ShieldCheck, Truck, Utensils, ArrowRight } from "lucide-react";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api";
import { useAuth, useCart, useToast } from "../app/providers";
import { productInStock, productName } from "../app/types";
import { useCatalog, useCategories, useDebouncedValue, useProduct } from "../hooks";
import {
  Button,
  EmptyState,
  ErrorState,
  LinkArrow,
  Money,
  ProductGrid,
  ProductImage,
  ProductSkeleton,
  SectionHeading,
} from "../components/store-ui";
import { formatMoney } from "../lib";
import { translator } from "../lib/translator";

const t = translator;

export function HomePage() {
  const { data: products = [], isLoading, isError, refetch } = useCatalog();
  const { data: categories = [] } = useCategories();
  const { add, quantities, update } = useCart();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const available = useMemo(() => products.filter(productInStock), [products]);
  const categorySections = categories
    .map((category) => ({
      category,
      products: products
        .filter(
          (product) =>
            product.CategoryId === category.CategoryId &&
            productInStock(product),
        )
        .slice(0, 4),
    }))
    .filter((section) => section.products.length);
  const quickAdd = (product: (typeof products)[number]) => {
    if (!isAuthenticated) {
      showToast(t("catalog.signInToAdd"), "info");
      navigate("/login?returnUrl=%2F");
      return;
    }
    void add({ ProductId: product.ProductId, Quantity: 1 });
  };
  return (
    <div className="animate-float-in space-y-12">
      <section className="relative overflow-hidden rounded-[2rem] bg-[#dff1e3] px-6 py-10 sm:px-10 sm:py-14 lg:px-16">
        <div className="relative z-10 max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-xs font-bold text-leaf-dark">
            <Leaf size={14} /> {t("home.heroBadge")}
          </span>
          <h1 className="display mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight text-[#163a23] sm:text-5xl lg:text-6xl">
            {" "}
            {t("home.heroTitleA")}
            <br />
            <span className="text-leaf"> {t("home.heroTitleB")}</span>
          </h1>
          <p className="mt-4 max-w-md text-base leading-7 text-[#477254]">
            {" "}
            {t("home.heroBody")}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button onClick={() => navigate("/products")}>
              {" "}
              {t("home.shopAll")} <ArrowRight size={17} />
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/search?q=healthy")}
            >
              {" "}
              {t("home.findHealthy")}
            </Button>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-12 -top-20 h-72 w-72 rounded-full bg-[#c4e7ca] opacity-80" />
        <div className="pointer-events-none absolute -bottom-24 right-10 h-64 w-64 rounded-full bg-[#f7d995] opacity-80" />
        <div className="absolute bottom-0 right-6 hidden w-72 text-[10rem] leading-none lg:block">
          🥬
        </div>
      </section>
      <section className="grid gap-3 sm:grid-cols-3">
        <ValuePill
          icon={<Truck size={20} />}
          title={t("home.fastDelivery")}
          body={t("home.fastDeliveryBody")}
        />
        <ValuePill
          icon={<ShieldCheck size={20} />}
          title={t("home.qualityChecked")}
          body={t("home.qualityBody")}
        />
        <ValuePill
          icon={<Clock3 size={20} />}
          title={t("home.easyCheckout")}
          body={t("home.easyCheckoutBody")}
        />
      </section>
      <section>
        <SectionHeading
          eyebrow={t("home.explore")}
          title={t("home.shopByCategory")}
          action={<LinkArrow to="/products"> {t("home.viewAll")}</LinkArrow>}
        />
        <div className="hide-scrollbar flex gap-3 overflow-x-auto pb-2">
          {categories.slice(0, 8).map((category, index) => (
            <Link
              key={category.CategoryId}
              to={`/category/${category.CategoryId}`}
              className="group min-w-[116px] rounded-2xl border border-line bg-white p-4 text-center transition hover:-translate-y-1 hover:border-leaf hover:shadow-sm sm:min-w-0 sm:flex-1"
            >
              <span
                className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-2xl ${["bg-[#fff3d7]", "bg-[#e2f4e6]", "bg-[#e9e5fb]", "bg-[#fde5e2]"][index % 4]}`}
              >
                {["🥤", "🍜", "🧼", "🍪", "🥦", "🧴"][index % 6]}
              </span>
              <span className="mt-3 block truncate text-sm font-bold text-ink group-hover:text-leaf">
                {category.CategoryName}
              </span>
            </Link>
          ))}
        </div>
      </section>
      <section>
        <SectionHeading
          eyebrow={t("home.availableNow")}
          title={t("home.goodStuff")}
          action={
            <LinkArrow to="/products"> {t("home.seeEverything")}</LinkArrow>
          }
        />
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <ProductSkeleton key={index} />
            ))}
          </div>
        ) : isError ? (
          <ErrorState onRetry={() => void refetch()} />
        ) : available.length ? (
          <ProductGrid
            products={available.slice(0, 8)}
            cartQuantities={quantities}
            onAdd={quickAdd}
            onUpdate={(product, quantity) =>
              void update(product.ProductId, { Quantity: quantity })
            }
          />
        ) : (
          <EmptyState
            icon={<Utensils />}
            title={t("catalog.emptyTitle")}
            body={t("catalog.emptyBody")}
            action={
              <Button onClick={() => navigate("/products")}>
                {t("catalog.browseCatalog")}
              </Button>
            }
          />
        )}
      </section>
      {categorySections
        .slice(0, 2)
        .map(({ category, products: sectionProducts }) => (
          <section key={category.CategoryId}>
            <SectionHeading
              eyebrow={t("home.forKitchen")}
              title={category.CategoryName}
              action={
                <LinkArrow to={`/category/${category.CategoryId}`}>
                  {" "}
                  {t("home.viewCategory")}
                </LinkArrow>
              }
            />
            <ProductGrid
              products={sectionProducts}
              cartQuantities={quantities}
              onAdd={quickAdd}
              onUpdate={(product, quantity) =>
                void update(product.ProductId, { Quantity: quantity })
              }
            />
          </section>
        ))}
    </div>
  );
}

function ValuePill({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-leaf-soft text-leaf">
        {icon}
      </span>
      <div>
        <p className="text-sm font-bold text-ink">{title}</p>
        <p className="text-xs text-muted">{body}</p>
      </div>
    </div>
  );
}

export function ProductsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const query = new URLSearchParams(location.search);
  const initialSearch = query.get("q") ?? "";
  const [search, setSearch] = useState(initialSearch);
  const [categoryId, setCategoryId] = useState<number | undefined>(
    params.id ? Number(params.id) : undefined,
  );
  const [priceRange, setPriceRange] = useState<[number | null, number | null]>([null, null]);
  const [unit, setUnit] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search, 220);
  const { data: products = [], isLoading, isError, refetch } = useCatalog({ keyword: debouncedSearch, categoryId });
  const { quantities, update } = useCart();
  const [priceUnit] = useState<string | null>(null);
  const filterOptions = useMemo(() => {
    const unitSet = new Set<string>();
    products.forEach((product) => {
      if (product.Unit) unitSet.add(product.Unit);
    });
    return { units: Array.from(unitSet).sort() };
  }, [products]);
  const filteredProducts = useMemo(() => {
    let list = products;
    if (categoryId) list = list.filter((product) => product.CategoryId === categoryId);
    if (priceRange[0] != null) list = list.filter((product) => (product.Price ?? 0) >= priceRange[0]!);
    if (priceRange[1] != null) list = list.filter((product) => (product.Price ?? 0) <= priceRange[1]!);
    if (unit) list = list.filter((product) => (product.Unit ?? "").toLowerCase() === unit.toLowerCase());
    return list;
  }, [products, categoryId, priceRange, unit]);
  const activeFilterCount = [categoryId, priceRange[0], priceRange[1], unit].filter(Boolean).length;
  const maxPrice = Math.max(0, ...products.map((p) => p.Price ?? 0), 1000000);
  const { add } = useCart();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const addProduct = (product: (typeof products)[number]) => {
    if (!isAuthenticated) {
      showToast(t("catalog.signInToAdd"), "info");
      navigate("/login?returnUrl=%2F");
      return;
    }
    void add({ ProductId: product.ProductId, Quantity: 1 });
  };
  const clearAllFilters = () => {
    setSearch("");
    setCategoryId(undefined);
    setPriceRange([null, null]);
    setUnit(null);
  };
  return (
    <div className="animate-float-in">
      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="h-fit space-y-5 rounded-2xl border border-line bg-white p-4 sm:p-5 lg:sticky lg:top-32">
          {activeFilterCount > 0 && (
            <button onClick={clearAllFilters} className="w-full rounded-xl px-4 py-2 text-sm font-semibold text-muted transition hover:text-danger">
              {t("catalog.clearFilters")}
            </button>
          )}
          <div className="rounded-xl border border-line bg-[#fbfdfb] p-4">
            <p className="mb-3 text-sm font-bold text-ink">{t("product.unit")}</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setUnit(null)} className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${unit === null ? "bg-ink text-white" : "border border-line bg-white text-muted hover:border-leaf hover:text-leaf"}`}>Tất cả</button>
                {filterOptions.units.map((u) => (<button key={u} onClick={() => setUnit(u)} className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${unit === u ? "bg-ink text-white" : "border border-line bg-white text-muted hover:border-leaf hover:text-leaf"}`}>{u}</button>))}
              </div>
            </div>
            <div className="rounded-xl border border-line bg-[#fbfdfb] p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-ink">{t("catalog.priceRange")}</p>
                {priceRange[0] != null && (
                  <button onClick={() => setPriceRange([null, priceRange[1]])} className="text-xs font-semibold text-muted hover:text-danger">
                    {t("catalog.clearFilters")}
                  </button>
                )}
              </div>
              <div className="mb-1 flex items-center justify-between text-sm font-semibold text-leaf-dark">
                <span>{formatMoney(priceRange[0] ?? 0)}</span>
                <span>{formatMoney(priceRange[1] ?? maxPrice)}</span>
              </div>
              <input type="range" aria-label="Giá tối thiểu" min={0} max={maxPrice} step={10000} value={priceRange[0] ?? 0} onChange={(e) => setPriceRange([Math.min(Number(e.target.value), priceRange[1] ?? maxPrice), priceRange[1]])} className="w-full accent-leaf" />
              <input type="range" aria-label="Giá tối đa" min={0} max={maxPrice} step={10000} value={priceRange[1] ?? maxPrice} onChange={(e) => setPriceRange([priceRange[0], Math.max(Number(e.target.value), priceRange[0] ?? 0)])} className="w-full accent-leaf" />
            </div>
        </aside>
        <section className="min-w-0">
        {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <ProductSkeleton key={index} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : filteredProducts.length ? (
        <ProductGrid products={filteredProducts} cartQuantities={quantities} onAdd={addProduct} onUpdate={(product, quantity) => void update(product.ProductId, { Quantity: quantity })} />
      ) : (
        <EmptyState icon={<Utensils />} title={t("catalog.noProducts")} body={t("catalog.noProductsBody")} action={<Button onClick={() => { setSearch(""); setCategoryId(undefined); setPriceRange([null, null]); setUnit(null); }}>{t("catalog.clearFilters")}</Button>} />
        )}
        </section>
      </div>
    </div>
  );
}
