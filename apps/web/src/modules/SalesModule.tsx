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
import { api } from '../api/client';
import type { SaleOrderStage, WeighbridgeSlip, Contact, Product } from '@bodo/contracts';
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
  Trash2,
  Loader2,
} from 'lucide-react';
import { PortalOrderView } from './PortalOrderView';
import { OfficialInvoiceModal } from '../components/OfficialInvoiceModal';
import { WeighbridgeSlipModal } from '../components/WeighbridgeSlipModal';

export interface QuotationLine {
  id: string;
  productId?: string;
  productName: string;
  mill: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  taxPercent: number;
  totalPrice: number;
}

export interface Quotation {
  id: string;
  orderNumber: string;
  customerName: string;
  customerId: string;
  date: string;
  expiryDate: string;
  stage: 'draft' | 'sent' | 'confirmed' | 'lost';
  lines: QuotationLine[];
  subtotal: number;
  taxTotal: number;
  freightToman?: number;
  grandTotal: number;
  totalWeightKg?: number;
  shippingAddress?: string;
  portalToken?: string;
  salesPerson: string;
  lostReason?: string;
}

interface NewQuotationLineInput {
  productId?: string;
  productName: string;
  mill: string;
  unit: string;
  quantity: number;
  unitPriceToman: number;
  taxPercent: number;
}

