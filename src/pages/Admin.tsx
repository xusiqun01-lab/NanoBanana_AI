import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Users, Image as ImageIcon, TrendingUp, UserX, Shield, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
  generationCount: number;
}

interface GeneratedImage {
  id: string;
  userEmail: string;
  prompt: string;
  mode: string;
  model: string;
  createdAt: string;
}

interface Stats {
  totalUsers: number;
  totalGenerations: number;
  todayGenerations: number;
  adminCount: number;
}

export default function Admin() {
  const [users, setUsers] = useState<User[]>([]);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    setCurrentUser(user);
    loadData();
  }, []);

  const loadData = () => {
    // 加载所有用户
    const savedUsers = localStorage.getItem('users');
    if (savedUsers) {
      try {
        const parsedUsers = JSON.parse(savedUsers);
        
        // 统计每个用户的生成数量
        const usersWithCount = parsedUsers.map((u: any) => {
          const userHistory = JSON.parse(localStorage.getItem(`generationHistory_${u.id}`) || '[]');
          return {
            ...u,
            generationCount: userHistory.length
          };
        });
        
        setUsers(usersWithCount);
        
        // 计算统计数据
        const today = new Date().toISOString().split('T')[0];
        let totalGenerations = 0;
        let todayGenerations = 0;
        const allImages: GeneratedImage[] = [];
        
        parsedUsers.forEach((u: any) => {
          const userHistory = JSON.parse(localStorage.getItem(`generationHistory_${u.id}`) || '[]');
          totalGenerations += userHistory.length;
          
          userHistory.forEach((img: any) => {
            if (img.createdAt?.startsWith(today)) {
              todayGenerations++;
            }
            allImages.push({
              ...img,
              userEmail: u.email
            });
          });
        });
        
        setStats({
          totalUsers: parsedUsers.length,
          totalGenerations,
          todayGenerations,
          adminCount: parsedUsers.filter((u: User) => u.role === 'admin').length,
        });
        
        // 按时间排序
        allImages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setImages(allImages);
      } catch (e) {
        console.error('Failed to parse data:', e);
      }
    }
    
    setIsLoading(false);
  };

  const handleUpdateRole = (userId: string, role: 'user' | 'admin') => {
    const updated = users.map(u => u.id === userId ? { ...u, role } : u) as User[];
    localStorage.setItem('users', JSON.stringify(updated));
    setUsers(updated);
    toast.success('用户角色更新成功');
    loadData();
  };

  const handleDeleteUser = () => {
    if (!selectedUser) return;
    
    // 删除用户
    const updated = users.filter(u => u.id !== selectedUser.id);
    localStorage.setItem('users', JSON.stringify(updated));
    
    // 删除该用户的所有数据
    localStorage.removeItem(`apiConfigs_${selectedUser.id}`);
    localStorage.removeItem(`generationHistory_${selectedUser.id}`);
    
    setUsers(updated);
    setShowDeleteDialog(false);
    setSelectedUser(null);
    toast.success('用户删除成功');
    loadData();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[hsl(var(--foreground))]">管理后台</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              管理系统用户和生成记录
            </p>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-5">
          <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">总用户数</p>
                  <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{stats.totalUsers}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-[hsl(var(--banana)/0.1)] flex items-center justify-center">
                  <Users className="w-5 h-5 text-[hsl(var(--banana))]" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">总生成次数</p>
                  <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{stats.totalGenerations}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-[hsl(var(--banana)/0.1)] flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-[hsl(var(--banana))]" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">今日生成</p>
                  <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{stats.todayGenerations}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-[hsl(var(--banana)/0.1)] flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-[hsl(var(--banana))]" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">管理员数</p>
                  <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{stats.adminCount}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-[hsl(var(--banana)/0.1)] flex items-center justify-center">
                  <Shield className="w-5 h-5 text-[hsl(var(--banana))]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 标签页 */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
          <TabsTrigger 
            value="users" 
            className="data-[state=active]:bg-[hsl(var(--banana)/0.15)] data-[state=active]:text-[hsl(var(--banana))] text-sm"
          >
            用户管理
          </TabsTrigger>
          <TabsTrigger 
            value="images" 
            className="data-[state=active]:bg-[hsl(var(--banana)/0.15)] data-[state=active]:text-[hsl(var(--banana))] text-sm"
          >
            生成记录
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-[hsl(var(--foreground))] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[hsl(var(--banana))]" />
                用户列表
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-[hsl(var(--border))]">
                    <TableHead className="text-xs text-[hsl(var(--muted-foreground))]">邮箱</TableHead>
                    <TableHead className="text-xs text-[hsl(var(--muted-foreground))]">角色</TableHead>
                    <TableHead className="text-xs text-[hsl(var(--muted-foreground))]">注册时间</TableHead>
                    <TableHead className="text-xs text-[hsl(var(--muted-foreground))]">生成次数</TableHead>
                    <TableHead className="text-xs text-[hsl(var(--muted-foreground))]">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className="border-[hsl(var(--border))]">
                      <TableCell className="text-sm text-[hsl(var(--foreground))]">{user.email}</TableCell>
                      <TableCell>
                        <Badge className={user.role === 'admin' 
                          ? 'bg-[hsl(var(--banana)/0.15)] text-[hsl(var(--banana))] border-[hsl(var(--banana)/0.3)] text-[10px]'
                          : 'bg-[hsl(var(--muted)/0.15)] text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))] text-[10px]'
                        }>
                          {user.role === 'admin' ? '管理员' : '普通用户'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-[hsl(var(--muted-foreground))]">{formatDate(user.createdAt)}</TableCell>
                      <TableCell className="text-sm text-[hsl(var(--foreground))]">{user.generationCount || 0}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Select
                            value={user.role}
                            onValueChange={(value) => handleUpdateRole(user.id, value as 'user' | 'admin')}
                          >
                            <SelectTrigger className="w-24 bg-[hsl(var(--background))] border-[hsl(var(--border))] text-[hsl(var(--foreground))] h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
                              <SelectItem value="user" className="text-[hsl(var(--foreground))] text-xs">普通用户</SelectItem>
                              <SelectItem value="admin" className="text-[hsl(var(--foreground))] text-xs">管理员</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowDeleteDialog(true);
                            }}
                            className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] h-8 w-8"
                            disabled={user.id === currentUser?.id}
                          >
                            <UserX className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="images">
          <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-[hsl(var(--foreground))] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[hsl(var(--banana))]" />
                生成记录
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-[hsl(var(--border))]">
                    <TableHead className="text-xs text-[hsl(var(--muted-foreground))]">用户</TableHead>
                    <TableHead className="text-xs text-[hsl(var(--muted-foreground))]">提示词</TableHead>
                    <TableHead className="text-xs text-[hsl(var(--muted-foreground))]">模式</TableHead>
                    <TableHead className="text-xs text-[hsl(var(--muted-foreground))]">模型</TableHead>
                    <TableHead className="text-xs text-[hsl(var(--muted-foreground))]">时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {images.slice(0, 50).map((image) => (
                    <TableRow key={image.id} className="border-[hsl(var(--border))]">
                      <TableCell className="font-medium text-sm text-[hsl(var(--foreground))]">{image.userEmail}</TableCell>
                      <TableCell className="max-w-xs truncate text-sm text-[hsl(var(--foreground))]">
                        {image.prompt}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] text-[10px]">
                          {image.mode === 'text2img' ? '文生图' : 
                           image.mode === 'img2img' ? '图生图' : '多图参考'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-[hsl(var(--muted-foreground))]">{image.model}</TableCell>
                      <TableCell className="text-xs text-[hsl(var(--muted-foreground))]">
                        {formatDate(image.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 删除确认对话框 */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
          <DialogHeader>
            <DialogTitle className="text-[hsl(var(--foreground))]">确认删除</DialogTitle>
            <DialogDescription className="text-[hsl(var(--muted-foreground))]">
              您确定要删除用户 {selectedUser?.email} 吗？此操作不可撤销，该用户的所有数据将被删除。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
              className="border-[hsl(var(--border))] text-[hsl(var(--foreground))]"
            >
              取消
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteUser}
              className="bg-[hsl(var(--destructive))] text-white"
            >
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
