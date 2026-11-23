import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Plus,
  Copy,
  Search,
  Calendar,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  X,
  History,
} from 'lucide-react';
import { Button, Card } from '@bodo/ui';
import { api } from '../api/client';
import type { DailyPrice, ProductCategoryType } from '@bodo/contracts';

const CATEGORIES: Array<{ key: string; label: string }> = [
  { key: 'ALL', label: 'همه مقاطع' },
  { key: 'REBAR', label: 'میلگرد آجدار و ساده' },
  { key: 'BEAM', label: 'تیرآهن و هاش' },
  { key: 'SHEET', label: 'انواع ورق فولادی' },
  { key: 'PROFILE', label: 'قوطی و پروفیل' },
  { key: 'PIPE', label: 'لوله صنعتی و داربستی' },
];

export function PricingModule() {
  const [prices, setPrices] = useState<DailyPrice[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<string>(
    () => new Date().toISOString().split('T')[0] ?? '',
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Batch Create Modal
  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);
  const [batchDate, setBatchDate] = useState<string>(
    () => new Date().toISOString().split('T')[0] ?? '',
  );
  const [batchItems, setBatchItems] = useState<
    Array<{
      productName: string;
      category: ProductCategoryType;
      mill: string;
      size: string;
      standard: string;
      unit: string;
      priceToman: number;
    }>
  >([
    {
      productName: 'میلگرد ۱۴',
      category: 'REBAR',
      mill: 'ذوب آهن اصفهان',
      size: '14',
      standard: 'A3',
      unit: 'کیلوگرم',
      priceToman: 26500,
    },
    {
      productName: 'تیرآهن ۱۶',
      category: 'BEAM',
      mill: 'ذوب آهن اصفهان',
      size: '16',
      standard: 'IPE',
      unit: 'شاخه',
      priceToman: 4850000,
    },
  ]);

  // History Modal
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [historyItems, setHistoryItems] = useState<DailyPrice[]>([]);
  const [historyTitle, setHistoryTitle] = useState<string>('');

  const loadPrices = async () => {
    setIsLoading(true);
    try {
      const data = await api.pricing.list({
        date: selectedDate || undefined,
        category:
          selectedCategory !== 'ALL' ? (selectedCategory as ProductCategoryType) : undefined,
        search: searchQuery.trim() || undefined,
      });
      setPrices(data);
    } catch (err) {
      console.error('Error loading daily prices:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPrices();
  }, [selectedDate, selectedCategory, searchQuery]);

  const handleCopyYesterday = async () => {
    if (
      !confirm(
        `آیا مایلید تمام نرخ‌های روز گذشته در تاریخ ${selectedDate} کپی شوند؟ (نوسان نرخ صفر خواهد شد)`,
      )
    ) {
      return;
    }

    try {
      await api.pricing.copyYesterday({ targetDate: selectedDate });
      alert('قیمت‌های روز گذشته با موفقیت کپی شدند.');
      loadPrices();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطا در کپی قیمت‌ها';
      alert(msg);
    }
  };

  const handleSaveBatch = async () => {
    const valid = batchItems.filter((i) => i.productName.trim() && i.priceToman > 0);
    if (valid.length === 0) {
      alert('حداقل یک ردیف قیمت با نرخ معتبر الزامی است');
      return;
    }

    try {
      await api.pricing.batchCreate({
        date: batchDate,
        prices: valid,
      });
      setIsBatchModalOpen(false);
      setSelectedDate(batchDate);
      loadPrices();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطا در ثبت قیمت‌ها';
      alert(msg);
    }
  };

  const handleShowHistory = async (productName: string, mill: string) => {
    try {
      setHistoryTitle(`${productName} — ${mill}`);
      const history = await api.pricing.getHistory(productName, mill);
      setHistoryItems(history);
      setIsHistoryModalOpen(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطا در دریافت تاریخچه';
      alert(msg);
    }
  };

  const formatPriceChange = (change: number | string | null | undefined) => {
    const num = change !== null && change !== undefined ? Number(change) : null;
    if (num === null || num === 0) {
      return (
        <span className="flex items-center gap-1 text-slate-400 font-mono text-xs">
          <Minus className="w-3 h-3" />
          <span>۰</span>
        </span>
      );
    }
    if (num > 0) {
      return (
        <span className="flex items-center gap-0.5 text-rose-600 dark:text-rose-400 font-mono text-xs font-bold">
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span>+{num.toLocaleString('fa-IR')}</span>
        </span>
      );
    }
    return (
      <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold">
        <ArrowDownRight className="w-3.5 h-3.5" />
        <span>{num.toLocaleString('fa-IR')}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* هدر تابلوی نرخ روز آهن‌آلات */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-amber-500" />
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              تابلوی اعلام نرخ روزانه آهن‌آلات (Daily Steel Pricing Board)
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            نرخ رسمی بازار، محاسبه خودکار نوسان قیمت نسبت به روز قبل، کپی سریع و تاریخچه تغییرات
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleCopyYesterday} className="gap-1.5 text-xs">
            <Copy className="w-3.5 h-3.5" />
            <span>کپی از نرخ‌های دیروز</span>
          </Button>

          <Button
            variant="primary"
            onClick={() => setIsBatchModalOpen(true)}
            className="gap-1.5 text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>ثبت گروهی نرخ‌های امروز</span>
          </Button>
        </div>
      </div>

      {/* نوار فیلتر و انتخاب تاریخ */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="جستجوی مقطع، سایز، کارخانه سازنده..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-3 pr-9 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>تاریخ تابلو:</span>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
          />
        </div>
      </div>

      {/* تب‌های دسته‌بندی مقاطع فولادی */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800 pb-1">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setSelectedCategory(c.key)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              selectedCategory === c.key
                ? 'bg-amber-500/10 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* جدول نمایش نرخ روز */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400">در حال دریافت نرخ‌ها...</div>
      ) : prices.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <TrendingUp className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            هیچ نرخی برای تاریخ {selectedDate} ثبت نشده است.
          </p>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleCopyYesterday}
            className="mt-3 gap-1"
          >
            <Copy className="w-4 h-4" />
            <span>کپی از نرخ‌های دیروز</span>
          </Button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
              <tr>
                <th className="py-3 px-4 font-semibold">مقطع و شرح کالا</th>
                <th className="py-3 px-4 font-semibold">کارخانه سازنده</th>
                <th className="py-3 px-4 font-semibold">سایز / ضخامت</th>
                <th className="py-3 px-4 font-semibold">استاندارد</th>
                <th className="py-3 px-4 font-semibold">واحد</th>
                <th className="py-3 px-4 font-semibold">نرخ روز (تومان)</th>
                <th className="py-3 px-4 font-semibold">نرخ دیروز</th>
                <th className="py-3 px-4 font-semibold">نوسان روزانه</th>
                <th className="py-3 px-4 font-semibold text-center">سوابق</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {prices.map((p) => (
                <tr
                  key={p.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                    {p.productName}
                  </td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{p.mill || '—'}</span>
                  </td>
                  <td className="py-3 px-4 font-mono">{p.size || '—'}</td>
                  <td className="py-3 px-4 font-mono">{p.standard || '—'}</td>
                  <td className="py-3 px-4 text-slate-500">{p.unit}</td>
                  <td className="py-3 px-4 font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">
                    {Number(p.priceToman).toLocaleString('fa-IR')}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">
                    {p.prevPriceToman ? Number(p.prevPriceToman).toLocaleString('fa-IR') : '—'}
                  </td>
                  <td className="py-3 px-4">{formatPriceChange(p.priceChangeToman)}</td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleShowHistory(p.productName, p.mill)}
                      className="p-1 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer"
                      title="نمودار و تاریخچه قیمت"
                    >
                      <History className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* مدال ثبت گروهی قیمت‌های امروز */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="max-w-3xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  ثبت گروهی نرخ روزانه آهن‌آلات
                </h3>
              </div>
              <button
                onClick={() => setIsBatchModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="font-semibold">تاریخ اعلام نرخ:</span>
              <input
                type="date"
                value={batchDate}
                onChange={(e) => setBatchDate(e.target.value)}
                className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
              />
            </div>

            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden max-h-[350px] overflow-y-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="p-2">شرح کالا</th>
                    <th className="p-2">کارخانه</th>
                    <th className="p-2">سایز</th>
                    <th className="p-2">استاندارد</th>
                    <th className="p-2">نرخ روز (تومان)</th>
                    <th className="p-2 text-center">حذف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {batchItems.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-1.5">
                        <input
                          type="text"
                          value={item.productName}
                          onChange={(e) => {
                            const next = [...batchItems];
                            const current = next[idx];
                            if (current) {
                              current.productName = e.target.value;
                              setBatchItems(next);
                            }
                          }}
                          className="w-full text-xs p-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="text"
                          value={item.mill}
                          onChange={(e) => {
                            const next = [...batchItems];
                            const current = next[idx];
                            if (current) {
                              current.mill = e.target.value;
                              setBatchItems(next);
                            }
                          }}
                          className="w-28 text-xs p-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="text"
                          value={item.size}
                          onChange={(e) => {
                            const next = [...batchItems];
                            const current = next[idx];
                            if (current) {
                              current.size = e.target.value;
                              setBatchItems(next);
                            }
                          }}
                          className="w-16 text-xs p-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="text"
                          value={item.standard}
                          onChange={(e) => {
                            const next = [...batchItems];
                            const current = next[idx];
                            if (current) {
                              current.standard = e.target.value;
                              setBatchItems(next);
                            }
                          }}
                          className="w-16 text-xs p-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="number"
                          value={item.priceToman}
                          onChange={(e) => {
                            const next = [...batchItems];
                            const current = next[idx];
                            if (current) {
                              current.priceToman = Number(e.target.value);
                              setBatchItems(next);
                            }
                          }}
                          className="w-28 text-xs p-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                        />
                      </td>
                      <td className="p-1.5 text-center">
                        <button
                          onClick={() => setBatchItems(batchItems.filter((_, i) => i !== idx))}
                          className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setBatchItems([
                  ...batchItems,
                  {
                    productName: '',
                    category: 'REBAR',
                    mill: '',
                    size: '',
                    standard: '',
                    unit: 'کیلوگرم',
                    priceToman: 0,
                  },
                ])
              }
              className="gap-1 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>افزودن ردیف کالا</span>
            </Button>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="ghost" size="sm" onClick={() => setIsBatchModalOpen(false)}>
                انصراف
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveBatch}>
                ثبت و انتشار قیمت‌ها
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* مدال سوابق و تاریخچه تغییر قیمت */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  سوابق نوسان قیمت آهن‌آلات
                </h3>
                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  {historyTitle}
                </span>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-2 text-xs">
              {historyItems.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
                >
                  <span className="font-mono text-slate-500">{h.date}</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {Number(h.priceToman).toLocaleString('fa-IR')} تومان
                  </span>
                  <div>{formatPriceChange(h.priceChangeToman)}</div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="ghost" size="sm" onClick={() => setIsHistoryModalOpen(false)}>
                بستن
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
