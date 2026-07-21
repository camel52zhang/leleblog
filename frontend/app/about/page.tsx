// leleblog/frontend/app/about/page.tsx

'use client';

import { Github, Code2, Rocket, Heart, Laptop, Database, Palette } from 'lucide-react';

export default function AboutPage() {
  const techStack = [
    { name: 'Next.js 14', desc: '前端框架', icon: <Rocket className="w-5 h-5 text-blue-500" />, bg: 'bg-blue-50' },
    { name: 'Golang / Gin', desc: '后端引擎', icon: <Code2 className="w-5 h-5 text-emerald-500" />, bg: 'bg-emerald-50' },
    { name: 'GORM / SQLite', desc: '持久化存储', icon: <Database className="w-5 h-5 text-amber-500" />, bg: 'bg-amber-50' },
    { name: 'Tailwind CSS', desc: '美学构筑', icon: <Palette className="w-5 h-5 text-pink-500" />, bg: 'bg-pink-50' },
    { name: 'Lucide Icons', desc: '视觉符号', icon: <Heart className="w-5 h-5 text-rose-500" />, bg: 'bg-rose-50' },
    { name: 'TypeScript', desc: '类型安全', icon: <Laptop className="w-5 h-5 text-indigo-500" />, bg: 'bg-indigo-50' },
  ];

  return (
    <main className="max-w-[1440px] mx-auto px-6 py-16 md:py-24 min-h-screen">
      <div className="max-w-4xl mx-auto">
        
        {/* 顶部标题区 */}
        <section className="text-center mb-16 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="inline-block px-4 py-1.5 mb-6 text-sm font-semibold tracking-wider text-blue-500 uppercase bg-blue-500/10 rounded-full">
            About LeleBlog
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--color-text-primary)] mb-6 tracking-tight">
            沐沐言 <span className="text-blue-500">.</span>
          </h1>
          <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto leading-relaxed font-normal">
            一个专注于记录技术成长、分享生活瞬间的纯粹空间。
            在这里，代码与灵感共存。
          </p>
        </section>

        {/* 核心卡片 */}
        <div className="grid gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
          
          {/* 关于网站 */}
          <div className="bg-[var(--color-bg-secondary)] rounded-3xl p-8 md:p-12 border border-[var(--color-border)] shadow-sm">
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-8 flex items-center gap-3">
              <Code2 className="w-8 h-8 text-blue-500" />
              构建逻辑
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {techStack.map((tech) => (
                <div key={tech.name} className="flex items-center gap-4 p-4 rounded-xl hover:bg-[var(--color-bg-hover)] transition-colors border border-transparent hover:border-[var(--color-border)] group">
                  <div className={`w-12 h-12 ${tech.bg} rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform`}>
                    {tech.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--color-text-primary)]">{tech.name}</h3>
                    <p className="text-sm text-[var(--color-text-tertiary)] font-normal">{tech.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 创作初心 */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 md:p-12 text-white overflow-hidden relative">
            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-6">创作初心</h2>
              <div className="space-y-4 text-slate-300 text-lg font-normal leading-relaxed">
                <p>
                  在这个信息碎片化的时代，拥有一块属于自己的"自留地"显得尤为珍贵。
                  <strong className="text-white font-semibold">沐沐言</strong> 不仅仅是一个博客，它是对过去思考的沉淀，也是对未来探索的注脚。
                </p>
                <p>
                  从前端的每一像素微调，到后端的每一条 SQL 优化，
                  这个项目见证了我对技术的执着与热爱。
                </p>
              </div>
              
              <div className="mt-10 flex items-center gap-6">
                <a 
                  href="https://github.com/camel52zhang/LeleBlog" 
                  target="_blank" 
                  className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 rounded-xl transition-all font-semibold text-sm"
                >
                  <Github className="w-5 h-5" />
                  GitHub 开源地址
                </a>
              </div>
            </div>
            
            {/* 装饰性背景 */}
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-blue-500/20 rounded-full blur-[100px]" />
          </div>

        </div>

        {/* 底部版权 */}
        <footer className="mt-20 text-center text-[var(--color-text-tertiary)] text-sm font-medium">
          <p>© {new Date().getFullYear()} LeleBlog. Built with passion & coffee.</p>
        </footer>

      </div>
    </main>
  );
}