export interface CategoryDto {
  CategoryId: number;
  CategoryName: string;
  Description?: string | null;
  Products?: ProductDto[] | null;
}

export interface SupplierDto {
  SupplierId: number;
  Name: string;
  Phone?: string | null;
  Email?: string | null;
  Address?: string | null;
}

export interface ProductDto {
  ProductId: number;
  ProductName: string;
  Description?: string | null;
  Price: number;
  Barcode?: string | null;
  Unit?: string | null;
  CategoryId?: number | null;
  SupplierId?: number | null;
  Quantity?: number | null;
  Category?: CategoryDto | null;
  Supplier?: SupplierDto | null;
  ImageUrl?: string | null;
  CreatedAt?: string | null;
  UpdatedAt?: string | null;
  Deleted: boolean;
}

export interface ProductQuery {
  categoryId?: number;
  keyword?: string;
}
