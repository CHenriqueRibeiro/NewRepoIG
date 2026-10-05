'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Instagram,
  CheckCircle2,
  AlertCircle,
  Activity,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface InstagramAccount {
  id: string;
  username: string;
  name: string;
  profilePictureUrl?: string;
  accountType?: string;
  connectedAt: string;
  tokenExpiresAt: string;
  isSandbox?: boolean;
}

interface TestResult {
  success: boolean;
  latencyMs?: number;
  mode?: string;
  metaApiVersion?: string;
  permissionsVerified?: string[];
  cryptoStatus?: string;
  message?: string;
  error?: string;
}

export default function InstagramConnectionBanner() {
  const [account, setAccount] = useState<InstagramAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/instagram/status');
      const data = await res.json();
      if (data.connected && data.account) {
        setAccount(data.account);
      } else {
        setAccount(null);
      }
    } catch (err) {
      console.error('Erro ao consultar status do Instagram:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/auth/instagram/diagnostics', {
        method: 'POST',
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({
        success: false,
        error: err.message || 'Erro de comunicação ao testar conexão.',
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs animate-pulse flex items-center justify-between">
        <div className="h-5 w-48 bg-slate-200 rounded" />
        <div className="h-8 w-28 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Account info */}
        <div className="flex items-center gap-3.5">
          <div className="relative">
            {account?.profilePictureUrl ? (
              <img
                src={account.profilePictureUrl}
                alt={account.name}
                className="w-12 h-12 rounded-2xl object-cover shadow-xs border border-slate-200"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs uppercase">
                {account?.name ? account.name.slice(0, 2) : <Instagram className="w-6 h-6" />}
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading font-bold text-base text-slate-900">
                {account?.name || 'Loja Conectada'}
              </h2>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {account?.isSandbox ? 'Modo Sandbox' : 'Meta Graph API Ativa'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-0.5">
              <span>@{account?.username || 'vitryne.oficial'}</span>
              <span>•</span>
              <span className="text-[11px] text-slate-400">ID: {account?.id || 'ig_mock'}</span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="primary"
            size="sm"
            isLoading={testing}
            leftIcon={<Activity className="w-3.5 h-3.5" />}
            onClick={handleTestConnection}
          >
            {testing ? 'Testando Conexão...' : 'Testar Conexão em Tempo Real'}
          </Button>

          <Link href="/login">
            <Button variant="secondary" size="sm">
              Trocar Conta
            </Button>
          </Link>
        </div>
      </div>

      {/* Diagnostics / Test Results Box */}
      {testResult && (
        <div
          className={`p-4 rounded-2xl text-xs space-y-2.5 transition-all ${
            testResult.success
              ? 'bg-emerald-50/70 border border-emerald-200 text-emerald-950'
              : 'bg-rose-50/70 border border-rose-200 text-rose-950'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold">
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>
                {testResult.success
                  ? 'Conexão Meta Graph API Verificada com Sucesso!'
                  : 'Falha no Teste de Conexão'}
              </span>
            </div>

            {testResult.latencyMs !== undefined && (
              <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                Latência: {testResult.latencyMs}ms
              </span>
            )}
          </div>

          <p className="leading-relaxed text-slate-700">
            {testResult.message || testResult.error}
          </p>

          {testResult.permissionsVerified && (
            <div className="pt-1 flex flex-wrap items-center gap-1.5">
              <span className="font-semibold text-slate-700 text-[11px]">Permissões verificadas:</span>
              {testResult.permissionsVerified.map((perm) => (
                <span
                  key={perm}
                  className="px-2 py-0.5 rounded-md bg-white border border-emerald-200 font-mono text-[10px] text-emerald-800"
                >
                  ✓ {perm}
                </span>
              ))}
            </div>
          )}

          {testResult.cryptoStatus && (
            <div className="pt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Criptografia: {testResult.cryptoStatus}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
