'use client';

import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 把真实错误打到控制台，方便排查
    console.error('后台页面运行时错误:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)] p-6">
      <div className="p-8 bg-[var(--color-bg-secondary)] rounded-2xl shadow-xl w-full max-w-lg border border-[var(--color-border)] text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <AlertCircle className="w-6 h-6 text-red-500" />
        </div>
        <h2 className="text-xl font-black text-[var(--color-text-primary)] mb-2">页面出错了</h2>
        <p className="text-sm text-[var(--color-text-tertiary)] mb-4 break-words">
          {error.message || '发生了一个未知错误'}
        </p>
        {error.digest && (
          <p className="text-xs text-[var(--color-text-tertiary)] mb-4 font-mono">digest: {error.digest}</p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all"
          >
            重试
          </button>
          <Link
            href="/admin"
            className="px-5 py-2.5 rounded-xl font-bold border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-all"
          >
            返回仪表盘
          </Link>
        </div>
      </div>
    </div>
  );
}
