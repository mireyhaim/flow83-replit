import { useQuery } from "@tanstack/react-query";

export interface SubscriptionStatus {
  plan: 'free' | 'pro' | 'scale';
  planName: string;
  planNameHe: string;
  commissionRate: number;
  monthlyFee: number;
  isActive: boolean;
  planChangedAt: string | null;
}

async function fetchSubscriptionStatus(): Promise<SubscriptionStatus | null> {
  const response = await fetch("/api/subscription-status", {
    credentials: "include",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export function useSubscriptionStatus() {
  const { data: subscriptionStatus, isLoading, refetch } = useQuery<SubscriptionStatus | null>({
    queryKey: ["/api/subscription-status"],
    queryFn: fetchSubscriptionStatus,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const plan = subscriptionStatus?.plan ?? 'free';
  const planName = subscriptionStatus?.planName ?? 'Free';
  const planNameHe = subscriptionStatus?.planNameHe ?? 'חינם';
  const commissionRate = subscriptionStatus?.commissionRate ?? 0.17;
  const monthlyFee = subscriptionStatus?.monthlyFee ?? 0;
  const isActive = subscriptionStatus?.isActive ?? true;
  const planChangedAt = subscriptionStatus?.planChangedAt ?? null;

  return {
    subscriptionStatus,
    isLoading,
    plan,
    planName,
    planNameHe,
    commissionRate,
    monthlyFee,
    isActive,
    planChangedAt,
    refetch,
  };
}
