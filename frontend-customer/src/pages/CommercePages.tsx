import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, FormEvent, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Check, CreditCard, ShieldCheck, Truck, XCircle, RefreshCw, ShoppingCart, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { apiClient } from "../api";
import { useAuth, useCart, useToast } from "../app/providers";
import { errorMessage, formatMoney } from "../lib";
import { useOrders, useOrder } from "../hooks";
import { productInStock, productName, supplierName } from "../app/types";
import { useProduct } from "../hooks";
import { Button, Money, ProductGrid, ProductImage, QuantityControl, SectionHeading, EmptyState, ErrorState, CartLineRow } from "../components/store-ui";
import { translator } from "../lib/translator";


const t = translator;

function ErrorStateWithRetry({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
      <p className="font-semibold text-danger">{message ?? t("catalog.loadError")}</p>
      {onRetry && <Button variant="outline" onClick={onRetry} className="mt-4">{t("common.retry")}</Button>}
    </div>
  );
}

export function ProductDetailPage() {
  const { id } = useParams() as { id?: string };
  const productId = Number(id);
  const navigate = useNavigate();
  const { data: product, isLoading: productLoading, isError: productError, refetch: refetchProduct } = useProduct(productId);
  const relatedQuery = useQuery({
    queryKey: ["related-products", productId],
    queryFn: () => apiClient.products.list(),
    staleTime: 60_000,
  });
  const relatedProducts = useMemo(
    () =>
      relatedQuery.data
        ?.filter(
          (p) =>
            p.ProductId !== productId &&
            (p.CategoryId ?? 0) === (product?.CategoryId ?? 0),
        )
        .slice(0, 4) ?? [],
    [relatedQuery.data, product?.CategoryId, productId],
  );
  const { items, add, update } = useCart();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const cartItem = items.find((item) => item.ProductId === productId);
  const addToCart = async (quantity: number) => {
    if (!isAuthenticated) {
      showToast(t("catalog.signInToAdd"), "info");
      window.location.href = "/login?returnUrl=" + encodeURIComponent(`/products/${productId}`);
      return;
    }
    try {
      await add({ ProductId: productId, Quantity: quantity });
      showToast(t("product.addProductToCart", { name: product ? productName(product) : "" }));
    } catch {
      showToast(t("catalog.loadError"), "error");
    }
  };
  if (productLoading) return <div className="skeleton h-96 rounded-3xl" />;
  if (productError || !product) return <ErrorStateWithRetry message={t("catalog.notFound")} onRetry={() => void refetchProduct()} />;
  return (
    <div className="animate-float-in space-y-6">
      <Link to="/products" className="inline-flex items-center gap-1 text-sm font-bold text-leaf hover:text-leaf-dark">
        <ChevronLeft size={16} /> {t("catalog.backToShopping")}
      </Link>
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <ProductImage product={product} className="w-full" fit="cover" />
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[.16em] text-leaf">{product.Category ? product.Category.CategoryName : t("catalog.categoryFallback")}</p>
            <h1 className="display text-3xl font-extrabold text-ink sm:text-4xl">{productName(product)}</h1>
            <Money value={product.Price} className="mt-2 text-2xl font-extrabold text-leaf-dark" />
          </div>
          <p className="text-sm text-muted">{supplierName(product)}</p>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs text-muted">{t("product.barcode")}</dt>
              <dd className="font-semibold text-ink">{product.Barcode ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">{t("product.unit")}</dt>
              <dd className="font-semibold text-ink">{product.Unit ?? t("product.unitFallback")}</dd>
            </div>
          </dl>
          <p className="text-sm text-muted">{t("product.supplier")}: {product.Supplier?.Name ?? "—"}</p>
          <div className="rounded-2xl border border-[var(--color-line)] bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <span className={`text-xs font-semibold ${productInStock(product) ? "text-leaf" : "text-danger"}`}>
                {productInStock(product) ? `${t("product.inStock")}: ${product.Quantity ?? 0}` : t("product.outOfStock")}
              </span>
              {cartItem ? (
                <QuantityControl value={cartItem.Quantity} max={product.Quantity ?? undefined} onChange={(next) => void update(productId, { Quantity: next })} />
              ) : (
                <Button onClick={() => void addToCart(1)} disabled={!productInStock(product)} className="h-12 px-5">
                  {productInStock(product) ? t("product.addToCart") : t("product.outOfStock")}
                </Button>
              )}
            </div>
            {cartItem && (
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-muted">{t("cart.subtotal")}:</span>
                <Money value={cartItem.Subtotal ?? cartItem.Price * cartItem.Quantity} className="font-extrabold text-ink" />
              </div>
            )}
          </div>
          <Button variant="outline" onClick={() => void addToCart(1)} disabled={!productInStock(product)} className="w-full">
            {t("product.buyNow")}
          </Button>
        </div>
      </div>
      {relatedProducts.length > 0 ? (
        <section>
          <SectionHeading eyebrow={t("product.relatedEyebrow")} title={t("product.related")} action={<Link to={`/category/${product.CategoryId}`} className="inline-flex items-center gap-1 text-sm font-bold text-leaf hover:text-leaf-dark">{t("home.viewAll")}</Link>} />
          {relatedQuery.isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="skeleton aspect-square rounded-xl" />
              ))}
            </div>
          ) : (
            <ProductGrid
              products={relatedProducts}
              cartQuantities={new Map(items.map((item) => [item.ProductId, item.Quantity]))}
              onAdd={() => void addToCart(1)}
            />
          )}
        </section>
      ) : null}
    </div>
  );
}

