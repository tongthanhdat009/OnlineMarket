import { apiClient } from "../lib/api-client";
import type { ApiListResult, ListQuery } from "../types/api";
import type { Promotion } from "../types/domain";

export interface PromotionInput extends Partial<Promotion> {
  PromoCode: string;
  DiscountType: "percent" | "fixed" | string;
  DiscountValue: number;
  StartDate: string;
  EndDate: string;
}

export interface ApplyPromotionInput { PromoCode?: string; PromoId?: number; OrderAmount: number; CustomerId?: number; }
export interface GiftVoucherInput { PromoId: number; CustomerIds: number[]; }

export const promotionsApi = {
  list: (query?: ListQuery): Promise<ApiListResult<Promotion>> => apiClient.list<Promotion>("api/promotion", { page: 1, pageSize: 20, ...query }),
  byId: (id: number): Promise<Promotion> => apiClient.get<Promotion>(`api/promotion/${id}`),
  create: (input: PromotionInput): Promise<Promotion> => apiClient.post<Promotion>("api/promotion", input),
  update: (id: number, input: Partial<PromotionInput>): Promise<Promotion> => apiClient.put<Promotion>(`api/promotion/${id}`, input),
  remove: (id: number): Promise<void> => apiClient.delete<void>(`api/promotion/${id}`),
  apply: (input: ApplyPromotionInput): Promise<unknown> => apiClient.post("api/promotion/apply", input),
  gift: (input: GiftVoucherInput): Promise<unknown> => apiClient.post("api/promotion/gift", input),
};

export function isPromotionValueLocked(promotion: Pick<Promotion, "UsedCount">): boolean {
  return (promotion.UsedCount ?? 0) > 0;
}

export function canReduceUsageLimit(promotion: Pick<Promotion, "UsedCount">, nextLimit: number | null | undefined): boolean {
  return nextLimit == null || nextLimit >= (promotion.UsedCount ?? 0);
}
