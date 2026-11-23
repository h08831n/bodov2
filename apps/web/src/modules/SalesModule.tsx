import React, { useState, useEffect } from 'react';
import {
  Button,
  Badge,
  Card,
  Statusbar,
  SmartButton,
  Chatter,
  type ChatterMessage,
} from '@bodo/ui';
import { INITIAL_QUOTATIONS, type Quotation } from '../data/mockData';
import { api } from '../api/client';
import type { SaleOrderStage } from '@bodo/contracts';
import {
  Plus,
  LayoutGrid,
  List,
  FileCheck2,
  FileX2,
  Send,
  Printer,
  Calendar,
  Building,
  DollarSign,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export const SalesModule: React.FC = () => {
  const [quotations, setQuotations] = useState<Quotation[]>(INITIAL_QUOTATIONS);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);

  useEffect(() => {
    let isMounted = true;
    api.sales
      .list()
      .then((data) => {
        if (!isMounted || !data || data.length === 0) return;
        const mapped: Quotation[] = data.map((item) => ({
          id: item.id,
          orderNumber: item.orderNo || item.quotationNo,
          customerName: item.customerName,
          customerId: item.customerId,
          date: item.date ? item.date.slice(0, 10) : '۱۴۰۳/۰۹/۰۲',
          expiryDate: item.expiryDate ? item.expiryDate.slice(0, 10) : '۱۴۰۳/۰۹/۰۵',
          stage: (item.stage?.toLowerCase() || 'draft') as Quotation['stage'],
          salesPerson: item.salespersonName || 'مدیر فروش',
          subtotal: Number(item.subtotalToman) || 0,
          taxTotal: Number(item.taxToman) || 0,
          grandTotal: Number(item.grandTotalToman) || 0,
          lostReason: item.lostNotes || undefined,
          lines:
            item.lines?.map((line) => ({
              id: line.id,
              productId: line.productId || 'p-1',
              productName: line.productName,
              mill: line.mill,
              unit: line.unit,
              quantity: Number(line.quantity),
              unitPrice: Number(line.unitPriceToman),
              taxPercent: Number(line.taxPercent),
              totalPrice: Number(line.totalPriceToman),
            })) || [],
        }));
        setQuotations(mapped);
      })
      .catch(() => {
        // Fallback to initial mock data
      });

    return () => {
      isMounted = false;
    };
  }, []);
  const [messages, setMessages] = useState<Record<string, ChatterMessage[]>>({
    'so-1': [
      {
        id: 'm1',
        author: 'حسین (مدیر فروش)',
        date: '۱۴۰۳/۰۹/۰۱ ۱۰:۳۰',
        content: 'پیش‌فاکتور برای پروژه برج مسکونی با قیمت روز میلگرد اصفهان صادر شد.',
        type: 'note',
      },
      {
        id: 'm2',
        author: 'سیستم',
        date: '۱۴۰۳/۰۹/۰۱ ۱۰:۳۲',
        content: 'پیش‌فاکتور از طریق پیامک برای مهندس کریمی ارسال شد.',
        type: 'activity',
      },
    ],
  });

  // استیج‌های گردش کار به سبک Odoo
  const stages = [
    { id: 'draft', label: 'پیش‌نویس' },
    { id: 'sent', label: 'ارسال‌شده به مشتری' },
    { id: 'confirmed', label: 'سفارش فروش (تایید قطعی)' },
    { id: 'lost', label: 'باخت / لغو شده' },
  ];

  const handleStageChange = async (newStage: Quotation['stage']) => {
    if (!selectedQuotation) return;
    const updated: Quotation = {
      ...selectedQuotation,
      stage: newStage,
    };
    setSelectedQuotation(updated);
    setQuotations((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));

    try {
      const serverUpdated = await api.sales.transitionStage(selectedQuotation.id, {
        stage: newStage.toUpperCase() as SaleOrderStage,
      });
      if (serverUpdated?.orderNo) {
        setSelectedQuotation((prev) =>
          prev ? { ...prev, orderNumber: serverUpdated.orderNo! } : null,
        );
      }
    } catch {
      // Local stage updated
    }

    // لاگ در چتر
    const stageNames: Record<string, string> = {
      draft: 'پیش‌نویس',
      sent: 'ارسال‌شده به مشتری',
      confirmed: 'سفارش فروش قطعی',
      lost: 'باخت با ذکر دلیل',
    };
    const logMsg: ChatterMessage = {
      id: Date.now().toString(),
      author: 'کاربر سیستم',
      date: 'لحظاتی پیش',
      content: `وضعیت سند به «${stageNames[newStage]}» تغییر یافت.`,
      type: 'activity',
    };
    setMessages((prev) => ({
      ...prev,
      [selectedQuotation.id]: [logMsg, ...(prev[selectedQuotation.id] || [])],
    }));
  };

  const handleSendMessage = (content: string, type: 'note' | 'activity') => {
    if (!selectedQuotation) return;
    const newMsg: ChatterMessage = {
      id: Date.now().toString(),
      author: 'حسین (مدیر ارشد)',
      date: 'هم‌اکنون',
      content,
      type,
    };
    setMessages((prev) => ({
      ...prev,
      [selectedQuotation.id]: [newMsg, ...(prev[selectedQuotation.id] || [])],
    }));
  };

  const createNewQuotation = async () => {
    const newQuote: Quotation = {
      id: `so-${Date.now()}`,
      orderNumber: `SQ-1403-010${quotations.length + 1}`,
      customerName: 'سازه گستر کریمی',
      customerId: 'c1111111-1111-1111-1111-111111111111',
      date: '۱۴۰۳/۰۹/۰۲',
      expiryDate: '۱۴۰۳/۰۹/۰۵',
      stage: 'draft',
      salesPerson: 'مدیر فروش',
      lines: [
        {
          id: `l-${Date.now()}`,
          productId: 'p-1',
          productName: 'میلگرد ۱۶ آجدار - ذوب آهن اصفهان (A3)',
          mill: 'ذوب آهن اصفهان',
          unit: 'کیلوگرم',
          quantity: 10000,
          unitPrice: 27800,
          taxPercent: 10,
          totalPrice: 278000000,
        },
      ],
      subtotal: 278000000,
      taxTotal: 27800000,
      grandTotal: 305800000,
    };
    setQuotations([newQuote, ...quotations]);
    setSelectedQuotation(newQuote);

    try {
      const created = await api.sales.create({
        customerId: newQuote.customerId,
        customerName: newQuote.customerName,
        notes: 'پیش‌فاکتور فروش میلگرد اصفهان',
        lines: [
          {
            productName: 'میلگرد ۱۶ آجدار - ذوب آهن اصفهان (A3)',
            mill: 'ذوب آهن اصفهان',
            unit: 'کیلوگرم',
            quantity: 10000,
            unitPriceToman: 27800,
            taxPercent: 10,
          },
        ],
      });
      if (created?.id) {
        setSelectedQuotation((prev) =>
          prev ? { ...prev, id: created.id, orderNumber: created.quotationNo } : null,
        );
      }
    } catch {
      // Local quotation is preserved
    }
  };

  // نمای فرم سند (Form View) مشابه فرم پیش‌فاکتور Odoo
  if (selectedQuotation) {
    return (
      <div className="space-y-4">
        {/* نوار بالایی فرم: دکمه بازگشت و نوار ابزار اقدام */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-xs">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedQuotation(null)}
              className="gap-1.5"
            >
              <ArrowRight className="w-4 h-4" />
              <span>پیش‌فاکتورها</span>
            </Button>
            <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 font-mono">
              {selectedQuotation.orderNumber}
            </h2>
            <Badge
              variant={
                selectedQuotation.stage === 'confirmed'
                  ? 'success'
                  : selectedQuotation.stage === 'sent'
                    ? 'primary'
                    : selectedQuotation.stage === 'lost'
                      ? 'danger'
                      : 'neutral'
              }
            >
              {stages.find((s) => s.id === selectedQuotation.stage)?.label}
            </Badge>
          </div>

          {/* استیج‌بار گردش کار Odoo */}
          <Statusbar
            stages={stages}
            currentStageId={selectedQuotation.stage}
            onSelectStage={(stageId) => handleStageChange(stageId as Quotation['stage'])}
          />
        </div>

        {/* دکمه‌های اقدام و اسمارت‌باتن‌ها */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            {selectedQuotation.stage === 'draft' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleStageChange('sent')}
                className="gap-1.5 bg-blue-600"
              >
                <Send className="w-4 h-4" />
                <span>ارسال به مشتری (پیامک/واتساپ)</span>
              </Button>
            )}
            {selectedQuotation.stage === 'sent' && (
              <Button
                variant="success"
                size="sm"
                onClick={() => handleStageChange('confirmed')}
                className="gap-1.5 bg-emerald-600"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>تایید قطعی و صدور سفارش فروش</span>
              </Button>
            )}
            {selectedQuotation.stage !== 'lost' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleStageChange('lost')}
                className="gap-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              >
                <FileX2 className="w-4 h-4" />
                <span>اعلام باخت معامله</span>
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5">
              <Printer className="w-4 h-4" />
              <span>چاپ / خروجی رسمی</span>
            </Button>
          </div>

          {/* Smart Buttons Odoo */}
          <div className="flex items-center gap-2">
            <SmartButton
              count="۱ حواله"
              label="انبار و بارگیری"
              icon={<TrendingUp className="w-4 h-4" />}
            />
            <SmartButton
              count="۱۰۰٪"
              label="تطابق قیمت روز"
              icon={<DollarSign className="w-4 h-4" />}
            />
          </div>
        </div>

        {/* بدنه سند + پنل چتر گفتگو */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* ستون اطلاعات فرم و خطوط سند */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    نام خریدار / شرکت
                  </label>
                  <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Building className="w-4 h-4 text-slate-400" />
                    <span>{selectedQuotation.customerName}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    مسئول فروش
                  </label>
                  <div className="font-bold text-slate-800 dark:text-slate-100">
                    {selectedQuotation.salesPerson}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    تاریخ صدور پیش‌فاکتور
                  </label>
                  <div className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>{selectedQuotation.date}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    اعتبار نرخ آهن‌آلات تا
                  </label>
                  <div className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-amber-600 dark:text-amber-400 font-bold">
                      {selectedQuotation.expiryDate} (به دلیل نوسان قیمت)
                    </span>
                  </div>
                </div>
              </div>

              {/* جدول اقلام آهن‌آلات */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                    ردیف‌های آهن‌آلات و مقاطع فولادی
                  </h3>
                  <span className="text-xs text-slate-400">قیمت‌ها شناور به ریال / تومان</span>
                </div>

                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-3">ردیف</th>
                        <th className="p-3">شرح کالا و متغیرها</th>
                        <th className="p-3">کارخانه</th>
                        <th className="p-3">واحد</th>
                        <th className="p-3">مقدار</th>
                        <th className="p-3">نرخ واحد (تومان)</th>
                        <th className="p-3">مالیات</th>
                        <th className="p-3">مبلغ کل (تومان)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                      {selectedQuotation.lines.map((line, idx) => (
                        <tr
                          key={line.id}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="p-3 text-slate-400">{idx + 1}</td>
                          <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">
                            {line.productName}
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-300">{line.mill}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {line.unit}
                            </span>
                          </td>
                          <td className="p-3 font-mono font-bold">
                            {line.quantity.toLocaleString('fa-IR')}
                          </td>
                          <td className="p-3 font-mono">
                            {line.unitPrice.toLocaleString('fa-IR')}
                          </td>
                          <td className="p-3 font-mono text-slate-500">{line.taxPercent}٪</td>
                          <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                            {line.totalPrice.toLocaleString('fa-IR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* جمع فاکتور */}
                <div className="flex justify-end pt-3">
                  <div className="w-72 space-y-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-800/20">
                    <div className="flex justify-between text-slate-500">
                      <span>مبلغ اقلام:</span>
                      <span className="font-mono font-bold">
                        {selectedQuotation.subtotal.toLocaleString('fa-IR')} تومان
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>مالیات بر ارزش افزوده (۱۰٪):</span>
                      <span className="font-mono">
                        {selectedQuotation.taxTotal.toLocaleString('fa-IR')} تومان
                      </span>
                    </div>
                    <div className="h-px bg-slate-200 dark:bg-slate-700 pt-1" />
                    <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-slate-100 pt-1">
                      <span>مبلغ نهایی قابل پرداخت:</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400">
                        {selectedQuotation.grandTotal.toLocaleString('fa-IR')} تومان
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* ستون پنل چتر و یادداشت‌ها (Chatter) */}
          <div className="lg:col-span-1">
            <Chatter
              messages={messages[selectedQuotation.id] || []}
              onSendMessage={handleSendMessage}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
            />
          </div>
        </div>
      </div>
    );
  }

  // نمای کلی لیست یا کانبان (Kanban / List View)
  return (
    <div className="space-y-4">
      {/* سربرگ ماژول فروش */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            فروش و پیش‌فاکتورها
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            گردش کار فروش آهن‌آلات، پیگیری استعلام قیمت و تایید سفارشات
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-xl p-1 bg-slate-50 dark:bg-slate-950/50">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="نمای کانبان"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="نمای جدول"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={createNewQuotation}
            className="gap-1.5 bg-blue-600"
          >
            <Plus className="w-4 h-4" />
            <span>پیش‌فاکتور جدید</span>
          </Button>
        </div>
      </div>

      {/* نمای کانبان (Kanban View) */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stages.map((stage) => {
            const stageQuotes = quotations.filter((q) => q.stage === stage.id);
            const stageTotal = stageQuotes.reduce((acc, q) => acc + q.grandTotal, 0);

            return (
              <div
                key={stage.id}
                className="bg-slate-100/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-3 flex flex-col space-y-3 min-h-[500px]"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 px-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                      {stage.label}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                      {stageQuotes.length}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {stageTotal > 0 ? `${(stageTotal / 1000000).toLocaleString('fa-IR')} م` : '۰'}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto">
                  {stageQuotes.map((quote) => (
                    <div
                      key={quote.id}
                      onClick={() => setSelectedQuotation(quote)}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md transition-all cursor-pointer space-y-2 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:underline">
                          {quote.orderNumber}
                        </span>
                        <span className="text-[11px] text-slate-400">{quote.date}</span>
                      </div>
                      <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {quote.customerName}
                      </div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">
                        {quote.lines.map((l) => l.productName).join('، ')}
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400">{quote.salesPerson}</span>
                        <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                          {quote.grandTotal.toLocaleString('fa-IR')} ت
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* نمای جدول (List View) */
        <Card className="overflow-hidden">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5">شماره سند</th>
                <th className="p-3.5">نام خریدار</th>
                <th className="p-3.5">تاریخ صدور</th>
                <th className="p-3.5">اعتبار نرخ</th>
                <th className="p-3.5">وضعیت</th>
                <th className="p-3.5">کارشناس</th>
                <th className="p-3.5">مبلغ کل (تومان)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {quotations.map((quote) => (
                <tr
                  key={quote.id}
                  onClick={() => setSelectedQuotation(quote)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                >
                  <td className="p-3.5 font-mono font-bold text-blue-600 dark:text-blue-400">
                    {quote.orderNumber}
                  </td>
                  <td className="p-3.5 font-semibold text-slate-900 dark:text-slate-100">
                    {quote.customerName}
                  </td>
                  <td className="p-3.5 text-slate-600 dark:text-slate-300">{quote.date}</td>
                  <td className="p-3.5 text-slate-500">{quote.expiryDate}</td>
                  <td className="p-3.5">
                    <Badge
                      variant={
                        quote.stage === 'confirmed'
                          ? 'success'
                          : quote.stage === 'sent'
                            ? 'primary'
                            : quote.stage === 'lost'
                              ? 'danger'
                              : 'neutral'
                      }
                    >
                      {stages.find((s) => s.id === quote.stage)?.label}
                    </Badge>
                  </td>
                  <td className="p-3.5 text-slate-500">{quote.salesPerson}</td>
                  <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-slate-100">
                    {quote.grandTotal.toLocaleString('fa-IR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
};
