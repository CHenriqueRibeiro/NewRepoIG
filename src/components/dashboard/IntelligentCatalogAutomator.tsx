'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  RefreshCw,
  Eye,
  Layers,
  Zap,
  ShoppingBag,
  ExternalLink,
  MessageCircle,
  Database,
  ArrowRight,
  ShieldCheck,
  X,
  Briefcase,
  Package,
  Tag,
  Check,
  Info,
  FileText,
  Bot,
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

export default function IntelligentCatalogAutomator() {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [relations, setRelations] = useState<MediaRelationItem[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'matches' | 'suggested' | 'visual_memory' | 'simulator'>('pending');

  // Estado para cadastro de nova peça / serviço
  const [modalRelation, setModalRelation] = useState<MediaRelationItem | null>(null);
  const [formType, setFormType] = useState<'product' | 'service'>('product');
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
      const res = await fetch('/api/catalog/intelligent');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setProducts(data.products || []);
          setRelations(data.relations || []);
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
      }
    } catch (e) {
      console.error('Erro ao confirmar match:', e);
    } finally {
      setConfirmingId(null);
    }
  };

  const openCreateModal = (rel: MediaRelationItem) => {
    const caption = rel.media?.caption || '';
    const isTech = /\b(ia|ai|saas|software|dashboard|token|tokens|api|apis|observabilidade|gestao|gestão|custos|tecnologia|plano|planos|infraestrutura|llm|finops)\b/i.test(caption);

    setModalRelation(rel);
    setFormType(isTech ? 'service' : 'product');

    const firstLine = caption.split('\n')[0]?.replace(/[#@]/g, '').trim() || '';

    if (isTech) {
      setFormTitle(firstLine && firstLine.length < 60 ? firstLine : 'Plano & Serviço Digital');
      setFormCategory('Software e Tecnologia');
      setFormPrice('197,00');
      setFormStock('999');
      setFormDescription(caption.slice(0, 300) || 'Solução inteligente de atendimento e serviços digitais.');
    } else {
      setFormTitle(firstLine && firstLine.length < 50 ? firstLine : 'Nova Peça do Catálogo');
      setFormCategory('Vestuário');
      setFormPrice('149,90');
      setFormStock('10');
      setFormDescription(caption.slice(0, 250) || rel.media?.canonical_description || '');
    }
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
          stock_quantity: formType === 'service' ? 999 : (Number(formStock) || 1),
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
        setToastMessage(`"${createdTitle}" cadastrado com sucesso! Já está visível na sua vitrine.`);
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

  const pendingConfirmations = relations.filter((r) => r.match_status === 'pending_confirmation');
  const autoMatched = relations.filter((r) => r.match_status === 'auto_matched' || r.match_status === 'confirmed');
  const suggestedNew = relations.filter((r) => r.match_status === 'suggested_new');

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
      {/* 1. Header de Conexão com Instagram & Atendimento Automático */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Instagram Conectado & Ativo
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <Bot className="w-3.5 h-3.5 text-indigo-400" />
                Atendente IA em Tempo Real
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Conexão com Instagram & Atendimento Automático por IA
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Você publica suas fotos, Reels e Stories no Instagram normalmente. Nossa IA reconhece os produtos e serviços que você postou e responde a comentários e DMs de clientes em segundos com o link exato da sua vitrine.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={triggerSync}
              isLoading={syncing}
              leftIcon={<RefreshCw className="w-4 h-4" />}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium border-0 shadow-lg shadow-emerald-950/40"
            >
              Sincronizar Publicações Agora
            </Button>
          </div>
        </div>

        {/* Guia Visual em 3 Passos: Como Funciona na Prática */}
        <div className="mt-6 p-4 rounded-xl bg-slate-900/80 border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center shrink-0 border border-indigo-500/30 text-xs">
              1
            </div>
            <div>
              <p className="text-xs font-bold text-white">Você Posta no Instagram</p>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                Publique fotos, Reels ou Stories dos seus looks ou serviços no seu perfil.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 font-bold flex items-center justify-center shrink-0 border border-purple-500/30 text-xs">
              2
            </div>
            <div>
              <p className="text-xs font-bold text-white">IA Identifica o Item</p>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                A IA analisa a foto e associa ao item do seu catálogo automaticamente.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 border border-emerald-500/30 text-xs">
              3
            </div>
            <div>
              <p className="text-xs font-bold text-white">Cliente Recebe o Link em Segundos</p>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                Comentou "quero" ou "preço"? A IA envia o link direto para comprar ou agendar!
              </p>
            </div>
          </div>
        </div>

        {/* Métricas Rápidas Claras */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800">
          <div>
            <p className="text-xs text-slate-400">Itens no Catálogo</p>
            <p className="text-xl font-bold text-white mt-0.5">{products.length}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Publicações Conectadas</p>
            <p className="text-xl font-bold text-emerald-400 mt-0.5">{autoMatched.length}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Aguardando Confirmação</p>
            <p className="text-xl font-bold text-amber-400 mt-0.5">{pendingConfirmations.length}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Sugestões de Cadastro</p>
            <p className="text-xl font-bold text-blue-400 mt-0.5">{suggestedNew.length}</p>
          </div>
        </div>
      </div>

      {/* 2. Navegação em Abas com Nomes Claros */}
      <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3 px-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'pending'
              ? 'border-amber-500 text-amber-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
        >
          <AlertCircle className="w-4 h-4 text-amber-500" />
          Aguardando Confirmação ({pendingConfirmations.length})
        </button>

        <button
          onClick={() => setActiveTab('matches')}
          className={`pb-3 px-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'matches'
              ? 'border-emerald-500 text-emerald-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          Publicações Conectadas ({autoMatched.length})
        </button>

        <button
          onClick={() => setActiveTab('visual_memory')}
          className={`pb-3 px-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'visual_memory'
              ? 'border-indigo-500 text-indigo-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
        >
          <Layers className="w-4 h-4 text-indigo-500" />
          Memória de Fotos ({products.reduce((acc, p) => acc + (p.images?.length || 1), 0)} referências)
        </button>

        <button
          onClick={() => setActiveTab('suggested')}
          className={`pb-3 px-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'suggested'
              ? 'border-blue-500 text-blue-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
        >
          <PlusCircle className="w-4 h-4 text-blue-500" />
          Sugestões de Cadastro ({suggestedNew.length})
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          className={`pb-3 px-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'simulator'
              ? 'border-purple-500 text-purple-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
        >
          <Zap className="w-4 h-4 text-purple-500" />
          Testar Atendente da IA ⚡
        </button>
      </div>

      {/* 3. Conteúdo das Abas */}
      <div className="p-6">
        {/* ABA 1: DÚVIDAS PENDENTES (Confirmação de 1 Clique) */}
        {activeTab === 'pending' && (
          <div>
            {pendingConfirmations.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-slate-900 text-base">Nenhuma dúvida pendente!</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
                  Todas as publicações recentes tiveram match forte com produtos do seu catálogo ou são novas peças já cadastradas.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">
                  A IA encontrou características visuais semelhantes entre mais de um produto. Escolha o correto para treinar a memória visual:
                </p>

                {pendingConfirmations.map((rel) => (
                  <div
                    key={rel.id}
                    className="p-5 border border-amber-200 bg-amber-50/40 rounded-xl flex flex-col md:flex-row gap-6 items-start"
                  >
                    {/* Imagem da Mídia do Instagram */}
                    <div className="w-full md:w-48 flex-shrink-0">
                      <div className="relative aspect-[4/5] rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
                        <img
                          src={rel.media?.media_url || rel.media?.thumbnail_url || 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800'}
                          alt="Story/Reel"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 backdrop-blur-md rounded text-[10px] font-bold text-white uppercase">
                          {rel.media?.media_type || 'STORY'}
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 mt-2 font-medium line-clamp-2">
                        "{rel.media?.caption || 'Publicação sem legenda'}"
                      </p>
                    </div>

                    {/* Comparação e Botões de Confirmação */}
                    <div className="flex-1 w-full">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold px-2 py-0.5 bg-amber-100 text-amber-800 rounded">
                          Dúvida Visual ({(rel.confidence * 100).toFixed(0)}% de semelhança)
                        </span>
                        <span className="text-xs text-slate-500">
                          {rel.match_reason}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 mb-3">
                        Qual é o produto correto publicado nesta imagem?
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        {(rel.candidates || []).slice(0, 2).map((cand, idx) => (
                          <div
                            key={cand.product_id}
                            className="p-3 bg-white rounded-lg border border-slate-200 hover:border-indigo-400 transition-all shadow-sm flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                                {idx + 1}
                              </span>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-900 truncate">
                                  {cand.title}
                                </p>
                                <p className="text-xs text-slate-500">
                                  Similaridade: {(cand.similarity * 100).toFixed(0)}%
                                </p>
                              </div>
                            </div>

                            <Button
                              size="sm"
                              variant="primary"
                              isLoading={confirmingId === rel.id}
                              onClick={() => confirmMatch(rel.id, cand.product_id)}
                              className="text-xs px-3 py-1.5 whitespace-nowrap bg-indigo-600 hover:bg-indigo-500 text-white"
                            >
                              É este ✓
                            </Button>
                          </div>
                        ))}
                      </div>

                      {/* Atributos Detectados pelo Vision */}
                      {rel.media?.extracted_attributes && (
                        <div className="p-3 bg-white/80 rounded-lg border border-slate-200 text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
                          <span><strong>Categoria:</strong> {rel.media.extracted_attributes.categoria || 'N/A'}</span>
                          <span><strong>Cor:</strong> {rel.media.extracted_attributes.cor_principal || 'N/A'}</span>
                          <span><strong>Gola:</strong> {rel.media.extracted_attributes.gola || 'N/A'}</span>
                          <span><strong>Manga:</strong> {rel.media.extracted_attributes.manga || 'N/A'}</span>
                          <span><strong>Modelagem:</strong> {rel.media.extracted_attributes.modelagem || 'N/A'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ABA 2: MATCHES AUTOMÁTICOS */}
        {activeTab === 'matches' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">
              Publicações identificadas com 90%+ de certeza e vinculadas automaticamente ao catálogo:
            </p>

            {autoMatched.map((rel) => (
              <div
                key={rel.id}
                className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50/50 transition-colors flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-14 h-16 rounded-md overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                    <img
                      src={rel.media?.media_url || rel.media?.thumbnail_url || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800'}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900">
                        {rel.product?.title || 'Produto Conectado'}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        MATCH AUTOMÁTICO ({(rel.confidence * 100).toFixed(0)}%)
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {rel.media?.canonical_description || rel.media?.caption || 'Story vinculado'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      ID Meta: <code className="text-slate-600">{rel.media?.instagram_media_id}</code> • Status: Ativo
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-full">
                    {rel.product?.price_cents ? `R$ ${(rel.product.price_cents / 100).toFixed(2).replace('.', ',')}` : 'Preço Definido'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ABA 3: MEMÓRIA VISUAL DOS PRODUTOS */}
        {activeTab === 'visual_memory' && (
          <div className="space-y-6">
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 leading-relaxed">
              <strong className="font-semibold">Como funciona a Memória Visual:</strong> Cada Story, Reel ou postagem confirmada é indexada ao produto no Supabase pgvector com HNSW. Quanto mais a loja publica, mais referências visuais o produto acumula, tornando os próximos reconhecimentos mais rápidos e infalíveis.
            </div>

            {products.length === 0 ? (
              <div className="text-center py-12 px-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-slate-900 text-base">Nenhum produto cadastrado ainda</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
                  Os produtos serão adicionados automaticamente à medida que você postar Stories ou cadastrar novas peças no catálogo.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((prod) => {
                  const imgCount = (prod.images?.length || 1);
                  return (
                    <div key={prod.id} className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                            {prod.category || 'Peça'}
                          </span>
                          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                            {imgCount} {imgCount === 1 ? 'referência visual' : 'referências visuais'}
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

                        <h4 className="font-bold text-slate-900 text-base">{prod.title}</h4>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {prod.canonical_description || prod.description}
                        </p>

                        {/* Estoque em tempo real do banco */}
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                            Estoque Real (Banco de Dados):
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {(prod.variants || []).map((v) => (
                              <span
                                key={v.id}
                                className={`text-xs px-2.5 py-1 rounded font-medium ${v.stock_quantity > 0
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200 line-through'
                                  }`}
                              >
                                {v.name}: {v.stock_quantity}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span>R$ {(prod.price_cents / 100).toFixed(2).replace('.', ',')}</span>
                        <a
                          href={buildProductCleanUrl('', 'minha-loja', prod)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1"
                        >
                          Ver no Catálogo <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ABA 4: NOVAS PEÇAS DETECTADAS */}
        {activeTab === 'suggested' && (
          <div className="space-y-4">
            {suggestedNew.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-slate-900 text-base">Nenhuma peça nova pendente de cadastro</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
                  Quando você postar um Story ou Reel de uma peça inédita que ainda não consta no catálogo, a IA irá preparar a ficha técnica automaticamente para você aprovar em 1 clique.
                </p>
              </div>
            ) : (
              suggestedNew.map((rel) => (
                <div
                  key={rel.id}
                  className="p-5 border border-blue-200 bg-blue-50/30 rounded-xl flex flex-col md:flex-row gap-6 items-start"
                >
                  <div className="w-full md:w-44 aspect-[4/5] rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                    <img
                      src={rel.media?.media_url || rel.media?.thumbnail_url || 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=800'}
                      alt="Nova Peça"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 w-full">
                    <span className="text-xs font-semibold px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                      Sugestão de Nova Peça
                    </span>
                    <h4 className="text-base font-bold text-slate-900 mt-2">
                      {rel.media?.caption || 'Peça Inédita Detectada no Feed'}
                    </h4>
                    <p className="text-xs text-slate-600 mt-1">
                      {rel.media?.canonical_description}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <Button
                        size="sm"
                        variant="primary"
                        leftIcon={<PlusCircle className="w-4 h-4" />}
                        className="bg-blue-600 hover:bg-blue-500 text-white shadow-sm"
                        onClick={() => openCreateModal(rel)}
                      >
                        Cadastrar no Catálogo (1 Clique)
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        isLoading={dismissingId === rel.id}
                        leftIcon={<X className="w-4 h-4 text-slate-400" />}
                        className="text-slate-600 hover:text-slate-900 border-slate-300 hover:bg-slate-100"
                        onClick={() => handleDismissRelation(rel.id)}
                      >
                        Apenas Conteúdo / Não é Produto
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ABA 5: SIMULADOR DE ATENDIMENTO COM IA (Teste Instantâneo) */}
        {activeTab === 'simulator' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 leading-relaxed">
              <strong className="font-semibold">Simule a experiência do cliente:</strong> Digite uma dúvida como "Tem tamanho M?", "Qual o valor?" ou "Quero comprar" simulando uma resposta a um Story ou mensagem no Direct. Observe como o sistema consulta o banco de dados diretamente sem gastar tokens repetidos de visão ou HNSW!
            </div>

            <div className="space-y-4 bg-slate-50 p-6 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Story em exibição (URL da imagem ou publicação do Instagram):
                </label>
                <input
                  type="text"
                  value={simStoryUrl}
                  onChange={(e) => setSimStoryUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  placeholder="URL do Story ou Post"
                />
              </div>

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
                    placeholder="ex: Tem M? / Quanto custa? / Quero aquela blusa amarela"
                  />
                  <Button
                    size="md"
                    variant="primary"
                    isLoading={simLoading}
                    onClick={runCustomerSimulation}
                    className="bg-purple-600 hover:bg-purple-500 text-white"
                  >
                    Simular Resposta
                  </Button>
                </div>
              </div>

              {/* Botões Rápidos de Teste */}
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="text-xs text-slate-400 self-center">Testes rápidos:</span>
                <button
                  type="button"
                  onClick={() => setSimText('Tem no tamanho M?')}
                  className="text-xs px-2.5 py-1 bg-white border border-slate-200 rounded-md hover:bg-slate-100 text-slate-700"
                >
                  "Tem no tamanho M?" (M = 0 indisponível)
                </button>
                <button
                  type="button"
                  onClick={() => setSimText('Tem no tamanho P?')}
                  className="text-xs px-2.5 py-1 bg-white border border-slate-200 rounded-md hover:bg-slate-100 text-slate-700"
                >
                  "Tem no tamanho P?" (P = 2 disponível)
                </button>
                <button
                  type="button"
                  onClick={() => setSimText('QUERO')}
                  className="text-xs px-2.5 py-1 bg-white border border-slate-200 rounded-md hover:bg-slate-100 text-slate-700"
                >
                  "QUERO" (Link direto de compra)
                </button>
                <button
                  type="button"
                  onClick={() => setSimText('Quero aquela blusa amarela que você postou ontem')}
                  className="text-xs px-2.5 py-1 bg-white border border-slate-200 rounded-md hover:bg-slate-100 text-slate-700"
                >
                  "Aquela blusa amarela de ontem" (HNSW pgvector)
                </button>
              </div>
            </div>

            {/* Resultado da Simulação */}
            {simResult && (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between text-xs">
                  <span className="font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Resposta Gerada com Estoque Real
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${simResult.cachedAvoidedAiExecution
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    }`}>
                    {simResult.cachedAvoidedAiExecution ? '⚡ IA Poupada (Cache de Contexto)' : '🔍 HNSW pgvector Ativado'}
                  </span>
                </div>

                <div className="p-5 bg-white space-y-4">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                      Texto enviado no Direct:
                    </p>
                    <div className="mt-1.5 p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 whitespace-pre-line leading-relaxed font-sans">
                      {simResult.replyText}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
                    <div>
                      <p className="text-slate-400">Produto Identificado:</p>
                      <p className="font-semibold text-slate-900 mt-0.5">{simResult.productTitle || 'Geral'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Origem do Processamento:</p>
                      <p className="font-mono text-indigo-600 mt-0.5">{simResult.processingSource}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Deep Link Direto:</p>
                      <a
                        href={simResult.productDirectLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-600 hover:underline truncate block mt-0.5"
                      >
                        Abrir Produto
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL DE CADASTRO DE PRODUTO / SERVIÇO */}
      {modalRelation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Cadastrar no Catálogo da Vitryne</h3>
                  <p className="text-xs text-slate-500">Defina se é um produto físico ou um serviço/plano digital</p>
                </div>
              </div>
              <button
                onClick={() => setModalRelation(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Seletor Tipo: Produto Físico vs Serviço / SaaS */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Tipo de Item à Venda:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFormType('product');
                      if (formStock === '999') setFormStock('10');
                      if (formCategory === 'Software e Tecnologia') setFormCategory('Vestuário');
                    }}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${formType === 'product'
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${formType === 'product' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Produto Físico</p>
                      <p className="text-[11px] text-slate-500">Roupas, calçados, bolsas, etc.</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormType('service');
                      setFormStock('999');
                      setFormCategory('Software e Tecnologia');
                    }}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${formType === 'service'
                        ? 'border-purple-600 bg-purple-50/60 ring-2 ring-purple-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${formType === 'service' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Serviço / SaaS</p>
                      <p className="text-[11px] text-slate-500">Planos, consultorias, assinaturas</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Título */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Título na Vitrine:
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  placeholder="Ex: Vestido Midi Floral ou Assinatura Digital"
                />
              </div>

              {/* Preço e Estoque / Categoria */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                      className="w-full pl-8 pr-3 py-2 text-sm font-semibold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
                    placeholder="Vestuário / SaaS"
                  />
                </div>

                <div className={formType === 'service' ? 'opacity-60 pointer-events-none' : ''}>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {formType === 'service' ? 'Disponibilidade:' : 'Estoque Inicial:'}
                  </label>
                  <input
                    type="text"
                    value={formType === 'service' ? 'Ilimitado' : formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    disabled={formType === 'service'}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    placeholder="10"
                  />
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descrição / Ficha Técnica (usada pela IA para responder clientes):
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
                  placeholder="Detalhes, benefícios, materiais ou o que está incluso..."
                />
              </div>

              {/* Dica para Posts que não são produtos */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p>
                  <strong>Este post é apenas uma dica ou conteúdo institucional?</strong> Se você não vende nada nesta publicação, clique em <em>"Não é um Produto"</em> para arquivá-lo sem poluir sua vitrine.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDismissRelation(modalRelation.id)}
                className="w-full sm:w-auto text-slate-600 hover:text-rose-600 hover:border-rose-300"
              >
                Não é um Produto (Apenas Conteúdo)
              </Button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setModalRelation(null)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={submittingProduct}
                  onClick={handleSaveProduct}
                  leftIcon={<Check className="w-4 h-4" />}
                  className="bg-blue-600 hover:bg-blue-500 text-white"
                >
                  Salvar no Catálogo
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST FLUTUANTE */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <p className="text-xs font-medium text-slate-100">{toastMessage}</p>
        </div>
      )}
    </div>
  );
}
