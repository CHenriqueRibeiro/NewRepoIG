'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Instagram,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [oauthData, setOauthData] = useState<{ configured: boolean; url: string; appId: string | null } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const errorParam = searchParams.get('error');

  useEffect(() => {
    if (errorParam) {
      setErrorMessage(decodeURIComponent(errorParam));
    }

    // Carrega status da configuração OAuth da Meta
    fetch('/api/auth/instagram/url')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setOauthData({
            configured: data.configured,
            url: data.url,
            appId: data.appId,
          });
        }
      })
      .catch((err) => console.error('Erro ao verificar OAuth:', err));
  }, [errorParam]);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [storeNameInput, setStoreNameInput] = useState('');
  const [handleInput, setHandleInput] = useState('');
  const [authStep, setAuthStep] = useState<'form' | 'connecting' | 'done'>('form');

  // Conectar Modo Oficial Simulado ou Direto
  const handleAuthorizeInstagram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handleInput.trim()) {
      setErrorMessage('Por favor, informe o @ da sua loja no Instagram.');
      return;
    }

    setAuthStep('connecting');
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const cleanHandle = handleInput.trim().replace(/^@/, '');
      const storeName = storeNameInput.trim() || cleanHandle.split(/[._]/).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ') || 'Minha Loja';

      const res = await fetch('/api/auth/instagram/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'sandbox',
          customHandle: cleanHandle,
          customStoreName: storeName,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Erro ao conectar conta.');
        setAuthStep('form');
        setIsLoading(false);
        return;
      }

      setAuthStep('done');
      setSuccessMessage(`Loja @${cleanHandle} autorizada e conectada com sucesso!`);
      setTimeout(() => {
        router.push('/dashboard?connected=true');
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao processar autorização.');
      setAuthStep('form');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,rgba(99,102,241,0.18),rgba(248,250,252,0.9))] flex flex-col justify-between relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <header className="w-full h-20 border-b border-slate-200/80 bg-white/80 backdrop-blur-md px-6 sm:px-10 flex items-center justify-between sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <img
            src="/images/vitryne-logo-cropped.png"
            alt="Vitryne"
            className="h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-105"
          />
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-950 hover:bg-slate-100/80 transition-all border border-transparent hover:border-slate-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Início</span>
        </Link>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6 sm:my-10 relative z-10">
        <div className="w-full max-w-md sm:max-w-lg bg-white/95 backdrop-blur-sm rounded-3xl border border-slate-200/90 shadow-2xl shadow-indigo-100/60 p-6 sm:p-9 space-y-6">
          {/* Header Title with Glowing Logo */}
          <div className="text-center space-y-3">




            <h1 className="font-heading font-black text-2xl sm:text-3xl text-slate-950 tracking-tight">
              Conectar sua Loja do Instagram
            </h1>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed font-medium">{successMessage}</div>
            </div>
          )}

          {/* Ação Única: Conectar com o Instagram */}
          <div className="pt-2">
            {oauthData?.configured ? (
              <a
                href={oauthData.url}
                className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-700 hover:via-purple-700 hover:to-indigo-700 text-white font-extrabold text-sm sm:text-base transition-all shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/35 hover:-translate-y-0.5 active:translate-y-0 group"
              >
                <Instagram className="w-5 h-5 text-white shrink-0" />
                <span>Conectar com o Instagram</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </a>
            ) : (
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-700 hover:via-purple-700 hover:to-indigo-700 text-white font-extrabold text-sm sm:text-base transition-all shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/35 hover:-translate-y-0.5 active:translate-y-0 group"
              >
                <Instagram className="w-5 h-5 text-white shrink-0" />
                <span>Conectar com o Instagram</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </button>
            )}
          </div>
        </div>

        {/* Instagram Authorization Dialog Modal */}
        <Modal
          isOpen={isAuthModalOpen}
          onClose={() => {
            if (!isLoading) {
              setIsAuthModalOpen(false);
              setAuthStep('form');
            }
          }}
          title="Autorização Oficial do Instagram"
          description="A Vitryne solicita permissão para se conectar à sua conta comercial."
          maxWidth="md"
        >
          {authStep === 'form' ? (
            <form onSubmit={handleAuthorizeInstagram} className="space-y-4 my-2">
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-500/10 border border-slate-200 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Instagram className="w-5 h-5" />
                </div>
                <div className="text-xs">
                  <div className="font-bold text-slate-900">Instagram for Business</div>
                  <div className="text-slate-500">Conexão oficial e segura com a Vitryne</div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-800">
                  Nome da sua Loja:
                </label>
                <input
                  type="text"
                  required
                  value={storeNameInput}
                  onChange={(e) => setStoreNameInput(e.target.value)}
                  placeholder="ex: Boutique Maria Bonita"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-800">
                  @ do Instagram da sua Loja:
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono">@</span>
                  <input
                    type="text"
                    required
                    value={handleInput}
                    onChange={(e) => setHandleInput(e.target.value)}
                    placeholder="mariabonita.oficial"
                    className="w-full pl-7 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                  />
                </div>
              </div>

              {/* Permissions list */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs text-slate-600">
                <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider">
                  Permissões concedidas à Vitryne:
                </span>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Ler comentários e identificar clientes com interesse de compra</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Enviar mensagens e orçamentos de frete no Instagram Direct</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => setIsAuthModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isLoading}
                >
                  Autorizar e Conectar Loja
                </Button>
              </div>
            </form>
          ) : (
            <div className="py-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-full border-3 border-indigo-600 border-t-transparent animate-spin mx-auto" />
              <div className="space-y-1">
                <div className="font-bold text-slate-900 text-sm">
                  Conectando com o Instagram...
                </div>
                <p className="text-xs text-slate-500">
                  Sincronizando perfil de @{handleInput.replace(/^@/, '')} e gerando credenciais seguras.
                </p>
              </div>
            </div>
          )}
        </Modal>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 text-center text-xs text-slate-400 border-t border-slate-100 bg-white">
        &copy; 2026 Vitryne. Todos os direitos reservados.
      </footer>
    </div>
  );
}
