// app/admin/posts/page.tsx

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Edit, Trash2, Plus, Search, Calendar, Hash, Loader2, Inbox, Eye } from 'lucide-react';

export const dynamic = "force-dynamic";

interface Tag {
  id: number;
  name: string;
}

interface Post {
  id: number;
  title: string;
  category: string;
  created_at: string;
  views: number;
  tags: Tag[];
}

export default function PostManagement() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
  });

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/posts?pageSize=1000');
      const data = await res.json();
      const actualPosts = data.list || (Array.isArray(data) ? data : []);
      setPosts(actualPosts);
    } catch (error) {
      console.error("加载文章失败:", error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPosts(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('确定要永久删除这篇文章吗？')) return;
    const res = await fetch(`/api/admin/posts/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (res.ok) fetchPosts();
  };

  const filteredPosts = (posts || []).filter(p => 
    (p.title?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (p.category?.toLowerCase() || '').includes(search.toLowerCase()) ||
    p.tags?.some(t => t.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    // 修改：在移动端减小内边距 (p-4 md:p-12)
    <div className="p-4 md:p-12 w-full animate-in fade-in duration-700">
      
      {/* 头部区域：修改为响应式布局 (flex-col lg:flex-row) */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 md:mb-12">
        <div>
          <h2 className="text-3xl md:text-5xl font-black text-[var(--color-text-primary)] tracking-tighter">内容管理</h2>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-[var(--color-text-tertiary)] text-[10px] md:text-sm font-bold uppercase tracking-widest">
              Management Center
            </p>
            <span className="h-1 w-1 rounded-full bg-[var(--color-text-tertiary)]"></span>
            <p className="text-blue-600 text-[10px] md:text-sm font-black italic">
              {posts.length} Posts Total
            </p>
          </div>
        </div>
        
        {/* 搜索和按钮：在移动端垂直排列 */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
          <div className="relative group">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] group-focus-within:text-blue-500 transition-all" />
            <input 
              type="text"
              placeholder="快速检索..."
              className="pl-12 pr-6 py-3 md:py-4 border-2 border-[var(--color-border)] rounded-2xl md:rounded-[24px] outline-none focus:border-blue-500 w-full md:w-[350px] lg:w-[400px] text-sm font-medium transition-all bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Link href="/admin/posts/edit" className="bg-slate-900 hover:bg-blue-600 text-white px-6 md:px-8 py-3 md:py-4 rounded-2xl md:rounded-[24px] font-black flex items-center justify-center gap-3 transition-all shadow-xl">
            <Plus className="w-5 h-5 md:w-6 md:h-6" /> 创作新篇
          </Link>
        </div>
      </div>

      {/* 内容区域 */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 md:py-40 text-[var(--color-text-tertiary)]">
          <Loader2 className="w-10 h-10 md:w-12 md:h-12 animate-spin mb-6 text-blue-500" />
          <p className="font-black tracking-[0.2em] uppercase text-[10px]">Synchronizing...</p>
        </div>
      ) : filteredPosts.length > 0 ? (
        <div className="w-full">
          
          {/* 桌面端：保持原有表格 (lg:block hidden) */}
          <div className="hidden lg:block">
            <table className="w-full border-separate border-spacing-y-5">
              <thead>
                <tr className="text-left text-[var(--color-text-tertiary)] text-[11px] uppercase tracking-[0.25em] font-black">
                  <th className="px-10 pb-2">文章深度概览</th>
                  <th className="px-10 pb-2">归属</th>
                  <th className="px-10 pb-2">关联标签</th>
                  <th className="px-10 pb-2">发布数据</th>
                  <th className="px-10 pb-2 text-center">管理权限</th>
                </tr>
              </thead>
              <tbody>
                {filteredPosts.map((post) => (
                  <tr key={post.id} className="group transition-all duration-500">
                    <td className="px-10 py-8 bg-[var(--color-bg-secondary)] rounded-l-[32px] border-y border-l border-[var(--color-border)] group-hover:border-blue-100">
                      <div className="flex flex-col gap-1">
                        <div className="font-black text-[var(--color-text-primary)] text-xl group-hover:text-blue-600 transition-colors line-clamp-1">
                          {post.title || "（未命名文章）"}
                        </div>
                        <div className="flex items-center gap-3 text-[var(--color-text-tertiary)] text-xs font-bold">
                          <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {post.views} Views</span>
                          <span>ID: {post.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8 bg-[var(--color-bg-secondary)] border-y border-[var(--color-border)] group-hover:border-blue-100">
                      <span className="bg-blue-500/10 text-blue-600 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-500/20">
                        {(post.category && post.category.trim() !== "") ? post.category : '未分类'}
                      </span>
                    </td>
                    <td className="px-10 py-8 bg-[var(--color-bg-secondary)] border-y border-[var(--color-border)] group-hover:border-blue-100">
                      <div className="flex flex-wrap gap-2 max-w-[240px]">
                        {post.tags && post.tags.length > 0 ? (
                          post.tags.map(tag => (
                            <span key={tag.id} className="text-[10px] bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] px-3 py-1.5 rounded-xl font-black border border-[var(--color-border)]">
                              <Hash className="w-3 h-3 mr-1 inline text-[var(--color-text-tertiary)]" />{tag.name.toUpperCase()}
                            </span>
                          ))
                        ) : <span className="text-[var(--color-text-tertiary)] text-[10px] italic">NO TAGS</span>}
                      </div>
                    </td>
                    <td className="px-10 py-8 bg-[var(--color-bg-secondary)] border-y border-[var(--color-border)] group-hover:border-blue-100">
                      <div className="flex flex-col gap-1 text-[var(--color-text-tertiary)]">
                        <div className="flex items-center gap-2 font-black text-[11px] uppercase">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(post.created_at).toLocaleDateString('zh-CN')}
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8 bg-[var(--color-bg-secondary)] rounded-r-[32px] border-y border-r border-[var(--color-border)] group-hover:border-blue-100 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <Link href={`/admin/posts/edit?id=${post.id}`} className="p-4 text-[var(--color-text-tertiary)] hover:text-blue-600 hover:bg-blue-500/10 rounded-2xl transition-all">
                          <Edit className="w-6 h-6" />
                        </Link>
                        <button onClick={() => handleDelete(post.id)} className="p-4 text-[var(--color-text-tertiary)] hover:text-red-600 hover:bg-red-500/10 rounded-2xl transition-all">
                          <Trash2 className="w-6 h-6" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 移动端：显示卡片列表 (lg:hidden) */}
          <div className="lg:hidden space-y-4">
            {filteredPosts.map((post) => (
              <div key={post.id} className="bg-[var(--color-bg-secondary)] p-5 rounded-3xl border border-[var(--color-border)] shadow-sm flex flex-col gap-4">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="bg-blue-500/10 text-blue-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-blue-500/20">
                      {post.category || '未分类'}
                    </span>
                    <span className="text-[var(--color-text-tertiary)] text-[10px] font-bold italic">#{post.id}</span>
                  </div>
                  <h3 className="font-black text-[var(--color-text-primary)] text-lg leading-tight line-clamp-2">
                    {post.title || "（未命名文章）"}
                  </h3>
                </div>

                <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-4">
                  <div className="flex items-center gap-4 text-[var(--color-text-tertiary)]">
                    <div className="flex items-center gap-1.5 font-bold text-[11px]">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(post.created_at).toLocaleDateString('zh-CN')}
                    </div>
                    <div className="flex items-center gap-1.5 font-bold text-[11px]">
                      <Eye className="w-3.5 h-3.5" />
                      {post.views}
                    </div>
                  </div>
                  
                  {/* 操作按钮 */}
                  <div className="flex items-center gap-2">
                    <Link 
                      href={`/admin/posts/edit?id=${post.id}`} 
                      className="p-3 bg-blue-500/10 text-blue-600 rounded-xl active:scale-90 transition-transform"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button 
                      onClick={() => handleDelete(post.id)} 
                      className="p-3 bg-red-500/10 text-red-500 rounded-xl active:scale-90 transition-transform"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-[var(--color-bg-secondary)] rounded-[32px] md:rounded-[48px] py-24 md:py-48 flex flex-col items-center justify-center border-4 border-dashed border-[var(--color-border)]">
          <div className="w-20 h-20 md:w-24 md:h-24 bg-[var(--color-bg-tertiary)] rounded-full flex items-center justify-center mb-8">
            <Inbox className="w-8 h-8 md:w-10 md:h-10 text-[var(--color-text-tertiary)]" />
          </div>
          <h3 className="text-[var(--color-text-primary)] font-black text-2xl md:text-3xl tracking-tighter">数据库目前空空如也</h3>
          <p className="text-[var(--color-text-secondary)] mt-2 md:mt-3 font-bold uppercase tracking-widest text-[10px] md:text-xs">Waiting for your first masterpiece</p>
          <Link href="/admin/posts/edit" className="mt-8 md:mt-10 text-blue-600 font-black flex items-center gap-2 hover:gap-4 transition-all text-sm md:text-base">
            立即去创作 <Plus className="w-5 h-5" />
          </Link>
        </div>
      )}
    </div>
  );
}