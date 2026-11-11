// Facade backward-compat: mọi import hiện tại `from "../api"` / `from "../../api"`
// vẫn hoạt động. Endpoint đã tách sang `./core/client-core` + `*.api.ts`.
export * from "./core/client-core";
export * from "./auth.api";
export * from "./products.api";
export * from "./cart.api";
export * from "./inventory.api";
export * from "./promotions.api";
export * from "./orders.api";
export * from "./bills.api";
export * from "./payment.api";
export * from "./refunds.api";
export * from "./ai.api";

import { CustomerApiClient } from "./core/client-core";

export const apiClient = new CustomerApiClient();
export const customerApi = apiClient;
