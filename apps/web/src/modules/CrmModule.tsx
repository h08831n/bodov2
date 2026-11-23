import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Star,
  CheckCircle,
  XCircle,
  FileText,
  Building2,
  DollarSign,
  Scale,
  Award,
  X,
} from 'lucide-react';
import { Button, Card } from '@bodo/ui';
import { api } from '../api/client';
import type { CrmLead, CrmStage, Contact } from '@bodo/contracts';

const STAGES: Array<{ key: CrmStage; label: string; color: string }> = [
  { key: 'NEW', label: 'فرصت جدید', color: 'border-blue-400 dark:border-blue-500' },
  { key: 'CONTACTED', label: 'تماس اولیه', color: 'border-indigo-400 dark:border-indigo-500' },
  {
    key: 'NEEDS_ANALYSIS',
    label: 'تحلیل نیاز و تناژ',
    color: 'border-purple-400 dark:border-purple-500',
  },
  { key: 'QUOTED', label: 'پیش‌فاکتور صادرشده', color: 'border-amber-400 dark:border-amber-500' },
  {
    key: 'NEGOTIATION',
    label: 'مذاکره قیمت و تسویه',
    color: 'border-orange-400 dark:border-orange-500',
  },
  {
    key: 'WON',
    label: 'برنده (تبدیل به سفارش)',
    color: 'border-emerald-400 dark:border-emerald-500',
  },
  { key: 'LOST', label: 'باخت در مذاکره', color: 'border-rose-400 dark:border-rose-500' },
];

