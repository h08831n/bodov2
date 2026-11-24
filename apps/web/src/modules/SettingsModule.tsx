import React, { useState, useEffect } from 'react';
import { Button, Card, Input } from '@bodo/ui';
import { api } from '../api/client';
import {
  Settings,
  Building,
  Save,
  CheckCircle2,
  Landmark,
  FileSpreadsheet,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export const SettingsModule: React.FC = () => {
  const [saved, setSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [companyInfo, setCompanyInfo] = useState({
    name: 'بازرگانی آهن و مقاطع فولادی پیشتاز',
    legalName: 'شرکت بازرگانی آهن و مقاطع فولادی پیشتاز پارس (سهامی خاص)',
    economicCode: '۴۱۱۵۶۷۸۹۱۲۳۴',
    nationalId: '۱۰۱۰۳۸۲۹۱۰۰',
    registrationNo: '۵۸۴۹۲۰',
    postalCode: '۱۳۷۸۹۴۵۶۱۲',
    phone: '۰۲۱-۵۴۰۱۹۰۰۰',
    email: 'info@pishtaz-steel.com',
    website: '',
    address: 'تهران، بازار آهن شادآباد، مجتمع تجاری ۱۱۰، پلاک ۴۲',
    bankName: 'بانک ملت - شعبه بازار آهن شادآباد',
    accountNumber: '۵۸۴۹-۲۰۱۱-۳۳۴۴',
    iban: 'IR820120000000005849201133',
    defaultTaxRate: 10,
    defaultQuoteValidityDays: 1,
    termsAndConditions:
      '۱. وزن نهایی بار پس از باسکول رسمی مبدأ یا مقصد محاسبه و تسویه حساب مالی بر مبنای قبض باسکول معتبر انجام می‌گیرد.\n۲. کرایه حمل طبق بارنامه رسمی باربری بوده و بر عهده خریدار می‌باشد مگر در موارد توافق‌شده.\n۳. تخلیه بار در مقصد بر عهده خریدار است.',
    logoUrl: '',
  });

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    api.settings
      .getCompany()
      .then((data) => {
        if (!isMounted || !data) return;
        setCompanyInfo({
          name: data.name || '',
          legalName: data.legalName || '',
          economicCode: data.economicCode || '',
          nationalId: data.nationalId || '',
          registrationNo: data.registrationNo || '',
          postalCode: data.postalCode || '',
          phone: data.phone || '',
          email: data.email || '',
          website: data.website || '',
          address: data.address || '',
          bankName: data.bankName || '',
          accountNumber: data.accountNumber || '',
          iban: data.iban || '',
          defaultTaxRate: Number(data.defaultTaxRate) || 10,
          defaultQuoteValidityDays: Number(data.defaultQuoteValidityDays) || 1,
          termsAndConditions: data.termsAndConditions || '',
          logoUrl: data.logoUrl || '',
        });
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'خطا در بارگذاری تنظیمات شرکت');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.settings.updateCompany({
        name: companyInfo.name,
        legalName: companyInfo.legalName,
        economicCode: companyInfo.economicCode,
        nationalId: companyInfo.nationalId,
        registrationNo: companyInfo.registrationNo,
        postalCode: companyInfo.postalCode,
        phone: companyInfo.phone,
        email: companyInfo.email || undefined,
        website: companyInfo.website,
        address: companyInfo.address,
        bankName: companyInfo.bankName,
        accountNumber: companyInfo.accountNumber,
        iban: companyInfo.iban,
        defaultTaxRate: Number(companyInfo.defaultTaxRate),
        defaultQuoteValidityDays: Number(companyInfo.defaultQuoteValidityDays),
        termsAndConditions: companyInfo.termsAndConditions,
        logoUrl: companyInfo.logoUrl,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ذخیره‌سازی تنظیمات شرکت');
    }
  };

  return (
    <div className="space-y-6">
      {/* سربرگ تنظیمات */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-600" />
            <span>تنظیمات شرکت، مشخصات ثبتی و پارامترهای فروش (PAGE-SET-01)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            مشخصات رسمی جهت صدور فاکتور رسمی دارایی (ماده ۱۶۹ مکرر)، اطلاعات بانکی و شرایط تحویل
            بازار آهن
          </p>
        </div>

        {saved && (
          <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>تنظیمات شرکت با موفقیت در دیتابیس اختصاصی ذخیره شد.</span>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-xs text-slate-400">در حال بارگذاری تنظیمات شرکت...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* مشخصات حقوقی و مالیاتی شرکت */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Building className="w-4 h-4 text-blue-600" />
              <span>مشخصات حقوقی، ثبتی و مالیاتی شرکت</span>
            </div>

            <div className="space-y-3">
              <Input
                label="نام تجاری بازرگانی"
                value={companyInfo.name}
                onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
              />
              <Input
                label="نام کامل ثبتی (شخص حقوقی)"
                value={companyInfo.legalName}
                onChange={(e) => setCompanyInfo({ ...companyInfo, legalName: e.target.value })}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="شماره اقتصادی (۱۲ رقمی)"
                  value={companyInfo.economicCode}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, economicCode: e.target.value })}
                />
                <Input
                  label="شناسه ملی شرکت (۱۱ رقمی)"
                  value={companyInfo.nationalId}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, nationalId: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="شماره ثبت شرکت"
                  value={companyInfo.registrationNo}
                  onChange={(e) =>
                    setCompanyInfo({ ...companyInfo, registrationNo: e.target.value })
                  }
                />
                <Input
                  label="کد پستی ۱۰ رقمی دفتر"
                  value={companyInfo.postalCode}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, postalCode: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="تلفن دفتر مرکزی"
                  value={companyInfo.phone}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })}
                />
                <Input
                  label="پست الکترونیکی (ایمیل)"
                  value={companyInfo.email}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, email: e.target.value })}
                />
              </div>
              <Input
                label="نشانی کامل دفتر و انبار"
                value={companyInfo.address}
                onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
              />
            </div>
          </Card>

          {/* حساب‌های بانکی و پارامترهای فروش */}
          <div className="space-y-6">
            {/* کارت اطلاعات بانکی و خزانه‌داری */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Landmark className="w-4 h-4 text-emerald-600" />
                <span>اطلاعات حساب بانکی و واریز رسمی (جهت درج در فاکتور)</span>
              </div>

              <div className="space-y-3">
                <Input
                  label="نام بانک و شعبه"
                  value={companyInfo.bankName}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, bankName: e.target.value })}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="شماره حساب"
                    value={companyInfo.accountNumber}
                    onChange={(e) =>
                      setCompanyInfo({ ...companyInfo, accountNumber: e.target.value })
                    }
                  />
                  <Input
                    label="شماره شبا (IBAN)"
                    value={companyInfo.iban}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, iban: e.target.value })}
                    helperText="فرمت: IR..."
                  />
                </div>
              </div>
            </Card>

            {/* کارت پارامترهای پیش‌فرض فروش و بازار آهن */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3">
                <FileSpreadsheet className="w-4 h-4 text-amber-600" />
                <span>پارامترهای پیش‌فرض فروش آهن‌آلات</span>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="نرخ پیش‌فرض مالیات بر ارزش افزوده (درصد)"
                    type="number"
                    value={String(companyInfo.defaultTaxRate)}
                    onChange={(e) =>
                      setCompanyInfo({
                        ...companyInfo,
                        defaultTaxRate: Number(e.target.value) || 0,
                      })
                    }
                  />
                  <Input
                    label="مهلت استاندارد اعتبار پیش‌فاکتور (روز)"
                    type="number"
                    value={String(companyInfo.defaultQuoteValidityDays)}
                    onChange={(e) =>
                      setCompanyInfo({
                        ...companyInfo,
                        defaultQuoteValidityDays: Number(e.target.value) || 1,
                      })
                    }
                    helperText="با توجه به نوسان روزانه نرخ آهن‌آلات"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    شرایط و ضوابط پیش‌فرض تحویل، بارگیری و باسکول
                  </label>
                  <textarea
                    rows={3}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans"
                    value={companyInfo.termsAndConditions}
                    onChange={(e) =>
                      setCompanyInfo({ ...companyInfo, termsAndConditions: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                >
                  <Save className="w-4 h-4" />
                  <span>ذخیره تغییرات تنظیمات</span>
                </Button>
              </div>
            </Card>
          </div>
        </form>
      )}
    </div>
  );
};
