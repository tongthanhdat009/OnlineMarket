import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ImageOff, Minus, Plus, Search, ShoppingCart, Sparkles, Trash2, X, Check, ChevronRight } from "lucide-react";
import { useLocale } from "../app/providers";
import {
  categoryName,
  productInStock,
  productName,
  type CartLine,
  type Category,
  type Product,
} from "../app/types";
import { translator } from "../lib/translator";

const t = translator;

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "soft" | "outline" | "ghost" | "danger";
}) {
  const styles = {
    primary:
      "bg-leaf text-white shadow-sm hover:bg-leaf-dark disabled:bg-gray-300",
    soft: "bg-leaf-soft text-leaf-dark hover:bg-[#d9efdf] disabled:bg-gray-100",
    outline:
      "border border-line bg-white text-ink hover:border-leaf hover:text-leaf disabled:bg-gray-50",
    ghost: "text-muted hover:bg-gray-100 hover:text-ink disabled:text-gray-300",
    danger: "bg-red-50 text-danger hover:bg-red-100 disabled:bg-gray-50",
  }[variant];
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${styles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Money({
  value,
  className = "",
}: {
  value?: number | null;
  className?: string;
}) {
  return (
    <span className={className}>
      {new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
      }).format(value ?? 0)}
    </span>
  );
}

export function ProductImage({
  product,
  className = "",
  fit = "contain",
}: {
  product: Product;
  className?: string;
  fit?: "contain" | "cover";
}) {
  const [failed, setFailed] = useState(false);
  if (!product.ImageUrl || failed)
    return (
      <div
        className={`flex items-center justify-center bg-[#eef4ef] text-[#a2b5a5] ${className}`}
      >
        <ImageOff size={28} strokeWidth={1.5} />
      </div>
    );
  return (
    <img
      src={product.ImageUrl}
      alt={productName(product)}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`${fit === "cover" ? "object-cover" : "object-contain"} ${className}`}
    />
  );
}

export function QuantityControl({
  value,
  min = 1,
  max,
  onChange,
  disabled = false,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="inline-flex h-10 items-center rounded-xl border border-line bg-white">
      <button
        aria-label={t("common.decrease")}
        disabled={disabled || value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex h-full w-10 items-center justify-center text-muted hover:text-leaf disabled:opacity-35"
      >
        <Minus size={15} />
      </button>
      <span
        className="min-w-8 text-center text-sm font-bold text-ink"
        aria-live="polite"
      >
        {value}
      </span>
      <button
        aria-label={t("common.increase")}
        disabled={disabled || (max !== undefined && value >= max)}
        onClick={() =>
          onChange(max === undefined ? value + 1 : Math.min(max, value + 1))
        }
        className="flex h-full w-10 items-center justify-center text-muted hover:text-leaf disabled:opacity-35"
      >
        <Plus size={15} />
      </button>
    </div>
  );
}

export function ProductCard({
  product,
  quantity = 0,
  onAdd,
  onUpdate,
  compact = false,
}: {
  product: Product;
  quantity?: number;
  onAdd?: (product: Product) => void;
  onUpdate?: (product: Product, quantity: number) => void;
  compact?: boolean;
}) {
  const inStock = productInStock(product);
  return (
    <article
      className={`group relative flex min-w-0 flex-col overflow-hidden rounded-2xl bg-white card-border transition hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(32,62,42,.1)] ${compact ? "" : "p-2.5 sm:p-3"}`}
    >
      <Link
        to={`/products/${product.ProductId}`}
        className="block overflow-hidden rounded-xl bg-[#f2f6f2]"
        aria-label={t("catalog.viewProduct", { name: productName(product) })}
      >
        <ProductImage
          product={product}
          fit="cover"
          className="aspect-square h-full w-full transition duration-300 group-hover:scale-105"
        />
      </Link>
      <div className="flex flex-1 flex-col px-1.5 pb-1.5 pt-3 sm:px-1 sm:pt-3">
        <div className="mb-1 line-clamp-1 text-xs font-medium text-muted">
          {product.Category
            ? categoryName(product.Category)
            : t("catalog.everydayEssential")}
        </div>
        <Link
          to={`/products/${product.ProductId}`}
          className="line-clamp-2 min-h-10 text-sm font-bold leading-5 text-ink hover:text-leaf"
        >
          {productName(product)}
        </Link>
        <div className="mt-auto pt-3">
          <Money
            value={product.Price}
            className="text-base font-extrabold text-leaf-dark sm:text-lg"
          />
        </div>
        <div className="mt-2.5 flex items-center justify-between gap-2">
          <span
            className={`text-[11px] font-semibold ${inStock ? "text-leaf" : "text-danger"}`}
          >
            {inStock
              ? `${product.Quantity} ${product.Unit ?? t("product.unitFallback")}`
              : t("catalog.outOfStock")}
          </span>
          {quantity > 0 && onUpdate ? (
            <QuantityControl
              value={quantity}
              max={product.Quantity ?? undefined}
              onChange={(next) => onUpdate(product, next)}
            />
          ) : (
            <button
              title={t("product.addToCart")}
              aria-label={t("product.addProductToCart", { name: productName(product) })}
              disabled={!inStock || !onAdd}
              onClick={() => onAdd?.(product)}
              className="group/btn relative flex h-9 w-9 items-center justify-center rounded-xl bg-leaf-soft text-leaf-dark transition hover:bg-leaf hover:text-white disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
            >
              <Plus size={18} strokeWidth={2.5} />
              <span className="pointer-events-none absolute -top-9 right-0 z-10 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition duration-150 group-hover/btn:opacity-100">
                {t("product.addToCart")}
              </span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export function ProductSkeleton() {
  return (
    <div className="rounded-2xl bg-white p-3 card-border">
      <div className="skeleton aspect-square rounded-xl" />
      <div className="mt-4 h-3 w-20 rounded skeleton" />
      <div className="mt-2 h-4 w-4/5 rounded skeleton" />
      <div className="mt-4 h-5 w-24 rounded skeleton" />
    </div>
  );
}

export function ProductGrid({
  products,
  cartQuantities,
  onAdd,
  onUpdate,
}: {
  products: Product[];
  cartQuantities?: Map<number, number>;
  onAdd?: (product: Product) => void;
  onUpdate?: (product: Product, quantity: number) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.ProductId}
          product={product}
          quantity={cartQuantities?.get(product.ProductId) ?? 0}
          onAdd={onAdd}
          onUpdate={onUpdate}
        />
      ))}
    </div>
  );
}

export function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.();
      }}
      className="relative flex items-center"
    >
      <Search
        size={18}
        className="pointer-events-none absolute left-4 text-muted"
      />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder ?? t("search.placeholder")}
        aria-label={t("search.label")}
        className="h-12 w-full rounded-2xl border border-line bg-[#f7faf7] pl-11 pr-4 text-sm text-ink outline-none transition placeholder:text-[#9aa99d] focus:border-leaf focus:bg-white focus:ring-4 focus:ring-[#e3f2e7]"
      />
    </form>
  );
}