export function CrmModule() {
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [metrics, setMetrics] = useState<{
    totalRevenueToman: number;
    totalWeightKg: number;
    totalLeads: number;
    countsByStage: Record<string, number>;
    winRatePercent: number;
  } | null>(null);

  // New Lead Modal
  const [isNewLeadOpen, setIsNewLeadOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newContactId, setNewContactId] = useState<string>('');
  const [newContactName, setNewContactName] = useState<string>('');
  const [newContactPhone, setNewContactPhone] = useState<string>('');
  const [newRevenue, setNewRevenue] = useState<number>(0);
  const [newWeight, setNewWeight] = useState<number>(1000);
  const [newPriority, setNewPriority] = useState<number>(1);
  const [newProbability, setNewProbability] = useState<number>(20);
  const [newNotes, setNewNotes] = useState<string>('');

  // Selected Lead Drawer
  const [selectedLead, setSelectedLead] = useState<CrmLead | null>(null);

  // Lost Dialog
  const [isLostDialogOpen, setIsLostDialogOpen] = useState<boolean>(false);
  const [lostLeadId, setLostLeadId] = useState<string>('');
  const [lostReasonNotes, setLostReasonNotes] = useState<string>('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fetchedLeads, fetchedContacts, fetchedMetrics] = await Promise.all([
        api.crm.list({ search: searchQuery.trim() || undefined }),
        api.contacts.list({ type: 'CUSTOMER' }),
        api.crm.getPipelineMetrics(),
      ]);
      setLeads(fetchedLeads);
      setContacts(fetchedContacts);
      setMetrics(fetchedMetrics);
    } catch (err) {
      console.error('Error loading CRM data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery]);

  const handleCreateLead = async () => {
    if (!newTitle.trim() || !newContactName.trim()) {
      alert('عنوان فرصت و نام مشتری الزامی است');
      return;
    }

    try {
      await api.crm.create({
        title: newTitle,
        contactId: newContactId || undefined,
        contactName: newContactName,
        contactPhone: newContactPhone || undefined,
        expectedRevenueToman: newRevenue,
        expectedWeightKg: newWeight,
        priority: newPriority,
        probability: newProbability,
        notes: newNotes || undefined,
      });

      setIsNewLeadOpen(false);
      resetNewLeadForm();
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطا در ثبت فرصت';
      alert(msg);
    }
  };

  const resetNewLeadForm = () => {
    setNewTitle('');
    setNewContactId('');
    setNewContactName('');
    setNewContactPhone('');
    setNewRevenue(0);
    setNewWeight(1000);
    setNewPriority(1);
    setNewProbability(20);
    setNewNotes('');
  };

  const handleStageTransition = async (leadId: string, stage: CrmStage) => {
    if (stage === 'LOST') {
      setLostLeadId(leadId);
      setIsLostDialogOpen(true);
      return;
    }

    try {
      await api.crm.transitionStage(leadId, { stage });
      loadData();
      if (selectedLead && selectedLead.id === leadId) {
        const updated = await api.crm.get(leadId);
        setSelectedLead(updated);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطا در جابجایی مرحله';
      alert(msg);
    }
  };

  const handleConfirmLost = async () => {
    if (!lostReasonNotes.trim()) {
      alert('لطفاً دلیل باخت را توضیح دهید');
      return;
    }

    try {
      await api.crm.transitionStage(lostLeadId, {
        stage: 'LOST',
        lostNotes: lostReasonNotes,
      });
      setIsLostDialogOpen(false);
      setLostLeadId('');
      setLostReasonNotes('');
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطا در ثبت باخت';
      alert(msg);
    }
  };

  const handleConvertToQuotation = async (leadId: string) => {
    try {
      const res = await api.crm.convertToQuotation(leadId);
      alert(
        `پیش‌فاکتور با شماره ${res.quotation.quotationNo} با موفقیت صادر شد و به فرصت متصل گردید.`,
      );
      loadData();
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead(res.lead);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطا در صدور پیش‌فاکتور';
      alert(msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* هدر ماژول سبک Odoo CRM */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              قیف فرصت‌های فروش (CRM Pipeline)
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            مدیریت سرنخ‌ها، فرصت‌های تجاری آهن‌آلات، پیگیری مشتریان و تبدیل آنی به پیش‌فاکتور
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            onClick={() => {
              resetNewLeadForm();
              setIsNewLeadOpen(true);
            }}
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>فرصت فروش جدید</span>
          </Button>
        </div>
      </div>

      {/* بنر کارت‌های آماری KPI قیف فروش */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-3 bg-white dark:bg-slate-900 border-blue-200 dark:border-blue-900/50 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">ارزش کل قیف:</span>
              <DollarSign className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-base font-bold font-mono text-blue-600 dark:text-blue-400 mt-1">
              {metrics.totalRevenueToman.toLocaleString('fa-IR')}{' '}
              <span className="text-xs font-normal">تومان</span>
            </div>
          </Card>

          <Card className="p-3 bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-900/50 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">تناژ در جریان:</span>
              <Scale className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-base font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1">
              {metrics.totalWeightKg.toLocaleString('fa-IR')}{' '}
              <span className="text-xs font-normal">کیلوگرم</span>
            </div>
          </Card>

          <Card className="p-3 bg-white dark:bg-slate-900 border-purple-200 dark:border-purple-900/50 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">کل فرصت‌ها:</span>
              <Users className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-base font-bold font-mono text-purple-600 dark:text-purple-400 mt-1">
              {metrics.totalLeads.toLocaleString('fa-IR')}{' '}
              <span className="text-xs font-normal">پرونده</span>
            </div>
          </Card>

          <Card className="p-3 bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-900/50 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                نرخ موفقیت (Win Rate):
              </span>
              <Award className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              %{metrics.winRatePercent.toLocaleString('fa-IR')}
            </div>
          </Card>
        </div>
      )}

      {/* نوار جستجوی سریع */}
      <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="جستجوی عنوان فرصت، مشتری، شماره تماس..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-9 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* ستون‌های کانبان Odoo 17 (Pipeline Kanban) */}
      {isLoading ? (
        <div className="text-center py-12 text-xs text-slate-400">در حال دریافت اطلاعات قیف...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-3 overflow-x-auto pb-4">
          {STAGES.map((st) => {
            const stageLeads = leads.filter((l) => l.stage === st.key);
            const stageRevenue = stageLeads.reduce(
              (sum, l) => sum + Number(l.expectedRevenueToman || 0),
              0,
            );

            return (
              <div
                key={st.key}
                className="bg-slate-100/70 dark:bg-slate-800/40 rounded-xl p-2.5 border border-slate-200/80 dark:border-slate-800 flex flex-col min-w-[210px]"
              >
                {/* هدر ستون کانبان */}
                <div className={`border-t-2 ${st.color} pt-2 pb-2 mb-2`}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                      {st.label}
                    </h3>
                    <span className="font-mono text-xs bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded-full font-semibold">
                      {stageLeads.length}
                    </span>
                  </div>
                  {stageRevenue > 0 && (
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                      {stageRevenue.toLocaleString('fa-IR')} ت
                    </div>
                  )}
                </div>

                {/* کارت‌های فرصت درون ستون */}
                <div className="space-y-2 flex-1 overflow-y-auto max-h-[650px] pr-0.5">
                  {stageLeads.length === 0 ? (
                    <div className="text-center py-6 text-[11px] text-slate-400 border border-dashed border-slate-200 dark:border-slate-700/60 rounded-lg">
                      موردی نیست
                    </div>
                  ) : (
                    stageLeads.map((lead) => (
                      <Card
                        key={lead.id}
                        onClick={() => setSelectedLead(lead)}
                        className="p-3 bg-white dark:bg-slate-900 hover:shadow-md transition-all cursor-pointer border border-slate-200 dark:border-slate-700/80 space-y-2 group"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                            {lead.title}
                          </h4>
                          {/* ستاره‌های اولویت */}
                          <div className="flex text-amber-400 shrink-0">
                            {Array.from({ length: lead.priority }).map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-amber-400" />
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span className="truncate">{lead.contactName}</span>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                            {Number(lead.expectedRevenueToman).toLocaleString('fa-IR')} ت
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {Number(lead.expectedWeightKg).toLocaleString('fa-IR')} کیلو
                          </span>
                        </div>

                        {/* اگر پیش‌فاکتور صادر شده باشد نشان داده شود */}
                        {lead.saleOrder && (
                          <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-1 rounded">
                            <FileText className="w-3 h-3" />
                            <span className="font-mono">
                              {lead.saleOrder.quotationNo || lead.saleOrder.orderNo}
                            </span>
                          </div>
                        )}

                        {/* دکمه‌های اقدام سریع در هاور کارت */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-50 dark:border-slate-800/80">
                          {lead.stage !== 'WON' && lead.stage !== 'LOST' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleConvertToQuotation(lead.id);
                              }}
                              className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer font-medium"
                            >
                              <FileText className="w-3 h-3" />
                              <span>پیش‌فاکتور</span>
                            </button>
                          )}

                          <div className="flex items-center gap-1 mr-auto">
                            {lead.stage !== 'WON' && lead.stage !== 'LOST' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStageTransition(lead.id, 'WON');
                                }}
                                className="text-emerald-600 hover:text-emerald-700 p-0.5"
                                title="برد فرصت"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {lead.stage !== 'LOST' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStageTransition(lead.id, 'LOST');
                                }}
                                className="text-rose-500 hover:text-rose-700 p-0.5"
                                title="باخت فرصت"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* مدال ثبت فرصت جدید */}
      {isNewLeadOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                ایجاد فرصت فروش جدید در CRM
              </h3>
              <button
                onClick={() => setIsNewLeadOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">عنوان فرصت / پروژه آهن‌آلات:</label>
                <input
                  type="text"
                  placeholder="مثال: تأمین تیرآهن و میلگرد برج مهستان"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">انتخاب طرف‌حساب / مشتری:</label>
                  <select
                    value={newContactId}
                    onChange={(e) => {
                      setNewContactId(e.target.value);
                      const c = contacts.find((item) => item.id === e.target.value);
                      if (c) {
                        setNewContactName(c.name);
                        setNewContactPhone(c.mobile || c.phone || '');
                      }
                    }}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="">-- مشتری موجود --</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.companyName ? `(${c.companyName})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">نام مشتری (دستی):</label>
                  <input
                    type="text"
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                    placeholder="نام مشتری"
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">شماره تماس مشتری:</label>
                  <input
                    type="text"
                    value={newContactPhone}
                    onChange={(e) => setNewContactPhone(e.target.value)}
                    placeholder="0912..."
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">تناژ تخمینی (کیلوگرم):</label>
                  <input
                    type="number"
                    value={newWeight}
                    onChange={(e) => setNewWeight(Number(e.target.value))}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">ارزش تخمینی (تومان):</label>
                  <input
                    type="number"
                    value={newRevenue}
                    onChange={(e) => setNewRevenue(Number(e.target.value))}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">اولویت (۱ تا ۳ ستاره):</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(Number(e.target.value))}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value={1}>★ عادی (۱)</option>
                    <option value={2}>★★ بالا (۲)</option>
                    <option value={3}>★★★ فوری / استراتژیک (۳)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">یادداشت مذاکره:</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="نکات مهم کارفرما، برند مدنظر..."
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="ghost" size="sm" onClick={() => setIsNewLeadOpen(false)}>
                انصراف
              </Button>
              <Button variant="primary" size="sm" onClick={handleCreateLead}>
                ثبت فرصت
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* مدال ثبت باخت فرصت (Lost Reason) */}
      {isLostDialogOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <XCircle className="w-5 h-5" />
              <h3 className="font-bold text-sm">ثبت باخت فرصت فروش</h3>
            </div>
            <p className="text-xs text-slate-500">
              طبق قوانین CRM، ثبت دلیل باخت جهت بهبود نرخ تبدیل فروش الزامی است.
            </p>

            <div>
              <label className="block text-xs font-semibold mb-1">دلیل باخت و توضیحات:</label>
              <textarea
                rows={3}
                value={lostReasonNotes}
                onChange={(e) => setLostReasonNotes(e.target.value)}
                placeholder="مثلاً خرید از رقیب با نرخ پایین‌تر، انصراف کارفرما از پروژه..."
                className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setIsLostDialogOpen(false)}>
                انصراف
              </Button>
              <Button variant="danger" size="sm" onClick={handleConfirmLost}>
                تأیید باخت فرصت
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
