import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Home, 
  PenTool, 
  Image, 
  Images, 
  History, 
  Settings, 
  Shield, 
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  section?: string;
}

// 香蕉Logo SVG组件
const BananaLogo = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
    <defs>
      <linearGradient id="bananaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fbbf24" />
        <stop offset="50%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#ea580c" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <path 
      d="M12 36c8-4 16-8 20-16 2-4 2-8 0-12-2 4-6 8-10 10-6 4-14 8-18 14-2 4 4 6 8 4z" 
      fill="url(#bananaGrad)" 
      filter="url(#glow)"
    />
    <path 
      d="M32 8c2-2 4-2 6 0" 
      stroke="#166534" 
      strokeWidth="2" 
      strokeLinecap="round"
    />
    <ellipse cx="34" cy="8" rx="2" ry="3" fill="#166534" />
  </svg>
);

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems: NavItem[] = [
    { path: '/', label: '首页', icon: Home, section: '创作' },
    { path: '/text2img', label: '文生图', icon: PenTool, section: '创作' },
    { path: '/img2img', label: '图生图', icon: Image, section: '创作' },
    { path: '/multiimg', label: '多图参考', icon: Images, section: '创作' },
    { path: '/history', label: '图库', icon: History, section: '管理' },
    { path: '/api-settings', label: 'API设置', icon: Settings, section: '管理' },
  ];

  if (user?.role === 'admin') {
    navItems.push({ path: '/admin', label: '管理后台', icon: Shield, section: '管理' });
  }

  const isActive = (path: string) => location.pathname === path;

  const groupedNav = navItems.reduce((acc, item) => {
    const section = item.section || '其他';
    if (!acc[section]) acc[section] = [];
    acc[section].push(item);
    return acc;
  }, {} as Record<string, NavItem[]>);

  return (
    <aside className="w-64 h-screen bg-[hsl(var(--sidebar-background))] border-r border-[hsl(var(--sidebar-border))] flex flex-col fixed left-0 top-0 z-50">
      {/* Logo */}
      <div className="p-5 border-b border-[hsl(var(--sidebar-border))]">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-orange-600 flex items-center justify-center glow-orange group-hover:scale-105 transition-transform duration-300">
              <BananaLogo />
            </div>
            {/* 微光效果 */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-amber-400/30 to-orange-500/30 blur-xl opacity-60 group-hover:opacity-80 transition-opacity"></div>
          </div>
          <div>
            <h1 className="font-bold text-xl text-[hsl(var(--foreground))] tracking-tight">
              香蕉 <span className="text-[hsl(var(--banana))]">AI</span>
            </h1>
            <p className="text-xs text-[hsl(var(--muted-foreground))] font-medium">专业图像生成</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {Object.entries(groupedNav).map(([section, items]) => (
          <div key={section} className="mb-5">
            <h3 className="px-3 mb-2 text-[11px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-widest">
              {section}
            </h3>
            <div className="space-y-1">
              {items.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive(item.path)
                      ? "bg-gradient-to-r from-[hsl(var(--banana)/0.15)] to-transparent text-[hsl(var(--banana))] border-l-2 border-[hsl(var(--banana))]"
                      : "text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--foreground))] border-l-2 border-transparent"
                  )}
                >
                  <item.icon className={cn(
                    "w-[18px] h-[18px] transition-colors",
                    isActive(item.path) ? "text-[hsl(var(--banana))]" : "text-[hsl(var(--muted-foreground))]"
                  )} />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-[hsl(var(--sidebar-border))]">
        <div className="flex items-center gap-3 mb-3 p-2 rounded-lg bg-[hsl(var(--surface))]">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-[hsl(var(--banana)/0.3)]">
            <span className="text-sm font-bold text-[hsl(var(--banana))]">
              {user?.email?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[hsl(var(--foreground))] truncate">
              {user?.email}
            </p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              {user?.role === 'admin' ? '管理员' : '普通用户'}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.1)] transition-all"
        >
          <LogOut className="w-4 h-4" />
          退出登录
        </button>
      </div>
    </aside>
  );
}
