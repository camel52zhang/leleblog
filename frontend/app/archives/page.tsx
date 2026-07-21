// app/archives/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, ChevronRight, Hash, Loader2, FileText, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Post {
  id: number;
  title: string;
  created_at: string;
}

interface GroupedPosts {
  [year: string]: {
    [month: string]: Post[];
  };
}

export default function ArchivesPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/posts?page=${currentPage}&pageSize=${pageSize}`)
      .then(res => res.json())
      .then(data => {
        const list = data.list || (Array.isArray(data) ? data : []);
        setPosts(list);
        setTotalPages(Math.ceil((data.total || list.length) / pageSize));
        setLoading(false);
      })
      .catch(err => {
	    console.error("加载归档失败:", err);
		setLoading(false);
	  });
  }, [currentPage]);

  // 将文章按年、月进行归档分组逻辑
  const groupPosts = (posts: Post[]): GroupedPosts => {
    const groups: GroupedPosts = {};
	if (!Array.isArray(posts)) return groups;
	
    posts.forEach(post => {
      const date = new Date(post.created_at);
      const year = date.getFullYear().toString();
      const month = (date.getMonth() + 1).toString().padStart(2, '0') + '月';
      
      if (!groups[year]) groups[year] = {};
      if (!groups[year][month]) groups[year][month] = [];
      groups[year][month].push(post);
    });
    return groups;
  };

  const archivedData = groupPosts(posts);
  const years = Object.keys(archivedData).sort((a, b) => b.localeCompare(a)); // 年份倒序

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-[var(--color-text-tertiary)]">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="font-bold tracking-widest">正在整理时光机...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 头部统计 */}
      <div className="text-center mb-12">
        <div className="inline-block bg-orange-500/10 text-orange-500 px-4 py-1.5 rounded-full text-sm font-black mb-4">
          📅 文章归档
        </div>
        <h1 className="text-3xl font-black text-[var(--color-text-primary)] tracking-tight mb-2">
          共记述了 <span className="text-orange-500 px-1">{posts.length}</span> 篇故事
        </h1>
        <p className="text-[var(--color-text-secondary)] font-medium">所有的瞬间，都将汇聚成永恒的时光线</p>
      </div>

      {/* 时间线核心区 */}
      <div className="relative border-l-2 border-[var(--color-border)] ml-2 pl-6 space-y-10">
        {years.length > 0 ? (
          years.map(year => (
            <div key={year} className="relative">
              {/* 年份标记点 */}
              <div className="absolute -left-[33px] top-0 w-5 h-5 bg-[var(--color-bg-secondary)] border-4 border-orange-500 rounded-full z-10 shadow-sm" />
              
              <h2 className="text-3xl font-black text-[var(--color-text-primary)] mb-6 flex items-center">
                {year} <span className="text-[var(--color-text-tertiary)] text-xl ml-3">ANNUAL</span>
              </h2>

              <div className="space-y-8">
                {Object.keys(archivedData[year])
                  .sort((a, b) => b.localeCompare(a)) // 月份倒序
                  .map(month => (
                    <div key={month} className="group">
                      <h3 className="text-lg font-bold text-orange-500/80 mb-4 flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-400 rounded-full" />
                        {month}
                      </h3>

                      <div className="grid gap-1">
                        {archivedData[year][month].map(post => (
                          <Link 
                            key={post.id} 
                            href={`/post/${post.id}`}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--color-bg-secondary)] transition-all group/item"
                          >
                            <span className="text-xs font-mono text-[var(--color-text-tertiary)] group-hover/item:text-orange-400 transition-colors w-12 flex-shrink-0">
                              {new Date(post.created_at).getDate().toString().padStart(2, '0')}日
                            </span>
                            <span className="font-medium text-[var(--color-text-secondary)] group-hover/item:text-orange-500 transition-colors truncate">
                              {post.title}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20">
            <div className="inline-flex p-6 bg-[var(--color-bg-tertiary)] rounded-full text-[var(--color-text-tertiary)] mb-6">
              <FileText className="w-12 h-12" />
            </div>
            <h3 className="text-[var(--color-text-primary)] font-black text-xl mb-2">这里目前还是一片空白</h3>
            <p className="text-[var(--color-text-secondary)] mb-6">开始撰写你的第一篇文章吧</p>
            <Link 
              href="/admin/posts/edit" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              开始创作
            </Link>
          </div>
        )}
      </div>

      {/* 分页控件 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-12">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-secondary)] font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:border-orange-300 hover:text-orange-500 transition-colors"
          >
            上一页
          </button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-10 h-10 rounded-lg font-bold transition-colors ${
                    currentPage === pageNum
                      ? 'bg-orange-500 text-white'
                      : 'bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-orange-300 hover:text-orange-500'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-secondary)] font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:border-orange-300 hover:text-orange-500 transition-colors"
          >
            下一页
          </button>
        </div>
      )}

      {/* 底部返回 */}
      <div className="mt-12">
        <button 
          onClick={() => router.back()} 
          className="text-[var(--color-text-tertiary)] hover:text-orange-500 font-bold transition-colors flex items-center gap-2 group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span> 返回上一页
        </button>
      </div>
    </div>
  );
}