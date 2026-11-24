import React from 'react';
import { Button } from '@bodo/ui';
import type { WeighbridgeSlip } from '@bodo/contracts';
import { Printer, X, Scale, Truck, User, Calendar, FileText, Building2, Phone } from 'lucide-react';

interface WeighbridgeSlipModalProps {
  slip: WeighbridgeSlip;
  onClose: () => void;
}

export const WeighbridgeSlipModal: React.FC<WeighbridgeSlipModalProps> = ({ slip, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const netKg = Number(slip.netWeightKg);
  const netTons = (netKg / 1000).toLocaleString('fa-IR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  });

  const formattedDate = new Date(slip.weighedAt).toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* نوار ابزار بالا (در چاپ مخفی می‌شود) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                برگه رسمی قبض باسکول
              </h3>
              <p className="text-xs text-slate-500">شماره قبض: {slip.slipNo}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <Printer className="w-4 h-4" />
              <span>چاپ قبض (A5/A4)</span>
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* برگه قابل چاپ قبض باسکول */}
        <div
          id="weighbridge-printable"
          className="p-8 sm:p-10 space-y-6 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 print:p-0 print:m-0 print:border-none print:shadow-none"
        >
          {/* هدر قبض */}
          <div className="border-2 border-slate-900 dark:border-slate-300 rounded-2xl p-6 text-center relative">
            <div className="inline-block p-2 rounded-full bg-slate-100 dark:bg-slate-800 mb-2">
              <Scale className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              قبض رسمی توزین دیجیتال آهن‌آلات
            </h1>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">
              سامانه توزین و خروج کالا — BODO ERP
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-3 text-xs sm:text-sm font-semibold">
              <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400">
                <FileText className="w-4 h-4" />
                <span>شماره قبض:</span>
                <span className="font-mono text-base font-black px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50">
                  {slip.slipNo}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <Calendar className="w-4 h-4" />
                <span>تاریخ و ساعت توزین:</span>
                <span className="font-mono">{formattedDate}</span>
              </div>
            </div>
          </div>

          {/* اطلاعات بار و طرف حساب */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* خریدار و سفارش */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-800 dark:text-slate-200 pb-2 border-b border-slate-200 dark:border-slate-800">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>مشخصات خریدار و سفارش</span>
              </div>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">طرف حساب / خریدار:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {slip.customerName}
                  </span>
                </div>
                {slip.saleOrderNo && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">شماره سفارش فروش:</span>
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                      {slip.saleOrderNo}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">محل توزین / باسکول:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {slip.scaleName || 'باسکول انبار مرکزی'}
                  </span>
                </div>
              </div>
            </div>

            {/* خودرو و بارنامه */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-800 dark:text-slate-200 pb-2 border-b border-slate-200 dark:border-slate-800">
                <Truck className="w-4 h-4 text-emerald-600" />
                <span>مشخصات ناوگان و حمل</span>
              </div>
              <div className="text-sm space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">شماره پلاک خودرو:</span>
                  <span className="font-mono font-black text-sm px-2.5 py-1 bg-amber-100 text-amber-950 dark:bg-amber-950/50 dark:text-amber-200 border border-amber-300 dark:border-amber-800 rounded-lg">
                    {slip.vehiclePlate}
                  </span>
                </div>
                {slip.waybillNo && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">شماره بارنامه:</span>
                    <span className="font-mono font-bold">{slip.waybillNo}</span>
                  </div>
                )}
                {slip.driverName && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      <span>راننده:</span>
                    </span>
                    <span className="font-medium">{slip.driverName}</span>
                  </div>
                )}
                {slip.driverMobile && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" />
                      <span>تلفن راننده:</span>
                    </span>
                    <span className="font-mono text-xs">{slip.driverMobile}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* کادر برجسته و بزرگ وزن خالص */}
          <div className="border-2 border-blue-600 dark:border-blue-500 rounded-2xl p-6 bg-blue-50/60 dark:bg-blue-950/30 text-center space-y-2 shadow-inner">
            <span className="text-xs uppercase tracking-wider font-extrabold text-blue-700 dark:text-blue-300">
              نتیجه توزین قطعی آهن‌آلات (مبنای تسویه مالی)
            </span>
            <div className="flex items-center justify-center gap-4 my-2">
              <span className="text-3xl sm:text-4xl font-black font-mono text-blue-900 dark:text-blue-100">
                {netKg.toLocaleString('fa-IR')}
              </span>
              <span className="text-lg sm:text-xl font-bold text-slate-600 dark:text-slate-400">
                کیلوگرم
              </span>
              <span className="text-slate-400 text-2xl font-thin">|</span>
              <span className="text-3xl sm:text-4xl font-black font-mono text-emerald-700 dark:text-emerald-400">
                {netTons}
              </span>
              <span className="text-lg sm:text-xl font-bold text-slate-600 dark:text-slate-400">
                تُن خالص
              </span>
            </div>
            {slip.notes && (
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 border-t border-blue-200 dark:border-blue-900/50 pt-2">
                توضیحات: {slip.notes}
              </p>
            )}
          </div>

          {/* بخش امضا و تایید رسمی */}
          <div className="grid grid-cols-3 gap-4 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center text-xs">
            <div className="space-y-12">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                متصدی باسکول
                {slip.operatorName ? ` (${slip.operatorName})` : ''}
              </span>
              <div className="border-t border-dashed border-slate-300 dark:border-slate-700 pt-1 text-slate-400">
                امضا و مهر
              </div>
            </div>
            <div className="space-y-12">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                راننده / تحویل‌دهنده
              </span>
              <div className="border-t border-dashed border-slate-300 dark:border-slate-700 pt-1 text-slate-400">
                امضا و اثر انگشت
              </div>
            </div>
            <div className="space-y-12">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                مسئول انبار و بارگیری
              </span>
              <div className="border-t border-dashed border-slate-300 dark:border-slate-700 pt-1 text-slate-400">
                امضا و تایید نهایی
              </div>
            </div>
          </div>
        </div>

        {/* پاورقی مدال (در چاپ مخفی می‌شود) */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 print:hidden">
          <Button variant="outline" size="sm" onClick={onClose}>
            بستن
          </Button>
          <Button
            size="sm"
            onClick={handlePrint}
            className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
          >
            <Printer className="w-4 h-4" />
            <span>چاپ برگه باسکول</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
