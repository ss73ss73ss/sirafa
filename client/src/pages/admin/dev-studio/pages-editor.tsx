import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Plus, Save, Eye, ArrowLeft, Layout, Trash2, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

const AUTHORIZED_EMAIL = "ss73ss73ss73@gmail.com";

// المكونات الأساسية المتاحة للاستخدام
const AVAILABLE_COMPONENTS = [
  {
    key: "Card",
    displayName: "بطاقة",
    category: "layout",
    icon: "📋",
    description: "بطاقة بسيطة لعرض المحتوى",
    schema: {
      type: "object",
      properties: {
        title: { type: "string", title: "العنوان" },
        content: { type: "string", title: "المحتوى" },
        variant: { 
          type: "string", 
          title: "النوع",
          enum: ["default", "destructive", "outline"],
          default: "default"
        }
      },
      required: ["title"]
    }
  },
  {
    key: "DataTable",
    displayName: "جدول البيانات", 
    category: "data",
    icon: "📊",
    description: "جدول لعرض البيانات مع بحث وترتيب",
    schema: {
      type: "object",
      properties: {
        title: { type: "string", title: "عنوان الجدول" },
        dataSource: { type: "string", title: "مصدر البيانات" },
        columns: { 
          type: "array", 
          title: "الأعمدة",
          items: {
            type: "object",
            properties: {
              key: { type: "string", title: "المفتاح" },
              label: { type: "string", title: "التسمية" },
              type: { type: "string", title: "النوع", enum: ["text", "number", "date", "badge"] }
            }
          }
        }
      },
      required: ["title", "dataSource"]
    }
  },
  {
    key: "Form",
    displayName: "نموذج",
    category: "forms", 
    icon: "📝",
    description: "نموذج لإدخال البيانات",
    schema: {
      type: "object",
      properties: {
        title: { type: "string", title: "عنوان النموذج" },
        submitText: { type: "string", title: "نص زر الإرسال", default: "حفظ" },
        fields: {
          type: "array",
          title: "الحقول",
          items: {
            type: "object", 
            properties: {
              name: { type: "string", title: "اسم الحقل" },
              label: { type: "string", title: "تسمية الحقل" },
              type: { type: "string", title: "نوع الحقل", enum: ["text", "email", "number", "select", "textarea"] },
              required: { type: "boolean", title: "مطلوب" }
            }
          }
        }
      },
      required: ["title", "fields"]
    }
  },
  {
    key: "Chart",
    displayName: "مخطط بياني",
    category: "charts",
    icon: "📈", 
    description: "مخطط بياني تفاعلي",
    schema: {
      type: "object",
      properties: {
        title: { type: "string", title: "عنوان المخطط" },
        type: { 
          type: "string", 
          title: "نوع المخطط",
          enum: ["line", "bar", "pie", "area"],
          default: "bar"
        },
        dataSource: { type: "string", title: "مصدر البيانات" },
        height: { type: "number", title: "الارتفاع", default: 300 }
      },
      required: ["title", "dataSource"]
    }
  }
];

interface DevPage {
  id?: string;
  route: string;
  titleAr: string;
  layout: string;
  status: string;
  visibility: string;
  allowedRoles: string[];
  blocks?: DevBlock[];
}

interface DevBlock {
  id?: string;
  slot: string;
  componentKey: string;
  props: any;
  orderIndex: number;
}

