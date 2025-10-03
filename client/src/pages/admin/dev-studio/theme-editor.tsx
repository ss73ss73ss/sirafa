import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Save, Eye, Palette, Download, Upload, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const AUTHORIZED_EMAIL = "ss73ss73ss73@gmail.com";

interface ThemeTokens {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    muted: string;
    border: string;
    destructive: string;
    success: string;
    warning: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      "2xl": string;
    };
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

const DEFAULT_THEME: ThemeTokens = {
  colors: {
    primary: "#3b82f6",
    secondary: "#64748b", 
    accent: "#f59e0b",
    background: "#ffffff",
    foreground: "#0f172a",
    muted: "#f8fafc",
    border: "#e2e8f0",
    destructive: "#ef4444",
    success: "#10b981",
    warning: "#f59e0b"
  },
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem", 
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem"
  },
  typography: {
    fontFamily: "'Tajawal', sans-serif",
    fontSize: {
      xs: "0.75rem",
      sm: "0.875rem",
      base: "1rem", 
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem"
    }
  },
  borderRadius: {
    sm: "0.25rem",
    md: "0.375rem",
    lg: "0.5rem",
    xl: "0.75rem"
  }
};

export default function ThemeEditor() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentTheme, setCurrentTheme] = useState<ThemeTokens>(DEFAULT_THEME);
  const [previewMode, setPreviewMode] = useState(false);
  const [savedThemes, setSavedThemes] = useState<any[]>([]);

  // حماية الوصول
  useEffect(() => {
    if (user && user.email !== AUTHORIZED_EMAIL) {
      setLocation('/');
      return;
    }
  }, [user, setLocation]);

  // تحميل السمات المحفوظة
  useEffect(() => {
    if (user && user.email === AUTHORIZED_EMAIL) {
      loadSavedThemes();
    }
  }, [user]);

  const loadSavedThemes = async () => {
    try {
      const response = await apiRequest('/api/dev-studio/themes', 'GET');
      const themes = await response.json();
      setSavedThemes(themes);
      // تحميل السمة النشطة إن وجدت
      const activeTheme = themes.find((theme: any) => theme.isActive);
      if (activeTheme && activeTheme.tokens) {
        setCurrentTheme(activeTheme.tokens);
      }
    } catch (error) {
      console.error("Error loading themes:", error);
    }
  };

  if (!user || user.email !== AUTHORIZED_EMAIL) {
    return null;
  }

  const handleColorChange = (key: keyof ThemeTokens['colors'], value: string) => {
    setCurrentTheme(prev => {
      const newTheme = {
        ...prev,
        colors: {
          ...prev.colors,
          [key]: value
        }
      };
      
      // تطبيق التغيير مباشرة على الواجهة
      setTimeout(() => {
        const root = document.documentElement;
        root.style.setProperty(`--${key}`, value);
        root.style.setProperty(`--color-${key}`, value);
        
        // تطبيق ألوان محددة
        if (key === 'primary') {
          root.style.setProperty('--primary', value);
          root.style.setProperty('--primary-foreground', '#ffffff');
          // تطبيق على جميع الأزرار الأساسية
          const primaryButtons = document.querySelectorAll('button[class*="bg-primary"], .bg-primary, [class*="btn-primary"]');
          primaryButtons.forEach(button => {
            (button as HTMLElement).style.backgroundColor = value;
            (button as HTMLElement).style.color = '#ffffff';
          });
        }
        if (key === 'secondary') {
          root.style.setProperty('--secondary', value);
          // تطبيق على جميع الأزرار الثانوية
          const secondaryButtons = document.querySelectorAll('button[variant="outline"], .bg-secondary, [class*="btn-secondary"]');
          secondaryButtons.forEach(button => {
            (button as HTMLElement).style.borderColor = value;
            (button as HTMLElement).style.color = value;
          });
        }
        if (key === 'destructive') {
          root.style.setProperty('--destructive', value);
          root.style.setProperty('--destructive-foreground', '#ffffff');
          // تطبيق على جميع أزرار الخطر
          const destructiveButtons = document.querySelectorAll('button[variant="destructive"], .bg-destructive, [class*="btn-destructive"]');
          destructiveButtons.forEach(button => {
            (button as HTMLElement).style.backgroundColor = value;
            (button as HTMLElement).style.color = '#ffffff';
          });
        }
        if (key === 'background') {
          root.style.setProperty('--background', value);
          // تطبيق اللون على الـ body مباشرة
          document.body.style.backgroundColor = value;
          // تطبيق على كل العناصر التي تستخدم bg-background
          const elements = document.querySelectorAll('.bg-background, [class*="bg-background"]');
          elements.forEach(element => {
            (element as HTMLElement).style.backgroundColor = value;
          });
        }
        if (key === 'foreground') {
          root.style.setProperty('--foreground', value);
          // تطبيق لون النص على الـ body
          document.body.style.color = value;
        }
        if (key === 'muted') {
          root.style.setProperty('--muted', value);
        }
      }, 0);
      
      return newTheme;
    });
  };

  const handleApplyTheme = () => {
    // تطبيق السمة على CSS variables
    const root = document.documentElement;
    
    // تطبيق الألوان
    Object.entries(currentTheme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
      root.style.setProperty(`--color-${key}`, value);
    });

    // تطبيق ألوان الأزرار بشكل خاص
    root.style.setProperty('--primary', currentTheme.colors.primary);
    root.style.setProperty('--primary-foreground', '#ffffff');
    root.style.setProperty('--secondary', currentTheme.colors.secondary);
    root.style.setProperty('--secondary-foreground', currentTheme.colors.foreground);
    root.style.setProperty('--destructive', currentTheme.colors.destructive);
    root.style.setProperty('--destructive-foreground', '#ffffff');

    // تطبيق خلفية الصفحة مباشرة
    document.body.style.backgroundColor = currentTheme.colors.background;
    document.body.style.color = currentTheme.colors.foreground;
    
    // تطبيق على كل العناصر التي تستخدم bg-background
    const backgroundElements = document.querySelectorAll('.bg-background, [class*="bg-background"]');
    backgroundElements.forEach(element => {
      (element as HTMLElement).style.backgroundColor = currentTheme.colors.background;
    });

    // تطبيق على العناصر المخففة
    const mutedElements = document.querySelectorAll('.bg-muted, [class*="bg-muted"]');
    mutedElements.forEach(element => {
      (element as HTMLElement).style.backgroundColor = currentTheme.colors.muted;
    });

    // تطبيق على جميع الأزرار الأساسية
    const allPrimaryButtons = document.querySelectorAll('button[class*="bg-primary"], .bg-primary, [class*="btn-primary"], button:not([variant]):not([class*="outline"]):not([class*="destructive"]):not([class*="ghost"]):not([class*="link"])');
    allPrimaryButtons.forEach(button => {
      (button as HTMLElement).style.backgroundColor = currentTheme.colors.primary;
      (button as HTMLElement).style.color = '#ffffff';
      (button as HTMLElement).style.borderColor = currentTheme.colors.primary;
    });

    // تطبيق على جميع الأزرار الثانوية (outline)
    const allSecondaryButtons = document.querySelectorAll('button[variant="outline"], [class*="outline"], button[class*="btn-outline"]');
    allSecondaryButtons.forEach(button => {
      (button as HTMLElement).style.backgroundColor = 'transparent';
      (button as HTMLElement).style.borderColor = currentTheme.colors.secondary;
      (button as HTMLElement).style.color = currentTheme.colors.secondary;
    });

    // تطبيق على جميع أزرار الخطر
    const allDestructiveButtons = document.querySelectorAll('button[variant="destructive"], .bg-destructive, [class*="btn-destructive"]');
    allDestructiveButtons.forEach(button => {
      (button as HTMLElement).style.backgroundColor = currentTheme.colors.destructive;
      (button as HTMLElement).style.color = '#ffffff';
      (button as HTMLElement).style.borderColor = currentTheme.colors.destructive;
    });

    Object.entries(currentTheme.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, value);
    });

    Object.entries(currentTheme.borderRadius).forEach(([key, value]) => {
      root.style.setProperty(`--radius-${key}`, value);
    });

    root.style.setProperty('--font-family', currentTheme.typography.fontFamily);

    // تطبيق قوي على جميع الأزرار بغض النظر عن أصنافها
    const allButtons = document.querySelectorAll('button');
    allButtons.forEach(button => {
      const buttonElement = button as HTMLElement;
      const classes = buttonElement.className;
      
      // إذا كان الزر يحتوي على destructive
      if (classes.includes('destructive') || buttonElement.getAttribute('variant') === 'destructive') {
        buttonElement.style.backgroundColor = currentTheme.colors.destructive;
        buttonElement.style.color = '#ffffff';
        buttonElement.style.borderColor = currentTheme.colors.destructive;
      }
      // إذا كان الزر outline
      else if (classes.includes('outline') || buttonElement.getAttribute('variant') === 'outline') {
        buttonElement.style.backgroundColor = 'transparent';
        buttonElement.style.borderColor = currentTheme.colors.secondary;
        buttonElement.style.color = currentTheme.colors.secondary;
      }
      // إذا كان الزر ghost
      else if (classes.includes('ghost') || buttonElement.getAttribute('variant') === 'ghost') {
        buttonElement.style.backgroundColor = 'transparent';
        buttonElement.style.color = currentTheme.colors.foreground;
        buttonElement.style.border = 'none';
      }
      // الأزرار الأساسية (افتراضي)
      else if (!classes.includes('link')) {
        buttonElement.style.backgroundColor = currentTheme.colors.primary;
        buttonElement.style.color = '#ffffff';
        buttonElement.style.borderColor = currentTheme.colors.primary;
      }
    });

    toast({
      title: "تم تطبيق السمة",
      description: "تم تطبيق السمة الجديدة بنجاح على جميع الأزرار والعناصر والخلفيات",
    });
  };

  const handleResetTheme = () => {
    setCurrentTheme(DEFAULT_THEME);
    toast({
      title: "تم إعادة تعيين السمة",
      description: "تم إعادة السمة إلى الإعدادات الافتراضية",
    });
  };

  const handleSaveTheme = async () => {
    try {
      const timestamp = new Date().toLocaleString('ar-SA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      
      const response = await apiRequest('/api/dev-studio/themes', 'POST', {
        name: `سمة مخصصة - ${timestamp}`,
        tokens: currentTheme,
        isActive: true
      });

      const result = await response.json();
      
      // إعادة تحميل السمات المحفوظة
      await loadSavedThemes();
      
      toast({
        title: "تم حفظ السمة",
        description: "تم حفظ السمة بنجاح في قاعدة البيانات",
      });
    } catch (error) {
      console.error("Error saving theme:", error);
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ السمة",
        variant: "destructive",
      });
    }
  };

  const ColorPicker = ({ label, value, onChange }: { 
    label: string; 
    value: string; 
    onChange: (value: string) => void;
  }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex items-center space-x-3 space-x-reverse">
        <div 
          className="w-10 h-10 rounded-md border-2 border-gray-200 cursor-pointer"
          style={{ backgroundColor: value }}
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'color';
            input.value = value;
            input.onchange = (e) => onChange((e.target as HTMLInputElement).value);
            input.click();
          }}
        />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 font-mono text-sm"
          placeholder="#000000"
        />
      </div>
    </div>
  );

  return (
    <div className="h-screen flex" dir="rtl">
      {/* الشريط الجانبي - أدوات التحرير */}
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
            <h2 className="font-bold">مُحرر السمات</h2>
          </div>
          
          <div className="flex space-x-2 space-x-reverse">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleApplyTheme}
              style={{ 
                borderColor: currentTheme.colors.secondary,
                color: currentTheme.colors.secondary 
              }}
            >
              <Eye className="h-4 w-4 ml-2" />
              معاينة
            </Button>
            <Button 
              size="sm"
              onClick={handleSaveTheme}
              style={{ 
                backgroundColor: currentTheme.colors.primary,
                color: '#ffffff'
              }}
            >
              <Save className="h-4 w-4 ml-2" />
              حفظ
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleResetTheme}
              style={{ 
                backgroundColor: currentTheme.colors.destructive,
                color: '#ffffff'
              }}
            >
              إعادة تعيين
            </Button>
          </div>
        </div>

        <div className="p-4">
          <Tabs defaultValue="colors" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="colors">الألوان</TabsTrigger>
              <TabsTrigger value="typography">النصوص</TabsTrigger>
              <TabsTrigger value="spacing">المسافات</TabsTrigger>
            </TabsList>

            <TabsContent value="colors" className="space-y-4">
              {/* قائمة السمات المحفوظة */}
              {savedThemes.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">السمات المحفوظة</h4>
                  <div className="space-y-2">
                    {savedThemes.map((theme: any) => (
                      <div key={theme.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex-1">
                          <span className="text-sm">{theme.name}</span>
                          {theme.isActive && (
                            <span className="text-xs text-green-600 mr-2">(نشطة)</span>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (theme.tokens) {
                              setCurrentTheme(theme.tokens);
                              toast({
                                title: "تم تحميل السمة",
                                description: `تم تحميل سمة "${theme.name}"`,
                              });
                            }
                          }}
                        >
                          تحميل
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Separator />
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-3">الألوان الأساسية</h4>
                  <div className="space-y-3">
                    <ColorPicker
                      label="اللون الأساسي"
                      value={currentTheme.colors.primary}
                      onChange={(value) => handleColorChange('primary', value)}
                    />
                    <ColorPicker
                      label="اللون الثانوي"
                      value={currentTheme.colors.secondary}
                      onChange={(value) => handleColorChange('secondary', value)}
                    />
                    <ColorPicker
                      label="لون التمييز"
                      value={currentTheme.colors.accent}
                      onChange={(value) => handleColorChange('accent', value)}
                    />
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-3">ألوان الخلفية</h4>
                  <div className="space-y-3">
                    <ColorPicker
                      label="خلفية رئيسية"
                      value={currentTheme.colors.background}
                      onChange={(value) => handleColorChange('background', value)}
                    />
                    <ColorPicker
                      label="خلفية مخففة"
                      value={currentTheme.colors.muted}
                      onChange={(value) => handleColorChange('muted', value)}
                    />
                    <ColorPicker
                      label="النص الأساسي"
                      value={currentTheme.colors.foreground}
                      onChange={(value) => handleColorChange('foreground', value)}
                    />
                  </div>
                  
                  <div className="mt-4 p-3 border rounded" style={{ backgroundColor: currentTheme.colors.background, color: currentTheme.colors.foreground }}>
                    <h5 className="text-sm font-medium mb-2">معاينة الخلفية:</h5>
                    <div className="space-y-2">
                      <div className="p-2 rounded" style={{ backgroundColor: currentTheme.colors.muted }}>
                        خلفية مخففة
                      </div>
                      <div className="text-sm">
                        هذا نص بلون النص الأساسي على الخلفية الرئيسية
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-3">ألوان الحالة</h4>
                  <div className="space-y-3">
                    <ColorPicker
                      label="نجاح"
                      value={currentTheme.colors.success}
                      onChange={(value) => handleColorChange('success', value)}
                    />
                    <ColorPicker
                      label="تحذير"
                      value={currentTheme.colors.warning}
                      onChange={(value) => handleColorChange('warning', value)}
                    />
                    <ColorPicker
                      label="خطر"
                      value={currentTheme.colors.destructive}
                      onChange={(value) => handleColorChange('destructive', value)}
                    />
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-3">ألوان الأزرار</h4>
                  <div className="space-y-3">
                    <ColorPicker
                      label="زر أساسي"
                      value={currentTheme.colors.primary}
                      onChange={(value) => handleColorChange('primary', value)}
                    />
                    <ColorPicker
                      label="زر ثانوي"
                      value={currentTheme.colors.secondary}
                      onChange={(value) => handleColorChange('secondary', value)}
                    />
                    <ColorPicker
                      label="زر التأكيد"
                      value={currentTheme.colors.success}
                      onChange={(value) => handleColorChange('success', value)}
                    />
                    <ColorPicker
                      label="زر الإلغاء"
                      value={currentTheme.colors.destructive}
                      onChange={(value) => handleColorChange('destructive', value)}
                    />
                  </div>
                  
                  <div className="mt-4 p-3 border rounded bg-muted/50">
                    <h5 className="text-sm font-medium mb-2">معاينة الأزرار:</h5>
                    <div className="flex gap-2 flex-wrap">
                      <button 
                        className="px-3 py-1 rounded text-sm text-white"
                        style={{ backgroundColor: currentTheme.colors.primary }}
                      >
                        زر أساسي
                      </button>
                      <button 
                        className="px-3 py-1 rounded text-sm border"
                        style={{ 
                          borderColor: currentTheme.colors.secondary,
                          color: currentTheme.colors.secondary 
                        }}
                      >
                        زر ثانوي
                      </button>
                      <button 
                        className="px-3 py-1 rounded text-sm text-white"
                        style={{ backgroundColor: currentTheme.colors.success }}
                      >
                        تأكيد
                      </button>
                      <button 
                        className="px-3 py-1 rounded text-sm text-white"
                        style={{ backgroundColor: currentTheme.colors.destructive }}
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="typography" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fontFamily">خط الكتابة</Label>
                  <Input
                    id="fontFamily"
                    value={currentTheme.typography.fontFamily}
                    onChange={(e) => setCurrentTheme(prev => ({
                      ...prev,
                      typography: {
                        ...prev.typography,
                        fontFamily: e.target.value
                      }
                    }))}
                    placeholder="'Tajawal', sans-serif"
                  />
                </div>

                <div>
                  <h4 className="font-medium mb-3">أحجام الخط</h4>
                  <div className="space-y-3">
                    {Object.entries(currentTheme.typography.fontSize).map(([key, value]) => (
                      <div key={key}>
                        <Label className="text-sm">{key}</Label>
                        <Input
                          type="text"
                          value={value}
                          onChange={(e) => setCurrentTheme(prev => ({
                            ...prev,
                            typography: {
                              ...prev.typography,
                              fontSize: {
                                ...prev.typography.fontSize,
                                [key]: e.target.value
                              }
                            }
                          }))}
                          className="mt-1"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="spacing" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-3">المسافات</h4>
                  <div className="space-y-3">
                    {Object.entries(currentTheme.spacing).map(([key, value]) => (
                      <div key={key}>
                        <Label className="text-sm">{key}</Label>
                        <Input
                          type="text"
                          value={value}
                          onChange={(e) => setCurrentTheme(prev => ({
                            ...prev,
                            spacing: {
                              ...prev.spacing,
                              [key]: e.target.value
                            }
                          }))}
                          className="mt-1"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-3">زوايا الحدود</h4>
                  <div className="space-y-3">
                    {Object.entries(currentTheme.borderRadius).map(([key, value]) => (
                      <div key={key}>
                        <Label className="text-sm">{key}</Label>
                        <Input
                          type="text"
                          value={value}
                          onChange={(e) => setCurrentTheme(prev => ({
                            ...prev,
                            borderRadius: {
                              ...prev.borderRadius,
                              [key]: e.target.value
                            }
                          }))}
                          className="mt-1"
                        />
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 p-3 border rounded bg-muted/50">
                    <h5 className="text-sm font-medium mb-2">معاينة أشكال الأزرار:</h5>
                    <div className="flex gap-2 flex-wrap">
                      <button 
                        className="px-4 py-2 text-sm text-white"
                        style={{ 
                          backgroundColor: currentTheme.colors.primary,
                          borderRadius: currentTheme.borderRadius.default
                        }}
                      >
                        زر عادي ({currentTheme.borderRadius.default})
                      </button>
                      <button 
                        className="px-4 py-2 text-sm text-white"
                        style={{ 
                          backgroundColor: currentTheme.colors.success,
                          borderRadius: currentTheme.borderRadius.small
                        }}
                      >
                        زر صغير ({currentTheme.borderRadius.small})
                      </button>
                      <button 
                        className="px-4 py-2 text-sm text-white"
                        style={{ 
                          backgroundColor: currentTheme.colors.secondary,
                          borderRadius: currentTheme.borderRadius.large
                        }}
                      >
                        زر كبير ({currentTheme.borderRadius.large})
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 pt-4 border-t">
            <div className="flex space-x-2 space-x-reverse">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleResetTheme}
                className="flex-1"
              >
                <RotateCcw className="h-4 w-4 ml-2" />
                إعادة تعيين
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="flex-1"
              >
                <Download className="h-4 w-4 ml-2" />
                تصدير
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* منطقة المعاينة */}
      <div className="flex-1 p-6 bg-gray-50">
        <div className="bg-white rounded-lg shadow-sm border min-h-full">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">معاينة السمة</h3>
              <Badge>معاينة مباشرة</Badge>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* عرض الألوان */}
            <div>
              <h4 className="font-medium mb-4">لوحة الألوان</h4>
              <div className="grid grid-cols-5 gap-3">
                {Object.entries(currentTheme.colors).map(([key, value]) => (
                  <div key={key} className="text-center">
                    <div 
                      className="w-full h-16 rounded-lg border shadow-sm mb-2"
                      style={{ backgroundColor: value }}
                    />
                    <div className="text-xs font-medium">{key}</div>
                    <div className="text-xs text-muted-foreground font-mono">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* عرض المكونات */}
            <div>
              <h4 className="font-medium mb-4">عرض المكونات</h4>
              <div className="space-y-4">
                <div className="flex space-x-3 space-x-reverse">
                  <Button>زر أساسي</Button>
                  <Button variant="outline">زر فرعي</Button>
                  <Button variant="destructive">زر خطر</Button>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>بطاقة تجريبية</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      هذا مثال على بطاقة بالسمة الجديدة. يمكنك رؤية كيف تبدو الألوان والخطوط.
                    </p>
                  </CardContent>
                </Card>

                <div className="space-y-2">
                  <h5 className="font-medium">أحجام النصوص</h5>
                  <div className="space-y-1">
                    <div style={{ fontSize: currentTheme.typography.fontSize.xs }}>نص صغير جداً</div>
                    <div style={{ fontSize: currentTheme.typography.fontSize.sm }}>نص صغير</div>
                    <div style={{ fontSize: currentTheme.typography.fontSize.base }}>نص عادي</div>
                    <div style={{ fontSize: currentTheme.typography.fontSize.lg }}>نص كبير</div>
                    <div style={{ fontSize: currentTheme.typography.fontSize.xl }}>نص كبير جداً</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}