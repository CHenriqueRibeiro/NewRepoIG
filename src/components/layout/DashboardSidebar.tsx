'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Bot,
  Truck,
  CreditCard,
  Layers,
  ShoppingBag,
  ExternalLink,
  ChevronLeft,
  LogOut,
  X,
  Wallet,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Radar de Demanda', href: '/dashboard', icon: BarChart3 },
  { label: 'Catálogo', href: '/catalogo', icon: ShoppingBag },
  { label: 'Inteligência Artificial', href: '/settings/ia', icon: Bot },
  { label: 'Logística & Frete', href: '/settings/logistica', icon: Truck },
  { label: 'Pagamentos & PIX', href: '/settings/pagamentos', icon: Wallet },
  { label: 'Planos & Assinatura', href: '/planos', icon: Layers },
];

export interface SidebarAccountInfo {
  name: string;
  username: string;
  profilePictureUrl?: string;
  isSandbox?: boolean;
}

interface DashboardSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenLogout: () => void;
  account?: SidebarAccountInfo | null;
}

export default function DashboardSidebar({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  onOpenLogout,
  account: propAccount,
}: DashboardSidebarProps) {
  const pathname = usePathname();

  const [account, setAccount] = useState<SidebarAccountInfo | null>(propAccount || null);

  useEffect(() => {
    if (propAccount) {
      setAccount(propAccount);
      return;
    }

    Promise.all([
      fetch('/api/auth/instagram/status').catch(() => null),
      fetch('/api/catalog').catch(() => null),
    ]).then(async ([authRes, catalogRes]) => {
      let authData: any = null;
      let catalogData: any = null;

      if (authRes && authRes.ok) authData = await authRes.json();
      if (catalogRes && catalogRes.ok) catalogData = await catalogRes.json();

      if (authData?.connected && authData?.account) {
        setAccount({
          name: authData.account.name || catalogData?.catalog?.storeName || 'Quota',
          username: authData.account.username || catalogData?.catalog?.instagramHandle || 'eco_quota',
          profilePictureUrl: authData.account.profilePictureUrl || catalogData?.catalog?.logoUrl || '',
          isSandbox: Boolean(authData.account.isSandbox),
        });
      } else if (catalogData?.catalog) {
        setAccount({
          name: catalogData.catalog.storeName || 'Loja',
          username: catalogData.catalog.instagramHandle?.replace('@', '') || 'loja',
          profilePictureUrl: catalogData.catalog.logoUrl || '',
          isSandbox: false,
        });
      }
    });
  }, [propAccount]);

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 bg-white border-r border-slate-200/90 flex flex-col justify-between transition-all duration-300 ease-in-out ${
          isCollapsed ? 'md:w-20' : 'md:w-64'
        } ${
          isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top: Logo */}
        <div>
          <div className={`h-16 px-4 flex items-center border-b border-slate-100 ${
            isCollapsed ? 'justify-center' : 'justify-between'
          }`}>
            <Link
              href="/dashboard"
              className={`flex items-center transition-all ${
                isCollapsed ? 'justify-center' : 'gap-2'
              }`}
              title="Vitryne."
            >
              {isCollapsed ? (
                <span className="font-heading font-extrabold text-2xl tracking-tight text-slate-900 select-none">
                  V<span className="text-slate-900">.</span>
                </span>
              ) : (
                <img
                  src="/images/vitryne-logo-cropped.png"
                  alt="Vitryne."
                  className="h-8 w-auto max-w-[160px] object-contain"
                />
              )}
            </Link>

            {/* Mobile Close Button */}
            {!isCollapsed && (
              <button
                type="button"
                onClick={onCloseMobile}
                className="md:hidden w-7 h-7 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobile}
                  title={isCollapsed ? item.label : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  } ${isCollapsed ? 'md:justify-center md:px-0' : ''}`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  {(!isCollapsed || isMobileOpen) && (
                    <span className="truncate">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom: User Info & Logout */}
        <div className="p-3 border-t border-slate-100 space-y-2">
          {/* User Card */}
          <div
            className={`p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3 transition-all ${
              isCollapsed ? 'md:justify-center md:p-1.5' : ''
            }`}
          >
            {/* Avatar / Logo Real da Loja */}
            <div className="relative shrink-0">
              {account?.profilePictureUrl ? (
                <img
                  src={account.profilePictureUrl}
                  alt={account.name || account.username || 'Logo da Loja'}
                  className="w-9 h-9 rounded-full object-cover border border-slate-200 bg-white"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-semibold text-xs flex items-center justify-center uppercase shadow-2xs">
                  {account?.name ? account.name.slice(0, 2) : 'LJ'}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>

            {/* User Meta (Hidden when collapsed) */}
            {(!isCollapsed || isMobileOpen) && (
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-xs text-slate-900 truncate">
                  {account?.name || 'Sua Loja'}
                </div>
                <div className="text-[11px] text-slate-500 font-mono truncate">
                  @{account?.username ? account.username.replace('@', '') : 'instagram'}
                </div>
              </div>
            )}
          </div>

          {/* Logout Button */}
          <button
            type="button"
            onClick={onOpenLogout}
            title={isCollapsed ? 'Sair da conta' : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-colors ${
              isCollapsed ? 'md:justify-center md:px-0' : ''
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {(!isCollapsed || isMobileOpen) && <span>Sair da conta</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
