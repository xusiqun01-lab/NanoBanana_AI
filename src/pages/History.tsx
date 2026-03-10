import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, ImageOff, Wand2, Image as ImageIcon, Images, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface GeneratedImage {
  id: string;
  prompt: string;
  mode: 'text2img' | 'img2img' | 'multiImg';
  model: string;
  size: string;
  aspectRatio: string;
  imageUrl: string;
  createdAt: string;
}

export default function History() {
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    setCurrentUser(user);
    loadHistory(user.id);
  }, []);

  const loadHistory = (userId: string) => {
    // 从localStorage加载当前用户的历史记录
    const historyKey = `generationHistory_${userId}`;
    const saved = localStorage.getItem(historyKey);
    if (saved) {
      try {
        setImages(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse history:', e);
      }
    }
    setIsLoading(false);
  };

  const handleDownload = (imageUrl: string, id: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `banana-ai-${id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('图片下载中...');
  };

  const handleDelete = (id: string) => {
    if (!currentUser?.id) return;
    
    const historyKey = `generationHistory_${currentUser.id}`;
    const updated = images.filter(img => img.id !== id);
    localStorage.setItem(historyKey, JSON.stringify(updated));
    setImages(updated);
    toast.success('已删除');
  };

  const handleClearAll = () => {
    if (!currentUser?.id) return;
    if (!confirm('确定要清空所有历史记录吗？此操作不可恢复。')) return;
    
    const historyKey = `generationHistory_${currentUser.id}`;
    localStorage.setItem(historyKey, '[]');
    setImages([]);
    toast.success('历史记录已清空');
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'text2img':
        return <Wand2 className="w-3 h-3" />;
      case 'img2img':
        return <ImageIcon className="w-3 h-3" />;
      case 'multiImg':
        return <Images className="w-3 h-3" />;
      default:
        return <Wand2 className="w-3 h-3" />;
    }
  };

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case 'text2img':
        return '文生图';
      case 'img2img':
        return '图生图';
      case 'multiImg':
        return '多图参考';
      default:
        return mode;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--banana))]" />
      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-auto">
      {/* 页面标题 */}
      <div className="mb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[hsl(var(--foreground))]">图库</h1>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                查看您之前生成的所有图像（最多保留50张）
              </p>
            </div>
          </div>
          {images.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              className="border-[hsl(var(--destructive)/0.5)] text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.1)]"
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              清空全部
            </Button>
          )}
        </div>
      </div>

      {/* 存储提示 */}
      {images.length >= 45 && (
        <div className="mb-4 p-3 rounded-lg bg-[hsl(var(--banana)/0.1)] border border-[hsl(var(--banana)/0.3)] flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[hsl(var(--banana))]" />
          <span className="text-sm text-[hsl(var(--banana))]">
            图库即将满员 ({images.length}/50)，新图片将自动替换最早的记录
          </span>
        </div>
      )}

      {/* 数量指示器 */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-[hsl(var(--muted-foreground))]">
          共 {images.length} 张图片
        </span>
        <div className="w-32 h-1.5 bg-[hsl(var(--surface-elevated))] rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all"
            style={{ width: `${(images.length / 50) * 100}%` }}
          />
        </div>
      </div>

      {images.length === 0 ? (
        <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))] border-dashed">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-[hsl(var(--surface-elevated))] flex items-center justify-center mx-auto mb-4">
              <ImageOff className="w-8 h-8 text-[hsl(var(--muted-foreground))]" />
            </div>
            <h3 className="text-lg font-medium text-[hsl(var(--foreground))] mb-2">
              暂无生成记录
            </h3>
            <p className="text-[hsl(var(--muted-foreground))]">
              去生成页面创建您的第一张AI图像吧
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {images.map((image) => (
            <Card key={image.id} className="bg-[hsl(var(--card))] border-[hsl(var(--border))] overflow-hidden group">
              <div className="aspect-square bg-[hsl(var(--background))] relative overflow-hidden">
                <img
                  src={image.imageUrl}
                  alt={image.prompt}
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-2 left-2 flex gap-1">
                  <Badge className="bg-[hsl(var(--banana)/0.2)] text-[hsl(var(--banana))] border-[hsl(var(--banana)/0.3)] flex items-center gap-1 text-[10px]">
                    {getModeIcon(image.mode)}
                    {getModeLabel(image.mode)}
                  </Badge>
                </div>
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDownload(image.imageUrl, image.id)}
                    className="bg-[hsl(var(--banana))] text-[hsl(var(--background))] hover:bg-[hsl(var(--banana-dark))]"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    下载
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDelete(image.id)}
                    className="bg-[hsl(var(--destructive)/0.9)] text-white hover:bg-[hsl(var(--destructive))]"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    删除
                  </Button>
                </div>
              </div>
              <CardContent className="p-3">
                <p className="text-sm text-[hsl(var(--foreground))] line-clamp-2 mb-2">
                  {image.prompt}
                </p>
                <div className="flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))]">
                  <span className="truncate max-w-[100px]">{image.model}</span>
                  <span>{formatDate(image.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  <Badge variant="outline" className="text-[10px] border-[hsl(var(--border))]">
                    {image.size}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] border-[hsl(var(--border))]">
                    {image.aspectRatio}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