export default function PagesEditor() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [pages, setPages] = useState<DevPage[]>([]);
  const [selectedPage, setSelectedPage] = useState<DevPage | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [pageFormData, setPageFormData] = useState<Partial<DevPage>>({
    route: "",
    titleAr: "",
    layout: "default",
    status: "draft",
    visibility: "public",
    allowedRoles: []
  });

  // حماية الوصول
  useEffect(() => {
    if (user && user.email !== AUTHORIZED_EMAIL) {
      setLocation('/');
      return;
    }
  }, [user, setLocation]);

  if (!user || user.email !== AUTHORIZED_EMAIL) {
    return null;
  }

  const handleCreatePage = () => {
    const newPage: DevPage = {
      id: Date.now().toString(),
      route: pageFormData.route || "",
      titleAr: pageFormData.titleAr || "",
      layout: pageFormData.layout || "default",
      status: "draft",
      visibility: pageFormData.visibility || "public",
      allowedRoles: pageFormData.allowedRoles || [],
      blocks: []
    };

    setPages([...pages, newPage]);
    setSelectedPage(newPage);
    setIsEditing(false);
    setPageFormData({
      route: "",
      titleAr: "",
      layout: "default",
      status: "draft",
      visibility: "public",
      allowedRoles: []
    });

    toast({
      title: "تم إنشاء الصفحة",
      description: "تم إنشاء الصفحة بنجاح كمسودة",
    });
  };

  const handleAddComponent = (componentKey: string, slot: string = "main") => {
    if (!selectedPage) return;

    const component = AVAILABLE_COMPONENTS.find(c => c.key === componentKey);
    if (!component) return;

    const newBlock: DevBlock = {
      id: Date.now().toString(),
      slot,
      componentKey,
      props: {},
      orderIndex: (selectedPage.blocks?.length || 0)
    };

    const updatedPage = {
      ...selectedPage,
      blocks: [...(selectedPage.blocks || []), newBlock]
    };

    setSelectedPage(updatedPage);
    setPages(pages.map(p => p.id === selectedPage.id ? updatedPage : p));
  };

  const handleRemoveBlock = (blockId: string) => {
    if (!selectedPage) return;

    const updatedPage = {
      ...selectedPage,
      blocks: selectedPage.blocks?.filter(b => b.id !== blockId) || []
    };

    setSelectedPage(updatedPage);
    setPages(pages.map(p => p.id === selectedPage.id ? updatedPage : p));
  };

  const renderComponentPreview = (block: DevBlock) => {
    const component = AVAILABLE_COMPONENTS.find(c => c.key === block.componentKey);
    if (!component) return null;

    return (
      <div className="border-2 border-dashed border-blue-300 p-4 rounded-lg bg-blue-50 relative group">
        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex space-x-1 space-x-reverse">
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
              <Settings className="h-3 w-3" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-6 w-6 p-0 text-red-500"
              onClick={() => handleRemoveBlock(block.id!)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        <div className="text-center py-6">
          <div className="text-2xl mb-2">{component.icon}</div>
          <div className="font-medium text-sm">{component.displayName}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {component.description}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex" dir="rtl">
      {/* الشريط الجانبي - قائمة الصفحات */}
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
            <h2 className="font-bold">مُحرر الصفحات</h2>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Plus className="h-4 w-4 ml-2" />
                صفحة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إنشاء صفحة جديدة</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="route">المسار</Label>
                  <Input
                    id="route"
                    placeholder="/my-new-page"
                    value={pageFormData.route}
                    onChange={(e) => setPageFormData({...pageFormData, route: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="title">العنوان العربي</Label>
                  <Input
                    id="title"
                    placeholder="الصفحة الجديدة"
                    value={pageFormData.titleAr}
                    onChange={(e) => setPageFormData({...pageFormData, titleAr: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="visibility">الرؤية</Label>
                  <Select 
                    value={pageFormData.visibility} 
                    onValueChange={(value) => setPageFormData({...pageFormData, visibility: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">عامة</SelectItem>
                      <SelectItem value="auth">للمسجلين فقط</SelectItem>
                      <SelectItem value="role_based">حسب الدور</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreatePage} className="w-full">
                  إنشاء الصفحة
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="p-4 space-y-2">
          {pages.map((page) => (
            <Card 
              key={page.id}
              className={`cursor-pointer transition-colors ${
                selectedPage?.id === page.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedPage(page)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{page.titleAr}</div>
                    <div className="text-xs text-muted-foreground">{page.route}</div>
                  </div>
                  <Badge variant={page.status === 'published' ? 'default' : 'secondary'}>
                    {page.status === 'published' ? 'منشور' : 'مسودة'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* المنطقة الرئيسية */}
      <div className="flex-1 flex">
        {selectedPage ? (
          <>
            {/* مساحة التصميم */}
            <div className="flex-1 p-6 bg-gray-50">
              <div className="bg-white rounded-lg shadow-sm border min-h-full">
                <div className="p-4 border-b bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg">{selectedPage.titleAr}</h3>
                      <p className="text-sm text-muted-foreground">{selectedPage.route}</p>
                    </div>
                    <div className="flex space-x-2 space-x-reverse">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 ml-2" />
                        معاينة
                      </Button>
                      <Button size="sm">
                        <Save className="h-4 w-4 ml-2" />
                        حفظ
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {selectedPage.blocks && selectedPage.blocks.length > 0 ? (
                    <div className="space-y-4">
                      {selectedPage.blocks.map((block) => (
                        <div key={block.id}>
                          {renderComponentPreview(block)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Layout className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>اسحب المكونات من الشريط الجانبي لبناء الصفحة</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* شريط المكونات */}
            <div className="w-80 border-r bg-card">
              <div className="p-4 border-b">
                <h3 className="font-bold">المكونات المتاحة</h3>
              </div>
              
              <Tabs defaultValue="all" className="p-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">الكل</TabsTrigger>
                  <TabsTrigger value="data">بيانات</TabsTrigger>
                  <TabsTrigger value="forms">نماذج</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="space-y-2 mt-4">
                  {AVAILABLE_COMPONENTS.map((component) => (
                    <Card 
                      key={component.key}
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => handleAddComponent(component.key)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <div className="text-lg">{component.icon}</div>
                          <div className="flex-1">
                            <div className="font-medium text-sm">{component.displayName}</div>
                            <div className="text-xs text-muted-foreground">
                              {component.description}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="data" className="space-y-2 mt-4">
                  {AVAILABLE_COMPONENTS.filter(c => c.category === 'data').map((component) => (
                    <Card 
                      key={component.key}
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => handleAddComponent(component.key)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <div className="text-lg">{component.icon}</div>
                          <div className="flex-1">
                            <div className="font-medium text-sm">{component.displayName}</div>
                            <div className="text-xs text-muted-foreground">
                              {component.description}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="forms" className="space-y-2 mt-4">
                  {AVAILABLE_COMPONENTS.filter(c => c.category === 'forms').map((component) => (
                    <Card 
                      key={component.key}
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => handleAddComponent(component.key)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <div className="text-lg">{component.icon}</div>
                          <div className="flex-1">
                            <div className="font-medium text-sm">{component.displayName}</div>
                            <div className="text-xs text-muted-foreground">
                              {component.description}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
              </Tabs>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Layout className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">اختر صفحة من القائمة أو أنشئ صفحة جديدة</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}