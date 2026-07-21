// leleblog/frontend/app/layout.tsx

'use client';

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import SearchBox from "@/components/SearchBox";
import Footer from "@/components/Footer";
import ThemeProvider from "@/components/ThemeProvider";
import ThemeToggle from "@/components/ThemeToggle";
import { Suspense, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Home, FolderOpen, Tag, Calendar, User, ShieldCheck } from 'lucide-react';

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// --- 组件定义保持不变 ---
const ColorfulIcon = ({ icon: Icon, colorClass, isActive }: any) => {
  return (
    <div className={`
      relative flex items-center justify-center p-1.5 rounded-lg transition-all duration-300
      ${isActive ? 'bg-[var(--color-bg-secondary)] shadow-sm scale-110' : 'group-hover:bg-[var(--color-bg-hover)]'}
    `}>
      <Icon 
        className={`w-4 h-4 md:w-5 md:h-5 transition-all duration-300 ${isActive ? colorClass : 'text-[var(--color-text-tertiary)]'}`} 
        fill={isActive ? 'currentColor' : 'none'} 
        fillOpacity={0.2}
        strokeWidth={isActive ? 2.5 : 2}
      />
    </div>
  );
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // 全局站点信息状态
  const [siteConfig, setSiteConfig] = useState({
    site_name: '沐沐言的博客', 
    favicon: '/favicon.ico'
  });

  // 全局拉取配置逻辑
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await fetch('/api/config'); 
        if (!res.ok) throw new Error('Failed to fetch config');
        
        const data = await res.json();
        
        if (data && data.site_name) {
          const newFavicon = data.favicon || '/favicon.ico';
          
          setSiteConfig({
            site_name: data.site_name,
            favicon: newFavicon
          });

          document.title = data.site_name;

          const timestamp = new Date().getTime();
          const faviconUrl = `${newFavicon}${newFavicon.includes('?') ? '&' : '?'}t=${timestamp}`;
          
          let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
          }
          link.href = faviconUrl;
        }
      } catch (err) {
        console.error("加载全局配置失败", err);
        let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
        if (!link) {
           link = document.createElement('link');
           link.rel = 'icon';
           link.href = '/favicon.ico';
           document.head.appendChild(link);
        }
      }
    };
    
    loadConfig();
  }, []);

  const navLinks = [
    { name: '首页', href: '/', icon: Home, color: 'text-blue-500' },
    { name: '分类', href: '/categories', icon: FolderOpen, color: 'text-amber-500' },
    { name: '标签', href: '/tags', icon: Tag, color: 'text-emerald-500' },
    { name: '归档', href: '/archives', icon: Calendar, color: 'text-purple-500' },
    { name: '关于', href: '/about', icon: User, color: 'text-rose-500' },
  ];

  return (
    <html lang="zh" className="scroll-smooth">
      <head>
        <link rel="icon" href="/favicon.ico" key="default-favicon" />
        
        <style dangerouslySetInnerHTML={{ __html: `
          .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--color-border-hover); border-radius: 10px; transition: all 0.3s ease; }
          .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: var(--color-text-tertiary); }
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[var(--color-bg-primary)] flex flex-col min-h-screen text-[var(--color-text-primary)]`}>
        <ThemeProvider>
          <header className="bg-[var(--color-bg-secondary)]/80 backdrop-blur-xl shadow-sm border-b border-[var(--color-border)] sticky top-0 z-50 w-full group/header">
            <div className="max-w-[1440px] mx-auto px-6">
              <div className="flex flex-col">
                {/* 调整点：标题栏高度从 py-4 md:py-6 减小到 py-2 md:py-3 */}
                <div className="flex items-center py-2 md:py-3">
                  <Link href="/" className="flex-shrink-0 group">
                    {/* 标题字号稍微缩小一点 (text-2xl md:text-3xl -> text-xl md:text-2xl) 以适应窄高度 */}
                    <h1 className="text-xl md:text-2xl font-black text-[var(--color-text-primary)] tracking-tighter group-hover:text-blue-600 transition-colors uppercase">
                      {siteConfig.site_name}
                    </h1>
                  </Link>
                  
                  <div className="flex-grow flex justify-end items-center gap-3">
                    <div className="w-full lg:w-[320px]"> 
                      <Suspense fallback={<div className="w-full h-10 bg-[var(--color-bg-tertiary)] rounded-full animate-pulse" />}>
                        <SearchBox />
                      </Suspense>
                    </div>
                    <ThemeToggle />
                  </div>
                </div>

                {/* 调整点：导航栏底部间距从 pb-3 减小到 pb-1.5 */}
                <nav className="flex items-center pb-1.5 relative">
                  <div className="flex overflow-x-auto no-scrollbar gap-1 md:gap-4 items-center flex-grow py-1">
                    {navLinks.map((link) => {
                      const isActive = pathname === link.href;
                      return (
                        <Link key={link.name} href={link.href} className="group/item flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all">
                          <ColorfulIcon icon={link.icon} colorClass={link.color} isActive={isActive} />
                          <span className={`text-sm font-bold transition-colors ${isActive ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)] group-hover/item:text-[var(--color-text-primary)]'}`}>
                            {link.name}
                          </span>
                        </Link>
                      );
                    })}
                  </div>

                  <div className="flex-shrink-0 lg:w-[320px] flex justify-end items-center">
                    <Link href="/admin" className="lg:opacity-0 lg:group-hover/header:opacity-100 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-transparent hover:border-blue-100 hover:bg-[var(--color-bg-hover)] transition-all duration-500">
                      <ShieldCheck className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                      <span className="hidden md:inline text-[var(--color-text-tertiary)] font-black text-[10px] tracking-tighter uppercase">
                        Console
                      </span>
                    </Link>
                  </div>
                </nav>
              </div>
            </div>
          </header>
          
          <main className="flex-grow w-full">
            {children}
          </main>

          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}