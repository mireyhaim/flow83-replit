import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/schema";

// Check if mentor profile has required fields for AI personalization
function checkProfileComplete(user: User | null | undefined): boolean {
  if (!user) return false;
  // Required fields for generating personalized AI content
  return !!(user.specialty && user.methodology && user.uniqueApproach);
}

// Get list of missing profile fields
function getMissingProfileFields(user: User | null | undefined): string[] {
  if (!user) return ['specialty', 'methodology', 'uniqueApproach'];
  const missing: string[] = [];
  if (!user.specialty) missing.push('specialty');
  if (!user.methodology) missing.push('methodology');
  if (!user.uniqueApproach) missing.push('uniqueApproach');
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
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
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
    isAuthenticated: !!user,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
    isProfileComplete: checkProfileComplete(user),
    missingProfileFields: getMissingProfileFields(user),
  };
}
