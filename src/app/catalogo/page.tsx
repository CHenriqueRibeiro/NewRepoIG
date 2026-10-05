'use client';

import React, { useState, useEffect } from 'react';
import { CatalogConfig, CatalogTemplate } from '@/lib/catalog/types';
import { getDefaultCatalog, TEMPLATES } from '@/lib/catalog/templates';
import TemplateSelector from '@/components/catalog/TemplateSelector';
import ProductManager from '@/components/catalog/ProductManager';
import ThemeCustomizer from '@/components/catalog/ThemeCustomizer';
import DiscountsAndShipping from '@/components/catalog/DiscountsAndShipping';
import BioLinkShare from '@/components/catalog/BioLinkShare';
import LivePhonePreview from '@/components/catalog/LivePhonePreview';
import {
  Wand2,
  ShoppingBag,
  Palette,
  Percent,
  Share2,
  Save,
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  Sparkles,
  ArrowLeft,
  Calendar,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import IntelligentCatalogAutomator from '@/components/dashboard/IntelligentCatalogAutomator';

type ActiveTab = 'templates' | 'products' | 'theme' | 'discounts' | 'share';

export default function CatalogBuilderPage() {
  const [config, setConfig] = useState<CatalogConfig>(getDefaultCatalog());
  const [hasChosenTemplate, setHasChosenTemplate] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('products');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [loading, setLoading] = useState(true);

  const currentTemplate = TEMPLATES.find((t) => t.id === config.templateId) || TEMPLATES[0];

  // Carrega configuração salva da API ou localStorage
  useEffect(() => {
    async function loadCatalog() {
      try {
        const res = await fetch('/api/catalog');
        const data = await res.json();
        if (data.catalog) {
          const cleanedProducts = (data.catalog.products || []).filter((p: any) => {
            const id = String(p?.id || '');
            return !id.startsWith('prod-') && !id.startsWith('tech-');
          });
          const cleanCatalog = {
            ...data.catalog,
            products: cleanedProducts,
          };

          // Se estiver com nome genérico ("Minha Loja"), vincula ao perfil real do Instagram
          if (
            !cleanCatalog.storeName ||
            cleanCatalog.storeName === 'Minha Loja' ||
            !cleanCatalog.slug ||
            cleanCatalog.slug === 'minha-loja'
          ) {
            try {
              const authRes = await fetch('/api/auth/instagram/status');
              const authData = await authRes.json();
              if (authData?.connected && authData?.account) {
                const profileName = authData.account.name || authData.account.username || 'Quota';
                const baseSlug = (authData.account.username || profileName)
                  .toLowerCase()
                  .replace(/^@/, '')
                  .replace(/[^a-z0-9-_]/g, '-');
                cleanCatalog.storeName = profileName;
                cleanCatalog.slug = baseSlug;
              }
            } catch (err) {
              console.warn('[CatalogPage] Falha ao sincronizar perfil:', err);
            }
          }

          setConfig(cleanCatalog);
          const isChosen = Boolean(
            data.catalog.templateChosen ||
            (typeof window !== 'undefined' && localStorage.getItem('vitryne_template_chosen') === 'true')
          );
          setHasChosenTemplate(isChosen);
          // Se o lojista já tiver escolhido o tipo, vai direto para a edição dos tópicos e produtos!
          // Caso contrário, mostra a tela de escolha de templates.
          setActiveTab(isChosen ? 'products' : 'templates');
        }
      } catch (e) {
        console.error('Erro ao buscar catálogo da API, usando local:', e);
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
  }, []);

  // Salvar alterações
  const handleSave = async (updatedConfig?: CatalogConfig) => {
    const toSave = updatedConfig || config;
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      // Salva no localStorage imediatamente
      if (typeof window !== 'undefined') {
        localStorage.setItem('vitryne_catalog_config', JSON.stringify(toSave));
      }

      // Envia para API
      const res = await fetch('/api/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toSave),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      console.error('Erro ao salvar catálogo:', e);
    } finally {
      setIsSaving(false);
    }
  };

  // Aplicar Template e transicionar automaticamente para os tópicos
  const handleSelectTemplate = (template: CatalogTemplate) => {
    const updated: CatalogConfig = {
      ...template.config,
      // Preserva o slug e whatsapp se já estiverem customizados
      slug: config.slug || template.config.slug,
      whatsapp: config.whatsapp || template.config.whatsapp,
      templateChosen: true,
      products: [], // Garante zero produtos mockados
    };
    setConfig(updated);
    setHasChosenTemplate(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vitryne_template_chosen', 'true');
      localStorage.setItem('vitryne_catalog_config', JSON.stringify(updated));
    }
    handleSave(updated);
    setActiveTab('products'); // Abre direto a edição dos tópicos e produtos!
  };

  const isServices = config.businessType === 'services';

  // Abas: se já escolheu o tipo, mostra direto 'Serviços & Procedimentos' ou 'Tópicos & Produtos' como aba inicial
  const tabs = hasChosenTemplate
    ? [
      {
        id: 'products' as ActiveTab,
        label: isServices ? 'Serviços & Procedimentos' : 'Tópicos & Produtos',
        icon: isServices ? Calendar : ShoppingBag,
        count: config.products?.length || 0,
      },
      { id: 'theme' as ActiveTab, label: 'Cores & Visual', icon: Palette },
      {
        id: 'discounts' as ActiveTab,
        label: isServices ? 'Agendamento & Horários' : 'Descontos & Frete',
        icon: isServices ? Clock : Percent,
      },
      { id: 'share' as ActiveTab, label: 'Link da Bio & QR Code', icon: Share2 },
    ]
    : [
      { id: 'templates' as ActiveTab, label: '1. Escolher Tipo de Catálogo', icon: Wand2, count: 10 },
      {
        id: 'products' as ActiveTab,
        label: isServices ? '2. Serviços & Procedimentos' : '2. Tópicos & Produtos',
        icon: isServices ? Calendar : ShoppingBag,
        count: config.products?.length || 0,
      },
      { id: 'theme' as ActiveTab, label: 'Cores & Visual', icon: Palette },
      {
        id: 'discounts' as ActiveTab,
        label: isServices ? 'Agendamento & Horários' : 'Descontos & Frete',
        icon: isServices ? Clock : Percent,
      },
      { id: 'share' as ActiveTab, label: 'Link da Bio & QR Code', icon: Share2 },
    ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading font-extrabold text-2xl text-slate-900 tracking-tight">
              Catálogo
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Link da Bio
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gerencie os tópicos, categorias e produtos da sua vitrine online, configure descontos e compartilhe na bio do Instagram.
          </p>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Seletor rápido para trocar o tipo de catálogo */}
          {hasChosenTemplate && (
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'templates' ? 'products' : 'templates')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all shadow-xs ${activeTab === 'templates'
                  ? 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-600/20'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              title="Clique para alterar o modelo/tipo de catálogo"
            >
              <Wand2 className={`w-3.5 h-3.5 ${activeTab === 'templates' ? 'text-white' : 'text-indigo-600'}`} />
              <span className="hidden sm:inline text-slate-400 font-normal">Tipo:</span>
              <span>{currentTemplate.name}</span>
              <span className={`text-[10px] ml-0.5 font-semibold underline ${activeTab === 'templates' ? 'text-indigo-100' : 'text-indigo-600'
                }`}>
                {activeTab === 'templates' ? 'Selecionando' : 'Alterar'}
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="hidden xl:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showPreview ? 'Ocultar Preview' : 'Ver Preview'}</span>
          </button>

          <a
            href={`/${config.slug || 'minha-loja'}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            <span>Ver Vitrine Pública</span>
          </a>

          <Button
            variant="primary"
            size="sm"
            isLoading={isSaving}
            leftIcon={
              saveSuccess ? (
                <Check className="w-3.5 h-3.5 text-emerald-300 stroke-[3]" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )
            }
            onClick={() => handleSave()}
          >
            {saveSuccess ? 'Salvo!' : 'Salvar Alterações'}
          </Button>
        </div>
      </div>

      {/* Navegação por Abas */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              type="button"
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-slate-200/80'
                }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-300' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Conteúdo Principal com Layout Split (Editor + Live Preview) */}
      <div className="flex flex-col xl:flex-row items-start gap-8">
        {/* Lado Esquerdo: Área de Edição da Aba Ativa */}
        <div className="flex-1 w-full min-w-0">
          {activeTab === 'templates' && (
            <div className="space-y-4">
              {hasChosenTemplate && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-indigo-50 border border-indigo-200/80 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                      <Wand2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-indigo-950">
                        Alterar Modelo do Catálogo
                      </h4>
                      <p className="text-[11px] sm:text-xs text-indigo-700">
                        Modelo em uso: <strong>{currentTemplate.name}</strong>. Ao clicar em outro modelo, as cores e estrutura de tópicos serão adaptadas.
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
                    className="bg-white hover:bg-slate-50 text-slate-700 border-slate-300 text-xs shrink-0"
                    onClick={() => setActiveTab('products')}
                  >
                    Voltar para Tópicos & Produtos
                  </Button>
                </div>
              )}
              <TemplateSelector
                currentTemplateId={config.templateId}
                onSelectTemplate={handleSelectTemplate}
              />
            </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-6">
              {/* Sincronização Inteligente do Catálogo & Central de Pendências */}
              <IntelligentCatalogAutomator />

              <ProductManager
                businessType={config.businessType}
                schedulingConfig={config.scheduling || config.schedulingConfig}
                products={config.products || []}
                topics={config.topics || []}
                topicIcons={config.topicIcons || {}}
                outOfStockBehavior={config.outOfStockBehavior || 'badge-sold-out'}
                wholesaleConfig={
                  config.wholesaleConfig || {
                    enabled: true,
                    minPieces: 6,
                    defaultDiscountPercent: 35,
                    requireMinPieces: true,
                  }
                }
                onChangeProducts={(newProducts) => {
                  const updated = { ...config, products: newProducts };
                  setConfig(updated);
                  handleSave(updated);
                }}
                onChangeTopics={(newTopics) => {
                  const updated = { ...config, topics: newTopics };
                  setConfig(updated);
                  handleSave(updated);
                }}
                onChangeTopicIcons={(newTopicIcons) => {
                  const updated = { ...config, topicIcons: newTopicIcons };
                  setConfig(updated);
                  handleSave(updated);
                }}
                onChangeOutOfStockBehavior={(newBehavior) => {
                  const updated = { ...config, outOfStockBehavior: newBehavior };
                  setConfig(updated);
                  handleSave(updated);
                }}
                onChangeWholesaleConfig={(newWholesale) => {
                  const updated = { ...config, wholesaleConfig: newWholesale };
                  setConfig(updated);
                  handleSave(updated);
                }}
                pinBadgedProductsToTop={config.pinBadgedProductsToTop ?? true}
                onChangePinBadgedProductsToTop={(newPin) => {
                  const updated = { ...config, pinBadgedProductsToTop: newPin };
                  setConfig(updated);
                  handleSave(updated);
                }}
              />
            </div>
          )}

          {activeTab === 'theme' && (
            <ThemeCustomizer
              config={config}
              onChangeConfig={(newConfig) => {
                setConfig(newConfig);
                handleSave(newConfig);
              }}
            />
          )}

          {activeTab === 'discounts' && (
            <DiscountsAndShipping
              config={config}
              onChangeConfig={(newConfig) => {
                setConfig(newConfig);
                handleSave(newConfig);
              }}
            />
          )}

          {activeTab === 'share' && <BioLinkShare config={config} />}
        </div>

        {/* Lado Direito: Preview Celular Interativo */}
        {showPreview && (
          <div className="hidden xl:block w-[360px] shrink-0 sticky top-24">
            <LivePhonePreview config={config} />
          </div>
        )}
      </div>
    </div>
  );
}
