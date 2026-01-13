import useSWR, { SWRConfiguration, KeyedMutator } from "swr";
import { Product } from "@/types";

const fetcher = async (url: string): Promise<Product[]> => {
  const response = await fetch(url, {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "Failed to load products");
  }

  return payload.products || [];
};

export function useAdminProducts(config?: SWRConfiguration<Product[]>) {
  const swr = useSWR<Product[]>(
    "/api/admin/products",
    fetcher,
    {
      revalidateOnFocus: true, // Enable focus revalidation
      revalidateOnReconnect: true, // Enable reconnect revalidation
      dedupingInterval: 0, // No deduplication - always fetch fresh
      focusThrottleInterval: 0, // No throttling
      ...config,
    }
  );

  // Enhanced mutate function with proper error handling
  const mutate: KeyedMutator<Product[]> = async (data?, options?) => {
    if (options && typeof options === 'object' && 'revalidate' in options && options.revalidate === false) {
      return swr.mutate(data, options);
    }
    
    return swr.mutate(
      async () => {
        const response = await fetch('/api/admin/products', { cache: 'no-store' });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || "Failed to load products");
        }
        const payload = await response.json();
        return payload.products || [];
      },
      { revalidate: true }
    );
  };

  return {
    products: swr.data || [],
    loading: !swr.data && !swr.error,
    error: swr.error,
    mutate,
  };
}

