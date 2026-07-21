// app/admin/posts/edit/page.tsx

'use client';

import React, { useEffect, useState, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug'; 
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { 
  ChevronLeft, Save, Loader2, Image as ImageIcon, 
  Check, Copy, Eye, X, Hash, ChevronDown, Plus 
} from 'lucide-react';

export const dynamic = "force-dynamic";

// --- 子组件：Mac 风格代码块渲染器 ---
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
	  <code className="bg-[var(--color-bg-tertiary)] px-1.5 py-0.5 rounded text-[var(--color-text-secondary)] font-mono text-[0.9em] before:content-none after:content-none" {...props}>
	    {cleanContent}
	  </code>
	);
  }
  return <code className={className} {...props}>{children}</code>;
};

export default function EditPostPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /></div>}>
      <EditPostForm />
    </Suspense>
  );
}

function EditPostForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get('id');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
  const [existCategories, setExistCategories] = useState<string[]>([]);
  const [existTags, setExistTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  
  const [showCatDropdown, setShowCatDropdown] = useState(false);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const catRef = useRef<HTMLDivElement>(null);
  const tagRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const STORAGE_KEY = id ? `post_draft_${id}` : 'post_draft_new';

  // --- 1. 自动保存逻辑 ---
  useEffect(() => {
    if (!title && !content) return;
    setSaveStatus('saving');
    const timer = setTimeout(() => {
      const draft = { title, content, category, tags, updatedAt: Date.now() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 1500);
    return () => clearTimeout(timer);
  }, [title, content, category, tags, STORAGE_KEY]);

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
  });

  // --- 2. 初始数据加载 ---
  useEffect(() => {
    Promise.all([
      fetch('/api/categories').then(res => res.json()),
      fetch('/api/tags/summary').then(res => res.json())
    ]).then(([cats, tagList]) => {
      const catArray = Array.isArray(cats) ? cats : (cats?.categories || []);
      setExistCategories(catArray.map((c: any) => typeof c === 'string' ? c : (c.category || c.name)));
      setExistTags((tagList || []).map((t: any) => t.name));
    }).catch(err => console.error("Fetch error", err));

    if (id) {
      setLoading(true);
      fetch(`/api/posts/${id}`)
        .then(res => res.json())
        .then(data => {
          const post = data.post || data; 
          setTitle(post.title || '');
          setContent(post.content || '');
          setCategory(post.category || '');
          setTags(post.tags?.map((t: any) => t.name) || []);
          
          const savedDraft = localStorage.getItem(STORAGE_KEY);
          if (savedDraft) {
            const draft = JSON.parse(savedDraft);
            if (draft.content && draft.content.length > (post.content || '').length + 10) {
              if (confirm('检测到本地有更详细的未保存草稿，是否恢复？')) {
                setTitle(draft.title);
                setContent(draft.content);
                setCategory(draft.category);
                setTags(draft.tags);
              }
            }
          }
        })
        .finally(() => setLoading(false));
    } else {
      const savedDraft = localStorage.getItem(STORAGE_KEY);
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        if (confirm('是否继续上次未完成的创作？')) {
          setTitle(draft.title);
          setContent(draft.content);
          setCategory(draft.category);
          setTags(draft.tags);
        }
      }
    }
  }, [id, STORAGE_KEY]);

  // --- 3. 图片处理逻辑 ---
  const handleUploadImage = async (file: File) => {
    if (isUploading) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/uploads', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` },
        body: formData,
      });
      const data = await res.json();

      if (res.ok && data.url) {
        const imageMarkdown = `\n![${file.name}](${data.url})\n`;
        const textarea = textareaRef.current;
        if (textarea) {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          // 使用函数式更新，避免闭包丢失内容
          setContent(prev => prev.substring(0, start) + imageMarkdown + prev.substring(end));
          
          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + imageMarkdown.length, start + imageMarkdown.length);
          }, 50);
        }
      } else {
        alert("上传失败: " + (data.error || "未知错误"));
      }
    } catch (err) {
      alert("网络连接失败");
    } finally {
      setIsUploading(false);
    }
  };

  const onPaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.includes('image')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) await handleUploadImage(file);
      }
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return alert("标题和内容不能为空");
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id: id ? parseInt(id) : 0, title, content, category: category || '未分类', tag_names: tags })
      });
      if (res.ok) { 
        localStorage.removeItem(STORAGE_KEY);
        router.push('/admin/posts'); 
        router.refresh(); 
      } else { alert("保存失败"); }
    } catch (e) { alert("网络错误"); } finally { setIsSaving(false); }
  };

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] font-sans">
      {/* Header */}
      <div className="flex-none px-4 md:px-6 py-3 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-bg-secondary)] z-30">
        <div className="flex items-center gap-2 flex-1">
          <button onClick={() => router.back()} className="p-2 text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-hover)] rounded-full transition-colors"><ChevronLeft /></button>
          <input className="text-lg md:text-xl font-bold w-full outline-none bg-transparent text-[var(--color-text-primary)]" placeholder="文章标题" value={title} onChange={e => setTitle(e.target.value)} />
          <div className="hidden md:flex items-center gap-3 ml-4">
             {isUploading && <div className="flex items-center gap-1.5 text-xs font-bold text-blue-500 animate-pulse"><Loader2 className="w-3 h-3 animate-spin"/>上传中...</div>}
             {saveStatus === 'saving' && <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500"><Loader2 className="w-3 h-3 animate-spin"/>草稿同步中</div>}
             {saveStatus === 'saved' && <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-500"><Check className="w-3 h-3"/>草稿已就绪</div>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setViewMode(viewMode === 'edit' ? 'preview' : 'edit')} className="lg:hidden p-2.5 bg-[var(--color-bg-tertiary)] rounded-xl"><Eye className="w-5 h-5 text-[var(--color-text-secondary)]" /></button>
          <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold bg-blue-600 text-white disabled:opacity-50 shadow-md active:scale-95 transition-all text-sm">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>保存文章</span>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex-none px-4 md:px-6 py-3 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)] flex flex-col sm:flex-row gap-3 items-stretch">
        <div className="relative w-full sm:w-80 flex-shrink-0" ref={catRef}>
          <input 
            className="w-full pl-3 pr-10 py-2.5 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-blue-100 text-[var(--color-text-primary)]"
            value={category}
            onChange={(e) => { setCategory(e.target.value); setShowCatDropdown(true); }}
            onFocus={() => setShowCatDropdown(true)}
            placeholder="选择或输入分类..."
          />
          {showCatDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] shadow-xl rounded-lg z-50 py-1 max-h-60 overflow-y-auto">
              {existCategories.filter(c => c.toLowerCase().includes(category.toLowerCase())).map((c, i) => (
                <div key={i} onClick={() => { setCategory(c); setShowCatDropdown(false); }} className="px-4 py-2.5 text-sm hover:bg-[var(--color-bg-hover)] cursor-pointer text-[var(--color-text-primary)]">{c}</div>
              ))}
            </div>
          )}
        </div>

        <div className="relative w-full flex-1" ref={tagRef}>
          <div className="flex items-center gap-2 px-3 py-2.5 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg min-h-[42px]">
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              className="p-1 hover:bg-[var(--color-bg-hover)] rounded transition-colors"
              title="插入图片"
            >
              <ImageIcon className="w-4 h-4 text-[var(--color-text-tertiary)]" />
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={e => {
              const file = e.target.files?.[0];
              if (file) handleUploadImage(file);
              e.target.value = '';
            }} />
            <div className="flex-1 flex flex-wrap gap-1.5">
              {tags.map((tag, i) => (
                <span key={i} className="bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1">
                  #{tag} <X className="w-3 h-3 cursor-pointer" onClick={() => setTags(tags.filter((_, idx) => idx !== i))} />
                </span>
              ))}
              <input 
                className="flex-1 min-w-[100px] bg-transparent text-sm outline-none text-[var(--color-text-primary)]"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onFocus={() => setShowTagDropdown(true)}
                onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); if(tagInput) { setTags([...tags, tagInput]); setTagInput(''); } }}}
                placeholder="添加标签..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Editor & Preview */}
      <div className="flex flex-1 min-h-0 w-full overflow-hidden">
        <div className={`${viewMode === 'edit' ? 'flex' : 'hidden'} lg:flex w-full lg:w-1/2 h-full flex-col border-r border-[var(--color-border)]`}>
          <textarea 
            ref={textareaRef}
            className="flex-1 w-full p-6 md:p-10 outline-none resize-none font-mono text-[15px] leading-relaxed text-[var(--color-text-secondary)] bg-transparent" 
            value={content} 
            onChange={e => setContent(e.target.value)} 
            onPaste={onPaste}
            placeholder="开始创作，支持图片粘贴..." 
          />
        </div>

        <div className={`${viewMode === 'preview' ? 'block' : 'hidden'} lg:block w-full lg:w-1/2 h-full bg-[var(--color-bg-tertiary)]/40 overflow-y-auto`}>
          <div className="max-w-3xl mx-auto px-6 md:px-12 py-10">
            <div className="prose prose-sm md:prose-base max-w-full prose-headings:font-bold prose-headings:text-[var(--color-text-primary)] prose-p:text-[var(--color-text-secondary)] prose-li:text-[var(--color-text-secondary)] prose-ul:text-[var(--color-text-secondary)] prose-ol:text-[var(--color-text-secondary)] prose-strong:text-[var(--color-text-primary)] prose-strong:font-semibold prose-em:text-[var(--color-text-secondary)] prose-a:text-blue-500">
              {title && <h1 className="text-2xl md:text-4xl font-black mb-8 text-[var(--color-text-primary)]">{title}</h1>}
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]} 
                rehypePlugins={[rehypeSlug]} 
                components={{ 
                  pre: MacStyleCodeBlock,
                  code: InlineCode,
                  p: ({ children }) => <div className="mb-4 leading-7 text-[var(--color-text-secondary)]" style={{ whiteSpace: 'pre-wrap' }}>{children}</div>
                }}
              >
                {content || ''} 
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}