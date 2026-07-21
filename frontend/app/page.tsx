// leleblog/frontend/app/page.tsx

'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import PostList from '@/components/PostList';
import Sidebar from '@/components/Sidebar';
import { Tag, X, Layers, Hash } from 'lucide-react';

function BlogContent() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // --- 新增分页相关状态 ---
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  // ----------------------
  
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const q = searchParams?.get('q') || '';
  const category = searchParams?.get('category') || '';
  const tag = searchParams?.get('tag') || '';

  const isFiltered = !!(q || category || tag);
  const filterValue = q || category || tag;

  // 如果筛选条件变化，回到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [q, category, tag]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (q) params.set('q', q);
        if (category) params.set('category', category);
        if (tag) params.set('tag', tag);
        // 传入分页参数
        params.set('page', currentPage.toString());
        params.set('pageSize', pageSize.toString());

        const apiUrl = `/api/posts?${params.toString()}`;
        
        const res = await fetch(apiUrl);
        const data = await res.json();
        
        // 【核心修复】这里必须判断后端返回的是数组还是带 list 的对象
        if (data.list && Array.isArray(data.list)) {
          setPosts(data.list); // 分页模式：取 list
          setTotal(data.total || 0);
        } else if (Array.isArray(data)) {
          setPosts(data); // 兼容模式：如果后端还是返回数组
          setTotal(data.length);
        }
      } catch (err) {
        console.error("加载文章失败:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [q, category, tag, currentPage]); // 增加 currentPage 监听

  // 计算总页数
  const totalPages = Math.ceil(total / pageSize);

  return (
    <main className="max-w-[1440px] mx-auto px-6 py-10 flex flex-col md:flex-row gap-10">
      <div className="flex-[3] min-w-0">
        {isFiltered && (
          <div className="mb-8 flex items-center justify-between bg-[var(--color-bg-secondary)] p-6 rounded-[24px] border border-blue-100 shadow-sm animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                {category ? <Layers className="w-5 h-5 text-blue-500" /> : 
                 tag ? <Hash className="w-5 h-5 text-blue-500" /> :
                 <Tag className="w-5 h-5 text-blue-500" />}
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-tertiary)] font-bold uppercase tracking-widest">
                  {category ? '分类结果' : tag ? '标签结果' : '搜索结果'}
                </p>
                <p className="text-[var(--color-text-primary)] font-black">
                  当前：<span className="text-blue-600">#{filterValue}</span>
                </p>
              </div>
            </div>
            <button 
              onClick={() => router.push('/')}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] text-sm font-bold rounded-xl transition-all active:scale-95"
            >
              <X className="w-4 h-4" /> 清除筛选
            </button>
          </div>
        )}

        <PostList posts={posts} loading={loading} />

        {/* --- 分页组件渲染 --- */}
        {!loading && totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-4 py-4">
            <button
              disabled={currentPage === 1}
              onClick={() => { setCurrentPage(prev => prev - 1); window.scrollTo(0,0); }}
              className="text-blue-500 hover:underline disabled:text-[var(--color-text-tertiary)] disabled:no-underline"
            >
              « 前一页
            </button>
            
            <div className="flex gap-1">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setCurrentPage(i + 1); window.scrollTo(0,0); }}
                  className={`px-3 py-1 rounded transition-colors ${
                    currentPage === i + 1 ? 'bg-[var(--color-bg-tertiary)] text-blue-700 font-bold' : 'text-blue-500 hover:bg-[var(--color-bg-hover)]'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button
              disabled={currentPage === totalPages}
              onClick={() => { setCurrentPage(prev => prev + 1); window.scrollTo(0,0); }}
              className="text-blue-500 hover:underline disabled:text-[var(--color-text-tertiary)] disabled:no-underline"
            >
              后一页 »
            </button>
          </div>
        )}
      </div>

      <aside className="w-full md:w-[320px] flex-shrink-0">
        <Sidebar posts={posts} />
      </aside>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-40 text-[var(--color-text-tertiary)]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-bold">正在加载内容...</p>
      </div>
    }>
      <BlogContent />
    </Suspense>
  );
}