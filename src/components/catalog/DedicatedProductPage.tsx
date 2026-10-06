'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  ArrowLeft,
  Truck,
  ShieldCheck,
  Check,
  MessageCircle,
  Share2,
  Sparkles,
  Heart,
  ChevronRight,
  Plus,
  Minus,
  Calendar,
  Clock,
  MapPin,
  Users,
} from 'lucide-react';
import { CatalogConfig, ProductItem } from '@/lib/catalog/types';
import { getTemplateById, getDefaultCatalog } from '@/lib/catalog/templates';
import { buildProductCleanUrl, slugify } from '@/lib/catalog/url-helpers';
import CartDrawer from '@/components/catalog/CartDrawer';
import { useStoreCart } from '@/lib/catalog/use-store-cart';
import {
  calculateAvailableTimeSlots,
  getUpcomingBookingDates,
} from '@/lib/catalog/service-helpers';

export interface DedicatedProductPageProps {
  storeSlug: string;
  product: ProductItem;
  categorySlug?: string;
  catalog?: CatalogConfig;
}

export default function DedicatedProductPage({
  storeSlug,
  product: initialProduct,
  categorySlug,
  catalog: initialCatalogProp,
}: DedicatedProductPageProps) {
  const slug = storeSlug || 'minha-loja';
  const fallbackCatalog = getTemplateById(slug)?.config || getDefaultCatalog();
  const [catalog, setCatalog] = useState<CatalogConfig>(initialCatalogProp || fallbackCatalog);

  // Garante que os dados do produto estejam sempre sincronizados com a versão mais recente do catálogo
  const product = useMemo(() => {
    if (!catalog.products || catalog.products.length === 0) return initialProduct;
    return catalog.products.find((p) => String(p.id) === String(initialProduct.id)) || initialProduct;
  }, [catalog.products, initialProduct]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes?.[0] || 'Único');
  const [selectedColor, setSelectedColor] = useState<string>(product.colors?.[0] || '');
  const [quantity, setQuantity] = useState(1);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [notificationToast, setNotificationToast] = useState<string | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);

  const isService = Boolean(product.isService || catalog.businessType === 'services');
  const sched = catalog.scheduling || catalog.schedulingConfig;

  // Próximas datas respeitando dias de funcionamento configurados
  const upcomingDates = useMemo(() => {
    return getUpcomingBookingDates(sched?.workingDays);
  }, [sched?.workingDays]);

  const [selectedDate, setSelectedDate] = useState<string>('');

  useEffect(() => {
    if (!selectedDate && upcomingDates.length > 0) {
      const firstOpen = upcomingDates.find((d) => d.isOpen) || upcomingDates[0];
      if (firstOpen) {
        setSelectedDate(firstOpen.dateFormatted);
      }
    }
  }, [upcomingDates, selectedDate]);

  // Horários calculados respeitando: abertura, fechamento, pausa para almoço, duração e horário de início específico
  const availableSlots = useMemo(() => {
    if (!isService) return [];
    const isQueueMode =
      (product.bookingMode || sched?.bookingMode) === 'queue';
    if (isQueueMode) return [];

    // Prioriza os horários salvos diretamente no produto
    if (product.availableTimeSlots && product.availableTimeSlots.length > 0) {
      return product.availableTimeSlots;
    }

    const intervalMins = product.durationMinutes || sched?.slotIntervalMinutes || 15;
    const customStart = product.scheduleType === 'custom_start' ? product.customStartTime : undefined;
    const customEnd = product.scheduleType === 'custom_start' ? product.customEndTime : undefined;

    const computed = calculateAvailableTimeSlots(sched, intervalMins, customStart, customEnd);
    if (computed && computed.length > 0) {
      return computed;
    }
    return sched?.timeSlots || [];
  }, [
    isService,
    product.bookingMode,
    product.durationMinutes,
    product.availableTimeSlots,
    product.scheduleType,
    product.customStartTime,
    product.customEndTime,
    sched,
  ]);

  // Carrinho compartilhado e persistido
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    pricingMode,
    setPricingMode,
    selectedShipping,
    setSelectedShipping,
    addToCart,
    updateQuantity,
    removeFromCart,
    totalItemCount,
  } = useStoreCart(slug);

  // Carrega configurações atualizadas do catálogo
  useEffect(() => {
    async function loadCatalog() {
      try {
        const res = await fetch(`/api/catalog/${slug}`);
        if (res.ok) {
          const data = await res.json();
          if (data.catalog) {
            setCatalog(data.catalog);
          }
        }
      } catch (e) {
        console.warn('Erro ao atualizar catálogo na página do produto:', e);
      }
    }
    if (!initialCatalogProp) {
      loadCatalog();
    }
  }, [slug, initialCatalogProp]);

  // Galeria de fotos do produto (foto principal + outras fotos)
  const images =
    product.images && product.images.length > 0
      ? product.images
      : ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800'];

  const unitPrice = product.discountPrice || product.price;
  const totalPrice = unitPrice * quantity;

  const formattedUnitPrice = unitPrice.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  const formattedTotalPrice = totalPrice.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  const hasPixEnabled = Boolean(
    catalog.paymentConfig?.pixEnabled && catalog.paymentConfig?.pixKey?.trim()
  );

  const formattedOriginalPrice = product.discountPrice
    ? product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : null;

  const storeUrl = `/${slug}`;
  const whatsappNumber = catalog.whatsapp?.replace(/\D/g, '') || '5511999998888';
  const brandPrimaryColor = catalog.theme?.primaryColor || '#B8860B';

  const handleAddToCart = () => {
    addToCart(product, selectedSize, selectedColor, quantity);
    setNotificationToast(`"${product.name}" adicionado à sacola!`);
    setIsCartOpen(true);
    setTimeout(() => setNotificationToast(null), 3500);
  };

  const handleWhatsAppBuy = () => {
    const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
    let message = '';
    if (isService) {
      const isQueueMode =
        (product.bookingMode || sched?.bookingMode) === 'queue';
      message =
        `Olá ${catalog.storeName}! Gostaria de agendar o serviço *${product.name}*!\n\n` +
        `• Modalidade: *${isQueueMode ? 'Atendimento por Ordem de Chegada' : 'Horário Marcado'}*\n` +
        (selectedDate ? `• Data desejada: *${selectedDate}*\n` : '') +
        (isQueueMode ? '' : selectedTimeSlot ? `• Horário de preferência: *${selectedTimeSlot}*\n` : '') +
        (product.durationFormatted || product.durationMinutes
          ? `• Duração estimada: *${product.durationFormatted || `${product.durationMinutes} min`}*\n`
          : '') +
        (quantity > 1 ? `• Quantidade / Pessoas: *${quantity}*\n` : '') +
        `• Valor: *${formattedUnitPrice}*\n` +
        `• Link do serviço: ${pageUrl}\n\n` +
        (isQueueMode
          ? `Gostaria de confirmar o atendimento por ordem de chegada no horário de funcionamento!`
          : `Como podemos confirmar a reserva dessa data e horário?`);
    } else {
      message =
        `Olá ${catalog.storeName}! Vi a peça *${product.name}* no link da loja e gostaria de garantir!\n\n` +
        `• Quantidade: *${quantity}x*\n` +
        (product.sizes?.length ? `• Tamanho: *${selectedSize}*\n` : '') +
        (selectedColor ? `• Cor: *${selectedColor}*\n` : '') +
        `• Total: *${formattedTotalPrice}*\n` +
        `• Link da peça: ${pageUrl}`;
    }

    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleShare = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Recomendações e Sugestões Inteligentes da Loja (exibidas logo abaixo da peça)
  const relatedProducts = useMemo(() => {
    const all = (catalog.products || []).filter((p) => p.id !== product.id);
    const recConfig = product.recommendations;

    // 1. Recomendações manuais configuradas pelo lojista
    if (recConfig?.enabled && recConfig.productIds?.length) {
      const fixed = all.filter((p) => recConfig.productIds!.includes(p.id));
      if (fixed.length > 0) return fixed.slice(0, 4);
    }

    // 2. Mesma categoria / tópico
    const sameCategory = all.filter(
      (p) =>
        p.category &&
        product.category &&
        p.category.trim().toLowerCase() === product.category.trim().toLowerCase()
    );
    if (sameCategory.length > 0) {
      const remaining = all.filter((p) => !sameCategory.includes(p));
      return [...sameCategory, ...remaining].slice(0, 4);
    }

    // 3. Outras peças da loja
    return all.slice(0, 4);
  }, [catalog.products, product]);

  const suggestionsSectionTitle =
    product.recommendations?.title || (isService ? 'Combine este procedimento com' : 'Sugestões da Loja');

  return (
    <div className="min-h-screen bg-stone-50/70 text-stone-900 font-sans pb-28 md:pb-16 antialiased">
      {/* Toast de Notificação */}
      {notificationToast && (
        <div className="fixed top-20 right-4 z-50 bg-stone-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl border border-stone-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
          <span>{notificationToast}</span>
        </div>
      )}

      {/* 1. Header Fixo Superior com Logotipo, Sacola e Voltar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 transition-all shadow-xs">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href={storeUrl}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-950 transition-colors py-1.5 px-3 rounded-full hover:bg-stone-100"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Ver toda a loja</span>
            <span className="sm:hidden">Voltar</span>
          </Link>

          <Link href={storeUrl} className="text-center group">
            <h1 className="text-sm sm:text-base font-bold tracking-widest uppercase text-stone-900 group-hover:text-amber-700 transition-colors">
              {catalog.storeName}
            </h1>
            <span className="text-[10px] text-emerald-600 font-medium block -mt-0.5">
              ● Boutique Oficial Verificada
            </span>
          </Link>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={handleShare}
              className="p-2 rounded-full text-stone-600 hover:text-stone-950 hover:bg-stone-100 transition-colors text-xs flex items-center gap-1"
              title="Copiar link da peça"
            >
              <Share2 className="w-4 h-4" />
              {copiedLink && (
                <span className="text-[11px] font-bold text-emerald-600">Copiado!</span>
              )}
            </button>

            <button
              onClick={() => setIsFavorited(!isFavorited)}
              className="p-2 rounded-full text-stone-600 hover:text-stone-950 hover:bg-stone-100 transition-colors"
              title="Favoritar"
            >
              <Heart
                className={`w-4 h-4 ${isFavorited ? 'fill-rose-500 text-rose-500' : ''}`}
              />
            </button>

            {/* Sacola / Carrinho no Header */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 rounded-full text-stone-700 hover:text-stone-950 hover:bg-stone-100 transition-colors"
              title="Ver carrinho"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItemCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-xs"
                  style={{ backgroundColor: brandPrimaryColor }}
                >
                  {totalItemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* 2. Conteúdo Principal do Produto (PDP em Tela Inteira) */}
      <main className="max-w-6xl mx-auto px-4 pt-6 sm:pt-8">
        {/* Breadcrumb Amigável */}
        <nav className="flex items-center gap-1.5 text-xs text-stone-400 mb-6 overflow-x-auto whitespace-nowrap pb-1">
          <Link href={storeUrl} className="hover:text-stone-800 transition-colors">
            Início
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-stone-300 shrink-0" />
          {product.category && (
            <>
              <Link
                href={`/${slug}/${slugify(product.category)}`}
                className="hover:text-stone-800 transition-colors capitalize"
              >
                {product.category}
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-stone-300 shrink-0" />
            </>
          )}
          <span className="text-stone-900 font-semibold truncate max-w-[220px]">
            {product.name}
          </span>
        </nav>

        {/* Card Principal da Peça: Grid 2 Colunas */}
        <div className="bg-white rounded-3xl p-5 sm:p-8 border border-stone-200/90 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Coluna Esquerda: Galeria de Fotos */}
            <div className="lg:col-span-6 space-y-4">
              <div className="relative aspect-[4/5] sm:aspect-square w-full rounded-2xl overflow-hidden bg-stone-100 border border-stone-200/80 shadow-xs">
                <img
                  src={images[activeImageIndex] || images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover transition-all duration-300"
                />

                {product.badge && (
                  <div className="absolute top-4 left-4 px-3 py-1 bg-black/85 backdrop-blur-md rounded-full text-xs font-bold text-white uppercase tracking-wider shadow-sm">
                    {product.badge}
                  </div>
                )}

                {product.isUniquePiece && (
                  <div className="absolute top-4 right-4 px-3 py-1 bg-amber-500 text-white rounded-full text-xs font-bold shadow-sm flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Peça Única
                  </div>
                )}
              </div>

              {/* Miniaturas interativas */}
              {images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-20 h-24 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${activeImageIndex === idx
                          ? 'border-stone-950 ring-2 ring-stone-950/15'
                          : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                    >
                      <img
                        src={img}
                        alt={`Miniatura ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Coluna Direita: Informações, Seletores e Compra */}
            <div className="lg:col-span-6 space-y-6">
              <div className="border-b border-stone-200 pb-5 space-y-2">
                <span className="text-xs font-bold tracking-widest text-amber-800 uppercase">
                  {product.category || 'Coleção Oficial'}
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-950 tracking-tight leading-tight">
                  {product.name}
                </h1>

                {/* Preço e Pagamento */}
                <div className="pt-2 flex items-baseline gap-3">
                  <span className="text-3xl font-extrabold text-stone-900 font-mono">
                    {formattedUnitPrice}
                  </span>
                  {formattedOriginalPrice && (
                    <span className="text-sm font-medium text-stone-400 line-through">
                      {formattedOriginalPrice}
                    </span>
                  )}
                  {product.paymentBadge && (
                    <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold">
                      {product.paymentBadge}
                    </span>
                  )}
                </div>
                {product.maxInstallments && product.maxInstallments > 1 && (
                  <p className="text-xs text-stone-500">
                    Em até {product.maxInstallments}x{' '}
                    {product.installmentWithoutInterest !== false ? 'sem juros' : ''} de{' '}
                    {(unitPrice / product.maxInstallments).toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </p>
                )}
              </div>

              {/* Seleção de Tamanho */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                      Tamanho:
                    </label>
                    <span className="text-xs text-stone-500">
                      Selecionado: <strong className="text-stone-900">{selectedSize}</strong>
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`min-w-12 h-11 px-3.5 rounded-xl text-sm font-bold transition-all border flex items-center justify-center ${selectedSize === size
                            ? 'bg-stone-950 text-white border-stone-950 shadow-sm'
                            : 'bg-white text-stone-800 border-stone-300 hover:border-stone-950'
                          }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Seleção de Cores */}
              {product.colors && product.colors.length > 0 && (
                <div className="space-y-2 pt-1">
                  <label className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                    Banho / Cor:{' '}
                    <span className="font-normal text-stone-600">{selectedColor}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all ${selectedColor === color
                            ? 'border-stone-950 bg-stone-900 text-white font-bold shadow-xs'
                            : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'
                          }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Seletor de Quantidade (apenas para produtos físicos) */}
              {!isService && (
                <div className="space-y-2 pt-1">
                  <label className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                    Quantidade:
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="inline-flex items-center border border-stone-300 rounded-xl overflow-hidden bg-white shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="w-10 h-10 flex items-center justify-center text-stone-600 hover:bg-stone-100 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-12 text-center text-sm font-bold text-stone-900 font-mono">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => q + 1)}
                        className="w-10 h-10 flex items-center justify-center text-stone-600 hover:bg-stone-100 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {quantity > 1 && (
                      <span className="text-xs font-bold text-stone-800">
                        Total: {formattedTotalPrice}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Informações de Agendamento e Horários para Serviços */}
              {isService && (
                <div className="p-4 bg-purple-50/70 border border-purple-200/80 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-purple-700" />
                      <span>Agendamento de Horário</span>
                    </span>
                    {(product.durationFormatted || product.durationMinutes) && (
                      <span className="text-xs text-purple-800 font-semibold flex items-center gap-1 bg-purple-100/80 px-2.5 py-0.5 rounded-full">
                        <Clock className="w-3.5 h-3.5 text-purple-600" />
                        <span>Duração: {product.durationFormatted || `${product.durationMinutes} min`}</span>
                      </span>
                    )}
                  </div>

                  {sched?.businessHours && (
                    <p className="text-xs text-stone-600">
                      Horário de Funcionamento: <strong className="text-stone-800">{sched.businessHours}</strong>
                    </p>
                  )}

                  {(() => {
                    const isQueueMode =
                      (product.bookingMode || sched?.bookingMode) === 'queue';

                    if (isQueueMode) {
                      return (
                        <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                          <Users className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold">Atendimento por Ordem de Chegada</p>
                            <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                              Não é necessário marcar horário! Basta comparecer ao nosso local dentro do horário de funcionamento ({sched?.businessHours || 'Segunda a Sábado'}).
                            </p>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4 pt-1">
                        {/* 1. SELETOR DE DATA (Respeitando Dias de Funcionamento) */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                            <span>1. Escolha o dia do atendimento:</span>
                            {selectedDate && (
                              <span className="text-purple-700 font-semibold normal-case text-xs">
                                {selectedDate}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                            {upcomingDates.map((item) => {
                              const isSelected = selectedDate === item.dateFormatted;
                              const isClosed = !item.isOpen;

                              return (
                                <button
                                  key={item.isoDate}
                                  type="button"
                                  disabled={isClosed}
                                  onClick={() => {
                                    if (!isClosed) {
                                      setSelectedDate(item.dateFormatted);
                                    }
                                  }}
                                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex flex-col items-center gap-0.5 border ${isClosed
                                      ? 'bg-stone-100 text-stone-400 border-stone-200 opacity-60 cursor-not-allowed'
                                      : isSelected
                                        ? 'bg-purple-900 text-white border-purple-900 shadow-sm'
                                        : 'bg-white text-stone-800 border-stone-200 hover:border-purple-500'
                                    }`}
                                >
                                  <span>{item.label}</span>
                                  <span className="text-[10px] font-medium opacity-80">
                                    {isClosed ? '(Fechado)' : item.weekday.split('-')[0]}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* 2. SELETOR DE HORÁRIO (Respeitando Abertura, Fechamento, Almoço e Passo) */}
                        {availableSlots.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                              <span>2. Selecione o horário de preferência:</span>
                              {selectedTimeSlot && (
                                <span className="text-purple-700 font-semibold normal-case text-xs">
                                  {selectedTimeSlot}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
                              {availableSlots.map((slot) => {
                                const isSelected = selectedTimeSlot === slot;
                                return (
                                  <button
                                    key={slot}
                                    type="button"
                                    onClick={() => setSelectedTimeSlot(isSelected ? null : slot)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${isSelected
                                        ? 'bg-purple-900 text-white border-purple-900 shadow-sm ring-2 ring-purple-400/40'
                                        : 'bg-white text-stone-800 border-stone-200 hover:border-purple-600'
                                      }`}
                                  >
                                    {slot}
                                  </button>
                                );
                              })}
                            </div>
                            {sched?.hasBreak && (
                              <p className="text-[10.5px] text-stone-500 flex items-center gap-1 pt-0.5">
                                <span>☕ Horários com pausa entre {sched.breakStartTime || '12:00'} e {sched.breakEndTime || '13:00'} foram reservados para intervalo.</span>
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {sched?.serviceNotice && (
                    <p className="text-[11px] text-purple-900 bg-purple-100/60 p-2.5 rounded-xl border border-purple-200/60 leading-relaxed">
                      ℹ️ {sched.serviceNotice}
                    </p>
                  )}
                </div>
              )}

              {/* Status do Estoque / Disponibilidade Real */}
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-emerald-950">
                    {isService ? 'Grade aberta para novos agendamentos' : 'Disponível no estoque da loja'}
                  </p>
                  <p className="text-emerald-700 mt-0.5">
                    {isService
                      ? 'Confirmação rápida e envio de lembrete pelo WhatsApp.'
                      : 'Envio imediato após confirmação do pedido.'}
                  </p>
                </div>
              </div>

              {/* Botões de Ação Principal: Agendar / Adicionar + WhatsApp */}
              <div className="space-y-3 pt-2">
                {isService ? (
                  <>
                    {/* BOTÃO PRINCIPAL DE AGENDAR PELO WHATSAPP */}
                    <button
                      type="button"
                      onClick={handleWhatsAppBuy}
                      className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-bold text-base transition-all shadow-md flex items-center justify-center gap-2.5"
                    >
                      <MessageCircle className="w-5 h-5 fill-white" />
                      <span>
                        Confirmar Agendamento no WhatsApp ({formattedTotalPrice})
                      </span>
                    </button>

                    {/* BOTÃO ADICIONAR AO CARRINHO/LISTA */}
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      className="w-full py-3.5 px-6 rounded-2xl border-2 font-bold text-sm transition-all shadow-xs flex items-center justify-center gap-2"
                      style={{ borderColor: brandPrimaryColor, color: brandPrimaryColor }}
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Salvar na Lista de Agendamentos</span>
                    </button>
                  </>
                ) : (
                  <>
                    {/* BOTÃO ADICIONAR AO CARRINHO / SACOLA */}
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      className="w-full py-4 px-6 rounded-2xl text-white font-bold text-base transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2.5"
                      style={{ backgroundColor: brandPrimaryColor }}
                    >
                      <ShoppingBag className="w-5 h-5" />
                      <span>Adicionar à Sacola ({formattedTotalPrice})</span>
                    </button>

                    {/* BOTÃO GARANTIR PELO WHATSAPP (Apenas exibido se a loja NÃO liberou recebimento por PIX) */}
                    {!hasPixEnabled && (
                      <button
                        type="button"
                        onClick={handleWhatsAppBuy}
                        className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-bold text-sm transition-all shadow-xs flex items-center justify-center gap-2"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Pedir direto pelo WhatsApp</span>
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Benefícios e Segurança */}
              <div className="pt-4 border-t border-stone-200 grid grid-cols-2 gap-4 text-xs text-stone-600">
                <div className="flex items-center gap-2.5">
                  {isService ? (
                    <Clock className="w-4 h-4 text-purple-700 shrink-0" />
                  ) : (
                    <Truck className="w-4 h-4 text-stone-700 shrink-0" />
                  )}
                  <span>
                    {isService
                      ? 'Atendimento pontual com hora marcada'
                      : 'Motoboy hoje ou PAC/Sedex todo o Brasil'}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-stone-700 shrink-0" />
                  <span>
                    {isService
                      ? 'Profissionais qualificados & Garantia'
                      : 'Garantia oficial direto com a loja'}
                  </span>
                </div>
              </div>

              {/* Descrição Detalhada */}
              {product.description && (
                <div className="pt-4 border-t border-stone-200 space-y-2">
                  <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                    Detalhes da Peça:
                  </h3>
                  <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-line">
                    {product.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. Seção: Sugestões da Loja / Combine com outras peças (Logo Abaixo do Produto) */}
        {relatedProducts.length > 0 && (
          <section className="mt-14 pt-10 border-t border-stone-200 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className={`text-xs font-bold tracking-widest uppercase ${isService ? 'text-indigo-700' : 'text-amber-800'}`}>
                  {isService ? 'Procedimentos Combinados' : suggestionsSectionTitle}
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-stone-950 mt-0.5">
                  {isService
                    ? (product.recommendations?.title || 'Combine com outro procedimento')
                    : (product.recommendations?.title || 'Combine com outras peças')}
                </h3>
              </div>
              <Link
                href={storeUrl}
                className="text-xs font-bold text-stone-900 hover:text-indigo-700 transition-colors inline-flex items-center gap-1"
              >
                {isService ? 'Ver todos os serviços' : 'Ver vitrine completa'} <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((rel) => {
                const relUrl = buildProductCleanUrl('', slug, {
                  id: rel.id,
                  title: rel.name,
                  category: rel.category,
                });
                const isRelService = Boolean(rel.isService || catalog.businessType === 'services' || isService);

                return (
                  <Link
                    key={rel.id}
                    href={relUrl}
                    className="group bg-white p-3 sm:p-4 rounded-2xl border border-stone-200/90 hover:border-stone-900 transition-all shadow-xs hover:shadow-md flex flex-col justify-between"
                  >
                    <div>
                      <div className="aspect-[4/5] rounded-xl overflow-hidden bg-stone-100 mb-3">
                        <img
                          src={
                            rel.images?.[0] ||
                            'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800'
                          }
                          alt={rel.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                        {rel.category || (isRelService ? 'Serviço' : 'Coleção')}
                      </p>
                      <h4 className="text-xs sm:text-sm font-bold text-stone-900 line-clamp-2 group-hover:text-indigo-700 transition-colors mt-0.5">
                        {rel.name}
                      </h4>
                      {isRelService && (rel.durationFormatted || rel.durationMinutes) && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-700 bg-sky-50 border border-sky-100 px-2 py-0.5 rounded mt-1.5">
                          <Clock className="w-3 h-3 text-sky-600" />
                          <span>{rel.durationFormatted || `${rel.durationMinutes} min`}</span>
                        </span>
                      )}
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-extrabold text-stone-900 font-mono">
                        {isRelService && rel.servicePriceType === 'quote'
                          ? 'Sob Orçamento'
                          : isRelService && rel.servicePriceType === 'starting_at'
                            ? `A partir de ${(rel.discountPrice || rel.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
                            : (rel.discountPrice || rel.price).toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                      </span>
                      <span className="text-[10px] sm:text-xs font-semibold text-stone-400 group-hover:text-stone-900">
                        {isService ? 'Ver serviço →' : 'Ver peça →'}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* 4. Barra Fixa Mobile de Compra Rápida (1 Toque) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 p-3 sm:hidden shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[11px] text-stone-400 block truncate">{product.name}</span>
            <span className="text-base font-extrabold text-stone-950 font-mono">
              {formattedTotalPrice}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddToCart}
              className={`py-2.5 px-4 rounded-xl text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 ${
                hasPixEnabled ? 'w-full' : 'shrink-0'
              }`}
              style={{ backgroundColor: brandPrimaryColor }}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Adicionar à Sacola</span>
            </button>
            {!hasPixEnabled && (
              <button
                type="button"
                onClick={handleWhatsAppBuy}
                className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center justify-center shrink-0"
                title="Pedir pelo WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5. Carrinho / Sacola Lateral (Drawer Completo) */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        catalog={catalog}
        pricingMode={pricingMode}
        setPricingMode={setPricingMode}
        selectedShipping={selectedShipping}
        setSelectedShipping={setSelectedShipping}
        updateQuantity={updateQuantity}
        removeFromCart={removeFromCart}
      />
    </div>
  );
}
