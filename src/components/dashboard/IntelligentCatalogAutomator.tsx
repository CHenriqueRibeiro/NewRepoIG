'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  RefreshCw,
  X,
  Package,
  Check,
  Send,
  ArrowRight,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface ProductItem {
  id: string;
  title: string;
  description?: string;
  canonical_description?: string;
  price_cents: number;
  category?: string;
  stock_quantity: number;
  image_url?: string;
  attributes: Record<string, any>;
  images?: Array<{ id: string; url: string; source_type: string }>;
  variants?: Array<{ id: string; name: string; stock_quantity: number }>;
}

export interface MediaRelationItem {
  id: string;
  media_id: string;
  product_id?: string;
  confidence: number;
  match_status: 'auto_matched' | 'pending_confirmation' | 'confirmed' | 'rejected' | 'suggested_new';
  match_reason?: string;
  candidates?: Array<{
    product_id: string;
    title: string;
    confidence: number;
    similarity: number;
    reason: string;
    image_url?: string;
  }>;
  product?: ProductItem;
  media?: {
    id: string;
    instagram_media_id: string;
    media_type: string;
    media_url?: string;
    thumbnail_url?: string;
    caption?: string;
    extracted_attributes?: Record<string, any>;
    canonical_description?: string;
  };
}

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

interface PendingItemFormData {
  title: string;
  price: string;
  stock: string;
  category: string;
  description: string;
}

