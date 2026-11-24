import React, { useState, useEffect, useMemo } from 'react';
import { Button, Card } from '@bodo/ui';
import { api } from '../api/client';
import type { WeighbridgeSlip, SaleOrder } from '@bodo/contracts';
import { WeighbridgeSlipModal } from '../components/WeighbridgeSlipModal';
import {
  Scale,
  Plus,
  Search,
  RefreshCw,
  Printer,
  Truck,
  Trash2,
  FileText,
  AlertCircle,
  X,
} from 'lucide-react';

interface WeighbridgeModuleProps {
  initialSaleOrderId?: string;
}

export const WeighbridgeModule: React.FC<WeighbridgeModuleProps> = ({ initialSaleOrderId }) => {
  const [slips, setSlips] = useState<WeighbridgeSlip[]>([]);
  const [confirmedOrders, setConfirmedOrders] = useState<SaleOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [selectedSlipForPrint, setSelectedSlipForPrint] = useState<WeighbridgeSlip | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // فرم ایجاد قبض
  const [formData, setFormData] = useState({
    saleOrderId: initialSaleOrderId || '',
    customerName: '',
    netWeightKg: '',
    vehiclePlate: '',
    waybillNo: '',
    driverName: '',
    driverMobile: '',
    scaleName: 'باسکول ۶۰ تنی انبار مرکزی',
    operatorName: 'متصدی شیفت',
    notes: '',
  });

  const fetchSlips = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await api.weighbridge.list({ search: search || undefined });
      setSlips(res.items);
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || 'خطا در بارگذاری قبوض باسکول');
    } finally {
      setLoading(false);
    }
  };

  const fetchConfirmedOrders = async () => {
    try {
      const res = await api.sales.list({ stage: 'CONFIRMED' });
      setConfirmedOrders(res || []);
    } catch {
      // Ignored non-critical failure
    }
  };

  useEffect(() => {
    fetchSlips();
    fetchConfirmedOrders();
  }, [search]);

  // وقتی سفارش فروش در فرم انتخاب شد، نام مشتری خودکار پر شود
  const handleOrderChange = (orderId: string) => {
    const selected = confirmedOrders.find((o) => o.id === orderId);
    setFormData((prev) => ({
      ...prev,
      saleOrderId: orderId,
      customerName: selected ? selected.customerName : prev.customerName,
    }));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const weightNum = parseFloat(formData.netWeightKg);
    if (!weightNum || weightNum <= 0) {
      setErrorMessage('وزن خالص باید بیشتر از صفر باشد.');
      return;
    }
    if (!formData.vehiclePlate.trim()) {
      setErrorMessage('شماره پلاک خودرو الزامی است.');
      return;
    }
    if (!formData.customerName.trim()) {
      setErrorMessage('نام مشتری یا طرف‌حساب الزامی است.');
      return;
    }

    try {
      const newSlip = await api.weighbridge.create({
        saleOrderId: formData.saleOrderId || undefined,
        customerName: formData.customerName.trim(),
        netWeightKg: weightNum,
        vehiclePlate: formData.vehiclePlate.trim(),
        waybillNo: formData.waybillNo.trim() || undefined,
        driverName: formData.driverName.trim() || undefined,
        driverMobile: formData.driverMobile.trim() || undefined,
        scaleName: formData.scaleName.trim() || undefined,
        operatorName: formData.operatorName.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      });

      setSuccessMessage(`قبض باسکول به شماره ${newSlip.slipNo} با موفقیت صادر شد.`);
      setIsCreateModalOpen(false);
      setFormData({
        saleOrderId: '',
        customerName: '',
        netWeightKg: '',
        vehiclePlate: '',
        waybillNo: '',
        driverName: '',
        driverMobile: '',
        scaleName: 'باسکول ۶۰ تنی انبار مرکزی',
        operatorName: 'متصدی شیفت',
        notes: '',
      });
      fetchSlips();
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || 'خطا در ثبت قبض باسکول');
    }
  };

  const handleDelete = async (id: string, slipNo: string) => {
    if (!window.confirm(`آیا از ابطال و حذف قبض باسکول ${slipNo} اطمینان دارید؟`)) {
      return;
    }
    try {
      await api.weighbridge.delete(id);
      setSuccessMessage(`قبض باسکول ${slipNo} با موفقیت حذف شد.`);
      fetchSlips();
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || 'خطا در حذف قبض');
    }
  };

  // آمار کلی قبوض
  const stats = useMemo(() => {
    const count = slips.length;
    const totalKg = slips.reduce((sum, s) => sum + Number(s.netWeightKg), 0);
    const totalTons = totalKg / 1000;
    const avgTons = count > 0 ? totalTons / count : 0;
    return {
      count,
      totalTons: totalTons.toLocaleString('fa-IR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      avgTons: avgTons.toLocaleString('fa-IR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    };
  }, [slips]);

  return (
    <div className="space-y-6">
      {/* هدر ماژول */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Scale className="w-7 h-7 text-blue-600" />
            <span>قبوض باسکول و توزین آهن‌آلات</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            ثبت وزن خالص بار، پلاک خودرو، بارنامه و صدور برگه رسمی باسکول برای سفارش‌های فروش
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchSlips}
            disabled={loading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>بروزرسانی</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 bg-blue-600 text-white hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>ثبت قبض باسکول جدید</span>
          </Button>
        </div>
      </div>

      {/* پیام‌های وضعیت */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-500 hover:text-rose-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm flex items-center justify-between">
          <span>{successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-500 hover:text-emerald-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* کارت‌های KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 flex items-center gap-4 bg-gradient-to-br from-blue-50 to-white dark:from-slate-900 dark:to-slate-900 border-blue-100 dark:border-blue-900/40">
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            <Scale className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">مجموع تناژ توزین‌شده (خالص)</p>
            <p className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100 mt-1">
              {stats.totalTons} <span className="text-xs font-normal text-slate-500">تُن</span>
            </p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 bg-gradient-to-br from-emerald-50 to-white dark:from-slate-900 dark:to-slate-900 border-emerald-100 dark:border-emerald-900/40">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
            <Truck className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">تعداد کل قبوض صادره</p>
            <p className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100 mt-1">
              {stats.count} <span className="text-xs font-normal text-slate-500">کامیون/تریلی</span>
            </p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 bg-gradient-to-br from-amber-50 to-white dark:from-slate-900 dark:to-slate-900 border-amber-100 dark:border-amber-900/40">
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">میانگین وزن هر محموله</p>
            <p className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100 mt-1">
              {stats.avgTons}{' '}
              <span className="text-xs font-normal text-slate-500">تُن در ناوگان</span>
            </p>
          </div>
        </Card>
      </div>

      {/* فیلتر و جستجو */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="جستجو در پلاک خودرو، شماره بارنامه، راننده، شماره قبض، خریدار..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-9 pl-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {search && (
            <Button variant="ghost" size="sm" onClick={() => setSearch('')}>
              پاک‌کردن
            </Button>
          )}
        </div>
      </Card>

      {/* جدول قبوض باسکول */}
      <Card className="overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 text-xs font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">شماره قبض</th>
                <th className="py-3 px-4">سفارش فروش</th>
                <th className="py-3 px-4">طرف حساب / خریدار</th>
                <th className="py-3 px-4">پلاک خودرو</th>
                <th className="py-3 px-4">شماره بارنامه</th>
                <th className="py-3 px-4">راننده</th>
                <th className="py-3 px-4 text-center">وزن خالص (توزین)</th>
                <th className="py-3 px-4">تاریخ توزین</th>
                <th className="py-3 px-4 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    <span>در حال بارگذاری قبوض باسکول...</span>
                  </td>
                </tr>
              ) : slips.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Scale className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="font-medium text-slate-600 dark:text-slate-400">
                      هیچ قبض باسکولی یافت نشد.
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      می‌توانید با دکمه «ثبت قبض باسکول جدید» اولین برگه توزین را ثبت نمایید.
                    </p>
                  </td>
                </tr>
              ) : (
                slips.map((slip) => {
                  const netKg = Number(slip.netWeightKg);
                  const netTon = (netKg / 1000).toLocaleString('fa-IR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 3,
                  });
                  const dateStr = new Date(slip.weighedAt).toLocaleDateString('fa-IR', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr
                      key={slip.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs px-2 py-1 bg-blue-50 dark:bg-blue-950/40 rounded-lg border border-blue-200/60 dark:border-blue-900/60">
                          {slip.slipNo}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs">
                        {slip.saleOrderNo ? (
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {slip.saleOrderNo}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-100">
                        {slip.customerName}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs px-2 py-0.5 bg-amber-100 text-amber-950 dark:bg-amber-950/40 dark:text-amber-300 rounded font-black border border-amber-200 dark:border-amber-900">
                          {slip.vehiclePlate}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                        {slip.waybillNo || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-700 dark:text-slate-300">
                        {slip.driverName ? (
                          <div>
                            <div>{slip.driverName}</div>
                            {slip.driverMobile && (
                              <div className="font-mono text-[10px] text-slate-400">
                                {slip.driverMobile}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="font-mono font-black text-sm text-blue-700 dark:text-blue-300">
                          {netKg.toLocaleString('fa-IR')}{' '}
                          <span className="text-[10px] font-normal text-slate-500">kg</span>
                        </div>
                        <div className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                          ({netTon} تن)
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 font-mono">{dateStr}</td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedSlipForPrint(slip)}
                            className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 flex items-center gap-1 px-2.5 py-1 text-xs"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>چاپ برگه</span>
                          </Button>
                          <button
                            type="button"
                            onClick={() => handleDelete(slip.id, slip.slipNo)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="حذف قبض"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* مدال ثبت قبض باسکول جدید */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  <Scale className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  ثبت قبض باسکول جدید آهن‌آلات
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {/* سفارش فروش تاییدشده */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اتصال به سفارش قطعی فروش (اختیاری)
                </label>
                <select
                  value={formData.saleOrderId}
                  onChange={(e) => handleOrderChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">— بدون اتصال به سفارش (توزین آزاد) —</option>
                  {confirmedOrders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.orderNo || o.quotationNo} — {o.customerName} (
                      {Number(o.totalWeightKg ?? 0).toLocaleString('fa-IR')} kg)
                    </option>
                  ))}
                </select>
              </div>

              {/* نام مشتری و طرف حساب */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  نام طرف حساب / خریدار <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: شرکت سازه گستران پارس"
                  value={formData.customerName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, customerName: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* وزن خالص به کیلوگرم با پیش‌نمایش تن */}
              <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-blue-900 dark:text-blue-200">
                    وزن خالص توزین (کیلوگرم) <span className="text-rose-500">*</span>
                  </label>
                  {formData.netWeightKg && !isNaN(parseFloat(formData.netWeightKg)) && (
                    <span className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400">
                      معادل: {(parseFloat(formData.netWeightKg) / 1000).toLocaleString('fa-IR')} تُن
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  step="0.001"
                  required
                  placeholder="مثال: 24850"
                  value={formData.netWeightKg}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, netWeightKg: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-base font-mono font-bold bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-800 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  طبق فرآیند بازرگانی آهن‌آلات، صرفاً وزن خالص نهایی بار ثبت و به عنوان مبنای تسویه
                  اعمال می‌گردد.
                </p>
              </div>

              {/* ناوگان و بارنامه */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    شماره پلاک خودرو <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: ایران ۱۱ - ۱۲۳ ج ۴۵"
                    value={formData.vehiclePlate}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, vehiclePlate: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    شماره بارنامه
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: BL-9842"
                    value={formData.waybillNo}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, waybillNo: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* مشخصات راننده */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    نام راننده
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: علی اکبری"
                    value={formData.driverName}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, driverName: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    شماره تماس راننده
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: 09121234567"
                    value={formData.driverMobile}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, driverMobile: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* نام باسکول و متصدی */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    محل توزین / نام باسکول
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: باسکول دیجیتال ۵۰ تنی انبار مرکزی"
                    value={formData.scaleName}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, scaleName: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    نام متصدی باسکول
                  </label>
                  <input
                    type="text"
                    placeholder="نام مسئول ثبت"
                    value={formData.operatorName}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, operatorName: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* توضیحات */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  توضیحات و اقلام بار
                </label>
                <textarea
                  rows={2}
                  placeholder="مثال: بارگیری میلگرد اصفهان سایز ۱۶ و ۱۸، تایید شد."
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  انصراف
                </Button>
                <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700">
                  ثبت و صدور قبض باسکول
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مدال چاپ قبض باسکول */}
      {selectedSlipForPrint && (
        <WeighbridgeSlipModal
          slip={selectedSlipForPrint}
          onClose={() => setSelectedSlipForPrint(null)}
        />
      )}
    </div>
  );
};
