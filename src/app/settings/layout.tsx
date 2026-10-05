'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot, Truck, Wallet } from 'lucide-react';

const SETTINGS_TABS = [
  {
    label: 'Inteligência Artificial',
    href: '/settings/ia',
    icon: Bot,
    description: 'Modos de atuação e regras de atendimento',
  },
  {
    label: 'Logística & Frete',
    href: '/settings/logistica',
    icon: Truck,
    description: 'Motoboy, Uber Flash e faixas de CEP',
  },
  {
    label: 'Pagamentos & Chave PIX',
    href: '/settings/pagamentos',
    icon: Wallet,
    description: 'Cadastre sua chave PIX para recebimento direto',
  },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="w-full space-y-6">
      {/* Abas Superiores de Configurações */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-1.5 shadow-xs flex flex-wrap sm:flex-nowrap gap-1.5">
        {SETTINGS_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 min-w-[200px] flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isActive
                    ? 'bg-white/15 text-emerald-300'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="truncate">
                <span className="text-xs sm:text-sm block font-medium truncate">
                  {tab.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Conteúdo da Aba */}
      <div>{children}</div>
    </div>
  );
}
