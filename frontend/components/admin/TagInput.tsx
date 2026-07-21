// leleblog/frontend/components/admin/TagInput.tsx

'use client';
import { useState, KeyboardEvent, FocusEvent } from 'react';
import { X, Hash } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  setTags: (tags: string[]) => void;
  suggestions?: string[]; // 接收建议列表
}

export default function TagInput({ tags, setTags, suggestions = [] }: TagInputProps) {
  const [input, setInput] = useState('');

  // 统一的添加标签方法
  const addTag = (val: string) => {
    const cleanVal = val.trim().replace(/[，,]/g, ''); // 去掉可能残留的逗号
    if (cleanVal && !tags.includes(cleanVal)) {
      setTags([...tags, cleanVal]);
      setInput('');
      return true;
    }
    // 如果重复了，清空输入框
    if (cleanVal && tags.includes(cleanVal)) {
      setInput('');
    }
    return false;
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // 支持 Enter 和 Tab 键
    if (e.key === 'Enter' || e.key === 'Tab') {
      if (input.trim()) {
        e.preventDefault();
        addTag(input);
      }
    }
    
    // 支持删除键：如果输入框为空，按删除键删除最后一个标签
    if (e.key === 'Backspace' && !input && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    // 失去焦点时，如果输入框还有内容，自动存入
    if (input.trim()) {
      addTag(input);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // 如果用户输入了逗号（中英文），立即转换
    if (val.endsWith(',') || val.endsWith('，')) {
      addTag(val);
    } else {
      setInput(val);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 p-2.5 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-secondary)] focus-within:ring-2 focus-within:ring-blue-500/10 focus-within:border-blue-500 transition-all min-h-[50px]">
      {tags.map((tag) => (
        <span 
          key={tag} 
          className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-1 rounded-lg text-xs font-bold border border-blue-100 group animate-in fade-in zoom-in duration-200"
        >
          <Hash className="w-3 h-3 opacity-50" />
          {tag}
          <button 
            type="button" 
            onClick={() => setTags(tags.filter(t => t !== tag))} 
            className="hover:text-red-500 transition-colors ml-1"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <input
        list="tag-suggestions"
        type="text"
        value={input}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur} // 失去焦点自动保存
        placeholder={tags.length === 0 ? "添加标签..." : ""}
        className="flex-1 outline-none text-sm bg-transparent min-w-[120px] py-1 text-[var(--color-text-primary)]"
      />
      <datalist id="tag-suggestions">
        {suggestions.map(s => <option key={s} value={s} />)}
      </datalist>
    </div>
  );
}