export default function IntelligentCatalogAutomator() {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [relations, setRelations] = useState<MediaRelationItem[]>([]);
  const [pendingPrices, setPendingPrices] = useState<PendingPriceRequest[]>([]);
  const [formData, setFormData] = useState<Record<string, PendingItemFormData>>({});
  const [confirmingPriceId, setConfirmingPriceId] = useState<string | null>(null);

  // Controle do modal focado exclusivamente em Pendências
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dismissingId, setDismissingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      // 1. Busca catálogo inteligente e relações de mídia
      const res = await fetch('/api/catalog/intelligent');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setRelations(data.relations || []);
        }
      }

      // 2. Busca solicitações de preço pendentes de Stories/DMs
      const priceRes = await fetch('/api/catalog/price-confirm');
      if (priceRes.ok) {
        const priceData = await priceRes.json();
        if (priceData.success) {
          const pend = (priceData.requests || []).filter((r: PendingPriceRequest) => r.status === 'pending');
          setPendingPrices(pend);

          // Inicializa dados pré-preenchidos para cadastro de cada item
          setFormData((prev) => {
            const next = { ...prev };
            pend.forEach((req: PendingPriceRequest) => {
              if (!next[req.id]) {
                const detectedName = req.product_title && req.product_title !== 'Novidades preto'
                  ? req.product_title
                  : 'Look do Story';

                next[req.id] = {
                  title: detectedName,
                  price: '149,90',
                  stock: '5',
                  category: 'Vestuário',
                  description: '',
                };
              }
            });
            return next;
          });
        }
      }
    } catch (e) {
      console.error('Erro ao carregar dados do catálogo inteligente:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const triggerSync = async () => {
    try {
      setSyncing(true);
      const res = await fetch('/api/instagram/sync', { method: 'POST' });
      if (res.ok) {
        await fetchData();
        setToastMessage('Instagram sincronizado! Novas publicações foram verificadas.');
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (e) {
      console.error('Erro na sincronização:', e);
    } finally {
      setSyncing(false);
    }
  };

  const updateFormField = (id: string, field: keyof PendingItemFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || {
          title: '',
          price: '149,90',
          stock: '5',
          category: 'Vestuário',
          description: '',
        }),
        [field]: value,
      },
    }));
  };

  const handleConfirmPrice = async (req: PendingPriceRequest) => {
    const itemData = formData[req.id] || {
      title: req.product_title || 'Look do Story',
      price: '149,90',
      stock: '5',
      category: 'Vestuário',
      description: '',
    };

    const cleanNum = parseFloat(itemData.price.replace(/\./g, '').replace(',', '.'));
    if (isNaN(cleanNum) || cleanNum <= 0) {
      alert('Por favor, informe um preço numérico maior que zero (ex: 149,90).');
      return;
    }

    setConfirmingPriceId(req.id);
    try {
      const res = await fetch('/api/catalog/price-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: req.id,
          productId: req.product_id,
          price: cleanNum,
          title: itemData.title.trim() || req.product_title || 'Novo Produto',
          description: itemData.description.trim(),
          category: itemData.category.trim() || 'Vestuário',
          stock: parseInt(itemData.stock) || 1,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setToastMessage(
          `"${itemData.title}" publicado na vitrine com sucesso! IA respondeu @${req.buyer_username} no Direct.`
        );
        setTimeout(() => setToastMessage(null), 5000);
        setPendingPrices((prev) => prev.filter((r) => r.id !== req.id));
        await fetchData();
      }
    } catch (e) {
      console.error('Erro ao cadastrar produto pendente:', e);
    } finally {
      setConfirmingPriceId(null);
    }
  };

  const handleDismissPriceRequest = async (reqId: string) => {
    try {
      setDismissingId(reqId);
      // Remove da lista local e atualiza estado
      setPendingPrices((prev) => prev.filter((r) => r.id !== reqId));
      setToastMessage('Publicação descartada (não cadastrada no catálogo).');
      setTimeout(() => setToastMessage(null), 4000);
    } catch (e) {
      console.error('Erro ao descartar pendência:', e);
    } finally {
      setDismissingId(null);
    }
  };

  const confirmMatch = async (relationId: string, productId: string) => {
    try {
      setConfirmingId(relationId);
      const res = await fetch('/api/catalog/intelligent/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ relationId, productId }),
      });
      if (res.ok) {
        await fetchData();
        setToastMessage('Peça vinculada com sucesso! A IA já sabe responder sobre essa foto.');
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (e) {
      console.error('Erro ao confirmar match:', e);
    } finally {
      setConfirmingId(null);
    }
  };

  const handleDismissRelation = async (relationId: string) => {
    try {
      setDismissingId(relationId);
      const res = await fetch('/api/catalog/intelligent/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ relationId }),
      });
      if (res.ok) {
        await fetchData();
        setToastMessage('Publicação arquivada como conteúdo institucional.');
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (err) {
      console.error('Erro ao descartar publicação:', err);
    } finally {
      setDismissingId(null);
    }
  };

  // Separação de status das publicações
  const pendingPhotoMatches = relations.filter((r) => r.match_status === 'pending_confirmation');
  const suggestedNew = relations.filter((r) => r.match_status === 'suggested_new');

  // Total de pendências que exigem ação do dono da loja
  const totalPendencias = pendingPrices.length + pendingPhotoMatches.length + suggestedNew.length;

  return (
    <div className="w-full">
      {/* ======================================================== */}
      {/* 1. NOTIFICAÇÃO DE PENDÊNCIA (SE HOUVER AÇÃO NECESSÁRIA)   */}
      {/* ======================================================== */}
      {totalPendencias > 0 ? (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-400/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5 animate-bounce text-amber-600" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm sm:text-base text-amber-950">
                  {totalPendencias} {totalPendencias === 1 ? 'pendência do Instagram aguardando você' : 'pendências do Instagram aguardando você'}
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-extrabold bg-amber-200 text-amber-900 rounded-full uppercase tracking-wider">
                  Ação Necessária
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-0.5 truncate">
                {pendingPrices.length > 0 && `${pendingPrices.length} cliente(s) aguardando preço no Direct. `}
                {pendingPhotoMatches.length > 0 && `${pendingPhotoMatches.length} foto(s) para confirmar peça. `}
                {suggestedNew.length > 0 && `${suggestedNew.length} nova(s) peça(s) detectada(s).`}
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shrink-0 shadow-xs w-full sm:w-auto"
          >
            Resolver Pendências ({totalPendencias})
          </Button>
        </div>
      ) : (
        /* Se 0 pendências: Barra discreta e ultra enxuta, sem poluir a tela */
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            <span className="font-semibold text-slate-800">Pendências da Loja:</span>
            <span className="text-slate-500 hidden sm:inline">
              Nenhuma pendência no momento • Catálogo 100% atualizado
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <Check className="w-3 h-3 text-emerald-600" />
              Tudo em dia
            </span>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 shrink-0"
            >
              Abrir Pendências →
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. MODAL EXCLUSIVO DE PENDÊNCIAS (100% RESPONSIVO)        */}
      {/* ======================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header: Limpo, Direto e Sem Badges Desnecessárias */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white shrink-0">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <span>Pendências da Loja</span>
                  {totalPendencias > 0 && (
                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-500 text-slate-950">
                      {totalPendencias}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Cadastre as informações da peça para publicar na vitrine e liberar o atendimento automático.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={triggerSync}
                  isLoading={syncing}
                  leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                  className="bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 text-xs hidden sm:inline-flex"
                >
                  Sincronizar
                </Button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  aria-label="Fechar modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Apenas Pendências */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
              {totalPendencias === 0 ? (
                <div className="text-center py-16 px-4 rounded-2xl bg-emerald-50/50 border border-emerald-200">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-base sm:text-lg">
                    Tudo em dia! Nenhuma pendência encontrada
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto mt-1 leading-relaxed">
                    Todas as peças e Stories estão aprovados com preço e foto. A IA está atendendo seus clientes no Instagram em tempo real.
                  </p>
                  <div className="mt-5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsModalOpen(false)}
                      className="text-xs text-slate-700 bg-white"
                    >
                      Voltar para o Catálogo
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* 1. Preços e Cadastro Completo de Peças de Stories */}
                  {pendingPrices.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
                          <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
                          <span>Peças Solicitadas por Clientes nos Stories ({pendingPrices.length})</span>
                        </h4>
                        <span className="text-[11px] text-slate-500 hidden sm:inline">
                          A foto já vem preenchida • Defina o nome, valor, estoque e descrição
                        </span>
                      </div>

                      <div className="space-y-4">
                        {pendingPrices.map((req) => {
                          const current = formData[req.id] || {
                            title: req.product_title || 'Look do Story',
                            price: '149,90',
                            stock: '5',
                            category: 'Vestuário',
                            description: '',
                          };

                          return (
                            <div
                              key={req.id}
                              className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/90 shadow-xs flex flex-col md:flex-row gap-4 sm:gap-6 items-start"
                            >
                              {/* Foto do Story (Já preenchida automaticamente) */}
                              <div className="w-full md:w-44 shrink-0 flex flex-col items-center">
                                <div className="relative aspect-square sm:aspect-[4/5] w-full max-w-[200px] md:max-w-none rounded-xl overflow-hidden bg-slate-200 border border-slate-300 shadow-xs">
                                  {req.product_image_url ? (
                                    <img
                                      src={req.product_image_url}
                                      alt={current.title}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-100 p-2 text-center text-xs font-bold">
                                      <Package className="w-8 h-8 mb-1 text-slate-400" />
                                      Story
                                    </div>
                                  )}
                                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-black/75 text-white backdrop-blur-xs">
                                    Foto do Story
                                  </span>
                                </div>

                                <div className="mt-2 text-center w-full">
                                  <p className="text-[11px] text-slate-500 leading-snug">
                                    <strong className="text-slate-800">@{req.buyer_username}</strong> perguntou:
                                  </p>
                                  <p className="text-[11px] text-slate-700 italic font-medium mt-0.5 line-clamp-2">
                                    &quot;{req.inquiry_text}&quot;
                                  </p>
                                </div>
                              </div>

                              {/* Formulário Completo de Cadastro da Peça */}
                              <div className="flex-1 w-full space-y-3">
                                {/* Linha 1: Nome do Produto */}
                                <div>
                                  <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Nome da Peça / Produto:
                                  </label>
                                  <input
                                    type="text"
                                    value={current.title}
                                    onChange={(e) => updateFormField(req.id, 'title', e.target.value)}
                                    placeholder="Ex: Vestido Midi Floral Estampado"
                                    className="w-full px-3 py-2 text-sm font-semibold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                  />
                                </div>

                                {/* Linha 2: Preço, Categoria e Estoque (Grid Responsivo) */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  {/* Preço */}
                                  <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                      Preço (R$):
                                    </label>
                                    <div className="relative">
                                      <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">
                                        R$
                                      </span>
                                      <input
                                        type="text"
                                        value={current.price}
                                        onChange={(e) => updateFormField(req.id, 'price', e.target.value)}
                                        placeholder="149,90"
                                        className="w-full pl-8 pr-3 py-2 text-sm font-bold text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                      />
                                    </div>
                                  </div>

                                  {/* Estoque */}
                                  <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                      Quantidade / Estoque:
                                    </label>
                                    <input
                                      type="number"
                                      min="1"
                                      value={current.stock}
                                      onChange={(e) => updateFormField(req.id, 'stock', e.target.value)}
                                      placeholder="5"
                                      className="w-full px-3 py-2 text-sm font-semibold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                    />
                                  </div>

                                  {/* Categoria */}
                                  <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                      Categoria:
                                    </label>
                                    <input
                                      type="text"
                                      value={current.category}
                                      onChange={(e) => updateFormField(req.id, 'category', e.target.value)}
                                      placeholder="Vestuário"
                                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                    />
                                  </div>
                                </div>

                                {/* Linha 3: Descrição */}
                                <div>
                                  <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Descrição do Produto:
                                  </label>
                                  <textarea
                                    rows={2}
                                    value={current.description}
                                    onChange={(e) => updateFormField(req.id, 'description', e.target.value)}
                                    placeholder="Ex: Confeccionado em tecido leve, caimento confortável e acabamento refinado..."
                                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white resize-none"
                                  />
                                </div>

                                {/* Linha 4: Botões de Ação */}
                                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2.5 border-t border-slate-200">
                                  <button
                                    type="button"
                                    disabled={dismissingId === req.id}
                                    onClick={() => handleDismissPriceRequest(req.id)}
                                    className="text-xs text-slate-500 hover:text-rose-600 transition-colors flex items-center gap-1.5 py-1.5 w-full sm:w-auto justify-center"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Não é Produto / Descartar</span>
                                  </button>

                                  <Button
                                    variant="primary"
                                    size="sm"
                                    isLoading={confirmingPriceId === req.id}
                                    onClick={() => handleConfirmPrice(req)}
                                    rightIcon={<Send className="w-3.5 h-3.5" />}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs w-full sm:w-auto"
                                  >
                                    Publicar na Vitrine & Responder Cliente
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 2. Dúvidas de Identificação de Fotos */}
                  {pendingPhotoMatches.length > 0 && (
                    <div className="space-y-3 pt-4 border-t border-slate-200">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                          <span>Confirmação de Peça Postada ({pendingPhotoMatches.length})</span>
                        </h4>
                        <span className="text-xs text-slate-500 hidden sm:inline">
                          Escolha o produto correto para ensinar a IA
                        </span>
                      </div>

                      {pendingPhotoMatches.map((rel) => (
                        <div
                          key={rel.id}
                          className="p-4 border border-amber-200 bg-amber-50/40 rounded-xl flex flex-col md:flex-row gap-4 items-start"
                        >
                          <div className="w-full md:w-32 aspect-square sm:aspect-[4/5] rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                            <img
                              src={
                                rel.media?.media_url ||
                                rel.media?.thumbnail_url ||
                                'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800'
                              }
                              alt="Story/Post"
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="flex-1 w-full">
                            <p className="text-xs font-semibold text-slate-700 mb-2">
                              Qual produto corresponde a esta publicação?
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {(rel.candidates || []).slice(0, 2).map((cand) => (
                                <div
                                  key={cand.product_id}
                                  className="p-3 bg-white rounded-lg border border-slate-200 shadow-xs flex items-center justify-between gap-2"
                                >
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-slate-900 truncate">
                                      {cand.title}
                                    </p>
                                    <p className="text-[10px] text-slate-500">
                                      Similaridade: {(cand.similarity * 100).toFixed(0)}%
                                    </p>
                                  </div>

                                  <Button
                                    size="sm"
                                    variant="primary"
                                    isLoading={confirmingId === rel.id}
                                    onClick={() => confirmMatch(rel.id, cand.product_id)}
                                    className="text-xs px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white shrink-0"
                                  >
                                    É este ✓
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 3. Novas Peças Detectadas nos Stories */}
                  {suggestedNew.length > 0 && (
                    <div className="space-y-3 pt-4 border-t border-slate-200">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
                          <PlusCircle className="w-4 h-4 text-blue-500" />
                          <span>Novas Peças Detectadas nos Stories ({suggestedNew.length})</span>
                        </h4>
                      </div>

                      {suggestedNew.map((rel) => (
                        <div
                          key={rel.id}
                          className="p-4 border border-blue-200 bg-blue-50/30 rounded-xl flex flex-col md:flex-row gap-4 items-start"
                        >
                          <div className="w-full md:w-32 aspect-square sm:aspect-[4/5] rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                            <img
                              src={
                                rel.media?.media_url ||
                                rel.media?.thumbnail_url ||
                                'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=800'
                              }
                              alt="Nova Peça"
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="flex-1 w-full">
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                              Peça Detectada
                            </span>
                            <h5 className="text-sm font-bold text-slate-900 mt-1">
                              {rel.media?.caption || 'Peça Inédita no Feed/Story'}
                            </h5>
                            <p className="text-xs text-slate-600 mt-0.5">
                              {rel.media?.canonical_description}
                            </p>

                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                isLoading={dismissingId === rel.id}
                                leftIcon={<X className="w-3.5 h-3.5 text-slate-400" />}
                                className="text-slate-600 hover:text-slate-900 border-slate-300 text-xs hover:bg-slate-100"
                                onClick={() => handleDismissRelation(rel.id)}
                              >
                                Não é Produto
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500">
                {totalPendencias > 0
                  ? `${totalPendencias} pendência(s) aguardando você.`
                  : 'Nenhuma pendência pendente.'}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="text-xs font-semibold"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST FLUTUANTE */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-70 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2.5 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <p className="text-xs font-medium text-slate-100">{toastMessage}</p>
        </div>
      )}
    </div>
  );
}
