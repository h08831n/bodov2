import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Plus,
  Search,
  CheckCircle,
  Send,
  XCircle,
  Truck,
  Layers,
  ArrowRightLeft,
  X,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { Button, Card, Badge } from '@bodo/ui';
import { api } from '../api/client';
import type {
  PurchaseOrder,
  PurchaseOrderStage,
  PurchaseSaleAllocation,
  SourcingInquiry,
  Contact,
  SaleOrder,
} from '@bodo/contracts';

export function PurchasesModule() {
  const [activeTab, setActiveTab] = useState<'orders' | 'allocations' | 'inquiries'>('orders');
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [allocations, setAllocations] = useState<PurchaseSaleAllocation[]>([]);
  const [inquiries, setInquiries] = useState<SourcingInquiry[]>([]);
  const [vendors, setVendors] = useState<Contact[]>([]);
  const [saleOrders, setSaleOrders] = useState<SaleOrder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStage, setSelectedStage] = useState<string>('ALL');

  // Drawer / Form state
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);

  // New Allocation Modal state
  const [isAllocModalOpen, setIsAllocModalOpen] = useState<boolean>(false);
  const [selectedSaleLineId, setSelectedSaleLineId] = useState<string>('');
  const [selectedPurchaseLineId, setSelectedPurchaseLineId] = useState<string>('');
  const [allocQuantity, setAllocQuantity] = useState<number>(0);
  const [allocNotes, setAllocNotes] = useState<string>('');

  // New Sourcing Inquiry Modal state
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState<boolean>(false);
  const [inquiryTitle, setInquiryTitle] = useState<string>('');
  const [inquiryNotes, setInquiryNotes] = useState<string>('');
  const [inquiryLines, setInquiryLines] = useState<
    Array<{ productName: string; mill: string; quantity: number; targetPriceToman?: number }>
  >([{ productName: '', mill: '', quantity: 1000 }]);

  // Form lines for new purchase order
  const [formVendorId, setFormVendorId] = useState<string>('');
  const [formVendorName, setFormVendorName] = useState<string>('');
  const [formDeliveryDate, setFormDeliveryDate] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formLines, setFormLines] = useState<
    Array<{
      productName: string;
      mill: string;
      unit: string;
      quantity: number;
      unitPriceToman: number;
      taxPercent: number;
    }>
  >([
    {
      productName: '',
      mill: '',
      unit: 'کیلوگرم',
      quantity: 1000,
      unitPriceToman: 0,
      taxPercent: 10,
    },
  ]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fetchedOrders, fetchedVendors, fetchedAllocations, fetchedInquiries, fetchedSales] =
        await Promise.all([
          api.purchases.list({
            stage: selectedStage !== 'ALL' ? (selectedStage as PurchaseOrderStage) : undefined,
            search: searchQuery.trim() || undefined,
          }),
          api.contacts.list({ type: 'SUPPLIER' }),
          api.purchases.listAllocations(),
          api.purchases.listInquiries(),
          api.sales.list(),
        ]);

      setOrders(fetchedOrders);
      setVendors(fetchedVendors);
      setAllocations(fetchedAllocations);
      setInquiries(fetchedInquiries);
      setSaleOrders(fetchedSales);
    } catch (err) {
      console.error('Error loading purchase data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedStage, searchQuery]);

  const handleCreateOrder = async () => {
    if (!formVendorId || !formVendorName) {
      alert('لطفاً تأمین‌کننده را انتخاب کنید');
      return;
    }

    const validLines = formLines.filter((l) => l.productName.trim() && l.quantity > 0);
    if (validLines.length === 0) {
      alert('حداقل یک ردیف کالا با مقدار معتبر الزامی است');
      return;
    }

    try {
      await api.purchases.create({
        vendorId: formVendorId,
        vendorName: formVendorName,
        deliveryDate: formDeliveryDate ? new Date(formDeliveryDate).toISOString() : undefined,
        notes: formNotes || undefined,
        lines: validLines,
      });
      setIsFormOpen(false);
      resetForm();
      loadData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'خطا در ثبت سفارش خرید';
      alert(errorMsg);
    }
  };

  const resetForm = () => {
    setFormVendorId('');
    setFormVendorName('');
    setFormDeliveryDate('');
    setFormNotes('');
    setFormLines([
      {
        productName: '',
        mill: '',
        unit: 'کیلوگرم',
        quantity: 1000,
        unitPriceToman: 0,
        taxPercent: 10,
      },
    ]);
    setSelectedOrder(null);
  };

  const handleStageTransition = async (id: string, stage: PurchaseOrderStage) => {
    try {
      await api.purchases.transitionStage(id, stage);
      loadData();
      if (selectedOrder && selectedOrder.id === id) {
        const updated = await api.purchases.get(id);
        setSelectedOrder(updated);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطا در تغییر وضعیت سفارش';
      alert(msg);
    }
  };

  const handleCreateAllocation = async () => {
    if (!selectedSaleLineId || !selectedPurchaseLineId) {
      alert('لطفاً خط سفارش فروش و خط خرید را انتخاب کنید');
      return;
    }
    if (allocQuantity <= 0) {
      alert('مقدار تخصیص باید بزرگتر از صفر باشد');
      return;
    }

    try {
      await api.purchases.allocate({
        saleOrderLineId: selectedSaleLineId,
        purchaseOrderLineId: selectedPurchaseLineId,
        allocatedQuantity: allocQuantity,
        notes: allocNotes || undefined,
      });
      setIsAllocModalOpen(false);
      setSelectedSaleLineId('');
      setSelectedPurchaseLineId('');
      setAllocQuantity(0);
      setAllocNotes('');
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطا در انجام تخصیص';
      alert(msg);
    }
  };

  const handleReleaseAllocation = async (allocId: string) => {
    if (!confirm('آیا از آزادسازی و لغو این تخصیص اطمینان دارید؟')) return;
    try {
      await api.purchases.releaseAllocation(allocId, 'آزادسازی توسط کاربر');
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطا در آزادسازی تخصیص';
      alert(msg);
    }
  };

  const handleCreateInquiry = async () => {
    if (!inquiryTitle.trim()) {
      alert('عنوان استعلام الزامی است');
      return;
    }
    const validLines = inquiryLines.filter((l) => l.productName.trim() && l.quantity > 0);
    if (validLines.length === 0) {
      alert('حداقل یک ردیف کالا الزامی است');
      return;
    }

    try {
      await api.purchases.createInquiry({
        title: inquiryTitle,
        notes: inquiryNotes || undefined,
        lines: validLines,
      });
      setIsInquiryModalOpen(false);
      setInquiryTitle('');
      setInquiryNotes('');
      setInquiryLines([{ productName: '', mill: '', quantity: 1000 }]);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطا در ثبت استعلام بازار';
      alert(msg);
    }
  };

  const getStageBadge = (stage: PurchaseOrderStage) => {
    switch (stage) {
      case 'RFQ':
        return <Badge variant="neutral">پیش‌نویس استعلام (RFQ)</Badge>;
      case 'RFQ_SENT':
        return <Badge variant="primary">استعلام ارسال‌شده</Badge>;
      case 'PURCHASE_ORDER':
        return <Badge variant="success">سفارش خرید تأییدشده</Badge>;
      case 'DONE':
        return <Badge variant="default">تکمیل و تحویل‌شده</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger">لغو شده</Badge>;
      default:
        return <Badge variant="neutral">{stage}</Badge>;
    }
  };

  // Helper calculation for new order
  const calculatedSubtotal = formLines.reduce(
    (sum, l) => sum + Math.round(Number(l.quantity) * Number(l.unitPriceToman)),
    0,
  );
  const calculatedTax = Math.round(calculatedSubtotal * 0.1);
  const calculatedGrandTotal = calculatedSubtotal + calculatedTax;

  return (
    <div className="space-y-6">
      {/* هدر اصلی ماژول سبک Odoo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-rose-600" />
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              خرید، تأمین و استعلام‌های بازار (Purchases & Sourcing)
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            مدیریت استعلام‌های تأمین (RFQ)، سفارشات خرید، مقایسه نرخ‌ها و تخصیص به سفارشات فروش
          </p>
        </div>

        {/* دکمه‌های اقدام سریع */}
        <div className="flex items-center gap-2">
          {activeTab === 'orders' && (
            <Button
              variant="primary"
              onClick={() => {
                resetForm();
                setIsFormOpen(true);
              }}
              className="gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>استعلام / سفارش جدید</span>
            </Button>
          )}

          {activeTab === 'allocations' && (
            <Button variant="primary" onClick={() => setIsAllocModalOpen(true)} className="gap-1.5">
              <ArrowRightLeft className="w-4 h-4" />
              <span>تخصیص جدید خرید و فروش</span>
            </Button>
          )}

          {activeTab === 'inquiries' && (
            <Button
              variant="primary"
              onClick={() => setIsInquiryModalOpen(true)}
              className="gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>استعلام جدید بازار</span>
            </Button>
          )}
        </div>
      </div>

      {/* تب‌های ناوبری اصلی ماژول */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'orders'
              ? 'border-rose-600 text-rose-600 dark:text-rose-400'
              : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
          }`}
        >
          سفارشات خرید و استعلام‌ها ({orders.length})
        </button>

        <button
          onClick={() => setActiveTab('allocations')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'allocations'
              ? 'border-rose-600 text-rose-600 dark:text-rose-400'
              : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
          }`}
        >
          تخصیص خرید و فروش ({allocations.length})
        </button>

        <button
          onClick={() => setActiveTab('inquiries')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'inquiries'
              ? 'border-rose-600 text-rose-600 dark:text-rose-400'
              : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
          }`}
        >
          استعلام‌های سراسری بازار ({inquiries.length})
        </button>
      </div>

      {/* نوار جستجو و فیلترها در تب سفارشات */}
      {activeTab === 'orders' && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="جستجوی شماره سفارش، نام تأمین‌کننده..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-9 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs">
              {['ALL', 'RFQ', 'RFQ_SENT', 'PURCHASE_ORDER', 'DONE', 'CANCELLED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStage(st)}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer font-medium ${
                    selectedStage === st
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {st === 'ALL'
                    ? 'همه'
                    : st === 'RFQ'
                      ? 'استعلام'
                      : st === 'RFQ_SENT'
                        ? 'ارسال‌شده'
                        : st === 'PURCHASE_ORDER'
                          ? 'تأییدشده'
                          : st === 'DONE'
                            ? 'تکمیل'
                            : 'لغو'}
                </button>
              ))}
            </div>

            <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 bg-slate-50 dark:bg-slate-800">
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-1 rounded cursor-pointer ${
                  viewMode === 'kanban'
                    ? 'bg-white dark:bg-slate-700 text-rose-600 shadow-xs'
                    : 'text-slate-500'
                }`}
                title="نمای کانبان Odoo"
              >
                <Layers className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1 rounded cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-700 text-rose-600 shadow-xs'
                    : 'text-slate-500'
                }`}
                title="نمای جدولی"
              >
                <FileText className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* محتوای تب ۱: سفارشات خرید و استعلام‌ها */}
      {activeTab === 'orders' && (
        <>
          {isLoading ? (
            <div className="p-12 text-center text-slate-400">در حال دریافت اطلاعات...</div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <ShoppingCart className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                هیچ سفارش یا استعلام خریدی یافت نشد.
              </p>
            </div>
          ) : viewMode === 'kanban' ? (
            /* نمای کانبان سبک Odoo 17 */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders.map((po) => {
                const totalKg = po.lines?.reduce((s, l) => s + Number(l.quantity), 0) || 0;
                const totalAlloc =
                  po.lines?.reduce((s, l) => s + Number(l.allocatedQuantity), 0) || 0;

                return (
                  <Card
                    key={po.id}
                    onClick={() => {
                      setSelectedOrder(po);
                      setIsFormOpen(true);
                    }}
                    className="p-4 hover:border-rose-300 dark:hover:border-rose-700 transition-all cursor-pointer shadow-xs group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="font-mono text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-900">
                          {po.orderNo}
                        </span>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-1 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                          {po.vendorName}
                        </h3>
                      </div>
                      {getStageBadge(po.stage)}
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 mt-3 border-t border-slate-100 dark:border-slate-800/80 pt-2.5">
                      <div className="flex items-center justify-between">
                        <span>تاریخ ثبت:</span>
                        <span>{new Intl.DateTimeFormat('fa-IR').format(new Date(po.date))}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span>تناژ کل:</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {totalKg.toLocaleString('fa-IR')} کیلوگرم
                        </span>
                      </div>

                      {totalAlloc > 0 && (
                        <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                          <span>تخصیص‌یافته به فروش:</span>
                          <span className="font-medium">
                            {totalAlloc.toLocaleString('fa-IR')} کیلوگرم
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between font-bold text-slate-900 dark:text-slate-100 pt-1 border-t border-dashed border-slate-200 dark:border-slate-800">
                        <span>مبلغ کل:</span>
                        <span className="text-rose-600 dark:text-rose-400 font-mono">
                          {Number(po.grandTotalToman).toLocaleString('fa-IR')} تومان
                        </span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            /* نمای جدولی سبک Odoo */
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="py-3 px-4 font-semibold">شماره سفارش</th>
                    <th className="py-3 px-4 font-semibold">تأمین‌کننده</th>
                    <th className="py-3 px-4 font-semibold">تاریخ</th>
                    <th className="py-3 px-4 font-semibold">مبلغ کل (تومان)</th>
                    <th className="py-3 px-4 font-semibold">وضعیت</th>
                    <th className="py-3 px-4 font-semibold text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {orders.map((po) => (
                    <tr
                      key={po.id}
                      onClick={() => {
                        setSelectedOrder(po);
                        setIsFormOpen(true);
                      }}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-medium text-rose-600 dark:text-rose-400">
                        {po.orderNo}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                        {po.vendorName}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Intl.DateTimeFormat('fa-IR').format(new Date(po.date))}
                      </td>
                      <td className="py-3 px-4 font-mono font-medium">
                        {Number(po.grandTotalToman).toLocaleString('fa-IR')}
                      </td>
                      <td className="py-3 px-4">{getStageBadge(po.stage)}</td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrder(po);
                            setIsFormOpen(true);
                          }}
                        >
                          مشاهده
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* محتوای تب ۲: تخصیص‌های خرید و فروش */}
      {activeTab === 'allocations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              جدول ماتریس تخصیص زنجیره تأمین به سفارشات فروش
            </h2>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsAllocModalOpen(true)}
              className="gap-1"
            >
              <Plus className="w-4 h-4" />
              <span>تخصیص جدید</span>
            </Button>
          </div>

          {allocations.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <ArrowRightLeft className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                هنوز هیچ تخصیصی بین خریدهای قطعی و سفارشات فروش ثبت نشده است.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="py-3 px-4 font-semibold">ردیف سفارش فروش (مقصد)</th>
                    <th className="py-3 px-4 font-semibold">خریدار</th>
                    <th className="py-3 px-4 font-semibold">ردیف سفارش خرید (مبدأ)</th>
                    <th className="py-3 px-4 font-semibold">تأمین‌کننده</th>
                    <th className="py-3 px-4 font-semibold">تناژ تخصیص (کیلوگرم)</th>
                    <th className="py-3 px-4 font-semibold">وضعیت</th>
                    <th className="py-3 px-4 font-semibold text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {allocations.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-4 font-medium">
                        <span className="font-mono text-blue-600 dark:text-blue-400 ml-1">
                          {a.saleOrderLine?.order?.quotationNo ||
                            a.saleOrderLine?.order?.orderNo ||
                            '—'}
                        </span>
                        ({a.saleOrderLine?.productName})
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        {a.saleOrderLine?.order?.customerName || '—'}
                      </td>
                      <td className="py-3 px-4 font-medium">
                        <span className="font-mono text-rose-600 dark:text-rose-400 ml-1">
                          {a.purchaseOrderLine?.order?.orderNo || '—'}
                        </span>
                        ({a.purchaseOrderLine?.productName})
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        {a.purchaseOrderLine?.order?.vendorName || '—'}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                        {Number(a.allocatedQuantity).toLocaleString('fa-IR')}
                      </td>
                      <td className="py-3 px-4">
                        {a.status === 'COMMITTED' ? (
                          <Badge variant="success">متعهد (Committed)</Badge>
                        ) : a.status === 'FULFILLED' ? (
                          <Badge variant="primary">تحویل‌شده (Fulfilled)</Badge>
                        ) : (
                          <Badge variant="neutral">آزادشده (Released)</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {a.status === 'COMMITTED' && (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleReleaseAllocation(a.id)}
                            className="gap-1 py-1 px-2 text-xs"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>آزادسازی</span>
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* محتوای تب ۳: استعلام‌های بازار (Sourcing Inquiries) */}
      {activeTab === 'inquiries' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              پرونده‌های استعلام بازار و کارخانجات
            </h2>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsInquiryModalOpen(true)}
              className="gap-1"
            >
              <Plus className="w-4 h-4" />
              <span>استعلام جدید</span>
            </Button>
          </div>

          {inquiries.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <Search className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                هیچ پرونده استعلام قیمت فعالی ثبت نشده است.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inquiries.map((inq) => (
                <Card key={inq.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-900">
                        {inq.inquiryNo}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-1">
                        {inq.title}
                      </h3>
                    </div>
                    <Badge variant={inq.stage === 'OPEN' ? 'primary' : 'neutral'}>
                      {inq.stage === 'OPEN' ? 'در حال استعلام' : inq.stage}
                    </Badge>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      اقلام درخواستی:
                    </span>
                    {inq.lines?.map((l) => (
                      <div
                        key={l.id}
                        className="flex justify-between text-slate-600 dark:text-slate-400"
                      >
                        <span>
                          {l.productName} ({l.mill || 'هر کارخانه‌ای'})
                        </span>
                        <span className="font-mono">
                          {Number(l.quantity).toLocaleString('fa-IR')} {l.unit}
                          {l.targetPriceToman &&
                            ` - هدف: ${Number(l.targetPriceToman).toLocaleString('fa-IR')} ت`}
                        </span>
                      </div>
                    ))}
                  </div>

                  {inq.orders && inq.orders.length > 0 && (
                    <div className="text-xs text-slate-500">
                      <span>پیشنهادات تأمین متصل: </span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {inq.orders.length} مورد
                      </span>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* مدال / شیت فرم سفارش خرید و استعلام Odoo 17 */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-3xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-r border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* نوار وضعیت Odoo 17 (Status Ribbon) در بالای فرم */}
            <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-rose-600 dark:text-rose-400">
                  {selectedOrder ? selectedOrder.orderNo : 'سفارش خرید / استعلام جدید'}
                </span>
                {selectedOrder && getStageBadge(selectedOrder.stage)}
              </div>

              {/* اکشن‌های تغییر وضعیت سبک Odoo */}
              <div className="flex items-center gap-2">
                {selectedOrder ? (
                  <>
                    {selectedOrder.stage === 'RFQ' && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleStageTransition(selectedOrder.id, 'RFQ_SENT')}
                        className="gap-1 text-xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>ارسال استعلام</span>
                      </Button>
                    )}

                    {(selectedOrder.stage === 'RFQ' || selectedOrder.stage === 'RFQ_SENT') && (
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => handleStageTransition(selectedOrder.id, 'PURCHASE_ORDER')}
                        className="gap-1 text-xs"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>تأیید سفارش خرید</span>
                      </Button>
                    )}

                    {selectedOrder.stage === 'PURCHASE_ORDER' && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleStageTransition(selectedOrder.id, 'DONE')}
                        className="gap-1 text-xs"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>تکمیل تحویل و بارگیری</span>
                      </Button>
                    )}

                    {selectedOrder.stage !== 'CANCELLED' && selectedOrder.stage !== 'DONE' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStageTransition(selectedOrder.id, 'CANCELLED')}
                        className="text-rose-600 gap-1 text-xs"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>لغو</span>
                      </Button>
                    )}
                  </>
                ) : null}

                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* بدنه فرم */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* هدر سند */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    تأمین‌کننده / فروشنده آهن‌آلات:
                  </label>
                  {selectedOrder ? (
                    <div className="p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-sm font-medium">
                      {selectedOrder.vendorName}
                    </div>
                  ) : (
                    <select
                      value={formVendorId}
                      onChange={(e) => {
                        setFormVendorId(e.target.value);
                        const v = vendors.find((vend) => vend.id === e.target.value);
                        setFormVendorName(v ? v.name : '');
                      }}
                      className="w-full text-sm p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-1 focus:ring-rose-500"
                    >
                      <option value="">-- انتخاب تأمین‌کننده --</option>
                      {vendors.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} {v.companyName ? `(${v.companyName})` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    سررسید تحویل:
                  </label>
                  {selectedOrder ? (
                    <div className="p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-sm">
                      {selectedOrder.deliveryDate
                        ? new Intl.DateTimeFormat('fa-IR').format(
                            new Date(selectedOrder.deliveryDate),
                          )
                        : 'مشخص نشده'}
                    </div>
                  ) : (
                    <input
                      type="date"
                      value={formDeliveryDate}
                      onChange={(e) => setFormDeliveryDate(e.target.value)}
                      className="w-full text-sm p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-1 focus:ring-rose-500"
                    />
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    شروط بارگیری و توضیحات:
                  </label>
                  {selectedOrder ? (
                    <div className="p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
                      {selectedOrder.notes || 'توضیحاتی ثبت نشده است.'}
                    </div>
                  ) : (
                    <textarea
                      rows={2}
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      placeholder="مثال: تحویل درب کارخانه ذوب آهن، هزینه باسکول با خریدار..."
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-1 focus:ring-rose-500"
                    />
                  )}
                </div>
              </div>

              {/* جدول اقلام کالا */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    اقلام سفارش خرید
                  </h3>
                  {!selectedOrder && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setFormLines([
                          ...formLines,
                          {
                            productName: '',
                            mill: '',
                            unit: 'کیلوگرم',
                            quantity: 1000,
                            unitPriceToman: 0,
                            taxPercent: 10,
                          },
                        ])
                      }
                      className="gap-1 text-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>افزودن ردیف کالا</span>
                    </Button>
                  )}
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                      <tr>
                        <th className="py-2.5 px-3 font-semibold">شرح کالا</th>
                        <th className="py-2.5 px-3 font-semibold">کارخانه</th>
                        <th className="py-2.5 px-3 font-semibold">مقدار (کیلوگرم)</th>
                        <th className="py-2.5 px-3 font-semibold">قیمت واحد (تومان)</th>
                        <th className="py-2.5 px-3 font-semibold">مبلغ کل (تومان)</th>
                        {selectedOrder && (
                          <th className="py-2.5 px-3 font-semibold">تخصیص‌یافته</th>
                        )}
                        {!selectedOrder && <th className="py-2.5 px-3 text-center">حذف</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {selectedOrder
                        ? selectedOrder.lines?.map((line) => (
                            <tr key={line.id}>
                              <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100">
                                {line.productName}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                                {line.mill || '—'}
                              </td>
                              <td className="py-2.5 px-3 font-mono">
                                {Number(line.quantity).toLocaleString('fa-IR')} {line.unit}
                              </td>
                              <td className="py-2.5 px-3 font-mono">
                                {Number(line.unitPriceToman).toLocaleString('fa-IR')}
                              </td>
                              <td className="py-2.5 px-3 font-mono font-bold text-rose-600 dark:text-rose-400">
                                {Number(line.totalPriceToman).toLocaleString('fa-IR')}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-emerald-600 dark:text-emerald-400">
                                {Number(line.allocatedQuantity).toLocaleString('fa-IR')}
                              </td>
                            </tr>
                          ))
                        : formLines.map((line, idx) => (
                            <tr key={idx}>
                              <td className="p-2">
                                <input
                                  type="text"
                                  placeholder="مثلاً میلگرد ۱۴ A3"
                                  value={line.productName}
                                  onChange={(e) => {
                                    const next = [...formLines];
                                    const item = next[idx];
                                    if (item) {
                                      item.productName = e.target.value;
                                      setFormLines(next);
                                    }
                                  }}
                                  className="w-full text-xs p-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  placeholder="ذوب آهن، نیشابور..."
                                  value={line.mill}
                                  onChange={(e) => {
                                    const next = [...formLines];
                                    const item = next[idx];
                                    if (item) {
                                      item.mill = e.target.value;
                                      setFormLines(next);
                                    }
                                  }}
                                  className="w-full text-xs p-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  value={line.quantity}
                                  onChange={(e) => {
                                    const next = [...formLines];
                                    const item = next[idx];
                                    if (item) {
                                      item.quantity = Number(e.target.value);
                                      setFormLines(next);
                                    }
                                  }}
                                  className="w-24 text-xs p-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  value={line.unitPriceToman}
                                  onChange={(e) => {
                                    const next = [...formLines];
                                    const item = next[idx];
                                    if (item) {
                                      item.unitPriceToman = Number(e.target.value);
                                      setFormLines(next);
                                    }
                                  }}
                                  className="w-28 text-xs p-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                                />
                              </td>
                              <td className="p-2 font-mono font-semibold text-rose-600 dark:text-rose-400">
                                {Math.round(
                                  Number(line.quantity) * Number(line.unitPriceToman) * 1.1,
                                ).toLocaleString('fa-IR')}
                              </td>
                              <td className="p-2 text-center">
                                {formLines.length > 1 && (
                                  <button
                                    onClick={() =>
                                      setFormLines(formLines.filter((_, i) => i !== idx))
                                    }
                                    className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                    </tbody>
                  </table>
                </div>

                {/* جمع مبالغ */}
                <div className="flex justify-end pt-3">
                  <div className="w-64 space-y-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>جمع خالص:</span>
                      <span className="font-mono">
                        {selectedOrder
                          ? Number(selectedOrder.subtotalToman).toLocaleString('fa-IR')
                          : calculatedSubtotal.toLocaleString('fa-IR')}{' '}
                        تومان
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>مالیات ارزش افزوده (۱۰٪):</span>
                      <span className="font-mono">
                        {selectedOrder
                          ? Number(selectedOrder.taxToman).toLocaleString('fa-IR')
                          : calculatedTax.toLocaleString('fa-IR')}{' '}
                        تومان
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 dark:text-slate-100 border-t border-slate-200 dark:border-slate-700 pt-1.5">
                      <span>مبلغ کل سفارش:</span>
                      <span className="font-mono text-rose-600 dark:text-rose-400">
                        {selectedOrder
                          ? Number(selectedOrder.grandTotalToman).toLocaleString('fa-IR')
                          : calculatedGrandTotal.toLocaleString('fa-IR')}{' '}
                        تومان
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* پاورقی دکمه ثبت */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsFormOpen(false)}>
                بستن
              </Button>
              {!selectedOrder && (
                <Button variant="primary" onClick={handleCreateOrder}>
                  ثبت پیش‌نویس استعلام (RFQ)
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* مدال ایجاد تخصیص جدید خرید به فروش */}
      {isAllocModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  تخصیص مستقیم خرید به سفارش فروش
                </h3>
              </div>
              <button
                onClick={() => setIsAllocModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">
                  ۱. انتخاب ردیف سفارش فروش (نیاز متعهد مشتری):
                </label>
                <select
                  value={selectedSaleLineId}
                  onChange={(e) => setSelectedSaleLineId(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="">-- انتخاب سفارش فروش --</option>
                  {saleOrders.flatMap((so) =>
                    (so.lines || []).map((line) => {
                      const remain = Number(line.quantity) - Number(line.allocatedQuantity || 0);
                      if (remain <= 0) return null;
                      return (
                        <option key={line.id} value={line.id}>
                          {so.quotationNo} ({so.customerName}) — {line.productName} ({remain} کیلو
                          باقی‌مانده)
                        </option>
                      );
                    }),
                  )}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  ۲. انتخاب ردیف سفارش خرید (موجودی تأمین‌شده):
                </label>
                <select
                  value={selectedPurchaseLineId}
                  onChange={(e) => setSelectedPurchaseLineId(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="">-- انتخاب سفارش خرید --</option>
                  {orders.flatMap((po) =>
                    (po.lines || []).map((line) => {
                      const remain = Number(line.quantity) - Number(line.allocatedQuantity || 0);
                      if (remain <= 0) return null;
                      return (
                        <option key={line.id} value={line.id}>
                          {po.orderNo} ({po.vendorName}) — {line.productName} ({remain} کیلو موجود)
                        </option>
                      );
                    }),
                  )}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">۳. تناژ تخصیص (کیلوگرم):</label>
                <input
                  type="number"
                  value={allocQuantity}
                  onChange={(e) => setAllocQuantity(Number(e.target.value))}
                  placeholder="مثال: 5000"
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">توضیحات تخصیص:</label>
                <input
                  type="text"
                  value={allocNotes}
                  onChange={(e) => setAllocNotes(e.target.value)}
                  placeholder="مثال: تخصیص مستقیم برای بارگیری چیتگر"
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="ghost" size="sm" onClick={() => setIsAllocModalOpen(false)}>
                انصراف
              </Button>
              <Button variant="primary" size="sm" onClick={handleCreateAllocation}>
                ثبت و قفل تخصیص
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* مدال استعلام جدید بازار */}
      {isInquiryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                ایجاد پرونده استعلام سراسری بازار
              </h3>
              <button
                onClick={() => setIsInquiryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">عنوان استعلام / پروژه:</label>
                <input
                  type="text"
                  value={inquiryTitle}
                  onChange={(e) => setInquiryTitle(e.target.value)}
                  placeholder="مثال: استعلام میلگرد ۱۶ برای پروژه بیمارستان"
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">اقلام درخواستی:</span>
                  <button
                    onClick={() =>
                      setInquiryLines([
                        ...inquiryLines,
                        { productName: '', mill: '', quantity: 1000 },
                      ])
                    }
                    className="text-rose-600 font-medium hover:underline text-xs cursor-pointer"
                  >
                    + افزودن قلم
                  </button>
                </div>

                {inquiryLines.map((l, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="کالا"
                      value={l.productName}
                      onChange={(e) => {
                        const next = [...inquiryLines];
                        const item = next[idx];
                        if (item) {
                          item.productName = e.target.value;
                          setInquiryLines(next);
                        }
                      }}
                      className="flex-1 text-xs p-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                    <input
                      type="text"
                      placeholder="کارخانه"
                      value={l.mill}
                      onChange={(e) => {
                        const next = [...inquiryLines];
                        const item = next[idx];
                        if (item) {
                          item.mill = e.target.value;
                          setInquiryLines(next);
                        }
                      }}
                      className="w-24 text-xs p-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                    <input
                      type="number"
                      placeholder="مقدار"
                      value={l.quantity}
                      onChange={(e) => {
                        const next = [...inquiryLines];
                        const item = next[idx];
                        if (item) {
                          item.quantity = Number(e.target.value);
                          setInquiryLines(next);
                        }
                      }}
                      className="w-20 text-xs p-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    />
                    {inquiryLines.length > 1 && (
                      <button
                        onClick={() => setInquiryLines(inquiryLines.filter((_, i) => i !== idx))}
                        className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="ghost" size="sm" onClick={() => setIsInquiryModalOpen(false)}>
                انصراف
              </Button>
              <Button variant="primary" size="sm" onClick={handleCreateInquiry}>
                ایجاد پرونده استعلام
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
