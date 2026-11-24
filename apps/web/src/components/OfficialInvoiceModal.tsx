import React, { useState, useEffect } from 'react';
import { Button } from '@bodo/ui';
import { api } from '../api/client';
import type { OfficialInvoiceView } from '@bodo/contracts';
import { Printer, X, FileText, AlertCircle, RefreshCw } from 'lucide-react';

interface OfficialInvoiceModalProps {
  orderId: string;
  onClose: () => void;
}

export const OfficialInvoiceModal: React.FC<OfficialInvoiceModalProps> = ({ orderId, onClose }) => {
  const [invoice, setInvoice] = useState<OfficialInvoiceView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    api.settings
      .getOfficialInvoice(orderId)
      .then((data) => {
        setInvoice(data);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'خطا در بارگذاری اطلاعات فاکتور رسمی');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [orderId]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:fixed-none">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-5xl max-h-[96vh] overflow-y-auto p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl print:shadow-none print:border-none print:max-h-none print:p-0">
        {/* نوار بالای مودال (غیرقابل چاپ) */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 print:hidden">
          <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base">
            <FileText className="w-5 h-5 text-emerald-600" />
            <span>پیش‌نمایش فاکتور رسمی فروش (ماده ۱۶۹ مکرر قانون مالیات‌های مستقیم)</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => window.print()}
              disabled={isLoading || !invoice}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
            >
              <Printer className="w-4 h-4" />
              <span>چاپ فاکتور رسمی (A4)</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} className="p-1.5">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* وضعیت لودینگ */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center p-16 space-y-4 text-center">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              در حال فراخوانی اطلاعات و تطبیق مشخصات ثبتی و مالیاتی...
            </p>
          </div>
        )}

        {/* وضعیت خطا */}
        {error && (
          <div className="p-8 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <p className="text-sm text-slate-700 dark:text-slate-300">{error}</p>
            <Button variant="outline" size="sm" onClick={onClose}>
              بستن
            </Button>
          </div>
        )}

        {/* بدنه استاندارد فاکتور رسمی */}
        {invoice && (
          <div className="pt-4 space-y-4 text-slate-900 dark:text-slate-100 text-[11px] leading-relaxed print:pt-0 font-sans">
            {/* سربرگ فاکتور رسمی */}
            <div className="border-2 border-slate-800 dark:border-slate-300 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-lg">
                  {invoice.seller.name.slice(0, 1)}
                </div>
                <div>
                  <h1 className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                    {invoice.seller.legalName || invoice.seller.name}
                  </h1>
                  <p className="text-[10px] text-slate-500">
                    صورتحساب فروش کالا و خدمات آهن‌آلات و مقاطع فولادی
                  </p>
                </div>
              </div>

              <div className="text-center">
                <span className="inline-block px-3 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md font-bold text-xs">
                  صورتحساب رسمی فروش کالا و خدمات
                </span>
              </div>

              <div className="space-y-1 font-mono text-left sm:text-right text-[11px]">
                <div>
                  <span className="text-slate-500">شماره سریال: </span>
                  <span className="font-bold text-xs">{invoice.invoiceNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500">تاریخ صدور: </span>
                  <span className="font-bold">{invoice.date}</span>
                </div>
                {invoice.expiryDate && (
                  <div>
                    <span className="text-slate-500">مهلت اعتبار: </span>
                    <span>{invoice.expiryDate}</span>
                  </div>
                )}
              </div>
            </div>

            {/* بخش الف: مشخصات فروشنده */}
            <div className="border border-slate-400 dark:border-slate-700 rounded-lg overflow-hidden">
              <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1 font-bold border-b border-slate-400 dark:border-slate-700 text-xs">
                الف) مشخصات فروشنده
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 text-[11px]">
                <div>
                  <span className="text-slate-500">نام شخص حقوقی/حقیقی: </span>
                  <span className="font-bold">
                    {invoice.seller.legalName || invoice.seller.name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">شماره اقتصادی: </span>
                  <span className="font-mono font-bold">{invoice.seller.economicCode || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500">شناسه ملی / کد ملی: </span>
                  <span className="font-mono font-bold">{invoice.seller.nationalId || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500">شماره ثبت: </span>
                  <span className="font-mono">{invoice.seller.registrationNo || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500">کد پستی (۱۰ رقمی): </span>
                  <span className="font-mono">{invoice.seller.postalCode || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500">تلفن: </span>
                  <span className="font-mono">{invoice.seller.phone || '—'}</span>
                </div>
                <div className="sm:col-span-3">
                  <span className="text-slate-500">نشانی کامل: </span>
                  <span>{invoice.seller.address || '—'}</span>
                </div>
                {invoice.seller.iban && (
                  <div className="sm:col-span-3 font-mono text-[10px] text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 p-1.5 rounded">
                    <span>شماره شبا جهت واریز: </span>
                    <span className="font-bold">{invoice.seller.iban}</span>
                    {invoice.seller.bankName && <span> ({invoice.seller.bankName})</span>}
                  </div>
                )}
              </div>
            </div>

            {/* بخش ب: مشخصات خریدار */}
            <div className="border border-slate-400 dark:border-slate-700 rounded-lg overflow-hidden">
              <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1 font-bold border-b border-slate-400 dark:border-slate-700 text-xs">
                ب) مشخصات خریدار
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 text-[11px]">
                <div>
                  <span className="text-slate-500">نام شخص حقوقی/حقیقی: </span>
                  <span className="font-bold">{invoice.buyer.name}</span>
                </div>
                <div>
                  <span className="text-slate-500">شماره اقتصادی: </span>
                  <span className="font-mono">{invoice.buyer.economicCode || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500">شناسه ملی / کد ملی: </span>
                  <span className="font-mono font-bold">{invoice.buyer.nationalId || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500">شماره ثبت: </span>
                  <span className="font-mono">{invoice.buyer.registrationNo || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500">کد پستی: </span>
                  <span className="font-mono">{invoice.buyer.postalCode || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500">تلفن / همراه: </span>
                  <span className="font-mono">{invoice.buyer.phone || '—'}</span>
                </div>
                <div className="sm:col-span-3">
                  <span className="text-slate-500">نشانی و محل تحویل بار: </span>
                  <span>{invoice.shippingAddress || invoice.buyer.address || '—'}</span>
                </div>
              </div>
            </div>

            {/* بخش ج: مشخصات کالا یا خدمات مورد معامله */}
            <div className="border border-slate-400 dark:border-slate-700 rounded-lg overflow-x-auto">
              <table className="w-full text-right text-[11px] border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-800 font-bold border-b border-slate-400 dark:border-slate-700 text-slate-700 dark:text-slate-200">
                  <tr>
                    <th className="p-2 border-l border-slate-300 dark:border-slate-700 w-8 text-center">
                      ردیف
                    </th>
                    <th className="p-2 border-l border-slate-300 dark:border-slate-700">کد کالا</th>
                    <th className="p-2 border-l border-slate-300 dark:border-slate-700">
                      شرح کالا یا خدمات
                    </th>
                    <th className="p-2 border-l border-slate-300 dark:border-slate-700 text-center">
                      کارخانه
                    </th>
                    <th className="p-2 border-l border-slate-300 dark:border-slate-700 text-center">
                      واحد
                    </th>
                    <th className="p-2 border-l border-slate-300 dark:border-slate-700 text-center">
                      تعداد/مقدار
                    </th>
                    <th className="p-2 border-l border-slate-300 dark:border-slate-700 text-left">
                      مبلغ واحد (تومان)
                    </th>
                    <th className="p-2 border-l border-slate-300 dark:border-slate-700 text-left">
                      مبلغ کل (تومان)
                    </th>
                    <th className="p-2 border-l border-slate-300 dark:border-slate-700 text-center">
                      مالیات (۱۰٪)
                    </th>
                    <th className="p-2 text-left">جمع کل با مالیات (تومان)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 font-mono">
                  {invoice.lines.map((line) => (
                    <tr key={line.rowNo} className="hover:bg-slate-50/50">
                      <td className="p-2 border-l border-slate-200 dark:border-slate-700 text-center font-sans">
                        {line.rowNo}
                      </td>
                      <td className="p-2 border-l border-slate-200 dark:border-slate-700 text-slate-500">
                        {line.code}
                      </td>
                      <td className="p-2 border-l border-slate-200 dark:border-slate-700 font-sans font-bold">
                        {line.description}
                      </td>
                      <td className="p-2 border-l border-slate-200 dark:border-slate-700 text-center font-sans text-slate-600 dark:text-slate-400">
                        {line.mill || '—'}
                      </td>
                      <td className="p-2 border-l border-slate-200 dark:border-slate-700 text-center font-sans">
                        {line.unit}
                      </td>
                      <td className="p-2 border-l border-slate-200 dark:border-slate-700 text-center font-bold">
                        {line.quantity.toLocaleString('fa-IR')}
                      </td>
                      <td className="p-2 border-l border-slate-200 dark:border-slate-700 text-left">
                        {line.unitPriceToman.toLocaleString('fa-IR')}
                      </td>
                      <td className="p-2 border-l border-slate-200 dark:border-slate-700 text-left">
                        {line.subtotalToman.toLocaleString('fa-IR')}
                      </td>
                      <td className="p-2 border-l border-slate-200 dark:border-slate-700 text-left">
                        {line.taxToman.toLocaleString('fa-IR')}
                      </td>
                      <td className="p-2 text-left font-bold text-slate-900 dark:text-slate-100">
                        {line.totalPriceToman.toLocaleString('fa-IR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 dark:bg-slate-800/60 font-bold border-t-2 border-slate-400 dark:border-slate-600 font-mono">
                  <tr>
                    <td
                      colSpan={5}
                      className="p-2 border-l border-slate-300 dark:border-slate-700 text-left font-sans"
                    >
                      جمع مقادیر / تناژ کل:
                    </td>
                    <td className="p-2 border-l border-slate-300 dark:border-slate-700 text-center text-amber-700 dark:text-amber-400 font-bold">
                      {invoice.totals.totalWeightKg.toLocaleString('fa-IR')} کیلوگرم
                    </td>
                    <td className="p-2 border-l border-slate-300 dark:border-slate-700 text-left font-sans text-slate-500">
                      جمع اقلام:
                    </td>
                    <td className="p-2 border-l border-slate-300 dark:border-slate-700 text-left">
                      {invoice.totals.subtotalToman.toLocaleString('fa-IR')}
                    </td>
                    <td className="p-2 border-l border-slate-300 dark:border-slate-700 text-left">
                      {invoice.totals.taxToman.toLocaleString('fa-IR')}
                    </td>
                    <td className="p-2 text-left text-emerald-600 dark:text-emerald-400 text-xs">
                      {(invoice.totals.subtotalToman + invoice.totals.taxToman).toLocaleString(
                        'fa-IR',
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* بخش د: مبالغ نهایی، کرایه حمل و امضاها */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="border border-slate-400 dark:border-slate-700 rounded-lg p-3 space-y-2 text-[11px]">
                <div className="font-bold border-b border-slate-200 dark:border-slate-700 pb-1 text-xs">
                  شرایط و ضوابط معامله
                </div>
                <div className="text-slate-600 dark:text-slate-300 whitespace-pre-line text-[10px] leading-relaxed">
                  {invoice.termsAndConditions ||
                    'وزن نهایی بار پس از باسکول رسمی مبدأ یا مقصد محاسبه و تسویه حساب مالی بر مبنای قبض باسکول معتبر انجام می‌گردد.'}
                </div>
              </div>

              <div className="border border-slate-400 dark:border-slate-700 rounded-lg p-3 space-y-2 text-[11px]">
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span>مجموع ارزش ناخالص کالا:</span>
                  <span className="font-mono font-bold">
                    {invoice.totals.subtotalToman.toLocaleString('fa-IR')} تومان
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span>مالیات و عوارض بر ارزش افزوده (۱۰٪):</span>
                  <span className="font-mono">
                    {invoice.totals.taxToman.toLocaleString('fa-IR')} تومان
                  </span>
                </div>
                {invoice.totals.freightToman > 0 && (
                  <div className="flex justify-between items-center text-sky-700 dark:text-sky-400 font-medium">
                    <span>کرایه حمل باربری:</span>
                    <span className="font-mono font-bold">
                      {invoice.totals.freightToman.toLocaleString('fa-IR')} تومان
                    </span>
                  </div>
                )}
                <div className="h-px bg-slate-300 dark:bg-slate-700" />
                <div className="flex justify-between items-center font-bold text-xs pt-1">
                  <span>مبلغ نهایی قابل پرداخت:</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                    {invoice.totals.grandTotalToman.toLocaleString('fa-IR')} تومان
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 pt-1 font-bold">
                  مبلغ به حروف:{' '}
                  <span className="text-slate-800 dark:text-slate-200 font-sans">
                    {invoice.totals.grandTotalWords}
                  </span>
                </div>
              </div>
            </div>

            {/* بخش امضا و مهر */}
            <div className="grid grid-cols-2 gap-8 pt-6 pb-2 text-center text-xs">
              <div className="border-t border-dashed border-slate-400 dark:border-slate-600 pt-3">
                <span className="font-bold block mb-8">مهر و امضای فروشنده:</span>
                <span className="text-slate-400 text-[10px]">بازرگانی آهن و مقاطع فولادی</span>
              </div>
              <div className="border-t border-dashed border-slate-400 dark:border-slate-600 pt-3">
                <span className="font-bold block mb-8">مهر و امضای خریدار:</span>
                <span className="text-slate-400 text-[10px]">{invoice.buyer.name}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
