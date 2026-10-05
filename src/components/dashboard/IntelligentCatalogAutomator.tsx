'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  RefreshCw,
  ShoppingBag,
  ExternalLink,
  MessageCircle,
  X,
  Package,
  Check,
  Info,
  Bot,
  Send,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { buildProductCleanUrl } from '@/lib/catalog/url-helpers';

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

export default function IntelligentCatalogAutomator() {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [relations, setRelations] = useState<MediaRelationItem[]>([]);
  const [pendingPrices, setPendingPrices] = useState<PendingPriceRequest[]>([]);
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>({});
  const [confirmingPriceId, setConfirmingPriceId] = useState<string | null>(null);

  // Controle do modal da Central de Pendências & Instagram
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'products_active' | 'matches' | 'simulator'>('pending');

  // Estado para cadastro de nova peça a partir de Story
  const [modalRelation, setModalRelation] = useState<MediaRelationItem | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formPrice, setFormPrice] = useState('99,00');
  const [formCategory, setFormCategory] = useState('Geral');
  const [formStock, setFormStock] = useState('10');
  const [formDescription, setFormDescription] = useState('');
  const [submittingProduct, setSubmittingProduct] = useState(false);
  const [dismissingId, setDismissingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Estado para o simulador de atendimento
  const [simText, setSimText] = useState('Tem no tamanho M?');
  const [simStoryUrl, setSimStoryUrl] = useState('');
  const [simLoading, setSimLoading] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      // 1. Busca catálogo inteligente e relações de mídia
      const res = await fetch('/api/catalog/intelligent');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setProducts(data.products || []);
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

  const handleConfirmPrice = async (req: PendingPriceRequest) => {
    const rawVal = priceInputs[req.id] || '99.90';
    const cleanNum = parseFloat(rawVal.replace(',', '.'));
    if (isNaN(cleanNum) || cleanNum <= 0) {
      alert('Por favor, informe um valor maior que zero (ex: 149,90).');
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
        }),
      });

      const data = await res.json();
      if (data.success) {
        setToastMessage(
          `Preço de R$ ${cleanNum.toFixed(2).replace('.', ',')} salvo! A IA já respondeu @${req.buyer_username} no Direct.`
        );
        setTimeout(() => setToastMessage(null), 5000);
        setPendingPrices((prev) => prev.filter((r) => r.id !== req.id));
        await fetchData();
      }
    } catch (e) {
      console.error('Erro ao confirmar preço:', e);
    } finally {
      setConfirmingPriceId(null);
    }
  };

  const openCreateModal = (rel: MediaRelationItem) => {
    const caption = rel.media?.caption || '';
    setModalRelation(rel);

    const firstLine = caption.split('\n')[0]?.replace(/[#@]/g, '').trim() || '';
    setFormTitle(firstLine && firstLine.length < 50 ? firstLine : 'Nova Peça do Catálogo');
    setFormCategory('Vestuário');
    setFormPrice('149,90');
    setFormStock('10');
    setFormDescription(caption.slice(0, 250) || rel.media?.canonical_description || '');
  };

  const handleSaveProduct = async () => {
    if (!modalRelation) return;
    try {
      setSubmittingProduct(true);
      const cleanPrice = parseFloat(formPrice.replace(/\./g, '').replace(',', '.'));
      const priceCents = Math.round((isNaN(cleanPrice) ? 99 : cleanPrice) * 100);

      const res = await fetch('/api/catalog/intelligent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromRelationId: modalRelation.id,
          title: formTitle.trim() || 'Novo Item',
          price_cents: priceCents,
          category: formCategory.trim() || 'Geral',
          stock_quantity: Number(formStock) || 1,
          description: formDescription,
          canonical_description: `${formTitle}. ${formDescription}`,
          image_url: modalRelation.media?.media_url || modalRelation.media?.thumbnail_url,
          is_unique_piece: false,
        }),
      });

      if (res.ok) {
        await fetchData();
        const createdTitle = formTitle;
        setModalRelation(null);
        setToastMessage(`"${createdTitle}" publicado na vitrine com sucesso!`);
        setTimeout(() => setToastMessage(null), 5000);
      }
    } catch (err: any) {
      console.error('Erro ao cadastrar produto:', err);
    } finally {
      setSubmittingProduct(false);
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
        if (modalRelation?.id === relationId) {
          setModalRelation(null);
        }
        setToastMessage('Publicação arquivada como conteúdo institucional.');
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (err) {
      console.error('Erro ao descartar publicação:', err);
    } finally {
      setDismissingId(null);
    }
  };

  const runCustomerSimulation = async () => {
    try {
      setSimLoading(true);
      const res = await fetch('/api/catalog/intelligent/test-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageText: simText,
          storyUrl: simStoryUrl,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSimResult(data.result);
      }
    } catch (e) {
      console.error('Erro ao simular:', e);
    } finally {
      setSimLoading(false);
    }
  };

  // Separação de status das publicações
  const pendingPhotoMatches = relations.filter((r) => r.match_status === 'pending_confirmation');
  const autoMatched = relations.filter((r) => r.match_status === 'auto_matched' || r.match_status === 'confirmed');
  const suggestedNew = relations.filter((r) => r.match_status === 'suggested_new');

  // Total de pendências que exigem ação do dono da loja
  const totalPendencias = pendingPrices.length + pendingPhotoMatches.length + suggestedNew.length;

  return (
    <div className="w-full">
      {/* ======================================================== */}
      {/* 1. NOTIFICAÇÃO DE PENDÊNCIA (SE HOUVER AÇÃO NECESSÁRIA)   */}
      {/* ======================================================== */}
      {totalPendencias > 0 ? (
        <div className="p-3.5 sm:p-4 rounded-xl bg-amber-500/10 border border-amber-400/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4 animate-bounce text-amber-600" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-xs sm:text-sm text-amber-950">
                  {totalPendencias} {totalPendencias === 1 ? 'pendência do Instagram aguardando você' : 'pendências do Instagram aguardando você'}
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-extrabold bg-amber-200 text-amber-900 rounded-full">
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
            onClick={() => {
              setActiveTab('pending');
              setIsModalOpen(true);
            }}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shrink-0 shadow-xs w-full sm:w-auto"
          >
            Resolver Pendências ({totalPendencias})
          </Button>
        </div>
      ) : (
        /* Se 0 pendências: Barra discreta e ultra enxuta, sem poluir a tela */
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            <span className="font-semibold text-slate-800">Instagram & Atendente IA:</span>
            <span className="text-slate-500 hidden sm:inline">
              Conectado • 0 pendências • Atendimento em tempo real ativo
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <Check className="w-3 h-3 text-emerald-600" />
              Tudo em dia
            </span>
            <button
              onClick={() => {
                setActiveTab('products_active');
                setIsModalOpen(true);
              }}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 shrink-0"
            >
              Central do Instagram & IA →
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. MODAL DA CENTRAL DE PENDÊNCIAS & ATENDIMENTO          */}
      {/* ======================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Instagram Conectado
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    <Bot className="w-3.5 h-3.5 text-indigo-400" />
                    IA Ativa no Direct
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">Central de Pendências & Instagram</h3>
                <p className="text-xs text-slate-300">
                  Gerencie aprovações de Stories, preços solicitados por clientes e teste o robô de vendas
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={triggerSync}
                  isLoading={syncing}
                  leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                  className="bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 text-xs"
                >
                  Sincronizar
                </Button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-1 px-4 sm:px-6 pt-2 border-b border-slate-200 overflow-x-auto bg-slate-50">
              <button
                onClick={() => setActiveTab('pending')}
                className={`py-2 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'pending'
                    ? totalPendencias > 0
                      ? 'border-amber-600 text-amber-700'
                      : 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                {totalPendencias > 0 ? (
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                )}
                <span>Pendências</span>
                <span
                  className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                    totalPendencias > 0
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}
                >
                  {totalPendencias}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('products_active')}
                className={`py-2 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'products_active'
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShoppingBag className="w-4 h-4 text-indigo-500" />
                <span>Produtos na IA ({products.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('matches')}
                className={`py-2 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'matches'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span>Posts Conectados ({autoMatched.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('simulator')}
                className={`py-2 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'simulator'
                    ? 'border-purple-600 text-purple-700'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <MessageCircle className="w-4 h-4 text-purple-500" />
                <span>Testar Respostas da IA ⚡</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-6">
              {/* ABA PENDÊNCIAS */}
              {activeTab === 'pending' && (
                <div>
                  {totalPendencias === 0 ? (
                    <div className="text-center py-12 px-4 rounded-2xl bg-emerald-50/50 border border-emerald-200">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-slate-900 text-base">Tudo em dia! Nenhuma pendência encontrada</h4>
                      <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto mt-1 leading-relaxed">
                        Sua vitrine e seu atendente virtual estão 100% atualizados. Quando você postar Stories com peças inéditas ou clientes perguntarem valores, as aprovações rápidas aparecerão aqui.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {/* Preços Solicitados */}
                      {pendingPrices.length > 0 && (
                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-xs sm:text-sm text-amber-950 flex items-center gap-2">
                              <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
                              Preços Solicitados por Clientes nos Stories ({pendingPrices.length})
                            </h4>
                            <span className="text-[11px] text-amber-800 font-medium hidden sm:inline">
                              Digite o valor uma única vez • A IA responde no Direct
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {pendingPrices.map((req) => {
                              const currentInput = priceInputs[req.id] !== undefined ? priceInputs[req.id] : '';
                              return (
                                <div
                                  key={req.id}
                                  className="p-3 rounded-lg bg-white border border-amber-200 shadow-xs flex flex-col justify-between space-y-3"
                                >
                                  <div className="flex items-start gap-3">
                                    {req.product_image_url ? (
                                      <img
                                        src={req.product_image_url}
                                        alt={req.product_title}
                                        className="w-12 h-12 object-cover rounded-lg border border-slate-200 shrink-0"
                                      />
                                    ) : (
                                      <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800 font-bold text-xs shrink-0">
                                        Story
                                      </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <span className="text-xs font-bold text-slate-900 truncate block">
                                        {req.product_title}
                                      </span>
                                      <p className="text-[11px] text-slate-500 mt-0.5">
                                        <strong className="text-slate-800">@{req.buyer_username}</strong> perguntou:{' '}
                                        <span className="italic text-slate-600">&quot;{req.inquiry_text}&quot;</span>
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                                    <div className="relative flex-1">
                                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                        R$
                                      </span>
                                      <input
                                        type="text"
                                        placeholder="Ex: 149,90"
                                        value={currentInput}
                                        onChange={(e) =>
                                          setPriceInputs((prev) => ({ ...prev, [req.id]: e.target.value }))
                                        }
                                        className="w-full pl-8 pr-3 py-1 text-xs font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-1 focus:ring-slate-900 focus:outline-none"
                                      />
                                    </div>
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      isLoading={confirmingPriceId === req.id}
                                      onClick={() => handleConfirmPrice(req)}
                                      rightIcon={<Send className="w-3 h-3" />}
                                      className="bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs"
                                    >
                                      Salvar Preço
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Dúvidas de Identificação */}
                      {pendingPhotoMatches.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            Confirmação de Peça Postada ({pendingPhotoMatches.length})
                          </h4>

                          {pendingPhotoMatches.map((rel) => (
                            <div
                              key={rel.id}
                              className="p-3.5 border border-amber-200 bg-amber-50/50 rounded-xl flex flex-col md:flex-row gap-3 items-start"
                            >
                              <div className="w-full md:w-28 shrink-0">
                                <div className="relative aspect-[4/5] rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shadow-xs">
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
                              </div>

                              <div className="flex-1 w-full">
                                <p className="text-xs font-semibold text-slate-700 mb-2">
                                  Qual produto corresponde a esta publicação?
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {(rel.candidates || []).slice(0, 2).map((cand) => (
                                    <div
                                      key={cand.product_id}
                                      className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-xs flex items-center justify-between gap-2"
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
                                        className="text-xs px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white shrink-0"
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

                      {/* Novas Peças */}
                      {suggestedNew.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
                            <PlusCircle className="w-4 h-4 text-blue-500" />
                            Novas Peças Detectadas nos Stories ({suggestedNew.length})
                          </h4>

                          {suggestedNew.map((rel) => (
                            <div
                              key={rel.id}
                              className="p-3.5 border border-blue-200 bg-blue-50/40 rounded-xl flex flex-col md:flex-row gap-3 items-start"
                            >
                              <div className="w-full md:w-28 aspect-[4/5] rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
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
                                  Nova Peça
                                </span>
                                <h5 className="text-xs font-bold text-slate-900 mt-1">
                                  {rel.media?.caption || 'Peça Inédita no Feed/Story'}
                                </h5>
                                <p className="text-[11px] text-slate-600 mt-0.5">
                                  {rel.media?.canonical_description}
                                </p>

                                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="primary"
                                    leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
                                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs shadow-xs"
                                    onClick={() => openCreateModal(rel)}
                                  >
                                    Publicar na Vitrine (1 Clique)
                                  </Button>
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
              )}

              {/* ABA PRODUTOS NA IA */}
              {activeTab === 'products_active' && (
                <div className="space-y-4">
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 flex items-start gap-2">
                    <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Reconhecimento Visual Ativo:</strong> Quando você postar fotos parecidas com esses produtos no Instagram, a IA reconhece o item na hora e envia o link direto com o preço aos clientes.
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {products.map((prod) => (
                      <div
                        key={prod.id}
                        className="border border-slate-200 rounded-xl p-3 bg-white shadow-xs flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                              {prod.category || 'Geral'}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                              <Check className="w-2.5 h-2.5 text-emerald-600" />
                              IA Ativa
                            </span>
                          </div>

                          <div className="aspect-[4/3] rounded-lg overflow-hidden bg-slate-100 mb-2 border border-slate-200">
                            {prod.image_url ? (
                              <img
                                src={prod.image_url}
                                alt={prod.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <Package className="w-6 h-6" />
                              </div>
                            )}
                          </div>

                          <h5 className="font-bold text-slate-900 text-xs truncate">{prod.title}</h5>
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                            {prod.canonical_description || prod.description || 'Sem descrição'}
                          </p>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-900">
                            R$ {(prod.price_cents / 100).toFixed(2).replace('.', ',')}
                          </span>
                          <a
                            href={buildProductCleanUrl('', 'minha-loja', prod)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-600 hover:text-indigo-800 text-[11px] font-medium inline-flex items-center gap-1"
                          >
                            Ver na Vitrine <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ABA POSTS CONECTADOS */}
              {activeTab === 'matches' && (
                <div className="space-y-2.5">
                  {autoMatched.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-xs">
                      Nenhum post vinculado ainda. Ao postar Stories novos, eles aparecerão aqui.
                    </div>
                  ) : (
                    autoMatched.map((rel) => (
                      <div
                        key={rel.id}
                        className="p-3 border border-slate-200 rounded-xl bg-white flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-12 rounded-md overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                            <img
                              src={
                                rel.media?.media_url ||
                                rel.media?.thumbnail_url ||
                                'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800'
                              }
                              alt="Thumbnail"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 truncate">
                                {rel.product?.title || 'Produto Conectado'}
                              </span>
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                                VINCULADO
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {rel.media?.caption || 'Story vinculado'}
                            </p>
                          </div>
                        </div>

                        <span className="font-bold text-slate-800 shrink-0">
                          R$ {((rel.product?.price_cents || 0) / 100).toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ABA SIMULADOR */}
              {activeTab === 'simulator' && (
                <div className="max-w-xl mx-auto space-y-4">
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 leading-relaxed">
                    <strong>Simulador de Direct:</strong> Digite uma mensagem de teste como cliente e veja a resposta instantânea que a IA enviará.
                  </div>

                  <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Mensagem do cliente no Direct:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={simText}
                        onChange={(e) => setSimText(e.target.value)}
                        className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                        placeholder="Ex: Tem tamanho M? / Qual o valor? / Quero comprar"
                      />
                      <Button
                        size="sm"
                        variant="primary"
                        isLoading={simLoading}
                        onClick={runCustomerSimulation}
                        className="bg-purple-600 hover:bg-purple-500 text-white shrink-0 text-xs"
                      >
                        Simular
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setSimText('Tem no tamanho M?')}
                        className="text-[11px] px-2 py-0.5 bg-white border border-slate-200 rounded hover:bg-slate-100 text-slate-700"
                      >
                        &quot;Tem no tamanho M?&quot;
                      </button>
                      <button
                        type="button"
                        onClick={() => setSimText('Qual o valor dessa peça?')}
                        className="text-[11px] px-2 py-0.5 bg-white border border-slate-200 rounded hover:bg-slate-100 text-slate-700"
                      >
                        &quot;Qual o valor dessa peça?&quot;
                      </button>
                      <button
                        type="button"
                        onClick={() => setSimText('QUERO COMPRAR')}
                        className="text-[11px] px-2 py-0.5 bg-white border border-slate-200 rounded hover:bg-slate-100 text-slate-700"
                      >
                        &quot;QUERO COMPRAR&quot;
                      </button>
                    </div>
                  </div>

                  {simResult && (
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                      <div className="bg-slate-900 text-white px-3 py-2 flex items-center justify-between text-xs">
                        <span className="font-semibold flex items-center gap-1.5">
                          <Bot className="w-3.5 h-3.5 text-emerald-400" />
                          Resposta enviada ao cliente
                        </span>
                        <span className="text-[10px] text-emerald-400">Estoque Real</span>
                      </div>
                      <div className="p-3 bg-white space-y-2">
                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 whitespace-pre-line leading-relaxed">
                          {simResult.replyText}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {totalPendencias > 0
                  ? `Existem ${totalPendencias} itens pendentes de aprovação.`
                  : 'Nenhuma pendência. Loja operando normalmente.'}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="text-xs"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. MODAL DE CADASTRO DE PRODUTO EM 1 CLIQUE (SUBMODAL)   */}
      {/* ======================================================== */}
      {modalRelation && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Publicar Peça na Vitrine</h3>
                  <p className="text-xs text-slate-500">Defina o nome e valor para ativar na IA</p>
                </div>
              </div>
              <button
                onClick={() => setModalRelation(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome do Produto:
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  placeholder="Ex: Vestido Midi Floral"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Preço (R$):
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-slate-400 font-semibold">R$</span>
                    <input
                      type="text"
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-sm font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      placeholder="149,90"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Categoria:
                  </label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    placeholder="Vestuário"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estoque Inicial:
                </label>
                <input
                  type="text"
                  value={formStock}
                  onChange={(e) => setFormStock(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  placeholder="10"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descrição (usada pela IA para responder clientes):
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
                  placeholder="Detalhes, tecidos, cores disponíveis..."
                />
              </div>
            </div>

            <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDismissRelation(modalRelation.id)}
                className="text-slate-600 hover:text-rose-600 text-xs"
              >
                Não é Produto (Descartar)
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setModalRelation(null)}
                  className="text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={submittingProduct}
                  onClick={handleSaveProduct}
                  leftIcon={<Check className="w-3.5 h-3.5" />}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs"
                >
                  Publicar na Vitrine
                </Button>
              </div>
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
