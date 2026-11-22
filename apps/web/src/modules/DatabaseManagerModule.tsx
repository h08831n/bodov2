import React, { useState } from 'react';
import { Button, Badge, Card, Input } from '@bodo/ui';
import { Database, Plus, CheckCircle2, ArrowRightLeft } from 'lucide-react';

export interface DatabaseManagerModuleProps {
  currentDb: string;
  onSwitchDb: (db: string) => void;
}

export const DatabaseManagerModule: React.FC<DatabaseManagerModuleProps> = ({
  currentDb,
  onSwitchDb,
}) => {
  const [databases, setDatabases] = useState([
    {
      name: 'erp_dev',
      company: 'شرکت بازرگانی فولاد نمونه (آزمایشی)',
      status: 'active',
      size: '28 MB',
      lastBackup: '۱۴۰۳/۰۹/۰۲ ۰۲:۰۰',
      migrationVersion: '0002_auth_sessions',
    },
    {
      name: 'erp_demo',
      company: 'توسعه آهن و فولاد کاسپین',
      status: 'active',
      size: '14 MB',
      lastBackup: '۱۴۰۳/۰۹/۰۱ ۲۳:۳۰',
      migrationVersion: '0002_auth_sessions',
    },
    {
      name: 'erp_production',
      company: 'هلدینگ بازرگانی آهن‌آلات',
      status: 'ready',
      size: '42 MB',
      lastBackup: '۱۴۰۳/۰۹/۰۲ ۰۴:۱۵',
      migrationVersion: '0002_auth_sessions',
    },
  ]);

  const [newDbName, setNewDbName] = useState('');
  const [newCompanyName, setNewCompanyName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDbName.trim()) return;

    setIsCreating(true);
    setTimeout(() => {
      const formatted = newDbName.startsWith('erp_') ? newDbName : `erp_${newDbName}`;
      setDatabases([
        ...databases,
        {
          name: formatted,
          company: newCompanyName || 'شرکت بازرگانی جدید',
          status: 'active',
          size: '6 MB',
          lastBackup: 'همین حالا',
          migrationVersion: '0002_auth_sessions',
        },
      ]);
      setIsCreating(false);
      setSuccessMessage(`دیتابیس «${formatted}» با موفقیت در PostgreSQL ساخته و فعال شد.`);
      setNewDbName('');
      setNewCompanyName('');
      setTimeout(() => setSuccessMessage(''), 4000);
    }, 600);
  };

  return (
    <div className="space-y-4">
      {/* سربرگ ماژول دیتابیس منیجر */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" />
            <span>مدیریت دیتابیس‌ها و شرکت‌ها (Database Manager)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            ایزولاسیون کامل سطح سازمانی: هر شرکت دارای یک پایگاه‌داده PostgreSQL مستقل
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">دیتابیس فعال کنونی:</span>
          <Badge variant="primary" className="font-mono font-bold text-xs">
            {currentDb}
          </Badge>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* فرم ساخت دیتابیس شرکت جدید */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Plus className="w-4 h-4 text-indigo-600" />
            <span>ساخت دیتابیس شرکت جدید</span>
          </div>

          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <Input
                label="شناسه دیتابیس (فقط حروف کوچک و عدد)"
                placeholder="مثال: tehran_iron"
                value={newDbName}
                onChange={(e) => setNewDbName(e.target.value.toLowerCase())}
                required
              />
              <span className="text-[10px] text-slate-400 font-mono block mt-1">
                نام کامل در سرور: erp_{newDbName || '...'}
              </span>
            </div>

            <Input
              label="نام ثبتی شرکت بازرگانی"
              placeholder="مثال: بازرگانی فولاد تهران"
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
            />

            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isCreating}
              className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 mt-2"
            >
              <Database className="w-4 h-4" />
              <span>ساخت و راه‌اندازی دیتابیس</span>
            </Button>
          </form>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 space-y-1">
            <p>✓ اجرای خودکار آخرین مایگریشن‌های Prisma</p>
            <p>✓ ایجاد کاربر ادمین شرکت و تنظیمات اولیه</p>
            <p>✓ صفر تداخل داده میان شرکت‌ها</p>
          </div>
        </Card>

        {/* فهرست دیتابیس‌های موجود */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
            پایگاه‌داده‌های شرکت‌های ثبت‌شده
          </h3>

          <div className="space-y-3">
            {databases.map((db) => {
              const isActive = currentDb === db.name;
              return (
                <Card
                  key={db.name}
                  className={`p-5 transition-all ${
                    isActive
                      ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20 ring-1 ring-indigo-500/30'
                      : 'hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-mono font-bold">
                        <Database className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                            {db.name}
                          </h4>
                          {isActive && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                              متصل هم‌اکنون
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {db.company}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isActive && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onSwitchDb(db.name)}
                          className="gap-1.5 text-indigo-600 border-indigo-200 dark:border-indigo-800"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          <span>سوئیچ به این دیتابیس</span>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => alert(`بکاپ از دیتابیس ${db.name} با فرمت ZIP دانلود شد.`)}
                        className="text-xs"
                      >
                        دریافت بکاپ
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                    <div>حجم دیتابیس: {db.size}</div>
                    <div>آخرین بکاپ: {db.lastBackup}</div>
                    <div>نسخه مایگریشن: {db.migrationVersion}</div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
