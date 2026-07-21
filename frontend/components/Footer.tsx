// components/Footer.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Github, ArrowUp } from "lucide-react";

export default function Footer() {
  const [showBackToTop, setShowBackToTop] = useState(false);

  // 监听滚动事件，决定是否显示按钮
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 执行平滑滚动到顶部
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <footer className="w-full py-4 text-center">
      <div className="flex justify-center items-center gap-1 text-xs text-[var(--color-text-secondary)] opacity-60 hover:opacity-80 transition-opacity">
        <Github className="w-3 h-3" />
        <Link
          href="https://github.com/camel52zhang/LeleBlog"
          target="_blank"
          className="hover:underline underline-offset-2"
        >
          @LeleBlog
        </Link>
      </div>

      {/* 回到顶部按钮 */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 p-3 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-full shadow-lg text-[var(--color-text-secondary)] hover:text-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-300 z-50 hover:scale-110 active:scale-95 ${
          showBackToTop ? "opacity-100 translate-y-0 visible" : "opacity-0 translate-y-4 invisible"
        }`}
        aria-label="回到顶部"
        title="回到顶部"
      >
        <ArrowUp className="w-5 h-5" />
      </button>
    </footer>
  );
}