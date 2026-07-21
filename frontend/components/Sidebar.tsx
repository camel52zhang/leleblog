// leleblog/frontend/components/Sidebar.tsx

'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Sidebar({ posts }: { posts: any[] }) {
  // 建议 1: 显式声明 state 的初始值为空数组，避免 null
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        // 建议 2: 即使后端返回 null，也强制设为空数组，防止后续崩溃
        setCategories(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        console.error("加载分类失败", err);
        setCategories([]); // 出错时也设为空数组
      });
  }, []);

  return (
    <aside className="w-full md:w-80 space-y-8">
      {/* 最新文章 */}
      <div className="bg-[var(--color-bg-secondary)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm">
        <h3 className="font-black text-[var(--color-text-primary)] border-b border-[var(--color-border)] pb-3 mb-4 flex justify-between items-center">
          <span>最新文章</span>
          <span className="text-blue-500 text-xs">NEW</span>
        </h3>
        <ul className="space-y-4">
          {/* posts 同样需要判空保护，防止首页加载失败时崩溃 */}
          {(posts || []).slice(0, 5).map((post) => (
            <li key={post.id} className="group">
              <Link href={`/post/${post.id}`} className="text-sm text-[var(--color-text-secondary)] group-hover:text-blue-600 transition-colors line-clamp-1 font-medium">
                {post.title}
              </Link>
              <span className="text-[10px] text-[var(--color-text-tertiary)]">
                {post.created_at ? new Date(post.created_at).toLocaleDateString() : '未知日期'}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* 分类列表 */}
      <div className="bg-[var(--color-bg-secondary)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm sticky top-24">
        <h3 className="font-black text-[var(--color-text-primary)] border-b border-[var(--color-border)] pb-3 mb-4 flex justify-between items-center">
          <span>文章分类</span>
          <span className="text-[var(--color-text-tertiary)] text-xs font-normal">{categories.length}</span>
        </h3>
        <div className="flex flex-wrap gap-2">
          {/* 建议 3: 这里的 map 也加上安全保护 */}
          {categories.length > 0 ? (
            categories.map((cat: any) => (
              <Link 
                key={cat.category}
                href={`/?category=${cat.category}`} // 修正建议：通常后端筛选字段叫 category
                className="flex items-center justify-between w-full px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all group"
              >
                <span className="font-medium"># {cat.category || '未分类'}</span>
                <span className="bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)] text-[10px] px-2 py-0.5 rounded-full group-hover:bg-blue-100 group-hover:text-blue-500">
                  {cat.count}
                </span>
              </Link>
            ))
          ) : (
            <p className="text-xs text-[var(--color-text-tertiary)] p-2">暂无分类数据</p>
          )}
        </div>
      </div>
    </aside>
  );
}