import type { CategoryDto, ProductDto } from './catalog';

export interface CartItemDto {
  CartItemId?: number;
  ProductId: number;
  CustomerId?: number;
  Quantity: number;
  Price: number;
  Subtotal: number;
  AddedAt?: string | null;
  Product?: ProductDto | null;
  ProductName?: string | null;
  ImageUrl?: string | null;
  CategoryName?: string | null;
}

export interface AddCartItemRequest {
  ProductId: number;
  Quantity: number;
}

export interface UpdateCartItemRequest {
  Quantity: number;
}

export interface CartTotalResponse {
  total: number;
}

export interface OutOfStockProduct {
  ProductId: number;
  ProductName: string;
  RequestedQuantity: number;
  AvailableQuantity: number;
}

export interface DeletedProduct {
  ProductId: number;
  ProductName: string;
  Quantity: number;
}

export interface PriceChangedProduct {
  ProductId: number;
  ProductName: string;
  CartPrice: number;
  CurrentPrice: number;
}

export interface PromotionValidationResult {
  IsValid: boolean;
  Message?: string | null;
  PromoId?: number | null;
  DiscountAmount: number;
}

export interface ValidateCheckoutRequest {
  PromoCode?: string | null;
}

export interface ValidateCheckoutResponse {
  IsValid: boolean;
  Errors: string[];
  OutOfStockProducts: OutOfStockProduct[];
  DeletedProducts: DeletedProduct[];
  PriceChangedProducts: PriceChangedProduct[];
  PromotionValidation?: PromotionValidationResult | null;
}

export interface ValidateCartStockRequestItem {
  ProductId: number;
  Quantity: number;
}

export interface ValidateCartStockRequest {
  Items: ValidateCartStockRequestItem[];
}

export interface ValidateCartStockResponse {
  IsValid: boolean;
  OutOfStockProducts: OutOfStockProduct[];
  DeletedProducts: DeletedProduct[];
}

export interface PromotionDto {
  PromoId: number;
  PromoCode: string;
  Description?: string | null;
  DiscountType: string;
  DiscountValue: number;
  StartDate?: string | null;
  EndDate?: string | null;
  MinOrderAmount?: number | null;
  UsageLimit?: number | null;
  UsedCount?: number | null;
  Status?: string | null;
}

export interface ApplyPromoRequest {
  PromoCode: string;
  TotalAmount: number;
}

export interface ApplyPromoResponse extends PromotionDto {
  DiscountAmount: number;
}

export interface OrderItemDto {
  OrderItemId: number;
  OrderId?: number | null;
  ProductId?: number | null;
  Quantity: number;
  Price: number;
  Subtotal: number;
  Product?: ProductDto | null;
}

export interface PaymentDto {
  PaymentId: number;
  OrderId: number;
  Amount: number;
  PaymentMethod: string;
  PaymentDate: string;
}

export interface OrderDto {
  OrderId: number;
  CustomerId?: number | null;
  UserId?: number | null;
  PromoId?: number | null;
  OrderDate?: string | null;
  PayStatus?: string | null;
  OrderStatus?: string | null;
  TotalAmount?: number | null;
  DiscountAmount?: number | null;
  OrderType?: string | null;
  PaymentMethod?: string | null;
  Name?: string | null;
  Address?: string | null;
  Phone?: string | null;
  Email?: string | null;
  OrderItems: OrderItemDto[];
  Payments?: PaymentDto[];
}

export interface OrderItemWithProductDto {
  OrderItemId: number;
  OrderId?: number | null;
  ProductId?: number | null;
  Quantity: number;
  Price: number;
  Subtotal: number;
  ProductName: string;
  Barcode?: string | null;
  ProductPrice: number;
  Unit?: string | null;
  ImageUrl?: string | null;
  Product?: ProductDto | null;
}

export interface PagedResultDto<T> {
  Items: T[];
  TotalCount: number;
  Page: number;
  PageSize: number;
}

export interface CreateOrderFromCartRequest {
  PromoId?: number | null;
  PromoCode?: string | null;
  DiscountAmount?: number | null;
  PaymentMethod?: string | null;
  CustomerName?: string | null;
  CustomerPhone?: string | null;
  CustomerEmail?: string | null;
  CustomerAddress?: string | null;
  SelectedProductIds?: number[] | null;
}

export interface CheckoutRequest extends CreateOrderFromCartRequest {
  CustomerId?: number;
}

export interface CancelOrderRequest {
  Reason?: string | null;
  CustomerBankName?: string | null;
  CustomerBankAccount?: string | null;
  CustomerAccountHolder?: string | null;
}

export interface CreatePaymentRequest extends PaymentDto {}

export interface VNPayRequest {
  OrderId: number;
  Amount: number;
  OrderInfo: string;
  ReturnUrl?: string | null;
}

export interface VNPayResponse {
  Success: boolean;
  PaymentUrl?: string | null;
  Message?: string | null;
}

export interface BillDto {
  BillId: number;
  OrderId: number;
  CustomerId: number;
  CustomerName?: string | null;
  TotalAmount: number;
  DiscountAmount: number;
  FinalAmount: number;
  PaymentMethod?: string | null;
  Status: string;
  CreatedAt?: string | null;
  PaidAt?: string | null;
  Name?: string | null;
  Address?: string | null;
  Phone?: string | null;
  Email?: string | null;
}

export interface RefundRequestDto {
  RefundId: number;
  OrderId: number;
  RefundAmount: number;
  Reason?: string | null;
  CustomerBankName?: string | null;
  CustomerBankAccount?: string | null;
  CustomerAccountHolder?: string | null;
  Status?: string | null;
  ProcessedBy?: number | null;
  ProcessedByName?: string | null;
  AdminNote?: string | null;
  GatewayRefundId?: string | null;
  CreatedAt?: string | null;
  UpdatedAt?: string | null;
  CustomerName?: string | null;
  CustomerPhone?: string | null;
  CustomerEmail?: string | null;
}

export interface CreateRefundRequest {
  OrderId: number;
  RefundAmount: number;
  Reason?: string | null;
  CustomerBankName?: string | null;
  CustomerBankAccount?: string | null;
  CustomerAccountHolder?: string | null;
}

export interface CustomerCategoryProduct extends ProductDto {
  Category?: CategoryDto | null;
}
