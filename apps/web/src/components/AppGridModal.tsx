import React from 'react';
import { Building2, Package, Database, Settings, X, TrendingUp } from 'lucide-react';

export interface AppGridModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeModule: string;
  onSelectModule: (module: string) => void;
}

export const AppGridModal: React.FC<AppGridModalProps> = ({
  isOpen,
  onClose,
  activeModule,
  onSelectModule,
}) => {
  if (!isOpen) return null;

  const apps = [
    {
      id: 'sales',
      name: 'فروش و بازرگانی',
      description: 'پیش‌فاکتورها، سفارشات فروش، فرآیند تایید و باخت',
      icon: <TrendingUp className="w-8 h-8 text-blue-600" />,
      badge: 'اصلی',
      color: 'bg-blue-500/10 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    },
    {
      id: 'contacts',
      name: 'مخاطبین و شرکا',
      description: 'مشتریان، تامین‌کنندگان، باربری‌ها و تاریخچه ارتباطات',
      icon: <Building2 className="w-8 h-8 text-emerald-600" />,
      badge: 'یکپارچه',
      color: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    },
    {
      id: 'products',
      name: 'محصولات و آهن‌آلات',
      description: 'کاتالوگ میلگرد، تیرآهن، ورق با متغیرهای کارخانه و سایز',
      icon: <Package className="w-8 h-8 text-amber-600" />,
      badge: 'قیمت روز',
      color: 'bg-amber-500/10 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    },
    {
      id: 'databases',
      name: 'مدیریت دیتابیس‌ها',
      description: 'ایزولاسیون شرکتی، ساخت، ارتقا، بکاپ و بازیابی',
      icon: <Database className="w-8 h-8 text-indigo-600" />,
      badge: 'Multi-Tenant',
      color: 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
    },
    {
      id: 'settings',
      name: 'تنظیمات شرکت',
      description: 'اطلاعات حقوقی شرکت، الگوهای شماره‌گذاری، ارزها و مالیات',
      icon: <Settings className="w-8 h-8 text-slate-600 dark:text-slate-400" />,
      color: 'bg-slate-500/10 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 left-6 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-2xl shadow-lg mb-3">
            ب
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            شبکه برنامه‌های bodo ERP
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            سامانه یکپارچه مدیریت بازرگانی آهن‌آلات — برای ورود به هر ماژول کلیک کنید
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {apps.map((app) => {
            const isActive = activeModule === app.id;
            return (
              <button
                key={app.id}
                type="button"
                onClick={() => {
                  onSelectModule(app.id);
                  onClose();
                }}
                className={`p-6 rounded-2xl border text-right transition-all flex flex-col justify-between cursor-pointer group hover:-translate-y-0.5 hover:shadow-lg ${
                  isActive
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`p-3.5 rounded-2xl transition-transform group-hover:scale-105 ${app.color}`}
                  >
                    {app.icon}
                  </div>
                  {app.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {app.badge}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {app.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {app.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
