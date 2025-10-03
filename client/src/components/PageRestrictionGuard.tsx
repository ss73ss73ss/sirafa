import React from 'react';
import { usePageRestriction } from '@/hooks/use-access-control';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

interface PageRestrictionGuardProps {
  pageKey: string;
  pageName: string;
  children: React.ReactNode;
}

export function PageRestrictionGuard({ pageKey, pageName, children }: PageRestrictionGuardProps) {
  const { data: restrictionData, isLoading: isCheckingRestriction } = usePageRestriction(pageKey);

  // فحص القيود أولاً
  if (isCheckingRestriction) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  if (restrictionData?.isBlocked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">تم تقييد الوصول</CardTitle>
            <CardDescription>لا يمكنك الوصول إلى {pageName}</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {restrictionData.reason && (
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">السبب:</p>
                <p className="font-medium">{restrictionData.reason}</p>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              إذا كنت تعتقد أن هذا خطأ، يرجى التواصل مع الإدارة
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/dashboard" className="w-full">
              <Button className="w-full" variant="outline">
                العودة للوحة التحكم
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // إذا لم تكن هناك قيود، عرض المحتوى
  return <>{children}</>;
}