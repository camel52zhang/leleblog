// app/admin/layout.tsx

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  Settings, 
  Database, 
  LogOut, 
  Home, 
  PlusCircle,
  Menu,
  MessageSquare,  
  X        
} from 'lucide-react';

// 无需登录即可访问的后台页面（登录 / 找回密码 / 强制改密）。
// 这些页面面向「未登录」场景，不能被登录态守卫拦截。
const PUBLIC_ADMIN_ROUTES = ['/admin/login', '/admin/forgot-password', '/admin/change-password'];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token && !PUBLIC_ADMIN_ROUTES.includes(pathname)) {
      router.push('/admin/login');
    } else {
      setIsChecking(false);
    }
  }, [pathname, router]);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    if (confirm('确定要退出登录吗？')) {
      localStorage.removeItem('admin_token');
      sessionStorage.clear();
      router.push('/admin/login');
    }
  };

  if (PUBLIC_ADMIN_ROUTES.includes(pathname)) return <>{children}</>;

  if (isChecking) {
    return <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center text-[var(--color-text-tertiary)] font-bold">验证权限中...</div>;
  }

  const menuItems = [
    { name: '仪表盘', href: '/admin', icon: LayoutDashboard },
    { name: '文章列表', href: '/admin/posts', icon: FileText },
    { name: '写新文章', href: '/admin/posts/edit', icon: PlusCircle },
    { name: '评论管理', href: '/admin/comments', icon: MessageSquare },
    { name: '基本设置', href: '/admin/settings', icon: Settings },
    { name: '备份恢复', href: '/admin/backup', icon: Database },
  ];

  return (
    <div className="flex min-h-screen bg-[var(--color-bg-primary)] relative">
      
      {/* 手机端专用 Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)] z-[50] flex items-center justify-between px-6 shadow-sm">
        <h2 className="text-xl font-black tracking-tighter text-blue-600">LELE ADMIN</h2>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 bg-[var(--color-bg-tertiary)] rounded-xl text-[var(--color-text-secondary)] active:scale-95 transition-all"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* 侧边栏：移动端抽屉式，桌面端常驻 */}
      <aside className={`
        fixed inset-y-0 left-0 z-[60] w-64 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] flex flex-col transition-transform duration-300 ease-in-out shadow-2xl border-r border-[var(--color-border)]
        lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:z-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8">
          <h2 className="text-2xl font-black tracking-tighter text-blue-600">LELE ADMIN</h2>
          <p className="text-[10px] text-[var(--color-text-tertiary)] font-bold uppercase tracking-widest mt-1">后台控制台</p>
        </div>

        <nav className="flex-grow px-4 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[var(--color-border)] space-y-2">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] rounded-xl transition-colors font-bold text-sm">
            <Home className="w-5 h-5" /> 返回前台
          </Link>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors font-bold text-sm text-left"
          >
            <LogOut className="w-5 h-5" /> 退出登录
          </button>
        </div>
      </aside>

      {/* 移动端点击遮罩 */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[55] lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 主内容区：pt-16 适配移动端 Header 高度 */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden pt-16 lg:pt-0">
        <div className="flex-1 p-2 md:p-4 lg:p-6 flex flex-col min-h-0 bg-[var(--color-bg-primary)]">
          <div className="w-full flex-1 bg-[var(--color-bg-secondary)] rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-[var(--color-border)] overflow-hidden flex flex-col relative">
            <div className="flex-1 overflow-y-auto">
              {children}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}