// app/admin/login/page.tsx

'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLogin() {
  const [form, setForm] = useState({ username: '', password: '' });
  const router = useRouter();

  const handleLogin = async (e?: React.FormEvent) => {
    // 如果是通过表单提交触发的，必须阻止默认刷新行为
    if (e) e.preventDefault();

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('admin_token', data.token);
        // 若后端要求首次强制改密，跳转至改密页
        if (data.must_change_password) {
          router.push('/admin/change-password?forced=1');
        } else {
          router.push('/admin');
        }
      } else {
        const data = await res.json();
        alert(data.error || '用户名或密码错误');
      }
    } catch (error) {
      console.error("登录请求失败:", error);
      alert('登录请求失败，请检查后端服务是否启动');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
      <div className="p-8 bg-[var(--color-bg-secondary)] rounded-2xl shadow-xl w-96 border border-[var(--color-border)]">
        <h2 className="text-2xl font-black mb-6 text-[var(--color-text-primary)]">后台管理登录</h2>
        
        {/* 修改点 1: 使用 form 标签包裹，并绑定 onSubmit */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-bold text-[var(--color-text-secondary)] mb-1">用户名</label>
            <input 
              id="username"
              type="text" 
              placeholder="请输入用户名" 
              className="w-full p-3 border border-[var(--color-border)] rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]"
              onChange={e => setForm({...form, username: e.target.value})}
              required
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-bold text-[var(--color-text-secondary)] mb-1">密码</label>
            <input 
              id="password"
              type="password" 
              placeholder="请输入密码" 
              className="w-full p-3 border border-[var(--color-border)] rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]"
              onChange={e => setForm({...form, password: e.target.value})}
              required
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all mt-2 active:scale-95"
          >
            立即登录
          </button>
          
          <div className="text-center mt-3">
            <Link href="/admin/forgot-password" className="text-sm text-blue-500 hover:underline">
              忘记密码？
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}