// leleblog/frontend/app/categories/page.tsx

'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, FolderOpen, Sparkles } from 'lucide-react';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 调用后端分类接口
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        setCategories(data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("加载分类失败:", err);
        setLoading(false);
      });
  }, []);

  // 统计逻辑
  const totalCategories = categories.length;
  const totalArticles = categories.reduce((sum, cat) => sum + (cat.count || 0), 0);
  
  // 计算权重所需的极值，用于动态字号控制
  const counts = categories.map(cat => cat.count || 0);
  const maxCount = Math.max(...counts, 0);
  const minCount = Math.min(...counts, 0);
  const range = maxCount - minCount || 1;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-[var(--color-text-tertiary)] gap-4">
        <div className="w-8 h-8 border-4 border-green-500/20 border-t-green-500 rounded-full animate-spin" />
        <p className="font-medium">正在统计分类数据...</p>
      </div>
    );
  }

  return (
    <main className="max-w-[1440px] mx-auto px-6 py-8 min-h-[80vh]">
      {/* 头部标题区域 */}
      <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="inline-flex items-center justify-center p-3 bg-[var(--color-bg-secondary)] rounded-2xl shadow-sm border border-[var(--color-border)] mb-6">
          <FolderOpen className="w-8 h-8 text-green-500" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-[var(--color-text-primary)] mb-4 tracking-tighter">
          文章分类
        </h1>
        <div className="flex items-center justify-center gap-2 text-[var(--color-text-secondary)] font-medium">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <p>
            本站共有 <strong className="text-green-500 mx-1">{totalCategories}</strong> 个分类，
            包含 <strong className="text-green-500 mx-1">{totalArticles}</strong> 篇文章
          </p>
        </div>
      </div>

      {/* 分类云区域 */}
      <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8 leading-[3.5] max-w-5xl mx-auto">
        {categories.length > 0 ? (
          categories.map((cat) => {
            // 计算字号权重 (1-5级)
            const weight = Math.ceil(((cat.count - minCount) / range) * 4) + 1;
            // 映射到具体的样式 (字号 16px-28px)
            const fontSize = 16 + weight * 2;
            const paddingX = 20 + weight * 2;
            const paddingY = 10 + weight * 1;

            return (
              <Link
                key={cat.category}
                href={`/?category=${encodeURIComponent(cat.category)}`}
                style={{ 
                  fontSize: `${fontSize}px`,
                  padding: `${paddingY}px ${paddingX}px`
                }}
                className="inline-block bg-green-500/10 border border-green-500/20 text-green-500 rounded-2xl transition-all duration-500 hover:bg-green-500 hover:text-white hover:shadow-2xl hover:shadow-green-500/20 hover:-translate-y-2 active:scale-95 group relative overflow-hidden"
                title={`${cat.count} 篇文章`}
              >
                <span className="relative z-10 font-bold tracking-tight">
                  {cat.category}
                </span>
                <span 
                  className="ml-2 opacity-40 group-hover:opacity-100 font-black relative z-10"
                  style={{ fontSize: `${fontSize - 6}px` }}
                >
                  {cat.count}
                </span>
                {/* 悬浮背景装饰 */}
                <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </Link>
            );
          })
        ) : (
          <div className="bg-[var(--color-bg-secondary)]/50 backdrop-blur-sm border border-dashed border-[var(--color-border)] rounded-3xl p-20 text-center w-full">
            <p className="text-[var(--color-text-tertiary)] italic">暂无分类数据...</p>
          </div>
        )}
      </div>
    </main>
  );
}