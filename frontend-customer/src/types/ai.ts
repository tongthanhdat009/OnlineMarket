import type { ProductDto } from './catalog';

export interface ChatMessageDto {
  Role: 'user' | 'assistant';
  Content: string;
}

export interface AiChatRequest {
  Message: string;
  History?: ChatMessageDto[] | null;
  Summary?: string | null;
  SummaryMessageCount?: number;
}

export interface ProductSuggestionDto {
  ProductId: number;
  ProductName: string;
  SuggestedQuantity: number;
  Price: number;
  Unit?: string | null;
  ImageUrl?: string | null;
}

export interface ContextSourceDto {
  ProductName: string;
  Excerpt: string;
}

export interface AiChatResponse {
  Message: string;
  HasProductSuggestion: boolean;
  SuggestedProducts?: ProductSuggestionDto[] | null;
  ContextSources?: ContextSourceDto[] | null;
}

export interface AiChatStreamEvent {
  Type: string;
  Text?: string | null;
  ToolName?: string | null;
  ToolArguments?: string | null;
  Summary?: string | null;
  SummaryMessageCount?: number;
  HasProductSuggestion?: boolean;
  SuggestedProducts?: ProductSuggestionDto[] | null;
  ContextSources?: ContextSourceDto[] | null;
  Error?: string | null;
  SessionId?: string | number | null;
  RunId?: string | number | null;
}

export interface AddSuggestedProduct {
  ProductId: number;
  Quantity: number;
}

export interface AddSuggestedProductsRequest {
  Products: AddSuggestedProduct[];
}

export interface AddedItemDto {
  ProductId: number;
  Quantity: number;
  Success: boolean;
}

export interface AddToCartResponse {
  Message?: string | null;
  AddedItems?: AddedItemDto[] | null;
  Errors?: string[] | null;
}

export type SuggestedProduct = ProductSuggestionDto & Pick<ProductDto, 'ProductId'>;
