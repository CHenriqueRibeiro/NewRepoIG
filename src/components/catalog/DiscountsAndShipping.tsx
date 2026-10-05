'use client';

import React, { useState, useMemo } from 'react';
import { CatalogConfig, ProgressiveDiscountRule, ShippingConfig } from '@/lib/catalog/types';
import { getMotoboyCutoffInfo } from '@/lib/catalog/shipping-helpers';
import {
  Percent,
  Truck,
  Plus,
  Trash2,
  Clock,
  Sparkles,
  MapPin,
  CheckCircle2,
  Zap,
  Layers,
  FolderTree,
  ListChecks,
  Search,
  Package,
  ShoppingBag,
  Bike,
  AlertTriangle,
  Calendar,
  Users,
  MessageCircle,
  Home,
  Coffee,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  calculateAvailableTimeSlots,
  formatWorkingDaysSummary,
  WEEKDAYS_MAP,
} from '@/lib/catalog/service-helpers';

interface DiscountsAndShippingProps {
  config: CatalogConfig;
  onChangeConfig: (newConfig: CatalogConfig) => void;
}

export default function DiscountsAndShipping({
  config,
  onChangeConfig,
}: DiscountsAndShippingProps) {
  const { progressiveDiscounts, shipping, globalScheduledDiscount } = config;
  const isServices = config.businessType === 'services';
  
  const rawSched = config.scheduling || config.schedulingConfig;
  const scheduling = useMemo(() => {
    const openTime = rawSched?.openTime || '09:00';
    const closeTime = rawSched?.closeTime || '18:00';
    const hasBreak = rawSched?.hasBreak ?? true;
    const breakStartTime = rawSched?.breakStartTime || '12:00';
    const breakEndTime = rawSched?.breakEndTime || '13:00';
    const slotIntervalMinutes = rawSched?.slotIntervalMinutes || 15;
    const workingDays = rawSched?.workingDays || ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    const defaultSlots = rawSched?.timeSlots && rawSched.timeSlots.length > 0
      ? rawSched.timeSlots
      : calculateAvailableTimeSlots({
          enabled: true,
          openTime,
          closeTime,
          hasBreak,
          breakStartTime,
          breakEndTime,
          slotIntervalMinutes,
        });

    return {
      enabled: rawSched?.enabled ?? true,
      bookingMode: (rawSched?.bookingMode || 'appointment') as 'appointment' | 'queue',
      allowMultipleBookings: rawSched?.allowMultipleBookings ?? true,
      openTime,
      closeTime,
      hasBreak,
      breakStartTime,
      breakEndTime,
      slotIntervalMinutes,
      workingDays,
      businessHours: rawSched?.businessHours || `${formatWorkingDaysSummary(workingDays)} das ${openTime} às ${closeTime}`,
      timeSlots: defaultSlots,
      serviceNotice: rawSched?.serviceNotice || '',
    };
  }, [rawSched]);

  const updateScheduling = (fields: Record<string, any>, recalculateSlots = false) => {
    const next = {
      ...scheduling,
      ...fields,
    };

    if (recalculateSlots) {
      next.timeSlots = calculateAvailableTimeSlots(next, next.slotIntervalMinutes);
      const daysSummary = formatWorkingDaysSummary(next.workingDays);
      const breakSummary = next.hasBreak ? ` (Pausa: ${next.breakStartTime} às ${next.breakEndTime})` : '';
      next.businessHours = `${daysSummary} das ${next.openTime} às ${next.closeTime}${breakSummary}`;
    }

    onChangeConfig({
      ...config,
      scheduling: next,
      schedulingConfig: next,
    });
  };

  const [productSearch, setProductSearch] = useState('');
  const [newTimeSlotInput, setNewTimeSlotInput] = useState('');

  // 1. Atualizar Descontos Progressivos
  const handleAddDiscountRule = () => {
    const nextMin =
      progressiveDiscounts.length > 0
        ? progressiveDiscounts[progressiveDiscounts.length - 1].minItems + 1
        : 2;
    const nextPercent =
      progressiveDiscounts.length > 0
        ? progressiveDiscounts[progressiveDiscounts.length - 1].discountPercent + 5
        : 10;

    const newRule: ProgressiveDiscountRule = {
      minItems: nextMin,
      discountPercent: nextPercent,
      label: isServices
        ? `Agende ${nextMin} serviços e ganhe ${nextPercent}% OFF`
        : `Compre ${nextMin} peças e ganhe ${nextPercent}% OFF`,
    };

    onChangeConfig({
      ...config,
      progressiveDiscounts: [...progressiveDiscounts, newRule],
    });
  };

  const handleUpdateDiscountRule = (
    index: number,
    field: keyof ProgressiveDiscountRule,
    value: any
  ) => {
    const updated = [...progressiveDiscounts];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    if (field === 'minItems' || field === 'discountPercent') {
      updated[index].label = `Compre ${updated[index].minItems} peças e ganhe ${updated[index].discountPercent}% OFF`;
    }
    onChangeConfig({
      ...config,
      progressiveDiscounts: updated,
    });
  };

  const handleRemoveDiscountRule = (index: number) => {
    onChangeConfig({
      ...config,
      progressiveDiscounts: progressiveDiscounts.filter((_, i) => i !== index),
    });
  };

  // 2. Atualizar Frete
  const updateShipping = (field: keyof ShippingConfig, value: any) => {
    onChangeConfig({
      ...config,
      shipping: {
        ...config.shipping,
        [field]: value,
      },
    });
  };

  // 3. Atualizar Promoção Agendada Global
  const updateGlobalDiscount = (field: string, value: any) => {
    onChangeConfig({
      ...config,
      globalScheduledDiscount: {
        enabled: config.globalScheduledDiscount?.enabled ?? false,
        bannerTitle:
          config.globalScheduledDiscount?.bannerTitle ?? 'OFERTA RELÂMPAGO • Desconto Especial',
        discountPercent: config.globalScheduledDiscount?.discountPercent ?? 10,
        endsAt:
          config.globalScheduledDiscount?.endsAt ??
          new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        applyTo: config.globalScheduledDiscount?.applyTo ?? 'all',
        targetTopic: config.globalScheduledDiscount?.targetTopic ?? '',
        targetProductIds: config.globalScheduledDiscount?.targetProductIds ?? [],
        [field]: value,
      },
    });
  };

  // 4. Atualizar Modalidade de Atacado
  const updateWholesaleConfig = (field: string, value: any) => {
    onChangeConfig({
      ...config,
      wholesaleConfig: {
        enabled: config.wholesaleConfig?.enabled ?? true,
        ruleType: config.wholesaleConfig?.ruleType ?? 'cart_pieces',
        minPieces: config.wholesaleConfig?.minPieces ?? 6,
        minValue: config.wholesaleConfig?.minValue ?? 300,
        defaultDiscountPercent: config.wholesaleConfig?.defaultDiscountPercent ?? 35,
        requireMinPieces: config.wholesaleConfig?.requireMinPieces ?? true,
        [field]: value,
      },
    });
  };

  // Lista de tópicos / categorias existentes
  const availableTopics = useMemo(() => {
    const set = new Set<string>();
    (config.topics || []).forEach((t) => {
      const trimmed = t.trim();
      if (trimmed) set.add(trimmed);
    });
    (config.products || []).forEach((p) => {
      const trimmed = (p.category || '').trim();
      if (trimmed) set.add(trimmed);
    });
    return Array.from(set);
  }, [config.topics, config.products]);

  // Contagem de produtos no tópico selecionado
  const topicProductsCount = useMemo(() => {
    const target = (globalScheduledDiscount?.targetTopic || '').trim().toUpperCase();
    if (!target) return 0;
    return (config.products || []).filter(
      (p) => (p.category || 'GERAL').trim().toUpperCase() === target
    ).length;
  }, [config.products, globalScheduledDiscount?.targetTopic]);

  // Helpers para seleção individual de produtos
  const toggleSelectProduct = (productId: string) => {
    const currentIds = globalScheduledDiscount?.targetProductIds ?? [];
    const newIds = currentIds.includes(productId)
      ? currentIds.filter((id) => id !== productId)
      : [...currentIds, productId];
    updateGlobalDiscount('targetProductIds', newIds);
  };

  const handleSelectAllProducts = () => {
    const allIds = (config.products || []).map((p) => p.id);
    updateGlobalDiscount('targetProductIds', allIds);
  };

  const handleClearAllProducts = () => {
    updateGlobalDiscount('targetProductIds', []);
  };

  // Produtos filtrados pela busca
  const filteredProductsForSelection = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    if (!term) return config.products || [];
    return (config.products || []).filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        (p.category && p.category.toLowerCase().includes(term))
    );
  }, [config.products, productSearch]);

  return (
    <div className="space-y-8">
      {/* 1. Desconto Progressivo */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Percent className="w-4 h-4 text-indigo-600" />
              <span>Desconto Progressivo (Aumente o Ticket Médio)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Incentive suas clientes a comprarem 2, 3 ou mais peças para desbloquear descontos crescentes.
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleAddDiscountRule}
          >
            Adicionar Faixa de Desconto
          </Button>
        </div>

        {/* Lista de Faixas */}
        {progressiveDiscounts.length === 0 ? (
          <div className="p-6 text-center rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
            Nenhum desconto progressivo ativo. Clique acima para adicionar a primeira regra.
          </div>
        ) : (
          <div className="space-y-3">
            {progressiveDiscounts.map((rule, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/70"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                  #{idx + 1}
                </div>

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600 font-medium">A partir de:</span>
                    <input
                      type="number"
                      min="1"
                      value={rule.minItems}
                      onChange={(e) =>
                        handleUpdateDiscountRule(idx, 'minItems', parseInt(e.target.value) || 1)
                      }
                      className="w-16 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-center bg-white"
                    />
                    <span className="text-xs text-slate-600">peças</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600 font-medium">Desconto:</span>
                    <input
                      type="number"
                      min="1"
                      max="90"
                      value={rule.discountPercent}
                      onChange={(e) =>
                        handleUpdateDiscountRule(
                          idx,
                          'discountPercent',
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-16 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-center bg-white text-emerald-700"
                    />
                    <span className="text-xs text-slate-600 font-bold">% OFF</span>
                  </div>

                  <div className="text-xs text-slate-500 italic truncate">
                    &quot;{rule.label}&quot;
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveDiscountRule(idx)}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                  title="Remover regra"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Dica */}
        <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-900">
          <Zap className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Gatilho Psicológico:</strong> Na sacola pública, a cliente verá uma barra dinâmica dizendo exatamente quantas peças faltam para atingir a próxima faixa de desconto!
          </div>
        </div>
      </div>

      {/* 2. Promoção Relâmpago Agendada (Contagem Regressiva & Ação) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-base text-slate-900">
              Agendamento de Oferta Relâmpago (Cronômetro no Topo)
            </h3>
          </div>
          <input
            type="checkbox"
            checked={globalScheduledDiscount?.enabled ?? false}
            onChange={(e) => updateGlobalDiscount('enabled', e.target.checked)}
            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
        </div>

        {globalScheduledDiscount?.enabled ? (
          <div className="space-y-5 pt-1">
            {/* Linha 1: Título, Desconto e Data de Término */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Texto da Faixa de Aviso
                </label>
                <input
                  type="text"
                  value={globalScheduledDiscount.bannerTitle}
                  onChange={(e) => updateGlobalDiscount('bannerTitle', e.target.value)}
                  placeholder="Ex: OFERTA RELÂMPAGO • Desconto Especial"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Desconto Relâmpago (% OFF)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={globalScheduledDiscount.discountPercent ?? 10}
                    onChange={(e) =>
                      updateGlobalDiscount(
                        'discountPercent',
                        Math.max(1, Math.min(90, parseInt(e.target.value) || 0))
                      )
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-indigo-900 pr-12 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                    % OFF
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Data e Hora do Término
                </label>
                <input
                  type="datetime-local"
                  value={
                    globalScheduledDiscount.endsAt
                      ? globalScheduledDiscount.endsAt.slice(0, 16)
                      : ''
                  }
                  onChange={(e) =>
                    updateGlobalDiscount('endsAt', new Date(e.target.value).toISOString())
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Linha 2: Ação da Oferta Relâmpago (Onde aplicar) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Ação / Onde Aplicar o Desconto Relâmpago:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Opção 1: Todos os Produtos */}
                <button
                  type="button"
                  onClick={() => updateGlobalDiscount('applyTo', 'all')}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    (globalScheduledDiscount.applyTo || 'all') === 'all'
                      ? 'border-indigo-600 bg-indigo-50/60 text-indigo-950 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span>Todos os Produtos</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Aplica o desconto em todas as peças do catálogo
                  </p>
                </button>

                {/* Opção 2: Todas as Peças do Tópico */}
                <button
                  type="button"
                  onClick={() => {
                    updateGlobalDiscount('applyTo', 'topic');
                    if (!globalScheduledDiscount.targetTopic && availableTopics.length > 0) {
                      updateGlobalDiscount('targetTopic', availableTopics[0]);
                    }
                  }}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    globalScheduledDiscount.applyTo === 'topic'
                      ? 'border-indigo-600 bg-indigo-50/60 text-indigo-950 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <FolderTree className="w-4 h-4 text-indigo-600" />
                    <span>Todas as Peças do Tópico</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Aplica em uma categoria/tópico específica
                  </p>
                </button>

                {/* Opção 3: Selecionar Produtos */}
                <button
                  type="button"
                  onClick={() => updateGlobalDiscount('applyTo', 'products')}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    globalScheduledDiscount.applyTo === 'products'
                      ? 'border-indigo-600 bg-indigo-50/60 text-indigo-950 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <ListChecks className="w-4 h-4 text-indigo-600" />
                    <span>Selecionar Produtos</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Escolha peças específicas da lista
                  </p>
                </button>
              </div>
            </div>

            {/* Sub-painel: Detalhes da Opção Selecionada */}
            {(globalScheduledDiscount.applyTo || 'all') === 'all' && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Todas as <strong>{(config.products || []).length} peças</strong> da loja receberão{' '}
                    <strong>{globalScheduledDiscount.discountPercent ?? 10}% OFF</strong> e o selo de Oferta Relâmpago.
                  </span>
                </div>
              </div>
            )}

            {globalScheduledDiscount.applyTo === 'topic' && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-slate-700">
                    Selecione o Tópico / Categoria participante:
                  </label>
                  <span className="text-[11px] text-indigo-700 font-medium bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-md">
                    {topicProductsCount} peça(s) encontrada(s) neste tópico
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {availableTopics.length === 0 ? (
                    <span className="text-xs text-slate-400">Nenhum tópico cadastrado no catálogo.</span>
                  ) : (
                    availableTopics.map((top) => {
                      const isCurrent =
                        (globalScheduledDiscount.targetTopic || '').trim().toUpperCase() ===
                        top.trim().toUpperCase();
                      return (
                        <button
                          key={top}
                          type="button"
                          onClick={() => updateGlobalDiscount('targetTopic', top)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            isCurrent
                              ? 'bg-indigo-600 text-white shadow-xs font-bold'
                              : 'bg-white text-slate-700 border border-slate-200 hover:border-indigo-300'
                          }`}
                        >
                          {top}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {globalScheduledDiscount.applyTo === 'products' && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                {/* Barra de Busca e Ações Rápidas */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Buscar peça por nome ou categoria..."
                      className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="flex items-center gap-2 justify-end">
                    <button
                      type="button"
                      onClick={handleSelectAllProducts}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold px-2 py-1"
                    >
                      Selecionar Todos
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={handleClearAllProducts}
                      className="text-xs text-slate-500 hover:text-slate-700 font-semibold px-2 py-1"
                    >
                      Limpar
                    </button>
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg">
                      {(globalScheduledDiscount.targetProductIds || []).length} selecionado(s)
                    </span>
                  </div>
                </div>

                {/* Lista com scroll */}
                <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100 bg-white rounded-lg border border-slate-200 p-2">
                  {filteredProductsForSelection.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      Nenhum produto encontrado.
                    </div>
                  ) : (
                    filteredProductsForSelection.map((prod) => {
                      const isSelected = (globalScheduledDiscount.targetProductIds || []).includes(
                        prod.id
                      );
                      const discountVal = globalScheduledDiscount.discountPercent ?? 10;
                      const discountedPrice = Math.round(prod.price * (1 - discountVal / 100) * 100) / 100;

                      return (
                        <div
                          key={prod.id}
                          onClick={() => toggleSelectProduct(prod.id)}
                          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors pt-2 ${
                            isSelected ? 'bg-indigo-50/60' : 'hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // tratado no onClick do container
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer pointer-events-none"
                          />

                          <img
                            src={
                              prod.images?.[0] ||
                              'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=100&auto=format&fit=crop&q=80'
                            }
                            alt={prod.name}
                            className="w-9 h-9 rounded-md object-cover bg-slate-100 shrink-0 border border-slate-200"
                          />

                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-medium text-slate-800 truncate">
                              {prod.name}
                            </h4>
                            <span className="text-[10px] text-slate-400 uppercase font-semibold">
                              {prod.category || 'Geral'}
                            </span>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs font-bold text-indigo-900 block">
                              R$ {discountedPrice.toFixed(2)}
                            </span>
                            <span className="text-[10px] text-slate-400 line-through">
                              R$ {prod.price.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-between text-xs text-amber-900">
              <span>Um cronômetro animado em tempo real e a faixa de aviso serão exibidos no topo da sua vitrine pública.</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            Marque a caixa acima para ativar uma oferta relâmpago com cronômetro regressivo no topo e descontos automáticos nas peças escolhidas (por tópico, produtos selecionados ou na loja inteira).
          </p>
        )}
      </div>

      {/* 3. Modalidade Atacado & Revenda (Apenas Produtos Físicos) */}
      {!isServices && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-600" />
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Modalidade Atacado & Revenda (B2B)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Permita que revendedoras e lojistas comprem em quantidade com preços especiais de atacado.
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={config.wholesaleConfig?.enabled !== false}
            onChange={(e) => updateWholesaleConfig('enabled', e.target.checked)}
            className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
          />
        </div>

        {config.wholesaleConfig?.enabled !== false ? (
          <div className="space-y-5 pt-1">
            {/* Opção da Regra: Por Item vs Valor Mínimo vs Quantidade Total */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Como aplicar a regra de atacado?
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Opção 1: Por Item */}
                <button
                  type="button"
                  onClick={() => updateWholesaleConfig('ruleType', 'per_item')}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    config.wholesaleConfig?.ruleType === 'per_item'
                      ? 'border-amber-600 bg-amber-50/60 text-amber-950 ring-2 ring-amber-500/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <ShoppingBag className="w-4 h-4 text-amber-600" />
                    <span>Por Item (Mínimo da Peça)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    O desconto é aplicado quando a quantidade daquela peça atingir o mínimo.
                  </p>
                </button>

                {/* Opção 2: Valor Mínimo do Pedido */}
                <button
                  type="button"
                  onClick={() => updateWholesaleConfig('ruleType', 'cart_value')}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    config.wholesaleConfig?.ruleType === 'cart_value'
                      ? 'border-amber-600 bg-amber-50/60 text-amber-950 ring-2 ring-amber-500/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <Percent className="w-4 h-4 text-amber-600" />
                    <span>Valor Mínimo do Pedido (R$)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Só libera o atacado se a compra total atingir o valor mínimo em reais (ex: R$ 300).
                  </p>
                </button>

                {/* Opção 3: Quantidade Total de Peças */}
                <button
                  type="button"
                  onClick={() => updateWholesaleConfig('ruleType', 'cart_pieces')}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    (!config.wholesaleConfig?.ruleType || config.wholesaleConfig?.ruleType === 'cart_pieces')
                      ? 'border-amber-600 bg-amber-50/60 text-amber-950 ring-2 ring-amber-500/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <Layers className="w-4 h-4 text-amber-600" />
                    <span>Qtd Total de Peças (Sortidas)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Só libera o atacado se somar a quantidade total de peças sortidas no carrinho (ex: 6 peças).
                  </p>
                </button>
              </div>
            </div>

            {/* Parâmetros do Atacado */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              {config.wholesaleConfig?.ruleType === 'cart_value' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Valor Mínimo do Pedido (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      R$
                    </span>
                    <input
                      type="number"
                      min="50"
                      step="50"
                      value={config.wholesaleConfig?.minValue || 300}
                      onChange={(e) =>
                        updateWholesaleConfig('minValue', Math.max(1, parseFloat(e.target.value) || 0))
                      }
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-amber-950 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              ) : config.wholesaleConfig?.ruleType === 'per_item' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Qtd Mínima Padrão Por Item
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={config.wholesaleConfig?.minPieces || 3}
                      onChange={(e) =>
                        updateWholesaleConfig('minPieces', Math.max(1, parseInt(e.target.value) || 1))
                      }
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-amber-950 pr-14 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                      unidades
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Qtd Mínima de Peças no Pedido
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={config.wholesaleConfig?.minPieces || 6}
                      onChange={(e) =>
                        updateWholesaleConfig('minPieces', Math.max(1, parseInt(e.target.value) || 1))
                      }
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-amber-950 pr-12 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                      peças
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Desconto Padrão de Atacado (% OFF)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="5"
                    max="80"
                    value={config.wholesaleConfig?.defaultDiscountPercent || 35}
                    onChange={(e) =>
                      updateWholesaleConfig(
                        'defaultDiscountPercent',
                        Math.max(1, Math.min(90, parseInt(e.target.value) || 0))
                      )
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-amber-950 pr-14 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                    % OFF
                  </span>
                </div>
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.wholesaleConfig?.requireMinPieces !== false}
                    onChange={(e) => updateWholesaleConfig('requireMinPieces', e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <span className="text-[11px] font-medium text-slate-700">
                    Exigir mínimo para concluir pedido
                  </span>
                </label>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            Marque a caixa acima para habilitar preços e regras de atacado para revendedoras na sua vitrine.
          </p>
        )}
      </div>
      )}

      {/* 4. Agendamento, Horários & Atendimento (SERVIÇOS) ou Frete & Entrega (PRODUTOS) */}
      {isServices ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Disponibilidade, Horários &amp; Agendamento
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure como seus clientes agendam seus serviços. Para serviços, não há cálculo de frete nem entrega física.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Agendamento Ativo
            </span>
          </div>

          {/* Aviso Explicativo Amigável */}
          <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200/80 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-xs text-indigo-950 space-y-1">
              <p className="font-bold">Foco Exclusivo no Atendimento e nos Serviços</p>
              <p className="text-indigo-800 leading-relaxed">
                Na sua vitrine, o cliente escolhe os procedimentos desejados, visualiza as fotos, a duração estimada e a sua disponibilidade. Ao clicar no botão, ele confirma o agendamento diretamente com você no WhatsApp com todas as informações prontas!
              </p>
            </div>
          </div>

          {/* Modalidade de Agendamento */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2">
              Como funciona o atendimento no seu negócio?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Opção 1: Horário Marcado */}
              <button
                type="button"
                onClick={() => updateScheduling({ bookingMode: 'appointment' })}
                className={`p-4 rounded-xl border text-left transition-all ${
                  (scheduling.bookingMode ?? 'appointment') === 'appointment'
                    ? 'border-indigo-600 bg-indigo-50/60 text-indigo-950 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span>Horário Marcado (Com Agenda)</span>
                </div>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Mostra a grade de horários disponíveis. O cliente escolhe o dia e horário que prefere ser atendido.
                </p>
              </button>

              {/* Opção 2: Ordem de Chegada */}
              <button
                type="button"
                onClick={() => updateScheduling({ bookingMode: 'queue' })}
                className={`p-4 rounded-xl border text-left transition-all ${
                  scheduling.bookingMode === 'queue'
                    ? 'border-amber-600 bg-amber-50/60 text-amber-950 ring-2 ring-amber-500/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Users className="w-4 h-4 text-amber-600" />
                  <span>Ordem de Chegada (Sem Horários)</span>
                </div>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  <strong>NÃO mostra horários no catálogo</strong>. O cliente vê apenas os dias de funcionamento e a instrução de que é atendido por ordem de chegada.
                </p>
              </button>
            </div>
          </div>

          {/* Permite Agendamentos Múltiplos */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
            <div>
              <span className="font-bold text-xs text-slate-800">Permitir Agendamentos Múltiplos</span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Permite que o cliente selecione mais de um serviço no mesmo atendimento (ex: Corte + Barba ou Unha + Spa) ou agende para mais de uma pessoa.
              </p>
            </div>
            <input
              type="checkbox"
              checked={scheduling.allowMultipleBookings ?? true}
              onChange={(e) => updateScheduling({ allowMultipleBookings: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
          </div>

          {/* 1. DIAS DE FUNCIONAMENTO (WORKING DAYS) */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-800">
                  Dias de Funcionamento
                </label>
                <p className="text-[11px] text-slate-500">
                  Selecione os dias da semana em que seu estabelecimento realiza atendimentos.
                </p>
              </div>

              {/* Presets Rápidos */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() =>
                    updateScheduling(
                      { workingDays: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] },
                      true
                    )
                  }
                  className="px-2 py-1 text-[10px] font-semibold rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Seg a Sáb
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateScheduling(
                      { workingDays: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'] },
                      true
                    )
                  }
                  className="px-2 py-1 text-[10px] font-semibold rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Seg a Sex
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateScheduling(
                      { workingDays: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] },
                      true
                    )
                  }
                  className="px-2 py-1 text-[10px] font-semibold rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Todos os Dias
                </button>
              </div>
            </div>

            {/* Chips dos Dias */}
            <div className="flex flex-wrap gap-2 pt-1">
              {WEEKDAYS_MAP.map((day) => {
                const isSelected = (scheduling.workingDays || []).includes(day.key);
                return (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => {
                      const current = scheduling.workingDays || [];
                      const nextDays = isSelected
                        ? current.filter((k: string) => k !== day.key)
                        : [...current, day.key];
                      updateScheduling({ workingDays: nextDays }, true);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {day.label.split('-')[0]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. HORÁRIO DE ABERTURA, FECHAMENTO & PAUSA PARA ALMOÇO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bloco de Horário de Abertura e Fechamento */}
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-3">
              <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-600" />
                Horário Geral de Funcionamento
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Abre às
                  </label>
                  <input
                    type="time"
                    value={scheduling.openTime || '09:00'}
                    onChange={(e) =>
                      updateScheduling({ openTime: e.target.value }, true)
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Fecha às
                  </label>
                  <input
                    type="time"
                    value={scheduling.closeTime || '18:00'}
                    onChange={(e) =>
                      updateScheduling({ closeTime: e.target.value }, true)
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-500">
                Determina o primeiro e o último horário disponível do dia.
              </p>
            </div>

            {/* Bloco de Pausa para Almoço / Intervalo */}
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <Coffee className="w-4 h-4 text-amber-600" />
                  Pausa para Almoço / Intervalo
                </span>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scheduling.hasBreak ?? true}
                    onChange={(e) =>
                      updateScheduling({ hasBreak: e.target.checked }, true)
                    }
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="text-[11px] font-semibold text-slate-600">
                    {scheduling.hasBreak ? 'Com pausa' : 'Sem pausa'}
                  </span>
                </label>
              </div>

              {scheduling.hasBreak ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Início do Almoço
                      </label>
                      <input
                        type="time"
                        value={scheduling.breakStartTime || '12:00'}
                        onChange={(e) =>
                          updateScheduling({ breakStartTime: e.target.value }, true)
                        }
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Retorno do Almoço
                      </label>
                      <input
                        type="time"
                        value={scheduling.breakEndTime || '13:00'}
                        onChange={(e) =>
                          updateScheduling({ breakEndTime: e.target.value }, true)
                        }
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[10.5px] flex items-center gap-1.5 font-medium">
                    <Coffee className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>
                      Nenhum agendamento será aceito entre <strong>{scheduling.breakStartTime || '12:00'}</strong> e <strong>{scheduling.breakEndTime || '13:00'}</strong>.
                    </span>
                  </div>
                </>
              ) : (
                <div className="p-3 rounded-lg bg-slate-100 text-slate-500 text-xs">
                  Sem pausa de almoço configurada. Horários serão gerados continuamente de {scheduling.openTime || '09:00'} às {scheduling.closeTime || '18:00'}.
                </div>
              )}
            </div>
          </div>

          {/* 3. RESUMO DO RANGE DE FUNCIONAMENTO (A validação de horários é por serviço) */}
          <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-indigo-950 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-600" />
                Range de Horários do Estabelecimento
              </span>
              <span className="text-[10.5px] font-bold text-indigo-700 bg-white border border-indigo-200 px-2.5 py-0.5 rounded-full shadow-2xs">
                {scheduling.openTime || '09:00'} às {scheduling.closeTime || '18:00'}
              </span>
            </div>

            <p className="text-xs text-indigo-900 leading-relaxed">
              O seu estabelecimento atende das <strong>{scheduling.openTime || '09:00'}</strong> às <strong>{scheduling.closeTime || '18:00'}</strong>
              {scheduling.hasBreak
                ? `, com intervalo de almoço entre ${scheduling.breakStartTime || '12:00'} e ${scheduling.breakEndTime || '13:00'}`
                : ' (sem intervalo)'}.
            </p>

            <div className="p-3 rounded-lg bg-white/90 border border-indigo-100 text-[11px] text-slate-700 flex items-start gap-2 shadow-2xs">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold text-slate-900">
                  Como funciona a validação dos horários no catálogo:
                </p>
                <p className="text-slate-600 leading-relaxed">
                  O intervalo de agendamento (ex: de 15 em 15 min, 30 min, 45 min) é configurado <strong>no cadastro de cada serviço</strong>. Ao cadastrar um procedimento de 15 min, o catálogo gera e valida automaticamente os horários de 15 em 15 min dentro deste range, respeitando a pausa de almoço e os dias de funcionamento!
                </p>
              </div>
            </div>
          </div>

          {/* Horário de Atendimento e Funcionamento (Texto Personalizado) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Texto Resumo de Funcionamento (Exibido na Vitrine)
            </label>
            <input
              type="text"
              value={scheduling.businessHours || ''}
              onChange={(e) => updateScheduling({ businessHours: e.target.value })}
              placeholder="Ex: Segunda a Sábado das 09:00 às 18:00 (Pausa: 12:00 às 13:00)"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* Orientações e Aviso Prévio ao Cliente */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Orientações ao Cliente (Exibido na confirmação)
            </label>
            <input
              type="text"
              value={scheduling.serviceNotice || ''}
              onChange={(e) => updateScheduling({ serviceNotice: e.target.value })}
              placeholder="Ex: Favor chegar com 10 minutos de antecedência. Em caso de atraso superior a 15min, favor avisar pelo WhatsApp."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>
        </div>
      ) : (
        /* 4. Opções de Frete e Retirada (Apenas para Produtos Físicos) */
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
            <Truck className="w-4 h-4 text-indigo-600" />
            <span>Opções de Frete & Entrega</span>
          </h3>

        {/* Frete Grátis Threshold */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="font-bold text-xs text-slate-800">Frete Grátis Acima de um Valor</span>
            <p className="text-[11px] text-slate-500">
              Ofereça frete gratuito para pedidos a partir deste valor. Deixe em branco para desativar.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">R$</span>
            <input
              type="number"
              value={shipping.freeShippingAbove || ''}
              onChange={(e) =>
                updateShipping(
                  'freeShippingAbove',
                  e.target.value ? parseFloat(e.target.value) : undefined
                )
              }
              placeholder="299,00"
              className="w-24 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-white"
            />
          </div>
        </div>

        {/* Motoboy Express */}
        <div className="p-4 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="motoboyCheck"
                checked={shipping.motoboyEnabled}
                onChange={(e) => updateShipping('motoboyEnabled', e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="motoboyCheck" className="text-xs font-bold text-slate-800 cursor-pointer">
                Motoboy Express (Mesmo Dia / Região Metropolitana)
              </label>
            </div>
          </div>

          {shipping.motoboyEnabled && (
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Taxa do Motoboy (R$)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={shipping.motoboyPrice}
                    onChange={(e) =>
                      updateShipping('motoboyPrice', parseFloat(e.target.value) || 0)
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Prazo Estimado Padrão
                  </label>
                  <input
                    type="text"
                    value={shipping.motoboyEstimate}
                    onChange={(e) => updateShipping('motoboyEstimate', e.target.value)}
                    placeholder="Ex: Entrega hoje até as 19h"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
              </div>

              {/* Regra de Horário de Corte para Entrega no Mesmo Dia */}
              <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="motoboyCutoffCheck"
                      checked={shipping.motoboySameDayCutoffEnabled ?? false}
                      onChange={(e) => updateShipping('motoboySameDayCutoffEnabled', e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="motoboyCutoffCheck" className="text-xs font-bold text-indigo-950 cursor-pointer flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Horário de Corte (Compre até X horário para entrega hoje, senão próximo dia útil)</span>
                    </label>
                  </div>
                </div>

                <p className="text-[11px] text-indigo-900/80 leading-relaxed">
                  Quando ativo, o catálogo calcula dinamicamente se o cliente ainda pode receber hoje ou no próximo dia útil com base no horário da compra.
                </p>

                {shipping.motoboySameDayCutoffEnabled && (
                  <div className="pt-1.5 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="w-full sm:w-48">
                        <label className="block text-[11px] font-semibold text-indigo-950 mb-1">
                          Horário Limite do Dia:
                        </label>
                        <input
                          type="time"
                          value={shipping.motoboyCutoffTime || '14:00'}
                          onChange={(e) => updateShipping('motoboyCutoffTime', e.target.value || '14:00')}
                          className="w-full px-3 py-1.5 rounded-lg border border-indigo-200 bg-white text-xs font-bold text-indigo-900"
                        />
                      </div>
                      <div className="flex-1 text-[11px] text-slate-600 sm:pt-4">
                        Pedidos finalizados até as <strong className="text-indigo-950">{shipping.motoboyCutoffTime || '14:00'}</strong> chegam <strong>hoje</strong>. Após este horário, o sistema avisa que a entrega será no <strong>próximo dia útil</strong>.
                      </div>
                    </div>

                    {/* Preview ao Vivo */}
                    {(() => {
                      const cutoffInfo = getMotoboyCutoffInfo(shipping);
                      return (
                        <div className="p-2.5 rounded-lg bg-white border border-indigo-100 flex items-center gap-2 text-xs">
                          <span className="font-semibold text-slate-500 text-[10px] uppercase tracking-wide">
                            Simulação do Cliente Agora:
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[11px] flex items-center gap-1 ${
                              cutoffInfo.isSameDay
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {cutoffInfo.isSameDay ? <Zap className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
                            {cutoffInfo.badgeText}
                          </span>
                          <span className="text-[11px] text-slate-600 truncate">
                            {cutoffInfo.statusMessage}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Retirada por Moto Uber / 99 Moto (Uber Flash / 99) */}
        <div className="p-4 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="uberFlashCheck"
                checked={shipping.uberFlashEnabled ?? true}
                onChange={(e) => updateShipping('uberFlashEnabled', e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="uberFlashCheck" className="text-xs font-bold text-slate-800 cursor-pointer flex items-center gap-1.5">
                <Bike className="w-4 h-4 text-slate-700" />
                <span>Retirada por Moto Uber / 99 Moto (Uber Flash / 99 Entrega)</span>
              </label>
            </div>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              Corrida por conta do cliente
            </span>
          </div>

          {(shipping.uberFlashEnabled ?? true) && (
            <div className="space-y-3 pt-1">
              {/* Alerta de Responsabilidade Financeira e Operacional */}
              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-amber-950 block">
                    Observação Importante sobre Uber / 99:
                  </span>
                  <p className="text-[11px] text-amber-900 leading-relaxed">
                    <strong>Quem paga a corrida do Uber Flash / 99 Pop / Moto é o próprio cliente</strong>. O cliente solicita a corrida pelo próprio app dele e efetua o pagamento diretamente à plataforma. Sua loja apenas separa a encomenda e entrega em mãos ao piloto/motorista quando ele chegar.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Nome da Opção no Carrinho
                  </label>
                  <input
                    type="text"
                    value={shipping.uberFlashLabel ?? 'Retirada por Moto Uber / 99'}
                    onChange={(e) => updateShipping('uberFlashLabel', e.target.value)}
                    placeholder="Ex: Retirada por Moto Uber / 99"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Ponto / Endereço para Coleta pelo Motorista
                  </label>
                  <input
                    type="text"
                    value={shipping.uberFlashAddress ?? (shipping.pickupAddress || '')}
                    onChange={(e) => updateShipping('uberFlashAddress', e.target.value)}
                    placeholder="Endereço onde o motoboy do app deve retirar o pacote"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Texto de Orientação exibido ao Cliente
                </label>
                <input
                  type="text"
                  value={
                    shipping.uberFlashNotice ??
                    'A corrida do Uber Flash / 99 Moto é solicitada e paga diretamente pelo cliente após aviso de pedido pronto.'
                  }
                  onChange={(e) => updateShipping('uberFlashNotice', e.target.value)}
                  placeholder="Instruções para o cliente solicitar o motoboy pelo app"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* Sedex / Correios */}
        <div className="p-4 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="sedexCheck"
                checked={shipping.sedexEnabled}
                onChange={(e) => updateShipping('sedexEnabled', e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="sedexCheck" className="text-xs font-bold text-slate-800 cursor-pointer">
                Envio Nacional (Correios / Sedex / Transportadora)
              </label>
            </div>
          </div>

          {shipping.sedexEnabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Valor Padrão (R$)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={shipping.sedexPrice}
                  onChange={(e) =>
                    updateShipping('sedexPrice', parseFloat(e.target.value) || 0)
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Prazo Estimado
                </label>
                <input
                  type="text"
                  value={shipping.sedexEstimate}
                  onChange={(e) => updateShipping('sedexEstimate', e.target.value)}
                  placeholder="Ex: 2 a 4 dias úteis"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* Retirada em Mãos */}
        <div className="p-4 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="pickupCheck"
                checked={shipping.pickupEnabled}
                onChange={(e) => updateShipping('pickupEnabled', e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="pickupCheck" className="text-xs font-bold text-slate-800 cursor-pointer">
                Retirada no Local / Showroom (Grátis)
              </label>
            </div>
          </div>

          {shipping.pickupEnabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Nome da Opção
                </label>
                <input
                  type="text"
                  value={shipping.pickupLabel}
                  onChange={(e) => updateShipping('pickupLabel', e.target.value)}
                  placeholder="Ex: Retirada na Loja (Jardins)"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Endereço de Retirada
                </label>
                <input
                  type="text"
                  value={shipping.pickupAddress}
                  onChange={(e) => updateShipping('pickupAddress', e.target.value)}
                  placeholder="Ex: Rua Oscar Freire, 1140"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                />
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
