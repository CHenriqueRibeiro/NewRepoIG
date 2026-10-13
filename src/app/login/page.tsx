'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Instagram,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Copy,
  ExternalLink,
  ShieldCheck,
  Check,
} from 'lucide-react';

function LoginContent() {
  const searchParams = useSearchParams();

  const [oauthData, setOauthData] = useState<{
    configured: boolean;
    url: string;
    vercelUrl?: string;
    fbUrl?: string;
    redirectUri: string;
    appId: string | null;
  } | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedUri, setCopiedUri] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const errorParam = searchParams.get('error');

  useEffect(() => {
    if (errorParam) {
      setErrorMessage(decodeURIComponent(errorParam));
    }

    // Carrega URLs oficiais do OAuth da Meta
    fetch('/api/auth/instagram/url')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setOauthData({
            configured: data.configured,
            url: data.url,
            vercelUrl: data.vercelUrl,
            fbUrl: data.fbUrl,
            redirectUri: data.redirectUri,
            appId: data.appId,
          });
        }
      })
      .catch((err) => console.error('Erro ao verificar OAuth:', err));
  }, [errorParam]);

  const handleCopyUri = () => {
    if (!oauthData?.redirectUri) return;
    navigator.clipboard.writeText(oauthData.redirectUri);
    setCopiedUri(true);
    setTimeout(() => setCopiedUri(false), 2000);
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
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25 mb-1">
              <Instagram className="w-7 h-7" />
            </div>
            <h1 className="font-heading font-black text-2xl sm:text-3xl text-slate-950 tracking-tight">
              Entrar com o Instagram
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
              Autenticação oficial e segura. Faça login com as credenciais reais da sua conta comercial no Instagram.
            </p>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                <span className="font-bold block">Erro na Autenticação:</span>
                {errorMessage}
              </div>
            </div>
          )}

            {/* Botão Oficial: Conectar com o Instagram */}
            {oauthData?.configured && oauthData.url ? (
              <div className="space-y-2.5">
                <a
                  href={oauthData.url}
                  onClick={() => setIsLoading(true)}
                  className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-700 hover:via-purple-700 hover:to-indigo-700 text-white font-extrabold text-sm sm:text-base transition-all shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/35 hover:-translate-y-0.5 active:translate-y-0 group"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Redirecionando para o Instagram...</span>
                    </>
                  ) : (
                    <>
                      <Instagram className="w-5 h-5 text-white shrink-0" />
                      <span>Entrar com o Instagram (Oficial com Senha)</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform shrink-0" />
                    </>
                  )}
                </a>

                {oauthData?.vercelUrl && (
                  <a
                    href={oauthData.vercelUrl}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all shadow-xs"
                  >
                    <span>Entrar via URL da Vercel (Já Autorizada na Meta)</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Meta App não configurado</span>
                  Defina o <code>INSTAGRAM_APP_ID</code> e <code>INSTAGRAM_APP_SECRET</code> no seu arquivo .env.local.
                </div>
              </div>
            )}

          {/* Card Informativo com a URL de Redirecionamento para a Meta */}
          {oauthData && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5 text-xs text-slate-600">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 text-[11px] uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Configuração de Redirecionamento da Meta</span>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Para que a Meta valide a sua conta com sucesso sem exibir <i>"Invalid redirect_uri"</i>,
                esta URL deve estar autorizada no seu painel da Meta:
              </p>

              <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200 text-[11px] font-mono text-slate-800">
                <span className="flex-1 truncate select-all">{oauthData.redirectUri}</span>
                <button
                  type="button"
                  onClick={handleCopyUri}
                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans font-bold text-[10px] flex items-center gap-1 transition-colors shrink-0"
                  title="Copiar URL de Retorno"
                >
                  {copiedUri ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copiar URL</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-[10px] text-slate-400">
                App ID Ativo na Meta: <span className="font-mono font-bold text-slate-600">{oauthData.appId}</span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 text-center text-xs text-slate-400 border-t border-slate-100 bg-white">
        &copy; 2026 Vitryne. Todos os direitos reservados.
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
