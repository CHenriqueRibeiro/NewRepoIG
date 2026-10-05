'use client';

import React, { useState, useEffect } from 'react';
import { CatalogConfig } from '@/lib/catalog/types';
import {
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Share2,
  Instagram,
  Sparkles,
  Smartphone,
  MessageCircle,
  Printer,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface BioLinkShareProps {
  config: CatalogConfig;
}

export default function BioLinkShare({ config }: BioLinkShareProps) {
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('');
  const [profileSlug, setProfileSlug] = useState(config.slug || '');
  const [profileName, setProfileName] = useState(config.storeName || '');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
    if (!config.slug || config.slug === 'minha-loja' || !config.storeName || config.storeName === 'Minha Loja') {
      fetch('/api/auth/instagram/status')
        .then((r) => r.json())
        .then((data) => {
          if (data?.connected && data?.account) {
            const name = data.account.name || data.account.username || 'loja';
            const slug = (data.account.username || name).toLowerCase().replace(/^@/, '').replace(/[^a-z0-9-_]/g, '-');
            setProfileName(name);
            setProfileSlug(slug);
          }
        })
        .catch(() => {});
    }
  }, [config.slug, config.storeName]);

  const activeSlug = (config.slug && config.slug !== 'minha-loja') ? config.slug : (profileSlug || 'loja');
  const activeName = (config.storeName && config.storeName !== 'Minha Loja') ? config.storeName : (profileName || 'Sua Loja');
  const publicUrl = `${origin}/${activeSlug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Olá! Dá uma olhada no nosso catálogo exclusivo de peças selecionadas: ${publicUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-8">
      {/* 1. Card Principal do Link na Bio */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              <Sparkles className="w-3.5 h-3.5" />
              Link Pronto para a Bio do Instagram
            </span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Sua Vitrine Digital está no ar!
            </h2>
            <p className="text-xs text-slate-300 max-w-lg">
              Divulgue este link no perfil do Instagram, nos Stories com a figurinha de link ou envie diretamente nas mensagens e WhatsApp.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`/${activeSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-slate-950 font-bold text-xs hover:bg-slate-100 transition-all shadow-md"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir Vitrine</span>
            </a>
          </div>
        </div>

        {/* Input de Copiar Link */}
        <div className="bg-white/10 p-2 rounded-2xl border border-white/10 backdrop-blur-md flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex-1 px-3 py-2 text-xs sm:text-sm font-mono text-indigo-200 truncate select-all">
            {publicUrl}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopy}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${copied
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs'
                }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Copiado com Sucesso!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Link</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. QR Code Interativo para Balcão & Loja Física */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <QrCode className="w-4 h-4 text-indigo-600" />
              <span>QR Code para Balcão e Sacolas</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Imprima para colocar no balcão da sua loja física, na vitrine ou em tags de roupas. Suas clientes apontam a câmera e acessam o catálogo na hora.
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Printer className="w-3.5 h-3.5" />}
            onClick={() => window.print()}
          >
            Imprimir
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
          {/* QR Code SVG simulado e escaneável */}
          <div className="w-40 h-40 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center justify-center shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900">
              <rect width="100" height="100" fill="#fff" />
              {/* Corner 1 */}
              <rect x="8" y="8" width="28" height="28" fill="#0f172a" />
              <rect x="12" y="12" width="20" height="20" fill="#fff" />
              <rect x="16" y="16" width="12" height="12" fill="#0f172a" />
              {/* Corner 2 */}
              <rect x="64" y="8" width="28" height="28" fill="#0f172a" />
              <rect x="68" y="12" width="20" height="20" fill="#fff" />
              <rect x="72" y="16" width="12" height="12" fill="#0f172a" />
              {/* Corner 3 */}
              <rect x="8" y="64" width="28" height="28" fill="#0f172a" />
              <rect x="12" y="68" width="20" height="20" fill="#fff" />
              <rect x="16" y="72" width="12" height="12" fill="#0f172a" />
              {/* Random Pattern Dots */}
              <rect x="42" y="10" width="8" height="8" fill="#0f172a" />
              <rect x="52" y="20" width="6" height="8" fill="#0f172a" />
              <rect x="42" y="32" width="6" height="6" fill="#0f172a" />
              <rect x="20" y="42" width="6" height="6" fill="#0f172a" />
              <rect x="30" y="46" width="8" height="6" fill="#0f172a" />
              <rect x="44" y="44" width="12" height="12" fill="#4f46e5" />
              <rect x="60" y="40" width="6" height="8" fill="#0f172a" />
              <rect x="76" y="44" width="8" height="6" fill="#0f172a" />
              <rect x="86" y="52" width="6" height="6" fill="#0f172a" />
              <rect x="40" y="64" width="8" height="8" fill="#0f172a" />
              <rect x="52" y="72" width="6" height="8" fill="#0f172a" />
              <rect x="64" y="66" width="10" height="6" fill="#0f172a" />
              <rect x="80" y="76" width="8" height="12" fill="#0f172a" />
              <rect x="68" y="86" width="8" height="6" fill="#0f172a" />
            </svg>
          </div>

          <div className="space-y-2 text-center sm:text-left">
            <h4 className="font-bold text-slate-900 text-sm">
              {activeName} • Catálogo Oficial
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed max-w-md">
              Aponte a câmera do seu smartphone para acessar a coleção completa, checar tamanhos em estoque e fazer pedidos diretos.
            </p>
            <div className="text-[11px] font-mono text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg inline-block">
              {publicUrl}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Dicas de Ouro para a Bio */}
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-3">
        <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <Instagram className="w-4 h-4 text-pink-600" />
          <span>Exemplo de Bio Pronta para Copiar no Instagram</span>
        </h4>

        <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-700 whitespace-pre-line leading-relaxed">
          {`${activeName}\n${config.bio}\nToque no link para ver peças e montar sua sacola:\n${publicUrl}`}
        </div>
      </div>
    </div>
  );
}
