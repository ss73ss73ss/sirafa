import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  Eye, 
  Ban, 
  CheckCircle, 
  AlertTriangle, 
  Camera, 
  MapPin, 
  Monitor,
  Calendar,
  User,
  RefreshCw,
  Download,
  Search,
  Trash2,
  Trash
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import AdminLayout from '@/components/admin-layout';

interface SecurityLog {
  id: string;
  timestamp: string;
  ip: string;
  country: string;
  city: string;
  fingerprint: string;
  userAgent: string;
  platform: string;
  language: string;
  screen: string;
  timezone: string;
  username?: string;
  attempts: number;
  reportType: 'failed_login' | 'suspicious_activity' | 'manual_report' | 'admin_action';
  imageFileName?: string;
  blocked: boolean;
}

export default function SecurityAdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<SecurityLog | null>(null);
  const [selectedLogs, setSelectedLogs] = useState<Set<string>>(new Set());
  const [dateFilter, setDateFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showUnblockDialog, setShowUnblockDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);
  const [showCompleteWipeDialog, setShowCompleteWipeDialog] = useState(false);
  const [logToDelete, setLogToDelete] = useState<SecurityLog | null>(null);
  const [actionFingerprint, setActionFingerprint] = useState<string>('');
  const [actionUsername, setActionUsername] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [localLogs, setLocalLogs] = useState<SecurityLog[]>([]);

  // Helper function to format dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ar-LY');
  };

  // Function to load security image with JWT token
  const loadSecurityImage = async (filename: string) => {
    if (!filename) return;
    
    setLoadingImage(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('المصادقة: لا يوجد JWT token في auth_token');
        toast({
          title: 'خطأ في المصادقة',
          description: 'لم يتم العثور على رمز المصادقة. يرجى تسجيل الدخول مرة أخرى',
          variant: 'destructive'
        });
        return;
      }

      const response = await fetch(`/api/security/image/${filename}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setImageUrl(url);
        console.log('✅ تم تحميل الصورة الأمنية بنجاح');
      } else {
        console.error('فشل في تحميل الصورة:', response.status, response.statusText);
        toast({
          title: 'خطأ',
          description: 'فشل في تحميل الصورة الأمنية',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('خطأ في تحميل الصورة:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحميل الصورة',
        variant: 'destructive'
      });
    } finally {
      setLoadingImage(false);
    }
  };

  // Load image when selectedLog changes
  useEffect(() => {
    if (selectedLog && selectedLog.imageFileName) {
      // Clean up previous image URL
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
        setImageUrl(null);
      }
      
      loadSecurityImage(selectedLog.imageFileName);
    } else {
      // Clean up when dialog closes
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
        setImageUrl(null);
      }
    }
  }, [selectedLog]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  // Check authorization
  if (!user || user.email !== 'ss73ss73ss73@gmail.com') {
    return (
      <div className="container py-10">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>غير مصرح</AlertTitle>
          <AlertDescription>
            ليس لديك صلاحية الوصول إلى نظام الأمان. هذا النظام محمي ومخصص للمدير الأعلى فقط.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Fetch security logs
  const { data: logsData, isLoading, refetch } = useQuery({
    queryKey: ['security-logs', refreshTrigger],
    queryFn: async () => {
      console.log('🔄 Fetching security logs...');
      const response = await apiRequest('/api/security/logs');
      const data = await response.json();
      console.log('📊 Received logs:', data.logs?.length || 0);
      return data;
    },
    refetchInterval: 10000, // Auto refresh every 10 seconds for better responsiveness
    staleTime: 0, // Always consider data stale for fresh updates
    gcTime: 0, // Don't cache results - always fetch fresh data
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Block fingerprint mutation
  const blockMutation = useMutation({
    mutationFn: async ({ fingerprint, reason }: { fingerprint: string; reason?: string }) => {
      const response = await apiRequest('/api/security/block', 'POST', { fingerprint, reason });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'تم حظر الجهاز',
        description: 'تم حظر بصمة الجهاز بنجاح',
      });
      queryClient.invalidateQueries({ queryKey: ['security-logs'] });
      setShowBlockDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في حظر الجهاز',
        variant: 'destructive',
      });
    },
  });

  // Unblock fingerprint mutation
  const unblockMutation = useMutation({
    mutationFn: async (fingerprint: string) => {
      const response = await apiRequest('/api/security/unblock', 'POST', { fingerprint });
      return response.json();
    },
    onSuccess: async () => {
      toast({
        title: 'تم إلغاء الحظر',
        description: 'تم إلغاء حظر بصمة الجهاز بنجاح',
      });
      // Force immediate refetch and cache invalidation
      await queryClient.invalidateQueries({ queryKey: ['security-logs'] });
      await refetch();
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في إلغاء حظر الجهاز',
        variant: 'destructive',
      });
    },
  });

  // Delete single security log mutation
  const deleteLogMutation = useMutation({
    mutationFn: async (logId: string) => {
      const response = await apiRequest(`/api/security/logs/${logId}`, 'DELETE');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'فشل في حذف السجل');
      }
      return response.json();
    },
    onSuccess: async () => {
      toast({
        title: 'تم حذف السجل',
        description: 'تم حذف السجل الأمني بنجاح',
      });
      // Update local logs immediately and temporarily suppress sync
      if (logToDelete) {
        setSuppressSync(true);
        setLocalLogs(prev => {
          const newLogs = prev.filter(log => log.id !== logToDelete.id);
          console.log('🗑️ Local log deleted:', logToDelete.id, 'remaining:', newLogs.length);
          return newLogs;
        });
        // Auto re-enable sync after 10 seconds to get fresh data
        setTimeout(() => {
          setSuppressSync(false);
          console.log('🔄 Auto-sync re-enabled after individual delete');
        }, 10000);
      }
      setShowDeleteDialog(false);
      setLogToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في حذف السجل',
        variant: 'destructive',
      });
      setShowDeleteDialog(false);
      setLogToDelete(null);
    },
  });

  // Clear all security logs mutation
  const clearAllLogsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/security/logs', 'DELETE');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'فشل في مسح السجلات');
      }
      return response.json();
    },
    onSuccess: async (data) => {
      toast({
        title: 'تم مسح جميع السجلات',
        description: `تم مسح جميع السجلات الأمنية بنجاح (${data.deletedCount || 'جميع'} سجل)`,
      });
      // Clear local logs immediately and suppress sync temporarily
      setSuppressSync(true);
      setLocalLogs([]);
      console.log('🗑️ All local logs cleared');
      // Auto re-enable sync after 15 seconds to get fresh data
      setTimeout(() => {
        setSuppressSync(false);
        console.log('🔄 Auto-sync re-enabled after clear all');
      }, 15000);
      setShowClearAllDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في مسح السجلات',
        variant: 'destructive',
      });
      setShowClearAllDialog(false);
    },
  });

  // Complete wipe mutation
  const completeWipeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/security/logs?complete=true', 'DELETE');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'فشل في المسح الكامل');
      }
      return response.json();
    },
    onSuccess: async (data) => {
      toast({
        title: 'تم المسح الكامل',
        description: `تم مسح جميع السجلات الأمنية نهائياً (${data.deletedCount} سجل)`,
        variant: 'default',
      });
      // Clear local logs immediately and suppress sync temporarily  
      setSuppressSync(true);
      setLocalLogs([]);
      console.log('🗑️ Complete wipe - all local logs cleared');
      // Auto re-enable sync after 20 seconds for complete wipe
      setTimeout(() => {
        setSuppressSync(false);
        console.log('🔄 Auto-sync re-enabled after complete wipe');
      }, 20000);
      setShowCompleteWipeDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في المسح الكامل',
        variant: 'destructive',
      });
      setShowCompleteWipeDialog(false);
    },
  });

  // Manage local logs synchronization
  const serverLogs: SecurityLog[] = logsData?.logs || [];
  const [suppressSync, setSuppressSync] = React.useState(false);
  
  React.useEffect(() => {
    if (!isLoading && !suppressSync) {
      setLocalLogs(serverLogs);
      console.log('📱 Local logs synced with server:', serverLogs.length);
    }
    if (suppressSync) {
      console.log('🚫 Sync suppressed - using local state');
    }
  }, [serverLogs.length, refreshTrigger, isLoading, suppressSync]);

  // Force refresh without cache when needed
  const forceRefreshFromServer = async () => {
    setSuppressSync(false);
    setLocalLogs([]);
    await queryClient.invalidateQueries({ queryKey: ['security-logs'] });
    refetch();
    console.log('🔄 Force refresh from server executed');
  };

  const logs: SecurityLog[] = localLogs;
  const filteredLogs = logs.filter(log => {
    // Date filter
    if (dateFilter) {
      const logDate = new Date(log.timestamp).toISOString().split('T')[0];
      if (logDate !== dateFilter) return false;
    }
    
    // Email/username filter  
    if (emailFilter) {
      const emailLower = emailFilter.toLowerCase();
      if (!log.username?.toLowerCase().includes(emailLower)) return false;
    }
    
    // General search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const logDate = formatDate(log.timestamp).toLowerCase();
      
      const matches = (
        log.ip.includes(searchTerm) ||
        log.country.toLowerCase().includes(searchLower) ||
        log.fingerprint.includes(searchTerm) ||
        log.username?.toLowerCase().includes(searchLower) ||
        logDate.includes(searchLower) ||
        log.reportType.toLowerCase().includes(searchLower) ||
        (log.city && log.city.toLowerCase().includes(searchLower))
      );
      
      if (!matches) return false;
    }
    
    return true;
  });

  // Helper function to force complete data refresh
  const forceDataRefresh = async () => {
    console.log('🔄 Force refresh triggered');
    // Completely clear all caches
    queryClient.clear();
    queryClient.removeQueries();
    
    // Force refresh by updating trigger
    setRefreshTrigger(prev => prev + 1);
    
    // Additional invalidation
    await queryClient.invalidateQueries({ queryKey: ['security-logs'] });
    
    console.log('✅ Force refresh completed');
  };

  // Selection handlers
  const toggleLogSelection = (logId: string) => {
    setSelectedLogs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  const selectAllLogs = () => {
    setSelectedLogs(new Set(filteredLogs.map(log => log.id)));
  };

  const deselectAllLogs = () => {
    setSelectedLogs(new Set());
  };

  const selectByDateRange = () => {
    // Select today's logs
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaysLogs = filteredLogs.filter(log => {
      const logDate = new Date(log.timestamp);
      logDate.setHours(0, 0, 0, 0);
      return logDate.getTime() === today.getTime();
    });
    setSelectedLogs(new Set(todaysLogs.map(log => log.id)));
  };

  const selectByUser = (username: string) => {
    const userLogs = filteredLogs.filter(log => log.username === username);
    setSelectedLogs(new Set(userLogs.map(log => log.id)));
  };

  // Delete selected logs mutation
  const deleteSelectedLogsMutation = useMutation({
    mutationFn: async (logIds: string[]) => {
      let successCount = 0;
      let errorCount = 0;
      
      const results = await Promise.allSettled(
        logIds.map(async (id) => {
          try {
            const response = await apiRequest(`/api/security/logs/${id}`, 'DELETE');
            if (response.ok) {
              successCount++;
              return { success: true, id };
            } else if (response.status === 404) {
              console.log(`⚠️ Log ${id} already deleted or doesn't exist`);
              successCount++; // Count as success since it's already gone
              return { success: true, id, alreadyDeleted: true };
            } else {
              errorCount++;
              return { success: false, id, error: await response.text() };
            }
          } catch (error) {
            errorCount++;
            return { success: false, id, error: (error as Error).message };
          }
        })
      );
      
      return { successCount, errorCount, total: logIds.length, results };
    },
    onSuccess: async (data) => {
      if (data.successCount > 0) {
        toast({
          title: 'تم حذف السجلات',
          description: data.errorCount > 0 
            ? `تم حذف ${data.successCount} من ${data.total} سجل`
            : `تم حذف ${data.successCount} سجل بنجاح`,
          variant: data.errorCount > 0 ? 'default' : 'default',
        });
      }
      
      if (data.errorCount > 0) {
        toast({
          title: 'تحذير',
          description: `فشل في حذف ${data.errorCount} سجل`,
          variant: 'destructive',
        });
      }
      
      // Update local logs immediately - remove only successfully deleted ones
      setSuppressSync(true);
      setLocalLogs(prev => {
        const newLogs = prev.filter(log => !selectedLogs.has(log.id));
        console.log('🗑️ Selected logs removed from UI:', selectedLogs.size, 'remaining:', newLogs.length);
        return newLogs;
      });
      setSelectedLogs(new Set());
      // Auto re-enable sync after 10 seconds
      setTimeout(() => {
        setSuppressSync(false);
        console.log('🔄 Auto-sync re-enabled after bulk delete');
      }, 10000);
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في حذف السجلات المحددة',
        variant: 'destructive',
      });
    },
  });

  // Delete handlers
  const handleDeleteLog = (log: SecurityLog) => {
    setLogToDelete(log);
    setShowDeleteDialog(true);
  };

  const handleDeleteSelected = () => {
    if (selectedLogs.size > 0) {
      deleteSelectedLogsMutation.mutate(Array.from(selectedLogs));
    }
  };

  const confirmDeleteLog = () => {
    if (logToDelete) {
      deleteLogMutation.mutate(logToDelete.id);
    }
  };

  const handleClearAllLogs = () => {
    setShowClearAllDialog(true);
  };

  const confirmClearAllLogs = () => {
    clearAllLogsMutation.mutate();
  };

  const handleCompleteWipe = () => {
    setShowCompleteWipeDialog(true);
  };

  const confirmCompleteWipe = () => {
    completeWipeMutation.mutate();
  };

  const getReportTypeBadge = (type: string) => {
    switch (type) {
      case 'failed_login':
        return <Badge variant="destructive">محاولة دخول فاشلة</Badge>;
      case 'suspicious_activity':
        return <Badge variant="secondary">نشاط مشبوه</Badge>;
      case 'manual_report':
        return <Badge variant="default">حظر يدوي</Badge>;
      case 'admin_action':
        return <Badge variant="outline" className="text-blue-600 border-blue-200">إجراء إداري</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const handleBlock = (fingerprint: string, username?: string) => {
    setActionFingerprint(fingerprint);
    setActionUsername(username || '');
    setShowBlockDialog(true);
  };

  const handleUnblock = (fingerprint: string, username?: string) => {
    setActionFingerprint(fingerprint);
    setActionUsername(username || '');
    setShowUnblockDialog(true);
  };

  const confirmBlock = () => {
    blockMutation.mutate(
      { fingerprint: actionFingerprint, reason: 'حظر يدوي من المسؤول' },
      {
        onSuccess: async () => {
          toast({
            title: 'تم حظر الجهاز',
            description: 'تم حظر بصمة الجهاز بنجاح',
          });
          setShowBlockDialog(false);
          // Force complete data refresh
          await forceDataRefresh();
        }
      }
    );
  };

  const confirmUnblock = () => {
    unblockMutation.mutate(actionFingerprint, {
      onSuccess: async () => {
        toast({
          title: 'تم رفع الحظر',
          description: `تم رفع الحظر عن الجهاز بنجاح${actionUsername ? ' للمستخدم: ' + actionUsername : ''}`,
          variant: 'default',
        });
        setShowUnblockDialog(false);
        // Force complete data refresh
        await forceDataRefresh();
      }
    });
  };

  return (
    <AdminLayout>
      <div className="container py-1 sm:py-6 space-y-1 sm:space-y-6 px-1 sm:px-6 max-w-full overflow-x-hidden">
        <div className="flex items-center justify-between gap-1 sm:gap-3">
          <div className="flex items-center gap-1 sm:gap-3">
            <Shield className="h-4 w-4 sm:h-8 sm:w-8 text-red-600" />
            <div>
              <h1 className="text-xs sm:text-2xl font-bold">نظام الأمان المتقدم</h1>
              <p className="text-[8px] sm:text-sm text-muted-foreground">مراقبة ومتابعة محاولات الدخول المشبوهة</p>
            </div>
          </div>
          <Button 
            onClick={forceRefreshFromServer} 
            className="font-bold h-5 sm:h-10 text-[8px] sm:text-sm"
            size="sm"
          >
            <RefreshCw className="h-2 w-2 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
            تحديث
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-1 sm:gap-4 grid-cols-2 md:grid-cols-4">
          <Card className="min-w-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0.5 sm:pb-2 px-0.5 sm:px-6 pt-0.5 sm:pt-6">
              <CardTitle className="text-[7px] sm:text-sm font-medium truncate">إجمالي السجلات</CardTitle>
              <Eye className="h-1.5 w-1.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent className="px-0.5 sm:px-6 pb-0.5 sm:pb-6">
              <div className="text-xs sm:text-2xl font-bold">{logs.length}</div>
            </CardContent>
          </Card>
          
          <Card className="min-w-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0.5 sm:pb-2 px-0.5 sm:px-6 pt-0.5 sm:pt-6">
              <CardTitle className="text-[7px] sm:text-sm font-medium truncate">الأجهزة المحظورة</CardTitle>
              <Ban className="h-1.5 w-1.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent className="px-0.5 sm:px-6 pb-0.5 sm:pb-6">
              <div className="text-xs sm:text-2xl font-bold text-red-600">
                {logs.filter(log => log.blocked).length}
              </div>
            </CardContent>
          </Card>
          
          <Card className="min-w-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0.5 sm:pb-2 px-0.5 sm:px-6 pt-0.5 sm:pt-6">
              <CardTitle className="text-[7px] sm:text-sm font-medium truncate">نشاط مشبوه</CardTitle>
              <AlertTriangle className="h-1.5 w-1.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent className="px-0.5 sm:px-6 pb-0.5 sm:pb-6">
              <div className="text-xs sm:text-2xl font-bold text-orange-600">
                {logs.filter(log => log.reportType === 'suspicious_activity').length}
              </div>
            </CardContent>
          </Card>
          
          <Card className="min-w-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0.5 sm:pb-2 px-0.5 sm:px-6 pt-0.5 sm:pt-6">
              <CardTitle className="text-[7px] sm:text-sm font-medium truncate">صور أمنية</CardTitle>
              <Camera className="h-1.5 w-1.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent className="px-0.5 sm:px-6 pb-0.5 sm:pb-6">
              <div className="text-xs sm:text-2xl font-bold text-blue-600">
                {logs.filter(log => log.imageFileName).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader className="px-1 sm:px-6 py-1 sm:py-6">
            <CardTitle className="text-xs sm:text-lg">البحث والتصفية وإدارة السجلات</CardTitle>
            <CardDescription className="text-[8px] sm:text-sm">
              ابحث في السجلات أو قم بإدارة البيانات الأمنية (للمدير الأعلى فقط)
            </CardDescription>
          </CardHeader>
          <CardContent className="px-1 sm:px-6 pb-1 sm:pb-6">
            <div className="space-y-1 sm:space-y-4">
              {/* Search and Advanced Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-1 sm:gap-4">
                <div className="relative">
                  <Search className="absolute left-1 sm:left-3 top-1/2 transform -translate-y-1/2 h-2 w-2 sm:h-4 sm:w-4 text-muted-foreground" />
                  <Input
                    placeholder="البحث العام (IP، الدولة، المستخدم...)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-6 sm:pl-10 h-5 sm:h-10 text-[8px] sm:text-sm"
                  />
                </div>
                
                <div className="relative">
                  <Calendar className="absolute left-1 sm:left-3 top-1/2 transform -translate-y-1/2 h-2 w-2 sm:h-4 sm:w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    placeholder="فلترة بالتاريخ"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="pl-6 sm:pl-10 h-5 sm:h-10 text-[8px] sm:text-sm"
                  />
                </div>
                
                <div className="relative">
                  <User className="absolute left-1 sm:left-3 top-1/2 transform -translate-y-1/2 h-2 w-2 sm:h-4 sm:w-4 text-muted-foreground" />
                  <Input
                    placeholder="فلترة بالبريد الإلكتروني/المستخدم"
                    value={emailFilter}
                    onChange={(e) => setEmailFilter(e.target.value)}
                    className="pl-6 sm:pl-10 h-5 sm:h-10 text-[8px] sm:text-sm"
                  />
                </div>
              </div>
              
              {/* Clear Filters */}
              {(searchTerm || dateFilter || emailFilter) && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>المرشحات النشطة:</span>
                  {searchTerm && (
                    <Badge variant="secondary" className="cursor-pointer" onClick={() => setSearchTerm('')}>
                      البحث: {searchTerm} ✕
                    </Badge>
                  )}
                  {dateFilter && (
                    <Badge variant="secondary" className="cursor-pointer" onClick={() => setDateFilter('')}>
                      التاريخ: {dateFilter} ✕
                    </Badge>
                  )}
                  {emailFilter && (
                    <Badge variant="secondary" className="cursor-pointer" onClick={() => setEmailFilter('')}>
                      المستخدم: {emailFilter} ✕
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      setDateFilter('');
                      setEmailFilter('');
                    }}
                    className="h-3 sm:h-6 text-[8px] sm:text-xs"
                  >
                    مسح الكل
                  </Button>
                </div>
              )}
              
              <div className="flex gap-4 items-center">
                {/* Admin Delete Controls - Only for Super Admin */}
                {user?.email === 'ss73ss73ss73@gmail.com' && (
                  <div className="flex gap-1 sm:gap-2 flex-wrap">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleClearAllLogs}
                      disabled={clearAllLogsMutation.isPending || logs.length === 0}
                      className="bg-orange-600 hover:bg-orange-700 h-5 sm:h-10 text-[8px] sm:text-sm"
                    >
                      <Trash className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
                      حذف جميع السجلات (مع التسجيل)
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleCompleteWipe}
                      disabled={completeWipeMutation.isPending || logs.length === 0}
                      className="bg-red-700 hover:bg-red-800 h-5 sm:h-10 text-[8px] sm:text-sm"
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
                      مسح كامل نهائي
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Selection Tools - Only for Super Admin */}
            {user?.email === 'ss73ss73ss73@gmail.com' && (
              <div className="mt-1 sm:mt-4 p-1 sm:p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center justify-between mb-1 sm:mb-3">
                  <h3 className="font-medium text-gray-900 text-[8px] sm:text-sm">أدوات التحديد والحذف المتعدد</h3>
                  <div className="text-[8px] sm:text-sm text-gray-600">
                    {selectedLogs.size > 0 ? (
                      <span className="font-medium text-blue-600">({selectedLogs.size} سجل محدد)</span>
                    ) : (
                      <span className="text-gray-500">اختر السجلات من الجدول أدناه</span>
                    )}
                  </div>
                </div>
                
                {selectedLogs.size === 0 && (
                  <div className="mb-1 sm:mb-3 p-1 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <div className="text-blue-500 mt-0.5">ℹ️</div>
                      <div className="text-[8px] sm:text-sm text-blue-700">
                        <div className="font-medium mb-1 text-[8px] sm:text-sm">كيفية استخدام التحديد المتعدد:</div>
                        <ul className="list-disc list-inside space-y-0.5 text-[6px] sm:text-xs">
                          <li>استخدم أزرار التحديد السريع أدناه</li>
                          <li>أو حدد مربعات الاختيار بجانب السجلات في الجدول</li>
                          <li>ثم اضغط على "حذف المحدد" لحذف السجلات المختارة</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1 sm:gap-3">
                  <div className="space-y-1 sm:space-y-2">
                    <p className="text-[8px] sm:text-xs font-medium text-gray-700">التحديد العام</p>
                    <div className="flex gap-1 sm:gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={selectAllLogs}
                        disabled={filteredLogs.length === 0}
                        className="text-[8px] sm:text-xs h-5 sm:h-8"
                      >
                        تحديد الكل
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={deselectAllLogs}
                        disabled={selectedLogs.size === 0}
                        className="text-[8px] sm:text-xs h-5 sm:h-8"
                      >
                        إلغاء التحديد
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-1 sm:space-y-2">
                    <p className="text-[10px] sm:text-xs font-medium text-gray-700">التحديد بالتاريخ</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectByDateRange}
                      disabled={filteredLogs.length === 0}
                      className="text-[10px] sm:text-xs w-full h-6 sm:h-8"
                    >
                      <Calendar className="h-2 w-2 sm:h-3 sm:w-3 ml-1" />
                      سجلات اليوم
                    </Button>
                  </div>
                  
                  <div className="space-y-1 sm:space-y-2">
                    <p className="text-[10px] sm:text-xs font-medium text-gray-700">التحديد بالمستخدم</p>
                    <select
                      className="w-full text-[10px] sm:text-xs p-1 border rounded h-6 sm:h-8"
                      onChange={(e) => e.target.value && selectByUser(e.target.value)}
                      defaultValue=""
                    >
                      <option value="">اختر مستخدم...</option>
                      {Array.from(new Set(filteredLogs
                        .filter(log => log.username)
                        .map(log => log.username)))
                        .map(username => (
                          <option key={username} value={username}>
                            {username}
                          </option>
                        ))}
                    </select>
                  </div>
                  
                  <div className="space-y-1 sm:space-y-2">
                    <p className="text-[10px] sm:text-xs font-medium text-gray-700">الإجراءات</p>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteSelected}
                      disabled={selectedLogs.size === 0 || deleteSelectedLogsMutation.isPending}
                      className={`text-[10px] sm:text-xs w-full h-6 sm:h-8 ${
                        selectedLogs.size === 0 
                          ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed opacity-50' 
                          : 'bg-red-600 hover:bg-red-700'
                      }`}
                      title={selectedLogs.size === 0 ? 'حدد سجلات أولاً للحذف' : `حذف ${selectedLogs.size} سجل محدد`}
                    >
                      <Trash2 className="h-2 w-2 sm:h-3 sm:w-3 ml-1" />
                      {selectedLogs.size === 0 ? 'حدد سجلات للحذف' : `حذف المحدد (${selectedLogs.size})`}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Logs Table */}
        <Card>
          <CardHeader className="px-2 sm:px-6 py-2 sm:py-6">
            <CardTitle className="text-sm sm:text-lg">سجلات الأمان</CardTitle>
            <CardDescription className="text-[10px] sm:text-sm">
              عرض جميع محاولات الدخول والأنشطة المشبوهة المسجلة
            </CardDescription>
          </CardHeader>
          <CardContent className="px-1 sm:px-6 pb-1 sm:pb-6">
            {isLoading ? (
              <div className="flex justify-center items-center py-4 sm:py-10">
                <RefreshCw className="h-4 w-4 sm:h-8 sm:w-8 animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto -mx-1 sm:mx-0">
                <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    {user?.email === 'ss73ss73ss73@gmail.com' && (
                      <TableHead className="text-center w-6 sm:w-12 text-[8px] sm:text-sm px-1">
                        <Checkbox
                          checked={selectedLogs.size === filteredLogs.length && filteredLogs.length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              selectAllLogs();
                            } else {
                              deselectAllLogs();
                            }
                          }}
                          className="h-3 w-3 sm:h-4 sm:w-4"
                        />
                      </TableHead>
                    )}
                    <TableHead className="text-right text-[8px] sm:text-sm px-1 min-w-[60px]">التاريخ</TableHead>
                    <TableHead className="text-right text-[8px] sm:text-sm px-1 min-w-[80px]">IP</TableHead>
                    <TableHead className="text-right text-[8px] sm:text-sm px-1 min-w-[70px]">الموقع</TableHead>
                    <TableHead className="text-right text-[8px] sm:text-sm px-1 min-w-[70px]">المستخدم</TableHead>
                    <TableHead className="text-right text-[8px] sm:text-sm px-1 min-w-[50px]">المحاولات</TableHead>
                    <TableHead className="text-right text-[8px] sm:text-sm px-1 min-w-[60px] hidden sm:table-cell">النوع</TableHead>
                    <TableHead className="text-right text-[8px] sm:text-sm px-1 min-w-[50px]">الصورة</TableHead>
                    <TableHead className="text-right text-[8px] sm:text-sm px-1 min-w-[50px]">الحالة</TableHead>
                    <TableHead className="text-right text-[8px] sm:text-sm px-1 min-w-[80px]">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id} className={log.blocked ? 'bg-red-50' : ''}>
                      {user?.email === 'ss73ss73ss73@gmail.com' && (
                        <TableCell className="text-center px-1">
                          <Checkbox
                            checked={selectedLogs.has(log.id)}
                            onCheckedChange={() => toggleLogSelection(log.id)}
                            className="h-3 w-3 sm:h-4 sm:w-4"
                          />
                        </TableCell>
                      )}
                      <TableCell className="px-1">
                        <div className="text-[8px] sm:text-sm">
                          {formatDate(log.timestamp)}
                        </div>
                      </TableCell>
                      <TableCell className="px-1">
                        <code className="text-[8px] sm:text-sm">{log.ip}</code>
                      </TableCell>
                      <TableCell className="px-1">
                        <div className="flex items-center gap-0.5">
                          <MapPin className="h-2 w-2 sm:h-3 sm:w-3" />
                          <span className="text-[8px] sm:text-sm">{log.country}</span>
                          {log.city !== 'Unknown' && (
                            <span className="text-[8px] sm:text-sm text-muted-foreground hidden sm:inline">
                              , {log.city}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-1">
                        <div className="text-[8px] sm:text-sm">
                          {log.username || 'غير محدد'}
                        </div>
                        <div className="text-[6px] sm:text-xs text-muted-foreground hidden sm:block">
                          {log.fingerprint.substring(0, 8)}...
                        </div>
                      </TableCell>
                      <TableCell className="px-1">
                        <Badge variant={log.attempts >= 3 ? 'destructive' : 'secondary'} className="text-[8px] px-1 py-0">
                          {log.attempts}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-1 hidden sm:table-cell">
                        {getReportTypeBadge(log.reportType)}
                      </TableCell>
                      <TableCell className="px-1">
                        {log.imageFileName ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLog(log)}
                            className="h-5 sm:h-8 w-5 sm:w-8 p-0"
                          >
                            <Camera className="h-2 w-2 sm:h-4 sm:w-4" />
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-[8px] sm:text-sm">لا توجد</span>
                        )}
                      </TableCell>
                      <TableCell className="px-1">
                        {log.blocked ? (
                          <Badge variant="destructive" className="text-[8px] px-1 py-0">محظور</Badge>
                        ) : (
                          <Badge variant="default" className="text-[8px] px-1 py-0">مسموح</Badge>
                        )}
                      </TableCell>
                      <TableCell className="px-1">
                        <div className="flex gap-0.5 sm:gap-2 flex-wrap">
                          {log.blocked ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnblock(log.fingerprint, log.username)}
                              disabled={unblockMutation.isPending}
                              className="text-green-600 hover:text-green-700 border-green-200 hover:border-green-300 h-5 sm:h-8 text-[8px] sm:text-sm px-1 sm:px-3"
                            >
                              <CheckCircle className="h-2 w-2 sm:h-4 sm:w-4 ml-0.5 sm:ml-1" />
                              <span className="hidden sm:inline">رفع الحظر</span>
                              <span className="sm:hidden">رفع</span>
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleBlock(log.fingerprint, log.username)}
                              disabled={blockMutation.isPending}
                              className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 h-5 sm:h-8 text-[8px] sm:text-sm px-1 sm:px-3"
                            >
                              <Ban className="h-2 w-2 sm:h-4 sm:w-4 ml-0.5 sm:ml-1" />
                              <span className="hidden sm:inline">حظر</span>
                              <span className="sm:hidden">حظر</span>
                            </Button>
                          )}
                          {/* Delete button - Only for Super Admin */}
                          {user?.email === 'ss73ss73ss73@gmail.com' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteLog(log)}
                              disabled={deleteLogMutation.isPending}
                              className="text-orange-600 hover:text-orange-700 border-orange-200 hover:border-orange-300 h-5 sm:h-8 text-[8px] sm:text-sm px-1 sm:px-3"
                            >
                              <Trash2 className="h-2 w-2 sm:h-4 sm:w-4 ml-0.5 sm:ml-1" />
                              <span className="hidden sm:inline">حذف</span>
                              <span className="sm:hidden">حذف</span>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                </Table>
              </div>
            )}
            
            {!isLoading && filteredLogs.length === 0 && (
              <div className="text-center py-4 sm:py-8 text-muted-foreground text-[10px] sm:text-sm">
                لا توجد سجلات أمان للعرض
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Image Dialog */}
        <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>الصورة الأمنية</DialogTitle>
              <DialogDescription>
                صورة تم التقاطها تلقائيًا عند اكتشاف نشاط مشبوه
              </DialogDescription>
            </DialogHeader>
            {selectedLog && selectedLog.imageFileName && (
              <div className="space-y-4">
                {loadingImage ? (
                  <div className="flex justify-center items-center h-64 bg-gray-100 rounded-lg">
                    <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                    <span className="mr-2 text-gray-600">جاري تحميل الصورة...</span>
                  </div>
                ) : imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Security Capture"
                    className="w-full rounded-lg border"
                  />
                ) : (
                  <div className="flex justify-center items-center h-64 bg-red-50 rounded-lg border border-red-200">
                    <span className="text-red-600">فشل في تحميل الصورة الأمنية</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>التاريخ:</strong> {formatDate(selectedLog.timestamp)}
                  </div>
                  <div>
                    <strong>IP:</strong> {selectedLog.ip}
                  </div>
                  <div>
                    <strong>الموقع:</strong> {selectedLog.country}, {selectedLog.city}
                  </div>
                  <div>
                    <strong>المحاولات:</strong> {selectedLog.attempts}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Block Confirmation Dialog */}
        <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تأكيد حظر الجهاز</DialogTitle>
              <DialogDescription>
                هل أنت متأكد من حظر هذا الجهاز؟ سيتم منعه من الوصول للنظام نهائياً.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowBlockDialog(false)}
              >
                إلغاء
              </Button>
              <Button
                variant="destructive"
                onClick={confirmBlock}
                disabled={blockMutation.isPending}
              >
                تأكيد الحظر
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Unblock Confirmation Dialog */}
        <Dialog open={showUnblockDialog} onOpenChange={setShowUnblockDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                تأكيد رفع الحظر
              </DialogTitle>
              <DialogDescription>
                هل أنت متأكد من رفع الحظر عن هذا الجهاز؟ 
                {actionUsername && (
                  <span className="block mt-2 font-medium">
                    المستخدم: {actionUsername}
                  </span>
                )}
                <span className="block mt-1 text-xs text-muted-foreground">
                  بصمة الجهاز: {actionFingerprint.substring(0, 16)}...
                </span>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowUnblockDialog(false)}
              >
                إلغاء
              </Button>
              <Button
                onClick={confirmUnblock}
                disabled={unblockMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {unblockMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    جاري رفع الحظر...
                  </div>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 ml-1" />
                    تأكيد رفع الحظر
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Log Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-orange-600" />
                تأكيد حذف السجل
              </DialogTitle>
              <DialogDescription>
                هل أنت متأكد من حذف هذا السجل الأمني؟ هذا الإجراء لا يمكن التراجع عنه.
                {logToDelete && (
                  <div className="mt-2 p-3 bg-gray-50 rounded border">
                    <div className="text-sm font-medium">تفاصيل السجل:</div>
                    <div className="text-xs space-y-1 mt-1">
                      <div>التاريخ: {logToDelete.timestamp}</div>
                      <div>IP: {logToDelete.ip}</div>
                      <div>المستخدم: {logToDelete.username || 'غير محدد'}</div>
                      <div>النوع: {logToDelete.reportType}</div>
                    </div>
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
              >
                إلغاء
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteLog}
                disabled={deleteLogMutation.isPending}
              >
                {deleteLogMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    جاري الحذف...
                  </div>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 ml-1" />
                    تأكيد الحذف
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Clear All Logs Confirmation Dialog */}
        <Dialog open={showClearAllDialog} onOpenChange={setShowClearAllDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trash className="h-5 w-5 text-orange-600" />
                تأكيد حذف جميع السجلات الأمنية
              </DialogTitle>
              <DialogDescription>
                <div className="space-y-4">
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-2 text-orange-800 font-medium mb-2">
                      <AlertTriangle className="h-5 w-5" />
                      تحذير مهم
                    </div>
                    <div className="text-orange-700 text-sm">
                      سيتم حذف جميع السجلات الأمنية ({logs.length} سجل) مع تسجيل إجراء الحذف في النظام.
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="font-medium">ما سيحدث:</div>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 mr-4">
                      <li>حذف جميع سجلات الأمان الحالية</li>
                      <li>إنشاء سجل جديد يوثق عملية الحذف</li>
                      <li>الاحتفاظ بأثر العملية للمراجعة المستقبلية</li>
                      <li>إمكانية تتبع من قام بالحذف ومتى</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                    <div className="text-sm font-medium text-gray-800">
                      صلاحية المدير الأعلى فقط
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      المستخدم الحالي: {user?.email}
                    </div>
                  </div>
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowClearAllDialog(false)}
              >
                إلغاء
              </Button>
              <Button
                variant="destructive"
                onClick={confirmClearAllLogs}
                disabled={clearAllLogsMutation.isPending}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {clearAllLogsMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    جاري الحذف...
                  </div>
                ) : (
                  <>
                    <Trash className="h-4 w-4 ml-1" />
                    تأكيد حذف جميع السجلات
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Complete Wipe Confirmation Dialog */}
        <Dialog open={showCompleteWipeDialog} onOpenChange={setShowCompleteWipeDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-700" />
                تأكيد المسح الكامل النهائي
              </DialogTitle>
              <DialogDescription>
                <div className="space-y-3">
                  <div className="text-red-700 font-bold text-lg">
                    تحذير خطير: مسح كامل وشامل!
                  </div>
                  <div className="bg-red-100 border-2 border-red-300 rounded-lg p-4">
                    <div className="text-red-800 font-medium">
                      ⚠️ هذا الإجراء سيحذف جميع السجلات الأمنية ({logs.length} سجل) نهائياً
                    </div>
                    <div className="text-red-700 text-sm mt-2">
                      • لن يتم تسجيل أي أثر لعملية الحذف هذه<br/>
                      • لا يمكن التراجع عن هذا الإجراء أبداً<br/>
                      • سيتم فقدان جميع البيانات الأمنية التاريخية<br/>
                      • سيصبح النظام كأنه جديد تماماً
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                    <div className="text-sm font-medium text-gray-800">
                      عملية مقتصرة على المدير الأعلى فقط
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      البريد الإلكتروني: {user?.email}
                    </div>
                  </div>
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCompleteWipeDialog(false)}
              >
                إلغاء
              </Button>
              <Button
                variant="destructive"
                onClick={confirmCompleteWipe}
                disabled={completeWipeMutation.isPending}
                className="bg-red-700 hover:bg-red-800"
              >
                {completeWipeMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    جاري المسح الكامل...
                  </div>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 ml-1" />
                    مسح كامل نهائي
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}