import React, { useState } from 'react';
import { Button, Card, Input } from '@bodo/ui';
import { Settings, Building, Save, CheckCircle2, Hash } from 'lucide-react';

export const SettingsModule: React.FC = () => {
  const [saved, setSaved] = useState(false);
  const [companyInfo, setCompanyInfo] = useState({
    legalName: 'بازرگانی آهن و فولاد پیشتاز پارس',
    economicCode: '۴۱۱۵۶۷۸۹۱۲۳۴',
    registrationNumber: '۵۸۴۹۲۰',
    postalCode: '۱۳۷۸۹۴۵۶۱۲',
    phone: '۰۲۱-۵۵۴۴۳۳۲۲',
    address: 'تهران، بازار آهن شادآباد، بلوار بهاران، پلاک ۱۱۰',
    taxRate: '10',
    currency: 'تومان',
    quotePrefix: 'SQ-1403-',
    orderPrefix: 'SO-1403-',
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-4">
      {/* سربرگ تنظیمات */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            <span>تنظیمات عمومی شرکت و سیستم</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            مشخصات رسمی شرکت، نرخ ارزش افزوده، تنظیمات پیش‌شماره فاکتورها و ارز پایه
          </p>
        </div>

        {saved && (
          <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-4 h-4" />
            <span>تنظیمات با موفقیت ذخیره شد.</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* مشخصات حقوقی شرکت */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Building className="w-4 h-4 text-blue-600" />
            <span>مشخصات حقوقی و مالیاتی شرکت</span>
          </div>

          <div className="space-y-3">
            <Input
              label="نام کامل ثبتی شرکت"
              value={companyInfo.legalName}
              onChange={(e) => setCompanyInfo({ ...companyInfo, legalName: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="کد اقتصادی"
                value={companyInfo.economicCode}
                onChange={(e) => setCompanyInfo({ ...companyInfo, economicCode: e.target.value })}
              />
              <Input
                label="شماره ثبت"
                value={companyInfo.registrationNumber}
                onChange={(e) =>
                  setCompanyInfo({ ...companyInfo, registrationNumber: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="کد پستی"
                value={companyInfo.postalCode}
                onChange={(e) => setCompanyInfo({ ...companyInfo, postalCode: e.target.value })}
              />
              <Input
                label="تلفن دفتر مرکزی"
                value={companyInfo.phone}
                onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })}
              />
            </div>
            <Input
              label="آدرس پستی رسمی"
              value={companyInfo.address}
              onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
            />
          </div>
        </Card>

        {/* تنظیمات اسناد، پیش‌شماره‌ها و مالیات */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Hash className="w-4 h-4 text-emerald-600" />
            <span>تنظیمات اسناد، پیش‌شماره‌ها و مالیات</span>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="پیشوند شماره پیش‌فاکتور"
                value={companyInfo.quotePrefix}
                onChange={(e) => setCompanyInfo({ ...companyInfo, quotePrefix: e.target.value })}
              />
              <Input
                label="پیشوند شماره سفارش فروش قطعی"
                value={companyInfo.orderPrefix}
                onChange={(e) => setCompanyInfo({ ...companyInfo, orderPrefix: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="نرخ مالیات بر ارزش افزوده (درصد)"
                type="number"
                value={companyInfo.taxRate}
                onChange={(e) => setCompanyInfo({ ...companyInfo, taxRate: e.target.value })}
              />
              <Input
                label="ارز مرجع سیستم"
                value={companyInfo.currency}
                disabled
                helperText="طبق قانون سیستم: بدون تبدیل ارزی، همیشه ریال/تومان"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" variant="primary" size="md" className="gap-2">
              <Save className="w-4 h-4" />
              <span>ذخیره تغییرات</span>
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
};
