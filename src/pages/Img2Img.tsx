import { useState, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, Image, Download, AlertCircle, ImageOff, X, Sparkles, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const MODELS = [
  { id: 'gemini-3-pro-image-preview', name: 'Gemini 3 Pro Image' },
  { id: 'gemini-3.1-flash-image-preview', name: 'Gemini 3.1 Flash Image' },
  { id: 'gemini-2.5-flash-image', name: 'Gemini 2.5 Flash Image' },
];

const ASPECT_RATIOS = [
  { id: 'original', name: '保持原始', description: '与参考图相同' },
  { id: '1:1', name: '1:1 正方形', description: '1:1' },
  { id: '2:3', name: '2:3 竖屏', description: '2:3' },
  { id: '3:2', name: '3:2 横屏', description: '3:2' },
  { id: '3:4', name: '3:4 竖屏', description: '3:4' },
  { id: '4:3', name: '4:3 横屏', description: '4:3' },
  { id: '4:5', name: '4:5 竖屏', description: '4:5' },
  { id: '5:4', name: '5:4 横屏', description: '5:4' },
  { id: '9:16', name: '9:16 竖屏', description: '9:16' },
  { id: '16:9', name: '16:9 横屏', description: '16:9' },
  { id: '21:9', name: '21:9 超宽', description: '21:9' },
];

export default function Img2Img() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('gemini-3-pro-image-preview');
  const [size, setSize] = useState<'1K' | '2K'>('1K');
  const [aspectRatio, setAspectRatio] = useState('original');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('图片大小不能超过10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setReferenceImage(e.target?.result as string);
      toast.success('图片加载成功');
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('请输入提示词');
      return;
    }

    if (!referenceImage) {
      setError('请上传参考图片');
      return;
    }

    // 检查API配置
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const configs = localStorage.getItem(`apiConfigs_${currentUser.id}`);
    if (!configs) {
      toast.error('请先配置API');
      return;
    }

    const apiConfigs = JSON.parse(configs);
    const defaultConfig = apiConfigs.find((c: any) => c.isDefault) || apiConfigs[0];

    setError('');
    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const response = await axios.post(
        `${defaultConfig.baseUrl}/chat/completions`,
        {
          model,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: referenceImage } }
              ]
            }
          ]
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
      const match = content.match(/!\[image\]\((.*?)\)/);
      
      if (match) {
        const imageUrl = match[1];
        setGeneratedImage(imageUrl);
        
        // 保存到历史记录（用户隔离）
        const historyKey = `generationHistory_${currentUser.id}`;
        const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
        const newRecord = {
          id: Date.now().toString(),
          prompt,
          mode: 'img2img',
          model,
          size,
          aspectRatio,
          imageUrl,
          createdAt: new Date().toISOString(),
          userId: currentUser.id
        };
        
        // 限制50张
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
      setError(err.response?.data?.error?.message || '图像生成失败');
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
              <Image className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[hsl(var(--foreground))]">图生图</h1>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                上传参考图片，AI基于原图创作新作品
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

      <div className="grid grid-cols-2 gap-5">
        {/* 左侧：参考图和参数 */}
        <div className="space-y-4">
          {/* 参考图上传 */}
          <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
            <CardContent className="p-4">
              <Label className="text-sm text-[hsl(var(--foreground))] mb-3 block">参考图片</Label>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInput}
                accept="image/*"
                className="hidden"
              />

              {!referenceImage ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-[hsl(var(--banana))] bg-[hsl(var(--banana)/0.05)]'
                      : 'border-[hsl(var(--border))] hover:border-[hsl(var(--banana)/0.5)] hover:bg-[hsl(var(--surface-elevated))]'
                  }`}
                >
                  <div className="w-14 h-14 rounded-full bg-[hsl(var(--surface-elevated))] flex items-center justify-center mx-auto mb-3">
                    <Upload className="w-7 h-7 text-[hsl(var(--muted-foreground))]" />
                  </div>
                  <p className="text-[hsl(var(--foreground))] font-medium mb-1 text-sm">
                    点击或拖拽上传图片
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    支持 JPG、PNG 格式，最大 10MB
                  </p>
                </div>
              ) : (
                <div className="relative">
                  <div className="rounded-xl overflow-hidden bg-[hsl(var(--background))] border border-[hsl(var(--border))]">
                    <img
                      src={referenceImage}
                      alt="参考图"
                      className="w-full h-auto max-h-[280px] object-contain"
                    />
                  </div>
                  <button
                    onClick={() => setReferenceImage(null)}
                    className="absolute top-2 right-2 w-8 h-8 bg-[hsl(var(--background)/0.9)] rounded-full flex items-center justify-center text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 参数设置 */}
          <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold text-[hsl(var(--foreground))] flex items-center gap-2 text-sm">
                <Sparkles className="w-4 h-4 text-[hsl(var(--banana))]" />
                参数设置
              </h3>
              
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
                      {s === '1K' ? '1K (1024×1024)' : '2K (2048×2048)'}
                    </button>
                  ))}
                </div>
              </div>

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
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧：提示词和结果 */}
        <div className="space-y-4">
          {/* 提示词输入 */}
          <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
            <CardContent className="p-4 space-y-3">
              <Label className="text-sm text-[hsl(var(--foreground))]">提示词</Label>
              <Textarea
                placeholder="描述您想要对图片进行的修改，例如：转换成动漫风格，添加梦幻色彩..."
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
                disabled={isGenerating || !prompt.trim() || !referenceImage}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-[hsl(var(--background))] hover:from-amber-400 hover:to-orange-400 font-semibold h-11"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Image className="w-5 h-5 mr-2" />
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
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-[hsl(var(--foreground))]">生成结果</h3>
                    <Badge variant="outline" className="border-[hsl(var(--banana)/0.3)] text-[hsl(var(--banana))] text-xs">
                      {size}
                    </Badge>
                    <Badge variant="outline" className="border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] text-xs">
                      {aspectRatio}
                    </Badge>
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
                    className="w-full h-auto max-h-[400px] object-contain"
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
                  等待生成
                </h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  上传参考图并输入提示词后点击生成
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
