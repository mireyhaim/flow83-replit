import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/schema";

// Check if mentor profile has required fields for AI personalization
function checkProfileComplete(user: User | null | undefined): boolean {
  if (!user) return false;
  // Required fields: firstName, lastName, specialty, methodology
  // uniqueApproach is optional
  return !!(user.firstName && user.lastName && user.specialty && user.methodology);
}

// Get list of missing profile fields
function getMissingProfileFields(user: User | null | undefined): string[] {
  if (!user) return ['firstName', 'lastName', 'specialty', 'methodology'];
  const missing: string[] = [];
  if (!user.firstName) missing.push('firstName');
  if (!user.lastName) missing.push('lastName');
  if (!user.specialty) missing.push('specialty');
  if (!user.methodology) missing.push('methodology');
  return missing;
}

async function fetchUser(): Promise<User | null> {
  const response = await fetch("/api/auth/user", {
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

async function logout(): Promise<void> {
  window.location.href = "/api/logout";
}

export function useAuth() {
  const queryClient = useQueryClient();
  const { data: user, isLoading, isFetching } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 30, // 30 seconds - refresh more often for profile checks
    refetchOnMount: 'always', // Always refetch when components mount
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
    },
  });

  return {
    user,
    isLoading,
    isFetching,
    isAuthenticated: !!user,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
    isProfileComplete: checkProfileComplete(user),
    missingProfileFields: getMissingProfileFields(user),
  };
}
