'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function SearchBox() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 初始化时从 URL 获取已有的搜索词
  const [term, setTerm] = useState(searchParams.get('q') || '');

  // 当用户输入时，实时更新 URL
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (term) {
        router.push(`/?q=${encodeURIComponent(term)}`);
      } else if (term === '') {
        // 如果清空了搜索框，回到首页
        router.push('/');
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [term, router]);

  return (
    <div className="relative group w-64 md:w-80">
      <input 
        type="text" 
        placeholder="搜索文章..."
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        className="w-full pl-10 pr-4 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] focus:bg-[var(--color-bg-secondary)] focus:ring-2 focus:ring-blue-500 rounded-full text-sm transition-all text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
      />
      <svg className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-tertiary)] group-focus-within:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>
  );
}
