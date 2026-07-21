// leleblog/frontend/app/post/[id]/page.tsx

'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import { 
  Calendar, Eye, Hash, ArrowLeft, List, Copy, Check, AlertCircle, 
  ThumbsUp, Share2, MessageSquare, Send, UserCircle, Loader2, ChevronDown
} from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

// --- macOS 风格代码块渲染器 ---
const MacStyleCodeBlock = ({ children, className }: any) => {
  const [isCopied, setIsCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : 'text';
  
  const extractText = (node: any): string => {
    if (!node) return '';
    if (typeof node === 'string') return node;
    if (Array.isArray(node)) return node.map(extractText).join('');
    if (node.props?.children) return extractText(node.props.children);
    return '';
  };
  
  const codeString = extractText(children);
  const trimmedLines = codeString.trim().split('\n');
  const lineCount = trimmedLines.length;
  const SHOW_LINES_THRESHOLD = 10;
  const DEFAULT_SHOW_LINES = 5;  
  const canCollapse = lineCount > SHOW_LINES_THRESHOLD;
  const [isCollapsed, setIsCollapsed] = useState(lineCount > SHOW_LINES_THRESHOLD);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(codeString);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = codeString;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
        } finally {
          document.body.removeChild(textArea);
        }
      }
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const remainingLines = lineCount - DEFAULT_SHOW_LINES;

  return (
    <div className="my-6 rounded-xl overflow-hidden shadow-lg border border-gray-700/50 bg-[#1e1e1e] font-mono w-full max-w-full">
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#2d2d2d] border-b border-gray-700/50 select-none">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57] border border-[#e0443e]" />
          <div className="w-3 h-3 rounded-full bg-[#febc2e] border border-[#dba520]" />
          <div className="w-3 h-3 rounded-full bg-[#28c840] border border-[#1aab29]" />
          <span className="ml-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
            {language} <span className="text-[10px] opacity-60 ml-1">({lineCount} 行)</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleCopy} className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
            {isCopied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </button>
          {canCollapse && (
            <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? '-rotate-90' : ''}`} />
            </button>
          )}
        </div>
      </div>
	  
      <div className="relative bg-[#1e1e1e]">
        <div className={`overflow-x-auto code-scrollbar transition-[max-height] duration-500 ease-in-out ${isCollapsed ? 'overflow-hidden' : ''}`}
             style={{ 
               maxHeight: isCollapsed ? 'calc(5 * 1.5em + 32px)' : 'none' 
             }}>
          <SyntaxHighlighter
            language={language}
            style={oneDark}
            customStyle={{ margin: 0, background: 'transparent', padding: '16px', fontSize: '0.875rem' }}
            codeTagProps={{ style: { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' } }}
            wrapLongLines={false}
          >
            {codeString}
          </SyntaxHighlighter>
        </div>
        {isCollapsed && <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#1e1e1e] via-[#1e1e1e]/80 to-transparent pointer-events-none" />}
      </div>
	  
      {canCollapse && (
        <div 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          className="py-3 bg-[#252526] text-center text-xs text-gray-400 cursor-pointer hover:text-white hover:bg-[#2d2d2d] transition-colors flex items-center justify-center gap-2 border-t border-gray-700/30"
        >
          {isCollapsed ? (
            <>
              <ChevronDown className="w-3 h-3" /> 
              <span>点击展开剩余 {remainingLines} 行代码</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3 rotate-180" /> 
              <span>点击收起代码块</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const InlineCode = ({ node, inline, className, children, ...props }: any) => {
  const isInline = !className || !className.includes(`language-`);
  if (isInline) {
    const content = React.Children.toArray(children).join('');
	const cleanContent = content.trim().replace(/^`+|`+$/g, '');
	return (
	  <code className="bg-[var(--color-bg-tertiary)] px-1.5 py-0.5 rounded text-[var(--color-text-primary)] font-mono text-[0.9em] before:content-none after:content-none border border-[var(--color-border)]" {...props}>
	    {cleanContent}
	  </code>
	);
  }
  return <code className={className} {...props}>{children}</code>;
};

export default function PostDetail() {
  const { id } = useParams();
  const router = useRouter();
  
  const [post, setPost] = useState<any>(null);      
  const [prevPost, setPrevPost] = useState<any>(null); 
  const [nextPost, setNextPost] = useState<any>(null); 
  const [toc, setToc] = useState<{ id: string; text: string; level: number }[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [siteConfig, setSiteConfig] = useState<any>({ site_name: 'Loading...' });
  const [likes, setLikes] = useState(0);
  const [showQR, setShowQR] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [commentForm, setCommentForm] = useState({ nickname: '', content: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchConfig = () => {
    fetch(`/api/config`)
      .then(res => res.json())
      .then(data => setSiteConfig(data))
      .catch(err => console.error("Config fetch failed:", err));
  };

  const fetchPostData = () => {
    fetch(`/api/posts/${id}`)
      .then(res => {
        if (!res.ok) throw new Error("无法连接到服务器");
        return res.json();
      })
      .then(data => {
        const currentPost = data.post || data;
        const normalizedPost = {
          ...currentPost,
          title: currentPost.title || currentPost.Title || '无标题',
          content: currentPost.content || currentPost.Content || '',
          category: currentPost.category || currentPost.Category || '未分类'
        };
        setPost(normalizedPost);
        setPrevPost(data.prev || null);
        setNextPost(data.next || null);
        if (normalizedPost.content) extractToc(normalizedPost.content);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    window.scrollTo(0, 0);
    if (typeof window !== 'undefined') setCurrentUrl(window.location.href);
    fetchPostData();
    fetchConfig();
  }, [id]);

  const handleSubmitComment = async () => {
    if (!commentForm.nickname || !commentForm.content) return alert("请填写昵称和内容");
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commentForm)
      });
      if (res.ok) {
        setCommentForm({ ...commentForm, content: '' });
        fetchPostData();
      } else {
        alert("评论提交失败");
      }
    } catch (err) {
      alert("网络错误");
    } finally {
      setIsSubmitting(false);
    }
  };

  const extractToc = (content: string) => {
    const headingRegex = /^(#{2,3})\s+(.*)$/gm;
    const headings = [];
    let match;
    while ((match = headingRegex.exec(content)) !== null) {
      const text = match[2].trim();
      const id = text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fa5-]/g, '');
      headings.push({ id, text, level: match[1].length });
    }
    setToc(headings);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) setActiveId(entry.target.id);
      }),
      { rootMargin: '-100px 0px -70% 0px' }
    );
    document.querySelectorAll('.prose h2, .prose h3').forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [post]);

  if (error) return <div className="flex flex-col items-center justify-center min-h-[60vh] text-[var(--color-text-secondary)]"><AlertCircle className="w-12 h-12 mb-4 text-red-400" /><p className="font-bold">{error}</p></div>;
  if (loading || !post) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      <p className="text-[var(--color-text-tertiary)] font-black text-xs uppercase tracking-widest">正在解析文档...</p>
    </div>
  );

  return (
    <main className="max-w-[1440px] mx-auto px-6 py-10 flex flex-col lg:flex-row items-start gap-8">
      <article className="flex-1 w-full min-w-0 bg-[var(--color-bg-secondary)] p-6 md:p-10 rounded-2xl shadow-sm border border-[var(--color-border)] overflow-hidden">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-blue-500 text-sm font-semibold mb-8 hover:translate-x-[-4px] transition-all">
          <ArrowLeft className="w-4 h-4" /> 返回
        </button>
        
        <header className="mb-10">
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] mb-6 leading-[1.3] tracking-tight break-words overflow-hidden">
            {post.title}
          </h1>
          <div className="flex items-center gap-6 text-sm text-[var(--color-text-tertiary)] font-medium">
            <span className="bg-blue-500/10 text-blue-500 px-3 py-1 rounded-lg text-xs uppercase tracking-wider flex items-center gap-1 font-semibold">
              <Hash className="w-3.5 h-3.5" /> {post.category}
            </span>
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {new Date(post.created_at).toLocaleDateString()}</span>
            <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" /> {post.views} 阅读</span>
          </div>
        </header>

        {/* 文章内容 */}
        <div className="prose prose-blue prose-base max-w-none mb-16 prose-headings:scroll-mt-[120px] prose-headings:font-bold prose-headings:text-[var(--color-text-primary)] prose-p:text-[var(--color-text-secondary)] prose-li:text-[var(--color-text-secondary)] prose-ul:text-[var(--color-text-secondary)] prose-ol:text-[var(--color-text-secondary)] prose-strong:text-[var(--color-text-primary)] prose-strong:font-semibold prose-em:text-[var(--color-text-secondary)] prose-a:text-blue-500 prose-img:rounded-2xl prose-img:shadow-lg">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]} 
            rehypePlugins={[rehypeSlug]} 
            components={{ p: ({children}) => <p style={{ whiteSpace: 'pre-wrap' }}>{children}</p>, code: InlineCode, pre: MacStyleCodeBlock }}
          >
            {post.content}
          </ReactMarkdown>
        </div>

        <section className="mt-16 border-t border-[var(--color-border)] pt-8 pb-10">
          <div className="flex justify-between items-center text-xs font-medium text-[var(--color-text-tertiary)] mb-10">
            <span>最后编辑：{new Date(post.updated_at || post.created_at).toLocaleDateString()}</span>
            <span>© {new Date().getFullYear()} {siteConfig.author} - 著作权归作者所有</span>
          </div>

          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-wrap items-center gap-4">
              <button onClick={() => setLikes(l => l + 1)} className="flex items-center gap-2 px-6 py-3 rounded-xl border border-[var(--color-border)] hover:border-blue-500 hover:text-blue-500 transition-all bg-[var(--color-bg-secondary)] shadow-sm active:scale-95">
                <ThumbsUp className={`w-5 h-5 ${likes > 0 ? 'fill-blue-500 text-blue-500' : 'text-[var(--color-text-tertiary)]'}`} />
                <span className="text-sm font-semibold">赞 {likes}</span>
              </button>
              <button onClick={() => setShowQR(!showQR)} className={`flex items-center gap-2 px-6 py-3 rounded-xl border transition-all active:scale-95 shadow-sm ${showQR ? 'bg-slate-900 border-slate-900 text-white' : 'border-[var(--color-border)] hover:border-blue-500 hover:text-blue-500 bg-[var(--color-bg-secondary)]'}`}>
                <Share2 className="w-5 h-5" />
                <span className="text-sm font-semibold">分享</span>
              </button>
            </div>

            {showQR && (
              <div className="w-full max-w-sm animate-in fade-in zoom-in duration-300">
                <div className="bg-[var(--color-bg-tertiary)] rounded-2xl p-8 border border-[var(--color-border)] flex flex-col items-center text-center">
                  <p className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-6">手机扫码分享或阅读</p>
                  <div className="bg-[var(--color-bg-secondary)] p-4 rounded-2xl shadow-sm border border-[var(--color-border)] mb-4">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(currentUrl)}`} alt="QR" className="w-32 h-32" />
                  </div>
                  <p className="text-sm text-[var(--color-text-tertiary)] leading-relaxed font-normal">扫一扫二维码，在手机上阅读，方便分享给好友</p>
                </div>
              </div>
            )}
          </div>
        </section>
		
        <div className="mt-16 pt-8 border-t border-[var(--color-border)] grid grid-cols-2 gap-8">
          <div className="flex flex-col items-start">
            <span className="text-xs text-[var(--color-text-tertiary)] font-semibold mb-2 uppercase tracking-wider">上一篇</span>
            {prevPost ? (
              <Link href={`/post/${prevPost.id}`} className="text-[var(--color-text-secondary)] hover:text-blue-500 font-semibold text-base transition-colors line-clamp-2">
                {prevPost.title}
              </Link>
            ) : <span className="text-[var(--color-text-tertiary)] font-medium text-sm">第一篇了</span>}
          </div>
          <div className="flex flex-col items-end text-right">
            <span className="text-xs text-[var(--color-text-tertiary)] font-semibold mb-2 uppercase tracking-wider">下一篇</span>
            {nextPost ? (
              <Link href={`/post/${nextPost.id}`} className="text-[var(--color-text-secondary)] hover:text-blue-500 font-semibold text-base transition-colors line-clamp-2">
                {nextPost.title}
              </Link>
            ) : <span className="text-[var(--color-text-tertiary)] font-medium text-sm">末篇了</span>}
          </div>
        </div>

        <section id="comments" className="mt-10 pt-12 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-3 mb-10">
            <div className="bg-blue-500 w-1.5 h-7 rounded-full"></div>
            <h3 className="text-xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-500" /> 评论互动
              <span className="text-sm font-normal text-[var(--color-text-tertiary)] ml-2">({post.comments?.length || 0} 条)</span>
            </h3>
          </div>

          <div className="space-y-4 mb-12">
            {post.comments && post.comments.length > 0 ? (
              post.comments.map((comment: any) => (
                <div key={comment.id} className={`group flex gap-4 p-5 rounded-xl transition-all border ${
                  comment.is_admin 
                    ? 'bg-blue-500/5 border-blue-500/20' 
                    : 'bg-[var(--color-bg-tertiary)]/50 border-transparent hover:border-[var(--color-border)]'
                }`}>
                  <div className="flex-shrink-0">
                    {comment.is_admin ? (
                      <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white shadow-md">
                        <UserCircle className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-[var(--color-bg-secondary)] rounded-xl flex items-center justify-center text-[var(--color-text-tertiary)] border border-[var(--color-border)] shadow-sm">
                        <UserCircle className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold text-sm ${comment.is_admin ? 'text-blue-500' : 'text-[var(--color-text-primary)]'}`}>
                          {comment.nickname || '匿名访客'}
                        </span>
                        {comment.is_admin && (
                          <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider">
                            作者
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-[var(--color-text-tertiary)] font-medium">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16 bg-[var(--color-bg-tertiary)]/30 rounded-2xl border-2 border-dashed border-[var(--color-border)]">
                <div className="inline-flex p-4 bg-[var(--color-bg-secondary)] rounded-2xl shadow-sm mb-4">
                  <MessageSquare className="w-8 h-8 text-[var(--color-text-tertiary)]" />
                </div>
                <p className="text-[var(--color-text-tertiary)] text-sm font-medium">暂无评论，来发表第一个见解吧</p>
              </div>
            )}
          </div>

          <div className="bg-[var(--color-bg-secondary)] p-6 md:p-8 rounded-2xl border border-[var(--color-border)] shadow-sm">
            <h4 className="text-lg font-bold text-[var(--color-text-primary)] mb-6 flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-500" /> 发表评论
            </h4>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="您的昵称"
                value={commentForm.nickname}
                onChange={e => setCommentForm({ ...commentForm, nickname: e.target.value })}
                className="w-full px-4 py-3 bg-[var(--color-bg-tertiary)] rounded-xl border border-transparent focus:border-blue-500 focus:bg-[var(--color-bg-secondary)] outline-none transition-all font-medium text-sm text-[var(--color-text-primary)]"
              />
              <textarea
                placeholder="写下您的评论..."
                rows={4}
                value={commentForm.content}
                onChange={e => setCommentForm({ ...commentForm, content: e.target.value })}
                className="w-full px-4 py-3 bg-[var(--color-bg-tertiary)] rounded-xl border border-transparent focus:border-blue-500 focus:bg-[var(--color-bg-secondary)] outline-none transition-all font-medium text-sm resize-none text-[var(--color-text-primary)]"
              />
              <button
                onClick={handleSubmitComment}
                disabled={isSubmitting}
                className="w-full md:w-auto px-8 py-3 bg-slate-900 hover:bg-blue-600 text-white rounded-xl font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {isSubmitting ? '提交中...' : '提交评论'}
              </button>
            </div>
          </div>
        </section>
      </article>

      <aside className="hidden lg:block w-72 sticky top-28 self-start">
        <div className="bg-[var(--color-bg-secondary)] p-5 rounded-2xl border border-[var(--color-border)] shadow-sm max-h-[calc(100vh-140px)] overflow-y-auto custom-scrollbar">
          <h3 className="flex items-center gap-2 font-semibold text-[var(--color-text-primary)] mb-4 border-b border-[var(--color-border)] pb-3 text-xs tracking-wider uppercase">
            <List className="w-4 h-4 text-blue-500" /> 目录
          </h3>
          <nav className="space-y-1 border-l-2 border-[var(--color-border)] ml-1">
            {toc.map((item, index) => (
              <a
                key={index}
                href={`#${item.id}`}
                onClick={(e) => {
                    e.preventDefault();
                    const target = document.getElementById(item.id);
                    if (target) window.scrollTo({ top: target.getBoundingClientRect().top + window.pageYOffset - 110, behavior: 'smooth' });
                }}
                className={`block py-2 text-sm transition-all -ml-[2px] border-l-2 px-4 ${
                  activeId === item.id ? 'text-blue-500 border-blue-500 font-semibold bg-blue-500/5 rounded-r-lg' : 'text-[var(--color-text-tertiary)] border-transparent hover:text-[var(--color-text-secondary)] font-medium'
                } ${item.level === 3 ? 'pl-8 text-xs' : ''}`}
              >
                {item.text}
              </a>
            ))}
          </nav>
        </div>
      </aside>
    </main>
  );
}