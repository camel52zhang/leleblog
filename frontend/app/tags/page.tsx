// leleblog/frontend/app/tags/page.tsx

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Tag as TagIcon, Hash, Sparkles } from 'lucide-react';

export default function TagsPage() {
  const [tags, setTags] = useState<{ name: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 调用后端接口获取标签数据
    fetch('/api/tags/summary')
      .then(res => res.json())
      .then(data => {
        setTags(data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("加载标签失败:", err);
        setLoading(false);
      });
  }, []);

  // 预设气泡颜色样式 - 使用 CSS 变量支持暗色模式
  const bubbleStyles = [
    { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20', hover: 'hover:bg-blue-500' },
    { bg: 'bg-rose-500/10', text: 'text-rose-500', border: 'border-rose-500/20', hover: 'hover:bg-rose-500' },
    { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20', hover: 'hover:bg-amber-500' },
    { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20', hover: 'hover:bg-emerald-500' },
    { bg: 'bg-indigo-500/10', text: 'text-indigo-500', border: 'border-indigo-500/20', hover: 'hover:bg-indigo-500' },
    { bg: 'bg-violet-500/10', text: 'text-violet-500', border: 'border-violet-500/20', hover: 'hover:bg-violet-500' },
    { bg: 'bg-cyan-500/10', text: 'text-cyan-500', border: 'border-cyan-500/20', hover: 'hover:bg-cyan-500' },
  ];

  return (
    <main className="max-w-[1440px] mx-auto px-6 py-8 min-h-[80vh]">
      {/* 头部标题区域 */}
      <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="inline-flex items-center justify-center p-3 bg-[var(--color-bg-secondary)] rounded-2xl shadow-sm border border-[var(--color-border)] mb-6">
           <TagIcon className="w-8 h-8 text-blue-500" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-[var(--color-text-primary)] mb-4 tracking-tighter">
          标签云
        </h1>
        <p className="text-[var(--color-text-secondary)] font-medium flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          共发现 {tags.length} 个话题标签
        </p>
      </div>

      {/* 气泡展示区域 */}
      <div className="flex flex-wrap justify-center gap-4 md:gap-6 max-w-5xl mx-auto">
        {loading ? (
          // 加载状态
          <div className="flex gap-4">
             {[1,2,3,4].map(i => (
               <div key={i} className="w-24 h-10 bg-[var(--color-bg-tertiary)] animate-pulse rounded-full" />
             ))}
          </div>
        ) : (
          tags.map((tag, index) => {
            const style = bubbleStyles[index % bubbleStyles.length];
            
            return (
              <Link 
                key={tag.name} 
                // 核心修复：跳转到首页并携带 tag 参数，避免 404
                href={`/?tag=${encodeURIComponent(tag.name)}`}
                className={`
                  group relative px-6 py-3 rounded-2xl border shadow-sm ${style.border} ${style.bg} ${style.text}
                  transition-all duration-300 ease-out
                  hover:scale-105 hover:shadow-xl hover:shadow-current/10 hover:-translate-y-1 hover:text-white ${style.hover}
                  flex items-center gap-2 flex-shrink-0
                `}
              >
                <Hash className="w-4 h-4 opacity-50 group-hover:rotate-12 transition-transform" />
                <span className="font-bold tracking-tight text-sm md:text-base">{tag.name}</span>
                <span className={`
                  ml-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-white/60 text-current
                  group-hover:bg-white/20 group-hover:text-white transition-colors
                `}>
                  {tag.count}
                </span>
              </Link>
            );
          })
        )}

        {!loading && tags.length === 0 && (
          <div className="bg-[var(--color-bg-secondary)]/50 backdrop-blur-sm border border-dashed border-[var(--color-border)] rounded-3xl p-20 text-center w-full">
             <p className="text-[var(--color-text-tertiary)] italic">暂无话题标签，去写篇文章吧！</p>
          </div>
        )}
      </div>
    </main>
  );
}