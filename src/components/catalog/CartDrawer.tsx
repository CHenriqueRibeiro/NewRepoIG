'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  X,
  Plus,
  Minus,
  Trash2,
  Package,
  Sparkles,
  MessageCircle,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Truck,
  Bike,
  Clock,
  Calendar,
  MapPin,
  Wallet,
} from 'lucide-react';
import { CatalogConfig, ProductItem, ShippingMethod, isProductInScheduledDiscount } from '@/lib/catalog/types';
import { getMotoboyCutoffInfo, getUberFlashInfo } from '@/lib/catalog/shipping-helpers';
import { formatWhatsAppBookingMessage } from '@/lib/catalog/service-helpers';
import { PixPaymentModal } from './PixPaymentModal';

export interface CartItem {
  product: ProductItem;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

export interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  catalog: CatalogConfig;
  pricingMode: 'varejo' | 'atacado';
  setPricingMode: (mode: 'varejo' | 'atacado') => void;
  selectedShipping: ShippingMethod;
  setSelectedShipping: (mode: ShippingMethod) => void;
  updateQuantity: (index: number, delta: number) => void;
  removeFromCart: (index: number) => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  catalog,
  pricingMode,
  setPricingMode,
  selectedShipping,
  setSelectedShipping,
  updateQuantity,
  removeFromCart,
}: CartDrawerProps) {
  if (!isOpen) return null;

  const [isPixModalOpen, setIsPixModalOpen] = React.useState(false);

  const isServicesCatalog = catalog.businessType === 'services';

  const shipping = catalog.shipping || {
    motoboyEnabled: true,
    motoboyPrice: 15,
    sedexEnabled: true,
    sedexPrice: 25,
    pickupEnabled: true,
    freeShippingAbove: 299,
  };

  const isProductFlashPromo = (p: ProductItem) => {
    return isProductInScheduledDiscount(p, catalog?.globalScheduledDiscount);
  };

  const getProductPrice = (p: ProductItem, mode: 'varejo' | 'atacado'): number => {
    if (mode === 'atacado') {
      if (p.wholesalePrice && p.wholesalePrice > 0) {
        return p.wholesalePrice;
      }
      const defaultDiscount = catalog.wholesaleConfig?.defaultDiscountPercent || 35;
      return Math.round(p.price * (1 - defaultDiscount / 100) * 100) / 100;
    }

    if (isProductFlashPromo(p)) {
      const discountPercent = catalog.globalScheduledDiscount?.discountPercent ?? 10;
      if (discountPercent > 0) {
        const flashPrice = Math.round(p.price * (1 - discountPercent / 100) * 100) / 100;
        if (p.discountPrice && p.discountPrice < flashPrice) {
          return p.discountPrice;
        }
        return flashPrice;
      }
    }

    return p.discountPrice && p.discountPrice < p.price ? p.discountPrice : p.price;
  };

  const getItemUnitPrice = (item: CartItem): number => {
    const p = item.product;
    if (pricingMode === 'atacado') {
      return getProductPrice(p, 'atacado');
    }
    const itemMinQty = p.wholesaleMinQty || catalog.wholesaleConfig?.minPieces || 3;
    if (catalog.wholesaleConfig?.ruleType === 'per_item' && item.quantity >= itemMinQty) {
      return getProductPrice(p, 'atacado');
    }
    return getProductPrice(p, 'varejo');
  };

  const totalItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const isServices = catalog.businessType === 'services';

  // Duração total estimada para serviços
  const totalServiceMinutes = isServices
    ? cart.reduce((sum, item) => sum + (item.product.durationMinutes || 45) * item.quantity, 0)
    : 0;

  const totalDurationFormatted =
    totalServiceMinutes >= 60
      ? `${Math.floor(totalServiceMinutes / 60)}h ${totalServiceMinutes % 60 > 0 ? `${totalServiceMinutes % 60}min` : ''}`.trim()
      : `${totalServiceMinutes} min`;

  const rawSubtotal = cart.reduce((acc, item) => {
    const price = getItemUnitPrice(item);
    return acc + price * item.quantity;
  }, 0);

  const isWholesaleActive = pricingMode === 'atacado';
  const wholesaleRuleType = catalog.wholesaleConfig?.ruleType || 'min_pieces';
  const wholesaleMinPieces = catalog.wholesaleConfig?.minPieces || 6;
  const wholesaleMinValue = catalog.wholesaleConfig?.minValue || 300;

  const hasMetWholesaleMin = !isWholesaleActive
    ? true
    : wholesaleRuleType === 'cart_value'
    ? rawSubtotal >= wholesaleMinValue
    : wholesaleRuleType === 'per_item'
    ? true
    : totalItemCount >= wholesaleMinPieces;

  const wholesaleRemainingPieces = Math.max(0, wholesaleMinPieces - totalItemCount);
  const wholesaleRemainingValue = Math.max(0, wholesaleMinValue - rawSubtotal);

  // Desconto Progressivo no Varejo
  let activeDiscountPercent = 0;
  if (!isWholesaleActive && catalog.progressiveDiscounts && catalog.progressiveDiscounts.length > 0) {
    const sorted = [...catalog.progressiveDiscounts].sort((a, b) => b.minItems - a.minItems);
    const matched = sorted.find((r) => totalItemCount >= r.minItems);
    if (matched) {
      activeDiscountPercent = matched.discountPercent;
    }
  }

  const motoboyCutoff = getMotoboyCutoffInfo(shipping);
  const uberFlash = getUberFlashInfo(shipping);

  const progressiveDiscountAmount = (rawSubtotal * activeDiscountPercent) / 100;
  const discountedSubtotal = Math.max(0, rawSubtotal - progressiveDiscountAmount);

  const isFreeShipping = Boolean(
    shipping.freeShippingAbove && discountedSubtotal >= shipping.freeShippingAbove
  );

  const shippingCost = isServices
    ? 0
    : selectedShipping === 'pickup' || selectedShipping === 'uber_flash'
    ? 0
    : isFreeShipping
    ? 0
    : selectedShipping === 'motoboy'
    ? shipping.motoboyPrice || 0
    : shipping.sedexPrice || 0;

  const finalTotal = discountedSubtotal + shippingCost;

  const handleCheckoutWhatsApp = () => {
    if (cart.length === 0) return;

    if (isWholesaleActive && !hasMetWholesaleMin) {
      alert(`Para compras no atacado, o pedido mínimo é de ${wholesaleMinPieces} peças ou R$ ${wholesaleMinValue.toFixed(2)}.`);
      return;
    }

    const cleanNumber = catalog.whatsapp?.replace(/\D/g, '') || '5511999998888';

    if (isServices) {
      const sched = catalog.scheduling || catalog.schedulingConfig;
      const isQueueMode = sched?.bookingMode === 'queue';

      const message = formatWhatsAppBookingMessage({
        storeName: catalog.storeName,
        whatsappNumber: cleanNumber,
        items: cart.map((item) => ({
          service: item.product,
          quantity: item.quantity,
        })),
        selectedDate: 'A combinar com a equipe',
        isQueueMode,
        businessHours: sched?.businessHours || 'Segunda a Sábado',
      });

      window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`, '_blank');
      return;
    }

    let itemsList = '';
    cart.forEach((item) => {
      const price = getItemUnitPrice(item);
      const sizeStr = item.selectedSize ? ` (Tam: ${item.selectedSize})` : '';
      const colorStr = item.selectedColor ? ` [Cor: ${item.selectedColor}]` : '';
      itemsList += `• ${item.quantity}x ${item.product.name}${sizeStr}${colorStr} - R$ ${(
        price * item.quantity
      ).toFixed(2)}\n`;
    });

    const modeHeader = isWholesaleActive
      ? `*MODALIDADE:* ATACADO / REVENDA\n*TOTAL DE PEÇAS:* ${totalItemCount} peça(s)\n`
      : `*MODALIDADE:* VAREJO\n`;

    let shippingLabel = '';
    let shippingDisclaimer = '';

    if (selectedShipping === 'pickup') {
      shippingLabel = 'Retirada na Loja (Grátis)';
    } else if (selectedShipping === 'uber_flash') {
      shippingLabel = `${uberFlash.label} (Corrida por conta do cliente)`;
      shippingDisclaimer = `🛵 *ATENÇÃO MOTO UBER / 99:* A corrida é solicitada e paga diretamente pelo cliente após aviso de pedido pronto.\n`;
    } else if (selectedShipping === 'motoboy') {
      const cutoffExtra = motoboyCutoff.enabled
        ? ` [${motoboyCutoff.badgeText}: ${motoboyCutoff.isSameDay ? `pedido até às ${motoboyCutoff.cutoffTime}` : `pedido após às ${motoboyCutoff.cutoffTime}`}]`
        : '';
      shippingLabel = `Motoboy Express (${isFreeShipping ? 'Grátis' : `R$ ${shippingCost.toFixed(2)}`})${cutoffExtra}`;
    } else {
      shippingLabel = `Correios (${isFreeShipping ? 'Grátis' : `R$ ${shippingCost.toFixed(2)}`})`;
    }

    const discountMsg =
      activeDiscountPercent > 0
        ? `Desconto Progressivo (${activeDiscountPercent}%): -R$ ${progressiveDiscountAmount.toFixed(2)}\n`
        : '';

    const message = `Olá! Gostaria de finalizar meu pedido pelo catálogo da *${catalog.storeName}*:\n\n${modeHeader}\n*ITENS ESCOLHIDOS:*\n${itemsList}\n${discountMsg}*FORMA DE ENTREGA:* ${shippingLabel}\n${shippingDisclaimer}*TOTAL FINAL:* R$ ${finalTotal.toFixed(
      2
    )}\n\nPor favor, confirmem a disponibilidade para fechamento.`;

    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs transition-opacity duration-300">
      <div className="w-full sm:max-w-md bg-white h-full flex flex-col justify-between shadow-2xl text-stone-900 font-sans animate-in slide-in-from-right duration-300">
        {/* Header do Carrinho */}
        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isServices ? (
              <Calendar className="w-5 h-5 text-purple-700" />
            ) : (
              <ShoppingBag className="w-5 h-5 text-stone-900" />
            )}
            <h3 className="font-bold text-base text-stone-900">
              {isServices
                ? `Lista de Agendamentos (${totalItemCount} ${totalItemCount === 1 ? 'serviço' : 'serviços'})`
                : `Meu Carrinho (${totalItemCount} ${totalItemCount === 1 ? 'item' : 'itens'})`}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full text-stone-400 hover:text-stone-900 hover:bg-stone-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabela de Preços Atacado / Varejo (se configurado) */}
        {!isServicesCatalog && catalog.wholesaleConfig?.enabled && (
          <div className="px-4 py-2.5 bg-stone-50 border-b border-stone-100 flex items-center justify-between">
            <span className="text-[11px] font-medium text-stone-500">Tabela de Preços:</span>
            <div className="inline-flex p-0.5 bg-stone-200/80 rounded-lg">
              <button
                type="button"
                onClick={() => setPricingMode('varejo')}
                className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all ${
                  pricingMode === 'varejo'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                Varejo
              </button>
              <button
                type="button"
                onClick={() => setPricingMode('atacado')}
                className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all ${
                  pricingMode === 'atacado'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                Atacado
              </button>
            </div>
          </div>
        )}

        {/* Aviso de Desconto Progressivo */}
        {!isServicesCatalog && pricingMode === 'varejo' && catalog.progressiveDiscounts && catalog.progressiveDiscounts.length > 0 && (
          <div className="p-3 bg-stone-50 border-b border-stone-100 text-[11px] text-stone-700 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>
              {activeDiscountPercent > 0 ? (
                <strong className="text-emerald-700">
                  Desconto de {activeDiscountPercent}% aplicado com sucesso!
                </strong>
              ) : (
                <span>
                  Leve {catalog.progressiveDiscounts[0].minItems} peças ou mais e ganhe desconto especial!
                </span>
              )}
            </span>
          </div>
        )}

        {/* Lista de Itens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-stone-100">
          {cart.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto stroke-[1.5]" />
              <p className="text-stone-500 text-sm font-medium">Sua sacola está vazia no momento.</p>
              <button
                type="button"
                onClick={onClose}
                className="inline-block text-xs font-bold text-amber-800 hover:underline pt-2"
              >
                Explorar catálogo da boutique →
              </button>
            </div>
          ) : (
            cart.map((item, idx) => {
              const unitPrice = getItemUnitPrice(item);

              return (
                <div key={idx} className="pt-3 first:pt-0 flex gap-3 items-center">
                  <img
                    src={
                      item.product.images?.[0] ||
                      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600'
                    }
                    alt={item.product.name}
                    className="w-16 h-16 rounded-xl object-cover bg-stone-100 shrink-0 border border-stone-100"
                  />

                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-stone-900 truncate">
                      {item.product.name}
                    </h4>
                    <div className="text-[11px] text-stone-500 mt-0.5">
                      {item.selectedSize && <span>Tam: {item.selectedSize} </span>}
                      {item.selectedColor && <span>• {item.selectedColor}</span>}
                    </div>
                    <div className="font-extrabold text-xs text-stone-900 mt-1 font-mono">
                      R$ {(unitPrice * item.quantity).toFixed(2)}{' '}
                      <span className="text-[10px] text-stone-400 font-normal">
                        (R$ {unitPrice.toFixed(2)} un)
                      </span>
                    </div>
                  </div>

                  {/* Controle de Quantidade */}
                  <div className="flex items-center gap-1.5 bg-stone-100 rounded-lg p-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateQuantity(idx, -1)}
                      className="w-6 h-6 rounded bg-white text-stone-700 hover:bg-stone-50 flex items-center justify-center shadow-2xs transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-5 text-center font-bold text-xs font-mono">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(idx, 1)}
                      className="w-6 h-6 rounded bg-white text-stone-700 hover:bg-stone-50 flex items-center justify-center shadow-2xs transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFromCart(idx)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg transition-colors"
                    title="Remover"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Rodapé da Sacola com Formas de Entrega e Botões */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-stone-200 bg-stone-50/90 space-y-3 text-xs">
            {/* Opções de Atendimento (SERVIÇOS) ou Formas de Entrega (PRODUTOS) */}
            {isServices ? (
              <div className="p-3 bg-purple-50/80 border border-purple-200/80 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-purple-700" />
                    <span>Atendimento Presencial</span>
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full">
                    Sem Taxa de Frete
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-stone-700 pt-0.5">
                  <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-purple-200 shadow-2xs font-bold text-purple-900">
                    <Clock className="w-3.5 h-3.5 text-purple-600" />
                    <span>Duração Total Estimada: {totalDurationFormatted}</span>
                  </div>
                </div>

                {(catalog.scheduling?.businessHours || catalog.schedulingConfig?.businessHours) && (
                  <p className="text-[11px] text-stone-600">
                    Horário de Funcionamento: <strong className="text-stone-800">{catalog.scheduling?.businessHours || catalog.schedulingConfig?.businessHours}</strong>
                  </p>
                )}

                {(catalog.scheduling?.serviceNotice || catalog.schedulingConfig?.serviceNotice) && (
                  <p className="text-[10.5px] text-purple-950 bg-purple-100/70 p-2 rounded-xl leading-relaxed">
                    ℹ️ {catalog.scheduling?.serviceNotice || catalog.schedulingConfig?.serviceNotice}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                <span className="font-bold text-stone-700 block text-[11px] uppercase tracking-wider">
                  Forma de Entrega:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {shipping.motoboyEnabled && (
                    <button
                      type="button"
                      onClick={() => setSelectedShipping('motoboy')}
                      className={`p-2 rounded-xl border text-center transition-all flex flex-col justify-between items-center ${
                        selectedShipping === 'motoboy'
                          ? 'border-stone-900 bg-white font-bold text-stone-900 shadow-2xs ring-1 ring-stone-900'
                          : 'border-stone-200 bg-white/60 text-stone-600 hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-1 text-[10.5px]">
                        <Truck className="w-3.5 h-3.5 text-stone-700" />
                        <span>Motoboy</span>
                      </div>
                      <div className="font-bold text-xs mt-0.5">
                        {isFreeShipping ? 'Grátis' : `R$ ${(shipping.motoboyPrice || 15).toFixed(2)}`}
                      </div>
                      {motoboyCutoff.enabled ? (
                        <span
                          className={`text-[9px] mt-1 px-1.5 py-0.5 rounded font-bold leading-tight ${
                            motoboyCutoff.isSameDay
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {motoboyCutoff.badgeText}
                        </span>
                      ) : (
                        <span className="text-[9px] text-stone-400 mt-0.5">Express</span>
                      )}
                    </button>
                  )}

                  {uberFlash.enabled && (
                    <button
                      type="button"
                      onClick={() => setSelectedShipping('uber_flash')}
                      className={`p-2 rounded-xl border text-center transition-all flex flex-col justify-between items-center ${
                        selectedShipping === 'uber_flash'
                          ? 'border-stone-900 bg-white font-bold text-stone-900 shadow-2xs ring-1 ring-stone-900'
                          : 'border-stone-200 bg-white/60 text-stone-600 hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-1 text-[10.5px]">
                        <Bike className="w-3.5 h-3.5 text-amber-700" />
                        <span>Moto Uber / 99</span>
                      </div>
                      <div className="font-bold text-xs mt-0.5 text-stone-900">
                        R$ 0,00 <span className="text-[9px] font-normal text-stone-500">(Loja)</span>
                      </div>
                      <span className="text-[9px] mt-1 px-1.5 py-0.5 rounded font-bold bg-amber-100 text-amber-900 leading-tight">
                        Cliente Paga App
                      </span>
                    </button>
                  )}

                  {shipping.sedexEnabled && (
                    <button
                      type="button"
                      onClick={() => setSelectedShipping('sedex')}
                      className={`p-2 rounded-xl border text-center transition-all flex flex-col justify-between items-center ${
                        selectedShipping === 'sedex'
                          ? 'border-stone-900 bg-white font-bold text-stone-900 shadow-2xs ring-1 ring-stone-900'
                          : 'border-stone-200 bg-white/60 text-stone-600 hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-1 text-[10.5px]">
                        <Package className="w-3.5 h-3.5 text-stone-700" />
                        <span>Correios</span>
                      </div>
                      <div className="font-bold text-xs mt-0.5">
                        {isFreeShipping ? 'Grátis' : `R$ ${(shipping.sedexPrice || 25).toFixed(2)}`}
                      </div>
                      <span className="text-[9px] text-stone-400 mt-0.5">
                        {shipping.sedexEstimate || 'Nacional'}
                      </span>
                    </button>
                  )}

                  {shipping.pickupEnabled && (
                    <button
                      type="button"
                      onClick={() => setSelectedShipping('pickup')}
                      className={`p-2 rounded-xl border text-center transition-all flex flex-col justify-between items-center ${
                        selectedShipping === 'pickup'
                          ? 'border-stone-900 bg-white font-bold text-stone-900 shadow-2xs ring-1 ring-stone-900'
                          : 'border-stone-200 bg-white/60 text-stone-600 hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-1 text-[10.5px]">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Retirada</span>
                      </div>
                      <div className="font-bold text-xs mt-0.5 text-emerald-700">Grátis</div>
                      <span className="text-[9px] text-stone-400 mt-0.5">Balcão da Loja</span>
                    </button>
                  )}
                </div>

                {/* Aviso dinâmico do Uber Flash / 99 */}
                {selectedShipping === 'uber_flash' && (
                  <div className="p-2.5 rounded-xl bg-amber-50/90 border border-amber-200/90 text-amber-950 space-y-1 animate-in fade-in">
                    <div className="font-bold flex items-center gap-1.5 text-amber-900 text-[11px]">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Quem paga o Uber Flash / 99 é o cliente</span>
                    </div>
                    <p className="text-[10.5px] text-amber-900/90 leading-relaxed">
                      {uberFlash.notice}
                    </p>
                    {uberFlash.address && (
                      <div className="text-[10px] text-amber-950 font-medium pt-1 border-t border-amber-200/60 flex items-center gap-1">
                        <span>📍 Endereço para chamar o motoboy:</span>
                        <strong className="underline underline-offset-2">{uberFlash.address}</strong>
                      </div>
                    )}
                  </div>
                )}

                {/* Aviso dinâmico de Horário de Corte do Motoboy */}
                {selectedShipping === 'motoboy' && motoboyCutoff.enabled && (
                  <div
                    className={`p-2.5 rounded-xl border space-y-0.5 animate-in fade-in ${
                      motoboyCutoff.isSameDay
                        ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
                        : 'bg-amber-50/90 border-amber-200 text-amber-950'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5 text-[11px]">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>{motoboyCutoff.badgeText}:</span>
                      <span className="font-normal">{motoboyCutoff.statusMessage}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Resumo de Valores */}
            <div className="space-y-1 pt-2 border-t border-stone-200">
              <div className="flex justify-between text-stone-500">
                <span>Subtotal:</span>
                <span className="font-mono">R$ {rawSubtotal.toFixed(2)}</span>
              </div>

              {activeDiscountPercent > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Desconto ({activeDiscountPercent}%):</span>
                  <span className="font-mono">-R$ {progressiveDiscountAmount.toFixed(2)}</span>
                </div>
              )}

              {!isServices && (
                <div className="flex justify-between text-stone-500">
                  <span>Frete:</span>
                  <span className="font-mono">
                    {shippingCost === 0 ? 'Grátis' : `R$ ${shippingCost.toFixed(2)}`}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-sm font-extrabold text-stone-900 pt-1 border-t border-stone-200">
                <span>Total Final:</span>
                <span className="font-mono text-base">R$ {finalTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Opções de Checkout com PIX e WhatsApp */}
            {catalog.paymentConfig?.pixEnabled && catalog.paymentConfig?.pixKey && (catalog.paymentConfig.showPixScreenWithProof ?? true) ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setIsPixModalOpen(true)}
                  className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99]"
                >
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  <span>Pagar com PIX &amp; Enviar Comprovante</span>
                </button>

                {(catalog.paymentConfig.allowWhatsAppDirectCheckout ?? true) && (
                  <button
                    type="button"
                    onClick={handleCheckoutWhatsApp}
                    className="w-full py-3 rounded-2xl border-2 border-emerald-600/70 hover:bg-emerald-50 text-emerald-800 font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span>Finalizar direto pelo WhatsApp</span>
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={handleCheckoutWhatsApp}
                className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99]"
              >
                <MessageCircle className="w-4 h-4" />
                <span>
                  {isServices
                    ? `Confirmar Agendamento no WhatsApp (R$ ${finalTotal.toFixed(2)})`
                    : 'Finalizar pedido pelo WhatsApp'}
                </span>
              </button>
            )}

            {/* Box de Confiança */}
            <div className="pt-1 text-center flex items-center justify-center gap-1.5 text-[10px] text-stone-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {isServices
                  ? 'Atendimento pontual e garantido direto com o profissional'
                  : 'Compra 100% segura direto com a loja'}
              </span>
            </div>

            {/* Alternativa PIX Instantâneo / Gateway */}
            <Link
              href={`/checkout/cart-${Date.now()}`}
              className="w-full py-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all text-center"
            >
              <span>Pagar com PIX Dinâmico ou Cartão</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>

      {/* Modal PIX Copia e Cola & Envio de Comprovante no WhatsApp */}
      <PixPaymentModal
        isOpen={isPixModalOpen}
        onClose={() => setIsPixModalOpen(false)}
        totalAmount={finalTotal}
        storeName={catalog.storeName}
        whatsappNumber={catalog.whatsapp}
        paymentConfig={catalog.paymentConfig}
        items={cart.map((item) => ({
          name: item.product.name,
          quantity: item.quantity,
          price: getItemUnitPrice(item),
          size: item.selectedSize,
          color: item.selectedColor,
        }))}
        shippingLabel={
          selectedShipping === 'pickup'
            ? 'Retirada no Local'
            : selectedShipping === 'uber_flash'
            ? 'Retirada por Moto Uber / 99'
            : selectedShipping === 'motoboy'
            ? 'Motoboy Express'
            : 'Correios / Envio Nacional'
        }
        shippingCost={shippingCost}
        discountAmount={progressiveDiscountAmount}
        onFallbackDirectWhatsApp={handleCheckoutWhatsApp}
      />
    </div>
  );
}
