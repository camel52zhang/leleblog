// app/admin/backup/page.tsx

'use client';
import { useState } from 'react';
import { Download, Upload, ShieldAlert } from 'lucide-react';

export default function BackupPage() {
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;

  // 下载备份：用 fetch 带上 Authorization 头拉取二进制后触发下载，
  // 不能用 window.location.href 直接跳转（浏览器导航不会带 token，会被后端拦截）。
  const handleDownload = async () => {
    const authToken = localStorage.getItem('admin_token');
    if (!authToken) {
      alert('❌ 未登录或登录已过期，请重新登录后再下载');
      return;
    }
    setDownloading(true);
    try {
      const res = await fetch('/api/admin/backup/export', {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        alert(`❌ 下载失败: ${errData.error || '认证失败或未授权'}`);
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      // 优先从 Content-Disposition 取文件名，否则用时间戳兜底
      const disposition = res.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename=("?)([^";]+)\1/);
      const fileName = match ? match[2] : `leleblog_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.db`;
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('❌ 下载失败，请检查网络连接');
    } finally {
      setDownloading(false);
    }
  };

  // 上传恢复
  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("警告：恢复操作将覆盖当前所有数据，且不可逆！是否继续？")) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('backup_file', file);

    try {
      const res = await fetch('/api/admin/backup/restore', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        alert("✅ 恢复成功！");
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`❌ 恢复失败: ${errData.error || '请检查文件格式或登录状态'}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10 max-w-4xl mx-auto">
      <h2 className="text-3xl font-black mb-8">数据备份与恢复</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 导出卡片 */}
        <div className="p-8 bg-blue-50 rounded-3xl border border-blue-100">
          <Download className="w-12 h-12 text-blue-600 mb-4" />
          <h3 className="text-xl font-bold mb-2">立即备份</h3>
          <p className="text-sm text-blue-600/70 mb-6">下载当前的数据库副本到本地安全存放。</p>
          <button onClick={handleDownload} disabled={downloading} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:bg-blue-400">
            {downloading ? "正在生成备份..." : "下载备份文件 (.db)"}
          </button>
        </div>

        {/* 恢复卡片 */}
        <div className="p-8 bg-red-50 rounded-3xl border border-red-100">
          <ShieldAlert className="w-12 h-12 text-red-600 mb-4" />
          <h3 className="text-xl font-bold mb-2">恢复数据</h3>
          <p className="text-sm text-red-600/70 mb-6">上传之前的备份文件以覆盖当前系统数据。</p>
          <label className="inline-block cursor-pointer bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 transition-colors">
            {loading ? "正在恢复..." : "上传并恢复"}
            <input type="file" className="hidden" onChange={handleRestore} accept=".db" />
          </label>
        </div>
      </div>
    </div>
  );
}