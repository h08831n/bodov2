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
import type { SaleOrderStage, WeighbridgeSlip } from '@bodo/contracts';
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
  ExternalLink,
  Truck,
  Scale,
  FileText,
  X,
} from 'lucide-react';
import { PortalOrderView } from './PortalOrderView';
import { OfficialInvoiceModal } from '../components/OfficialInvoiceModal';
import { WeighbridgeSlipModal } from '../components/WeighbridgeSlipModal';

export const SalesModule: React.FC = () => {
  const [quotations, setQuotations] = useState<Quotation[]>(INITIAL_QUOTATIONS);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [showPortalModal, setShowPortalModal] = useState<boolean>(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState<boolean>(false);
  const [showWeighbridgeModal, setShowWeighbridgeModal] = useState<boolean>(false);
  const [orderSlips, setOrderSlips] = useState<WeighbridgeSlip[]>([]);
  const [selectedSlipForPrint, setSelectedSlipForPrint] = useState<WeighbridgeSlip | null>(null);
  const [isCreatingSlip, setIsCreatingSlip] = useState<boolean>(false);
  const [wbForm, setWbForm] = useState({
    netWeightKg: '',
    vehiclePlate: '',
    waybillNo: '',
    driverName: '',
    driverMobile: '',
    scaleName: 'باسکول انبار مرکزی',
  });

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
          freightToman: Number(item.freightToman) || 0,
          grandTotal: Number(item.grandTotalToman) || 0,
          totalWeightKg: Number(item.totalWeightKg) || 0,
          shippingAddress: item.shippingAddress || undefined,
          portalToken: item.portalToken || undefined,
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

  const handleConfirmOrder = async () => {
    if (!selectedQuotation) return;
    try {
      const serverUpdated = await api.sales.confirm(selectedQuotation.id);
      const updated: Quotation = {
        ...selectedQuotation,
        stage: 'confirmed',
        orderNumber: serverUpdated.orderNo || selectedQuotation.orderNumber,
      };
      setSelectedQuotation(updated);
      setQuotations((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));

      const logMsg: ChatterMessage = {
        id: Date.now().toString(),
        author: 'سیستم هوشمند فروش',
        date: 'هم‌اکنون',
        content: `پیش‌فاکتور تایید و تبدیل به سفارش فروش قطعی شد. شماره سند رسمی: ${serverUpdated.orderNo || updated.orderNumber}`,
        type: 'activity',
      };
      setMessages((prev) => ({
        ...prev,
        [selectedQuotation.id]: [logMsg, ...(prev[selectedQuotation.id] || [])],
      }));
    } catch {
      await handleStageChange('confirmed');
    }
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

  const loadOrderSlips = async (orderId: string) => {
    try {
      const slips = await api.weighbridge.getByOrder(orderId);
      setOrderSlips(slips);
    } catch {
      // Ignored
    }
  };

  const handleCreateOrderSlip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuotation) return;
    const weightNum = parseFloat(wbForm.netWeightKg);
    if (!weightNum || weightNum <= 0) return;
    if (!wbForm.vehiclePlate.trim()) return;

    try {
      const slip = await api.weighbridge.create({
        saleOrderId: selectedQuotation.id,
        customerId: selectedQuotation.customerId,
        customerName: selectedQuotation.customerName,
        netWeightKg: weightNum,
        vehiclePlate: wbForm.vehiclePlate.trim(),
        waybillNo: wbForm.waybillNo.trim() || undefined,
        driverName: wbForm.driverName.trim() || undefined,
        driverMobile: wbForm.driverMobile.trim() || undefined,
        scaleName: wbForm.scaleName.trim() || undefined,
      });

      setOrderSlips((prev) => [slip, ...prev]);
      setIsCreatingSlip(false);
      setWbForm({
        netWeightKg: '',
        vehiclePlate: '',
        waybillNo: '',
        driverName: '',
        driverMobile: '',
        scaleName: 'باسکول انبار مرکزی',
      });

      const logMsg: ChatterMessage = {
        id: Date.now().toString(),
        author: 'سیستم باسکول',
        date: 'هم‌اکنون',
        content: `قبض باسکول به شماره ${slip.slipNo} با وزن خالص ${weightNum.toLocaleString('fa-IR')} کیلوگرم صادر شد. پلاک: ${slip.vehiclePlate}`,
        type: 'activity',
      };
      setMessages((prev) => ({
        ...prev,
        [selectedQuotation.id]: [logMsg, ...(prev[selectedQuotation.id] || [])],
      }));
    } catch {
      // Handled
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
                className="gap-1.5 bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4" />
                <span>ارسال به مشتری (پیامک/واتساپ)</span>
              </Button>
            )}
            {selectedQuotation.stage !== 'confirmed' && selectedQuotation.stage !== 'lost' && (
              <Button
                variant="success"
                size="sm"
                onClick={handleConfirmOrder}
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>تایید قطعی و صدور سفارش فروش (SO)</span>
              </Button>
            )}
            {selectedQuotation.stage === 'confirmed' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowInvoiceModal(true)}
                className="gap-1.5 bg-indigo-600 hover:bg-indigo-700"
              >
                <FileText className="w-4 h-4" />
                <span>فاکتور رسمی دارایی (ماده ۱۶۹)</span>
              </Button>
            )}
            {selectedQuotation.stage === 'confirmed' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  loadOrderSlips(selectedQuotation.id);
                  setShowWeighbridgeModal(true);
                }}
                className="gap-1.5 border-blue-500/40 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20"
              >
                <Scale className="w-4 h-4" />
                <span>قبض باسکول و توزین</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPortalModal(true)}
              className="gap-1.5 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
            >
              <ExternalLink className="w-4 h-4" />
              <span>مشاهده در پورتال خریدار (PAGE-PORT-01)</span>
            </Button>
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
            {selectedQuotation.stage === 'confirmed' && (
              <SmartButton
                count={orderSlips.length > 0 ? `${orderSlips.length} قبض` : 'توزین'}
                label="قبض باسکول"
                icon={<Scale className="w-4 h-4 text-blue-600" />}
                onClick={() => {
                  loadOrderSlips(selectedQuotation.id);
                  setShowWeighbridgeModal(true);
                }}
              />
            )}
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

                {/* جمع فاکتور و کرایه حمل */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pt-3">
                  <div className="text-xs text-slate-500 space-y-1">
                    {selectedQuotation.shippingAddress && (
                      <p className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                        <Truck className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                        <span>تحویل: {selectedQuotation.shippingAddress}</span>
                      </p>
                    )}
                    {selectedQuotation.totalWeightKg ? (
                      <p className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                        <Scale className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          تناژ کل: {(selectedQuotation.totalWeightKg / 1000).toFixed(2)} تن (
                          {selectedQuotation.totalWeightKg.toLocaleString('fa-IR')} کیلوگرم)
                        </span>
                      </p>
                    ) : null}
                  </div>

                  <div className="w-full sm:w-72 space-y-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-800/20">
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
                    {Number(selectedQuotation.freightToman ?? 0) > 0 && (
                      <div className="flex justify-between text-sky-600 dark:text-sky-400 font-medium">
                        <span>کرایه حمل باربری:</span>
                        <span className="font-mono font-bold">
                          {Number(selectedQuotation.freightToman).toLocaleString('fa-IR')} تومان
                        </span>
                      </div>
                    )}
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

        {/* پورتال خریدار (PAGE-PORT-01) به‌صورت مودال / نمایش کامل */}
        {showPortalModal && selectedQuotation && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
            <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto p-4 border border-slate-300 dark:border-slate-800 shadow-2xl">
              <PortalOrderView
                orderIdentifier={selectedQuotation.portalToken || selectedQuotation.id}
                onBack={() => setShowPortalModal(false)}
              />
            </div>
          </div>
        )}

        {/* مودال چاپ و صدور فاکتور رسمی دارایی (ماده ۱۶۹ مکرر) */}
        {showInvoiceModal && selectedQuotation && (
          <OfficialInvoiceModal
            orderId={selectedQuotation.id}
            onClose={() => setShowInvoiceModal(false)}
          />
        )}

        {/* مودال قبوض باسکول متصل به این سفارش */}
        {showWeighbridgeModal && selectedQuotation && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                      قبوض باسکول سفارش {selectedQuotation.orderNumber}
                    </h3>
                    <p className="text-xs text-slate-500">
                      خریدار: {selectedQuotation.customerName}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWeighbridgeModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* لیست قبوض موجود */}
              {orderSlips.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    قبوض صادرشده برای این سفارش ({orderSlips.length} فقره):
                  </p>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                    {orderSlips.map((slip) => (
                      <div
                        key={slip.id}
                        className="p-3 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                              {slip.slipNo}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/40 font-mono text-amber-900 dark:text-amber-300 font-bold">
                              {slip.vehiclePlate}
                            </span>
                          </div>
                          <div className="text-slate-500">
                            راننده: {slip.driverName || '—'} | بارنامه: {slip.waybillNo || '—'}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-left font-mono">
                            <span className="font-black text-sm text-blue-700 dark:text-blue-300">
                              {Number(slip.netWeightKg).toLocaleString('fa-IR')} kg
                            </span>
                            <span className="text-slate-400 text-[10px] block">
                              ({(Number(slip.netWeightKg) / 1000).toLocaleString('fa-IR')} تن)
                            </span>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedSlipForPrint(slip)}
                            className="flex items-center gap-1 text-xs"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>چاپ</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                  <Scale className="w-8 h-8 mx-auto mb-1 text-slate-300 dark:text-slate-600" />
                  <p className="text-xs">تاکنون قبض باسکولی برای این سفارش صادر نشده است.</p>
                </div>
              )}

              {/* فرم افزودن قبض جدید */}
              {!isCreatingSlip ? (
                <div className="pt-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setIsCreatingSlip(true)}
                    className="w-full bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>ثبت قبض باسکول جدید برای این سفارش</span>
                  </Button>
                </div>
              ) : (
                <form
                  onSubmit={handleCreateOrderSlip}
                  className="p-4 border border-blue-200 dark:border-blue-900/60 rounded-2xl bg-blue-50/30 dark:bg-blue-950/20 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-900 dark:text-blue-200">
                      ثبت وزن خالص و ناوگان حمل:
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsCreatingSlip(false)}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      بستن فرم
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        وزن خالص بار (کیلوگرم) *
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        required
                        placeholder="مثال: 24500"
                        value={wbForm.netWeightKg}
                        onChange={(e) =>
                          setWbForm((prev) => ({ ...prev, netWeightKg: e.target.value }))
                        }
                        className="w-full px-3 py-1.5 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        شماره پلاک خودرو *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="ایران ۱۱ - ۱۲۳ ج ۴۵"
                        value={wbForm.vehiclePlate}
                        onChange={(e) =>
                          setWbForm((prev) => ({ ...prev, vehiclePlate: e.target.value }))
                        }
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        شماره بارنامه
                      </label>
                      <input
                        type="text"
                        placeholder="BL-9842"
                        value={wbForm.waybillNo}
                        onChange={(e) =>
                          setWbForm((prev) => ({ ...prev, waybillNo: e.target.value }))
                        }
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        نام راننده
                      </label>
                      <input
                        type="text"
                        placeholder="علی رضایی"
                        value={wbForm.driverName}
                        onChange={(e) =>
                          setWbForm((prev) => ({ ...prev, driverName: e.target.value }))
                        }
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        تلفن راننده
                      </label>
                      <input
                        type="text"
                        placeholder="09121234567"
                        value={wbForm.driverMobile}
                        onChange={(e) =>
                          setWbForm((prev) => ({ ...prev, driverMobile: e.target.value }))
                        }
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setIsCreatingSlip(false)}
                    >
                      انصراف
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      className="bg-blue-600 text-white hover:bg-blue-700"
                    >
                      ثبت و صدور قبض
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* پیش‌نمایش و چاپ قبض انتخابی */}
        {selectedSlipForPrint && (
          <WeighbridgeSlipModal
            slip={selectedSlipForPrint}
            onClose={() => setSelectedSlipForPrint(null)}
          />
        )}
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
