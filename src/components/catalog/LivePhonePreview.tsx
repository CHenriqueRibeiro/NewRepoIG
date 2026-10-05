'use client';

import React, { useState, useMemo } from 'react';
import { CatalogConfig, ProductItem, isProductInScheduledDiscount, isColorDark } from '@/lib/catalog/types';
import {
  ShoppingBag,
  Search,
  Sparkles,
  Flame,
  Zap,
  Plus,
  Type,
  Heart,
  ShieldCheck,
  Star,
  Truck,
  ArrowRight,
  Calendar,
  Clock,
} from 'lucide-react';
import { getTypographyPreset } from '@/lib/catalog/typography';
import { resolveTopicIcon } from '@/lib/catalog/topicIcons';

interface LivePhonePreviewProps {
  config: CatalogConfig;
}

export default function LivePhonePreview({ config }: LivePhonePreviewProps) {
  const { theme, products, globalScheduledDiscount } = config;
  const [activeCategory, setActiveCategory] = useState('TODAS');
  const [searchTerm, setSearchTerm] = useState('');
  const [pricingMode, setPricingMode] = useState<'varejo' | 'atacado'>('varejo');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const toggleFavorite = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const typo = getTypographyPreset(theme.typographyPresetId, theme.fontFamily);

  // Cores dinâmicas para o Card do Topo (Hero)
  const defaultHeroBg = theme.backgroundColor && isColorDark(theme.backgroundColor)
    ? (theme.cardBackground || '#111827')
    : '#FAF6F0';
  const heroBg = theme.heroCardBackground || defaultHeroBg;
  const isHeroDark = isColorDark(heroBg);
  const heroTextColor = theme.heroCardTextColor || (isHeroDark ? '#F8FAFC' : '#1C1917');
  const heroMutedColor = isHeroDark ? '#CBD5E1' : '#57534E';
  const heroBorder = theme.heroCardBorderColor || (isHeroDark ? 'rgba(255, 255, 255, 0.12)' : '#E8DCCF');

  const isProductFlashPromo = (p: ProductItem) => {
    return isProductInScheduledDiscount(p, globalScheduledDiscount);
  };

  const getProductPrice = (p: ProductItem, mode: 'varejo' | 'atacado') => {
    if (mode === 'atacado') {
      if (p.wholesalePrice && p.wholesalePrice > 0) return p.wholesalePrice;
      const defaultDiscount = config.wholesaleConfig?.defaultDiscountPercent || 35;
      const base = p.discountPrice || p.price;
      return Math.round(base * (1 - defaultDiscount / 100) * 100) / 100;
    }

    if (isProductFlashPromo(p)) {
      const discountPercent = globalScheduledDiscount?.discountPercent ?? 10;
      if (discountPercent > 0) {
        const flashPrice = Math.round(p.price * (1 - discountPercent / 100) * 100) / 100;
        if (p.discountPrice && p.discountPrice < flashPrice) {
          return p.discountPrice;
        }
        return flashPrice;
      }
    }

    return p.discountPrice || p.price;
  };

  const getWholesaleDiscountPercent = (p: ProductItem) => {
    const base = p.discountPrice || p.price;
    const ws = getProductPrice(p, 'atacado');
    if (base <= 0) return 0;
    return Math.round(((base - ws) / base) * 100);
  };

  // Categorias / Tópicos
  const allCategories = React.useMemo(() => {
    const list: string[] = ['TODAS'];
    const seen = new Set<string>(['TODAS']);

    (config.topics || []).forEach((t) => {
      const upper = t.trim().toUpperCase();
      if (upper && !seen.has(upper)) {
        seen.add(upper);
        list.push(upper);
      }
    });

    products.forEach((p) => {
      const upper = (p.category || 'GERAL').trim().toUpperCase();
      if (upper && !seen.has(upper)) {
        seen.add(upper);
        list.push(upper);
      }
    });

    return list;
  }, [config.topics, products]);

  const isProductSoldOut = (p: ProductItem) => {
    if (p.isInfiniteStock) return false;
    if (config.outOfStockBehavior === 'infinite' || p.outOfStockAction === 'infinite') return false;
    if (p.isUniquePiece) return p.stock !== undefined && p.stock <= 0;
    return (p.stock || 0) <= 0;
  };

  const getProductOutOfStockAction = (p: ProductItem) => {
    if (p.outOfStockAction && p.outOfStockAction !== 'default') {
      return p.outOfStockAction;
    }
    return config.outOfStockBehavior || 'badge-sold-out';
  };

  const shouldPinBadges = config.pinBadgedProductsToTop !== false;

  const filteredProducts = useMemo(() => {
    const list = products.filter((p) => {
      const isSoldOut = isProductSoldOut(p);
      const outAction = getProductOutOfStockAction(p);

      if (isSoldOut && outAction === 'hide') {
        return false;
      }

      const pCategory = (p.category || 'GERAL').toUpperCase();
      const matchesCategory = activeCategory === 'TODAS' || pCategory === activeCategory;
      const matchesSearch =
        !searchTerm ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    if (shouldPinBadges) {
      return [...list].sort((a, b) => {
        const aSoldOut = isProductSoldOut(a);
        const bSoldOut = isProductSoldOut(b);

        if (aSoldOut !== bSoldOut) {
          return aSoldOut ? 1 : -1;
        }

        const aHasBadge = Boolean(a.badge && a.badge.trim().length > 0);
        const bHasBadge = Boolean(b.badge && b.badge.trim().length > 0);

        if (aHasBadge !== bHasBadge) {
          return aHasBadge ? -1 : 1;
        }

        return 0;
      });
    }

    return list;
  }, [products, activeCategory, searchTerm, config.outOfStockBehavior, shouldPinBadges]);

  return (
    <div className="flex flex-col items-center">
      {/* Smartphone Frame */}
      <div className="w-[340px] h-[680px] bg-stone-900 rounded-[48px] p-3 shadow-2xl border-[4px] border-stone-800 relative flex flex-col overflow-hidden ring-1 ring-white/20">
        {/* Dynamic Island */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-30 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-stone-900 mr-2" />
          <div className="w-2 h-2 rounded-full bg-indigo-950/80" />
        </div>

        {/* Screen Area */}
        <div
          className="w-full h-full rounded-[38px] overflow-y-auto flex flex-col scrollbar-none relative text-xs bg-white text-stone-900"
          style={{
            fontFamily: typo.bodyFont,
          }}
        >
          {/* Top Bar Minimalista */}
          <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-4 pt-7 pb-2.5 border-b border-stone-100 flex items-center justify-center">
            <span
              className="text-[11px] tracking-[0.2em] font-medium text-stone-900 uppercase block text-center"
              style={{ fontFamily: typo.titleFont }}
            >
              {config.storeName || 'BOUTIQUE'}
            </span>
          </div>

          {/* Hero Banner Card Sofisticado com Cor Customizável */}
          <div className="p-3">
            <div
              className="rounded-2xl p-3.5 shadow-2xs text-left relative overflow-hidden border transition-all"
              style={{
                backgroundColor: heroBg,
                borderColor: heroBorder,
                color: heroTextColor,
              }}
            >
              <h1
                className="text-sm font-normal leading-tight mb-1"
                style={{
                  fontFamily: typo.titleFont,
                  letterSpacing: typo.letterSpacing,
                  textTransform: typo.titleTransform,
                  color: heroTextColor,
                }}
              >
                {config.heroTitle || 'Looks que combinam com você!'}
              </h1>

              <p
                className="font-sans text-[9px] leading-relaxed font-light mb-2.5"
                style={{ color: heroMutedColor }}
              >
                {config.heroSubtitle ||
                  'Moda com qualidade, elegância e muita praticidade.'}
              </p>

              {config.businessType !== 'services' && config.wholesaleConfig?.enabled && (
                <div className="mb-1">
                  <div
                    className={`inline-flex p-0.5 rounded-full border shadow-2xs ${
                      isHeroDark ? 'bg-white/10 border-white/15' : 'bg-white border border-stone-200'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setPricingMode('varejo')}
                      className={`px-2 py-0.5 rounded-full text-[8px] font-sans font-semibold transition-all ${
                        pricingMode === 'varejo'
                          ? isHeroDark
                            ? 'bg-white text-stone-900 shadow-xs'
                            : 'bg-stone-900 text-white'
                          : isHeroDark
                          ? 'text-stone-300'
                          : 'text-stone-500'
                      }`}
                    >
                      Varejo
                    </button>
                    <button
                      type="button"
                      onClick={() => setPricingMode('atacado')}
                      className={`px-2 py-0.5 rounded-full text-[8px] font-sans font-semibold transition-all ${
                        pricingMode === 'atacado'
                          ? 'bg-amber-600 text-white'
                          : isHeroDark
                          ? 'text-stone-300'
                          : 'text-stone-500'
                      }`}
                    >
                      Atacado
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Flash Sale Banner (Se ativo) */}
            {globalScheduledDiscount?.enabled && (
              <div className="mt-2 flex items-center justify-between gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-[9px] font-sans text-amber-900">
                <div className="flex items-center gap-1.5 truncate">
                  <Flame className="w-3 h-3 text-amber-600 shrink-0" />
                  <span className="font-semibold truncate">{globalScheduledDiscount.bannerTitle}</span>
                </div>
                {globalScheduledDiscount.applyTo === 'topic' && globalScheduledDiscount.targetTopic && (
                  <span className="shrink-0 text-[7px] bg-amber-200/80 text-amber-950 font-bold px-1.5 py-0.2 rounded">
                    {globalScheduledDiscount.targetTopic}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Navegação de Categorias em Ícones Circulares (como na referência) */}
          <div className="sticky top-[58px] z-10 bg-white/95 backdrop-blur-md px-3 py-2 border-b border-stone-100 flex items-center gap-2.5 overflow-x-auto scrollbar-none">
            {allCategories.map((cat) => {
              const isSelected = activeCategory === cat;
              const IconComp = resolveTopicIcon(cat, config.topicIcons?.[cat]);
              const displayLabel = cat === 'TODAS' ? 'Todas' : (cat.charAt(0) + cat.slice(1).toLowerCase());

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className="group flex flex-col items-center gap-1 shrink-0 transition-all focus:outline-hidden"
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                      isSelected
                        ? 'shadow-xs scale-105 text-white'
                        : 'bg-stone-50 text-stone-600 border border-stone-200/80'
                    }`}
                    style={
                      isSelected
                        ? { backgroundColor: theme.primaryColor }
                        : {}
                    }
                  >
                    <IconComp className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-[8px] font-sans tracking-tight truncate max-w-[50px] text-center ${
                      isSelected ? 'font-bold text-stone-950' : 'font-medium text-stone-500'
                    }`}
                  >
                    {displayLabel}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Título de Seção "Destaques da Semana" */}
          <div className="px-3 pt-3 pb-1 flex items-center justify-between">
            <h3
              className="text-xs font-bold text-stone-900"
              style={{ fontFamily: typo.titleFont }}
            >
              {activeCategory === 'TODAS' ? 'Destaques da Semana' : activeCategory}
            </h3>
            {activeCategory !== 'TODAS' && (
              <button
                type="button"
                onClick={() => setActiveCategory('TODAS')}
                className="text-[9px] font-sans text-stone-500 hover:text-stone-900"
              >
                Ver todos
              </button>
            )}
          </div>

          {/* Product Grid or Empty State */}
          <div className="p-3 pt-1 flex-1">
            {filteredProducts.length === 0 ? (
              <div className="py-12 px-3 text-center flex flex-col items-center justify-center space-y-2.5">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-2xs"
                  style={{ backgroundColor: `${theme.primaryColor}15`, color: theme.primaryColor }}
                >
                  {config.businessType === 'services' ? (
                    <Calendar className="w-5 h-5 stroke-[1.5]" />
                  ) : (
                    <ShoppingBag className="w-5 h-5 stroke-[1.5]" />
                  )}
                </div>
                <div className="space-y-1">
                  <h5 className="text-[11px] font-bold text-stone-800">
                    {config.businessType === 'services'
                      ? 'Agenda pronta para receber horários'
                      : 'Vitrine pronta para receber peças'}
                  </h5>
                  <p className="text-[9.5px] text-stone-400 max-w-[200px] mx-auto leading-relaxed">
                    {config.businessType === 'services'
                      ? 'Cadastre seus procedimentos ou serviços para disponibilizar sua grade de horários aqui.'
                      : 'Cadastre seus produtos ou sincronize direto do Instagram para exibi-los aqui.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {filteredProducts.map((p, i) => {
                  const currentPrice = getProductPrice(p, pricingMode);
                  const retailPrice = p.discountPrice || p.price;
                  const wholesalePercent = getWholesaleDiscountPercent(p);
                  const isSoldOut = isProductSoldOut(p);
                  const isFlash = isProductFlashPromo(p);
                  const isService = p.isService || config.businessType === 'services';
                  const actionBtnLabel = config.actionButtonLabel || (isService ? 'Agendar' : 'Adicionar');

                  return (
                    <div
                      key={p.id || i}
                      className="rounded-xl p-2 bg-white border border-stone-200/80 shadow-2xs flex flex-col justify-between relative"
                    >
                      {/* Imagem */}
                      <div className="relative w-full aspect-[4/5] bg-stone-100 rounded-lg overflow-hidden mb-1.5">
                        <img
                          src={
                            p.images?.[0] ||
                            'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&auto=format&fit=crop&q=80'
                          }
                          alt={p.name}
                          className={`w-full h-full object-cover ${isSoldOut ? 'grayscale-40 opacity-75' : ''}`}
                          loading="lazy"
                        />

                        {/* Botão de Favorito (Coração como na Ref) */}
                        <button
                          type="button"
                          onClick={(e) => toggleFavorite(p.id, e)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-stone-500 shadow-2xs z-10"
                        >
                          <Heart
                            className={`w-3 h-3 ${
                              favorites.has(p.id) ? 'fill-rose-500 text-rose-500' : 'text-stone-500'
                            }`}
                          />
                        </button>

                        {isSoldOut ? (
                          <span className="absolute top-1 left-1 bg-stone-900/90 text-white text-[7px] font-sans font-bold px-1 py-0.5 rounded-full border border-stone-700">
                            ESGOTADO
                          </span>
                        ) : p.badge ? (
                          <span className="absolute top-1 left-1 bg-white/95 text-stone-900 text-[7px] font-sans font-bold px-1.5 py-0.5 rounded-full border border-stone-200/90 shadow-2xs flex items-center gap-0.5">
                            <Sparkles className="w-2 h-2 text-amber-500 fill-amber-400" />
                            <span>{p.badge}</span>
                          </span>
                        ) : null}

                        {!isSoldOut && (
                          pricingMode === 'atacado' ? (
                            <span className="absolute bottom-1 left-1 bg-amber-600 text-white text-[7px] font-sans font-bold px-1 py-0.2 rounded-full shadow-2xs">
                              -{wholesalePercent}%
                            </span>
                          ) : isFlash ? (
                            <span className="absolute bottom-1 left-1 bg-amber-600 text-white text-[7px] font-sans font-bold px-1.5 py-0.2 rounded-full shadow-2xs flex items-center gap-0.5">
                              <Zap className="w-2 h-2 fill-current" />
                              <span>-{globalScheduledDiscount?.discountPercent ?? 10}%</span>
                            </span>
                          ) : p.discountPrice && p.discountPrice < p.price ? (
                            <span className="absolute bottom-1 left-1 bg-stone-900 text-white text-[7px] font-sans font-bold px-1 py-0.2 rounded-full shadow-2xs">
                              PROMO
                            </span>
                          ) : null
                        )}
                      </div>

                      {/* Detalhes */}
                      <div className="space-y-1">
                        <h4
                          className="text-[10px] text-stone-800 line-clamp-2 leading-tight font-medium"
                          style={{ fontFamily: typo.titleFont }}
                        >
                          {p.name}
                        </h4>

                        {/* Duração se for serviço */}
                        {isService && (p.durationFormatted || p.durationMinutes) && (
                          <div className="flex items-center gap-1 text-[8px] text-stone-500 font-medium">
                            <Clock className="w-2 h-2 text-stone-400" />
                            <span>{p.durationFormatted || `${p.durationMinutes} min`}</span>
                          </div>
                        )}

                        <div className="pt-1">
                          <span
                            className={`font-sans font-bold text-[10px] block ${
                              isFlash && pricingMode === 'varejo' ? 'text-amber-700' : 'text-stone-900'
                            }`}
                          >
                            {p.servicePriceType === 'starting_at' ? 'A partir de ' : ''}
                            R$ {currentPrice.toFixed(2)}
                            {pricingMode === 'atacado' && (
                              <span className="text-[7px] font-normal text-amber-700 ml-0.5">un</span>
                            )}
                          </span>
                          {((pricingMode === 'atacado' && retailPrice > currentPrice) ||
                            (pricingMode === 'varejo' && p.price > currentPrice)) && (
                            <span className="text-[7px] text-stone-400 line-through block">
                              R$ {p.price.toFixed(2)}
                            </span>
                          )}

                          {/* Botão de Ação (Adicionar ou Agendar) */}
                          {isSoldOut ? (
                            <span className="w-full mt-1.5 py-1 rounded-lg bg-stone-100 text-stone-400 text-[8px] font-sans font-semibold text-center block">
                              Esgotado
                            </span>
                          ) : (
                            <span
                              className="w-full mt-1.5 py-1 rounded-lg text-white text-[8px] font-sans font-semibold flex items-center justify-center gap-1 shadow-2xs"
                              style={{ backgroundColor: theme.primaryColor }}
                            >
                              {isService ? (
                                <Calendar className="w-2.5 h-2.5" />
                              ) : (
                                <ShoppingBag className="w-2.5 h-2.5" />
                              )}
                              <span>{actionBtnLabel}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Barra de Reafirmação e Confiança no Rodapé (apenas produtos físicos) */}
            {config.businessType !== 'services' && (
              <div className="mt-4 mb-2 mx-1 pt-2.5 pb-2 border-t border-stone-200/80 bg-stone-50/70 rounded-xl px-2.5 text-center font-sans space-y-0.5">
                <div className="flex items-center justify-center gap-1 text-[8.5px] font-bold text-stone-800">
                  <ShieldCheck className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                  <span>Compra 100% Segura • Entrega Rápida</span>
                </div>
                <p className="text-[7.5px] text-stone-400">
                  Satisfação garantida em todo o Brasil
                </p>
              </div>
            )}
          </div>

          {/* Sticky Bottom Bar */}
          <div className="sticky bottom-0 left-0 right-0 p-2.5 bg-white/95 backdrop-blur-md border-t border-stone-100 flex items-center justify-between font-sans">
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className="font-bold text-stone-900">
                {config.businessType === 'services' ? (
                  filteredProducts.length > 0 ? `${filteredProducts.length} serviços` : '0 serviços'
                ) : filteredProducts.length > 0 ? (
                  pricingMode === 'atacado' ? (
                    config.wholesaleConfig?.ruleType === 'cart_value'
                      ? `Mín. R$ ${config.wholesaleConfig?.minValue || 300}`
                      : config.wholesaleConfig?.ruleType === 'per_item'
                      ? `Por peça (mín. ${config.wholesaleConfig?.minPieces || 3} un)`
                      : `Mín. ${config.wholesaleConfig?.minPieces || 6} peças`
                  ) : '1 item'
                ) : '0 itens'}
              </span>
              <span className="text-stone-400">•</span>
              <span className="font-bold" style={{ color: theme.primaryColor }}>
                {config.businessType === 'services'
                  ? 'Agendamento Direto'
                  : filteredProducts.length > 0
                  ? (pricingMode === 'atacado' ? 'Tabela Atacado' : `R$ ${(filteredProducts[0]?.price || 0).toFixed(2)}`)
                  : 'Vitrine Pronta'}
              </span>
            </div>

            <div
              className="px-3 py-1.5 rounded-full text-[10px] font-bold text-white shadow-xs"
              style={{ backgroundColor: theme.primaryColor }}
            >
              {config.businessType === 'services' ? 'Agendar Agora' : 'Meu Carrinho'}
            </div>
          </div>
        </div>
      </div>

      {/* Active Font Badge Indicator */}
      <div className="mt-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-[11px] font-semibold text-slate-800 shadow-2xs">
        <Type className="w-3.5 h-3.5 text-indigo-600" />
        <span>Fonte: <strong className="text-slate-900 font-bold">{typo.name}</strong></span>
      </div>

      <span className="text-[10px] text-slate-400 mt-1 font-medium">
        Preview em tempo real • {typo.segment}
      </span>
    </div>
  );
}
