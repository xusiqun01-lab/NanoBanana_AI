import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Wand2, Download, AlertCircle, ImageOff, Sparkles, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const MODELS = [
  { id: 'gemini-3-pro-image-preview', name: 'Gemini 3 Pro Image' },
  { id: 'gemini-3.1-flash-image-preview', name: 'Gemini 3.1 Flash Image' },
  { id: 'gemini-2.5-flash-image', name: 'Gemini 2.5 Flash Image' },
];

// 像素尺寸配置
const SIZE_CONFIGS = {
  '1K': { width: 1024, height: 1024, label: '1K (1024×1024)' },
  '2K': { width: 2048, height: 2048, label: '2K (2048×2048)' },
};

// 比例配置 - 计算对应尺寸
const ASPECT_RATIOS = [
  { id: 'original', name: '保持原始', description: '按模型默认输出' },
  { id: '1:1', name: '1:1 正方形', description: '1024×1024 / 2048×2048' },
  { id: '2:3', name: '2:3 竖屏', description: '768×1152 / 1536×2304' },
  { id: '3:2', name: '3:2 横屏', description: '1152×768 / 2304×1536' },
  { id: '3:4', name: '3:4 竖屏', description: '864×1152 / 1728×2304' },
  { id: '4:3', name: '4:3 横屏', description: '1152×864 / 2304×1728' },
  { id: '4:5', name: '4:5 竖屏', description: '819×1024 / 1638×2048' },
  { id: '5:4', name: '5:4 横屏', description: '1024×819 / 2048×1638' },
  { id: '9:16', name: '9:16 竖屏', description: '576×1024 / 1152×2048' },
  { id: '16:9', name: '16:9 横屏', description: '1024×576 / 2048×1152' },
  { id: '21:9', name: '21:9 超宽', description: '1024×439 / 2048×878' },
];

// 根据像素和比例计算实际尺寸
const calculateDimensions = (sizeKey: string, ratioId: string) => {
  if (ratioId === 'original') return null;
  
  const baseSize = sizeKey === '2K' ? 2048 : 1024;
  const [w, h] = ratioId.split(':').map(Number);
  
  // 以较短边为基准计算
  if (w >= h) {
    const height = baseSize;
    const width = Math.round(height * w / h);
    return { width, height };
  } else {
    const width = baseSize;
    const height = Math.round(width * h / w);
    return { width, height };
  }
};

