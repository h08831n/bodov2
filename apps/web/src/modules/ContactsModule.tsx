import React, { useState } from 'react';
import { Button, Badge, Card, SmartButton } from '@bodo/ui';
import { INITIAL_CONTACTS, type Contact } from '../data/mockData';
import { Phone, MapPin, Plus, LayoutGrid, List, CreditCard, FileText } from 'lucide-react';

export const ContactsModule: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>(INITIAL_CONTACTS);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const filtered = contacts.filter((c) => (filterType === 'all' ? true : c.type === filterType));

  return (
    <div className="space-y-4">
      {/* سربرگ ماژول مخاطبین */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            مخاطبین و شرکای تجاری
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            خریداران آهن‌آلات، کارخانجات و تامین‌کنندگان فولاد، شرکت‌های باربری
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* فیلترها */}
          <div className="flex items-center gap-1 border border-slate-200 dark:border-slate-800 rounded-xl p-1 bg-slate-50 dark:bg-slate-950/50 text-xs">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-lg cursor-pointer transition-colors ${
                filterType === 'all'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 font-bold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              همه ({contacts.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('customer')}
              className={`px-2.5 py-1 rounded-lg cursor-pointer transition-colors ${
                filterType === 'customer'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 font-bold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              مشتریان
            </button>
            <button
              type="button"
              onClick={() => setFilterType('supplier')}
              className={`px-2.5 py-1 rounded-lg cursor-pointer transition-colors ${
                filterType === 'supplier'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 font-bold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              تامین‌کنندگان
            </button>
            <button
              type="button"
              onClick={() => setFilterType('transporter')}
              className={`px-2.5 py-1 rounded-lg cursor-pointer transition-colors ${
                filterType === 'transporter'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 font-bold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              باربری
            </button>
          </div>

          {/* تغییر نما */}
          <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-xl p-1 bg-slate-50 dark:bg-slate-950/50">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="نمای کارت‌ها"
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
              title="نمای لیست"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              const newC: Contact = {
                id: `c-${Date.now()}`,
                name: 'مخاطب جدید',
                type: 'customer',
                companyName: 'شرکت جدید',
                phone: '۰۹۱۲۰۰۰۰۰۰۰',
                city: 'تهران',
                balanceToman: 0,
                totalOrders: 0,
              };
              setContacts([newC, ...contacts]);
              setSelectedContact(newC);
            }}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4" />
            <span>مخاطب جدید</span>
          </Button>
        </div>
      </div>

      {/* مودال یا فرم جزییات مخاطب (Odoo Contact Form) */}
      {selectedContact && (
        <Card className="p-6 space-y-6 animate-in fade-in duration-150">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-bold flex items-center justify-center text-xl shadow-md">
                {selectedContact.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {selectedContact.name}
                </h3>
                <p className="text-xs text-slate-500">{selectedContact.companyName}</p>
              </div>
            </div>

            {/* Smart Buttons Odoo */}
            <div className="flex items-center gap-2">
              <SmartButton
                count={`${selectedContact.totalOrders} سند`}
                label="پیش‌فاکتورها"
                icon={<FileText className="w-4 h-4" />}
              />
              <SmartButton
                count={`${(selectedContact.balanceToman / 1000000).toLocaleString('fa-IR')} م`}
                label="مانده‌حساب بازرگانی"
                icon={<CreditCard className="w-4 h-4" />}
              />
              <Button variant="outline" size="sm" onClick={() => setSelectedContact(null)}>
                بستن فرم
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div className="space-y-1">
              <span className="text-slate-400 font-semibold">نقش در سیستم:</span>
              <div>
                <Badge
                  variant={
                    selectedContact.type === 'customer'
                      ? 'primary'
                      : selectedContact.type === 'supplier'
                        ? 'success'
                        : 'warning'
                  }
                >
                  {selectedContact.type === 'customer'
                    ? 'خریدار / مشتری'
                    : selectedContact.type === 'supplier'
                      ? 'تامین‌کننده / کارخانه'
                      : 'باربری و ترابری'}
                </Badge>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-slate-400 font-semibold">شماره تماس:</span>
              <p className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {selectedContact.phone}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-slate-400 font-semibold">شهر و آدرس تحویل:</span>
              <p className="font-medium text-slate-800 dark:text-slate-200">
                {selectedContact.city}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* نمایش کارتی یا جدولی */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((c) => (
            <div
              key={c.id}
              onClick={() => setSelectedContact(c)}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-lg transition-all cursor-pointer space-y-3 group"
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center text-base group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  {c.name.charAt(0)}
                </div>
                <Badge
                  variant={
                    c.type === 'customer'
                      ? 'primary'
                      : c.type === 'supplier'
                        ? 'success'
                        : 'warning'
                  }
                >
                  {c.type === 'customer'
                    ? 'مشتری'
                    : c.type === 'supplier'
                      ? 'تامین‌کننده'
                      : 'باربری'}
                </Badge>
              </div>

              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {c.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{c.companyName}</p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono">{c.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{c.city}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">سفارشات: {c.totalOrders}</span>
                <span
                  className={`font-mono font-bold ${
                    c.balanceToman > 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : c.balanceToman < 0
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-slate-500'
                  }`}
                >
                  {c.balanceToman === 0
                    ? 'تسویه'
                    : `${(Math.abs(c.balanceToman) / 1000000).toLocaleString('fa-IR')} م`}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5">نام و عنوان</th>
                <th className="p-3.5">نام شرکت / فروشگاه</th>
                <th className="p-3.5">نقش</th>
                <th className="p-3.5">تلفن تماس</th>
                <th className="p-3.5">شهر</th>
                <th className="p-3.5">تعداد سفارشات</th>
                <th className="p-3.5">مانده‌حساب بازرگانی</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setSelectedContact(c)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                >
                  <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">{c.name}</td>
                  <td className="p-3.5 text-slate-600 dark:text-slate-300">{c.companyName}</td>
                  <td className="p-3.5">
                    <Badge
                      variant={
                        c.type === 'customer'
                          ? 'primary'
                          : c.type === 'supplier'
                            ? 'success'
                            : 'warning'
                      }
                    >
                      {c.type === 'customer'
                        ? 'مشتری'
                        : c.type === 'supplier'
                          ? 'تامین‌کننده'
                          : 'باربری'}
                    </Badge>
                  </td>
                  <td className="p-3.5 font-mono">{c.phone}</td>
                  <td className="p-3.5 text-slate-500">{c.city}</td>
                  <td className="p-3.5 font-mono text-center">{c.totalOrders}</td>
                  <td className="p-3.5 font-mono font-bold">
                    {c.balanceToman === 0
                      ? 'تسویه'
                      : `${c.balanceToman.toLocaleString('fa-IR')} تومان`}
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
