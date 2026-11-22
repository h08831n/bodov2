import React from 'react';
import { Grid, Search, Moon, Sun, Database, ChevronDown, LogOut } from 'lucide-react';

export interface NavbarProps {
  activeModule?: string;
  activeModuleName: string;
  onOpenAppGrid: () => void;
  onOpenCommandPalette: () => void;
  currentDatabase: string;
  isDark: boolean;
  onToggleTheme: () => void;
  currentUser?: string;
  onLogout?: () => void;
  onOpenDbManager?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeModuleName,
  onOpenAppGrid,
  onOpenCommandPalette,
  currentDatabase,
  isDark,
  onToggleTheme,
  currentUser = 'حسین (مدیر ارشد)',
  onLogout,
  onOpenDbManager,
}) => {
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 flex items-center justify-between">
      {/* سمت راست: آیکون اپ گرید و عنوان برنامه */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenAppGrid}
          title="شبکه برنامه‌ها (App Switcher)"
          className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer group flex items-center gap-2"
        >
          <Grid className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
          <span className="font-black text-lg tracking-tight hidden sm:inline text-slate-900 dark:text-slate-100">
            bodo
          </span>
        </button>

        <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium hidden md:inline">برنامه:</span>
          <span className="text-sm font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg">
            {activeModuleName}
          </span>
        </div>
      </div>

      {/* بخش مرکزی: جستجوی سریع کیبورد Ctrl+K */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-600 dark:hover:text-slate-300 transition-all text-xs cursor-pointer shadow-2xs"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5" />
            <span>جستجوی سریع در سیستم...</span>
          </div>
          <kbd className="px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-[10px] text-slate-500 shadow-2xs">
            Ctrl + K
          </kbd>
        </button>
      </div>

      {/* سمت چپ: دیتابیس فعال، تم، اعلان و پروفایل */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenDbManager}
          title="دیتابیس فعال شرکت"
          className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer"
        >
          <Database className="w-3.5 h-3.5 text-indigo-600" />
          <span className="font-mono font-bold">{currentDatabase}</span>
        </button>

        <button
          type="button"
          onClick={onToggleTheme}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="تغییر حالت شب/روز"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* منوی کاربر */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
              ح
            </div>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 hidden lg:inline">
              {currentUser}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {userMenuOpen && (
            <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {currentUser}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">مدیر سیستم بازرگانی</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false);
                  onOpenDbManager?.();
                }}
                className="w-full text-right px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
              >
                <Database className="w-3.5 h-3.5" />
                <span>سوئیچ و مدیریت دیتابیس</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false);
                  onLogout?.();
                }}
                className="w-full text-right px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 cursor-pointer border-t border-slate-100 dark:border-slate-800"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>خروج از حساب</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
