'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Menu, ChevronLeft } from 'lucide-react';

interface DashboardHeaderProps {
  onOpenMobile: () => void;
  onOpenLogout?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function DashboardHeader({
  onOpenMobile,
  isCollapsed,
  onToggleCollapse,
}: DashboardHeaderProps) {
  const pathname = usePathname();

  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Radar de Demanda';
    if (pathname.startsWith('/settings/ia')) return 'Configuração da IA';
    if (pathname.startsWith('/settings/logistica')) return 'Regras de Logística & Frete';
    if (pathname.startsWith('/settings/pagamentos')) return 'Pagamentos & Chave PIX';
    if (pathname.startsWith('/planos')) return 'Planos & Assinatura';
    if (pathname.startsWith('/catalogo')) return 'Catálogo de Produtos';
    return 'Painel de Controle';
  };

  return (
    <header className="sticky top-0 z-30 w-full h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between gap-4 transition-all">
      {/* Left: Mobile Menu + Desktop Collapse Toggle + Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobile}
          className="md:hidden w-8 h-8 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors"
          title="Abrir menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Botão de Recolher/Expandir Menu no Painel de Controle */}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
            className="hidden md:flex w-8 h-8 rounded-lg border border-slate-200/90 hover:border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-50 items-center justify-center transition-all shadow-2xs group"
          >
            <ChevronLeft
              className={`w-4 h-4 transition-transform duration-300 text-slate-500 group-hover:text-slate-900 ${
                isCollapsed ? 'rotate-180' : ''
              }`}
            />
          </button>
        )}

        <div>
          <h2 className="font-heading font-bold text-sm sm:text-base text-slate-900 tracking-tight">
            {getPageTitle()}
          </h2>
        </div>
      </div>

      {/* Right: Limpo (sem logo e sem botão sair no topo conforme solicitado) */}
      <div className="flex items-center gap-2" />
    </header>
  );
}
