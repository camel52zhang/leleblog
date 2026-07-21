// app/admin/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { 
  FileText, 
  Eye, 
  Layers, 
  Hash, 
  MessageSquare, 
  TrendingUp, 
  Loader2,
  Plus // 引入 Plus 用于移动端悬浮按钮
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export const dynamic = "force-dynamic";

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    posts: 0,
    views: 0,
    categories: 0,
    tags: 0,
    comments: 0 
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '';
        const authHeaders: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
        const [postsRes, catsRes, tagsRes, commentsRes] = await Promise.all([
          fetch('/api/posts?pageSize=1000'),
          fetch('/api/categories'),
          fetch('/api/tags/summary'),
          fetch('/api/admin/comments', { headers: authHeaders })
        ]);
        
        const postsData = await postsRes.json();
        const cats = await catsRes.json();
        const tags = await tagsRes.json();
        const comments = await commentsRes.json();

        const postsArray = postsData?.list || (Array.isArray(postsData) ? postsData : []);
        const totalPosts = postsData?.total ?? postsArray.length;

        setStats({
          posts: totalPosts,
          views: postsArray.reduce((acc: number, cur: any) => acc + (Number(cur.views) || 0), 0),
          categories: (cats || []).length,
          tags: (tags || []).length,
          comments: (comments?.list || []).length 
        });
      } catch (error) {
        console.error("统计数据加载失败:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { label: '全部文章', value: stats.posts, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-500/10' },
    { label: '总浏览', value: stats.views, icon: Eye, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
    { label: '分类', value: stats.categories, icon: Layers, color: 'text-amber-600', bg: 'bg-amber-500/10' },
    { label: '标签', value: stats.tags, icon: Hash, color: 'text-indigo-600', bg: 'bg-indigo-500/10' },
    { label: '评论', value: stats.comments, icon: MessageSquare, color: 'text-rose-600', bg: 'bg-rose-500/10' },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-[var(--color-text-tertiary)]">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="font-bold tracking-widest text-sm uppercase">汇总数据中...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 w-full animate-in fade-in duration-500 relative">
      
      {/* 标题：移动端减小边距 */}
      <div className="mb-8 px-2">
        <h2 className="text-2xl md:text-4xl font-black text-[var(--color-text-primary)] tracking-tight">网站统计仪表盘</h2>
        <p className="text-[var(--color-text-secondary)] mt-1 text-sm font-medium">欢迎回来，运行概况如下</p>
      </div>

      {/* 统计卡片：移动端改为 2 列展示 */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
        {statCards.map((card, i) => (
          <div key={i} className="bg-[var(--color-bg-secondary)] p-5 md:p-6 rounded-2xl md:rounded-3xl border border-[var(--color-border)] shadow-sm hover:shadow-lg transition-all group">
            <div className={`w-10 h-10 md:w-12 md:h-12 ${card.bg} ${card.color} rounded-xl flex items-center justify-center mb-4`}>
              <card.icon className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="text-[var(--color-text-tertiary)] text-xs font-bold uppercase tracking-wider mb-1">{card.label}</div>
            <div className="text-2xl md:text-3xl font-black text-[var(--color-text-primary)] tracking-tighter">
              {(card.value ?? 0).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* 移动端悬浮动作按钮 (FAB) */}
      <button 
        onClick={() => router.push('/admin/posts/edit')}
        className="lg:hidden fixed bottom-10 right-6 w-14 h-14 bg-blue-600 text-white rounded-2xl shadow-2xl shadow-blue-500/40 flex items-center justify-center z-[70] active:scale-90 transition-transform"
      >
        <Plus className="w-8 h-8" />
      </button>

      <div className="mt-8 bg-[var(--color-bg-secondary)] rounded-[32px] md:rounded-[40px] p-8 md:p-12 border border-[var(--color-border)] min-h-[300px] flex flex-col items-center justify-center text-center">
        <TrendingUp className="w-12 h-12 text-[var(--color-text-tertiary)] mb-4" />
        <h3 className="text-[var(--color-text-primary)] font-black text-xl mb-2">数据链路已就绪</h3>
        <p className="text-[var(--color-text-secondary)] max-w-xs mx-auto text-sm font-medium leading-relaxed">
          所有实时数据已对接。后续将支持更细致的流量来源分析。
        </p>
      </div>
    </div>
  );
}