import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";

export interface AccessControlData {
  restrictedPages: string[];
  hasGlobalRestriction: boolean;
  restrictions: Array<{
    pageKey: string;
    reason: string | null;
    expiresAt: string | null;
  }>;
}

export function useAccessControl() {
  const { user } = useAuth();

  return useQuery<AccessControlData>({
    queryKey: ['/api/my-restrictions'],
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 دقائق كاش
    refetchOnWindowFocus: true,
  });
}

export function usePageRestriction(pageKey: string) {
  const { user } = useAuth();

  return useQuery<{ isBlocked: boolean; reason: string | null }>({
    queryKey: [`/api/check-restriction/${pageKey}`],
    enabled: !!user && !!pageKey,
    staleTime: 0, // لا توجد مدة تخزين مؤقت - التحقق الفوري
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
}