import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('majlis_theme');
    if (saved) {
      return saved === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('majlis_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('majlis_theme', 'light');
    }
  }, [isDark]);

  return (
    <button
      type="button"
      onClick={() => setIsDark((prev) => !prev)}
      aria-label={isDark ? 'تفعيل الوضع النهاري' : 'تفعيل الوضع الليلي'}
      title={isDark ? 'تفعيل الوضع النهاري' : 'تفعيل الوضع الليلي'}
      className={`p-2 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#2AABEE] ${
        isDark
          ? 'text-yellow-400 hover:bg-[#1f2c3a] active:bg-[#283849]'
          : 'text-slate-600 hover:bg-slate-200/70 active:bg-slate-300/80'
      } ${className}`}
    >
      {isDark ? <Sun className="w-5 h-5 transition-transform hover:rotate-45" /> : <Moon className="w-5 h-5 transition-transform hover:-rotate-12" />}
    </button>
  );
};
