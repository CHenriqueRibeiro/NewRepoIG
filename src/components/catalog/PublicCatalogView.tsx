'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { CatalogConfig, ProductItem, ShippingMethod, isProductInScheduledDiscount, isColorDark } from '@/lib/catalog/types';
import { getTemplateById, getDefaultCatalog } from '@/lib/catalog/templates';
import { getMotoboyCutoffInfo, getUberFlashInfo } from '@/lib/catalog/shipping-helpers';
import {
  ShoppingBag,
  Search,
  Check,
  X,
  Plus,
  Minus,
  Trash2,
  Clock,
  Sparkles,
  MapPin,
  Flame,
  Zap,
  ArrowRight,
  MessageCircle,
  Truck,
  ChevronRight,
  User,
  SlidersHorizontal,
  Package,
  AlertCircle,
  Heart,
  ShieldCheck,
  Star,
  Calendar,
  Bike,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getTypographyPreset } from '@/lib/catalog/typography';
import { resolveTopicIcon } from '@/lib/catalog/topicIcons';
import { buildProductCleanUrl, matchProductBySlug, matchCategoryBySlug } from '@/lib/catalog/url-helpers';
import { PixPaymentModal } from './PixPaymentModal';

interface CartItem {
  product: ProductItem;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

export interface PublicCatalogViewProps {
  storeSlug: string;
  productPath?: string[];
  initialCatalog?: CatalogConfig;
}

export default function PublicCatalogView({
  storeSlug,
  productPath,
  initialCatalog: passedInitialCatalog,
}: PublicCatalogViewProps) {
  const slug = storeSlug || 'minha-loja';
  const router = useRouter();
  const initialCatalog = passedInitialCatalog || getTemplateById(slug)?.config || getDefaultCatalog();
  const [catalog, setCatalog] = useState<CatalogConfig>(initialCatalog);
  const isServicesCatalog = catalog.businessType === 'services';
  const [pricingMode, setPricingMode] = useState<'varejo' | 'atacado'>('varejo');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPixModalOpen, setIsPixModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [modalSize, setModalSize] = useState<string>('');
  const [modalColor, setModalColor] = useState<string>('');
  const [modalActiveImage, setModalActiveImage] = useState<number>(0);
  const [activeCategory, setActiveCategory] = useState('TODAS');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [selectedShipping, setSelectedShipping] = useState<ShippingMethod>('motoboy');
  const [countdownText, setCountdownText] = useState('00:00:00');
  const [notificationToast, setNotificationToast] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [modalQty, setModalQty] = useState(1);

  // Sincronização automática do carrinho com o localStorage e com a página do produto
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`vitryne_cart_${slug}`);
      if (saved) {
        setCart(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Erro ao carregar carrinho:', e);
    }

    const handleSync = () => {
      try {
        const saved = localStorage.getItem(`vitryne_cart_${slug}`);
        if (saved) {
          setCart(JSON.parse(saved));
        }
      } catch (e) { }
    };

    window.addEventListener('vitryne_cart_changed', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('vitryne_cart_changed', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [slug]);

  const toggleFavorite = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
        setNotificationToast('Item adicionado aos seus favoritos!');
        setTimeout(() => setNotificationToast(null), 2500);
      }
      return next;
    });
  };

  // Carrega dados atualizados do catálogo pela API se houver alterações salvas
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/catalog/${slug}`);
        const data = await res.json();
        if (data.catalog) {
          setCatalog(data.catalog);

          // 1. Resolução de URL Amigável: /[storeSlug]/[categoria]/[produto] ou /[storeSlug]/[produto]
          if (productPath && productPath.length > 0) {
            const allCats = data.catalog.topics || Array.from(new Set((data.catalog.products || []).map((p: any) => p.category).filter(Boolean)));
            if (productPath.length === 1) {
              const segment = productPath[0];
              const matchedCat = matchCategoryBySlug(allCats, segment);
              if (matchedCat) {
                setActiveCategory(matchedCat.toUpperCase());
              } else {
                const matched = matchProductBySlug(data.catalog.products || [], segment);
                if (matched) {
                  const url = buildProductCleanUrl('', slug, {
                    id: matched.id,
                    title: matched.name,
                    category: matched.category,
                  });
                  router.replace(url);
                }
              }
            } else if (productPath.length >= 2) {
              const [catSeg, prodSeg] = productPath;
              const matchedCat = matchCategoryBySlug(allCats, catSeg);
              if (matchedCat) {
                setActiveCategory(matchedCat.toUpperCase());
              }
              const matched = matchProductBySlug(data.catalog.products || [], prodSeg);
              if (matched) {
                const url = buildProductCleanUrl('', slug, {
                  id: matched.id,
                  title: matched.name,
                  category: matched.category,
                });
                router.replace(url);
              }
            }
          }

          // 2. Fallback de compatibilidade caso alguém use ?p=productId
          if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const targetId = urlParams.get('p') || urlParams.get('product');
            if (targetId) {
              const matched = matchProductBySlug(data.catalog.products || [], targetId);
              if (matched) {
                const url = buildProductCleanUrl('', slug, {
                  id: matched.id,
                  title: matched.name,
                  category: matched.category,
                });
                router.replace(url);
              }
            }
          }
        }
      } catch (e) {
        console.warn('Usando catálogo inicial:', e);
      }
    }
    load();
  }, [slug]);

  // Cronômetro da Oferta Relâmpago
  useEffect(() => {
    if (!catalog?.globalScheduledDiscount?.enabled) return;

    const interval = setInterval(() => {
      const targetDate = new Date(catalog.globalScheduledDiscount!.endsAt).getTime();
      const now = new Date().getTime();
      const diff = targetDate - now;

      if (diff <= 0) {
        setCountdownText('00:00:00');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdownText(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [catalog]);

  const { theme, products, progressiveDiscounts, globalScheduledDiscount } = catalog;

  const defaultShippingConfig = {
    pickupEnabled: false,
    pickupLabel: 'Retirada no Showroom',
    pickupAddress: '',
    motoboyEnabled: true,
    motoboyPrice: 15.0,
    motoboyEstimate: 'Entrega hoje',
    sedexEnabled: true,
    sedexPrice: 22.0,
    sedexEstimate: 'Correios todo o Brasil',
    freeShippingAbove: 299.0,
  };

  const shipping = {
    ...defaultShippingConfig,
    ...(catalog.shipping || {}),
  };

  // Extrai lista de categorias limpa e tópicos configurados pelo lojista
  const allCategories = React.useMemo(() => {
    const list: string[] = ['TODAS'];
    const seen = new Set<string>(['TODAS']);

    // Tópicos explicitamente configurados pelo lojista (ex: Roupa Masculina)
    (catalog.topics || []).forEach((t) => {
      const upper = t.trim().toUpperCase();
      if (upper && !seen.has(upper)) {
        seen.add(upper);
        list.push(upper);
      }
    });

    // Categorias existentes em produtos
    products.forEach((p) => {
      const upper = (p.category || 'GERAL').trim().toUpperCase();
      if (upper && !seen.has(upper)) {
        seen.add(upper);
        list.push(upper);
      }
    });

    return list;
  }, [catalog.topics, products]);

  // Identifica se o produto está esgotado (nunca esgota se estoque infinito estiver ativo)
  const isProductSoldOut = (p: ProductItem) => {
    if (p.isInfiniteStock) return false;
    if (catalog.outOfStockBehavior === 'infinite' || p.outOfStockAction === 'infinite') return false;
    if (p.isUniquePiece) return p.stock !== undefined && p.stock <= 0;
    return (p.stock || 0) <= 0;
  };

  // Identifica a ação de esgotado efetiva (regra do produto tem precedência sobre a regra geral da loja)
  const getProductOutOfStockAction = (p: ProductItem) => {
    if (p.outOfStockAction && p.outOfStockAction !== 'default') {
      return p.outOfStockAction;
    }
    return catalog.outOfStockBehavior || 'badge-sold-out';
  };

  // Verifica se o produto participa da Oferta Relâmpago ativa
  const isProductFlashPromo = (p: ProductItem) => {
    return isProductInScheduledDiscount(p, catalog?.globalScheduledDiscount);
  };

  // Obtém o preço de acordo com a modalidade selecionada (Varejo vs Atacado)
  const getProductPrice = (p: ProductItem, mode: 'varejo' | 'atacado' = pricingMode) => {
    if (mode === 'atacado') {
      if (p.wholesalePrice !== undefined && p.wholesalePrice > 0) {
        return p.wholesalePrice;
      }
      const defaultDiscount = catalog.wholesaleConfig?.defaultDiscountPercent || 35;
      return Math.round(p.price * (1 - defaultDiscount / 100) * 100) / 100;
    }

    // Se estiver em oferta relâmpago no varejo:
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

  const getWholesaleDiscountPercent = (p: ProductItem) => {
    const wholesale = getProductPrice(p, 'atacado');
    if (p.price > 0 && wholesale < p.price) {
      return Math.round(((p.price - wholesale) / p.price) * 100);
    }
    return catalog.wholesaleConfig?.defaultDiscountPercent || 35;
  };

  const shouldPinBadges = catalog.pinBadgedProductsToTop !== false;

  const filteredProducts = useMemo(() => {
    const list = products.filter((p) => {
      const isSoldOut = isProductSoldOut(p);
      const outAction = getProductOutOfStockAction(p);

      // Se o produto acabou e a opção for "sair do catálogo" (hide), remove da vitrine pública!
      if (isSoldOut && outAction === 'hide') {
        return false;
      }

      const pCategory = (p.category || 'GERAL').toUpperCase();
      const matchesCategory = activeCategory === 'TODAS' || pCategory === activeCategory;
      const matchesSearch =
        !searchTerm ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesCategory && matchesSearch;
    });

    if (shouldPinBadges) {
      return [...list].sort((a, b) => {
        const aSoldOut = isProductSoldOut(a);
        const bSoldOut = isProductSoldOut(b);

        // 1. Peças disponíveis vêm antes das esgotadas
        if (aSoldOut !== bSoldOut) {
          return aSoldOut ? 1 : -1;
        }

        // 2. Peças com Selo/Badge (Destaque, Novidade, Mais Vendido, etc.)
        // têm prioridade máxima e vão para o TOPO da vitrine, mesmo sendo mais caras!
        const aHasBadge = Boolean(a.badge && a.badge.trim().length > 0);
        const bHasBadge = Boolean(b.badge && b.badge.trim().length > 0);

        if (aHasBadge !== bHasBadge) {
          return aHasBadge ? -1 : 1;
        }

        return 0;
      });
    }

    return list;
  }, [products, activeCategory, searchTerm, catalog.outOfStockBehavior, shouldPinBadges]);

  const showToast = (msg: string) => {
    setNotificationToast(msg);
    setTimeout(() => setNotificationToast(null), 3000);
  };

  const addToCart = (product: ProductItem, size?: string, color?: string, qty = 1) => {
    const safeQty = Math.max(1, qty);
    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (item) =>
          item.product.id === product.id &&
          item.selectedSize === size &&
          item.selectedColor === color
      );

      let nextCart: CartItem[];
      if (existingIdx > -1) {
        nextCart = prev.map((item, idx) =>
          idx === existingIdx
            ? { ...item, quantity: item.quantity + safeQty }
            : item
        );
      } else {
        nextCart = [
          ...prev,
          { product, quantity: safeQty, selectedSize: size, selectedColor: color },
        ];
      }

      try {
        localStorage.setItem(`vitryne_cart_${slug}`, JSON.stringify(nextCart));
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('vitryne_cart_changed'));
          }
        }, 0);
      } catch (e) { }

      return nextCart;
    });

    showToast(`"${product.name}" adicionado à sacola!`);
  };

  const openProductModal = (product: ProductItem) => {
    const url = buildProductCleanUrl('', slug, {
      id: product.id,
      title: product.name,
      category: product.category,
    });
    router.push(url);
  };

  // Produtos Indicados / Cross-Sell para a peça selecionada no modal
  const recommendedProducts = useMemo(() => {
    if (!selectedProduct) return [];
    const rec = selectedProduct.recommendations;
    if (!rec || !rec.enabled) return [];

    const allOtherProducts = products.filter(
      (p) => p.id !== selectedProduct.id && !isProductSoldOut(p)
    );

    if (rec.mode === 'fixed') {
      if (!rec.productIds || rec.productIds.length === 0) return [];
      const map = new Map(products.map((p) => [p.id, p]));
      return rec.productIds
        .map((id) => map.get(id))
        .filter((p): p is ProductItem => p !== undefined && p.id !== selectedProduct.id);
    }

    if (rec.mode === 'random_selected') {
      if (!rec.productIds || rec.productIds.length === 0) return [];
      const map = new Map(products.map((p) => [p.id, p]));
      const matched = rec.productIds
        .map((id) => map.get(id))
        .filter((p): p is ProductItem => p !== undefined && p.id !== selectedProduct.id);
      return [...matched].sort(() => Math.random() - 0.5);
    }

    if (rec.mode === 'topic') {
      const targetTopic =
        !rec.targetTopic || rec.targetTopic === 'CURRENT'
          ? (selectedProduct.category || '').trim().toUpperCase()
          : rec.targetTopic.trim().toUpperCase();

      return allOtherProducts
        .filter((p) => (p.category || 'GERAL').trim().toUpperCase() === targetTopic)
        .slice(0, 6);
    }

    return [];
  }, [selectedProduct, products, catalog.outOfStockBehavior]);

  const updateQuantity = (index: number, delta: number) => {
    setCart((prev) => {
      if (!prev[index]) return prev;

      const newQty = prev[index].quantity + delta;
      let nextCart: CartItem[];

      if (newQty <= 0) {
        nextCart = prev.filter((_, i) => i !== index);
      } else {
        nextCart = prev.map((item, i) =>
          i === index ? { ...item, quantity: newQty } : item
        );
      }

      try {
        localStorage.setItem(`vitryne_cart_${slug}`, JSON.stringify(nextCart));
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('vitryne_cart_changed'));
          }
        }, 0);
      } catch (e) { }

      return nextCart;
    });
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => {
      const nextCart = prev.filter((_, i) => i !== index);
      try {
        localStorage.setItem(`vitryne_cart_${slug}`, JSON.stringify(nextCart));
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('vitryne_cart_changed'));
          }
        }, 0);
      } catch (e) { }
      return nextCart;
    });
  };

  // Cálculos do Carrinho
  const totalItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Regras e Configuração de Atacado
  const isWholesaleActive = pricingMode === 'atacado';
  const wholesaleRuleType = catalog.wholesaleConfig?.ruleType || 'cart_pieces';
  const wholesaleMinPieces = catalog.wholesaleConfig?.minPieces || 6;
  const wholesaleMinValue = catalog.wholesaleConfig?.minValue || 300;

  // Preço unitário do item considerando se é por item ou global
  const getItemUnitPrice = (item: CartItem) => {
    if (wholesaleRuleType === 'per_item') {
      const itemMinQty = item.product.wholesaleMinQty || wholesaleMinPieces || 3;
      if (item.quantity >= itemMinQty || isWholesaleActive) {
        return getProductPrice(item.product, 'atacado');
      }
      return getProductPrice(item.product, 'varejo');
    }
    return getProductPrice(item.product, pricingMode);
  };

  const rawSubtotal = cart.reduce((acc, item) => {
    const price = getItemUnitPrice(item);
    return acc + price * item.quantity;
  }, 0);

  // Verificação de cumprimento das regras de atacado
  let hasMetWholesaleMin = true;
  let wholesaleRemainingPieces = 0;
  let wholesaleRemainingValue = 0;

  if (isWholesaleActive) {
    if (wholesaleRuleType === 'cart_value') {
      hasMetWholesaleMin = rawSubtotal >= wholesaleMinValue;
      wholesaleRemainingValue = Math.max(0, wholesaleMinValue - rawSubtotal);
    } else if (wholesaleRuleType === 'per_item') {
      // Por item: atacado aplicado individualmente em cada modelo que atingir a meta
      hasMetWholesaleMin = true;
    } else {
      // cart_pieces
      hasMetWholesaleMin = totalItemCount >= wholesaleMinPieces;
      wholesaleRemainingPieces = Math.max(0, wholesaleMinPieces - totalItemCount);
    }
  }

  // Cálculo de Desconto Progressivo (ativo no Varejo)
  let activeDiscountPercent = 0;
  let nextDiscountTier: { minItems: number; discountPercent: number } | null = null;

  if (pricingMode === 'varejo' && progressiveDiscounts && progressiveDiscounts.length > 0) {
    const sortedTiers = [...progressiveDiscounts].sort((a, b) => a.minItems - b.minItems);
    for (const tier of sortedTiers) {
      if (totalItemCount >= tier.minItems) {
        activeDiscountPercent = tier.discountPercent;
      } else if (!nextDiscountTier) {
        nextDiscountTier = tier;
      }
    }
  }

  const progressiveDiscountAmount = (rawSubtotal * activeDiscountPercent) / 100;
  const subtotalAfterDiscount = rawSubtotal - progressiveDiscountAmount;

  const motoboyCutoff = getMotoboyCutoffInfo(shipping);
  const uberFlash = getUberFlashInfo(shipping);

  // Frete
  let shippingCost = 0;
  const isFreeShipping = Boolean(
    shipping?.freeShippingAbove && subtotalAfterDiscount >= shipping.freeShippingAbove
  );

  if (!isFreeShipping) {
    if (selectedShipping === 'motoboy' && shipping?.motoboyEnabled) {
      shippingCost = shipping.motoboyPrice || 15.0;
    } else if (selectedShipping === 'sedex' && shipping?.sedexEnabled) {
      shippingCost = shipping.sedexPrice || 22.0;
    } else if (selectedShipping === 'pickup' || selectedShipping === 'uber_flash') {
      shippingCost = 0;
    }
  }

  const finalTotal = subtotalAfterDiscount + shippingCost;

  // Checkout no WhatsApp com mensagem formatada
  const handleCheckoutWhatsApp = () => {
    if (cart.length === 0) return;

    if (isWholesaleActive && !hasMetWholesaleMin && catalog.wholesaleConfig?.requireMinPieces !== false) {
      if (wholesaleRuleType === 'cart_value') {
        setNotificationToast(
          `Adicione mais R$ ${wholesaleRemainingValue.toFixed(2)} para atingir o valor mínimo de atacado (R$ ${wholesaleMinValue.toFixed(2)})`
        );
      } else {
        setNotificationToast(
          `Adicione mais ${wholesaleRemainingPieces} peça(s) para atingir o mínimo de atacado (${wholesaleMinPieces} un)`
        );
      }
      setTimeout(() => setNotificationToast(null), 4000);
      return;
    }

    let itemsList = '';
    cart.forEach((item) => {
      const price = getItemUnitPrice(item);
      const itemMinQty = item.product.wholesaleMinQty || wholesaleMinPieces || 3;
      const isItemWholesale =
        isWholesaleActive || (wholesaleRuleType === 'per_item' && item.quantity >= itemMinQty);
      const sizeStr = item.selectedSize ? ` (Tam: ${item.selectedSize})` : '';
      const colorStr = item.selectedColor ? ` [Cor: ${item.selectedColor}]` : '';
      const tagStr = isItemWholesale ? ' [ATACADO]' : '';
      itemsList += `• ${item.quantity}x ${item.product.name}${sizeStr}${colorStr}${tagStr} - R$ ${(
        price * item.quantity
      ).toFixed(2)}\n`;
    });

    const modeHeader = isWholesaleActive
      ? `*MODALIDADE:* ATACADO / REVENDA (Tabela Especial de Atacado)\n*TOTAL DE PEÇAS:* ${totalItemCount} peça(s)\n`
      : `*MODALIDADE:* VAREJO\n`;

    let shippingLabel = '';
    let shippingDisclaimer = '';

    if (selectedShipping === 'pickup') {
      shippingLabel = 'Retirada no Showroom (Grátis)';
    } else if (selectedShipping === 'uber_flash') {
      shippingLabel = `${uberFlash.label} (Corrida solicitada e paga pelo cliente)`;
      shippingDisclaimer = `🛵 *ATENÇÃO MOTO UBER / 99:* A corrida do Uber Flash ou 99 Moto é solicitada e paga diretamente pelo cliente após aviso de pedido pronto.\n`;
    } else if (selectedShipping === 'motoboy') {
      const cutoffExtra = motoboyCutoff.enabled
        ? ` [${motoboyCutoff.badgeText}: ${motoboyCutoff.isSameDay ? `pedido feito até às ${motoboyCutoff.cutoffTime}` : `pedido após às ${motoboyCutoff.cutoffTime}`}]`
        : '';
      shippingLabel = `Motoboy Express (${isFreeShipping ? 'Grátis' : `R$ ${shippingCost.toFixed(2)}`})${cutoffExtra}`;
    } else {
      shippingLabel = `Envio Correios (${isFreeShipping ? 'Grátis' : `R$ ${shippingCost.toFixed(2)}`})`;
    }

    const discountMsg =
      activeDiscountPercent > 0
        ? `Desconto Progressivo (${activeDiscountPercent}%): -R$ ${progressiveDiscountAmount.toFixed(2)}\n`
        : '';

    const message = `Olá! Gostaria de finalizar meu pedido pelo catálogo da *${catalog.storeName}*:\n\n${modeHeader}\n*ITENS ESCOLHIDOS:*\n${itemsList}\n${discountMsg}*FORMA DE ENTREGA:* ${shippingLabel}\n${shippingDisclaimer}*TOTAL FINAL:* R$ ${finalTotal.toFixed(
      2
    )}\n\nPor favor, confirmem a disponibilidade para fechamento.`;

    const cleanNumber = catalog.whatsapp.replace(/\D/g, '') || '5511999998888';
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const typo = getTypographyPreset(theme.typographyPresetId, theme.fontFamily);

  // Determina cores dinâmicas para o Card do Topo (Hero)
  const defaultHeroBg = theme.backgroundColor && isColorDark(theme.backgroundColor)
    ? (theme.cardBackground || '#111827')
    : '#FAF6F0';
  const heroBg = theme.heroCardBackground || defaultHeroBg;
  const isHeroDark = isColorDark(heroBg);
  const heroTextColor = theme.heroCardTextColor || (isHeroDark ? '#F8FAFC' : '#1C1917');
  const heroMutedColor = isHeroDark ? '#CBD5E1' : '#57534E';
  const heroBorder = theme.heroCardBorderColor || (isHeroDark ? 'rgba(255, 255, 255, 0.12)' : '#E8DCCF');

  return (
    <div
      className="min-h-screen bg-white text-stone-900 selection:bg-stone-900 selection:text-white"
      style={{
        fontFamily: typo.bodyFont,
      }}
    >
      {/* Toast Notification */}
      {notificationToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-stone-900 text-white text-xs font-medium px-5 py-2.5 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2">
          <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
          <span>{notificationToast}</span>
        </div>
      )}

      {/* 1. Header Minimalista */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-stone-200/80 transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 sm:h-20 flex items-center justify-center">
          <Link href={`/${slug}`} className="inline-block text-center group">
            <h2
              className="text-base sm:text-lg tracking-[0.25em] font-medium text-stone-900 uppercase"
              style={{ fontFamily: typo.titleFont }}
            >
              {catalog.storeName}
            </h2>
          </Link>
        </div>
      </header>

      {/* 2. Hero Banner Card Sofisticado com Cor Customizável */}
      <section className="pt-6 pb-6 sm:pt-10 sm:pb-8 px-4 max-w-6xl mx-auto">
        <div
          className="relative overflow-hidden rounded-3xl p-6 sm:p-10 shadow-xs border transition-all"
          style={{
            backgroundColor: heroBg,
            borderColor: heroBorder,
            color: heroTextColor,
          }}
        >
          {/* Decoração sutil de fundo */}
          <div
            className={`absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full blur-2xl pointer-events-none ${isHeroDark ? 'bg-white/5' : 'bg-white/40'
              }`}
          />
          <div
            className={`absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full blur-2xl pointer-events-none ${isHeroDark ? 'bg-indigo-500/10' : 'bg-amber-500/5'
              }`}
          />

          <div className="relative z-10 w-full">
            {/* Título Principal */}
            <h1
              className="text-2xl sm:text-3xl md:text-4xl lg:text-[44px] tracking-tight font-normal leading-[1.18] mb-3 w-full"
              style={{
                fontFamily: typo.titleFont,
                letterSpacing: typo.letterSpacing,
                textTransform: typo.titleTransform,
                color: heroTextColor,
              }}
            >
              {catalog.heroTitle || 'Looks que combinam com você!'}
            </h1>

            {/* Subtítulo Clean */}
            <p
              className="font-sans text-xs sm:text-sm md:text-base leading-relaxed font-light mb-5 w-full"
              style={{ color: heroMutedColor }}
            >
              {catalog.heroSubtitle ||
                'Moda e produtos com qualidade, estilo e muito mais praticidade. Escolha suas peças e conclua seu pedido.'}
            </p>

            {/* Seletor de Modalidade: Varejo vs Atacado se ativo */}
            {!isServicesCatalog && catalog.wholesaleConfig?.enabled !== false && (
              <div className="mb-1">
                <div
                  className={`inline-flex items-center p-1 rounded-full border shadow-2xs ${isHeroDark
                      ? 'bg-white/10 border-white/15'
                      : 'bg-white/90 border-stone-200/90'
                    }`}
                >
                  <button
                    type="button"
                    onClick={() => setPricingMode('varejo')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-sans font-semibold transition-all ${pricingMode === 'varejo'
                        ? isHeroDark
                          ? 'bg-white text-stone-900 shadow-xs'
                          : 'bg-stone-900 text-white shadow-xs'
                        : isHeroDark
                          ? 'text-stone-300 hover:text-white'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                  >
                    Varejo
                  </button>
                  <button
                    type="button"
                    onClick={() => setPricingMode('atacado')}
                    className={`flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-sans font-semibold transition-all ${pricingMode === 'atacado'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : isHeroDark
                          ? 'text-stone-300 hover:text-white'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                  >
                    <Package className="w-3 h-3 text-amber-300" />
                    <span>Atacado</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Banner de Oferta Relâmpago Agendada (Se Ativa) */}
        {globalScheduledDiscount?.enabled && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-3 px-4 py-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs font-sans text-amber-950 shadow-2xs">
            <Flame className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-semibold">{globalScheduledDiscount.bannerTitle}</span>
            {globalScheduledDiscount.applyTo === 'topic' && globalScheduledDiscount.targetTopic && (
              <span className="px-2 py-0.5 rounded-md bg-amber-200/70 font-bold text-[11px] text-amber-950">
                Tópico: {globalScheduledDiscount.targetTopic}
              </span>
            )}
            <span className="text-amber-400 font-mono hidden sm:inline">•</span>
            <div className="flex items-center gap-1 font-mono font-bold tracking-wider text-amber-800 bg-white/80 px-2.5 py-1 rounded-lg border border-amber-200/60">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>{countdownText}</span>
            </div>
          </div>
        )}
      </section>

      {/* 3. Navegação de Categorias em Ícones Circulares (Exatamente como nas referências) */}
      <section className="sticky top-16 sm:top-20 z-30 bg-white/95 backdrop-blur-md py-4 border-b border-stone-100 mb-6">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-3.5 sm:gap-6 overflow-x-auto scrollbar-none pb-1 justify-start sm:justify-center">
            {allCategories.map((cat) => {
              const isSelected = activeCategory === cat;
              const IconComp = resolveTopicIcon(cat, catalog.topicIcons?.[cat]);
              const displayLabel = cat === 'TODAS' ? 'Todas' : (cat.charAt(0) + cat.slice(1).toLowerCase());

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className="group flex flex-col items-center gap-1.5 shrink-0 transition-all focus:outline-hidden"
                >
                  <div
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all ${isSelected
                        ? 'shadow-md scale-105 text-white'
                        : 'bg-stone-50 hover:bg-stone-100 text-stone-600 hover:text-stone-900 border border-stone-200/80 hover:border-stone-400'
                      }`}
                    style={
                      isSelected
                        ? { backgroundColor: theme.primaryColor }
                        : {}
                    }
                  >
                    <IconComp className="w-6 h-6 sm:w-7 sm:h-7 transition-transform group-hover:scale-110" />
                  </div>
                  <span
                    className={`text-[11px] sm:text-xs font-sans tracking-tight truncate max-w-[76px] sm:max-w-[84px] text-center ${isSelected ? 'font-bold text-stone-950' : 'font-medium text-stone-600 group-hover:text-stone-900'
                      }`}
                  >
                    {displayLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Grid de Produtos com Título de Seção e Card Completo */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 pb-16">
        {/* Título de Seção "Destaques da Semana" */}
        <div id="catalogo-produtos" className="scroll-mt-36 mb-6 flex items-end justify-between">
          <div>
            <span className="text-[10px] font-sans tracking-widest uppercase font-semibold text-stone-400 block mb-0.5">
              {activeCategory === 'TODAS' ? 'Catálogo' : 'Categoria'}
            </span>
            <h2
              className="text-lg sm:text-2xl font-bold text-stone-900"
              style={{ fontFamily: typo.titleFont }}
            >
              {activeCategory === 'TODAS' ? 'Destaques da Semana' : activeCategory}
            </h2>
          </div>

          {activeCategory !== 'TODAS' && (
            <button
              type="button"
              onClick={() => {
                setActiveCategory('TODAS');
                setSearchTerm('');
              }}
              className="text-xs font-sans font-semibold text-stone-500 hover:text-stone-900 flex items-center gap-1 transition-colors"
            >
              <span>Ver todos</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {filteredProducts.length === 0 ? (
          <div className="py-24 text-center font-sans space-y-3 max-w-sm mx-auto px-4">
            <div
              className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center shadow-2xs"
              style={{ backgroundColor: `${theme.primaryColor}15`, color: theme.primaryColor }}
            >
              {catalog.businessType === 'services' ? (
                <Calendar className="w-6 h-6 stroke-[1.5]" />
              ) : (
                <ShoppingBag className="w-6 h-6 stroke-[1.5]" />
              )}
            </div>
            <h3 className="text-base font-bold text-stone-800">
              {products.length === 0
                ? catalog.businessType === 'services'
                  ? 'Agenda pronta para receber agendamentos'
                  : 'Vitrine pronta para receber peças'
                : catalog.businessType === 'services'
                  ? 'Nenhum serviço encontrado'
                  : 'Nenhuma peça encontrada'}
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              {products.length === 0
                ? catalog.businessType === 'services'
                  ? 'Novos serviços e horários serão disponibilizados em breve. Acompanhe as novidades no Instagram!'
                  : 'Novas peças serão cadastradas em breve. Fique atento às novidades no Instagram!'
                : catalog.businessType === 'services'
                  ? 'Tente buscar por outro termo ou selecione outro tópico acima.'
                  : 'Tente buscar por outro termo ou selecione outra categoria acima.'}
            </p>
            {products.length > 0 && (
              <button
                onClick={() => {
                  setActiveCategory('TODAS');
                  setSearchTerm('');
                }}
                className="text-stone-900 underline font-semibold text-xs mt-1"
              >
                {catalog.businessType === 'services' ? 'Ver todos os serviços' : 'Ver todas as peças'}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
            {filteredProducts.map((product) => {
              const isFlash = isProductFlashPromo(product);
              const effectivePrice = getProductPrice(product, pricingMode);
              const hasDiscount =
                pricingMode === 'varejo' &&
                (isFlash || (product.discountPrice && product.discountPrice < product.price));
              const isSoldOut = isProductSoldOut(product);

              return (
                <div
                  key={product.id}
                  onClick={() => openProductModal(product)}
                  className="group flex flex-col justify-between cursor-pointer rounded-2xl p-2.5 sm:p-3 bg-white border border-stone-200/80 hover:border-stone-400 hover:shadow-md transition-all duration-300 relative"
                >
                  {/* Imagem do Produto */}
                  <div className="relative w-full aspect-[4/5] bg-stone-100 rounded-xl overflow-hidden mb-2.5">
                    <img
                      src={
                        product.images?.[0] ||
                        'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&auto=format&fit=crop&q=80'
                      }
                      alt={product.name}
                      className={`w-full h-full object-cover transition-transform duration-500 ease-out ${isSoldOut ? 'grayscale-40 opacity-75' : 'group-hover:scale-105'
                        }`}
                      loading="lazy"
                    />

                    {/* Botão de Favorito (Coração Interativo como na ref) */}
                    <button
                      type="button"
                      onClick={(e) => toggleFavorite(product.id, e)}
                      className="absolute top-2 right-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-stone-500 hover:text-rose-500 shadow-xs hover:scale-110 active:scale-95 transition-all z-10"
                      title={favorites.has(product.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                    >
                      <Heart
                        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${favorites.has(product.id)
                            ? 'fill-rose-500 text-rose-500'
                            : 'text-stone-600'
                          }`}
                      />
                    </button>

                    {/* Tag de Esgotado ou Tag Personalizada */}
                    {isSoldOut ? (
                      <span className="absolute top-2 left-2 bg-stone-900/90 backdrop-blur-xs text-white text-[9px] font-sans font-bold px-2 py-0.5 rounded-full border border-stone-700 shadow-2xs tracking-wide">
                        ESGOTADO
                      </span>
                    ) : product.badge ? (
                      <span className="absolute top-2 left-2 bg-white/95 backdrop-blur-xs text-stone-900 text-[9px] font-sans font-bold px-2.5 py-0.5 rounded-full border border-stone-200/90 shadow-2xs flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 text-amber-500 fill-amber-400" />
                        <span>{product.badge}</span>
                      </span>
                    ) : null}

                    {/* Tag de Promoção ou Atacado ou Oferta Relâmpago */}
                    {!isSoldOut && (
                      pricingMode === 'atacado' ? (
                        <span className="absolute bottom-2 left-2 bg-amber-600 text-white text-[9px] font-sans font-bold px-2 py-0.5 rounded-full shadow-2xs">
                          ATACADO -{getWholesaleDiscountPercent(product)}%
                        </span>
                      ) : isFlash ? (
                        <span className="absolute bottom-2 left-2 bg-amber-600 text-white text-[9px] font-sans font-bold px-2 py-0.5 rounded-full shadow-2xs flex items-center gap-1">
                          <Zap className="w-2.5 h-2.5 fill-current" />
                          <span>RELÂMPAGO -{catalog.globalScheduledDiscount?.discountPercent ?? 10}%</span>
                        </span>
                      ) : hasDiscount ? (
                        <span className="absolute bottom-2 left-2 bg-stone-900 text-white text-[9px] font-sans font-bold px-2 py-0.5 rounded-full">
                          PROMO
                        </span>
                      ) : null
                    )}
                  </div>

                  {/* Detalhes do Produto */}
                  <div className="space-y-1.5 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-sans tracking-widest text-stone-400 uppercase font-semibold block">
                        {product.category || 'GERAL'}
                      </span>
                      <h3
                        className="text-xs sm:text-sm font-medium text-stone-800 line-clamp-2 leading-snug group-hover:text-stone-950 transition-colors"
                        style={{ fontFamily: typo.titleFont }}
                      >
                        {product.name}
                      </h3>

                      {/* Duração se for serviço */}
                      {(product.isService || catalog.businessType === 'services') &&
                        (product.durationFormatted || product.durationMinutes) && (
                          <div className="flex items-center gap-1 text-[10px] text-stone-500 font-medium pt-0.5">
                            <Clock className="w-3 h-3 text-stone-400" />
                            <span>{product.durationFormatted || `${product.durationMinutes} min`}</span>
                          </div>
                        )}
                    </div>

                    {/* Preço e Botão Adicionar direto */}
                    <div className="pt-2">
                      <div className="font-sans mb-2">
                        {pricingMode === 'atacado' ? (
                          <div>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-xs sm:text-sm font-bold text-amber-950">
                                R$ {getProductPrice(product, 'atacado').toFixed(2)}
                              </span>
                              <span className="text-[10px] text-stone-400 line-through">
                                R$ {product.price.toFixed(2)}
                              </span>
                            </div>
                            <span className="text-[9px] text-amber-700 font-semibold block">
                              no atacado
                            </span>
                          </div>
                        ) : hasDiscount ? (
                          <div className="flex items-baseline gap-1.5">
                            <span className={`text-xs sm:text-sm font-bold ${isFlash ? 'text-amber-700' : 'text-stone-900'}`}>
                              R$ {effectivePrice.toFixed(2)}
                            </span>
                            <span className="text-[10px] text-stone-400 line-through">
                              R$ {product.price.toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <div>
                            {product.servicePriceType === 'starting_at' && (
                              <span className="text-[9px] text-stone-400 font-semibold uppercase block">
                                A partir de
                              </span>
                            )}
                            <span className="text-xs sm:text-sm font-bold text-stone-900">
                              {product.servicePriceType === 'quote'
                                ? 'Sob Orçamento'
                                : `R$ ${product.price.toFixed(2)}`}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Botão de Ação Direta conforme Modelo 2 */}
                      {isSoldOut ? (
                        <button
                          type="button"
                          disabled
                          onClick={(e) => e.stopPropagation()}
                          className="w-full py-2 rounded-xl text-[11px] font-sans font-semibold text-stone-400 bg-stone-100 cursor-not-allowed flex items-center justify-center gap-1 border border-stone-200/60"
                        >
                          <span>Esgotado</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (product.isService || catalog.businessType === 'services') {
                              openProductModal(product);
                            } else {
                              addToCart(product, product.sizes?.[0], product.colors?.[0]);
                              setNotificationToast(`"${product.name}" adicionado à sacola!`);
                              setTimeout(() => setNotificationToast(null), 3000);
                            }
                          }}
                          className="w-full py-2 rounded-xl text-[11px] font-sans font-semibold text-white transition-all flex items-center justify-center gap-1.5 shadow-2xs hover:opacity-90 active:scale-98"
                          style={{ backgroundColor: theme.primaryColor }}
                          title={
                            product.isService || catalog.businessType === 'services'
                              ? catalog.actionButtonLabel || 'Agendar Horário'
                              : 'Adicionar à Sacola'
                          }
                        >
                          {product.isService || catalog.businessType === 'services' ? (
                            <Calendar className="w-3.5 h-3.5" />
                          ) : (
                            <ShoppingBag className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {product.isService || catalog.businessType === 'services'
                              ? catalog.actionButtonLabel || 'Agendar'
                              : catalog.actionButtonLabel || 'Adicionar'}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 5. Modal de Detalhes do Produto Minimalista */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 text-stone-900 relative">
            <button
              type="button"
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-stone-600 flex items-center justify-center shadow-md"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Foto Grande */}
            <div className="relative w-full aspect-square bg-stone-100 overflow-hidden">
              <img
                src={
                  selectedProduct.images?.[modalActiveImage] ||
                  selectedProduct.images?.[0] ||
                  ''
                }
                alt={selectedProduct.name}
                className="w-full h-full object-cover"
              />

              {/* Thumbnails se houver mais de 1 */}
              {selectedProduct.images && selectedProduct.images.length > 1 && (
                <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2 px-4">
                  {selectedProduct.images.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setModalActiveImage(i)}
                      className={`w-10 h-10 rounded-lg overflow-hidden border-2 shadow-sm ${modalActiveImage === i ? 'border-stone-900 scale-105' : 'border-white/80'
                        }`}
                    >
                      <img src={img} alt="Thumb" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Informações */}
            <div className="p-6 space-y-4 font-sans">
              <div>
                <span className="text-[10px] font-sans tracking-widest uppercase font-semibold text-stone-400">
                  {selectedProduct.category}
                </span>
                <h2
                  className="text-base sm:text-lg font-bold text-stone-900 mt-0.5"
                  style={{ fontFamily: typo.titleFont }}
                >
                  {selectedProduct.name}
                </h2>

                {/* Preços Varejo vs Atacado no Modal */}
                {(() => {
                  const modalIsFlash = isProductFlashPromo(selectedProduct);
                  const itemMinQty =
                    selectedProduct.wholesaleMinQty || catalog.wholesaleConfig?.minPieces || 3;
                  const itemIsWholesaleByQty =
                    wholesaleRuleType === 'per_item' && modalQty >= itemMinQty;
                  const modalRetailPrice = getProductPrice(selectedProduct, 'varejo');
                  const modalHasDiscount =
                    modalIsFlash ||
                    (selectedProduct.discountPrice &&
                      selectedProduct.discountPrice < selectedProduct.price);

                  return (
                    <div className="mt-3 p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-center justify-between gap-4">
                      <div>
                        {!isServicesCatalog && !selectedProduct.isService && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-stone-500 font-semibold uppercase block">
                              Varejo {pricingMode === 'varejo' && !itemIsWholesaleByQty && '• Ativo'}
                            </span>
                            {modalIsFlash && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-700 bg-amber-100/80 px-1.5 py-0.2 rounded-full">
                                <Zap className="w-2.5 h-2.5 fill-current text-amber-600" />
                                <span>-{catalog.globalScheduledDiscount?.discountPercent ?? 10}%</span>
                              </span>
                            )}
                          </div>
                        )}
                        <span
                          className={`text-lg font-bold ${pricingMode === 'varejo' && !itemIsWholesaleByQty
                              ? modalIsFlash
                                ? 'text-amber-700 font-extrabold'
                                : 'text-stone-950 font-extrabold'
                              : 'text-stone-500'
                            }`}
                        >
                          R$ {modalRetailPrice.toFixed(2)}
                        </span>
                        {modalHasDiscount && (
                          <span className="text-[10px] text-stone-400 line-through block">
                            R$ {selectedProduct.price.toFixed(2)}
                          </span>
                        )}
                      </div>

                      {!isServicesCatalog && !selectedProduct.isService && catalog.wholesaleConfig?.enabled !== false && (
                        <div className="border-l border-stone-200 pl-4 text-right">
                          <span className="text-[10px] text-amber-800 font-bold uppercase flex items-center justify-end gap-1">
                            <Package className="w-3 h-3 text-amber-600" />
                            <span>
                              Atacado {(pricingMode === 'atacado' || itemIsWholesaleByQty) && '• Ativo'}
                            </span>
                          </span>
                          <span
                            className={`text-lg font-bold ${pricingMode === 'atacado' || itemIsWholesaleByQty
                                ? 'text-amber-950 font-extrabold'
                                : 'text-stone-500'
                              }`}
                          >
                            R$ {getProductPrice(selectedProduct, 'atacado').toFixed(2)}
                          </span>
                          <span className="text-[10px] text-amber-700 block font-medium">
                            {wholesaleRuleType === 'per_item'
                              ? `Mín. ${itemMinQty} un desta peça`
                              : wholesaleRuleType === 'cart_value'
                                ? `Mín. R$ ${wholesaleMinValue} no pedido`
                                : `Mín. ${wholesaleMinPieces} peças no pedido`}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {selectedProduct.description && (
                <p className="text-xs text-stone-600 leading-relaxed font-light">
                  {selectedProduct.description}
                </p>
              )}

              {/* Tamanhos */}
              {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-stone-800 block">Tamanho:</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedProduct.sizes.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setModalSize(s)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${modalSize === s
                            ? 'border-stone-900 bg-stone-900 text-white'
                            : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                          }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Cores / Banhos */}
              {selectedProduct.colors && selectedProduct.colors.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-stone-800 block">Banho / Cor:</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedProduct.colors.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setModalColor(c)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${modalColor === c
                            ? 'border-stone-900 bg-stone-900 text-white'
                            : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                          }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Seletor de Quantidade com Gatilho de Atacado */}
              {!isProductSoldOut(selectedProduct) && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 border border-stone-200/80">
                  <div>
                    <span className="text-xs font-semibold text-stone-800 block">Quantidade:</span>
                    {wholesaleRuleType === 'per_item' ? (
                      <span className="text-[10px]">
                        {modalQty >=
                          (selectedProduct.wholesaleMinQty || wholesaleMinPieces || 3) ? (
                          <span className="font-bold text-emerald-700">
                            Preço de atacado ativado nesta peça!
                          </span>
                        ) : (
                          <span className="text-amber-800">
                            Mínimo de {(selectedProduct.wholesaleMinQty || wholesaleMinPieces || 3)} un para atacado
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-[10px] text-stone-500">Unidades a adicionar</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 bg-white rounded-xl border border-stone-300 p-1 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setModalQty(Math.max(1, modalQty - 1))}
                      className="w-7 h-7 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-700 font-bold active:scale-95 transition-all"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-stone-900">
                      {modalQty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setModalQty(modalQty + 1)}
                      className="w-7 h-7 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-700 font-bold active:scale-95 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Botão Adicionar ou Aviso de Esgotado */}
              {isProductSoldOut(selectedProduct) ? (
                <div className="space-y-3 pt-2">
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-900 text-xs font-sans flex items-start gap-2.5">
                    <span className="p-1 rounded-lg bg-amber-100 text-amber-700 shrink-0 mt-0.5">
                      <AlertCircle className="w-4 h-4" />
                    </span>
                    <div>
                      <p className="font-bold">Peça Esgotada no Momento</p>
                      <p className="text-[11px] text-amber-800 font-light mt-0.5 leading-relaxed">
                        Este produto esgotou no estoque da loja e não pode ser adicionado à sacola.
                      </p>
                    </div>
                  </div>

                  {/* Botão de WhatsApp para pedir reposição */}
                  <a
                    href={`https://wa.me/${(catalog.whatsapp || '5511999999999').replace(/\D/g, '')}?text=${encodeURIComponent(
                      `Olá! Vi a peça "${selectedProduct.name}" no catálogo mas vi que está esgotada. Vocês têm previsão de reposição ou modelo semelhante?`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Avise-me no WhatsApp quando voltar</span>
                  </a>

                  <button
                    type="button"
                    disabled
                    className="w-full py-3 rounded-2xl bg-stone-100 text-stone-400 font-bold text-xs tracking-wider uppercase cursor-not-allowed flex items-center justify-center gap-2 border border-stone-200"
                  >
                    <X className="w-4 h-4" />
                    <span>Indisponível para Compra</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    addToCart(selectedProduct, modalSize, modalColor, modalQty);
                    setSelectedProduct(null);
                    setIsCartOpen(true);
                  }}
                  className="w-full py-3.5 rounded-2xl text-white font-bold text-xs tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>
                    Adicionar à Sacola {modalQty > 1 ? `(${modalQty} un)` : ''}
                  </span>
                </button>
              )}

              {/* 5.1. Seção de Indicações / Cross-Sell ("Combine com" / Sugestões) */}
              {recommendedProducts.length > 0 && (
                <div className="pt-4 mt-2 border-t border-stone-200/80 space-y-3 font-sans">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800">
                        {selectedProduct.recommendations?.title ||
                          (selectedProduct.isService || catalog.businessType === 'services'
                            ? 'Combine este procedimento com'
                            : 'Combine com')}
                      </h3>
                    </div>
                    <span className="text-[10px] text-stone-400 font-medium">
                      {recommendedProducts.length} sugestõe{recommendedProducts.length === 1 ? 'm' : 's'}
                    </span>
                  </div>

                  {/* Grid de Peças / Serviços Indicados */}
                  <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                    {recommendedProducts.map((recProd) => {
                      const recPrice = getProductPrice(recProd, pricingMode);
                      const recSoldOut = isProductSoldOut(recProd);
                      const isRecService = Boolean(recProd.isService || catalog.businessType === 'services');

                      return (
                        <div
                          key={recProd.id}
                          onClick={() => openProductModal(recProd)}
                          className="group p-2 sm:p-2.5 rounded-2xl bg-stone-50 hover:bg-stone-100/80 border border-stone-200/70 hover:border-stone-400 transition-all cursor-pointer flex flex-col justify-between text-left"
                        >
                          <div>
                            <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-white mb-2 border border-stone-200/50">
                              <img
                                src={recProd.images?.[0] || ''}
                                alt={recProd.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              {recSoldOut && (
                                <span className="absolute top-1 left-1 bg-stone-900/90 text-white text-[8px] font-bold px-1.5 py-0.2 rounded-full">
                                  Esgotado
                                </span>
                              )}
                            </div>
                            <h4 className="text-[11px] font-medium text-stone-800 line-clamp-2 leading-snug">
                              {recProd.name}
                            </h4>
                            {isRecService && (recProd.durationFormatted || recProd.durationMinutes) && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded mt-1">
                                <Clock className="w-2.5 h-2.5" />
                                <span>{recProd.durationFormatted || `${recProd.durationMinutes} min`}</span>
                              </span>
                            )}
                          </div>

                          <div className="pt-2 flex items-center justify-between gap-1">
                            <div>
                              <span className="text-xs font-bold text-stone-900 block">
                                {isRecService && recProd.servicePriceType === 'quote'
                                  ? 'Sob Orçamento'
                                  : isRecService && recProd.servicePriceType === 'starting_at'
                                    ? `A partir de R$ ${recPrice.toFixed(2)}`
                                    : `R$ ${recPrice.toFixed(2)}`}
                              </span>
                              {!isRecService && pricingMode === 'atacado' && (
                                <span className="text-[8px] text-amber-700 font-semibold block">
                                  no atacado
                                </span>
                              )}
                            </div>

                            {!recSoldOut && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isRecService) {
                                    openProductModal(recProd);
                                  } else {
                                    addToCart(recProd, recProd.sizes?.[0], recProd.colors?.[0], 1);
                                  }
                                }}
                                className="w-7 h-7 rounded-xl bg-white hover:bg-stone-900 text-stone-700 hover:text-white border border-stone-200 shadow-2xs flex items-center justify-center transition-all shrink-0 active:scale-95"
                                title={isRecService ? 'Agendar este procedimento' : 'Adicionar direto à sacola'}
                              >
                                {isRecService ? (
                                  <Calendar className="w-3.5 h-3.5 text-indigo-600 group-hover:text-white" />
                                ) : (
                                  <Plus className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. Sacola de Compras Flutuante (Drawer Lateral Minimalista) */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
          <div className="w-full sm:max-w-md bg-white h-full flex flex-col justify-between shadow-2xl text-stone-900 font-sans">
            {/* Header */}
            <div className="p-4 border-b border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-stone-900" />
                <h3 className="font-serif font-bold text-base text-stone-900">
                  Meu carrinho ({totalItemCount} {totalItemCount === 1 ? 'item' : 'itens'})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-full text-stone-400 hover:text-stone-900 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Alternador de Varejo / Atacado dentro da Sacola se ativado */}
            {!isServicesCatalog && catalog.wholesaleConfig?.enabled && (
              <div className="px-4 py-2.5 bg-stone-50 border-b border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-medium text-stone-500">Tabela de Preços:</span>
                </div>
                <div className="inline-flex p-0.5 bg-stone-200/70 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setPricingMode('varejo')}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${pricingMode === 'varejo'
                        ? 'bg-white text-stone-900 shadow-2xs'
                        : 'text-stone-500 hover:text-stone-800'
                      }`}
                  >
                    Varejo
                  </button>
                  <button
                    type="button"
                    onClick={() => setPricingMode('atacado')}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${pricingMode === 'atacado'
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'text-stone-500 hover:text-stone-800'
                      }`}
                  >
                    Atacado
                  </button>
                </div>
              </div>
            )}

            {/* Progresso do Pedido Mínimo de Atacado */}
            {!isServicesCatalog && isWholesaleActive && (
              <div className="p-3 bg-amber-50 border-b border-amber-100 text-[11px] text-amber-900 space-y-1.5">
                {wholesaleRuleType === 'cart_value' ? (
                  <>
                    <div className="flex items-center justify-between font-semibold">
                      <span className="flex items-center gap-1">
                        <Package className="w-3.5 h-3.5 text-amber-700" />
                        {hasMetWholesaleMin ? 'Valor Mínimo Atingido!' : 'Mínimo de Atacado (R$):'}
                      </span>
                      <span>
                        R$ {rawSubtotal.toFixed(2)} de R$ {wholesaleMinValue.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-amber-200/60 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-600 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, Math.round((rawSubtotal / wholesaleMinValue) * 100))}%`,
                        }}
                      />
                    </div>
                    {!hasMetWholesaleMin && (
                      <p className="text-[10px] text-amber-700">
                        Faltam <strong>R$ {wholesaleRemainingValue.toFixed(2)}</strong> no seu pedido para liberar o fechamento no atacado.
                      </p>
                    )}
                  </>
                ) : wholesaleRuleType === 'per_item' ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between font-semibold">
                      <span className="flex items-center gap-1">
                        <Package className="w-3.5 h-3.5 text-amber-700" />
                        Atacado por Item / Peça Específica
                      </span>
                    </div>
                    <p className="text-[10px] text-amber-800">
                      O preço de atacado é aplicado nas peças que atingirem o mínimo individual de cada modelo.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between font-semibold">
                      <span className="flex items-center gap-1">
                        <Package className="w-3.5 h-3.5 text-amber-700" />
                        {hasMetWholesaleMin ? 'Pedido Mínimo Atingido!' : 'Mínimo de Atacado:'}
                      </span>
                      <span>
                        {totalItemCount} de {wholesaleMinPieces} peças
                      </span>
                    </div>
                    <div className="w-full h-2 bg-amber-200/60 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-600 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, Math.round((totalItemCount / wholesaleMinPieces) * 100))}%`,
                        }}
                      />
                    </div>
                    {!hasMetWholesaleMin && (
                      <p className="text-[10px] text-amber-700">
                        Faltam <strong>{wholesaleRemainingPieces} peça(s)</strong> no seu carrinho para liberar a compra com desconto de atacado.
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Aviso de Desconto Progressivo (somente no Varejo) */}
            {pricingMode === 'varejo' && nextDiscountTier && (
              <div className="p-3 bg-stone-50 border-b border-stone-100 text-[11px] text-stone-700 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>
                  Adicione mais{' '}
                  <strong>{nextDiscountTier.minItems - totalItemCount} peça(s)</strong> para
                  desbloquear{' '}
                  <strong>{nextDiscountTier.discountPercent}% de desconto</strong>!
                </span>
              </div>
            )}

            {/* Itens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-stone-100">
              {cart.length === 0 ? (
                <div className="py-16 text-center text-stone-400 text-xs">
                  Sua sacola está vazia no momento.
                </div>
              ) : (
                cart.map((item, idx) => {
                  const unitPrice = getItemUnitPrice(item);
                  const itemMinQty = item.product.wholesaleMinQty || wholesaleMinPieces || 3;
                  const isItemWholesale =
                    isWholesaleActive || (wholesaleRuleType === 'per_item' && item.quantity >= itemMinQty);

                  return (
                    <div key={idx} className="pt-3 first:pt-0 flex gap-3 items-center">
                      <img
                        src={item.product.images?.[0]}
                        alt={item.product.name}
                        className="w-14 h-14 rounded-xl object-cover bg-stone-100 shrink-0 border border-stone-100"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <h4 className="font-semibold text-xs text-stone-900 truncate">
                            {item.product.name}
                          </h4>
                          {isItemWholesale ? (
                            <span className="text-[8px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1 py-0.2 rounded shrink-0">
                              Atacado {wholesaleRuleType === 'per_item' ? `(${item.quantity}/${itemMinQty})` : ''}
                            </span>
                          ) : wholesaleRuleType === 'per_item' ? (
                            <span className="text-[8px] font-medium text-stone-500 bg-stone-100 px-1 py-0.2 rounded shrink-0">
                              Mín. {itemMinQty} un
                            </span>
                          ) : null}
                        </div>
                        <div className="text-[10px] text-stone-400">
                          {item.selectedSize && <span>Tam: {item.selectedSize} </span>}
                          {item.selectedColor && <span>• {item.selectedColor}</span>}
                        </div>
                        <div className="font-bold text-xs text-stone-900 mt-0.5">
                          R$ {(unitPrice * item.quantity).toFixed(2)}{' '}
                          <span className="text-[10px] text-stone-400 font-normal">
                            (R$ {unitPrice.toFixed(2)} un)
                          </span>
                        </div>
                      </div>

                      {/* Quantidade */}
                      <div className="flex items-center gap-1.5 bg-stone-100 rounded-lg p-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => updateQuantity(idx, -1)}
                          className="w-5 h-5 rounded bg-white text-stone-700 flex items-center justify-center shadow-2xs"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className="w-4 text-center font-bold text-xs">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(idx, 1)}
                          className="w-5 h-5 rounded bg-white text-stone-700 flex items-center justify-center shadow-2xs"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(idx)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Rodapé da Sacola com Valores & Envio WhatsApp */}
            {cart.length > 0 && (
              <div className="p-4 border-t border-stone-100 bg-stone-50/80 space-y-3 text-xs">
                {/* Opções de Entrega */}
                <div className="space-y-1.5">
                  <span className="font-semibold text-stone-700 block text-[11px]">
                    Forma de Entrega:
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {shipping.motoboyEnabled && (
                      <button
                        type="button"
                        onClick={() => setSelectedShipping('motoboy')}
                        className={`p-2 rounded-xl border text-center transition-all flex flex-col justify-between items-center ${selectedShipping === 'motoboy'
                            ? 'border-stone-900 bg-white font-bold text-stone-900 shadow-2xs ring-1 ring-stone-900'
                            : 'border-stone-200 bg-white/60 text-stone-600 hover:border-stone-300'
                          }`}
                      >
                        <div className="flex items-center gap-1 text-[10.5px]">
                          <Truck className="w-3.5 h-3.5 text-stone-700" />
                          <span>Motoboy</span>
                        </div>
                        <div className="font-bold text-xs mt-0.5">
                          {isFreeShipping ? 'Grátis' : `R$ ${shipping.motoboyPrice?.toFixed(2)}`}
                        </div>
                        {motoboyCutoff.enabled ? (
                          <span
                            className={`text-[9px] mt-1 px-1.5 py-0.5 rounded font-bold leading-tight ${motoboyCutoff.isSameDay
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
                        className={`p-2 rounded-xl border text-center transition-all flex flex-col justify-between items-center ${selectedShipping === 'uber_flash'
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
                        className={`p-2 rounded-xl border text-center transition-all flex flex-col justify-between items-center ${selectedShipping === 'sedex'
                            ? 'border-stone-900 bg-white font-bold text-stone-900 shadow-2xs ring-1 ring-stone-900'
                            : 'border-stone-200 bg-white/60 text-stone-600 hover:border-stone-300'
                          }`}
                      >
                        <div className="flex items-center gap-1 text-[10.5px]">
                          <Package className="w-3.5 h-3.5 text-stone-700" />
                          <span>Correios</span>
                        </div>
                        <div className="font-bold text-xs mt-0.5">
                          {isFreeShipping ? 'Grátis' : `R$ ${shipping.sedexPrice?.toFixed(2)}`}
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
                        className={`p-2 rounded-xl border text-center transition-all flex flex-col justify-between items-center ${selectedShipping === 'pickup'
                            ? 'border-stone-900 bg-white font-bold text-stone-900 shadow-2xs ring-1 ring-stone-900'
                            : 'border-stone-200 bg-white/60 text-stone-600 hover:border-stone-300'
                          }`}
                      >
                        <div className="flex items-center gap-1 text-[10.5px]">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Retirada</span>
                        </div>
                        <div className="font-bold text-xs mt-0.5 text-emerald-700">Grátis</div>
                        <span className="text-[9px] text-stone-400 mt-0.5">Showroom</span>
                      </button>
                    )}
                  </div>

                  {/* Alerta explicativo dinâmico do Uber Flash / 99 */}
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

                  {/* Alerta explicativo dinâmico de Corte do Motoboy */}
                  {selectedShipping === 'motoboy' && motoboyCutoff.enabled && (
                    <div
                      className={`p-2.5 rounded-xl border space-y-0.5 animate-in fade-in ${motoboyCutoff.isSameDay
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

                {/* Subtotais */}
                <div className="space-y-1 pt-2 border-t border-stone-200">
                  <div className="flex justify-between text-stone-500">
                    <span>Subtotal:</span>
                    <span>R$ {rawSubtotal.toFixed(2)}</span>
                  </div>

                  {activeDiscountPercent > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Desconto ({activeDiscountPercent}%):</span>
                      <span>-R$ {progressiveDiscountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-stone-500">
                    <span>Frete:</span>
                    <span>{shippingCost === 0 ? 'Grátis' : `R$ ${shippingCost.toFixed(2)}`}</span>
                  </div>

                  <div className="flex justify-between text-sm font-bold text-stone-900 pt-1 border-t border-stone-200">
                    <span>Total Final:</span>
                    <span>R$ {finalTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Alerta de Mínimo não atingido no Atacado */}
                {pricingMode === 'atacado' && !hasMetWholesaleMin && (
                  <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-[11px] text-center font-medium flex items-center justify-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Faltam <strong>{wholesaleRemainingPieces} peça(s)</strong> para atingir o pedido mínimo de atacado ({wholesaleMinPieces} un).</span>
                  </div>
                )}

                {/* Opções de Checkout PIX & WhatsApp */}
                {catalog.paymentConfig?.pixEnabled && catalog.paymentConfig?.pixKey?.trim() && (catalog.paymentConfig.showPixScreenWithProof ?? true) ? (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setIsPixModalOpen(true)}
                      className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99]"
                    >
                      <Wallet className="w-4 h-4 text-emerald-400" />
                      <span>Pagar com PIX &amp; Enviar Comprovante</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleCheckoutWhatsApp}
                    className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-md transition-all"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Finalizar compra pelo WhatsApp</span>
                  </button>
                )}

                {/* Box de Confiança WhatsApp (como na Referência 2 Tela 3) */}
                <div className="pt-2 border-t border-stone-200/60 text-center space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-stone-800">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Compra 100% segura</span>
                  </div>
                  <p className="text-[10px] text-stone-400">
                    {catalog.paymentConfig?.pixEnabled && catalog.paymentConfig?.pixKey?.trim()
                      ? 'Pague com PIX e envie o comprovante no WhatsApp da loja.'
                      : 'Você será direcionado para o WhatsApp para concluir seu pedido.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Pagamento com PIX e Envio de Comprovante no WhatsApp */}
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
        onFallbackDirectWhatsApp={catalog.paymentConfig?.pixEnabled && catalog.paymentConfig?.pixKey?.trim() ? undefined : handleCheckoutWhatsApp}
      />

      {/* 7. Botão Flutuante de Sacola no Mobile (quando há itens) */}
      {cart.length > 0 && (
        <div className="fixed bottom-5 left-4 right-4 max-w-sm mx-auto z-30">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="w-full p-3.5 rounded-full bg-stone-900 text-white shadow-2xl flex items-center justify-between px-5 font-sans transition-all hover:scale-[1.02]"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-white text-stone-900 font-bold text-xs flex items-center justify-center">
                {totalItemCount}
              </span>
              <span className="text-xs font-semibold">Meu Carrinho</span>
            </div>
            <span className="font-bold text-xs">R$ {finalTotal.toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* Barra de Reafirmação e Confiança (apenas produtos físicos) */}
      {!isServicesCatalog && (
        <section className="border-t border-stone-200/80 bg-stone-50/60 py-8 px-4 mt-8">
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-3">
              <div className="w-10 h-10 rounded-full bg-white border border-stone-200 shadow-2xs flex items-center justify-center text-stone-800 shrink-0">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-900 font-sans">Compra 100% Segura</h4>
                <p className="text-[11px] text-stone-500 font-sans">Privacidade e atendimento direto</p>
              </div>
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-3">
              <div className="w-10 h-10 rounded-full bg-white border border-stone-200 shadow-2xs flex items-center justify-center text-stone-800 shrink-0">
                <Truck className="w-5 h-5 text-stone-700" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-900 font-sans">Entrega Rápida</h4>
                <p className="text-[11px] text-stone-500 font-sans">Envios para todo o Brasil</p>
              </div>
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-3">
              <div className="w-10 h-10 rounded-full bg-white border border-stone-200 shadow-2xs flex items-center justify-center text-stone-800 shrink-0">
                <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-900 font-sans">Satisfação Garantida</h4>
                <p className="text-[11px] text-stone-500 font-sans">Produtos selecionados com carinho</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Rodapé Minimalista */}
      <footer className="w-full border-t border-stone-100 py-10 text-center font-sans text-[11px] text-stone-400 space-y-1">
        <p>© {new Date().getFullYear()} {catalog.storeName} • Todos os direitos reservados</p>
        <p className="text-[10px] text-stone-300">Criado com Vitryne</p>
      </footer>
    </div>
  );
}
