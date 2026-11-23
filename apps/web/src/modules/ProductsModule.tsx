import React, { useState, useEffect } from 'react';
import { Button, Badge, Card } from '@bodo/ui';
import { INITIAL_PRODUCTS, type SteelProduct } from '../data/mockData';
import { api } from '../api/client';
import { Search, Plus, TrendingUp, Layers, Scale, Factory } from 'lucide-react';

export const ProductsModule: React.FC = () => {
  const [products, setProducts] = useState<SteelProduct[]>(INITIAL_PRODUCTS);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    let isMounted = true;
    api.products
      .list()
      .then((data) => {
        if (!isMounted || !data || data.length === 0) return;
        const mapped: SteelProduct[] = data.map((p) => ({
          id: p.id,
          code: p.code,
          name: p.name,
          category: (p.category?.toLowerCase() || 'rebar') as SteelProduct['category'],
          mill: p.mill,
          standard: p.standard,
          size: p.size,
          allowedUnits: p.allowedUnits || ['کیلوگرم', 'شاخه', 'بندل'],
          defaultUnit: p.defaultUnit || 'کیلوگرم',
          pricePerKgToman: Number(p.pricePerKgToman) || 0,
          stockKg: Number(p.stockKg) || 0,
        }));
        setProducts(mapped);
      })
      .catch(() => {
        // Fallback to initial mock data on network error
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = products.filter((p) => {
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    const matchesSearch =
      p.name.includes(search) ||
      p.mill.includes(search) ||
      p.code.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* سربرگ ماژول محصولات */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            محصولات و آهن‌آلات
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            کاتالوگ مقاطع طویل، ورق، میلگرد و تیرآهن با متغیرهای کارخانه و قیمت شناور روز
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={async () => {
              const code = `REBAR-20-${Date.now().toString().slice(-4)}`;
              const newP: SteelProduct = {
                id: `p-${Date.now()}`,
                code,
                name: 'میلگرد ۲۰ آجدار A3 اصفهان',
                category: 'rebar',
                mill: 'ذوب آهن اصفهان',
                standard: 'A3',
                size: '20 میلی‌متر',
                allowedUnits: ['کیلوگرم', 'شاخه', 'بندل'],
                defaultUnit: 'کیلوگرم',
                pricePerKgToman: 28500,
                stockKg: 10000,
              };
              setProducts([newP, ...products]);
              try {
                const created = await api.products.create({
                  code: newP.code,
                  name: newP.name,
                  category: 'REBAR',
                  mill: newP.mill,
                  standard: newP.standard,
                  size: newP.size,
                  defaultUnit: newP.defaultUnit,
                  allowedUnits: newP.allowedUnits,
                  pricePerKgToman: newP.pricePerKgToman,
                  stockKg: newP.stockKg,
                });
                if (created?.id) {
                  setProducts((prev) =>
                    prev.map((p) => (p.id === newP.id ? { ...p, id: created.id } : p)),
                  );
                }
              } catch {
                // Keep local item
              }
            }}
            className="gap-1.5 bg-amber-600 hover:bg-amber-700"
          >
            <Plus className="w-4 h-4" />
            <span>محصول جدید</span>
          </Button>
        </div>
      </div>

      {/* فیلترها و سرچ */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-xs">
        <div className="flex items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-xl cursor-pointer transition-colors ${
              categoryFilter === 'all'
                ? 'bg-amber-500 text-white font-bold shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            همه محصولات
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('rebar')}
            className={`px-3 py-1.5 rounded-xl cursor-pointer transition-colors ${
              categoryFilter === 'rebar'
                ? 'bg-amber-500 text-white font-bold shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            میلگرد
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('beam')}
            className={`px-3 py-1.5 rounded-xl cursor-pointer transition-colors ${
              categoryFilter === 'beam'
                ? 'bg-amber-500 text-white font-bold shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            تیرآهن
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('sheet')}
            className={`px-3 py-1.5 rounded-xl cursor-pointer transition-colors ${
              categoryFilter === 'sheet'
                ? 'bg-amber-500 text-white font-bold shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            ورق فولادی
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('profile')}
            className={`px-3 py-1.5 rounded-xl cursor-pointer transition-colors ${
              categoryFilter === 'profile'
                ? 'bg-amber-500 text-white font-bold shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            قوطی و پروفیل
          </button>
        </div>

        <div className="relative w-72">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجو بر اساس نام، کارخانه یا کد..."
            className="w-full pl-3 pr-9 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* شبکه کارت‌های محصولات آهن‌آلات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((product) => (
          <Card
            key={product.id}
            className="p-5 space-y-4 hover:border-amber-400 dark:hover:border-amber-600 hover:shadow-lg transition-all"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-[10px] text-slate-400 font-bold block mb-1">
                  {product.code}
                </span>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  {product.name}
                </h3>
              </div>
              <Badge variant="warning">
                {product.category === 'rebar'
                  ? 'میلگرد'
                  : product.category === 'beam'
                    ? 'تیرآهن'
                    : product.category === 'sheet'
                      ? 'ورق'
                      : 'پروفیل'}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Factory className="w-3 h-3" />
                  کارخانه:
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {product.mill}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Layers className="w-3 h-3" />
                  استاندارد:
                </span>
                <span className="font-semibold font-mono text-slate-800 dark:text-slate-200">
                  {product.standard}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Scale className="w-3 h-3" />
                  سایز / ضخامت:
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {product.size}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  موجودی انبار:
                </span>
                <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {(product.stockKg / 1000).toLocaleString('fa-IR')} تن
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-slate-400">واحدهای مجاز فروش:</span>
              <div className="flex flex-wrap gap-1">
                {product.allowedUnits.map((u) => (
                  <span
                    key={u}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium"
                  >
                    {u}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500">نرخ پایه روز:</span>
              <div className="text-right">
                <span className="font-mono font-bold text-base text-blue-600 dark:text-blue-400">
                  {product.pricePerKgToman.toLocaleString('fa-IR')}
                </span>
                <span className="text-[10px] text-slate-400 mr-1">تومان / کیلو</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
