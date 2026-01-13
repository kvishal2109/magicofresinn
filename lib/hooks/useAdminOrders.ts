import useSWR, { SWRConfiguration } from "swr";
import { Order } from "@/types";

const fetcher = async (url: string): Promise<Order[]> => {
  const response = await fetch(url, {
    // Use Next.js cache for 1 minute (orders update more frequently)
    next: { revalidate: 60 },
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "Failed to load orders");
  }

  return payload.orders || [];
};

export function useAdminOrders(config?: SWRConfiguration<Order[]>) {
  const swr = useSWR<Order[]>(
    "/api/admin/orders",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30_000, // 30 seconds (orders change more frequently than products)
      focusThrottleInterval: 30_000,
      ...config,
    }
  );

  return {
    orders: swr.data || [],
    loading: !swr.data && !swr.error,
    error: swr.error,
    mutate: swr.mutate,
  };
}

