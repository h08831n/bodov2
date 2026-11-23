import React, { useState, useEffect } from 'react';
import { Card, Badge, Button } from '@bodo/ui';
import { api } from '../api/client';
import type { PortalOrderView as PortalOrderViewType } from '@bodo/contracts';
import {
  Building2,
  Calendar,
  Truck,
  Printer,
  Scale,
  MapPin,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  FileText,
} from 'lucide-react';

interface PortalOrderViewProps {
  orderIdentifier?: string;
  onBack?: () => void;
}

export const PortalOrderView: React.FC<PortalOrderViewProps> = ({ orderIdentifier, onBack }) => {
  const [identifier, setIdentifier] = useState<string>(() => {
    if (orderIdentifier) return orderIdentifier;
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('orderId') || urlParams.get('token') || '';
    }
    return '';
  });

  const [order, setOrder] = useState<PortalOrderViewType | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPortalOrder = (idToFetch: string) => {
    if (!idToFetch) {
      setIsLoading(false);
      setError('شناسه یا شماره پیش‌فاکتور برای مشاهده در پورتال مشخص نشده است');
      return;
    }

    setIsLoading(true);
    setError(null);

    api.portal
      .getOrder(idToFetch)
      .then((data) => {
        setOrder(data);
      })
      .catch((err) => {
        const msg =
          err instanceof Error ? err.message : 'خطا در واکشی اطلاعات سند از پورتال مشتریان';
        setError(msg);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (identifier) {
      fetchPortalOrder(identifier);
    } else {
      // Default to trying first available quotation if none provided
      api.sales
        .list()
        .then((quotes) => {
          if (quotes && quotes.length > 0 && quotes[0]) {
            const firstId = quotes[0].id;
            setIdentifier(firstId);
            fetchPortalOrder(firstId);
          } else {
            setIsLoading(false);
            setError('هیچ پیش‌فاکتوری در دیتابیس شرکت جهت مشاهده در پورتال یافت نشد');
          }
        })
        .catch(() => {
          setIsLoading(false);
          setError('لطفاً شماره سند یا توکن دسترسی پورتال را وارد فرمایید');
        });
    }
  }, [identifier]);

  const stageLabels: Record<
    string,
    { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'neutral' }
  > = {
    DRAFT: { label: 'پیش‌نویس اولیه', variant: 'neutral' },
    SENT: { label: 'ارسال‌شده به مشتری', variant: 'warning' },
    CONFIRMED: { label: 'سفارش قطعی فروش (تایید نهایی)', variant: 'success' },
    LOST: { label: 'باخت / منقضی‌شده', variant: 'danger' },
    CANCELLED: { label: 'لغو شده', variant: 'danger' },
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] p-8 text-center space-y-4">
        <RefreshCw className="w-10 h-10 text-emerald-600 animate-spin" />
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
          در حال بارگذاری اطلاعات پیش‌فاکتور از پورتال خریدار...
        </h3>
        <p className="text-xs text-slate-400">اتصال امن به وب‌سرویس پورتال بازرگانی آهن و فولاد</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-xl mx-auto p-6 space-y-4">
        <Card className="p-8 text-center space-y-4 border-rose-200 dark:border-rose-900 bg-rose-50/20">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            خطا در مشاهده سند پورتال
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">{error}</p>
          <div className="pt-2 flex justify-center gap-3">
            {onBack && (
              <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
                <ArrowRight className="w-4 h-4" />
                <span>بازگشت</span>
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={() => fetchPortalOrder(identifier)}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              <RefreshCw className="w-4 h-4" />
              <span>تلاش مجدد</span>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const stageInfo = stageLabels[order.stage] || { label: order.stage, variant: 'default' };
  const totalWeight = Number(order.totalWeightKg ?? 0);
  const totalTonnage = totalWeight > 0 ? (totalWeight / 1000).toFixed(2) : '0';

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4 sm:p-6 print:p-0 print:max-w-none">
      {/* نوار عملیات بالای صفحه */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="outline" size="sm" onClick={onBack} className="gap-1.5">
              <ArrowRight className="w-4 h-4" />
              <span>بازگشت به فروش</span>
            </Button>
          )}
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
            <Building2 className="w-5 h-5 text-emerald-600" />
            <span>پورتال مستقل خریدار (PAGE-PORT-01)</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="gap-1.5 text-slate-700 dark:text-slate-200"
          >
            <Printer className="w-4 h-4" />
            <span>چاپ / ذخیره PDF رسمی</span>
          </Button>
        </div>
      </div>

      {/* برگ رسمی پیش‌فاکتور و سفارش در پورتال */}
      <Card className="p-6 sm:p-10 space-y-8 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-md rounded-2xl print:shadow-none print:border-none">
        {/* سربرگ رسمی سند */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {order.companyInfo?.name || 'بازرگانی آهن‌آلات و فولاد'}
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {order.companyInfo?.address || 'تهران، بازار آهن شادآباد'} | تلفن:{' '}
              <span className="font-mono">{order.companyInfo?.phone || '۰۲۱-۵۴۰۱۹۰۰۰'}</span>
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-1.5 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">شماره پیش‌فاکتور:</span>
              <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                {order.quotationNo}
              </span>
            </div>
            {order.orderNo && (
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                <span>شماره سفارش قطعی:</span>
                <span className="font-mono text-sm">{order.orderNo}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-slate-400">تاریخ صدور:</span>
              <span className="font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {order.date ? order.date.slice(0, 10) : '—'}
              </span>
            </div>
            <div className="pt-1">
              <Badge variant={stageInfo.variant} className="text-xs font-bold px-2.5 py-1">
                {order.stage === 'CONFIRMED' && (
                  <CheckCircle2 className="w-3.5 h-3.5 ml-1 inline" />
                )}
                {order.stage === 'SENT' && <Clock className="w-3.5 h-3.5 ml-1 inline" />}
                {stageInfo.label}
              </Badge>
            </div>
          </div>
        </div>

        {/* مشخصات خریدار و نشانی تحویل */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 text-xs sm:text-sm">
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-400 block">خریدار محترم:</span>
            <div className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>{order.customerName}</span>
            </div>
            {order.salespersonName && (
              <p className="text-xs text-slate-500">
                کارشناس پیگیری:{' '}
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {order.salespersonName}
                </span>
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-400 block">آدرس و شرایط تحویل بار:</span>
            <div className="font-medium text-slate-700 dark:text-slate-300 flex items-start gap-2">
              <MapPin className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
              <span>
                {order.shippingAddress ||
                  'تحویل درب انبار رسمی شرکت (ارسال به مقصد با هماهنگی باربری)'}
              </span>
            </div>
            {order.notes && (
              <p className="text-xs text-slate-500 pt-1">
                توضیحات: <span className="text-slate-600 dark:text-slate-300">{order.notes}</span>
              </p>
            )}
          </div>
        </div>

        {/* جدول اقلام آهن‌آلات و مقاطع فولادی */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>اقلام و مشخصات مقاطع فولادی</span>
            </h2>
            <span className="text-xs text-slate-400">تمام مبالغ به تومان</span>
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-bold">
                <tr>
                  <th className="p-3 w-12 text-center">ردیف</th>
                  <th className="p-3">شرح کالا</th>
                  <th className="p-3">کارخانه سازنده</th>
                  <th className="p-3 text-center">واحد</th>
                  <th className="p-3 text-center">مقدار</th>
                  <th className="p-3 text-left">فی واحد (تومان)</th>
                  <th className="p-3 text-center">مالیات</th>
                  <th className="p-3 text-left">مبلغ کل (تومان)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {order.lines.map((line, idx) => (
                  <tr
                    key={line.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="p-3 text-center text-slate-400 font-sans">{idx + 1}</td>
                    <td className="p-3 font-sans font-bold text-slate-800 dark:text-slate-200">
                      {line.productName}
                    </td>
                    <td className="p-3 font-sans text-slate-600 dark:text-slate-400">
                      {line.mill || '—'}
                    </td>
                    <td className="p-3 text-center font-sans text-slate-500">{line.unit}</td>
                    <td className="p-3 text-center font-bold text-slate-900 dark:text-slate-100">
                      {Number(line.quantity).toLocaleString('fa-IR')}
                    </td>
                    <td className="p-3 text-left text-slate-700 dark:text-slate-300">
                      {Number(line.unitPriceToman).toLocaleString('fa-IR')}
                    </td>
                    <td className="p-3 text-center text-slate-400">{Number(line.taxPercent)}٪</td>
                    <td className="p-3 text-left font-bold text-slate-900 dark:text-slate-100">
                      {Number(line.totalPriceToman).toLocaleString('fa-IR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* بخش تجمیعی تناژ، کرایه حمل و مبالغ نهایی */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* کارت وزن و تناژ کل */}
          <div className="p-5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center shrink-0">
              <Scale className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300 block">
                مجموع وزن و تناژ سفارش:
              </span>
              <div className="text-lg font-black text-slate-900 dark:text-slate-100 font-mono mt-0.5">
                {totalWeight.toLocaleString('fa-IR')}{' '}
                <span className="text-xs font-sans font-normal text-slate-500">کیلوگرم</span>
                <span className="mx-2 text-slate-300 dark:text-slate-700">|</span>
                <span className="text-amber-700 dark:text-amber-400">
                  {Number(totalTonnage).toLocaleString('fa-IR')}
                </span>{' '}
                <span className="text-xs font-sans font-normal text-slate-500">تن</span>
              </div>
            </div>
          </div>

          {/* فاکتور مبالغ تجمیعی، کرایه حمل و جمع نهایی */}
          <div className="space-y-3 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm">
            <div className="flex justify-between items-center text-slate-500">
              <span>جمع ارزش کالاها:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {Number(order.subtotalToman).toLocaleString('fa-IR')} تومان
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-500">
              <span>مالیات بر ارزش افزوده (۱۰٪):</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">
                {Number(order.taxToman).toLocaleString('fa-IR')} تومان
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-700 dark:text-slate-300 font-medium pt-1">
              <span className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-sky-600" />
                <span>کرایه حمل باربری:</span>
              </span>
              <span className="font-mono font-bold text-sky-700 dark:text-sky-400">
                {Number(order.freightToman ?? 0) > 0
                  ? `${Number(order.freightToman).toLocaleString('fa-IR')} تومان`
                  : 'توافقی / پس‌کرایه مقصد'}
              </span>
            </div>

            <div className="h-px bg-slate-200 dark:bg-slate-700 pt-1" />

            <div className="flex justify-between items-center text-base sm:text-lg font-black text-slate-900 dark:text-white pt-1">
              <span>مبلغ نهایی قابل پرداخت:</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">
                {Number(order.grandTotalToman).toLocaleString('fa-IR')}{' '}
                <span className="text-xs font-sans font-normal">تومان</span>
              </span>
            </div>
          </div>
        </div>

        {/* پاورقی شرایط معامله بازار آهن */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 space-y-1">
          <p>
            • وزن نهایی بار پس از باسکول رسمی مبدأ یا مقصد محاسبه و تسویه نهایی بر مبنای قبض باسکول
            معتبر انجام خواهد شد.
          </p>
          <p>
            • این سند در سامانه پورتال مشتریان بازرگانی آهن‌آلات به آدرس یکپارچه ثبت و قابل استعلام
            آنلاین می‌باشد.
          </p>
        </div>
      </Card>
    </div>
  );
};