export function CategoryPills({
  categories,
  selected,
  onSelect,
}: {
  categories: Category[];
  selected?: number;
  onSelect: (id?: number) => void;
}) {
  return (
    <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
      <button
        onClick={() => onSelect(undefined)}
        className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${selected === undefined ? "bg-ink text-white" : "bg-white text-muted card-border hover:border-leaf hover:text-leaf"}`}
      >
        {t("nav.allProducts")}
      </button>
      {categories.map((category) => (
        <button
          key={category.CategoryId}
          onClick={() => onSelect(category.CategoryId)}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${selected === category.CategoryId ? "bg-ink text-white" : "bg-white text-muted card-border hover:border-leaf hover:text-leaf"}`}
        >
          {categoryName(category)}
        </button>
      ))}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-1 text-xs font-bold uppercase tracking-[.16em] text-leaf">
            {eyebrow}
          </p>
        )}
        <h2 className="display text-2xl font-extrabold text-ink sm:text-3xl">
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  icon = <ShoppingCart size={28} />,
  title,
  body,
  action,
}: {
  icon?: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-[#cbd9cd] bg-white px-6 py-10 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-leaf-soft text-leaf">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-ink">{title}</h3>
      <p className="mt-1 max-w-sm text-sm leading-6 text-muted">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({
  message = "We could not load this right now.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  const label = message ?? t("catalog.loadError");
  return (
    <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
      <p className="font-semibold text-danger">{label}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="mt-4">
          {t("common.retry")}
        </Button>
      )}
    </div>
  );
}

export function CartLineRow({
  line,
  onUpdate,
  onRemove,
}: {
  line: CartLine;
  onUpdate: (quantity: number) => void;
  onRemove: () => void;
}) {
  const product = line.Product;
  return (
    <div className="flex gap-3 border-b border-line py-4 last:border-0">
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#f2f6f2]">
        {product ? (
          <ProductImage product={product} className="h-full w-full p-2" />
        ) : (
          <div className="h-full w-full" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex justify-between gap-2">
          <div>
            <p className="line-clamp-2 text-sm font-bold text-ink">
              {product ? productName(product) : `Product #${line.ProductId}`}
            </p>
            <Money
              value={line.Price}
              className="mt-1 block text-sm font-semibold text-leaf-dark"
            />
          </div>
          <button
            aria-label={t("cart.removeItem")}
            onClick={onRemove}
            className="h-8 w-8 shrink-0 rounded-lg text-muted hover:bg-red-50 hover:text-danger"
          >
            <Trash2 size={16} />
          </button>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <QuantityControl
            value={line.Quantity}
            max={product?.Quantity ?? undefined}
            onChange={onUpdate}
          />
          <Money
            value={line.Subtotal ?? line.Price * line.Quantity}
            className="text-sm font-extrabold text-ink"
          />
        </div>
      </div>
    </div>
  );
}

export function Toast({
  message,
  kind = "success",
  onClose,
}: {
  message: string;
  kind?: "success" | "error" | "info";
  onClose: () => void;
}) {
  const color =
    kind === "error"
      ? "border-red-100 bg-red-50 text-danger"
      : kind === "info"
        ? "border-blue-100 bg-blue-50 text-blue-700"
        : "border-[#bde0c6] bg-[#f0fbf3] text-leaf-dark";
  return (
    <div
      role="status"
      className={`flex max-w-sm items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-lg ${color}`}
    >
      <Check size={17} />
      <span className="flex-1">{message}</span>
      <button aria-label={t("common.dismiss")} onClick={onClose}>
        <X size={16} />
      </button>
    </div>
  );
}

export function AiButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-4 z-30 flex items-center gap-2 rounded-full bg-ink px-4 py-3 text-sm font-bold text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-leaf md:bottom-6 md:right-6"
    >
      <Sparkles size={17} className="text-citrus" /> {t("nav.askAi")}
    </button>
  );
}

export function LinkArrow({
  to,
  children,
}: {
  to: string;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1 text-sm font-bold text-leaf hover:text-leaf-dark"
    >
      {children}
      <ChevronRight size={16} />
    </Link>
  );
}
