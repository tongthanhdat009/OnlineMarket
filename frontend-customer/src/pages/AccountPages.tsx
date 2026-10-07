import { useState } from "react";
import { FileText, RefreshCw, XCircle, ShoppingCart } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api";
import { useToast } from "../app/providers";
import { useBills, useRefunds, useOrders, useOrder } from "../hooks";
import { errorMessage, formatDate } from "../lib";
import { productName } from "../app/types";

import { Button, EmptyState, ErrorState, Money } from "../components/store-ui";
import { translator } from "../lib/translator";

const t = translator;

export function BillsPage() {
  const query = useBills();
  const [total, setTotal] = useState<number | null>(null);
  const loadTotal = async () => {
    try {
      const result = await apiClient.bills.totalSpent();
      setTotal(result.totalSpent);
    } catch {
      setTotal(null);
    }
  };
  if (query.isLoading) return <div className="skeleton h-80 rounded-3xl" />;
  if (query.isError) return <ErrorState onRetry={() => void query.refetch()} />;
  const bills = query.data ?? [];
  return (
    <div className="animate-float-in">
      <div className="mb-5 flex flex-wrap gap-3">
        <div className="rounded-2xl border border-line bg-white px-4 py-3">
          <span className="block text-xs text-muted"> {t("bills.paidBills")}</span>
          <strong className="text-lg text-ink">{bills.filter(bill => (bill.Status ?? "").toLowerCase() === "paid").length}</strong>
        </div>
        <button onClick={() => void loadTotal()} className="rounded-2xl border border-line bg-white px-4 py-3 text-left hover:border-leaf">
          <span className="block text-xs text-muted"> {t("bills.totalSpent")}</span>
          <strong className="text-lg text-leaf-dark">{total === null ? t("bills.showTotal") : <Money value={total} />}</strong>
        </button>
      </div>
      {bills.length ? (
        <div className="grid gap-3">
          {bills.map(bill => (
            <div key={bill.BillId} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-leaf-soft text-leaf"><FileText size={18} /></span>
                <div>
                  <p className="text-sm font-bold">Bill #{bill.BillId} · Order #{bill.OrderId}</p>
                  <p className="mt-1 text-xs text-muted">{formatDate(bill.CreatedAt)} · {bill.Status}</p>
                </div>
              </div>
              <Money value={bill.FinalAmount} className="font-extrabold text-ink" />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={<FileText size={28} />} title={t("bills.noBills")} body={t("bills.noBillsBody")} />
      )}
    </div>
  );
}

export function RefundsPage() {
  const query = useRefunds();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const cancel = async (id: number) => {
    try {
      await apiClient.refunds.cancel(id);
      showToast(t("refunds.canceled"));
      await queryClient.invalidateQueries({ queryKey: ["refunds"] });
    } catch (error) {
      showToast(errorMessage(error, t("refunds.cancelFailed")), "error");
    }
  };
  if (query.isLoading) return <div className="skeleton h-80 rounded-3xl" />;
  if (query.isError) return <ErrorState onRetry={() => void query.refetch()} />;
  const refunds = query.data ?? [];
  return (
    <div className="animate-float-in">
      {refunds.length ? (
        <div className="grid gap-3">
          {refunds.map(refund => (
            <div key={refund.RefundId} className="rounded-2xl border border-line bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-ink">Refund #{refund.RefundId} · Order #{refund.OrderId}</p>
                  <p className="mt-1 text-xs text-muted">{refund.Reason || "No reason provided"} · {formatDate(refund.CreatedAt)}</p>
                </div>
                <span className="rounded-full bg-[#fff5dc] px-3 py-1 text-xs font-bold capitalize text-warning">{refund.Status ?? "pending"}</span>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <Money value={refund.RefundAmount} className="text-base font-extrabold text-ink" />
                {(refund.Status ?? "").toLowerCase() === "pending" && (
                  <Button variant="danger" onClick={() => void cancel(refund.RefundId)}>
                    <XCircle size={15} /> {t("account.cancelRequest")}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={<RefreshCw size={28} />} title={t("refunds.noRequests")} body={t("refunds.noRequestsBody")} />
      )}
    </div>
  );
}

export function OrdersPage() {
  const { data: ordersPage, isLoading, isError, refetch } = useOrders();
  const orders = ordersPage?.Items ?? [];
  const [selectedOrder, setSelectedOrder] = useState<number | null>(null);
  const orderQuery = useOrder(selectedOrder ?? undefined);
  const { showToast } = useToast();
  const cancelOrder = async () => {
    if (!selectedOrder) return;
    try {
      await apiClient.orders.cancel(selectedOrder);
      showToast(t("orders.orderCanceled"));
      setSelectedOrder(null);
      await refetch();
    } catch (error) {
      showToast(errorMessage(error, t("orders.cannotCancel")), "error");
    }
  };
  if (isLoading) return <div className="skeleton h-64 rounded-3xl" />;
  if (isError) return <ErrorState onRetry={() => void refetch()} />;
  return (
    <div className="animate-float-in space-y-6">
      <h1 className="display text-3xl font-extrabold text-ink">{t("orders.title")}</h1>
      {orders.length === 0 ? (
        <EmptyState icon={<ShoppingCart size={28} />} title={t("orders.noOrders")} body={t("orders.noOrdersBody")} action={<Button onClick={() => window.location.href = "/products"}>{t("orders.browseProducts")}</Button>} />
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
