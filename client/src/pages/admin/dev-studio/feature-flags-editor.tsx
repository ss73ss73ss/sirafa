import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Plus, Save, ToggleLeft, ToggleRight, Users, User, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

const AUTHORIZED_EMAIL = "ss73ss73ss73@gmail.com";

interface FeatureFlag {
  key: string;
  description: string;
  enabled: boolean;
  perAccount: Record<string, boolean>;
  createdAt?: string;
  updatedAt?: string;
}

// أعلام الميزات المتاحة للنظام
const SYSTEM_FEATURES = [
  {
    key: "market_pro",
    description: "ميزات السوق المتقدمة - عرض تفاصيل إضافية وإحصائيات",
    category: "market"
  },
  {
    key: "advanced_charts",
    description: "المخططات البيانية المتقدمة في التقارير",
    category: "reports"
  },
  {
    key: "voice_messages",
    description: "الرسائل الصوتية في الدردشة",
    category: "chat"
  },
  {
    key: "bulk_transfers",
    description: "التحويلات المجمعة للمكاتب",
    category: "transfers"
  },
  {
    key: "multi_currency_wallet",
    description: "محفظة متعددة العملات",
    category: "wallet"
  },
  {
    key: "automated_reports",
    description: "التقارير التلقائية المجدولة",
    category: "reports"
  },
  {
    key: "commission_calculator",
    description: "حاسبة العمولة المتقدمة",
    category: "commissions"
  },
  {
    key: "kyc_verification",
    description: "نظام التحقق من الهوية المطور",
    category: "verification"
  }
];

