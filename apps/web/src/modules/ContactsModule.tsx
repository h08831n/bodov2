import React, { useState, useEffect } from 'react';
import { Button, Badge, Card, SmartButton } from '@bodo/ui';
import { api } from '../api/client';
import type { Contact, ContactType, SaleOrder } from '@bodo/contracts';
import {
  Phone,
  Plus,
  LayoutGrid,
  List,
  CreditCard,
  FileText,
  Search,
  RefreshCw,
  Building2,
  Trash2,
  Edit,
  AlertCircle,
  X,
  UserCheck,
} from 'lucide-react';

export const ContactsModule: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [filterType, setFilterType] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contactOrders, setContactOrders] = useState<SaleOrder[]>([]);

  // مدال ایجاد / ویرایش مخاطب
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    type: 'CUSTOMER' as ContactType,
    nationalId: '',
    economicCode: '',
    phone: '',
    mobile: '',
    city: 'تهران',
    address: '',
    creditLimitToman: 0,
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await api.contacts.list({
        type: filterType === 'all' ? undefined : filterType.toUpperCase(),
        search: search.trim() || undefined,
      });
      setContacts(res || []);
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || 'خطا در بارگذاری لیست مخاطبین');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [filterType, search]);

  // وقتی یک مخاطب انتخاب شد، سفارش‌های آن بارگذاری شود
  useEffect(() => {
    if (selectedContact?.id) {
      api.sales
        .list({ customerId: selectedContact.id })
        .then((orders) => setContactOrders(orders || []))
        .catch(() => setContactOrders([]));
    } else {
      setContactOrders([]);
    }
  }, [selectedContact?.id]);

  const openCreateModal = () => {
    setEditingContactId(null);
    setFormData({
      name: '',
      companyName: '',
      type: 'CUSTOMER',
      nationalId: '',
      economicCode: '',
      phone: '',
      mobile: '',
      city: 'تهران',
      address: '',
      creditLimitToman: 0,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (c: Contact) => {
    setEditingContactId(c.id);
    setFormData({
      name: c.name,
      companyName: c.companyName || '',
      type: c.type,
      nationalId: c.nationalId || '',
      economicCode: c.economicCode || '',
      phone: c.phone || '',
      mobile: c.mobile || '',
      city: c.city || 'تهران',
      address: c.address || '',
      creditLimitToman: Number(c.creditLimitToman) || 0,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!formData.name.trim()) {
      setErrorMessage('نام مخاطب الزامی است.');
      return;
    }

    try {
      if (editingContactId) {
        const updated = await api.contacts.update(editingContactId, {
          name: formData.name.trim(),
          companyName: formData.companyName.trim() || undefined,
          type: formData.type,
          nationalId: formData.nationalId.trim() || undefined,
          economicCode: formData.economicCode.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          mobile: formData.mobile.trim() || undefined,
          city: formData.city.trim() || undefined,
          address: formData.address.trim() || undefined,
          creditLimitToman: Number(formData.creditLimitToman) || 0,
        });
        setContacts((prev) => prev.map((c) => (c.id === editingContactId ? updated : c)));
        if (selectedContact?.id === editingContactId) {
          setSelectedContact(updated);
        }
        setSuccessMessage('اطلاعات مخاطب با موفقیت به‌روزرسانی شد.');
      } else {
        const created = await api.contacts.create({
          name: formData.name.trim(),
          companyName: formData.companyName.trim() || undefined,
          type: formData.type,
          nationalId: formData.nationalId.trim() || undefined,
          economicCode: formData.economicCode.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          mobile: formData.mobile.trim() || undefined,
          city: formData.city.trim() || undefined,
          address: formData.address.trim() || undefined,
          creditLimitToman: Number(formData.creditLimitToman) || 0,
        });
        setContacts((prev) => [created, ...prev]);
        setSelectedContact(created);
        setSuccessMessage(`مخاطب ${created.name} با موفقیت ثبت شد.`);
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || 'خطا در ثبت اطلاعات مخاطب');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`آیا از حذف مخاطب «${name}» اطمینان دارید؟`)) return;
    try {
      await api.contacts.delete(id);
      setContacts((prev) => prev.filter((c) => c.id !== id));
      if (selectedContact?.id === id) {
        setSelectedContact(null);
      }
      setSuccessMessage(`مخاطب «${name}» با موفقیت حذف شد.`);
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || 'خطا در حذف مخاطب');
    }
  };

  return (
    <div className="space-y-4">
      {/* سربرگ ماژول مخاطبین */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-600" />
            <span>مخاطبین و شرکای تجاری</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            خریداران آهن‌آلات، کارخانجات و تامین‌کنندگان فولاد، شرکت‌های باربری و ترابری
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* فیلتر نوع مخاطب */}
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
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchContacts}
            disabled={loading}
            className="flex items-center gap-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>بروزرسانی</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={openCreateModal}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4" />
            <span>مخاطب جدید</span>
          </Button>
        </div>
      </div>

      {/* پیام‌های هشدار / موفقیت */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button type="button" onClick={() => setErrorMessage(null)} className="text-rose-500">
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
            className="text-emerald-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* نوار جستجو */}
      <Card className="p-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="جستجو بر اساس نام، شرکت، شماره تماس، کد ملی، شهر..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-9 pl-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </Card>

      {/* فرم جزییات مخاطب انتخابی (Odoo Contact 360 View) */}
      {selectedContact && (
        <Card className="p-6 space-y-6 animate-in fade-in duration-150 border-2 border-emerald-500/20">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-bold flex items-center justify-center text-xl shadow-md">
                {selectedContact.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>{selectedContact.name}</span>
                  <Badge
                    variant={
                      selectedContact.type === 'CUSTOMER'
                        ? 'primary'
                        : selectedContact.type === 'SUPPLIER'
                          ? 'success'
                          : 'warning'
                    }
                  >
                    {selectedContact.type === 'CUSTOMER'
                      ? 'خریدار'
                      : selectedContact.type === 'SUPPLIER'
                        ? 'تأمین‌کننده'
                        : selectedContact.type === 'TRANSPORTER'
                          ? 'باربری'
                          : 'شریک'}
                  </Badge>
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedContact.companyName || 'شخص حقیقی'}
                </p>
              </div>
            </div>

            {/* Smart Buttons Odoo */}
            <div className="flex items-center gap-2">
              <SmartButton
                count={`${contactOrders.length} سفارش`}
                label="سفارشات قطعی"
                icon={<FileText className="w-4 h-4 text-blue-500" />}
              />
              <SmartButton
                count={`${(Number(selectedContact.balanceToman) / 1000000).toLocaleString('fa-IR')} م`}
                label="مانده حساب"
                icon={<CreditCard className="w-4 h-4 text-emerald-500" />}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => openEditModal(selectedContact)}
                className="flex items-center gap-1 text-xs"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>ویرایش</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedContact(null)}>
                بستن فرم
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="space-y-1 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <span className="text-slate-400 font-semibold block">کد / شناسه ملی:</span>
              <p className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {selectedContact.nationalId || '—'}
              </p>
            </div>
            <div className="space-y-1 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <span className="text-slate-400 font-semibold block">کد اقتصادی:</span>
              <p className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {selectedContact.economicCode || '—'}
              </p>
            </div>
            <div className="space-y-1 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <span className="text-slate-400 font-semibold block">تلفن و همراه:</span>
              <p className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {selectedContact.mobile || selectedContact.phone || '—'}
              </p>
            </div>
            <div className="space-y-1 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <span className="text-slate-400 font-semibold block">سقف اعتبار تجاری:</span>
              <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {Number(selectedContact.creditLimitToman).toLocaleString('fa-IR')} تومان
              </p>
            </div>
          </div>

          {selectedContact.address && (
            <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                نشانی و محل تحویل:{' '}
              </span>
              {selectedContact.city ? `${selectedContact.city}، ` : ''}
              {selectedContact.address}
            </div>
          )}
        </Card>
      )}

      {/* نمایش کارتی یا جدولی */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-600" />
          <span>در حال بارگذاری مخاطبین از پایگاه داده...</span>
        </div>
      ) : contacts.length === 0 ? (
        <Card className="p-12 text-center text-slate-400">
          <UserCheck className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-1">هیچ مخاطبی یافت نشد</h3>
          <p className="text-xs text-slate-500 mb-4">
            برای شروع، اولین مشتری یا تامین‌کننده فولاد را ثبت کنید.
          </p>
          <Button
            size="sm"
            onClick={openCreateModal}
            className="bg-emerald-600 text-white hover:bg-emerald-700"
          >
            ثبت مخاطب جدید
          </Button>
        </Card>
      ) : viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {contacts.map((c) => (
            <Card
              key={c.id}
              onClick={() => setSelectedContact(c)}
              className="p-4 hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-between border-slate-200 dark:border-slate-800 relative group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-base">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {c.name}
                      </h4>
                      <p className="text-xs text-slate-500 truncate max-w-[130px]">
                        {c.companyName || 'حقیقی'}
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant={
                      c.type === 'CUSTOMER'
                        ? 'primary'
                        : c.type === 'SUPPLIER'
                          ? 'success'
                          : 'warning'
                    }
                  >
                    {c.type === 'CUSTOMER'
                      ? 'مشتری'
                      : c.type === 'SUPPLIER'
                        ? 'تامین‌کننده'
                        : c.type === 'TRANSPORTER'
                          ? 'باربری'
                          : 'شریک'}
                  </Badge>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono">{c.mobile || c.phone || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>شهر: {c.city || 'تهران'}</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {Number(c.balanceToman) !== 0
                        ? `${(Number(c.balanceToman) / 1000000).toLocaleString('fa-IR')} م تومان`
                        : 'تسویه'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-1 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditModal(c);
                  }}
                  className="p-1 rounded text-slate-400 hover:text-blue-600"
                  title="ویرایش"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(c.id, c.name);
                  }}
                  className="p-1 rounded text-slate-400 hover:text-rose-600"
                  title="حذف"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden border border-slate-200 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">نام طرف‌حساب</th>
                  <th className="p-3">شرکت / مجموعه</th>
                  <th className="p-3">نقش</th>
                  <th className="p-3">شماره تماس</th>
                  <th className="p-3">شناسه / کد ملی</th>
                  <th className="p-3">شهر</th>
                  <th className="p-3">مانده حساب (تومان)</th>
                  <th className="p-3 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {contacts.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedContact(c)}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 cursor-pointer"
                  >
                    <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{c.name}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">
                      {c.companyName || '—'}
                    </td>
                    <td className="p-3">
                      <Badge
                        variant={
                          c.type === 'CUSTOMER'
                            ? 'primary'
                            : c.type === 'SUPPLIER'
                              ? 'success'
                              : 'warning'
                        }
                      >
                        {c.type === 'CUSTOMER'
                          ? 'مشتری'
                          : c.type === 'SUPPLIER'
                            ? 'تامین‌کننده'
                            : c.type === 'TRANSPORTER'
                              ? 'باربری'
                              : 'شریک'}
                      </Badge>
                    </td>
                    <td className="p-3 font-mono">{c.mobile || c.phone || '—'}</td>
                    <td className="p-3 font-mono">{c.nationalId || '—'}</td>
                    <td className="p-3">{c.city || 'تهران'}</td>
                    <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {Number(c.balanceToman).toLocaleString('fa-IR')}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(c);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-blue-600"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(c.id, c.name);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* مدال ایجاد / ویرایش مخاطب */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <span>
                  {editingContactId ? 'ویرایش مشخصات مخاطب' : 'ثبت مخاطب و طرف‌حساب جدید'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    نام و نام خانوادگی / مسئول <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: رضا کریمی"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    نام شرکت / مجموعه
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: سازه گستر البرز"
                    value={formData.companyName}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, companyName: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    نقش اصلی در سیستم <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, type: e.target.value as ContactType }))
                    }
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CUSTOMER">خریدار / مشتری</option>
                    <option value="SUPPLIER">تامین‌کننده / کارخانه فولاد</option>
                    <option value="TRANSPORTER">شرکت باربری و حمل‌ونقل</option>
                    <option value="PARTNER">شریک تجاری / واسطه</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    شماره تلفن همراه (جهت پیامک و اطلاع‌رسانی)
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: 09121234567"
                    value={formData.mobile}
                    onChange={(e) => setFormData((prev) => ({ ...prev, mobile: e.target.value }))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    کد ملی / شناسه ملی
                  </label>
                  <input
                    type="text"
                    placeholder="۱۰ رقمی یا ۱۱ رقمی"
                    value={formData.nationalId}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, nationalId: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    کد اقتصادی (برای فاکتور رسمی ماده ۱۶۹)
                  </label>
                  <input
                    type="text"
                    placeholder="۱۲ رقمی مالیاتی"
                    value={formData.economicCode}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, economicCode: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    تلفن ثابت
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: 02154000000"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    شهر و استان
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: تهران، شادآباد"
                    value={formData.city}
                    onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  نشانی کامل و محل تحویل بار
                </label>
                <textarea
                  rows={2}
                  placeholder="آدرس دقیق دفتر یا انبار / پروژه ساختمانی خریدار"
                  value={formData.address}
                  onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  سقف اعتبار معاملاتی (تومان)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={formData.creditLimitToman || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      creditLimitToman: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  انصراف
                </Button>
                <Button type="submit" className="bg-emerald-600 text-white hover:bg-emerald-700">
                  {editingContactId ? 'ذخیره تغییرات' : 'ثبت مخاطب'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
