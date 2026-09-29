import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api';

export function useCatalog(options: { keyword?: string; categoryId?: number } = {}) {
  const keyword = options.keyword?.trim() ?? '';
  return useQuery({
    queryKey: ['products', { keyword, categoryId: options.categoryId }],
    queryFn: () => keyword ? apiClient.products.search(keyword) : options.categoryId ? apiClient.products.byCategory(options.categoryId) : apiClient.products.list(),
    select: products => products.filter(product => !product.Deleted),
    staleTime: 60_000,
  });
}

export function useDebouncedValue<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => { const timer = window.setTimeout(() => setDebounced(value), delay); return () => window.clearTimeout(timer); }, [value, delay]);
  return debounced;
}

export function useProduct(productId: number | undefined) { return useQuery({ queryKey: ['product', productId], queryFn: () => apiClient.products.get(productId!), enabled: Number.isInteger(productId) && productId! > 0, staleTime: 120_000 }); }
export function useCategories() { return useQuery({ queryKey: ['categories'], queryFn: () => apiClient.products.categories(), staleTime: 300_000 }); }