export default function FeatureFlagsEditor() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [selectedFlag, setSelectedFlag] = useState<FeatureFlag | null>(null);
  const [newFlagData, setNewFlagData] = useState({
    key: "",
    description: "",
    enabled: false
  });
  const [accountSpecificKey, setAccountSpecificKey] = useState("");
  const [accountSpecificValue, setAccountSpecificValue] = useState(false);

  // حماية الوصول
  useEffect(() => {
    if (user && user.email !== AUTHORIZED_EMAIL) {
      setLocation('/');
      return;
    }
  }, [user, setLocation]);

  // تحميل الأعلام الموجودة (محاكي)
  useEffect(() => {
    const mockFlags: FeatureFlag[] = [
      {
        key: "market_pro",
        description: "ميزات السوق المتقدمة",
        enabled: true,
        perAccount: {"33003002": true}
      },
      {
        key: "voice_messages", 
        description: "الرسائل الصوتية في الدردشة",
        enabled: false,
        perAccount: {}
      }
    ];
    setFlags(mockFlags);
  }, []);

  if (!user || user.email !== AUTHORIZED_EMAIL) {
    return null;
  }

  const handleToggleGlobal = (key: string) => {
    setFlags(prev => prev.map(flag => 
      flag.key === key 
        ? { ...flag, enabled: !flag.enabled }
        : flag
    ));

    toast({
      title: "تم تحديث العلم",
      description: `تم ${flags.find(f => f.key === key)?.enabled ? 'تعطيل' : 'تفعيل'} الميزة على مستوى النظام`,
    });
  };

  const handleAddAccountSpecific = (flagKey: string) => {
    if (!accountSpecificKey.trim()) return;

    setFlags(prev => prev.map(flag => 
      flag.key === flagKey
        ? {
            ...flag,
            perAccount: {
              ...flag.perAccount,
              [accountSpecificKey]: accountSpecificValue
            }
          }
        : flag
    ));

    setAccountSpecificKey("");
    setAccountSpecificValue(false);

    toast({
      title: "تم إضافة استثناء",
      description: `تم تطبيق إعداد خاص للحساب ${accountSpecificKey}`,
    });
  };

  const handleRemoveAccountSpecific = (flagKey: string, accountId: string) => {
    setFlags(prev => prev.map(flag => 
      flag.key === flagKey
        ? {
            ...flag,
            perAccount: Object.fromEntries(
              Object.entries(flag.perAccount).filter(([key]) => key !== accountId)
            )
          }
        : flag
    ));
  };

  const handleCreateFlag = () => {
    if (!newFlagData.key || !newFlagData.description) return;

    const newFlag: FeatureFlag = {
      key: newFlagData.key,
      description: newFlagData.description,
      enabled: newFlagData.enabled,
      perAccount: {},
      createdAt: new Date().toISOString()
    };

    setFlags(prev => [...prev, newFlag]);
    setNewFlagData({ key: "", description: "", enabled: false });

    toast({
      title: "تم إنشاء العلم",
      description: "تم إنشاء علم ميزة جديد",
    });
  };

  const handleSaveAll = () => {
    // حفظ جميع الأعلام في قاعدة البيانات
    console.log("Saving all flags:", flags);
    toast({
      title: "تم الحفظ",
      description: "تم حفظ جميع أعلام الميزات بنجاح",
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      market: "bg-blue-500",
      reports: "bg-green-500", 
      chat: "bg-purple-500",
      transfers: "bg-orange-500",
      wallet: "bg-teal-500",
      commissions: "bg-pink-500",
      verification: "bg-indigo-500"
    };
    return colors[category] || "bg-gray-500";
  };

  return (
    <div className="h-screen flex" dir="rtl">
      {/* الشريط الجانبي */}
      <div className="w-80 border-l bg-card">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation('/admin/dev-studio')}
            >
              <ArrowLeft className="h-4 w-4 ml-2" />
              عودة
            </Button>
            <h2 className="font-bold">أعلام الميزات</h2>
          </div>
          
          <div className="flex space-x-2 space-x-reverse">
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 ml-2" />
                  علم جديد
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>إنشاء علم ميزة جديد</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="key">مفتاح الميزة</Label>
                    <Input
                      id="key"
                      placeholder="my_new_feature"
                      value={newFlagData.key}
                      onChange={(e) => setNewFlagData({...newFlagData, key: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">الوصف</Label>
                    <Textarea
                      id="description"
                      placeholder="وصف الميزة الجديدة"
                      value={newFlagData.description}
                      onChange={(e) => setNewFlagData({...newFlagData, description: e.target.value})}
                    />
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Switch
                      checked={newFlagData.enabled}
                      onCheckedChange={(checked) => setNewFlagData({...newFlagData, enabled: checked})}
                    />
                    <Label>مفعل افتراضياً</Label>
                  </div>
                  <Button onClick={handleCreateFlag} className="w-full">
                    إنشاء العلم
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button size="sm" variant="outline" onClick={handleSaveAll}>
              <Save className="h-4 w-4 ml-2" />
              حفظ الكل
            </Button>
          </div>
        </div>

        {/* قائمة الميزات المتاحة للإضافة */}
        <div className="p-4">
          <h3 className="font-medium mb-3">ميزات النظام المتاحة</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {SYSTEM_FEATURES.filter(feature => 
              !flags.some(flag => flag.key === feature.key)
            ).map((feature) => (
              <Card 
                key={feature.key}
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => {
                  const newFlag: FeatureFlag = {
                    key: feature.key,
                    description: feature.description,
                    enabled: false,
                    perAccount: {}
                  };
                  setFlags(prev => [...prev, newFlag]);
                }}
              >
                <CardContent className="p-3">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <div className={`w-3 h-3 rounded-full ${getCategoryColor(feature.category)}`} />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{feature.key}</div>
                      <div className="text-xs text-muted-foreground">
                        {feature.description}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* المنطقة الرئيسية */}
      <div className="flex-1 p-6 bg-gray-50">
        <div className="bg-white rounded-lg shadow-sm border min-h-full">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">إدارة أعلام الميزات</h3>
              <Badge variant="outline">
                {flags.filter(f => f.enabled).length} / {flags.length} مفعل
              </Badge>
            </div>
          </div>

          <div className="p-6">
            {flags.length > 0 ? (
              <div className="space-y-4">
                {flags.map((flag) => (
                  <Card key={flag.key}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">{flag.key}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {flag.description}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <Badge variant={flag.enabled ? "default" : "secondary"}>
                            {flag.enabled ? "مفعل" : "معطل"}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleGlobal(flag.key)}
                          >
                            {flag.enabled ? (
                              <ToggleRight className="h-5 w-5 text-green-500" />
                            ) : (
                              <ToggleLeft className="h-5 w-5 text-gray-400" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <Tabs defaultValue="global" className="w-full">
                        <TabsList>
                          <TabsTrigger value="global">
                            <Users className="h-4 w-4 ml-2" />
                            إعداد عام
                          </TabsTrigger>
                          <TabsTrigger value="accounts">
                            <User className="h-4 w-4 ml-2" />
                            حسابات محددة
                          </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="global" className="mt-4">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <Switch
                              checked={flag.enabled}
                              onCheckedChange={() => handleToggleGlobal(flag.key)}
                            />
                            <Label>
                              تفعيل هذه الميزة لجميع المستخدمين
                            </Label>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="accounts" className="mt-4 space-y-4">
                          <div className="flex space-x-2 space-x-reverse">
                            <Input
                              placeholder="رقم الحساب"
                              value={accountSpecificKey}
                              onChange={(e) => setAccountSpecificKey(e.target.value)}
                              className="flex-1"
                            />
                            <Switch
                              checked={accountSpecificValue}
                              onCheckedChange={setAccountSpecificValue}
                            />
                            <Button
                              size="sm"
                              onClick={() => handleAddAccountSpecific(flag.key)}
                            >
                              إضافة
                            </Button>
                          </div>
                          
                          {Object.entries(flag.perAccount).length > 0 && (
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">الاستثناءات المُعرّفة:</Label>
                              {Object.entries(flag.perAccount).map(([accountId, enabled]) => (
                                <div key={accountId} className="flex items-center justify-between p-2 bg-muted rounded">
                                  <div className="flex items-center space-x-2 space-x-reverse">
                                    <Badge variant={enabled ? "default" : "secondary"}>
                                      {accountId}
                                    </Badge>
                                    <span className="text-sm">
                                      {enabled ? "مفعل" : "معطل"}
                                    </span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveAccountSpecific(flag.key, accountId)}
                                  >
                                    إزالة
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Settings className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">لا توجد أعلام ميزات</p>
                <p>اختر ميزة من الشريط الجانبي أو أنشئ علم جديد</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}