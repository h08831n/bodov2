import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { AppGridModal } from '../components/AppGridModal';
import { CommandPalette } from '../components/CommandPalette';
import { CrmModule } from '../modules/CrmModule';
import { PricingModule } from '../modules/PricingModule';
import { SalesModule } from '../modules/SalesModule';
import { PurchasesModule } from '../modules/PurchasesModule';
import { ContactsModule } from '../modules/ContactsModule';
import { ProductsModule } from '../modules/ProductsModule';
import { DatabaseManagerModule } from '../modules/DatabaseManagerModule';
import { SettingsModule } from '../modules/SettingsModule';
import { AuthModule } from '../modules/AuthModule';
import { PortalOrderView } from '../modules/PortalOrderView';
import { WeighbridgeModule } from '../modules/WeighbridgeModule';

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [currentDatabase, setCurrentDatabase] = useState<string>('erp_dev');
  const [currentUser, setCurrentUser] = useState<string>('حسین (مدیر ارشد)');
  const [activeModule, setActiveModule] = useState<string>('sales');
  const [isAppGridOpen, setIsAppGridOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);

  const [isDark, setIsDark] = useState<boolean>(() => {
    return (
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    );
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const moduleNames: Record<string, string> = {
    crm: 'قیف فروش (CRM)',
    pricing: 'تابلوی نرخ روز آهن‌آلات',
    sales: 'فروش و پیش‌فاکتورها',
    portal: 'پورتال خریدار (PAGE-PORT-01)',
    purchases: 'خرید و استعلام‌های بازار',
    weighbridge: 'قبوض باسکول و توزین آهن‌آلات',
    contacts: 'مخاطبین و شرکا',
    products: 'محصولات و آهن‌آلات',
    databases: 'مدیریت دیتابیس‌ها',
    settings: 'تنظیمات شرکت',
  };

  const handleLoginSuccess = (db: string, user: string) => {
    setCurrentDatabase(db);
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return <AuthModule onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-150">
      {/* نوار ناوبری اصلی سبک Odoo */}
      <Navbar
        activeModule={activeModule}
        activeModuleName={moduleNames[activeModule] || activeModule}
        onOpenAppGrid={() => setIsAppGridOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        currentDatabase={currentDatabase}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        currentUser={currentUser}
        onLogout={() => setIsAuthenticated(false)}
        onOpenDbManager={() => setActiveModule('databases')}
      />

      {/* ناحیه کاربری و محتوای ماژول فعال */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-150">
        {activeModule === 'crm' && <CrmModule />}
        {activeModule === 'pricing' && <PricingModule />}
        {activeModule === 'sales' && <SalesModule />}
        {activeModule === 'portal' && <PortalOrderView onBack={() => setActiveModule('sales')} />}
        {activeModule === 'purchases' && <PurchasesModule />}
        {activeModule === 'weighbridge' && <WeighbridgeModule />}
        {activeModule === 'contacts' && <ContactsModule />}
        {activeModule === 'products' && <ProductsModule />}
        {activeModule === 'databases' && (
          <DatabaseManagerModule
            currentDb={currentDatabase}
            onSwitchDb={(db) => setCurrentDatabase(db)}
          />
        )}
        {activeModule === 'settings' && <SettingsModule />}
      </main>

      {/* مدال شبکه برنامه‌های Odoo */}
      <AppGridModal
        isOpen={isAppGridOpen}
        onClose={() => setIsAppGridOpen(false)}
        activeModule={activeModule}
        onSelectModule={(mod) => setActiveModule(mod)}
      />

      {/* پالت جستجوی سریع کیبورد Ctrl+K */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={(mod) => setActiveModule(mod)}
      />
    </div>
  );
}

export default App;