export function CartPage() {
  const navigate = useNavigate();
  const { items, total, isLoading, clear, remove, update } = useCart();
  const { showToast } = useToast();
  return (
    <div className="animate-float-in space-y-6">
      <h1 className="display text-3xl font-extrabold text-ink">{t("cart.title")}</h1>
      {isLoading ? (
        <div className="skeleton h-64 rounded-3xl" />
      ) : items.length === 0 ? (
        <EmptyState icon={<ShoppingCart size={28} />} title={t("cart.empty")} body={t("cart.emptyBody")} action={<Button onClick={() => navigate("/products")}>{t("cart.startShopping")}</Button>} />
      ) : (
        <div className="space-y-4">
          {items.map((line) => (
            <CartLineRow key={line.CartItemId ?? line.ProductId} line={line} onUpdate={(quantity) => void update(line.ProductId, { Quantity: quantity })} onRemove={() => void remove(line.ProductId)} />
          ))}
          <div className="rounded-2xl border border-line bg-white p-4 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-muted">{t("cart.subtotal")}</span><Money value={total} /></div>
            <div className="flex justify-between text-sm"><span className="text-muted">{t("cart.delivery")}</span><span className="text-muted">{t("cart.free")}</span></div>
            <div className="flex justify-between text-lg font-extrabold text-ink"><span>{t("cart.total")}</span><Money value={total} /></div>
            <Button onClick={() => navigate("/checkout")} className="w-full h-12">{t("cart.checkout")}</Button>
            <button onClick={() => { void clear(); showToast(t("cart.empty")); }} className="text-sm text-muted hover:text-danger">{t("cart.clearCart")}</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function CheckoutPage() {
  const { items, total, refresh } = useCart();
  const { customer } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: customer?.Name ?? "",
    phone: customer?.Phone ?? "",
    email: customer?.Email ?? "",
    address: customer?.Address ?? "",
    promo: "",
    payment: "cash",
  });
  const [promo, setPromo] = useState<{ id?: number; discount: number; code: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [validation, setValidation] = useState<{ errors: string[]; out: string[]; deleted: string[]; prices: string[] } | null>(null);
  const subtotal = total;
  const discount = promo?.discount ?? 0;
  const applyPromo = async () => {
    if (!form.promo.trim()) return;
    try {
      const result = await apiClient.promotions.apply({ PromoCode: form.promo.trim(), TotalAmount: subtotal });
      setPromo({ id: result.PromoId, discount: result.DiscountAmount, code: result.PromoCode });
      showToast(t("checkout.promoApplied", { code: result.PromoCode }));
    } catch (error) {
      setPromo(null);
      showToast(errorMessage(error, t("checkout.promoInvalid")), "error");
    }
  };
  const placeOrder = async (event: FormEvent) => {
    event.preventDefault();
    if (!items.length) {
      navigate("/cart");
      return;
    }
    setBusy(true);
    setValidation(null);
    try {
      const promoCode = promo?.code ?? (form.promo.trim() || null);
      const check = await apiClient.cart.validateCheckout({ PromoCode: promoCode });
      if (!check.IsValid) {
        setValidation({
          errors: check.Errors ?? [],
          out: (check.OutOfStockProducts ?? []).map((item) => `${item.ProductName}: chỉ còn ${item.AvailableQuantity}`),
          deleted: (check.DeletedProducts ?? []).map((item) => item.ProductName),
          prices: (check.PriceChangedProducts ?? []).map((item) => `${item.ProductName}: ${formatMoney(item.CartPrice)} → ${formatMoney(item.CurrentPrice)}`),
        });
        setBusy(false);
        return;
      }
      const order = await apiClient.orders.checkout({
        PromoId: promo?.id ?? null,
        PromoCode: promoCode,
        PaymentMethod: form.payment,
        CustomerName: form.name.trim(),
        CustomerPhone: form.phone.trim(),
        CustomerEmail: form.email.trim(),
        CustomerAddress: form.address.trim(),
        SelectedProductIds: items.map((item) => item.ProductId),
      } as import("../types").CheckoutRequest);
      await refresh();
      if (form.payment === "vnpay") {
        const payment = await apiClient.payment.createVNPay({
          OrderId: order.OrderId,
          Amount: order.TotalAmount ?? subtotal - discount,
          OrderInfo: `Thanh toán đơn hàng #${order.OrderId}`,
          ReturnUrl: `${window.location.origin}/payment-result`,
        });
        if (!payment.Success || !payment.PaymentUrl) throw new Error(payment.Message || t("checkout.orderFailed"));
        window.location.assign(payment.PaymentUrl);
        return;
      }
      navigate(`/payment-result?success=true&orderId=${order.OrderId}&amount=${order.TotalAmount ?? subtotal - discount}`);
    } catch (error) {
      showToast(errorMessage(error, t("checkout.orderFailed")), "error");
    } finally {
      setBusy(false);
    }
  };
  if (!items.length)
    return (
      <EmptyState
        title={t("cart.empty")}
        body={t("cart.emptyGroceries")}
        action={<Button onClick={() => navigate("/products")}>{t("orders.browseProducts")}</Button>}
      />
    );
  return (
    <div className="animate-float-in">
      <form onSubmit={placeOrder} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <section className="rounded-3xl border border-line bg-white p-5 sm:p-7">
            <StepTitle number="1" title={t("checkout.stepDelivery")} />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <CheckoutField label={t("checkout.name")} value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} />
              <CheckoutField label={t("checkout.phone")} value={form.phone} onChange={(value) => setForm((current) => ({ ...current, phone: value }))} />
              <CheckoutField label={t("checkout.email")} type="email" value={form.email} onChange={(value) => setForm((current) => ({ ...current, email: value }))} />
              <CheckoutField label={t("checkout.address")} value={form.address} onChange={(value) => setForm((current) => ({ ...current, address: value }))} className="sm:col-span-2" />
            </div>
          </section>
          <section className="rounded-3xl border border-line bg-white p-5 sm:p-7">
            <StepTitle number="2" title={t("checkout.stepPayment")} />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <PaymentOption value="cash" current={form.payment} onChange={(value) => setForm((current) => ({ ...current, payment: value }))} title={t("checkout.cashTitle")} body={t("checkout.cashBody")} icon={<Truck size={19} />} />
              <PaymentOption value="vnpay" current={form.payment} onChange={(value) => setForm((current) => ({ ...current, payment: value }))} title="VNPay" body={t("checkout.vnpayBody")} icon={<CreditCard size={19} />} />
            </div>
          </section>
          <section className="rounded-3xl border border-line bg-white p-5 sm:p-7">
            <StepTitle number="3" title={t("checkout.stepPromotion")} />
            <div className="mt-5 flex gap-2">
              <input
                value={form.promo}
                onChange={(event) => setForm((current) => ({ ...current, promo: event.target.value }))}
                placeholder={t("cart.promoPlaceholder")}
                className="h-11 min-w-0 flex-1 rounded-xl border border-line px-3 text-sm outline-none focus:border-leaf focus:ring-4 focus:ring-[#e3f2e7]"
              />
              <Button type="button" variant="outline" onClick={() => void applyPromo()}>
                {t("cart.apply")}
              </Button>
            </div>
            {promo && (
              <div className="mt-3 flex items-center justify-between rounded-xl bg-leaf-soft px-3 py-2 text-sm font-semibold text-leaf-dark">
                <span>✓ {promo.code} · Bạn tiết kiệm <Money value={promo.discount} /></span>
                <button type="button" onClick={() => setPromo(null)} aria-label={t("cart.removePromotion")}>
                  <XCircle size={16} />
                </button>
              </div>
            )}
          </section>
          {validation && <ValidationNotice validation={validation} />}
        </div>
        <div className="space-y-4">
          <div className="rounded-3xl border border-line bg-white p-5">
            <h2 className="display text-lg font-extrabold text-ink">{t("checkout.orderSummary")}</h2>
            <div className="mt-4 space-y-2">
              {items.map((line) => (
                <div key={line.CartItemId ?? line.ProductId} className="flex justify-between gap-3 text-sm">
                  <span className="min-w-0 flex-1 truncate text-muted">{line.Product ? productName(line.Product) : `Sản phẩm #${line.ProductId}`} × {line.Quantity}</span>
                  <Money value={line.Subtotal ?? line.Price * line.Quantity} className="font-semibold text-ink" />
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
              <div className="flex justify-between text-muted"><span>{t("cart.subtotal")}</span><Money value={subtotal} /></div>
              {discount > 0 && <div className="flex justify-between text-leaf"><span>{t("cart.discount")}</span><span>-<Money value={discount} /></span></div>}
              <div className="flex justify-between text-base font-extrabold text-ink"><span>{t("cart.total")}</span><Money value={subtotal - discount} /></div>
            </div>
          </div>
          <Button disabled={busy} className="h-12 w-full">
            {busy ? t("checkout.placing") : t("checkout.placeOrder")} <ChevronRight size={17} />
          </Button>
          <p className="flex items-start gap-2 px-2 text-xs leading-5 text-muted">
            <ShieldCheck size={15} className="mt-0.5 shrink-0 text-leaf" /> {t("checkout.detailsSecure")}
          </p>
        </div>
      </form>
    </div>
  );
}

function StepTitle({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-sm font-bold text-white">{number}</span>
      <h2 className="display text-xl font-extrabold text-ink">{title}</h2>
    </div>
  );
}

function PaymentOption({ value, current, onChange, title, body, icon }: { value: string; current: string; onChange: (value: string) => void; title: string; body: string; icon: ReactNode }) {
  return (
    <label className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition ${current === value ? "border-leaf bg-leaf-soft" : "border-line hover:border-leaf/50"}`}>
      <input type="radio" name="payment" checked={current === value} onChange={() => onChange(value)} className="accent-[#247448]" />
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-leaf">{icon}</span>
      <span>
        <span className="block text-sm font-bold text-ink">{title}</span>
        <span className="block text-xs text-muted">{body}</span>
      </span>
    </label>
  );
}

function ValidationNotice({ validation }: { validation: { errors: string[]; out: string[]; deleted: string[]; prices: string[] } }) {
  return (
    <div className="rounded-2xl border border-[#f1d69d] bg-[#fff9e9] p-4 text-sm">
      <p className="font-bold text-warning">{t("checkout.reviewBody")}</p>
      {validation.out.map((item) => <p key={item} className="mt-2 text-warning">⚠ Hàng đã thay đổi: {item}</p>)}
      {validation.deleted.map((item) => <p key={item} className="mt-2 text-danger">Sản phẩm không còn bán: {item}</p>)}
      {validation.prices.map((item) => <p key={item} className="mt-2 text-warning">Giá đã cập nhật: {item}</p>)}
      {validation.errors.map((item) => <p key={item} className="mt-2 text-muted">{item}</p>)}
    </div>
  );
}

function CheckoutField({ label, type = "text", value, onChange, className = "" }: { label: string; type?: string; value: string; onChange: (value: string) => void; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-semibold text-ink">{label}</span>
      <input required type={type} value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-xl border border-line px-3 text-sm outline-none focus:border-leaf focus:ring-4 focus:ring-[#e3f2e7]" />
    </label>
  );
}

export function OrdersPage() {
  const { data, isLoading, isError, refetch } = useOrders();
  const orders = data?.Items ?? [];
  const [selectedOrder, setSelectedOrder] = useState<number | null>(null);
  const orderQuery = useOrder(selectedOrder ?? undefined);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const cancelOrder = async () => {
    if (!selectedOrder) return;
    try {
      await apiClient.orders.cancel(selectedOrder);
      showToast(t("orders.orderCanceled"));
      setSelectedOrder(null);
      await refetch();
    } catch {
      showToast(t("orders.cannotCancel"), "error");
    }
  };
  if (isLoading) return <div className="skeleton h-64 rounded-3xl" />;
  if (isError) return <ErrorStateWithRetry onRetry={() => void refetch()} />;
  return (
    <div className="animate-float-in space-y-6">
      <h1 className="display text-3xl font-extrabold text-ink">{t("orders.title")}</h1>
      {orders.length === 0 ? (
        <EmptyState icon={<ShoppingCart size={28} />} title={t("orders.noOrders")} body={t("orders.noOrdersBody")} action={<Button onClick={() => navigate("/products")}>{t("orders.browseProducts")}</Button>} />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.OrderId} className="rounded-2xl border border-line bg-white p-4">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <p className="font-bold text-ink">{t("orders.order")} #{order.OrderId}</p>
                  <p className="text-xs text-muted">{t("orders.placed", { date: new Date(order.OrderDate ?? "").toLocaleDateString("vi-VN") })}</p>
                  <p className="text-xs text-muted">{order.OrderStatus}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setSelectedOrder(order.OrderId)} className="text-xs">{t("orders.orderDetails")}</Button>
                  <Button variant="danger" onClick={cancelOrder} disabled={order.OrderStatus !== "Pending" && order.OrderStatus !== "Paid"} className="text-xs">{t("orders.cancelOrder")}</Button>
                </div>
              </div>
              {selectedOrder === order.OrderId && (
                <div className="mt-4 space-y-2">
                  {orderQuery.data?.OrderItems.map((item) => (
                    <div key={item.OrderItemId} className="flex justify-between text-sm">
                      <span>{item.Product ? productName(item.Product) : `Sản phẩm #${item.ProductId}`} × {item.Quantity}</span>
                      <Money value={item.Price * item.Quantity} />
                    </div>
                  ))}
                  <div className="flex justify-between text-lg font-bold text-ink">
                    <span>{t("cart.total")}</span>
                    <Money value={order.TotalAmount ?? 0} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function OrderDetailPage() {
  const { id } = useParams() as { id?: string };
  const orderId = Number(id);
  const { data: order, isLoading: orderLoading, isError: orderError, refetch: refetchOrder } = useOrder(orderId);
  const { data: orderItems = [], isLoading: itemsLoading, isError: itemsError, refetch: refetchItems } = useQuery({
    queryKey: ["order-items", orderId],
    queryFn: () => apiClient.orders.items(orderId),
    staleTime: 30_000,
    enabled: Number.isInteger(orderId) && orderId > 0,
  });
  const navigate = useNavigate();
  const { showToast } = useToast();
  const refund = async () => {
    try {
      await apiClient.refunds.create({ OrderId: orderId, Reason: "Yêu cầu hoàn tiền", RefundAmount: order?.TotalAmount ?? 0 });
      showToast(t("refund.submitted"));
      navigate("/account/refunds");
    } catch {
      showToast(t("refund.submitFailed"), "error");
    }
  };
  if (orderLoading || itemsLoading) return <div className="skeleton h-96 rounded-3xl" />;
  if (orderError || itemsError) return <ErrorStateWithRetry message={t("orders.notFound")} onRetry={() => { void refetchOrder(); void refetchItems(); }} />;
  if (!order) return null;
  return (
    <div className="animate-float-in space-y-6">
      <Link to="/account/orders" className="inline-flex items-center gap-1 text-sm font-bold text-leaf hover:text-leaf-dark"><ChevronLeft size={16} /> {t("orders.backToOrders")}</Link>
      <h1 className="display text-3xl font-extrabold text-ink">{t("orders.orderDetails")} #{orderId}</h1>
      <dl className="rounded-2xl border border-line bg-white p-4 grid gap-2 text-sm">
        <div className="flex justify-between"><dt className="text-muted">{t("orders.orderProgress")}</dt><dd className="font-bold text-ink">{order.OrderStatus ?? "—"}</dd></div>
        <div className="flex justify-between"><dt className="text-muted">{t("checkout.deliveryAddress")}</dt><dd>{order.Address ?? "—"}</dd></div>
        <div className="flex justify-between"><dt className="text-muted">{t("cart.total")}</dt><dd className="font-extrabold text-ink"><Money value={order.TotalAmount ?? 0} /></dd></div>
      </dl>
      <div className="rounded-2xl border border-line bg-white p-4">
        <h2 className="mb-3 text-lg font-bold text-ink">{t("checkout.items")}</h2>
        {orderItems.map((item) => (
          <div key={item.OrderItemId} className="flex justify-between gap-3 rounded-xl border border-line bg-[#f7faf7] p-3">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ink">{item.Product ? productName(item.Product) : `Sản phẩm #${item.ProductId}`}</p>
              <p className="text-xs text-muted">{item.Unit ? `${item.Quantity} ${item.Unit}` : ""}</p>
            </div>
            <Money value={item.Price * item.Quantity} className="font-extrabold text-ink" />
          </div>
        ))}
        <div className="mt-3 flex justify-between text-lg font-extrabold text-ink">
          <span>{t("cart.total")}</span>
          <Money value={order.TotalAmount ?? 0} />
        </div>
      </div>
      <Button variant="danger" onClick={refund} disabled={order.OrderStatus !== "Delivered"} className="w-full">
        <RefreshCw size={17} /> {t("orders.requestRefund")}
      </Button>
    </div>
  );
}

export function RefundRequestPage() {
  const { id } = useParams() as { id?: string };
  const orderId = Number(id);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [form, setForm] = useState({ Reason: "", CustomerBankName: "", CustomerBankAccount: "", CustomerAccountHolder: "", RefundAmount: 0 });
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.Reason || !form.CustomerBankName || !form.CustomerBankAccount || !form.CustomerAccountHolder) {
      showToast(t("refund.submitFailed"), "error");
      return;
    }
    setBusy(true);
    try {
      await apiClient.refunds.create({
        OrderId: orderId,
        Reason: form.Reason,
        CustomerBankName: form.CustomerBankName,
        CustomerBankAccount: form.CustomerBankAccount,
        CustomerAccountHolder: form.CustomerAccountHolder,
        RefundAmount: form.RefundAmount,
      } as import("../types").CreateRefundRequest);
      showToast(t("refund.submitted"));
      navigate("/account/refunds");
    } catch {
      showToast(t("refund.submitFailed"), "error");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="animate-float-in space-y-6 max-w-xl">
      <Link to={`/products/${orderId}`} className="inline-flex items-center gap-1 text-sm font-bold text-leaf hover:text-leaf-dark"><ChevronLeft size={16} /> {t("catalog.backToShopping")}</Link>
      <h1 className="display text-3xl font-extrabold text-ink">{t("refund.title")}</h1>
      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-line bg-white p-4">
        <input value={form.RefundAmount} onChange={(e) => setForm((f) => ({ ...f, RefundAmount: Number(e.target.value) }))} type="number" placeholder={t("refund.amount")} className="h-12 w-full rounded-xl border border-line px-3.5 text-sm outline-none focus:border-leaf focus:ring-4 focus:ring-[#e3f2e7]" />
        <input value={form.Reason} onChange={(e) => setForm((f) => ({ ...f, Reason: e.target.value }))} placeholder={t("refund.reason")} className="h-12 w-full rounded-xl border border-line px-3.5 text-sm outline-none focus:border-leaf focus:ring-4 focus:ring-[#e3f2e7]" />
        <div className="grid gap-4 sm:grid-cols-2">
          <input value={form.CustomerBankName} onChange={(e) => setForm((f) => ({ ...f, CustomerBankName: e.target.value }))} placeholder={t("refund.bank")} className="h-12 w-full rounded-xl border border-line px-3.5 text-sm outline-none focus:border-leaf focus:ring-4 focus:ring-[#e3f2e7]" />
          <input value={form.CustomerBankAccount} onChange={(e) => setForm((f) => ({ ...f, CustomerBankAccount: e.target.value }))} placeholder={t("refund.accountNumber")} className="h-12 w-full rounded-xl border border-line px-3.5 text-sm outline-none focus:border-leaf focus:ring-4 focus:ring-[#e3f2e7]" />
        </div>
        <input value={form.CustomerAccountHolder} onChange={(e) => setForm((f) => ({ ...f, CustomerAccountHolder: e.target.value }))} placeholder={t("refund.accountHolder")} className="h-12 w-full rounded-xl border border-line px-3.5 text-sm outline-none focus:border-leaf focus:ring-4 focus:ring-[#e3f2e7]" />
        <Button type="submit" disabled={busy} className="w-full h-12">{busy ? t("refund.submitting") : t("refund.submit")}</Button>
      </form>
    </div>
  );
}

export function PaymentResultPage() {
  const search = new URLSearchParams(location.search);
  const status = search.get("status");
  const success = status === "success" || status === "paid";
  const navigate = useNavigate();
  return (
    <div className="animate-float-in flex min-h-[60vh] items-center justify-center">
      <div className="rounded-3xl border border-line bg-white p-8 text-center shadow-[0_20px_60px_rgba(32,62,42,.08)] sm:p-12">
        <span className={`inline-flex h-16 w-16 items-center justify-center rounded-full ${success ? "bg-leaf-soft text-leaf" : "bg-red-50 text-danger"}`}>
          {success ? <Check size={32} /> : <XCircle size={32} />}
        </span>
        <h1 className="mt-6 display text-3xl font-extrabold text-ink">{success ? t("payment.successTitle") : t("payment.failTitle")}</h1>
        <p className="mt-3 max-w-sm text-sm leading-6 text-muted">{success ? t("payment.successBody") : t("payment.failBody")}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={() => navigate("/account/orders")}>{t("payment.viewOrder")}</Button>
          <Button variant="outline" onClick={() => navigate("/products")}>{t("home.shopAll")}</Button>
        </div>
      </div>
    </div>
  );
}
