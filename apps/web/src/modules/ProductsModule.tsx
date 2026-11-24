import React, { useState, useEffect } from 'react';
import { Button, Badge, Card, SmartButton, Chatter, type ChatterMessage } from '@bodo/ui';
import { api } from '../api/client';
import type { ProductCategoryType } from '@bodo/contracts';
import {
  Package,
  TrendingUp,
  ShoppingCart,
  Truck,
  Plus,
  Search,
  LayoutGrid,
  List,
  ArrowRight,
  Printer,
  RotateCw,
  Building2,
  Boxes,
  Check,
  Save,
  Trash2,
  X,
  Loader2,
} from 'lucide-react';

export interface Odoo17Product {
  id: string;
  code: string;
  name: string;
  category: 'rebar' | 'beam' | 'sheet' | 'profile' | 'pipe' | 'wire' | 'other';
  mill: string;
  standard: string;
  size: string;
  allowedUnits: string[];
  defaultUnit: string;
  pricePerKgToman: number;
  stockKg: number;
  type: 'STORABLE' | 'CONSUMABLE' | 'SERVICE';
  invoicingPolicy: 'ORDERED' | 'DELIVERED';
  costPriceToman: number;
  purchaseUom: string;
  canBeSold: boolean;
  canBePurchased: boolean;
  barcode?: string;
  descriptionSale?: string;
  weightKg?: number;
  routes: string[];
  forecastedKg: number;
  soldQtyKg: number;
  purchasedQtyKg: number;
  attributes: Array<{ name: string; values: string[] }>;
  suppliers: Array<{
    id: string;
    vendorName: string;
    minQuantity: number;
    priceToman: number;
    currency: string;
    leadTimeDays: number;
  }>;
}

