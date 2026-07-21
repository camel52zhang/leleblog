// leleblog/frontend/components/PostList.tsx

'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Calendar, Eye, Tag, SearchX, ChevronRight } from 'lucide-react';

export default function PostList({ posts, loading }: { posts: any[], loading: boolean }) {
  const searchParams = useSearchParams();
  
  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const tag = searchParams.get('tag') || '';
  
  const activeFilter = category || tag || q;
  const filterType = category ? "分类" : tag ? "标签" : "搜索";

  // 1. 提取文章内的第一张图片
  const getFirstImage = (content: string) => {
    if (!content) return null;
    const mdImgRegex = /!\[.*?\]\((.*?\.(?:png|jpg|jpeg|gif|webp|svg|bmp).*?)\)/i;
    const mdMatch = content.match(mdImgRegex);
	if (mdMatch && mdMatch[1]) {
      return mdMatch[1].trim().split(/\s+/)[0].replace(/["']/g, '');
    };
  
    const rawUrlRegex = /(https?:\/\/[^\s)]+?\.(?:png|jpg|jpeg|gif|webp|svg))/i;
    const rawMatch = content.match(rawUrlRegex);
    if (rawMatch) return rawMatch[0];
  
    const htmlImgRegex = /<img.*?src=["'](.*?)["']/;
    const htmlMatch = content.match(htmlImgRegex);
    if (htmlMatch) return htmlMatch[1];
    return null;
  };

  // 2. 获取分类对应的背景渐变色
  const getCategoryTheme = (cat: string) => {
    const themes: Record<string, string> = {
      'Webdav': 'from-blue-500 to-blue-700',
      'Windows': 'from-emerald-400 to-emerald-600',
      '公告': 'from-amber-400 to-amber-600',
      'Linux': 'from-orange-500 to-red-600',
      'Default': 'from-slate-400 to-slate-600'
    };
    return themes[cat] || themes['Default'];
  };

  if (loading) {
    return (
      <section className="flex-[3] space-y-6 w-full">
        <div className="grid gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-60 md:h-48 bg-[var(--color-bg-secondary)]/60 animate-pulse rounded-2xl border border-[var(--color-border)] w-full" />
          ))}
        </div>
      </section>
    );
  }

  if (posts.length === 0) {
    return (
      <section className="flex-[3] w-full px-2 md:px-0 text-center">
        <div className="bg-[var(--color-bg-secondary)] rounded-2xl border border-dashed border-[var(--color-border)] py-20 px-6 shadow-sm">
          <div className="inline-flex p-6 bg-[var(--color-bg-tertiary)] rounded-full text-[var(--color-text-tertiary)] mb-6">
            <SearchX className="w-12 h-12" />
          </div>
          <h3 className="text-[var(--color-text-secondary)] font-bold text-xl">没有找到相关文章</h3>
          <p className="text-[var(--color-text-tertiary)] text-sm mt-2 mb-10 max-w-xs mx-auto leading-relaxed">
            在 <span className="text-blue-500 font-semibold">{filterType}</span> 中未找到关于 "{activeFilter}" 的内容
          </p>
          <Link href="/" className="px-8 py-3 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition-all shadow-md active:scale-95 inline-block">
            重置筛选
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="flex-[3] space-y-6 w-full min-w-0">
      {/* 筛选结果头部适配 */}
      {activeFilter && (
        <div className="bg-[var(--color-bg-secondary)] p-4 md:p-6 rounded-2xl border border-[var(--color-border)] shadow-sm flex items-center justify-between mx-2 md:mx-0 transition-all">
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            <div className={`p-2.5 md:p-3 rounded-xl flex-shrink-0 ${category ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
              <Tag className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-0.5">
                {filterType}结果
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-sm md:text-lg font-bold text-[var(--color-text-primary)] truncate">
                  #{activeFilter}
                </span>
                <Link href="/" className="p-1 hover:bg-[var(--color-bg-hover)] rounded-md transition-colors">
                  <span className="text-[var(--color-text-tertiary)] text-[10px]">✕</span>
                </Link>
              </div>
            </div>
          </div>
          <div className="text-right hidden sm:block pr-2">
            <span className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase block mb-1">Count</span>
            <span className="text-sm font-bold text-blue-500 bg-blue-500/10 px-3 py-1 rounded-lg">
              {posts.length}
            </span>
          </div>
        </div>
      )}

      {/* 文章列表适配 */}
      <div className="grid gap-6 px-2 md:px-0">
        {posts.map((post: any) => {
          const firstImg = getFirstImage(post.content);
          const themeGradient = getCategoryTheme(post.category);
          const firstChar = post.category?.charAt(0) || 'P';

          return (
            <article 
              key={post.id} 
              className="group bg-[var(--color-bg-secondary)] p-4 md:p-6 rounded-2xl border border-[var(--color-border)] hover:shadow-lg transition-all duration-300 flex flex-col md:flex-row gap-4 md:gap-6 min-w-0 relative overflow-hidden"
            >
              {/* 左侧封面：使用 aspect-ratio 保持比例 */}
              <div className="w-full md:w-44 aspect-video md:aspect-square rounded-xl flex-shrink-0 relative overflow-hidden shadow-inner">
                {firstImg ? (
                  <img 
                    src={firstImg} 
                    alt={post.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${themeGradient} flex items-center justify-center text-white font-bold text-5xl md:text-6xl relative`}>
                    <span className="relative z-10 drop-shadow-md">{firstChar}</span>
                    <span className="absolute -bottom-4 -right-2 text-8xl md:text-9xl opacity-20 select-none uppercase italic">{firstChar}</span>
                  </div>
                )}
                
                {/* 移动端专属：分类浮标 */}
                <div className="absolute top-3 left-3 md:hidden">
                   <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[10px] font-semibold text-gray-900 shadow-sm uppercase">
                     {post.category}
                   </span>
                </div>
              </div>

              {/* 右侧内容 */}
              <div className="flex-grow flex flex-col min-w-0">
                <div className="flex-grow min-w-0">
                  <div className="hidden md:flex items-center gap-2 mb-3">
                    <Link 
                      href={`/?category=${encodeURIComponent(post.category)}`}
                      className="text-xs font-semibold text-blue-500 bg-blue-500/10 px-2.5 py-1 rounded-lg uppercase tracking-wider hover:bg-blue-500 hover:text-white transition-all"
                    >
                      {post.category}
                    </Link>
                  </div>
                  
                  <h3 className="text-lg md:text-xl font-bold text-[var(--color-text-primary)] group-hover:text-blue-500 transition-colors mb-2 md:mb-3 leading-snug">
                    <Link href={`/post/${post.id}`} className="block truncate md:whitespace-normal">
                        {post.title}
                    </Link>
                  </h3>
                  
                  <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 mb-4 md:mb-6 leading-relaxed">
                    {post.content.replace(/[#*`>]/g, '').substring(0, 150)}
                  </p>
                </div>

                {/* 底部元数据适配 */}
                <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-4 mt-auto">
                  <div className="flex items-center gap-4 text-xs text-[var(--color-text-tertiary)] font-medium uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> 
                      {new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" /> 
                      {post.views}
                    </span>
                  </div>
                  
                  <Link 
                    href={`/post/${post.id}`} 
                    className="flex items-center gap-1 text-xs font-semibold text-[var(--color-text-secondary)] group-hover:text-blue-500 transition-all"
                  >
                    阅读更多
                    <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}