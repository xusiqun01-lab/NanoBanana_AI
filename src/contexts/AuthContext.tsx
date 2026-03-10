import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
  generationCount?: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 模拟API调用
const mockAPI = {
  getUsers: (): Array<{id: string, email: string, password: string, role: 'user' | 'admin', createdAt: string, generationCount: number}> => {
    const users = localStorage.getItem('users');
    return users ? JSON.parse(users) : [];
  },
  
  saveUsers: (users: any[]) => {
    localStorage.setItem('users', JSON.stringify(users));
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 检查本地存储的登录状态
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('currentUser');
      }
    }
    setIsLoading(false);
  }, []);

  const refreshUser = async () => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  };

  const login = async (email: string, password: string) => {
    const users = mockAPI.getUsers();
    const foundUser = users.find(u => u.email === email && u.password === password);
    
    if (!foundUser) {
      throw new Error('邮箱或密码错误');
    }
    
    const userData = {
      id: foundUser.id,
      email: foundUser.email,
      role: foundUser.role,
      generationCount: foundUser.generationCount || 0
    };
    
    localStorage.setItem('currentUser', JSON.stringify(userData));
    setUser(userData);
  };

  const register = async (email: string, password: string) => {
    const users = mockAPI.getUsers();
    
    // 检查邮箱是否已存在
    if (users.find(u => u.email === email)) {
      throw new Error('该邮箱已被注册');
    }
    
    // 第一个用户为管理员
    const isFirstUser = users.length === 0;
    
    const newUser = {
      id: Date.now().toString(),
      email,
      password, // 实际应用中应该加密
      role: (isFirstUser ? 'admin' : 'user') as 'user' | 'admin',
      createdAt: new Date().toISOString(),
      generationCount: 0
    };
    
    users.push(newUser);
    mockAPI.saveUsers(users);
    
    const userData: User = {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      generationCount: 0
    };
    
    localStorage.setItem('currentUser', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('currentUser');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
