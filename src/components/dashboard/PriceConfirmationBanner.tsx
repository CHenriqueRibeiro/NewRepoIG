'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, DollarSign, CheckCircle2, Clock, AlertTriangle, Send, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface PendingPriceRequest {
  id: string;
  store_id: string;
  product_id: string;
  product_title: string;
  product_image_url?: string;
  buyer_username: string;
  buyer_id: string;
  inquiry_text: string;
  status: 'pending' | 'confirmed';
  confirmed_price_cents?: number;
  created_at: string;
}

export default function PriceConfirmationBanner() {
  const [requests, setRequests] = useState<PendingPriceRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const fetchPending = async () => {
    try {
      const res = await fetch('/api/catalog/price-confirm');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const pending = (data.requests || [])
            .filter((r: PendingPriceRequest) => r.status === 'pending')
            .filter((r: PendingPriceRequest) => r.buyer_id !== 'system_sync' && r.buyer_username?.toLowerCase() !== 'lojista');
          setRequests(pending);
        }
      }
    } catch (e) {
      console.error('Erro ao buscar pendências de preço:', e);
    }
  };

  useEffect(() => {
    fetchPending();
    const interval = setInterval(fetchPending, 10000); // Polling suave a cada 10s
    return () => clearInterval(interval);
  }, []);

  const handlePriceChange = (id: string, val: string) => {
    setPrices((prev) => ({ ...prev, [id]: val }));
  };

  const handleConfirm = async (req: PendingPriceRequest) => {
    const rawVal = prices[req.id] || '99.90';
    const cleanNum = parseFloat(rawVal.replace(',', '.'));
    if (isNaN(cleanNum) || cleanNum <= 0) {
      alert('Digite um valor numérico válido (ex: 120 ou 89,90).');
      return;
    }

    setConfirmingId(req.id);
    try {
      const res = await fetch('/api/catalog/price-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: req.id,
          productId: req.product_id,
          price: cleanNum,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessToast(
          `Preço de R$ ${cleanNum.toFixed(2)} salvo no catálogo! A IA já respondeu @${req.buyer_username} no Direct.`
        );
        setTimeout(() => setSuccessToast(null), 5000);
        // Remove da lista
        setRequests((prev) => prev.filter((r) => r.id !== req.id));
      }
    } catch (e) {
      console.error('Erro ao confirmar preço:', e);
    } finally {
      setConfirmingId(null);
    }
  };

  if (requests.length === 0 && !successToast) {
    return null; // Nada pendente, não polui a tela
  }

  return (
    <div className="w-full space-y-3">
      {successToast && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-medium">{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {requests.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/90 border border-amber-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
              <h3 className="font-heading font-bold text-sm text-amber-950">
                Micro-Confirmação de Preço (Novidades de Stories)
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-200/80 text-amber-900 rounded-full">
                {requests.length} cliente{requests.length > 1 ? 's' : ''} aguardando
              </span>
            </div>
            <span className="text-[11px] text-amber-700 font-medium hidden sm:inline">
              Digite o valor uma única vez • A IA aprende e replica automaticamente
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {requests.map((req) => {
              const currentInput = prices[req.id] !== undefined ? prices[req.id] : '';
              return (
                <div
                  key={req.id}
                  className="p-3.5 rounded-xl bg-white border border-amber-200/80 shadow-xs flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start gap-3">
                    {req.product_image_url ? (
                      <img
                        src={req.product_image_url}
                        alt={req.product_title}
                        className="w-14 h-14 object-cover rounded-lg border border-slate-200 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-xs flex-shrink-0">
                        Story
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {req.product_title}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        <strong className="text-slate-800">@{req.buyer_username}</strong> perguntou:{' '}
                        <span className="italic text-slate-600">&quot;{req.inquiry_text}&quot;</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        R$
                      </span>
                      <input
                        type="text"
                        placeholder="Ex: 149,90"
                        value={currentInput}
                        onChange={(e) => handlePriceChange(req.id, e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-1 focus:ring-slate-900 focus:outline-none font-mono"
                      />
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      isLoading={confirmingId === req.id}
                      onClick={() => handleConfirm(req)}
                      rightIcon={<Send className="w-3 h-3" />}
                    >
                      Confirmar (1 Clique)
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
