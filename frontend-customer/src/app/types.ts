import type { CategoryDto, ProductDto, SupplierDto } from '../types/catalog';
import type { BillDto, CartItemDto, OrderDto, OrderItemDto, RefundRequestDto } from '../types/commerce';
import type { CustomerInfo } from '../types/auth';

export type Product = ProductDto;
export type Category = CategoryDto;
export type Customer = CustomerInfo;
export type CartLine = CartItemDto;
export type Order = OrderDto;
export type OrderLine = OrderItemDto;
export type Refund = RefundRequestDto;
export type Bill = BillDto;
export type Supplier = SupplierDto;

export const productName = (product: Product) => product.ProductName || 'Unnamed product';
export const categoryName = (category: Category) => category.CategoryName || 'Category';
export const supplierName = (product: Product) => product.Supplier?.Name || 'Verified supplier';
export const productInStock = (product: Product) => (product.Quantity ?? 0) > 0 && !product.Deleted;
