'use client';

import React, { useState, useEffect } from 'react';
import {
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
  HelpCircle,
  ChevronDown,
  ChevronUp,
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

  // Abas simplificadas para o dono da loja
  const [activeTab, setActiveTab] = useState<'pending' | 'products_active' | 'matches' | 'simulator'>('pending');
  const [showHowItWorks, setShowHowItWorks] = useState(false);

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
        setToastMessage('Instagram sincronizado com sucesso! Novas publicações foram verificadas.');
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
        setToastMessage('Peça vinculada com sucesso! A IA já sabe responder sobre essa publicação.');
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
        setToastMessage(`"${createdTitle}" adicionado ao catálogo! Já está disponível na vitrine.`);
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
        setToastMessage('Publicação arquivada como conteúdo institucional (não é produto).');
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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
      {/* 1. Header Executivo Compacto e Direto */}
      <div className="p-5 sm:p-6 bg-slate-900 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Instagram Conectado
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <Bot className="w-3.5 h-3.5 text-indigo-400" />
                IA Ativa no Direct
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Automação de Vendas do Instagram
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5 max-w-2xl leading-relaxed">
              A IA reconhece seus Stories e posts e envia o link direto da sua vitrine quando clientes comentam ou perguntam no Direct.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowHowItWorks(!showHowItWorks)}
              className="text-xs font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>Como funciona</span>
              {showHowItWorks ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            <Button
              variant="primary"
              size="sm"
              onClick={triggerSync}
              isLoading={syncing}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium border-0 shadow-sm"
            >
              Sincronizar Instagram
            </Button>
          </div>
        </div>

        {/* Explicação Expansível Sem Jargões Técnicos */}
        {showHowItWorks && (
          <div className="mt-4 p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 grid grid-cols-1 md:grid-cols-3 gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start gap-2.5">
              <span className="w-6 h-6 rounded-md bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center shrink-0 border border-indigo-500/30 text-xs">
                1
              </span>
              <div>
                <p className="text-xs font-bold text-white">Você Posta no Instagram</p>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                  Publique Stories, Reels ou fotos de looks normalmente no perfil da loja.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-6 h-6 rounded-md bg-purple-500/20 text-purple-400 font-bold flex items-center justify-center shrink-0 border border-purple-500/30 text-xs">
                2
              </span>
              <div>
                <p className="text-xs font-bold text-white">IA Reconhece a Peça</p>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                  A foto é associada automaticamente ao produto correspondente na sua vitrine.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 border border-emerald-500/30 text-xs">
                3
              </span>
              <div>
                <p className="text-xs font-bold text-white">Cliente Recebe o Link</p>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                  Quem comentar &quot;preço&quot; ou mandar DM recebe o link direto para comprar em segundos!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 2. Métricas Rápidas: O Dono Vê o Status em 1 Segundo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800">
          {/* Card Pendências (Destaque Maior) */}
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`p-3 rounded-xl border text-left transition-all ${
              totalPendencias > 0
                ? 'bg-amber-500/15 border-amber-400/40 hover:bg-amber-500/25 ring-1 ring-amber-400/30'
                : 'bg-emerald-500/10 border-emerald-400/30 hover:bg-emerald-500/15'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
                Pendências da Loja
              </span>
              {totalPendencias > 0 ? (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              )}
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span
                className={`text-xl font-extrabold ${
                  totalPendencias > 0 ? 'text-amber-300' : 'text-emerald-300'
                }`}
              >
                {totalPendencias}
              </span>
              <span className="text-xs text-slate-300">
                {totalPendencias === 0 ? 'Tudo em dia' : totalPendencias === 1 ? 'Ação necessária' : 'Ações necessárias'}
              </span>
            </div>
          </button>

          {/* Card Produtos Ativos */}
          <button
            type="button"
            onClick={() => setActiveTab('products_active')}
            className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:bg-slate-800 text-left transition-colors"
          >
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Produtos na Vitrine
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-white">{products.length}</span>
              <span className="text-xs text-slate-400">ativos na IA</span>
            </div>
          </button>

          {/* Card Publicações Conectadas */}
          <button
            type="button"
            onClick={() => setActiveTab('matches')}
            className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:bg-slate-800 text-left transition-colors"
          >
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Posts Conectados
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-emerald-400">{autoMatched.length}</span>
              <span className="text-xs text-slate-400">respondendo</span>
            </div>
          </button>

          {/* Card Simulador */}
          <button
            type="button"
            onClick={() => setActiveTab('simulator')}
            className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:bg-slate-800 text-left transition-colors"
          >
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Atendente Virtual
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xs font-bold text-indigo-300">Testar Respostas ⚡</span>
            </div>
          </button>
        </div>
      </div>

      {/* 3. Navegação em Abas Simplificadas e Diretas */}
      <div className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 pt-3 border-b border-slate-200 overflow-x-auto bg-slate-50/60">
        {/* Aba 1: Pendências da Loja */}
        <button
          onClick={() => setActiveTab('pending')}
          className={`py-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
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
          <span>Pendências da Loja</span>
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

        {/* Aba 2: Produtos Ativos */}
        <button
          onClick={() => setActiveTab('products_active')}
          className={`py-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'products_active'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShoppingBag className="w-4 h-4 text-indigo-500" />
          <span>Produtos na Vitrine</span>
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-200/80 text-slate-700">
            {products.length}
          </span>
        </button>

        {/* Aba 3: Publicações Conectadas */}
        <button
          onClick={() => setActiveTab('matches')}
          className={`py-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'matches'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-500" />
          <span>Publicações Vinculadas</span>
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-200/80 text-slate-700">
            {autoMatched.length}
          </span>
        </button>

        {/* Aba 4: Testar Atendente */}
        <button
          onClick={() => setActiveTab('simulator')}
          className={`py-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'simulator'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <MessageCircle className="w-4 h-4 text-purple-500" />
          <span>Testar Respostas da IA ⚡</span>
        </button>
      </div>

      {/* 4. Conteúdo das Abas */}
      <div className="p-5 sm:p-6">
        {/* ======================================================== */}
        {/* ABA 1: CENTRAL DE PENDÊNCIAS (Foco total do dono)        */}
        {/* ======================================================== */}
        {activeTab === 'pending' && (
          <div className="space-y-6">
            {totalPendencias === 0 ? (
              <div className="text-center py-12 px-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Tudo em dia! Nenhuma pendência para resolver</h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto mt-1 leading-relaxed">
                  Sua vitrine e seu atendente virtual estão 100% atualizados. Quando você postar Stories com peças novas ou clientes solicitarem preços, as aprovações rápidas aparecerão aqui.
                </p>
                <div className="mt-4 flex items-center justify-center gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveTab('products_active')}
                    className="text-xs text-slate-700 bg-white"
                  >
                    Ver Produtos na Vitrine
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={triggerSync}
                    isLoading={syncing}
                    className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    Checar Novas Publicações Agora
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 1.1 Preços de Stories Solicitados por Clientes */}
                {pendingPrices.length > 0 && (
                  <div className="p-4 sm:p-5 rounded-xl bg-amber-50 border border-amber-300 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
                        <h4 className="font-bold text-sm text-amber-950">
                          Preços Solicitados por Clientes nos Stories ({pendingPrices.length})
                        </h4>
                      </div>
                      <span className="text-[11px] text-amber-800 font-medium">
                        Digite o valor uma única vez • A IA responde o cliente e salva na vitrine
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {pendingPrices.map((req) => {
                        const currentInput = priceInputs[req.id] !== undefined ? priceInputs[req.id] : '';
                        return (
                          <div
                            key={req.id}
                            className="p-3.5 rounded-lg bg-white border border-amber-200 shadow-sm flex flex-col justify-between space-y-3"
                          >
                            <div className="flex items-start gap-3">
                              {req.product_image_url ? (
                                <img
                                  src={req.product_image_url}
                                  alt={req.product_title}
                                  className="w-14 h-14 object-cover rounded-lg border border-slate-200 shrink-0"
                                />
                              ) : (
                                <div className="w-14 h-14 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800 font-bold text-xs shrink-0">
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
                                  className="w-full pl-8 pr-3 py-1.5 text-xs font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-1 focus:ring-slate-900 focus:outline-none"
                                />
                              </div>
                              <Button
                                variant="primary"
                                size="sm"
                                isLoading={confirmingPriceId === req.id}
                                onClick={() => handleConfirmPrice(req)}
                                rightIcon={<Send className="w-3 h-3" />}
                                className="bg-amber-600 hover:bg-amber-500 text-white font-medium"
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

                {/* 1.2 Dúvidas de Identificação de Fotos */}
                {pendingPhotoMatches.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        Confirmação de Peça Postada ({pendingPhotoMatches.length})
                      </h4>
                      <span className="text-xs text-slate-500">
                        Clique em &quot;É este ✓&quot; para ensinar a IA
                      </span>
                    </div>

                    {pendingPhotoMatches.map((rel) => (
                      <div
                        key={rel.id}
                        className="p-4 border border-amber-200 bg-amber-50/50 rounded-xl flex flex-col md:flex-row gap-4 items-start"
                      >
                        <div className="w-full md:w-36 shrink-0">
                          <div className="relative aspect-[4/5] rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
                            <img
                              src={
                                rel.media?.media_url ||
                                rel.media?.thumbnail_url ||
                                'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800'
                              }
                              alt="Story/Post"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-black/70 backdrop-blur-md rounded text-[9px] font-bold text-white uppercase">
                              {rel.media?.media_type || 'STORY'}
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-1 line-clamp-1 italic">
                            &quot;{rel.media?.caption || 'Publicação sem legenda'}&quot;
                          </p>
                        </div>

                        <div className="flex-1 w-full">
                          <p className="text-xs font-semibold text-slate-700 mb-2">
                            Qual peça você publicou nesta foto?
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {(rel.candidates || []).slice(0, 2).map((cand) => (
                              <div
                                key={cand.product_id}
                                className="p-3 bg-white rounded-lg border border-slate-200 hover:border-indigo-400 transition-all shadow-sm flex items-center justify-between gap-3"
                              >
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-900 truncate">
                                    {cand.title}
                                  </p>
                                  <p className="text-[11px] text-slate-500">
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

                {/* 1.3 Novas Peças Detectadas no Instagram */}
                {suggestedNew.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        <PlusCircle className="w-4 h-4 text-blue-500" />
                        Novas Peças Detectadas nos Stories ({suggestedNew.length})
                      </h4>
                      <span className="text-xs text-slate-500">
                        Cadastre na vitrine em 1 clique
                      </span>
                    </div>

                    {suggestedNew.map((rel) => (
                      <div
                        key={rel.id}
                        className="p-4 border border-blue-200 bg-blue-50/40 rounded-xl flex flex-col md:flex-row gap-4 items-start"
                      >
                        <div className="w-full md:w-36 aspect-[4/5] rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
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
                            Nova Peça Encontrada
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
                              variant="primary"
                              leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
                              className="bg-blue-600 hover:bg-blue-500 text-white text-xs shadow-sm"
                              onClick={() => openCreateModal(rel)}
                            >
                              Cadastrar na Vitrine (1 Clique)
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              isLoading={dismissingId === rel.id}
                              leftIcon={<X className="w-3.5 h-3.5 text-slate-400" />}
                              className="text-slate-600 hover:text-slate-900 border-slate-300 text-xs hover:bg-slate-100"
                              onClick={() => handleDismissRelation(rel.id)}
                            >
                              Apenas Conteúdo / Não é Produto
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

        {/* ======================================================== */}
        {/* ABA 2: PRODUTOS ATIVOS NA IA (Antes Memória de Fotos)   */}
        {/* ======================================================== */}
        {activeTab === 'products_active' && (
          <div className="space-y-5">
            <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs text-indigo-900 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold">Como a IA reconhece esses produtos:</strong> As fotos cadastradas abaixo são usadas pelo robô de atendimento. Quando você postar uma foto no Instagram parecida com essas peças, a IA reconhece o produto na hora e manda o link de compra com preço para o cliente.
              </div>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-12 px-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Nenhum produto cadastrado ainda</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Adicione produtos pelo botão &quot;Adicionar Novo Produto&quot; ou faça upload de planilha via CSV / Excel.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((prod) => {
                  return (
                    <div
                      key={prod.id}
                      className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                            {prod.category || 'Geral'}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <Check className="w-3 h-3 text-emerald-600" />
                            IA Ativa
                          </span>
                        </div>

                        <div className="aspect-[4/3] rounded-lg overflow-hidden bg-slate-100 mb-3 border border-slate-200">
                          {prod.image_url ? (
                            <img
                              src={prod.image_url}
                              alt={prod.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <Package className="w-8 h-8" />
                            </div>
                          )}
                        </div>

                        <h4 className="font-bold text-slate-900 text-sm">{prod.title}</h4>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                          {prod.canonical_description || prod.description || 'Sem descrição'}
                        </p>

                        {/* Estoque */}
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-slate-500">Estoque:</span>
                          <span className="font-semibold text-slate-800">
                            {prod.stock_quantity ?? 1} unidades
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900 text-sm">
                          R$ {(prod.price_cents / 100).toFixed(2).replace('.', ',')}
                        </span>
                        <a
                          href={buildProductCleanUrl('', 'minha-loja', prod)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1"
                        >
                          Ver na Vitrine <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* ABA 3: PUBLICAÇÕES VINCULADAS COM SUCESSO               */}
        {/* ======================================================== */}
        {activeTab === 'matches' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500 font-medium">
              Stories e postagens que já foram identificados e estão conectados ao catálogo da loja:
            </p>

            {autoMatched.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                <Sparkles className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <h4 className="font-bold text-slate-900 text-sm">Nenhuma publicação conectada ainda</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Assim que você postar novos Stories com as peças da sua vitrine, eles aparecerão aqui vinculados automaticamente.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {autoMatched.map((rel) => (
                  <div
                    key={rel.id}
                    className="p-3.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50/50 transition-colors flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-14 rounded-md overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
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
                          <span className="font-bold text-xs text-slate-900">
                            {rel.product?.title || 'Produto Conectado'}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            VINCULADO ({(rel.confidence * 100).toFixed(0)}%)
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {rel.media?.canonical_description || rel.media?.caption || 'Story vinculado'}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Instagram Post • Status: Ativo e respondendo
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md">
                        {rel.product?.price_cents
                          ? `R$ ${(rel.product.price_cents / 100).toFixed(2).replace('.', ',')}`
                          : 'Preço Definido'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* ABA 4: TESTAR RESPOSTAS DA IA (Simulador)               */}
        {/* ======================================================== */}
        {activeTab === 'simulator' && (
          <div className="max-w-2xl mx-auto space-y-5">
            <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 leading-relaxed">
              <strong className="font-semibold">Simule o Direct do Instagram:</strong> Digite uma mensagem de teste como cliente e veja a resposta instantânea que a IA enviará com estoque real e link de compra.
            </div>

            <div className="space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mensagem do cliente no Instagram Direct:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={simText}
                    onChange={(e) => setSimText(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                    placeholder="Ex: Tem tamanho M? / Qual o valor? / Quero comprar"
                  />
                  <Button
                    size="md"
                    variant="primary"
                    isLoading={simLoading}
                    onClick={runCustomerSimulation}
                    className="bg-purple-600 hover:bg-purple-500 text-white shrink-0 text-xs"
                  >
                    Simular Resposta
                  </Button>
                </div>
              </div>

              {/* Botões Rápidos */}
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="text-xs text-slate-400 self-center">Testes rápidos:</span>
                <button
                  type="button"
                  onClick={() => setSimText('Tem no tamanho M?')}
                  className="text-xs px-2.5 py-1 bg-white border border-slate-200 rounded-md hover:bg-slate-100 text-slate-700"
                >
                  &quot;Tem no tamanho M?&quot;
                </button>
                <button
                  type="button"
                  onClick={() => setSimText('Qual o valor dessa peça?')}
                  className="text-xs px-2.5 py-1 bg-white border border-slate-200 rounded-md hover:bg-slate-100 text-slate-700"
                >
                  &quot;Qual o valor dessa peça?&quot;
                </button>
                <button
                  type="button"
                  onClick={() => setSimText('QUERO COMPRAR')}
                  className="text-xs px-2.5 py-1 bg-white border border-slate-200 rounded-md hover:bg-slate-100 text-slate-700"
                >
                  &quot;QUERO COMPRAR&quot;
                </button>
              </div>
            </div>

            {/* Resultado da Simulação */}
            {simResult && (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between text-xs">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Bot className="w-4 h-4 text-emerald-400" />
                    Resposta enviada ao cliente
                  </span>
                  <span className="text-[11px] text-emerald-400 font-medium">
                    Estoque Real Verificado
                  </span>
                </div>

                <div className="p-4 bg-white space-y-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 whitespace-pre-line leading-relaxed font-sans">
                    {simResult.replyText}
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
                    <div>
                      <p className="text-slate-400">Produto Identificado:</p>
                      <p className="font-semibold text-slate-900 mt-0.5">{simResult.productTitle || 'Geral'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Link de Compra:</p>
                      <a
                        href={simResult.productDirectLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:underline truncate block mt-0.5 font-medium"
                      >
                        Abrir Vitrine
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL DE CADASTRO DE PRODUTO EM 1 CLIQUE                */}
      {/* ======================================================== */}
      {modalRelation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Cadastrar Peça na Vitrine</h3>
                  <p className="text-xs text-slate-500">Defina o nome e valor para publicar</p>
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
              {/* Título */}
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

              {/* Preço e Categoria */}
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

              {/* Estoque */}
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

              {/* Descrição */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descrição (usada pela IA para responder dúvidas):
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
                  Salvar na Vitrine
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST FLUTUANTE */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2.5 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <p className="text-xs font-medium text-slate-100">{toastMessage}</p>
        </div>
      )}
    </div>
  );
}
