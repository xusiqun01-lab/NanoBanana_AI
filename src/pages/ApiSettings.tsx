import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ExternalLink, Plus, Trash2, Check, Key, Globe, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ApiConfig {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  isDefault: boolean;
}

const PRESET_PROVIDERS = [
  {
    name: '贞贞的AI工坊',
    description: '稳定的AI图像生成服务',
    baseUrl: 'https://ai.t8star.cn/v1',
    registerUrl: 'https://ai.t8star.cn/token',
  },
  {
    name: 'SillyDream',
    description: '高性价比的AI图像生成API',
    baseUrl: 'https://wish.sillydream.top/v1',
    registerUrl: 'https://wish.sillydream.top/console/token',
  },
];

export default function ApiSettings() {
  const [apiConfigs, setApiConfigs] = useState<ApiConfig[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // 表单状态
  const [formName, setFormName] = useState('');
  const [formBaseUrl, setFormBaseUrl] = useState('');
  const [formApiKey, setFormApiKey] = useState('');

  // 获取当前用户和配置
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    setCurrentUser(user);
    
    if (user.id) {
      const saved = localStorage.getItem(`apiConfigs_${user.id}`);
      if (saved) {
        try {
          setApiConfigs(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse API configs:', e);
        }
      }
    }
  }, []);

  // 保存配置（用户隔离）
  const saveConfigs = (configs: ApiConfig[]) => {
    if (currentUser?.id) {
      localStorage.setItem(`apiConfigs_${currentUser.id}`, JSON.stringify(configs));
    }
    setApiConfigs(configs);
  };

  const handleAddConfig = () => {
    if (!formName.trim() || !formBaseUrl.trim() || !formApiKey.trim()) {
      toast.error('请填写完整信息');
      return;
    }

    const newConfig: ApiConfig = {
      id: Date.now().toString(),
      name: formName.trim(),
      baseUrl: formBaseUrl.trim(),
      apiKey: formApiKey.trim(),
      isDefault: apiConfigs.length === 0,
    };

    const updated = [...apiConfigs, newConfig];
    saveConfigs(updated);
    
    setFormName('');
    setFormBaseUrl('');
    setFormApiKey('');
    setShowAddDialog(false);
    toast.success('API配置添加成功');
  };

  const handleDeleteConfig = (id: string) => {
    const updated = apiConfigs.filter(c => c.id !== id);
    if (updated.length > 0 && !updated.some(c => c.isDefault)) {
      updated[0].isDefault = true;
    }
    saveConfigs(updated);
    toast.success('配置已删除');
  };

  const handleSetDefault = (id: string) => {
    const updated = apiConfigs.map(c => ({
      ...c,
      isDefault: c.id === id
    }));
    saveConfigs(updated);
    toast.success('默认配置已更新');
  };

  const fillPresetProvider = (provider: typeof PRESET_PROVIDERS[0]) => {
    setFormName(provider.name);
    setFormBaseUrl(provider.baseUrl);
  };

  return (
    <div className="p-6 h-full overflow-auto">
      {/* 页面标题 */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-[hsl(var(--foreground))]">API设置</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
          配置您的API密钥，开始使用AI图像生成服务
        </p>
      </div>

      {/* 推荐供应商 */}
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[hsl(var(--banana))]" />
          推荐供应商
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {PRESET_PROVIDERS.map((provider) => (
            <Card key={provider.name} className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-[hsl(var(--foreground))] text-sm">{provider.name}</h3>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                      {provider.description}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[hsl(var(--banana)/0.5)] text-[hsl(var(--banana))] hover:bg-[hsl(var(--banana)/0.1)] text-xs h-8"
                    onClick={() => window.open(provider.registerUrl, '_blank')}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    前往注册
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 我的API配置 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">我的API配置</h2>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-gradient-to-r from-amber-500 to-orange-500 text-[hsl(var(--background))] hover:from-amber-400 hover:to-orange-400 text-xs h-8"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            添加
          </Button>
        </div>

        {apiConfigs.length === 0 ? (
          <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))] border-dashed">
            <CardContent className="p-10 text-center">
              <div className="w-14 h-14 rounded-full bg-[hsl(var(--surface-elevated))] flex items-center justify-center mx-auto mb-3">
                <Key className="w-7 h-7 text-[hsl(var(--muted-foreground))]" />
              </div>
              <h3 className="text-base font-medium text-[hsl(var(--foreground))] mb-1">
                暂无API配置
              </h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
                添加您的第一个API配置，开始创作之旅
              </p>
              <Button
                onClick={() => setShowAddDialog(true)}
                className="bg-gradient-to-r from-amber-500 to-orange-500 text-[hsl(var(--background))] hover:from-amber-400 hover:to-orange-400"
              >
                <Plus className="w-4 h-4 mr-1" />
                添加配置
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {apiConfigs.map((config) => (
              <Card 
                key={config.id} 
                className={cn(
                  "bg-[hsl(var(--card))] border transition-all",
                  config.isDefault 
                    ? "border-[hsl(var(--banana)/0.5)]" 
                    : "border-[hsl(var(--border))]"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[hsl(var(--surface-elevated))] flex items-center justify-center">
                        <Key className="w-4 h-4 text-[hsl(var(--banana))]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-[hsl(var(--foreground))] text-sm">{config.name}</h3>
                          {config.isDefault && (
                            <Badge className="bg-[hsl(var(--banana)/0.15)] text-[hsl(var(--banana))] border-[hsl(var(--banana)/0.3)] text-[10px]">
                              默认
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">
                          {config.baseUrl.replace('/v1', '')} · {config.apiKey.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {!config.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetDefault(config.id)}
                          className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--banana))] h-8 text-xs"
                        >
                          <Check className="w-3.5 h-3.5 mr-1" />
                          设为默认
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteConfig(config.id)}
                        className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] h-8 w-8"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 添加配置对话框 */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-[hsl(var(--card))] border-[hsl(var(--border))] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[hsl(var(--foreground))] text-lg">添加API配置</DialogTitle>
            <DialogDescription className="text-[hsl(var(--muted-foreground))] text-sm">
              填写您的API信息，支持自定义API供应商
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* 快速选择 */}
            <div>
              <Label className="text-sm text-[hsl(var(--foreground))] mb-2 block">快速选择</Label>
              <div className="flex gap-2 flex-wrap">
                {PRESET_PROVIDERS.map((provider) => (
                  <Button
                    key={provider.name}
                    variant="outline"
                    size="sm"
                    onClick={() => fillPresetProvider(provider)}
                    className="border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface-elevated))] text-xs"
                  >
                    {provider.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm text-[hsl(var(--foreground))]">名称</Label>
              <Input
                id="name"
                placeholder="例如：贞贞的AI工坊"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="bg-[hsl(var(--background))] border-[hsl(var(--border))] text-[hsl(var(--foreground))] h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="baseUrl" className="text-sm text-[hsl(var(--foreground))]">API地址</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                <Input
                  id="baseUrl"
                  placeholder="https://api.example.com/v1"
                  value={formBaseUrl}
                  onChange={(e) => setFormBaseUrl(e.target.value)}
                  className="pl-10 bg-[hsl(var(--background))] border-[hsl(var(--border))] text-[hsl(var(--foreground))] h-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey" className="text-sm text-[hsl(var(--foreground))]">API Key</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="sk-xxxxxxxxxxxxxxxx"
                  value={formApiKey}
                  onChange={(e) => setFormApiKey(e.target.value)}
                  className="pl-10 bg-[hsl(var(--background))] border-[hsl(var(--border))] text-[hsl(var(--foreground))] h-10"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAddDialog(false)}
              className="border-[hsl(var(--border))] text-[hsl(var(--foreground))] h-10"
            >
              取消
            </Button>
            <Button
              onClick={handleAddConfig}
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-[hsl(var(--background))] hover:from-amber-400 hover:to-orange-400 h-10"
            >
              保存
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
