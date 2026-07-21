'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative flex items-center justify-center w-9 h-9 rounded-lg hover:bg-[var(--color-bg-hover)] focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-300"
      aria-label={theme === 'light' ? '切换到暗色模式' : '切换到亮色模式'}
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors" />
      ) : (
        <Sun className="w-5 h-5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors" />
      )}
    </button>
  );
}