export default function Text2Img() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('gemini-3-pro-image-preview');
  const [size, setSize] = useState<'1K' | '2K'>('1K');
  const [aspectRatio, setAspectRatio] = useState('original');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedDimensions, setGeneratedDimensions] = useState<{width: number, height: number} | null>(null);
  const [error, setError] = useState('');

  // 获取当前尺寸显示
  const currentDimensions = calculateDimensions(size, aspectRatio);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('请输入提示词');
      return;
    }

    // 检查API配置
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const configs = localStorage.getItem(`apiConfigs_${currentUser.id}`);
    if (!configs) {
      toast.error('请先配置API', { description: '前往API设置页面添加您的API配置' });
      return;
    }

    const apiConfigs = JSON.parse(configs);
    const defaultConfig = apiConfigs.find((c: any) => c.isDefault) || apiConfigs[0];
    if (!defaultConfig) {
      toast.error('没有可用的API配置');
      return;
    }

    setError('');
    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      // 在提示词中添加尺寸要求
      let enhancedPrompt = prompt;
      if (currentDimensions) {
        enhancedPrompt = `${prompt} (Generate an image with dimensions ${currentDimensions.width}x${currentDimensions.height} pixels)`;
      }

      const response = await axios.post(
        `${defaultConfig.baseUrl}/chat/completions`,
        {
          model,
          messages: [{ role: 'user', content: enhancedPrompt }]
        },
        {
          headers: {
            'Authorization': `Bearer ${defaultConfig.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 120000
        }
      );

      const content = response.data.choices?.[0]?.message?.content || '';
      
      // 提取图片URL
      const match = content.match(/!\[image\]\((.*?)\)/);
      if (match) {
        const imageUrl = match[1];
        setGeneratedImage(imageUrl);
        if (currentDimensions) {
          setGeneratedDimensions(currentDimensions);
        }
        
        // 保存到历史记录（用户隔离）
        const historyKey = `generationHistory_${currentUser.id}`;
        const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
        const newRecord = {
          id: Date.now().toString(),
          prompt,
          mode: 'text2img',
          model,
          size,
          aspectRatio,
          dimensions: currentDimensions,
          imageUrl,
          createdAt: new Date().toISOString(),
          userId: currentUser.id
        };
        
        // 限制50张，超出删除最早的
        history.unshift(newRecord);
        if (history.length > 50) {
          history.pop();
        }
        localStorage.setItem(historyKey, JSON.stringify(history));
        
        toast.success('图像生成成功！');
      } else {
        setError('未能解析生成的图像');
      }
    } catch (err: any) {
      console.error('生成错误:', err);
      setError(err.response?.data?.error?.message || '图像生成失败，请检查API配置');
      toast.error('生成失败');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `banana-ai-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('图片下载中...');
  };

  return (
    <div className="p-6 h-full overflow-auto">
      {/* 页面标题 */}
      <div className="mb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[hsl(var(--foreground))]">文生图</h1>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                输入文字描述，AI为您生成精美图片
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/api-settings')}
            className="border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]"
          >
            <Settings className="w-4 h-4 mr-2" />
            API设置
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* 左侧：参数设置 */}
        <div className="col-span-4 space-y-4">
          <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold text-[hsl(var(--foreground))] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[hsl(var(--banana))]" />
                参数设置
              </h3>
              
              {/* 模型选择 */}
              <div className="space-y-2">
                <Label className="text-sm text-[hsl(var(--foreground))]">模型</Label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger className="bg-[hsl(var(--background))] border-[hsl(var(--border))] text-[hsl(var(--foreground))] h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
                    {MODELS.map((m) => (
                      <SelectItem key={m.id} value={m.id} className="text-[hsl(var(--foreground))]">
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 像素选择 */}
              <div className="space-y-2">
                <Label className="text-sm text-[hsl(var(--foreground))]">输出像素</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(['1K', '2K'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                        size === s
                          ? 'bg-[hsl(var(--banana)/0.15)] text-[hsl(var(--banana))] border-[hsl(var(--banana)/0.5)]'
                          : 'bg-[hsl(var(--background))] text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))] hover:border-[hsl(var(--banana)/0.3)]'
                      }`}
                    >
                      {SIZE_CONFIGS[s].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 比例选择 - 下拉菜单 */}
              <div className="space-y-2">
                <Label className="text-sm text-[hsl(var(--foreground))]">宽高比例</Label>
                <Select value={aspectRatio} onValueChange={setAspectRatio}>
                  <SelectTrigger className="bg-[hsl(var(--background))] border-[hsl(var(--border))] text-[hsl(var(--foreground))] h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[hsl(var(--card))] border-[hsl(var(--border))] max-h-[280px]">
                    {ASPECT_RATIOS.map((r) => (
                      <SelectItem key={r.id} value={r.id} className="text-[hsl(var(--foreground))]">
                        <div className="flex items-center justify-between w-full">
                          <span>{r.name}</span>
                          <span className="text-xs text-[hsl(var(--muted-foreground))] ml-4">{r.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* 当前尺寸显示 */}
                {currentDimensions && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[hsl(var(--muted-foreground))]">预计输出尺寸:</span>
                    <Badge variant="outline" className="border-[hsl(var(--banana)/0.3)] text-[hsl(var(--banana))] text-xs">
                      {currentDimensions.width} × {currentDimensions.height}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧：生成区域 */}
        <div className="col-span-8 space-y-4">
          {/* 提示词输入 */}
          <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
            <CardContent className="p-4 space-y-3">
              <Label className="text-sm text-[hsl(var(--foreground))]">提示词</Label>
              <Textarea
                placeholder="描述您想要生成的图像，例如：一张美丽的日落海景图，金色的阳光洒在海面上，波光粼粼..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[100px] bg-[hsl(var(--background))] border-[hsl(var(--border))] text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] resize-none"
              />
              
              {error && (
                <div className="flex items-center gap-2 text-[hsl(var(--destructive))] text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-[hsl(var(--background))] hover:from-amber-400 hover:to-orange-400 font-semibold h-11"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5 mr-2" />
                    开始生成
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* 生成结果 */}
          {generatedImage && (
            <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-[hsl(var(--foreground))]">生成结果</h3>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="border-[hsl(var(--banana)/0.3)] text-[hsl(var(--banana))] text-xs">
                        {size}
                      </Badge>
                      <Badge variant="outline" className="border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] text-xs">
                        {aspectRatio === 'original' ? '默认比例' : aspectRatio}
                      </Badge>
                      {generatedDimensions && (
                        <Badge variant="outline" className="border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] text-xs">
                          {generatedDimensions.width}×{generatedDimensions.height}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleDownload} className="border-[hsl(var(--border))]">
                    <Download className="w-4 h-4 mr-1.5" />
                    下载
                  </Button>
                </div>
                <div className="rounded-xl overflow-hidden bg-[hsl(var(--background))] border border-[hsl(var(--border))]">
                  <img
                    src={generatedImage}
                    alt="生成的图像"
                    className="w-full h-auto max-h-[500px] object-contain"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* 空状态 */}
          {!generatedImage && !isGenerating && (
            <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))] border-dashed">
              <CardContent className="p-10 text-center">
                <div className="w-14 h-14 rounded-full bg-[hsl(var(--surface-elevated))] flex items-center justify-center mx-auto mb-3">
                  <ImageOff className="w-7 h-7 text-[hsl(var(--muted-foreground))]" />
                </div>
                <h3 className="text-base font-medium text-[hsl(var(--foreground))] mb-1">
                  准备生成
                </h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  输入提示词，选择参数后点击生成
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
