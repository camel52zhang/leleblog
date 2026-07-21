// app/admin/change-password/page.tsx

'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Check, AlertCircle, KeyRound } from 'lucide-react';

export const dynamic = "force-dynamic";

function ChangePasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const forced = searchParams.get('forced') === '1';

  const [form, setForm] = useState({ old_password: '', new_password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.new_password.length < 6) {
      setError('新密码长度不能少于 6 位');
      return;
    }
    if (form.new_password !== form.confirm) {
      setError('两次输入的新密码不一致');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({ old_password: form.old_password, new_password: form.new_password })
      });
      const data = await res.json();
      if (res.ok) {
        setDone(true);
        setTimeout(() => router.push('/admin'), 1200);
      } else {
        setError(data.error || '密码修改失败');
      }
    } catch (err) {
      setError('网络错误，请检查后端服务是否启动');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
        <div className="p-8 bg-[var(--color-bg-secondary)] rounded-2xl shadow-xl w-96 border border-[var(--color-border)] text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
            <Check className="w-6 h-6 text-green-500" />
          </div>
          <h2 className="text-xl font-black text-[var(--color-text-primary)] mb-2">密码修改成功</h2>
          <p className="text-sm text-[var(--color-text-tertiary)]">正在跳转到后台...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
      <div className="p-8 bg-[var(--color-bg-secondary)] rounded-2xl shadow-xl w-96 border border-[var(--color-border)]">
        <div className="flex items-center gap-2 mb-2">
          <KeyRound className="w-6 h-6 text-blue-500" />
          <h2 className="text-2xl font-black text-[var(--color-text-primary)]">修改密码</h2>
        </div>
        {forced && (
          <p className="text-sm text-amber-500 bg-amber-500/10 rounded-lg px-3 py-2 mb-4">
            出于安全考虑，首次登录后必须修改默认密码。
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-[var(--color-text-secondary)] mb-1">当前密码</label>
            <input
              type="password"
              className="w-full p-3 border border-[var(--color-border)] rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]"
              value={form.old_password}
              onChange={e => setForm({ ...form, old_password: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--color-text-secondary)] mb-1">新密码</label>
            <input
              type="password"
              className="w-full p-3 border border-[var(--color-border)] rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]"
              value={form.new_password}
              onChange={e => setForm({ ...form, new_password: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--color-text-secondary)] mb-1">确认新密码</label>
            <input
              type="password"
              className="w-full p-3 border border-[var(--color-border)] rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]"
              value={form.confirm}
              onChange={e => setForm({ ...form, confirm: e.target.value })}
              required
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-500 bg-red-500/10 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all mt-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {loading ? '提交中...' : '确认修改'}
          </button>

          {!forced && (
            <div className="text-center mt-3">
              <Link href="/admin" className="text-sm text-blue-500 hover:underline">
                返回后台
              </Link>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default function ChangePasswordPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /></div>}>
      <ChangePasswordForm />
    </Suspense>
  );
}
