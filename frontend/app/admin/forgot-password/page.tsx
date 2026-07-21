'use client';
import { useState } from 'react';
import Link from 'next/link';

type Step = 'email' | 'reset' | 'done';

export default function ForgotPassword() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || '验证码已发送');
        setStep('reset');
      } else {
        setError(data.error || '发送失败');
      }
    } catch {
      setError('请求失败，请检查后端服务是否启动');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError('两次密码输入不一致');
      setLoading(false);
      return;
    }
    if (newPassword.length < 6) {
      setError('密码长度不能少于6位');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, new_password: newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setStep('done');
      } else {
        setError(data.error || '重置失败');
      }
    } catch {
      setError('请求失败，请检查后端服务是否启动');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
      <div className="p-8 bg-[var(--color-bg-secondary)] rounded-2xl shadow-xl w-96 border border-[var(--color-border)]">
        {step === 'email' && (
          <>
            <h2 className="text-2xl font-black mb-2 text-[var(--color-text-primary)]">找回密码</h2>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
              请输入管理员邮箱，我们将发送验证码
            </p>
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-bold text-[var(--color-text-secondary)] mb-1">
                  邮箱
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="请输入管理员邮箱"
                  className="w-full p-3 border border-[var(--color-border)] rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all mt-2 active:scale-95"
              >
                {loading ? '发送中...' : '获取验证码'}
              </button>
            </form>
            <div className="mt-4 text-center">
              <Link href="/admin/login" className="text-sm text-blue-500 hover:underline">
                ← 返回登录
              </Link>
            </div>
          </>
        )}

        {step === 'reset' && (
          <>
            <h2 className="text-2xl font-black mb-2 text-[var(--color-text-primary)]">重置密码</h2>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
              验证码已发送至 <strong>{email}</strong>（有效期15分钟）
            </p>
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label htmlFor="code" className="block text-sm font-bold text-[var(--color-text-secondary)] mb-1">
                  验证码
                </label>
                <input
                  id="code"
                  type="text"
                  placeholder="请输入6位验证码"
                  className="w-full p-3 border border-[var(--color-border)] rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  required
                  maxLength={6}
                />
              </div>
              <div>
                <label htmlFor="newPassword" className="block text-sm font-bold text-[var(--color-text-secondary)] mb-1">
                  新密码
                </label>
                <input
                  id="newPassword"
                  type="password"
                  placeholder="至少6位"
                  className="w-full p-3 border border-[var(--color-border)] rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-bold text-[var(--color-text-secondary)] mb-1">
                  确认新密码
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="再次输入新密码"
                  className="w-full p-3 border border-[var(--color-border)] rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all mt-2 active:scale-95"
              >
                {loading ? '重置中...' : '重置密码'}
              </button>
            </form>
          </>
        )}

        {step === 'done' && (
          <div className="text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-2xl font-black mb-2 text-[var(--color-text-primary)]">密码重置成功</h2>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
              请使用新密码登录后台
            </p>
            <Link
              href="/admin/login"
              className="inline-block w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95"
            >
              前往登录
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}