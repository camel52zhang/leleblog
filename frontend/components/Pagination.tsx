'use client';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  current: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}

export default function Pagination({ current, total, pageSize, onChange }: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null; // 只有一页时不显示

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <div className="mt-12 flex items-center justify-center gap-2">
      {/* 前一页 */}
      <button
        disabled={current === 1}
        onClick={() => onChange(current - 1)}
        className="flex items-center gap-1 px-3 py-2 text-blue-600 hover:bg-blue-50 disabled:text-[var(--color-text-tertiary)] disabled:hover:bg-transparent transition-colors"
      >
        « 前一页
      </button>

      {/* 数字页码 */}
      {pages.map(page => (
        <button
          key={page}
          onClick={() => onChange(page)}
          className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all font-medium
            ${current === page 
              ? 'bg-[var(--color-bg-tertiary)] text-blue-600 font-bold shadow-inner' 
              : 'text-blue-500 hover:bg-blue-50'}`}
        >
          {page}
        </button>
      ))}

      {/* 后一页 */}
      <button
        disabled={current === totalPages}
        onClick={() => onChange(current + 1)}
        className="flex items-center gap-1 px-3 py-2 text-blue-600 hover:bg-blue-50 disabled:text-[var(--color-text-tertiary)] disabled:hover:bg-transparent transition-colors"
      >
        后一页 »
      </button>
    </div>
  );
}