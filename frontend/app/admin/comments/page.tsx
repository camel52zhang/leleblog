// app/admin/comments/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { 
  MessageSquare, Trash2, Reply, Calendar, User, 
  FileText, Loader2, AlertCircle, ExternalLink 
} from 'lucide-react';

export default function CommentManager() {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyTarget, setReplyTarget] = useState<any>(null); // 正在回复的对象
  const [replyContent, setReplyContent] = useState('');

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
  });

  const fetchComments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/comments', { headers: getAuthHeaders() });
      if (res.status === 401) { localStorage.removeItem('admin_token'); window.location.href = '/admin/login'; return; }
      const data = await res.json();
      setComments(data?.list || []);
    } catch (err) {
      console.error("加载评论失败", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchComments(); }, []);

  // 删除评论
  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这条评论吗？')) return;
    try {
      const res = await fetch(`/api/admin/comments/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (res.ok) fetchComments();
    } catch (err) {
      alert("删除失败");
    }
  };

  // 提交回复
  const handleReply = async () => {
    if (!replyContent.trim()) return;
    try {
      const res = await fetch('/api/admin/comments/reply', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          post_id: replyTarget.post_id,
          nickname: "博主", // 或者从设置里读取站长名
          content: replyContent,
        })
      });
      if (res.ok) {
        setReplyTarget(null);
        setReplyContent('');
        fetchComments();
      }
    } catch (err) {
      alert("回复失败");
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 text-[var(--color-text-tertiary)]">
      <Loader2 className="w-8 h-8 animate-spin mb-2" />
      <p className="font-bold">读取评论中...</p>
    </div>
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-3xl font-black text-[var(--color-text-primary)] tracking-tight flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-blue-600" /> 评论管理
          </h2>
          <p className="text-[var(--color-text-tertiary)] font-bold text-xs mt-2 uppercase tracking-widest">管理全站读者的互动留言</p>
        </div>
        <div className="bg-blue-500/10 px-4 py-2 rounded-xl text-blue-600 font-black text-sm">
          共 {comments.length} 条评论
        </div>
      </div>

      {comments.length === 0 ? (
        <div className="bg-[var(--color-bg-tertiary)] border-2 border-dashed border-[var(--color-border)] rounded-[32px] py-20 text-center">
          <MessageSquare className="w-16 h-16 text-[var(--color-text-tertiary)] mx-auto mb-4" />
          <p className="text-[var(--color-text-tertiary)] font-bold">目前还没有任何评论</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {comments.map((comment) => (
            <div key={comment.id} className={`bg-[var(--color-bg-secondary)] border p-6 rounded-[24px] transition-all hover:shadow-md ${comment.is_admin ? 'border-blue-100 bg-blue-50/20' : 'border-[var(--color-border)]'}`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tighter ${comment.is_admin ? 'bg-blue-600 text-white' : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]'}`}>
                      {comment.is_admin ? '博主' : '访客'}
                    </span>
                    <span className="font-black text-[var(--color-text-primary)]">{comment.nickname}</span>
                    <span className="text-[var(--color-text-tertiary)] mx-1">·</span>
                    <span className="text-xs text-[var(--color-text-tertiary)] font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {new Date(comment.created_at).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-xs text-blue-500 font-bold">
                    <FileText className="w-3 h-3" /> 
                    评论文章：{comment.post_title}
                    <a href={`/post/${comment.post_id}`} target="_blank" className="hover:scale-110 transition-transform">
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setReplyTarget(comment)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[var(--color-bg-tertiary)] hover:bg-blue-600 hover:text-white text-[var(--color-text-secondary)] rounded-xl text-xs font-black transition-all"
                  >
                    <Reply className="w-3.5 h-3.5" /> 回复
                  </button>
                  <button 
                    onClick={() => handleDelete(comment.id)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-red-500/10 hover:bg-red-600 text-red-500 hover:text-white rounded-xl text-xs font-black transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> 删除
                  </button>
                </div>
              </div>

              <div className="mt-4 text-[var(--color-text-secondary)] text-sm leading-relaxed bg-[var(--color-bg-tertiary)]/50 p-4 rounded-2xl border border-[var(--color-border)]">
                {comment.content}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 回复对话框遮罩 */}
      {replyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setReplyTarget(null)}></div>
          <div className="relative bg-[var(--color-bg-secondary)] w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8">
              <h4 className="text-xl font-black text-[var(--color-text-primary)] mb-2 flex items-center gap-2">
                <Reply className="text-blue-600" /> 回复 {replyTarget.nickname}
              </h4>
              <p className="text-[var(--color-text-tertiary)] text-xs font-bold mb-6 line-clamp-1 italic">"{replyTarget.content}"</p>
              
              <textarea 
                className="w-full p-4 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-2xl h-40 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-[var(--color-text-primary)] resize-none mb-6"
                placeholder="请输入您的回复内容..."
                value={replyContent}
                onChange={e => setReplyContent(e.target.value)}
              />

              <div className="flex gap-3">
                <button 
                  onClick={handleReply}
                  className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                >
                  确认发布
                </button>
                <button 
                  onClick={() => setReplyTarget(null)}
                  className="px-8 bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] py-4 rounded-2xl font-black hover:bg-[var(--color-bg-hover)] transition-all"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}