export const ProductsModule: React.FC = () => {
  const [products, setProducts] = useState<Odoo17Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedProduct, setSelectedProduct] = useState<Odoo17Product | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<
    'general' | 'variants' | 'purchase' | 'sales' | 'inventory'
  >('general');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // فرم ایجاد محصول جدید
  const [newForm, setNewForm] = useState({
    code: '',
    name: '',
    category: 'REBAR' as ProductCategoryType,
    mill: 'ذوب آهن اصفهان',
    standard: 'A3',
    size: '16',
    defaultUnit: 'کیلوگرم',
    pricePerKgToman: 28500,
    costPriceToman: 27100,
    stockKg: 10000,
    barcode: '',
    descriptionSale: 'تحویل درب انبار یا بارگیری مستقیم از کارخانه همراه با گواهینامه آنالیز کیفی.',
  });

  const [messages, setMessages] = useState<Record<string, ChatterMessage[]>>({});

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const data = await api.products.list();
      if (data && Array.isArray(data)) {
        const mapped: Odoo17Product[] = data.map((p) => {
          const basePrice = Number(p.pricePerKgToman) || 0;
          const baseStock = Number(p.stockKg) || 0;
          const cat = (p.category?.toLowerCase() || 'rebar') as Odoo17Product['category'];
          return {
            id: p.id,
            code: p.code,
            name: p.name,
            category: cat,
            mill: p.mill || 'ذوب آهن اصفهان',
            standard: p.standard || 'A3',
            size: p.size || '16',
            allowedUnits: p.allowedUnits || ['کیلوگرم', 'شاخه', 'بندل', 'تن'],
            defaultUnit: p.defaultUnit || 'کیلوگرم',
            pricePerKgToman: basePrice,
            stockKg: baseStock,
            type: 'STORABLE',
            invoicingPolicy: 'ORDERED',
            costPriceToman: Math.round(basePrice * 0.95),
            purchaseUom: 'تن',
            canBeSold: true,
            canBePurchased: true,
            barcode: p.barcode || `62600${p.id.replace(/\D/g, '').padEnd(8, '0')}`,
            descriptionSale: `تحویل درب کارخانه ${p.mill || ''} یا انبار تهران، دارای برگه آنالیز آزمایشگاهی.`,
            weightKg: cat === 'rebar' ? 1.58 : 24.5,
            routes: ['خرید از کارخانه', 'ارسال مستقیم (Dropship)'],
            forecastedKg: Number(p.forecastedKg || baseStock),
            soldQtyKg: Number(p.soldQtyKg || 0),
            purchasedQtyKg: Number(p.purchasedQtyKg || baseStock),
            attributes: [
              { name: 'کارخانه سازنده', values: [p.mill || 'ذوب آهن اصفهان'] },
              { name: 'استاندارد نورد', values: [p.standard || 'A3'] },
              { name: 'سایز / ضخامت', values: [p.size || '16'] },
            ],
            suppliers: [
              {
                id: 'sup-1',
                vendorName: p.mill || 'تأمین‌کننده اصلی',
                minQuantity: 20000,
                priceToman: Math.round(basePrice * 0.95),
                currency: 'تومان',
                leadTimeDays: 2,
              },
            ],
          };
        });
        setProducts(mapped);
      }
    } catch (err) {
      console.error('Failed to load products from API:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Fetch metrics when product is selected
  useEffect(() => {
    if (!selectedProduct) return;
    api.products
      .getMetrics(selectedProduct.id)
      .then((metrics) => {
        if (!metrics) return;
        setSelectedProduct((prev) =>
          prev && prev.id === selectedProduct.id
            ? {
                ...prev,
                stockKg: metrics.onHandKg,
                forecastedKg: metrics.forecastedKg,
                soldQtyKg: metrics.soldQtyKg,
                purchasedQtyKg: metrics.purchasedQtyKg,
              }
            : prev,
        );
      })
      .catch(() => {
        // Keep current product metrics
      });
  }, [selectedProduct?.id]);

  const handleSendMessage = (content: string, type: 'note' | 'activity') => {
    if (!selectedProduct) return;
    const newMsg: ChatterMessage = {
      id: Date.now().toString(),
      author: 'کاربر سیستم',
      date: 'هم‌اکنون',
      content,
      type,
    };
    setMessages((prev) => ({
      ...prev,
      [selectedProduct.id]: [newMsg, ...(prev[selectedProduct.id] || [])],
    }));
  };

  const handleSaveProduct = async () => {
    if (!selectedProduct) return;
    setIsSaving(true);
    try {
      await api.products.update(selectedProduct.id, {
        name: selectedProduct.name,
        mill: selectedProduct.mill,
        standard: selectedProduct.standard,
        size: selectedProduct.size,
        defaultUnit: selectedProduct.defaultUnit,
        pricePerKgToman: selectedProduct.pricePerKgToman,
        stockKg: selectedProduct.stockKg,
        barcode: selectedProduct.barcode,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      setProducts((prev) => prev.map((p) => (p.id === selectedProduct.id ? selectedProduct : p)));
    } catch (err) {
      alert(`خطا در ذخیره کالا: ${(err as Error).message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;
    if (!confirm(`آیا از حذف محصول «${selectedProduct.name}» اطمینان دارید؟`)) return;
    try {
      await api.products.delete(selectedProduct.id);
      setProducts((prev) => prev.filter((p) => p.id !== selectedProduct.id));
      setSelectedProduct(null);
    } catch (err) {
      alert(`خطا در حذف کالا: ${(err as Error).message}`);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.name.trim() || !newForm.code.trim()) {
      alert('لطفاً نام و کد محصول را وارد کنید.');
      return;
    }

    setIsSaving(true);
    try {
      const created = await api.products.create({
        code: newForm.code.trim(),
        name: newForm.name.trim(),
        category: newForm.category,
        mill: newForm.mill.trim(),
        standard: newForm.standard.trim(),
        size: newForm.size.trim(),
        defaultUnit: newForm.defaultUnit,
        allowedUnits: ['کیلوگرم', 'شاخه', 'بندل', 'تن'],
        pricePerKgToman: Number(newForm.pricePerKgToman) || 0,
        stockKg: Number(newForm.stockKg) || 0,
        barcode: newForm.barcode.trim() || undefined,
      });

      const catLower = (created.category?.toLowerCase() || 'rebar') as Odoo17Product['category'];
      const basePrice = Number(created.pricePerKgToman) || 0;
      const baseStock = Number(created.stockKg) || 0;

      const newProductItem: Odoo17Product = {
        id: created.id,
        code: created.code,
        name: created.name,
        category: catLower,
        mill: created.mill || newForm.mill,
        standard: created.standard || newForm.standard,
        size: created.size || newForm.size,
        allowedUnits: ['کیلوگرم', 'شاخه', 'بندل', 'تن'],
        defaultUnit: created.defaultUnit || 'کیلوگرم',
        pricePerKgToman: basePrice,
        stockKg: baseStock,
        type: 'STORABLE',
        invoicingPolicy: 'ORDERED',
        costPriceToman: Number(newForm.costPriceToman) || Math.round(basePrice * 0.95),
        purchaseUom: 'تن',
        canBeSold: true,
        canBePurchased: true,
        barcode: created.barcode || undefined,
        descriptionSale: newForm.descriptionSale,
        weightKg: catLower === 'rebar' ? 1.58 : 24.5,
        routes: ['خرید از کارخانه', 'ارسال مستقیم (Dropship)'],
        forecastedKg: baseStock,
        soldQtyKg: 0,
        purchasedQtyKg: baseStock,
        attributes: [
          { name: 'کارخانه سازنده', values: [created.mill || newForm.mill] },
          { name: 'استاندارد نورد', values: [created.standard || newForm.standard] },
          { name: 'سایز / ضخامت', values: [created.size || newForm.size] },
        ],
        suppliers: [
          {
            id: 'sup-1',
            vendorName: created.mill || newForm.mill,
            minQuantity: 20000,
            priceToman: Number(newForm.costPriceToman) || Math.round(basePrice * 0.95),
            currency: 'تومان',
            leadTimeDays: 2,
          },
        ],
      };

      setProducts([newProductItem, ...products]);
      setSelectedProduct(newProductItem);
      setShowCreateModal(false);
      // Reset form
      setNewForm({
        code: '',
        name: '',
        category: 'REBAR',
        mill: 'ذوب آهن اصفهان',
        standard: 'A3',
        size: '16',
        defaultUnit: 'کیلوگرم',
        pricePerKgToman: 28500,
        costPriceToman: 27100,
        stockKg: 10000,
        barcode: '',
        descriptionSale:
          'تحویل درب انبار یا بارگیری مستقیم از کارخانه همراه با گواهینامه آنالیز کیفی.',
      });
    } catch (err) {
      alert(`خطا در ایجاد محصول: ${(err as Error).message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = products.filter((p) => {
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    const matchesSearch =
      p.name.includes(search) ||
      p.mill.includes(search) ||
      p.code.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // ───────────── نمای فرم Odoo 17 (Product Form View) ─────────────
  if (selectedProduct) {
    return (
      <div className="space-y-4 animate-in fade-in duration-150">
        {/* نوار ناوبری بالای فرم Odoo (Control Panel & Actions) */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-xs">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedProduct(null)}
              className="gap-1.5"
            >
              <ArrowRight className="w-4 h-4" />
              <span>بازگشت به کاتالوگ</span>
            </Button>
            <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />
            <span className="text-sm font-mono font-bold text-slate-500 dark:text-slate-400">
              {selectedProduct.code}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {saveSuccess && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <Check className="w-4 h-4" />
                تغییرات ذخیره شد
              </span>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveProduct}
              isLoading={isSaving}
              className="gap-1.5 bg-blue-600 hover:bg-blue-700"
            >
              <Save className="w-4 h-4" />
              <span>ذخیره تغییرات</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const add = prompt(
                  'مقدار تغییر موجودی به کیلوگرم را وارد کنید (مثبت برای افزایش، منفی برای کاهش):',
                  '5000',
                );
                if (add) {
                  const qty = Number(add);
                  if (!isNaN(qty)) {
                    const newStock = Math.max(0, selectedProduct.stockKg + qty);
                    api.products
                      .update(selectedProduct.id, { stockKg: newStock })
                      .then(() => {
                        const updated = {
                          ...selectedProduct,
                          stockKg: newStock,
                          forecastedKg: newStock,
                        };
                        setSelectedProduct(updated);
                        setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
                      })
                      .catch((err) => alert(`خطا در بروزرسانی موجودی: ${(err as Error).message}`));
                  }
                }
              }}
              className="gap-1.5 text-xs text-blue-600 border-blue-200 dark:border-blue-900/50 hover:bg-blue-50 dark:hover:bg-blue-950/30"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>بروزرسانی موجودی انبار</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                alert(`برچسب مشخصات و بارکد استاندارد ${selectedProduct.code} به چاپگر ارسال شد.`)
              }
              className="gap-1.5 text-xs text-slate-600 dark:text-slate-300"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>چاپ لیبل</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteProduct}
              className="gap-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>حذف</span>
            </Button>
          </div>
        </div>

        {/* فرم مشخصات کامل کالا (Sheet Odoo 17) */}
        <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-6">
          {/* بخش فوقانی فرم: اسمارت باتن‌های Odoo در گوشه سمت چپ/بالا */}
          <div className="flex flex-col-reverse md:flex-row md:items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
            <div className="space-y-3 flex-1">
              {/* نام کالا - تایپوگرافی برجسته Odoo */}
              <input
                type="text"
                value={selectedProduct.name}
                onChange={(e) => {
                  const updated = { ...selectedProduct, name: e.target.value };
                  setSelectedProduct(updated);
                  setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
                }}
                className="w-full text-2xl font-black text-slate-900 dark:text-slate-100 bg-transparent border-b border-dashed border-slate-300 dark:border-slate-700 focus:border-blue-600 focus:outline-none pb-1"
                placeholder="نام کالا را وارد کنید..."
              />

              {/* چک‌باکس‌های استاندارد Odoo 17 */}
              <div className="flex items-center gap-6 pt-1 text-sm text-slate-700 dark:text-slate-300">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selectedProduct.canBeSold}
                    onChange={(e) => {
                      const updated = { ...selectedProduct, canBeSold: e.target.checked };
                      setSelectedProduct(updated);
                    }}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
                  />
                  <span className="font-medium">امکان فروش دارد (Can be Sold)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selectedProduct.canBePurchased}
                    onChange={(e) => {
                      const updated = { ...selectedProduct, canBePurchased: e.target.checked };
                      setSelectedProduct(updated);
                    }}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
                  />
                  <span className="font-medium">امکان خرید دارد (Can be Purchased)</span>
                </label>
              </div>
            </div>

            {/* نوار Smart Buttons Odoo 17 */}
            <div className="flex flex-wrap items-center gap-2 self-start">
              <SmartButton
                count={`${(selectedProduct.stockKg / 1000).toLocaleString('fa-IR')} تن`}
                label="موجودی در دست"
                icon={<Boxes className="w-4 h-4 text-emerald-600" />}
                onClick={() =>
                  alert(
                    `موجودی دقیق انبار: ${selectedProduct.stockKg.toLocaleString('fa-IR')} کیلوگرم`,
                  )
                }
              />
              <SmartButton
                count={`${(selectedProduct.forecastedKg / 1000).toLocaleString('fa-IR')} تن`}
                label="پیش‌بینی موجودی"
                icon={<TrendingUp className="w-4 h-4 text-blue-600" />}
                onClick={() =>
                  alert(
                    `پیش‌بینی با در نظر گرفتن سفارش‌ها: ${selectedProduct.forecastedKg.toLocaleString('fa-IR')} کیلوگرم`,
                  )
                }
              />
              <SmartButton
                count={`${(selectedProduct.soldQtyKg / 1000).toLocaleString('fa-IR')} تن`}
                label="فروخته‌شده"
                icon={<ShoppingCart className="w-4 h-4 text-amber-600" />}
                onClick={() =>
                  alert(
                    `کل فروش تحقق‌یافته: ${selectedProduct.soldQtyKg.toLocaleString('fa-IR')} کیلوگرم`,
                  )
                }
              />
              <SmartButton
                count={`${(selectedProduct.purchasedQtyKg / 1000).toLocaleString('fa-IR')} تن`}
                label="خریداری‌شده"
                icon={<Truck className="w-4 h-4 text-purple-600" />}
                onClick={() =>
                  alert(
                    `کل خرید محقق‌شده: ${selectedProduct.purchasedQtyKg.toLocaleString('fa-IR')} کیلوگرم`,
                  )
                }
              />
            </div>
          </div>

          {/* تب‌های فرم کالا به سبک Odoo 17 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 text-sm overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setActiveTab('general')}
                className={`px-4 py-2 font-medium cursor-pointer transition-colors border-b-2 -mb-1 ${
                  activeTab === 'general'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                اطلاعات عمومی (General Information)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('variants')}
                className={`px-4 py-2 font-medium cursor-pointer transition-colors border-b-2 -mb-1 ${
                  activeTab === 'variants'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                ویژگی‌ها و متغیرها (Attributes & Variants)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('purchase')}
                className={`px-4 py-2 font-medium cursor-pointer transition-colors border-b-2 -mb-1 ${
                  activeTab === 'purchase'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                خرید و تأمین‌کنندگان (Purchase)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('sales')}
                className={`px-4 py-2 font-medium cursor-pointer transition-colors border-b-2 -mb-1 ${
                  activeTab === 'sales'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                فروش (Sales)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('inventory')}
                className={`px-4 py-2 font-medium cursor-pointer transition-colors border-b-2 -mb-1 ${
                  activeTab === 'inventory'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                انبار و لجستیک (Inventory)
              </button>
            </div>

            {/* محتوای تب ۱: اطلاعات عمومی */}
            {activeTab === 'general' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                {/* ستون اول: نوع و واحدهای سنجش */}
                <div className="space-y-4 text-sm">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      نوع کالا (Product Type)
                    </label>
                    <select
                      value={selectedProduct.type}
                      onChange={(e) => {
                        const updated = {
                          ...selectedProduct,
                          type: e.target.value as Odoo17Product['type'],
                        };
                        setSelectedProduct(updated);
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                    >
                      <option value="STORABLE">کالای انبارش‌پذیر (Storable Product)</option>
                      <option value="CONSUMABLE">کالای مصرفی (Consumable)</option>
                      <option value="SERVICE">خدمت (Service)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      خط‌مشی صدور فاکتور (Invoicing Policy)
                    </label>
                    <select
                      value={selectedProduct.invoicingPolicy}
                      onChange={(e) => {
                        const updated = {
                          ...selectedProduct,
                          invoicingPolicy: e.target.value as Odoo17Product['invoicingPolicy'],
                        };
                        setSelectedProduct(updated);
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                    >
                      <option value="ORDERED">بر اساس مقادیر سفارش‌شده (Ordered quantities)</option>
                      <option value="DELIVERED">
                        بر اساس مقادیر تحویل‌شده باسکول (Delivered quantities)
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      واحد اندازه‌گیری فروش / انبار (Unit of Measure)
                    </label>
                    <input
                      type="text"
                      value={selectedProduct.defaultUnit}
                      onChange={(e) => {
                        const updated = { ...selectedProduct, defaultUnit: e.target.value };
                        setSelectedProduct(updated);
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      واحد اندازه‌گیری خرید (Purchase UoM)
                    </label>
                    <input
                      type="text"
                      value={selectedProduct.purchaseUom}
                      onChange={(e) => {
                        const updated = { ...selectedProduct, purchaseUom: e.target.value };
                        setSelectedProduct(updated);
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* ستون دوم: قیمت‌ها و مالیات */}
                <div className="space-y-4 text-sm">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      قیمت فروش به مشتری (Sales Price) — هر کیلوگرم
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={selectedProduct.pricePerKgToman}
                        onChange={(e) => {
                          const updated = {
                            ...selectedProduct,
                            pricePerKgToman: Number(e.target.value) || 0,
                          };
                          setSelectedProduct(updated);
                        }}
                        className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 pl-16 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 font-mono font-bold"
                      />
                      <span className="absolute left-3 top-2.5 text-xs text-slate-400">تومان</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      بهای تمام‌شده / قیمت خرید (Cost Price)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={selectedProduct.costPriceToman}
                        onChange={(e) => {
                          const updated = {
                            ...selectedProduct,
                            costPriceToman: Number(e.target.value) || 0,
                          };
                          setSelectedProduct(updated);
                        }}
                        className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 pl-16 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                      />
                      <span className="absolute left-3 top-2.5 text-xs text-slate-400">تومان</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        کارخانه سازنده
                      </label>
                      <input
                        type="text"
                        value={selectedProduct.mill}
                        onChange={(e) => {
                          const updated = { ...selectedProduct, mill: e.target.value };
                          setSelectedProduct(updated);
                        }}
                        className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        استاندارد نورد
                      </label>
                      <input
                        type="text"
                        value={selectedProduct.standard}
                        onChange={(e) => {
                          const updated = { ...selectedProduct, standard: e.target.value };
                          setSelectedProduct(updated);
                        }}
                        className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        رفرنس داخلی (Internal Reference)
                      </label>
                      <input
                        type="text"
                        value={selectedProduct.code}
                        disabled
                        className="w-full bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono text-xs text-slate-700 dark:text-slate-300 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        بارکد کالا (Barcode)
                      </label>
                      <input
                        type="text"
                        value={selectedProduct.barcode || ''}
                        onChange={(e) => {
                          const updated = { ...selectedProduct, barcode: e.target.value };
                          setSelectedProduct(updated);
                        }}
                        className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* محتوای تب ۲: ویژگی‌ها و متغیرها (Odoo 17 Variant Matrix) */}
            {activeTab === 'variants' && (
              <div className="space-y-6 pt-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">
                    ماتریس ویژگی‌ها (Attributes Matrix)
                  </h4>
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-sm text-right">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="py-2.5 px-4 w-1/3">نام ویژگی</th>
                          <th className="py-2.5 px-4">مقادیر متناظر</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {selectedProduct.attributes.map((attr, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                            <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">
                              {attr.name}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap items-center gap-1.5">
                                {attr.values.map((val, vIdx) => (
                                  <Badge
                                    key={vIdx}
                                    variant="neutral"
                                    className="bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/50 text-xs py-0.5 px-2.5 rounded-lg"
                                  >
                                    {val}
                                  </Badge>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs text-slate-500 flex items-center justify-between">
                  <span>
                    واریانت‌های فعال این الگو بر اساس ترکیب صفات کارخانه، استاندارد و سایز در پایگاه
                    داده ثبت شده‌اند.
                  </span>
                  <Badge variant="success">فعال در کاتالوگ</Badge>
                </div>
              </div>
            )}

            {/* محتوای تب ۳: خرید و تأمین‌کنندگان (Vendor Pricelist) */}
            {activeTab === 'purchase' && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    لیست قیمت تأمین‌کنندگان و کارخانجات (Vendor Pricelist)
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const vendor = prompt('نام کارخانه یا تأمین‌کننده:', 'فولاد مبارکه اصفهان');
                      const price = prompt('نرخ خرید هر کیلوگرم (تومان):', '27400');
                      if (vendor && price) {
                        const newSup = {
                          id: `sup-${Date.now()}`,
                          vendorName: vendor,
                          minQuantity: 25000,
                          priceToman: Number(price) || 0,
                          currency: 'تومان',
                          leadTimeDays: 2,
                        };
                        const updated = {
                          ...selectedProduct,
                          suppliers: [...selectedProduct.suppliers, newSup],
                        };
                        setSelectedProduct(updated);
                        setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
                      }
                    }}
                    className="gap-1 text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>افزودن تأمین‌کننده</span>
                  </Button>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-sm text-right">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-2.5 px-4">تأمین‌کننده / کارخانه</th>
                        <th className="py-2.5 px-4">حداقل تناژ سفارش</th>
                        <th className="py-2.5 px-4">قیمت همکار</th>
                        <th className="py-2.5 px-4">زمان تحویل</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {selectedProduct.suppliers.map((sup) => (
                        <tr
                          key={sup.id}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20"
                        >
                          <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-slate-400" />
                            <span>{sup.vendorName}</span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                            {(sup.minQuantity / 1000).toLocaleString('fa-IR')} تن
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                            {sup.priceToman.toLocaleString('fa-IR')} {sup.currency}
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-500">
                            {sup.leadTimeDays} روز کاری
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* محتوای تب ۴: فروش */}
            {activeTab === 'sales' && (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    شرح کالا در پیش‌فاکتور و فاکتور مشتری (Sales Description)
                  </label>
                  <textarea
                    rows={4}
                    value={selectedProduct.descriptionSale || ''}
                    onChange={(e) => {
                      const updated = { ...selectedProduct, descriptionSale: e.target.value };
                      setSelectedProduct(updated);
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                    placeholder="توضیحات استاندارد، شرایط تخلیه و تحویل برای مشتری..."
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    این متن به صورت خودکار زیر عنوان کالا در پیش‌فاکتور فروش چاپ خواهد شد.
                  </p>
                </div>
              </div>
            )}

            {/* محتوای تب ۵: انبار و لجستیک */}
            {activeTab === 'inventory' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2 text-sm">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      مسیرهای تأمین لجستیک (Operations Routes)
                    </label>
                    <div className="space-y-2 pt-1">
                      {selectedProduct.routes.map((route, rIdx) => (
                        <div
                          key={rIdx}
                          className="flex items-center gap-2 text-slate-700 dark:text-slate-300"
                        >
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span>{route}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      وزن اسمی هر شاخه / واحد در باسکول (Weight kg)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        value={selectedProduct.weightKg || 1.58}
                        onChange={(e) => {
                          const updated = {
                            ...selectedProduct,
                            weightKg: Number(e.target.value) || 0,
                          };
                          setSelectedProduct(updated);
                        }}
                        className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 pl-16 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                      />
                      <span className="absolute left-3 top-2.5 text-xs text-slate-400">
                        کیلوگرم
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      مبنای محاسبه وزن ناخالص بارنامه در صورت صدور سند بر اساس شاخه.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* چتر Odoo 17 در انتهای فرم کالا */}
        <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <Chatter
            messages={messages[selectedProduct.id] || []}
            onSendMessage={handleSendMessage}
          />
        </Card>
      </div>
    );
  }

  // ───────────── نمای اصلی لیست و کارت‌های Odoo 17 ─────────────
  return (
    <div className="space-y-4">
      {/* سربرگ ماژول محصولات سبک Odoo 17 */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-600" />
            <span>کاتالوگ محصولات و آهن‌آلات (Products)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            الگوی ساختاریافته Odoo 17 شامل کاتالوگ مقاطع، متغیرهای کارخانه، لیست قیمت تأمین و موجودی
            بلادرنگ
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* تغییر نما به سبک Odoo */}
          <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-xl p-1 bg-slate-50 dark:bg-slate-950/50">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="نمای کارت‌ها (Kanban)"
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
              title="نمای لیست (List)"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="gap-1.5 bg-amber-600 hover:bg-amber-700"
          >
            <Plus className="w-4 h-4" />
            <span>محصول جدید (New)</span>
          </Button>
        </div>
      </div>

      {/* نوار جستجو و فیلترهای سریع */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-2xs">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="جستجوی نام کالا، کد محصول، کارخانه..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl pr-9 pl-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1 border border-slate-200 dark:border-slate-800 rounded-xl p-1 bg-slate-50 dark:bg-slate-950/50 text-xs">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1 rounded-lg cursor-pointer transition-colors ${
              categoryFilter === 'all'
                ? 'bg-white dark:bg-slate-800 text-blue-600 font-bold shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            همه مقاطع
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('rebar')}
            className={`px-3 py-1 rounded-lg cursor-pointer transition-colors ${
              categoryFilter === 'rebar'
                ? 'bg-white dark:bg-slate-800 text-blue-600 font-bold shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            میلگرد
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('beam')}
            className={`px-3 py-1 rounded-lg cursor-pointer transition-colors ${
              categoryFilter === 'beam'
                ? 'bg-white dark:bg-slate-800 text-blue-600 font-bold shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            تیرآهن
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('sheet')}
            className={`px-3 py-1 rounded-lg cursor-pointer transition-colors ${
              categoryFilter === 'sheet'
                ? 'bg-white dark:bg-slate-800 text-blue-600 font-bold shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            ورق فولادی
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('profile')}
            className={`px-3 py-1 rounded-lg cursor-pointer transition-colors ${
              categoryFilter === 'profile'
                ? 'bg-white dark:bg-slate-800 text-blue-600 font-bold shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            قوطی و پروفیل
          </button>
        </div>
      </div>

      {/* وضعیت در حال بارگذاری */}
      {isLoading ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
          <p className="text-sm text-slate-500">
            در حال بارگذاری کاتالوگ محصولات از پایگاه‌داده...
          </p>
        </Card>
      ) : filtered.length === 0 ? (
        /* وضعیت خالی بودن لیست */
        <Card className="p-12 text-center flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
            <Package className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-800 dark:text-slate-200">
              هیچ محصولی در کاتالوگ یافت نشد
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {search || categoryFilter !== 'all'
                ? 'با فیلترهای جستجوی انتخابی موردی پیدا نشد.'
                : 'کاتالوگ محصولات شرکت هنوز ثبت نشده است. می‌توانید نخستین کالای فولادی را ایجاد نمایید.'}
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="gap-2 bg-amber-600 hover:bg-amber-700"
          >
            <Plus className="w-4 h-4" />
            <span>تعریف محصول جدید</span>
          </Button>
        </Card>
      ) : viewMode === 'kanban' ? (
        /* ۱. نمای کارت‌های Odoo 17 (Product Kanban View) */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((product) => (
            <Card
              key={product.id}
              onClick={() => setSelectedProduct(product)}
              className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-700 transition-all cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
                    <Package className="w-5 h-5" />
                  </div>
                  <Badge variant="neutral" className="text-xs font-mono">
                    {product.code}
                  </Badge>
                </div>

                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 transition-colors line-clamp-2">
                  {product.name}
                </h3>

                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                  <span>{product.mill}</span>
                  <span>•</span>
                  <span>استاندارد {product.standard}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">قیمت فروش:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {product.pricePerKgToman.toLocaleString('fa-IR')} ت
                  </span>
                </div>
                <div className="text-left">
                  <span className="text-slate-400 block text-[10px]">موجودی در دست:</span>
                  <span
                    className={`font-mono font-bold ${
                      product.stockKg > 0 ? 'text-emerald-600' : 'text-rose-500'
                    }`}
                  >
                    {(product.stockKg / 1000).toLocaleString('fa-IR')} تن
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* ۲. نمای لیست Odoo 17 (Product List View) */
        <Card className="p-0 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">رفرنس داخلی</th>
                <th className="py-3 px-4">نام کالا</th>
                <th className="py-3 px-4">کارخانه / منشأ</th>
                <th className="py-3 px-4">قیمت فروش (تومان)</th>
                <th className="py-3 px-4">بهای تمام‌شده (تومان)</th>
                <th className="py-3 px-4">موجودی در دست</th>
                <th className="py-3 px-4">پیش‌بینی موجودی</th>
                <th className="py-3 px-4">واحد سنجش</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((product) => (
                <tr
                  key={product.id}
                  onClick={() => setSelectedProduct(product)}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                    {product.code}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                    {product.name}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{product.mill}</td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                    {product.pricePerKgToman.toLocaleString('fa-IR')}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">
                    {product.costPriceToman.toLocaleString('fa-IR')}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-600">
                    {(product.stockKg / 1000).toLocaleString('fa-IR')} تن
                  </td>
                  <td className="py-3 px-4 font-mono text-blue-600">
                    {(product.forecastedKg / 1000).toLocaleString('fa-IR')} تن
                  </td>
                  <td className="py-3 px-4 text-slate-500">{product.defaultUnit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* مدال ثبت محصول فولادی جدید */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <Card className="w-full max-w-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-6 shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  تعریف محصول فولادی جدید در کاتالوگ
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

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    نام کالا و شرح تجاری *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: میلگرد ۱۶ آجدار A3 اصفهان"
                    value={newForm.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setNewForm((prev) => ({
                        ...prev,
                        name,
                        code: prev.code || `STEEL-${Date.now().toString().slice(-4)}`,
                      }));
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    کد محصول / رفرنس داخلی (SKU) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: REBAR-16-A3-ISF"
                    value={newForm.code}
                    onChange={(e) => setNewForm({ ...newForm, code: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    دسته‌بندی مقطع *
                  </label>
                  <select
                    value={newForm.category}
                    onChange={(e) =>
                      setNewForm({
                        ...newForm,
                        category: e.target.value as ProductCategoryType,
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="REBAR">میلگرد (Rebar)</option>
                    <option value="BEAM">تیرآهن (Beam)</option>
                    <option value="SHEET">ورق فولادی (Sheet)</option>
                    <option value="PROFILE">قوطی و پروفیل (Profile)</option>
                    <option value="PIPE">لوله (Pipe)</option>
                    <option value="WIRE">مفتول و کلاف (Wire)</option>
                    <option value="OTHER">سایر مقاطع</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    کارخانه سازنده
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: ذوب آهن اصفهان"
                    value={newForm.mill}
                    onChange={(e) => setNewForm({ ...newForm, mill: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    استاندارد نورد
                  </label>
                  <input
                    type="text"
                    placeholder="A3 / St37 / IPE"
                    value={newForm.standard}
                    onChange={(e) => setNewForm({ ...newForm, standard: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    سایز / ضخامت
                  </label>
                  <input
                    type="text"
                    placeholder="14 / 16 / 2mm"
                    value={newForm.size}
                    onChange={(e) => setNewForm({ ...newForm, size: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    واحد سنجش مبنا
                  </label>
                  <select
                    value={newForm.defaultUnit}
                    onChange={(e) => setNewForm({ ...newForm, defaultUnit: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="کیلوگرم">کیلوگرم</option>
                    <option value="شاخه">شاخه</option>
                    <option value="بندل">بندل</option>
                    <option value="تن">تن</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    موجودی اولیه انبار (کیلوگرم)
                  </label>
                  <input
                    type="number"
                    value={newForm.stockKg}
                    onChange={(e) =>
                      setNewForm({ ...newForm, stockKg: Number(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    قیمت فروش روز (تومان به ازای کیلوگرم)
                  </label>
                  <input
                    type="number"
                    value={newForm.pricePerKgToman}
                    onChange={(e) =>
                      setNewForm({
                        ...newForm,
                        pricePerKgToman: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    بهای تمام‌شده / نرخ خرید (تومان)
                  </label>
                  <input
                    type="number"
                    value={newForm.costPriceToman}
                    onChange={(e) =>
                      setNewForm({
                        ...newForm,
                        costPriceToman: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  توضیحات پیش‌فاکتور (چاپ در سند)
                </label>
                <textarea
                  rows={2}
                  value={newForm.descriptionSale}
                  onChange={(e) => setNewForm({ ...newForm, descriptionSale: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                  انصراف
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSaving}
                  className="bg-amber-600 hover:bg-amber-700 gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>ثبت و ذخیره در کاتالوگ</span>
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
