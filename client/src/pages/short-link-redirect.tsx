import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function ShortLinkRedirect() {
  const { code } = useParams<{ code: string }>();
  const [, setLocation] = useLocation();

  const { data: journey, isLoading, error } = useQuery({
    queryKey: ["/api/journeys/code", code],
    queryFn: async () => {
      const res = await fetch(`/api/journeys/code/${code}`);
      if (!res.ok) throw new Error("Flow not found");
      return res.json();
    },
    enabled: !!code,
  });

  useEffect(() => {
    if (journey?.id) {
      setLocation(`/j/${journey.id}`);
    }
  }, [journey, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Flow Not Found</h1>
          <p className="text-gray-600">This link may be invalid or expired.</p>
        </div>
      </div>
    );
  }

  return null;
}
