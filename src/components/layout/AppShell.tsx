'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import DashboardSidebar from './DashboardSidebar';
import DashboardHeader from './DashboardHeader';
import LogoutModal, { LogoutAccountInfo } from './LogoutModal';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Sidebar State
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [account, setAccount] = useState<LogoutAccountInfo | null>(null);

  useEffect(() => {
    async function loadAccount() {
      try {
        const [authRes, catalogRes] = await Promise.all([
          fetch('/api/auth/instagram/status').catch(() => null),
          fetch('/api/catalog').catch(() => null),
        ]);

        let authData: any = null;
        let catalogData: any = null;

        if (authRes && authRes.ok) authData = await authRes.json();
        if (catalogRes && catalogRes.ok) catalogData = await catalogRes.json();

        if (authData?.connected && authData?.account) {
          setAccount({
            name: authData.account.name || catalogData?.catalog?.storeName || 'Quota',
            username: authData.account.username || catalogData?.catalog?.instagramHandle || 'eco_quota',
            profilePictureUrl: authData.account.profilePictureUrl || catalogData?.catalog?.logoUrl || '',
          });
        } else if (catalogData?.catalog) {
          setAccount({
            name: catalogData.catalog.storeName || 'Loja',
            username: catalogData.catalog.instagramHandle?.replace('@', '') || 'loja',
            profilePictureUrl: catalogData.catalog.logoUrl || '',
          });
        }
      } catch (err) {
        console.error('Erro ao carregar dados da conta:', err);
      }
    }
    loadAccount();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/instagram/disconnect', { method: 'POST' });
    } catch {}
    try {
      localStorage.removeItem('vitryne_user_session');
      localStorage.removeItem('vitryne_auth_token');
    } catch {}
    setAccount(null);
    setIsLogoutOpen(false);
    setIsMobileOpen(false);
    router.push('/login');
    router.refresh();
  };

  // Rotas autenticadas do painel de controle (Lojista)
  const isDashboardRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/planos') ||
    pathname === '/catalogo';

  // 1. Standalone Checkout Route (Direct Webview for Customers)
  if (pathname.startsWith('/checkout')) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-6">
        {children}
      </main>
    );
  }

  // 2. Standalone Login Route
  if (pathname === '/login') {
    return <main className="min-h-screen">{children}</main>;
  }

  // 3. Standalone Public Storefront / Product Pages (Clean URLs: /[storeSlug], /[storeSlug]/[product], /c/[slug])
  if (!isDashboardRoute && pathname !== '/') {
    return <main className="min-h-screen w-full bg-white">{children}</main>;
  }

  // 3. Public Landing Page Route (A Landing Page controla seu próprio layout de ponta a ponta)
  if (pathname === '/') {
    return <main className="min-h-screen w-full bg-white">{children}</main>;
  }

  // 3. Authenticated Dashboard Area (/dashboard, /settings/*, /planos)
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex">
      {/* Collapsible Sidebar */}
      <DashboardSidebar
        account={account}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        onOpenLogout={() => setIsLogoutOpen(true)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'md:pl-20' : 'md:pl-64'
        }`}
      >
        {/* Top Header (Sem logo e sem botão de sair conforme solicitado) */}
        <DashboardHeader
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
          onOpenMobile={() => setIsMobileOpen(true)}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 md:p-8">{children}</main>
      </div>

      {/* Logout Confirmation Modal com Dados Reais */}
      <LogoutModal
        isOpen={isLogoutOpen}
        onClose={() => setIsLogoutOpen(false)}
        onConfirm={handleLogout}
        account={account}
      />
    </div>
  );
}
