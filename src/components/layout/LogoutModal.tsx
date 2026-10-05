'use client';

import React, { useState, useEffect } from 'react';
import { LogOut } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export interface LogoutAccountInfo {
  name: string;
  username: string;
  profilePictureUrl?: string;
}

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  account?: LogoutAccountInfo | null;
}

export default function LogoutModal({ isOpen, onClose, onConfirm, account: propAccount }: LogoutModalProps) {
  const [internalAccount, setInternalAccount] = useState<LogoutAccountInfo | null>(null);

  useEffect(() => {
    if (propAccount) {
      setInternalAccount(propAccount);
      return;
    }

    if (isOpen) {
      Promise.all([
        fetch('/api/auth/instagram/status').catch(() => null),
        fetch('/api/catalog').catch(() => null),
      ]).then(async ([authRes, catalogRes]) => {
        let authData: any = null;
        let catalogData: any = null;

        if (authRes && authRes.ok) authData = await authRes.json();
        if (catalogRes && catalogRes.ok) catalogData = await catalogRes.json();

        if (authData?.connected && authData?.account) {
          setInternalAccount({
            name: authData.account.name || catalogData?.catalog?.storeName || 'Quota',
            username: authData.account.username || catalogData?.catalog?.instagramHandle || 'eco_quota',
            profilePictureUrl: authData.account.profilePictureUrl || catalogData?.catalog?.logoUrl,
          });
        } else if (catalogData?.catalog) {
          setInternalAccount({
            name: catalogData.catalog.storeName || 'Loja',
            username: catalogData.catalog.instagramHandle?.replace('@', '') || 'loja',
            profilePictureUrl: catalogData.catalog.logoUrl,
          });
        }
      });
    }
  }, [isOpen, propAccount]);

  const activeAccount = propAccount || internalAccount;
  const storeName = activeAccount?.name || 'sua loja';
  const username = activeAccount?.username ? `@${activeAccount.username.replace('@', '')}` : '';
  const initials = activeAccount?.name
    ? activeAccount.name.slice(0, 2).toUpperCase()
    : 'LJ';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Encerrar Sessão"
      description={`Tem certeza de que deseja desconectar da conta ${storeName}${username ? ` (${username})` : ''}?`}
      maxWidth="sm"
    >
      <div className="space-y-4 my-2">
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
          <div className="relative shrink-0">
            {activeAccount?.profilePictureUrl ? (
              <img
                src={activeAccount.profilePictureUrl}
                alt={storeName}
                className="w-11 h-11 rounded-full object-cover border border-slate-200 bg-white"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center uppercase shadow-2xs">
                {initials}
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="font-semibold text-slate-900 text-sm truncate">
              {storeName}
            </div>
            {username && (
              <div className="text-xs text-slate-500 font-mono truncate">
                {username}
              </div>
            )}
          </div>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Suas regras de automação, dados da vitrine e histórico de atendimentos continuarão salvos com segurança no servidor.
        </p>
      </div>

      <div className="mt-6 flex items-center justify-end gap-2.5">
        <Button variant="secondary" size="md" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          size="md"
          className="bg-rose-600 hover:bg-rose-700 text-white border-rose-600 shadow-md shadow-rose-600/20"
          leftIcon={<LogOut className="w-4 h-4" />}
          onClick={onConfirm}
        >
          Confirmar e Sair
        </Button>
      </div>
    </Modal>
  );
}