export const SalesModule: React.FC = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [showPortalModal, setShowPortalModal] = useState<boolean>(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState<boolean>(false);
  const [showWeighbridgeModal, setShowWeighbridgeModal] = useState<boolean>(false);
  const [orderSlips, setOrderSlips] = useState<WeighbridgeSlip[]>([]);
  const [selectedSlipForPrint, setSelectedSlipForPrint] = useState<WeighbridgeSlip | null>(null);
  const [isCreatingSlip, setIsCreatingSlip] = useState<boolean>(false);

  // فرم پیش‌فاکتور جدید
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [customers, setCustomers] = useState<Contact[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);

  const [newOrderForm, setNewOrderForm] = useState({
    customerId: '',
    customerName: '',
    shippingAddress: '',
    notes: 'تحویل بار درب کارخانه یا انبار تهران. تخلیه بر عهده خریدار است.',
    freightToman: 0,
    lines: [
      {
        productId: '',
        productName: 'میلگرد ۱۶ آجدار A3',
        mill: 'ذوب آهن اصفهان',
        unit: 'کیلوگرم',
        quantity: 10000,
        unitPriceToman: 28500,
        taxPercent: 10,
      },
    ] as NewQuotationLineInput[],
  });

  const [wbForm, setWbForm] = useState({
    netWeightKg: '',
    vehiclePlate: '',
    waybillNo: '',
    driverName: '',
    driverMobile: '',
    scaleName: 'باسکول انبار مرکزی',
  });

  const loadQuotations = async () => {
    setIsLoading(true);
    try {
      const data = await api.sales.list();
      if (data && Array.isArray(data)) {
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
              productId: line.productId || undefined,
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
      }
    } catch (err) {
      console.error('Failed to load sales orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuotations();
  }, []);

  // بارگذاری مشتریان و محصولات هنگام باز شدن مودال پیش‌فاکتور جدید
  useEffect(() => {
    if (showCreateModal) {
      api.contacts
        .list({ type: 'CUSTOMER' })
        .then((data) => {
          if (data && Array.isArray(data)) {
            setCustomers(data);
            const first = data[0];
            if (first && !newOrderForm.customerId) {
              setNewOrderForm((prev) => ({
                ...prev,
                customerId: first.id,
                customerName: first.name || first.companyName || '',
                shippingAddress: first.address || '',
              }));
            }
          }
        })
        .catch(() => {});

      api.products
        .list()
        .then((data) => {
          if (data && Array.isArray(data)) {
            setAvailableProducts(data);
          }
        })
        .catch(() => {});
    }
  }, [showCreateModal]);

  const [messages, setMessages] = useState<Record<string, ChatterMessage[]>>({});

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
      author: 'کاربر سیستم',
      date: 'هم‌اکنون',
      content,
      type,
    };
    setMessages((prev) => ({
      ...prev,
      [selectedQuotation.id]: [newMsg, ...(prev[selectedQuotation.id] || [])],
    }));
  };

  const handleAddLine = () => {
    setNewOrderForm((prev) => ({
      ...prev,
      lines: [
        ...prev.lines,
        {
          productId: '',
          productName: '',
          mill: 'ذوب آهن اصفهان',
          unit: 'کیلوگرم',
          quantity: 5000,
          unitPriceToman: 28500,
          taxPercent: 10,
        },
      ],
    }));
  };

  const handleRemoveLine = (index: number) => {
    if (newOrderForm.lines.length <= 1) {
      alert('پیش‌فاکتور باید حداقل دارای یک ردیف کالا باشد.');
      return;
    }
    setNewOrderForm((prev) => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index),
    }));
  };

  const updateLine = (index: number, updates: Partial<NewQuotationLineInput>) => {
    setNewOrderForm((prev) => ({
      ...prev,
      lines: prev.lines.map((line, i) => (i === index ? { ...line, ...updates } : line)),
    }));
  };

  const handleLineProductSelect = (index: number, productId: string) => {
    const prod = availableProducts.find((p) => p.id === productId);
    if (!prod) return;
    updateLine(index, {
      productId: prod.id,
      productName: prod.name,
      mill: prod.mill || undefined,
      unit: prod.defaultUnit || 'کیلوگرم',
      unitPriceToman: Number(prod.pricePerKgToman) || 0,
    });
  };

  // محاسبات پیش‌نمایش فرم پیش‌فاکتور جدید
  const calculateTotals = () => {
    let subtotal = 0;
    let taxTotal = 0;
    let totalWeight = 0;

    newOrderForm.lines.forEach((l) => {
      const lineSub = (Number(l.quantity) || 0) * (Number(l.unitPriceToman) || 0);
      const lineTax = (lineSub * (Number(l.taxPercent) || 0)) / 100;
      subtotal += lineSub;
      taxTotal += lineTax;
      if (l.unit === 'کیلوگرم') {
        totalWeight += Number(l.quantity) || 0;
      } else if (l.unit === 'تن') {
        totalWeight += (Number(l.quantity) || 0) * 1000;
      }
    });

    const freight = Number(newOrderForm.freightToman) || 0;
    const grandTotal = subtotal + taxTotal + freight;

    return { subtotal, taxTotal, freight, grandTotal, totalWeight };
  };

  const handleCreateQuotationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrderForm.customerId) {
      alert('لطفاً مشتری را انتخاب کنید.');
      return;
    }
    if (newOrderForm.lines.some((l) => !l.productName.trim() || l.quantity <= 0)) {
      alert('لطفاً شرح کالا و مقادیر تمام ردیف‌ها را به درستی وارد کنید.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await api.sales.create({
        customerId: newOrderForm.customerId,
        customerName: newOrderForm.customerName,
        shippingAddress: newOrderForm.shippingAddress.trim() || undefined,
        notes: newOrderForm.notes.trim() || undefined,
        freightToman: Number(newOrderForm.freightToman) || 0,
        lines: newOrderForm.lines.map((l) => ({
          productId: l.productId || undefined,
          productName: l.productName.trim(),
          mill: l.mill.trim(),
          unit: l.unit.trim(),
          quantity: Number(l.quantity),
          unitPriceToman: Number(l.unitPriceToman),
          taxPercent: Number(l.taxPercent) || 10,
        })),
      });

      const newQuote: Quotation = {
        id: created.id,
        orderNumber: created.orderNo || created.quotationNo,
        customerName: created.customerName,
        customerId: created.customerId,
        date: created.date ? created.date.slice(0, 10) : 'امروز',
        expiryDate: created.expiryDate ? created.expiryDate.slice(0, 10) : '۳ روز کاری',
        stage: 'draft',
        salesPerson: created.salespersonName || 'مدیر فروش',
        subtotal: Number(created.subtotalToman) || 0,
        taxTotal: Number(created.taxToman) || 0,
        freightToman: Number(created.freightToman) || 0,
        grandTotal: Number(created.grandTotalToman) || 0,
        totalWeightKg: Number(created.totalWeightKg) || 0,
        shippingAddress: created.shippingAddress || undefined,
        portalToken: created.portalToken || undefined,
        lines:
          created.lines?.map((line) => ({
            id: line.id,
            productId: line.productId || undefined,
            productName: line.productName,
            mill: line.mill,
            unit: line.unit,
            quantity: Number(line.quantity),
            unitPrice: Number(line.unitPriceToman),
            taxPercent: Number(line.taxPercent),
            totalPrice: Number(line.totalPriceToman),
          })) || [],
      };

      setQuotations([newQuote, ...quotations]);
      setSelectedQuotation(newQuote);
      setShowCreateModal(false);
    } catch (err) {
      alert(`خطا در ایجاد پیش‌فاکتور: ${(err as Error).message}`);
    } finally {
      setIsSubmitting(false);
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
    } catch (err) {
      alert(`خطا در ثبت قبض باسکول: ${(err as Error).message}`);
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
                <span>فاکتور رسمی ماده ۱۶۹ مکرر</span>
              </Button>
            )}
            {selectedQuotation.stage === 'confirmed' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowWeighbridgeModal(true);
                  loadOrderSlips(selectedQuotation.id);
                }}
                className="gap-1.5 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
              >
                <Scale className="w-4 h-4" />
                <span>حواله خروج و قبض باسکول</span>
              </Button>
            )}
            {selectedQuotation.stage !== 'lost' && selectedQuotation.stage !== 'confirmed' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStageChange('lost')}
                className="gap-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200 dark:border-rose-900"
              >
                <FileX2 className="w-4 h-4" />
                <span>لغو / باخت پیش‌فاکتور</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="gap-1.5 text-slate-600 dark:text-slate-300"
            >
              <Printer className="w-4 h-4" />
              <span>چاپ پیش‌فاکتور A4</span>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <SmartButton
              count="مشاهده پورتال"
              label="پورتال مشتری"
              icon={<ExternalLink className="w-4 h-4 text-indigo-600" />}
              onClick={() => setShowPortalModal(true)}
            />
            {selectedQuotation.stage === 'confirmed' && (
              <SmartButton
                count={`${orderSlips.length} قبض`}
                label="قبوض باسکول"
                icon={<Scale className="w-4 h-4 text-amber-600" />}
                onClick={() => {
                  setShowWeighbridgeModal(true);
                  loadOrderSlips(selectedQuotation.id);
                }}
              />
            )}
          </div>
        </div>

        {/* برگه مشخصات اصلی پیش‌فاکتور (Sheet Form) */}
        <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-6 border-b border-slate-100 dark:border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 block mb-1">مشتری / خریدار:</span>
              <div className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-slate-400" />
                <span>{selectedQuotation.customerName}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">تاریخ صدور پیش‌فاکتور:</span>
              <div className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>{selectedQuotation.date}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">مهلت اعتبار نرخ روز:</span>
              <div className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>{selectedQuotation.expiryDate}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">کارشناس فروش:</span>
              <div className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-slate-400" />
                <span>{selectedQuotation.salesPerson}</span>
              </div>
            </div>
          </div>

          {selectedQuotation.shippingAddress && (
            <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl text-xs flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <Truck className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                <strong>نشانی تخلیه و مقصد بار:</strong> {selectedQuotation.shippingAddress}
              </span>
            </div>
          )}

          {/* جدول خطوط اقلام فولادی */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
              ردیف‌های مقاطع آهن‌آلات و اقلام سفارش
            </h3>
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">ردیف</th>
                    <th className="py-2.5 px-3">شرح محصول فولادی</th>
                    <th className="py-2.5 px-3">کارخانه سازنده</th>
                    <th className="py-2.5 px-3">واحد</th>
                    <th className="py-2.5 px-3">مقدار / تناژ</th>
                    <th className="py-2.5 px-3">نرخ واحد (تومان)</th>
                    <th className="py-2.5 px-3">مالیات (۱۰٪)</th>
                    <th className="py-2.5 px-3">مبلغ کل (تومان)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {selectedQuotation.lines.map((line, idx) => (
                    <tr key={line.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">
                        {line.productName}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                        {line.mill}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">{line.unit}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {line.quantity.toLocaleString('fa-IR')}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-300">
                        {line.unitPrice.toLocaleString('fa-IR')}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{line.taxPercent}٪</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                        {line.totalPrice.toLocaleString('fa-IR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* جمع کل و مالیات به سبک Odoo */}
          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="w-full md:w-80 space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>جمع اقلام خالص:</span>
                <span className="font-mono font-bold">
                  {selectedQuotation.subtotal.toLocaleString('fa-IR')} تومان
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>مالیات بر ارزش افزوده (۱۰٪):</span>
                <span className="font-mono font-bold">
                  {selectedQuotation.taxTotal.toLocaleString('fa-IR')} تومان
                </span>
              </div>
              {selectedQuotation.freightToman ? (
                <div className="flex justify-between text-slate-500">
                  <span>کرایه حمل و باربری:</span>
                  <span className="font-mono font-bold">
                    {selectedQuotation.freightToman.toLocaleString('fa-IR')} تومان
                  </span>
                </div>
              ) : null}
              <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-slate-100 pt-2 border-t border-slate-200 dark:border-slate-700">
                <span>مبلغ نهایی قابل پرداخت:</span>
                <span className="font-mono text-blue-600 dark:text-blue-400">
                  {selectedQuotation.grandTotal.toLocaleString('fa-IR')} تومان
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* چتر Odoo (Chatter) در انتهای فرم پیش‌فاکتور */}
        <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <Chatter
            messages={messages[selectedQuotation.id] || []}
            onSendMessage={handleSendMessage}
          />
        </Card>

        {/* مدال پورتال خریدار (PAGE-PORT-01) */}
        {showPortalModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                    پیش‌نمایش پورتال اینترنتی خریدار (PAGE-PORT-01)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPortalModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <PortalOrderView
                  orderIdentifier={selectedQuotation.portalToken || selectedQuotation.id}
                  onBack={() => setShowPortalModal(false)}
                />
              </div>
            </div>
          </div>
        )}

        {/* مدال فاکتور رسمی ماده ۱۶۹ مکرر */}
        {showInvoiceModal && (
          <OfficialInvoiceModal
            orderId={selectedQuotation.id}
            onClose={() => setShowInvoiceModal(false)}
          />
        )}

        {/* مدال حواله خروج و قبوض باسکول آهن‌آلات */}
        {showWeighbridgeModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-amber-600" />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    قبوض باسکول و حواله خروج — سفارش {selectedQuotation.orderNumber}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWeighbridgeModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* فهرست قبوض صادرشده */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    قبوض توزین ثبت‌شده ({orderSlips.length} قبض)
                  </span>
                  {!isCreatingSlip && (
                    <Button
                      size="sm"
                      onClick={() => setIsCreatingSlip(true)}
                      className="gap-1 text-xs bg-amber-600 text-white hover:bg-amber-700"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>ثبت قبض باسکول جدید</span>
                    </Button>
                  )}
                </div>

                {orderSlips.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400">
                    هنوز هیچ قبض باسکولی برای این سفارش صادر نشده است.
                  </div>
                ) : (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3">شماره قبض</th>
                          <th className="py-2.5 px-3">وزن خالص باسکول</th>
                          <th className="py-2.5 px-3">پلاک خودرو</th>
                          <th className="py-2.5 px-3">شماره بارنامه</th>
                          <th className="py-2.5 px-3">نام راننده</th>
                          <th className="py-2.5 px-3">تاریخ توزین</th>
                          <th className="py-2.5 px-3">عملیات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {orderSlips.map((slip) => (
                          <tr
                            key={slip.id}
                            className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20"
                          >
                            <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                              {slip.slipNo}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-emerald-600">
                              {Number(slip.netWeightKg).toLocaleString('fa-IR')} کیلوگرم
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300">
                              {slip.vehiclePlate}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-500">
                              {slip.waybillNo || '—'}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                              {slip.driverName || '—'}
                            </td>
                            <td className="py-2.5 px-3 text-slate-400">
                              {new Date(slip.weighedAt).toLocaleDateString('fa-IR')}
                            </td>
                            <td className="py-2.5 px-3">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedSlipForPrint(slip)}
                                className="gap-1 text-[11px] py-1 h-auto"
                              >
                                <Printer className="w-3 h-3" />
                                <span>چاپ قبض</span>
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* فرم ایجاد قبض باسکول جدید */}
              {isCreatingSlip && (
                <form
                  onSubmit={handleCreateOrderSlip}
                  className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 space-y-3 text-xs"
                >
                  <h4 className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    <Scale className="w-4 h-4" />
                    <span>صدور قبض باسکول با وزن خالص</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        وزن خالص بار (کیلوگرم) *
                      </label>
                      <input
                        type="number"
                        required
                        placeholder="مثال: 24850"
                        value={wbForm.netWeightKg}
                        onChange={(e) =>
                          setWbForm((prev) => ({ ...prev, netWeightKg: e.target.value }))
                        }
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        پلاک خودروی حامل *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="مثال: ۱۲ ع ۳۴۵ ایران ۶۸"
                        value={wbForm.vehiclePlate}
                        onChange={(e) =>
                          setWbForm((prev) => ({ ...prev, vehiclePlate: e.target.value }))
                        }
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-mono"
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
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <span>فروش و پیش‌فاکتورها (Sales Orders)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            گردش کار پیش‌فاکتور تا تایید قطعی سفارش فروش، صدور فاکتور رسمی ماده ۱۶۹ مکرر و قبوض
            باسکول
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
            onClick={() => setShowCreateModal(true)}
            className="gap-1.5 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>پیش‌فاکتور جدید</span>
          </Button>
        </div>
      </div>

      {/* وضعیت در حال بارگذاری */}
      {isLoading ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm text-slate-500">
            در حال دریافت پیش‌فاکتورها از پایگاه‌داده شرکت...
          </p>
        </Card>
      ) : quotations.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
            <DollarSign className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-800 dark:text-slate-200">
              هیچ پیش‌فاکتوری ثبت نشده است
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              می‌توانید با ثبت نخستین پیش‌فاکتور فروش آهن‌آلات، گردش کار تجاری را آغاز نمایید.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>صدور اولین پیش‌فاکتور فروش</span>
          </Button>
        </Card>
      ) : viewMode === 'kanban' ? (
        /* نمای کانبان (Kanban View) */
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

      {/* مدال صدور پیش‌فاکتور جدید */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <Card className="w-full max-w-4xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-6 shadow-2xl rounded-2xl max-h-[92vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  صدور پیش‌فاکتور فروش آهن‌آلات
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuotationSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    انتخاب مشتری (خریدار) *
                  </label>
                  {customers.length > 0 ? (
                    <select
                      value={newOrderForm.customerId}
                      onChange={(e) => {
                        const custId = e.target.value;
                        const c = customers.find((cust) => cust.id === custId);
                        setNewOrderForm((prev) => ({
                          ...prev,
                          customerId: custId,
                          customerName: c?.name || c?.companyName || '',
                          shippingAddress: c?.address || prev.shippingAddress,
                        }));
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                    >
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.companyName ? `${c.companyName} (${c.name})` : c.name} — {c.phone}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-3 border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 rounded-xl text-amber-700 dark:text-amber-400 flex items-center justify-between">
                      <span>هنوز هیچ مشتری در سیستم ثبت نشده است.</span>
                      <a href="#contacts" className="underline font-bold">
                        ثبت مخاطب
                      </a>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    نشانی تخلیه و مقصد ارسال بار
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: تهران، شادآباد، خیابان فاخته، پلاک ۱۲، پروژه برج صبا"
                    value={newOrderForm.shippingAddress}
                    onChange={(e) =>
                      setNewOrderForm({ ...newOrderForm, shippingAddress: e.target.value })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* جدول ردیف‌های کالای پیش‌فاکتور */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">
                    ردیف‌های مقاطع آهن‌آلات و اقلام کالا
                  </h4>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddLine}
                    className="gap-1 text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>افزودن ردیف کالا</span>
                  </Button>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-2 px-3 w-1/4">شرح کالا (یا انتخاب از کاتالوگ)</th>
                        <th className="py-2 px-3 w-1/6">کارخانه</th>
                        <th className="py-2 px-3 w-24">واحد</th>
                        <th className="py-2 px-3 w-28">مقدار</th>
                        <th className="py-2 px-3 w-32">نرخ واحد (تومان)</th>
                        <th className="py-2 px-3 w-20">مالیات</th>
                        <th className="py-2 px-3 w-32">جمع ردیف (تومان)</th>
                        <th className="py-2 px-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {newOrderForm.lines.map((line, idx) => {
                        const lineSub =
                          (Number(line.quantity) || 0) * (Number(line.unitPriceToman) || 0);
                        const lineTax = (lineSub * (Number(line.taxPercent) || 0)) / 100;
                        const lineTotal = lineSub + lineTax;

                        return (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                            <td className="p-2 space-y-1">
                              {availableProducts.length > 0 && (
                                <select
                                  value={line.productId || ''}
                                  onChange={(e) => handleLineProductSelect(idx, e.target.value)}
                                  className="w-full text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1 text-slate-700 dark:text-slate-300"
                                >
                                  <option value="">-- انتخاب از کاتالوگ یا تایپ دستی --</option>
                                  {availableProducts.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {p.name} ({p.mill})
                                    </option>
                                  ))}
                                </select>
                              )}
                              <input
                                type="text"
                                required
                                placeholder="نام و مشخصات کالا"
                                value={line.productName}
                                onChange={(e) => updateLine(idx, { productName: e.target.value })}
                                className="w-full bg-transparent border-b border-dashed border-slate-300 dark:border-slate-700 py-1 px-1 text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:border-blue-500"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={line.mill}
                                onChange={(e) => updateLine(idx, { mill: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs text-slate-800 dark:text-slate-200"
                              />
                            </td>
                            <td className="p-2">
                              <select
                                value={line.unit}
                                onChange={(e) => updateLine(idx, { unit: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs text-slate-800 dark:text-slate-200"
                              >
                                <option value="کیلوگرم">کیلوگرم</option>
                                <option value="تن">تن</option>
                                <option value="شاخه">شاخه</option>
                                <option value="بندل">بندل</option>
                              </select>
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                required
                                min="1"
                                value={line.quantity}
                                onChange={(e) =>
                                  updateLine(idx, { quantity: Number(e.target.value) || 0 })
                                }
                                className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 font-mono font-bold text-xs text-slate-800 dark:text-slate-200"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                required
                                min="0"
                                value={line.unitPriceToman}
                                onChange={(e) =>
                                  updateLine(idx, { unitPriceToman: Number(e.target.value) || 0 })
                                }
                                className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 font-mono text-xs text-slate-800 dark:text-slate-200"
                              />
                            </td>
                            <td className="p-2">
                              <select
                                value={line.taxPercent}
                                onChange={(e) =>
                                  updateLine(idx, { taxPercent: Number(e.target.value) || 0 })
                                }
                                className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs text-slate-800 dark:text-slate-200"
                              >
                                <option value={10}>۱۰٪</option>
                                <option value={0}>۰٪ (معاف)</option>
                              </select>
                            </td>
                            <td className="p-2 font-mono font-bold text-slate-900 dark:text-slate-100">
                              {lineTotal.toLocaleString('fa-IR')}
                            </td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveLine(idx)}
                                className="text-slate-400 hover:text-rose-600 p-1"
                                title="حذف ردیف"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* کرایه حمل و شرایط تحویل */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    کرایه حمل و باربری (تومان)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={newOrderForm.freightToman}
                    onChange={(e) =>
                      setNewOrderForm({
                        ...newOrderForm,
                        freightToman: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    شرایط پرداخت و تسویه
                  </label>
                  <input
                    type="text"
                    value={newOrderForm.notes}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, notes: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* جعبه خلاصه مالی پیش‌فاکتور */}
              {(() => {
                const totals = calculateTotals();
                return (
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-4">
                    <div className="text-xs text-slate-500 space-y-1">
                      <div>
                        مجموع تناژ تخمینی بار:{' '}
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                          {(totals.totalWeight / 1000).toLocaleString('fa-IR')} تن
                        </span>
                      </div>
                      <div>
                        مالیات بر ارزش افزوده (۱۰٪):{' '}
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                          {totals.taxTotal.toLocaleString('fa-IR')} تومان
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">
                        مبلغ نهایی پیش‌فاکتور (شامل مالیات و کرایه):
                      </span>
                      <span className="text-lg font-mono font-black text-blue-600 dark:text-blue-400">
                        {totals.grandTotal.toLocaleString('fa-IR')} تومان
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                  انصراف
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>صدور و ذخیره پیش‌فاکتور در سیستم</span>
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
