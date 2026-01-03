import { useQuery } from "@tanstack/react-query";

interface TrialStatus {
  isActive: boolean;
  daysRemaining: number;
  status: string | null;
  trialEndsAt: string | null;
}

async function fetchTrialStatus(): Promise<TrialStatus | null> {
  const response = await fetch("/api/trial-status", {
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

export function useTrialStatus() {
  const { data: trialStatus, isLoading, refetch } = useQuery<TrialStatus | null>({
    queryKey: ["/api/trial-status"],
    queryFn: fetchTrialStatus,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const isTrialActive = trialStatus?.isActive ?? false;
  const isOnTrial = trialStatus?.status === "on_trial";
  const isTrialExpired = trialStatus?.status === "trial_expired";
  const hasActiveSubscription = trialStatus?.status === "active";
  const daysRemaining = trialStatus?.daysRemaining ?? 0;

  return {
    trialStatus,
    isLoading,
    isTrialActive,
    isOnTrial,
    isTrialExpired,
    hasActiveSubscription,
    daysRemaining,
    refetch,
  };
}
