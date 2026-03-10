import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PenTool, Image, Images, Settings, ArrowRight, Sparkles, Zap, Palette, Wand2 } from 'lucide-react';
import { useEffect, useState } from 'react';

// 香蕉Logo SVG组件
const BananaLogoLarge = () => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-16 h-16">
    <defs>
      <linearGradient id="bananaGradLarge" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fbbf24" />
        <stop offset="50%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#ea580c" />
      </linearGradient>
      <filter id="glowLarge">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <path 
      d="M16 48c10.667-5.333 21.333-10.667 26.667-21.333 2.666-5.334 2.666-10.667 0-16-2.667 5.333-8 10.666-13.334 13.333-8 5.333-18.666 10.667-24 18.667-2.666 5.333 5.334 8 10.667 5.333z" 
      fill="url(#bananaGradLarge)" 
      filter="url(#glowLarge)"
    />
    <path 
      d="M42.667 10.667c2.666-2.667 5.333-2.667 8 0" 
      stroke="#166534" 
      strokeWidth="2.5" 
      strokeLinecap="round"
    />
    <ellipse cx="45.333" cy="10.667" rx="2.667" ry="4" fill="#166534" />
  </svg>
);

export default function Home() {
  const navigate = useNavigate();
  const [hasApiConfig, setHasApiConfig] = useState(false);

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const configs = localStorage.getItem(`apiConfigs_${currentUser.id}`);
    setHasApiConfig(!!configs && JSON.parse(configs).length > 0);
  }, []);

  const features = [
    {
      icon: PenTool,
      title: '文生图',
      description: '输入文字描述，AI为您生成精美图片，支持1K/2K高清分辨率',
      path: '/text2img',
      stats: '支持多种风格',
    },
    {
      icon: Image,
      title: '图生图',
      description: '上传参考图片，AI基于原图进行风格转换或创意修改',
      path: '/img2img',
      stats: '智能风格迁移',
    },
    {
      icon: Images,
      title: '多图参考',
      description: '上传多张参考图，AI融合各图特点生成全新作品',
      path: '/multiimg',
      stats: '最多4张融合',
    },
  ];

  const highlights = [
    { icon: Zap, text: '快速生成', desc: '平均10-30秒出图' },
    { icon: Palette, text: '多种比例', desc: '支持10+种宽高比' },
    { icon: Wand2, text: '高清输出', desc: '1K/2K真实分辨率' },
  ];

  return (
    <div className="p-6 h-full overflow-auto">
      {/* Hero Section - 更紧凑 */}
      <Card className="mb-5 bg-gradient-to-br from-[hsl(var(--surface))] via-[hsl(var(--card))] to-[hsl(var(--surface-elevated))] border-[hsl(var(--border))] overflow-hidden relative">
        {/* 动态背景装饰 */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-radial from-[hsl(var(--banana)/0.08)] to-transparent rounded-full blur-3xl -translate-y-1/3 translate-x-1/4 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-radial from-[hsl(var(--orange)/0.06)] to-transparent rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>
        
        <CardContent className="p-8 relative z-10">
          <div className="flex items-center gap-8">
            {/* Logo区域 */}
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-orange-600 flex items-center justify-center glow-orange float">
                <BananaLogoLarge />
              </div>
              {/* 微光晕 */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-400/40 to-orange-500/40 blur-2xl opacity-70"></div>
            </div>
            
            {/* 文字区域 */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-2">
                欢迎使用<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 text-glow"> 香蕉 AI</span>
              </h1>
              <p className="text-base text-[hsl(var(--muted-foreground))] mb-4 max-w-xl">
                {hasApiConfig 
                  ? '配置已完成，开始您的AI图像创作之旅。支持文生图、图生图、多图参考等多种创作模式。'
                  : '配置您自己的API Key，开始专业的AI图像创作之旅。支持多种高清分辨率输出。'
                }
              </p>
              
              {/* 亮点特性 */}
              <div className="flex items-center gap-6 mb-5">
                {highlights.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[hsl(var(--banana)/0.15)] flex items-center justify-center">
                      <item.icon className="w-3.5 h-3.5 text-[hsl(var(--banana))]" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[hsl(var(--foreground))]">{item.text}</p>
                      <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => navigate('/text2img')}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 text-[hsl(var(--background))] hover:from-amber-400 hover:to-orange-400 font-semibold px-6 shine"
                  size="lg"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  开始创作
                </Button>
                {!hasApiConfig && (
                  <Button
                    variant="outline"
                    onClick={() => navigate('/api-settings')}
                    className="border-[hsl(var(--banana)/0.5)] text-[hsl(var(--banana))] hover:bg-[hsl(var(--banana)/0.1)] font-semibold px-6"
                    size="lg"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    配置API
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features Grid - 更紧凑 */}
      <div className="grid grid-cols-3 gap-4">
        {features.map((feature) => (
          <Card
            key={feature.title}
            className="bg-[hsl(var(--card))] border-[hsl(var(--border))] cursor-pointer hover-lift group overflow-hidden relative"
            onClick={() => navigate(feature.path)}
          >
            {/* 悬停背景效果 */}
            <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--banana)/0.05)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <CardContent className="p-5 relative">
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-[hsl(var(--banana)/0.2)] group-hover:border-[hsl(var(--banana)/0.4)] group-hover:scale-110 transition-all">
                  <feature.icon className="w-5 h-5 text-[hsl(var(--banana))]" />
                </div>
                <span className="text-[10px] font-medium text-[hsl(var(--muted-foreground))] bg-[hsl(var(--surface))] px-2 py-1 rounded-full">
                  {feature.stats}
                </span>
              </div>
              
              <h3 className="text-lg font-bold text-[hsl(var(--foreground))] mb-1.5 flex items-center gap-2">
                {feature.title}
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-[hsl(var(--banana))]" />
              </h3>
              
              <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
                {feature.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 底部提示 */}
      <div className="mt-5 p-4 rounded-xl bg-[hsl(var(--surface))] border border-[hsl(var(--border))] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[hsl(var(--banana))]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[hsl(var(--foreground))]">图库自动管理</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">最多保留50张生成记录，超出自动清理</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/history')}
          className="text-[hsl(var(--banana))] hover:text-[hsl(var(--banana))] hover:bg-[hsl(var(--banana)/0.1)]"
        >
          查看图库
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
