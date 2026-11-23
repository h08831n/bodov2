import React, { useEffect, useState } from 'react';
import {
  Search,
  PlusCircle,
  Building2,
  FileText,
  Package,
  Database,
  X,
  ShoppingCart,
} from 'lucide-react';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (module: string) => void;
  onAction?: (action: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onAction,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // open handled by parent
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const items = [
    {
      id: 'app-sales',
      title: 'ماژول فروش و پیش‌فاکتورها',
      category: 'برنامه‌ها',
      icon: <FileText className="w-4 h-4 text-blue-500" />,
      action: () => {
        onNavigate('sales');
        onClose();
      },
    },
    {
      id: 'app-purchases',
      title: 'ماژول خرید، تأمین و استعلام‌ها',
      category: 'برنامه‌ها',
      icon: <ShoppingCart className="w-4 h-4 text-rose-500" />,
      action: () => {
        onNavigate('purchases');
        onClose();
      },
    },
    {
      id: 'app-contacts',
      title: 'ماژول مخاطبین و تامین‌کنندگان',
      category: 'برنامه‌ها',
      icon: <Building2 className="w-4 h-4 text-emerald-500" />,
      action: () => {
        onNavigate('contacts');
        onClose();
      },
    },
    {
      id: 'app-products',
      title: 'کاتالوگ محصولات و انبار آهن‌آلات',
      category: 'برنامه‌ها',
      icon: <Package className="w-4 h-4 text-amber-500" />,
      action: () => {
        onNavigate('products');
        onClose();
      },
    },
    {
      id: 'app-db',
      title: 'مدیریت دیتابیس‌ها و شرکت‌ها',
      category: 'مدیریت',
      icon: <Database className="w-4 h-4 text-indigo-500" />,
      action: () => {
        onNavigate('databases');
        onClose();
      },
    },
    {
      id: 'act-new-quote',
      title: 'ایجاد پیش‌فاکتور فروش جدید',
      category: 'عملیات سریع',
      icon: <PlusCircle className="w-4 h-4 text-blue-600" />,
      action: () => {
        onNavigate('sales');
        onAction?.('new-quotation');
        onClose();
      },
    },
    {
      id: 'act-new-contact',
      title: 'ثبت مخاطب یا مشتری جدید',
      category: 'عملیات سریع',
      icon: <PlusCircle className="w-4 h-4 text-emerald-600" />,
      action: () => {
        onNavigate('contacts');
        onAction?.('new-contact');
        onClose();
      },
    },
  ];

  const filtered = items.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center px-4 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 ml-2" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجو در بخش‌ها، مشتریان، پیش‌فاکتورها یا دستورات..."
            className="w-full py-4 text-sm bg-transparent outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <p className="text-center py-8 text-xs text-slate-400">نتیجه‌ای یافت نشد.</p>
          ) : (
            filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={item.action}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-right cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 group-hover:bg-white dark:group-hover:bg-slate-700 shadow-2xs">
                    {item.icon}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-slate-400">{item.category}</div>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-slate-400 group-hover:text-blue-500">
                  Enter ↵
                </span>
              </button>
            ))
          )}
        </div>

        <div className="p-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between text-[11px] text-slate-400">
          <span>حرکت با کلیدهای جهت‌نما</span>
          <span>بستن با Esc</span>
        </div>
      </div>
    </div>
  );
};
