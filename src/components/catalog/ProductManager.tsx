'use client';

import React, { useState, useMemo } from 'react';
import { ProductItem, WholesaleConfig, SchedulingConfig } from '@/lib/catalog/types';
import { calculateAvailableTimeSlots } from '@/lib/catalog/service-helpers';
import {
  Plus,
  Edit2,
  Trash2,
  Copy,
  Image as ImageIcon,
  Tag,
  Clock,
  Check,
  AlertCircle,
  X,
  Layers,
  Sparkles,
  ShoppingBag,
  FolderPlus,
  Folder,
  FolderOpen,
  Edit3,
  Bookmark,
  Ruler,
  Palette,
  Eye,
  EyeOff,
  Package,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Infinity as InfinityIcon,
  PackagePlus,
  Camera,
  Calendar,
  Users,
  CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  resolveTopicIcon,
  suggestIconForTopic,
  AVAILABLE_TOPIC_ICONS,
} from '@/lib/catalog/topicIcons';

interface ProductManagerProps {
  businessType?: 'products' | 'services' | 'hybrid';
  schedulingConfig?: SchedulingConfig;
  products: ProductItem[];
  topics?: string[];
  topicIcons?: Record<string, string>;
  outOfStockBehavior?: 'badge-sold-out' | 'hide' | 'infinite';
  wholesaleConfig?: WholesaleConfig;
  pinBadgedProductsToTop?: boolean;
  onChangeProducts: (products: ProductItem[]) => void;
  onChangeTopics?: (topics: string[]) => void;
  onChangeTopicIcons?: (topicIcons: Record<string, string>) => void;
  onChangeOutOfStockBehavior?: (behavior: 'badge-sold-out' | 'hide' | 'infinite') => void;
  onChangeWholesaleConfig?: (config: WholesaleConfig) => void;
  onChangePinBadgedProductsToTop?: (pin: boolean) => void;
}

const TOPIC_SUGGESTIONS = [
  'Relógios',
  'Pulseiras & Braceletes',
  'Smartwatches',
  'Telefones & Celulares',
  'Fones de Ouvido',
  'Shorts & Bermudas',
  'Camisetas & T-Shirts',
  'Regatas & Tops',
  'Casacos & Jaquetas',
  'Vestidos & Longos',
  'Chinelos & Sandálias',
  'Sutiãs & Tops Íntimos',
  'Calcinhas & Lingerie',
  'Cuecas & Boxers',
  'Biquínis & Praia',
  'Bonés & Chapéus',
  'Gorros & Toucas',
  'Calças & Jeans',
  'Saias & Midis',
  'Calçados & Tênis',
  'Roupa Masculina',
  'Roupa Feminina',
  'Semi Joias & Folheados',
  'Bolsas & Couro',
  'Moda Fitness & Treino',
  'Moda Infantil',
];

const SIZE_CATEGORIES = [
  {
    id: 'roupa-feminina-adulto',
    label: 'Roupa Feminina Adulto',
    sizes: [
      'PP', 'P', 'M', 'G', 'GG', 'XG', 'XXG',
      'G1', 'G2', 'G3', 'G4',
      '34', '36', '38', '40', '42', '44', '46', '48', '50', '52', '54',
      'Único',
    ],
    quickPacks: [
      { name: 'P, M, G', items: ['P', 'M', 'G'] },
      { name: 'PP ao GG', items: ['PP', 'P', 'M', 'G', 'GG'] },
      { name: '36 ao 42', items: ['36', '38', '40', '42'] },
      { name: '38 ao 46', items: ['38', '40', '42', '44', '46'] },
      { name: 'Plus Size (G1 ao G4)', items: ['G1', 'G2', 'G3', 'G4'] },
      { name: 'Plus Size (46 ao 54)', items: ['46', '48', '50', '52', '54'] },
    ],
  },
  {
    id: 'roupa-masculina-adulto',
    label: 'Roupa Masculina Adulto',
    sizes: [
      'PP', 'P', 'M', 'G', 'GG', 'XG', 'XXG', 'XXXG',
      'G1', 'G2', 'G3',
      '36', '38', '40', '42', '44', '46', '48', '50', '52', '54',
      'Único',
    ],
    quickPacks: [
      { name: 'P, M, G', items: ['P', 'M', 'G'] },
      { name: 'P ao GG', items: ['P', 'M', 'G', 'GG'] },
      { name: '38 ao 46', items: ['38', '40', '42', '44', '46'] },
      { name: 'Plus Size (G1 ao G3)', items: ['G1', 'G2', 'G3'] },
      { name: 'Plus Size (48 ao 54)', items: ['48', '50', '52', '54'] },
    ],
  },
  {
    id: 'calcados-adulto',
    label: 'Calçados Adulto',
    sizes: [
      '33', '34', '35', '36', '37', '38', '39', '40',
      '41', '42', '43', '44', '45', '46', '47', '48',
    ],
    quickPacks: [
      { name: 'Feminino (34 ao 39)', items: ['34', '35', '36', '37', '38', '39'] },
      { name: 'Masculino (39 ao 44)', items: ['39', '40', '41', '42', '43', '44'] },
      { name: 'Grade Completa (35 ao 42)', items: ['35', '36', '37', '38', '39', '40', '41', '42'] },
    ],
  },
  {
    id: 'roupa-infantil-feminina',
    label: 'Roupa Infantil Feminina',
    sizes: [
      'RN', 'P Bebê', 'M Bebê', 'G Bebê',
      '1 ano', '2 anos', '3 anos', '4 anos', '6 anos', '8 anos',
      '10 anos', '12 anos', '14 anos', '16 anos', '18 anos',
    ],
    quickPacks: [
      { name: 'Bebê (RN ao G)', items: ['RN', 'P Bebê', 'M Bebê', 'G Bebê'] },
      { name: 'Primeiros Passos (1 ao 3 anos)', items: ['1 ano', '2 anos', '3 anos'] },
      { name: 'Kids (4 ao 8 anos)', items: ['4 anos', '6 anos', '8 anos'] },
      { name: 'Juvenil (10 ao 16 anos)', items: ['10 anos', '12 anos', '14 anos', '16 anos'] },
    ],
  },
  {
    id: 'roupa-infantil-masculina',
    label: 'Roupa Infantil Masculina',
    sizes: [
      'RN', 'P Bebê', 'M Bebê', 'G Bebê',
      '1 ano', '2 anos', '3 anos', '4 anos', '6 anos', '8 anos',
      '10 anos', '12 anos', '14 anos', '16 anos', '18 anos',
    ],
    quickPacks: [
      { name: 'Bebê (RN ao G)', items: ['RN', 'P Bebê', 'M Bebê', 'G Bebê'] },
      { name: 'Primeiros Passos (1 ao 3 anos)', items: ['1 ano', '2 anos', '3 anos'] },
      { name: 'Kids (4 ao 8 anos)', items: ['4 anos', '6 anos', '8 anos'] },
      { name: 'Juvenil (10 ao 16 anos)', items: ['10 anos', '12 anos', '14 anos', '16 anos'] },
    ],
  },
  {
    id: 'calcados-infantil',
    label: 'Calçados Infantil',
    sizes: [
      '16', '17', '18', '19', '20', '21', '22', '23', '24',
      '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36',
    ],
    quickPacks: [
      { name: 'Bebê (16 ao 20)', items: ['16', '17', '18', '19', '20'] },
      { name: 'Kids (21 ao 28)', items: ['21', '22', '23', '24', '25', '26', '27', '28'] },
      { name: 'Juvenil (29 ao 36)', items: ['29', '30', '31', '32', '33', '34', '35', '36'] },
    ],
  },
  {
    id: 'acessorios',
    label: 'Acessórios & Joias',
    sizes: [
      'Aro 12', 'Aro 14', 'Aro 16', 'Aro 18', 'Aro 20', 'Aro 22', 'Aro 24',
      '35cm', '40cm', '45cm', '50cm', '60cm', '70cm', 'Ajustável', 'Único',
    ],
    quickPacks: [
      { name: 'Anéis (Aro 14 ao 20)', items: ['Aro 14', 'Aro 16', 'Aro 18', 'Aro 20'] },
      { name: 'Colares (40cm a 50cm)', items: ['40cm', '45cm', '50cm'] },
      { name: 'Ajustável / Único', items: ['Ajustável', 'Único'] },
    ],
  },
  {
    id: 'smart-tech-relogios',
    label: 'Smartwatches, Relógios & Telefones',
    sizes: [
      '38mm', '40mm', '41mm', '42mm', '44mm', '45mm', '49mm Ultra',
      '16cm', '17cm', '18cm', '19cm', '20cm', '21cm',
      '64GB', '128GB', '256GB', '512GB', '1TB',
      'Ajustável', 'Único',
    ],
    quickPacks: [
      { name: 'Smartwatches (40mm ao 49mm)', items: ['40mm', '44mm', '45mm', '49mm Ultra'] },
      { name: 'Pulseiras (17cm ao 21cm)', items: ['17cm', '19cm', '21cm', 'Ajustável'] },
      { name: 'Armazenamento (128GB a 512GB)', items: ['128GB', '256GB', '512GB'] },
    ],
  },
];

const COLOR_PRESETS = [
  { name: 'Preto', hex: '#18181B' },
  { name: 'Branco', hex: '#FFFFFF', border: true },
  { name: 'Off-White', hex: '#FAF9F6', border: true },
  { name: 'Cinza Mescla', hex: '#9CA3AF' },
  { name: 'Chumbo', hex: '#374151' },
  { name: 'Bege / Nude', hex: '#E5D0BA' },
  { name: 'Areia', hex: '#D2C2AA' },
  { name: 'Caramelo', hex: '#C68642' },
  { name: 'Terracota', hex: '#C85A32' },
  { name: 'Marrom', hex: '#5C3A21' },
  { name: 'Vermelho', hex: '#DC2626' },
  { name: 'Bordô / Vinho', hex: '#881337' },
  { name: 'Rosa Bebê', hex: '#FBCFE8' },
  { name: 'Pink / Fúcsia', hex: '#DB2777' },
  { name: 'Lilás', hex: '#C084FC' },
  { name: 'Roxo', hex: '#7E22CE' },
  { name: 'Azul Marinho', hex: '#1E3A8A' },
  { name: 'Azul Royal', hex: '#2563EB' },
  { name: 'Azul Claro', hex: '#93C5FD' },
  { name: 'Verde Militar', hex: '#4D5D3B' },
  { name: 'Verde Oliva', hex: '#65A30D' },
  { name: 'Verde Esmeralda', hex: '#059669' },
  { name: 'Verde Menta', hex: '#6EE7B7' },
  { name: 'Amarelo', hex: '#FACC15' },
  { name: 'Dourado', hex: '#D4AF37' },
  { name: 'Prata', hex: '#CBD5E1' },
  { name: 'Estampado', hex: 'linear-gradient(45deg, #f43f5e, #fbbf24, #3b82f6)' },
];

export default function ProductManager({
  businessType = 'products',
  schedulingConfig,
  products,
  topics,
  topicIcons = {},
  outOfStockBehavior = 'badge-sold-out',
  wholesaleConfig = {
    enabled: true,
    minPieces: 6,
    defaultDiscountPercent: 35,
    requireMinPieces: true,
  },
  pinBadgedProductsToTop = true,
  onChangeProducts,
  onChangeTopics,
  onChangeTopicIcons,
  onChangeOutOfStockBehavior,
  onChangeWholesaleConfig,
  onChangePinBadgedProductsToTop,
}: ProductManagerProps) {
  const isServicesCatalog = businessType === 'services';
  // Lista unificada de tópicos
  const effectiveTopics = useMemo(() => {
    const list: string[] = [];
    const seen = new Set<string>();

    (topics || []).forEach((t) => {
      const clean = t.trim();
      if (clean && !seen.has(clean.toLowerCase())) {
        seen.add(clean.toLowerCase());
        list.push(clean);
      }
    });

    products.forEach((p) => {
      const clean = (p.category || '').trim();
      if (clean && !seen.has(clean.toLowerCase())) {
        seen.add(clean.toLowerCase());
        list.push(clean);
      }
    });

    if (list.length === 0) {
      list.push('Novidades', 'Roupa Masculina');
    }

    return list;
  }, [topics, products]);

  // Tópico atualmente selecionado para visualização/cadastro
  const [selectedTopic, setSelectedTopic] = useState<string>('ALL');

  // Modais de controle
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Modal de Criação / Edição de Tópico
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [topicModalMode, setTopicModalMode] = useState<'create' | 'edit'>('create');
  const [topicInputName, setTopicInputName] = useState('');
  const [editingTopicOldName, setEditingTopicOldName] = useState<string | null>(null);
  const [selectedTopicIcon, setSelectedTopicIcon] = useState<string>('shirt');

  // Form State do Produto
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [isCustomTopicInput, setIsCustomTopicInput] = useState(false);
  const [price, setPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [wholesalePrice, setWholesalePrice] = useState('');
  const [wholesaleMinQty, setWholesaleMinQty] = useState('');
  const [images, setImages] = useState<string[]>(['']);
  const [stock, setStock] = useState('5');
  const [isUniquePiece, setIsUniquePiece] = useState(false);
  const [isInfiniteStock, setIsInfiniteStock] = useState(false);
  const [outOfStockAction, setOutOfStockAction] = useState<'default' | 'badge-sold-out' | 'hide' | 'infinite'>('default');
  const [badge, setBadge] = useState('');
  const [sizesInput, setSizesInput] = useState('P, M, G');
  const [colorsInput, setColorsInput] = useState('Preto, Off-White');
  const [activeSizeCategory, setActiveSizeCategory] = useState<string>('roupa-feminina-adulto');
  const [hasScheduledDiscount, setHasScheduledDiscount] = useState(false);
  const [scheduledTitle, setScheduledTitle] = useState('Oferta Relâmpago');
  const [scheduledEndsAt, setScheduledEndsAt] = useState('');
  const [hasRecommendations, setHasRecommendations] = useState(false);
  const [recommendationTitle, setRecommendationTitle] = useState('Combine com');
  const [recommendationMode, setRecommendationMode] = useState<'fixed' | 'random_selected' | 'topic'>('fixed');
  const [recommendationTopic, setRecommendationTopic] = useState('CURRENT');
  const [recommendationProductIds, setRecommendationProductIds] = useState<string[]>([]);
  const [recommendationSearch, setRecommendationSearch] = useState('');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Condições de Pagamento e Parcelamento (Opcional - só aparece se configurado)
  const [paymentBadge, setPaymentBadge] = useState('');
  const [maxInstallments, setMaxInstallments] = useState('');
  const [installmentWithoutInterest, setInstallmentWithoutInterest] = useState(true);

  // Form State exclusivo para Serviços & Agendamentos
  const [isServiceItem, setIsServiceItem] = useState(isServicesCatalog);
  const [durationMinutes, setDurationMinutes] = useState('45');
  const [durationFormatted, setDurationFormatted] = useState('45 min');
  const [servicePriceType, setServicePriceType] = useState<'fixed' | 'starting_at' | 'hourly' | 'daily' | 'quote'>('fixed');
  const [bookingMode, setBookingMode] = useState<'appointment' | 'queue'>('appointment');
  const [allowMultiple, setAllowMultiple] = useState(true);
  const [scheduleType, setScheduleType] = useState<'store_hours' | 'custom_start'>('store_hours');
  const [customStartTime, setCustomStartTime] = useState('14:00');
  const [customEndTime, setCustomEndTime] = useState('');
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);

  // Horários calculados automaticamente com base no range da loja e duração deste procedimento
  const previewServiceSlots = useMemo(() => {
    const mins = parseInt(durationMinutes) || 15;
    const start = scheduleType === 'custom_start' ? customStartTime : undefined;
    const end = scheduleType === 'custom_start' && customEndTime ? customEndTime : undefined;
    return calculateAvailableTimeSlots(schedulingConfig, mins, start, end);
  }, [schedulingConfig, durationMinutes, scheduleType, customStartTime, customEndTime]);

  // Helpers de Seleção por Clique para Tamanhos
  const currentSelectedSizes = useMemo(() => {
    return sizesInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }, [sizesInput]);

  const toggleSize = (size: string) => {
    const exists = currentSelectedSizes.some(
      (s) => s.toLowerCase() === size.toLowerCase()
    );
    let next: string[];
    if (exists) {
      next = currentSelectedSizes.filter(
        (s) => s.toLowerCase() !== size.toLowerCase()
      );
    } else {
      next = [...currentSelectedSizes, size];
    }
    setSizesInput(next.join(', '));
  };

  const applySizePack = (items: string[]) => {
    const existing = new Set(currentSelectedSizes.map((s) => s.toLowerCase()));
    const next = [...currentSelectedSizes];
    items.forEach((item) => {
      if (!existing.has(item.toLowerCase())) {
        next.push(item);
        existing.add(item.toLowerCase());
      }
    });
    setSizesInput(next.join(', '));
  };

  const clearSizes = () => {
    setSizesInput('');
  };

  // Helpers de Seleção por Clique para Cores
  const currentSelectedColors = useMemo(() => {
    return colorsInput
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);
  }, [colorsInput]);

  const toggleColor = (colorName: string) => {
    const exists = currentSelectedColors.some(
      (c) => c.toLowerCase() === colorName.toLowerCase()
    );
    let next: string[];
    if (exists) {
      next = currentSelectedColors.filter(
        (c) => c.toLowerCase() !== colorName.toLowerCase()
      );
    } else {
      next = [...currentSelectedColors, colorName];
    }
    setColorsInput(next.join(', '));
  };

  const clearColors = () => {
    setColorsInput('');
  };

  // Contagem de produtos por tópico
  const topicCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    effectiveTopics.forEach((t) => {
      counts[t.toLowerCase()] = 0;
    });
    products.forEach((p) => {
      const cat = (p.category || 'Geral').toLowerCase();
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [effectiveTopics, products]);

  // Produtos filtrados pelo tópico ativo e ordenação com prioridade de Badges no topo
  const filteredProducts = useMemo(() => {
    const list =
      selectedTopic === 'ALL'
        ? [...products]
        : products.filter(
            (p) => (p.category || 'Geral').toLowerCase() === selectedTopic.toLowerCase()
          );

    if (pinBadgedProductsToTop !== false) {
      return [...list].sort((a, b) => {
        const aInfinite = a.isInfiniteStock || outOfStockBehavior === 'infinite' || a.outOfStockAction === 'infinite';
        const bInfinite = b.isInfiniteStock || outOfStockBehavior === 'infinite' || b.outOfStockAction === 'infinite';

        const aSoldOut = aInfinite
          ? false
          : a.isUniquePiece
          ? a.stock !== undefined && a.stock <= 0
          : (a.stock || 0) <= 0;
        const bSoldOut = bInfinite
          ? false
          : b.isUniquePiece
          ? b.stock !== undefined && b.stock <= 0
          : (b.stock || 0) <= 0;

        // 1. Produtos disponíveis vêm antes dos esgotados
        if (aSoldOut !== bSoldOut) {
          return aSoldOut ? 1 : -1;
        }

        // 2. Peças com Badge (Destaque, Novidade, Mais Vendido, etc.) vão DIRETO PRO TOPO,
        // mesmo sendo mais caras ou cadastradas antes!
        const aHasBadge = Boolean(a.badge && a.badge.trim().length > 0);
        const bHasBadge = Boolean(b.badge && b.badge.trim().length > 0);

        if (aHasBadge !== bHasBadge) {
          return aHasBadge ? -1 : 1;
        }

        return 0;
      });
    }

    return list;
  }, [products, selectedTopic, pinBadgedProductsToTop]);

  // Produtos disponíveis para indicação na edição (excluindo a própria peça se estiver editando)
  const availableProductsToRecommend = useMemo(() => {
    return products.filter((_, idx) => editingIndex === null || idx !== editingIndex);
  }, [products, editingIndex]);

  const filteredRecommendationProducts = useMemo(() => {
    if (!recommendationSearch.trim()) return availableProductsToRecommend;
    const term = recommendationSearch.toLowerCase();
    return availableProductsToRecommend.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        (p.category || '').toLowerCase().includes(term)
    );
  }, [availableProductsToRecommend, recommendationSearch]);

  // Abertura do modal de criação de produto com categoria pré-definida
  const openCreateModal = (prefilledTopic?: string) => {
    setEditingIndex(null);
    setName('');
    setDescription('');

    // Preenche automaticamente o módulo ativo se houver
    const targetTopic =
      prefilledTopic ||
      (selectedTopic !== 'ALL' ? selectedTopic : effectiveTopics[0] || 'Novidades');

    setCategory(targetTopic);
    setIsCustomTopicInput(false);
    setPrice('');
    setDiscountPrice('');
    setWholesalePrice('');
    setWholesaleMinQty('');
    setImages([
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80',
    ]);
    setStock('5');
    setIsUniquePiece(false);
    setIsInfiniteStock(false);
    setOutOfStockAction('default');
    setBadge('');
    setSizesInput('P, M, G');
    setColorsInput('');
    // Inicialização exclusiva de Serviço
    const isService = isServicesCatalog;
    setIsServiceItem(isService);
    setDurationMinutes('');
    setDurationFormatted('');
    setServicePriceType('fixed');
    setBookingMode('appointment');
    setAllowMultiple(true);
    setScheduleType('store_hours');
    setCustomStartTime('14:00');
    setCustomEndTime('');
    setAvailableTimeSlots([]);
    setHasScheduledDiscount(false);
    setScheduledTitle('Oferta Relâmpago');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    setScheduledEndsAt(tomorrow.toISOString().slice(0, 16));
    setHasRecommendations(false);
    setRecommendationTitle(isService ? 'Combine este procedimento com' : 'Combine com');
    setRecommendationMode('fixed');
    setRecommendationTopic('CURRENT');
    setRecommendationProductIds([]);
    setRecommendationSearch('');
    setPaymentBadge('');
    setMaxInstallments('');
    setInstallmentWithoutInterest(true);
    setIsAdvancedOpen(false);
    setIsModalOpen(true);
  };

  const openEditModal = (originalIndex: number) => {
    const p = products[originalIndex];
    setEditingIndex(originalIndex);
    setName(p.name);
    setDescription(p.description || '');
    setCategory(p.category || 'Geral');
    setIsCustomTopicInput(!effectiveTopics.some((t) => t.toLowerCase() === (p.category || '').toLowerCase()));
    setPrice(p.price ? String(p.price) : '');
    setDiscountPrice(p.discountPrice ? String(p.discountPrice) : '');
    setWholesalePrice(p.wholesalePrice !== undefined ? String(p.wholesalePrice) : '');
    setWholesaleMinQty(p.wholesaleMinQty !== undefined ? String(p.wholesaleMinQty) : '');
    setImages(p.images && p.images.length > 0 ? [...p.images] : ['']);
    setStock(p.stock !== undefined ? String(p.stock) : '1');
    setIsUniquePiece(!!p.isUniquePiece);
    setIsInfiniteStock(!!p.isInfiniteStock);
    setOutOfStockAction(p.outOfStockAction || 'default');
    setBadge(p.badge || '');
    setSizesInput(p.sizes ? p.sizes.join(', ') : '');
    setColorsInput(p.colors ? p.colors.join(', ') : '');

    // Condições de Pagamento e Parcelamento
    setPaymentBadge(p.paymentBadge || '');
    setMaxInstallments(p.maxInstallments ? String(p.maxInstallments) : '');
    setInstallmentWithoutInterest(p.installmentWithoutInterest ?? true);

    // Carregamento de campos de Serviço
    const isService = Boolean(p.isService || isServicesCatalog);
    setIsServiceItem(isService);
    setDurationMinutes(p.durationMinutes ? String(p.durationMinutes) : (isService ? '45' : ''));
    setDurationFormatted(p.durationFormatted || (p.durationMinutes ? `${p.durationMinutes} min` : (isService ? '45 min' : '')));
    setServicePriceType(p.servicePriceType || 'fixed');
    setBookingMode(p.bookingMode || 'appointment');
    setAllowMultiple(p.allowMultiple ?? true);
    setScheduleType(p.scheduleType || 'store_hours');
    setCustomStartTime(p.customStartTime || '14:00');
    setCustomEndTime(p.customEndTime || '');
    setAvailableTimeSlots(p.availableTimeSlots || []);

    if (p.scheduledDiscount && p.scheduledDiscount.enabled) {
      setHasScheduledDiscount(true);
      setScheduledTitle(p.scheduledDiscount.title || 'Oferta Relâmpago');
      setScheduledEndsAt(
        p.scheduledDiscount.endsAt ? p.scheduledDiscount.endsAt.slice(0, 16) : ''
      );
    } else {
      setHasScheduledDiscount(false);
      setScheduledTitle('Oferta Relâmpago');
      setScheduledEndsAt('');
    }

    if (p.recommendations && p.recommendations.enabled) {
      setHasRecommendations(true);
      setRecommendationTitle(p.recommendations.title || (isService ? 'Combine este procedimento com' : 'Combine com'));
      setRecommendationMode(p.recommendations.mode || 'fixed');
      setRecommendationTopic(p.recommendations.targetTopic || 'CURRENT');
      setRecommendationProductIds(p.recommendations.productIds || []);
    } else {
      setHasRecommendations(false);
      setRecommendationTitle(isService ? 'Combine este procedimento com' : 'Combine com');
      setRecommendationMode('fixed');
      setRecommendationTopic('CURRENT');
      setRecommendationProductIds([]);
    }
    setRecommendationSearch('');

    const hasAdvanced = Boolean(
      (p.description && p.description.trim().length > 0) ||
      p.wholesalePrice !== undefined ||
      p.wholesaleMinQty !== undefined ||
      p.scheduledDiscount?.enabled ||
      (p.outOfStockAction && p.outOfStockAction !== 'default') ||
      (p.badge && p.badge.trim().length > 0) ||
      p.recommendations?.enabled
    );
    setIsAdvancedOpen(hasAdvanced);

    setIsModalOpen(true);
  };

  // Gerenciamento de Tópicos
  const handleOpenCreateTopic = () => {
    setTopicModalMode('create');
    setTopicInputName('');
    setSelectedTopicIcon('shirt');
    setEditingTopicOldName(null);
    setIsTopicModalOpen(true);
  };

  const handleOpenEditTopic = (topicName: string) => {
    setTopicModalMode('edit');
    setTopicInputName(topicName);
    setSelectedTopicIcon(topicIcons?.[topicName] || suggestIconForTopic(topicName));
    setEditingTopicOldName(topicName);
    setIsTopicModalOpen(true);
  };

  const handleSaveTopic = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = topicInputName.trim();
    if (!cleanName) return;

    const updatedIcons = {
      ...(topicIcons || {}),
      [cleanName]: selectedTopicIcon,
    };

    if (topicModalMode === 'create') {
      if (!effectiveTopics.some((t) => t.toLowerCase() === cleanName.toLowerCase())) {
        const updated = [...effectiveTopics, cleanName];
        onChangeTopics?.(updated);
      }
      setSelectedTopic(cleanName);
    } else if (topicModalMode === 'edit' && editingTopicOldName) {
      const oldClean = editingTopicOldName;
      const updatedTopics = effectiveTopics.map((t) =>
        t.toLowerCase() === oldClean.toLowerCase() ? cleanName : t
      );
      onChangeTopics?.(updatedTopics);

      if (oldClean !== cleanName) {
        delete updatedIcons[oldClean];
      }

      // Atualiza produtos que possuíam o tópico antigo
      const updatedProducts = products.map((p) => {
        if ((p.category || '').toLowerCase() === oldClean.toLowerCase()) {
          return { ...p, category: cleanName };
        }
        return p;
      });
      onChangeProducts(updatedProducts);

      if (selectedTopic.toLowerCase() === oldClean.toLowerCase()) {
        setSelectedTopic(cleanName);
      }
    }

    onChangeTopicIcons?.(updatedIcons);
    setIsTopicModalOpen(false);
    setTopicInputName('');
  };

  const handleDeleteTopic = (topicToDelete: string) => {
    const hasProducts = products.some(
      (p) => (p.category || '').toLowerCase() === topicToDelete.toLowerCase()
    );

    const confirmMsg = hasProducts
      ? `O tópico "${topicToDelete}" possui produtos cadastrados. Deseja remover o tópico? As peças serão transferidas para a categoria "Geral".`
      : `Deseja realmente remover o tópico "${topicToDelete}"?`;

    if (confirm(confirmMsg)) {
      const updatedTopics = effectiveTopics.filter(
        (t) => t.toLowerCase() !== topicToDelete.toLowerCase()
      );
      onChangeTopics?.(updatedTopics);

      if (topicIcons && topicIcons[topicToDelete]) {
        const nextIcons = { ...topicIcons };
        delete nextIcons[topicToDelete];
        onChangeTopicIcons?.(nextIcons);
      }

      if (hasProducts) {
        const updatedProducts = products.map((p) => {
          if ((p.category || '').toLowerCase() === topicToDelete.toLowerCase()) {
            return { ...p, category: 'Geral' };
          }
          return p;
        });
        onChangeProducts(updatedProducts);
      }

      if (selectedTopic.toLowerCase() === topicToDelete.toLowerCase()) {
        setSelectedTopic('ALL');
      }
    }
  };

  // Salvar Produto
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parsedPrice = parseFloat(price.replace(',', '.')) || 0;
    const parsedDiscount = discountPrice ? parseFloat(discountPrice.replace(',', '.')) : undefined;
    const parsedWholesalePrice = wholesalePrice ? parseFloat(wholesalePrice.replace(',', '.')) : undefined;
    const parsedWholesaleMinQty = wholesaleMinQty ? parseInt(wholesaleMinQty) : undefined;

    const filteredImages = images.filter((img) => img.trim().length > 0);
    const finalImages =
      filteredImages.length > 0
        ? filteredImages
        : ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80'];

    const parsedSizes = sizesInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const parsedColors = colorsInput
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    const chosenCategory = category.trim() || 'Geral';

    // Se o usuário digitou uma categoria nova que não existia nos tópicos, adiciona aos tópicos e mapeia ícone automaticamente
    if (
      chosenCategory &&
      !effectiveTopics.some((t) => t.toLowerCase() === chosenCategory.toLowerCase())
    ) {
      onChangeTopics?.([...effectiveTopics, chosenCategory]);
      onChangeTopicIcons?.({
        ...(topicIcons || {}),
        [chosenCategory]: topicIcons?.[chosenCategory] || suggestIconForTopic(chosenCategory),
      });
    }

    const newProduct: ProductItem = {
      id: editingIndex !== null ? products[editingIndex].id : `prod-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      category: chosenCategory,
      price: parsedPrice,
      discountPrice: parsedDiscount && parsedDiscount < parsedPrice ? parsedDiscount : undefined,
      wholesalePrice: isServiceItem ? undefined : parsedWholesalePrice,
      wholesaleMinQty: isServiceItem ? undefined : parsedWholesaleMinQty,
      images: finalImages,
      stock: isServiceItem || isInfiniteStock ? 9999 : isUniquePiece ? 1 : parseInt(stock) || 0,
      isUniquePiece: isServiceItem ? false : isUniquePiece,
      isInfiniteStock: isServiceItem ? true : isInfiniteStock,
      outOfStockAction: isServiceItem ? undefined : outOfStockAction !== 'default' ? outOfStockAction : undefined,
      badge: badge.trim() || undefined,
      sizes: !isServiceItem && parsedSizes.length > 0 ? parsedSizes : undefined,
      colors: !isServiceItem && parsedColors.length > 0 ? parsedColors : undefined,
      // Propriedades Exclusivas de Serviços & Procedimentos
      isService: isServiceItem,
      durationMinutes: isServiceItem && durationMinutes.trim() ? (parseInt(durationMinutes) || undefined) : undefined,
      durationFormatted: isServiceItem
        ? (durationFormatted.trim() || (durationMinutes.trim() ? `${durationMinutes.trim()} min` : undefined))
        : undefined,
      servicePriceType: isServiceItem ? servicePriceType : undefined,
      bookingMode: isServiceItem ? bookingMode : undefined,
      allowMultiple: isServiceItem ? allowMultiple : undefined,
      scheduleType: isServiceItem ? scheduleType : undefined,
      customStartTime: isServiceItem && scheduleType === 'custom_start' ? customStartTime : undefined,
      customEndTime: isServiceItem && scheduleType === 'custom_start' ? customEndTime : undefined,
      availableTimeSlots: isServiceItem && bookingMode === 'appointment' ? previewServiceSlots : undefined,
      // Condições de Pagamento e Parcelamento (Opcional - só aparece se configurado)
      paymentBadge: paymentBadge.trim() || undefined,
      maxInstallments: (parseInt(maxInstallments) && parseInt(maxInstallments) > 1) ? parseInt(maxInstallments) : undefined,
      installmentWithoutInterest: (parseInt(maxInstallments) && parseInt(maxInstallments) > 1) ? installmentWithoutInterest : undefined,
      scheduledDiscount: hasScheduledDiscount
        ? {
            enabled: true,
            title: scheduledTitle || 'Oferta Relâmpago',
            discountPercent: parsedDiscount
              ? Math.round(((parsedPrice - parsedDiscount) / parsedPrice) * 100)
              : 15,
            startsAt: new Date().toISOString(),
            endsAt: scheduledEndsAt
              ? new Date(scheduledEndsAt).toISOString()
              : new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
          }
        : undefined,
      recommendations: hasRecommendations
        ? {
            enabled: true,
            title: recommendationTitle.trim() || (isServiceItem ? 'Combine este procedimento com' : 'Combine com'),
            mode: recommendationMode,
            targetTopic: recommendationMode === 'topic' ? recommendationTopic : undefined,
            productIds:
              recommendationMode !== 'topic' ? recommendationProductIds : undefined,
          }
        : undefined,
    };

    if (editingIndex !== null) {
      const updated = [...products];
      updated[editingIndex] = newProduct;
      onChangeProducts(updated);
    } else {
      onChangeProducts([newProduct, ...products]);
    }

    setIsModalOpen(false);
  };

  const handleDeleteProduct = (indexInAll: number) => {
    if (confirm(`Deseja realmente remover o produto "${products[indexInAll].name}"?`)) {
      const updated = products.filter((_, i) => i !== indexInAll);
      onChangeProducts(updated);
    }
  };

  const handleDuplicateProduct = (indexInAll: number) => {
    const original = products[indexInAll];
    const duplicated: ProductItem = {
      ...JSON.parse(JSON.stringify(original)),
      id: `prod-${Date.now()}`,
      name: `${original.name} (Cópia)`,
    };
    const updated = [...products];
    updated.splice(indexInAll + 1, 0, duplicated);
    onChangeProducts(updated);
  };

  const addImageField = () => {
    setImages([...images, '']);
  };

  const removeImageField = (imgIndex: number) => {
    const updated = images.filter((_, i) => i !== imgIndex);
    setImages(updated.length > 0 ? updated : ['']);
  };

  const updateImageField = (imgIndex: number, val: string) => {
    const updated = [...images];
    updated[imgIndex] = val;
    setImages(updated);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header com Ação Contextual ao Tópico */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              {isServicesCatalog ? (
                <Calendar className="w-5 h-5 text-indigo-600" />
              ) : (
                <ShoppingBag className="w-5 h-5 text-indigo-600" />
              )}
              <span>
                {selectedTopic === 'ALL'
                  ? isServicesCatalog
                    ? `Todos os Serviços & Procedimentos (${products.length})`
                    : `Todos os Produtos (${products.length})`
                  : `Módulo: ${selectedTopic} (${filteredProducts.length})`}
              </span>
            </h2>
            {selectedTopic !== 'ALL' && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-1">
                <Bookmark className="w-3 h-3" />
                Módulo Ativo
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {selectedTopic === 'ALL'
              ? isServicesCatalog
                ? 'Organize seus serviços por categorias, defina tempo de duração, fotos do portfólio e disponibilidade de agendamento.'
                : 'Organize seu catálogo por tópicos/módulos, gerencie fotos, tamanhos e estoque.'
              : `Você está visualizando o módulo "${selectedTopic}". Novos itens cadastrados entrarão direto aqui.`}
          </p>
        </div>

        {/* Botão de Adição Contextual */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => openCreateModal(selectedTopic !== 'ALL' ? selectedTopic : undefined)}
            className="w-full sm:w-auto shadow-xs"
          >
            {selectedTopic === 'ALL'
              ? isServicesCatalog
                ? 'Adicionar Novo Serviço'
                : 'Adicionar Novo Produto'
              : isServicesCatalog
              ? `Adicionar Serviço em "${selectedTopic}"`
              : `Adicionar Peça em "${selectedTopic}"`}
          </Button>
        </div>
      </div>

      {/* 2. Barra de Navegação por Tópicos & Módulos */}
      <div className="bg-slate-50/80 p-3 sm:p-4 rounded-2xl border border-slate-200/90 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Folder className="w-4 h-4 text-indigo-600" />
            <span>Tópicos & Módulos do Catálogo</span>
            <span className="text-[10px] text-slate-400 font-normal">
              (Clique para entrar no módulo ou crie novos tópicos como "Roupa Masculina")
            </span>
          </div>

          <button
            type="button"
            onClick={handleOpenCreateTopic}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>+ Novo Tópico</span>
          </button>
        </div>

        {/* Pílulas de Tópicos */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {/* Aba Todas */}
          <button
            type="button"
            onClick={() => setSelectedTopic('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              selectedTopic === 'ALL'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>Todos os Produtos</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                selectedTopic === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {products.length}
            </span>
          </button>

          {/* Cada Tópico Registrado */}
          {effectiveTopics.map((topic) => {
            const isSelected = selectedTopic.toLowerCase() === topic.toLowerCase();
            const count = topicCounts[topic.toLowerCase()] || 0;

            return (
              <div
                key={topic}
                className={`flex items-center rounded-xl transition-all whitespace-nowrap shrink-0 border ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                    : 'bg-white text-slate-700 hover:border-slate-300 border-slate-200'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedTopic(topic)}
                  className="px-3 py-1.5 text-xs font-bold flex items-center gap-1.5"
                >
                  {(() => {
                    const TopicIcon = resolveTopicIcon(topic, topicIcons?.[topic]);
                    return (
                      <TopicIcon
                        className={`w-3.5 h-3.5 ${
                          isSelected ? 'text-white' : 'text-indigo-600'
                        }`}
                      />
                    );
                  })()}
                  <span>{topic}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                      isSelected ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>

                {/* Opções de Renomear e Excluir Tópico */}
                <div className="flex items-center pr-1.5 pl-0.5 border-l border-white/20">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEditTopic(topic);
                    }}
                    title={`Renomear tópico "${topic}"`}
                    className={`p-1 rounded-md transition-colors ${
                      isSelected
                        ? 'text-indigo-200 hover:text-white hover:bg-indigo-700'
                        : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTopic(topic);
                    }}
                    title={`Excluir tópico "${topic}"`}
                    className={`p-1 rounded-md transition-colors ${
                      isSelected
                        ? 'text-indigo-200 hover:text-rose-200 hover:bg-indigo-700'
                        : 'text-slate-400 hover:text-rose-600 hover:bg-slate-100'
                    }`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Botão de Adicionar Rápido */}
          <button
            type="button"
            onClick={handleOpenCreateTopic}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-indigo-600 border border-dashed border-slate-300 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all whitespace-nowrap shrink-0 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Criar Tópico</span>
          </button>
        </div>
      </div>

      {/* 2. Lista de Produtos Filtrada pelo Tópico */}
      {filteredProducts.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 space-y-4">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <FolderPlus className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              {selectedTopic === 'ALL'
                ? isServicesCatalog
                  ? 'Nenhum serviço cadastrado ainda'
                  : 'Nenhum produto cadastrado ainda'
                : isServicesCatalog
                ? `Nenhum serviço no módulo "${selectedTopic}" ainda`
                : `Nenhuma peça no módulo "${selectedTopic}" ainda`}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {selectedTopic === 'ALL'
                ? isServicesCatalog
                  ? 'Clique no botão abaixo para cadastrar seu primeiro serviço ou procedimento.'
                  : 'Clique no botão abaixo para adicionar seu primeiro produto.'
                : isServicesCatalog
                ? `Cadastre procedimentos diretamente dentro desta categoria para que apareçam organizados na vitrine de agendamento.`
                : `Cadastre peças diretamente dentro deste módulo para que elas apareçam agrupadas na vitrine e nos filtros.`}
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => openCreateModal(selectedTopic !== 'ALL' ? selectedTopic : undefined)}
          >
            {selectedTopic === 'ALL'
              ? isServicesCatalog
                ? 'Cadastrar Primeiro Serviço'
                : 'Cadastrar Primeiro Produto'
              : isServicesCatalog
              ? `Cadastrar Serviço em "${selectedTopic}"`
              : `Cadastrar Peça em "${selectedTopic}"`}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProducts.map((product) => {
            const originalIndex = products.findIndex((p) => p.id === product.id);
            const hasDiscount =
              product.discountPrice && product.discountPrice < product.price;
            const discountPercent = hasDiscount
              ? Math.round(
                  ((product.price - (product.discountPrice || 0)) / product.price) * 100
                )
              : 0;

            const isInfinite =
              product.isInfiniteStock ||
              outOfStockBehavior === 'infinite' ||
              product.outOfStockAction === 'infinite';
            const isSoldOut = isInfinite
              ? false
              : product.isUniquePiece
              ? product.stock !== undefined && product.stock <= 0
              : (product.stock || 0) <= 0;
            const effectiveAction =
              product.outOfStockAction && product.outOfStockAction !== 'default'
                ? product.outOfStockAction
                : outOfStockBehavior;

            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between gap-3 group"
              >
                <div className="flex gap-3.5">
                  {/* Miniatura do Produto */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0 relative border border-slate-100">
                    <img
                      src={
                        product.images && product.images[0]
                          ? product.images[0]
                          : 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80'
                      }
                      alt={product.name}
                      className={`w-full h-full object-cover ${isSoldOut ? 'grayscale-40 opacity-80' : ''}`}
                      loading="lazy"
                    />
                    {isSoldOut && (
                      <span className="absolute top-1 left-1 bg-rose-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                        ESGOTADO
                      </span>
                    )}
                    {product.images && product.images.length > 1 && (
                      <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                        +{product.images.length - 1}
                      </span>
                    )}
                  </div>

                  {/* Informações */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] uppercase font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                        {product.category || 'Geral'}
                      </span>
                      {(product.isService || isServicesCatalog) && (
                        <>
                          {(product.durationFormatted || product.durationMinutes) && (
                            <span className="text-[10px] font-bold text-sky-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded flex items-center gap-1">
                              <Clock className="w-3 h-3 text-sky-600" />
                              <span>{product.durationFormatted || `${product.durationMinutes} min`}</span>
                            </span>
                          )}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                            product.bookingMode === 'queue'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}>
                            <Calendar className="w-3 h-3" />
                            <span>{product.bookingMode === 'queue' ? 'Ordem de Chegada' : 'Horário Marcado'}</span>
                          </span>
                        </>
                      )}
                      {product.badge && (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100/90 border border-amber-300 px-2 py-0.5 rounded flex items-center gap-1 shadow-2xs">
                          <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                          <span>{product.badge}</span>
                          <span className="text-[9px] font-semibold text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200 flex items-center gap-0.5">
                            <Bookmark className="w-2.5 h-2.5 text-amber-600" />
                            <span>Topo</span>
                          </span>
                        </span>
                      )}
                      {product.scheduledDiscount?.enabled && (
                        <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />
                          <span>Promoção</span>
                        </span>
                      )}
                      {product.recommendations?.enabled && (
                        <span className="text-[10px] font-semibold text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded flex items-center gap-1">
                          <Layers className="w-2.5 h-2.5 text-violet-600" />
                          <span>
                            {product.recommendations.mode === 'fixed'
                              ? `Indica ${product.recommendations.productIds?.length || 0} itens`
                              : product.recommendations.mode === 'random_selected'
                              ? `Sorteia ${product.recommendations.productIds?.length || 0} itens`
                              : `Indica tópico ${product.recommendations.targetTopic === 'CURRENT' || !product.recommendations.targetTopic ? (product.category || 'do item') : product.recommendations.targetTopic}`}
                          </span>
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 truncate" title={product.name}>
                      {product.name}
                    </h3>

                    {/* Preços */}
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">
                          {product.isService || isServicesCatalog
                            ? product.servicePriceType === 'starting_at'
                              ? 'A partir de:'
                              : 'Valor:'
                            : 'Varejo:'}
                        </span>
                        {product.servicePriceType === 'quote' ? (
                          <span className="text-sm font-extrabold text-indigo-700">
                            Sob Consulta
                          </span>
                        ) : hasDiscount ? (
                          <>
                            <span className="text-sm font-extrabold text-slate-900">
                              R$ {product.discountPrice?.toFixed(2)}
                            </span>
                            <span className="text-[10px] text-slate-400 line-through">
                              R$ {product.price.toFixed(2)}
                            </span>
                            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded">
                              -{discountPercent}%
                            </span>
                          </>
                        ) : (
                          <span className="text-sm font-extrabold text-slate-900">
                            R$ {product.price.toFixed(2)}
                            {product.servicePriceType === 'hourly' && ' / hora'}
                            {product.servicePriceType === 'daily' && ' / diária'}
                          </span>
                        )}
                      </div>

                      {/* Preço de Atacado apenas para produtos físicos */}
                      {!(product.isService || isServicesCatalog) && wholesaleConfig?.enabled !== false && (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                          <Package className="w-3 h-3 text-amber-600" />
                          <span className="text-[10px] font-semibold text-amber-700 uppercase">Atacado:</span>
                          <span className="font-extrabold">
                            R${' '}
                            {(
                              product.wholesalePrice !== undefined
                                ? product.wholesalePrice
                                : product.price * (1 - (wholesaleConfig?.defaultDiscountPercent || 35) / 100)
                            ).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
                      {product.isService || isServicesCatalog ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Grade Aberta para Agendamento</span>
                          </span>
                          {product.allowMultiple !== false && (
                            <span className="text-[10px] text-slate-500">
                              • Aceita agendamento combinado
                            </span>
                          )}
                        </div>
                      ) : (
                        <>
                          <span>
                            Estoque:{' '}
                            <strong className={isInfinite ? 'text-emerald-700 font-bold' : isSoldOut ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                              {isInfinite ? '∞ Infinito' : product.isUniquePiece ? 'Peça Única (1)' : product.stock}
                            </strong>
                          </span>

                          {isInfinite && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <InfinityIcon className="w-3 h-3" />
                              <span>Sempre Disponível</span>
                            </span>
                          )}

                          {isSoldOut && !isInfinite && (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                                effectiveAction === 'hide'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : 'bg-rose-100 text-rose-800 border border-rose-300'
                              }`}
                            >
                              <AlertCircle className="w-3 h-3" />
                              {effectiveAction === 'hide'
                                ? 'Oculto na Vitrine'
                                : 'Exibindo "Esgotado"'}
                            </span>
                          )}

                          {product.sizes && product.sizes.length > 0 && (
                            <>
                              <span>•</span>
                              <span>Tam: {product.sizes.join(', ')}</span>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Ações */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleDuplicateProduct(originalIndex)}
                    title="Duplicar Produto"
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors text-xs flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Duplicar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditModal(originalIndex)}
                    title="Editar Produto"
                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors text-xs font-medium flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteProduct(originalIndex)}
                    title="Excluir Produto"
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Modal de Criação / Edição de Produto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  {isServiceItem ? (
                    <Calendar className="w-5 h-5 text-indigo-600" />
                  ) : (
                    <PackagePlus className="w-5 h-5 text-indigo-600" />
                  )}
                  <span>
                    {editingIndex !== null
                      ? isServiceItem
                        ? 'Editar Serviço / Procedimento'
                        : 'Editar Produto'
                      : isServiceItem
                      ? 'Cadastrar Novo Serviço / Procedimento'
                      : 'Cadastrar Novo Produto'}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isServiceItem
                    ? 'Configure duração estimada, modo de agendamento (horário marcado ou ordem de chegada) e fotos do portfólio'
                    : 'Preencha as informações essenciais para publicar na vitrine'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProduct} className="p-5 sm:p-6 space-y-4 text-xs sm:text-sm">
              {/* Seletor de Tipo: Serviço vs Produto */}
              <div className="flex p-1 bg-slate-100 rounded-xl max-w-md">
                <button
                  type="button"
                  onClick={() => setIsServiceItem(true)}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    isServiceItem
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Serviço / Procedimento</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsServiceItem(false)}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    !isServiceItem
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />
                  <span>Produto Físico</span>
                </button>
              </div>

              {/* 1. Nome do Item */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  {isServiceItem ? 'Nome do Serviço / Procedimento *' : 'Nome do Produto *'}
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder={
                    isServiceItem
                      ? 'Ex: Corte Degradê Masculino + Barboterapia'
                      : 'Ex: Vestido Midi Linho Cru'
                  }
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 text-sm"
                />
              </div>

              {/* 2. Tópico / Módulo (Seleção em 1 Clique) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    Módulo / Categoria *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomTopicInput(!isCustomTopicInput)}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    {isCustomTopicInput ? 'Escolher da lista' : '+ Outro módulo'}
                  </button>
                </div>

                {!isCustomTopicInput ? (
                  <div className="flex flex-wrap gap-1.5">
                    {effectiveTopics.map((top) => {
                      const isMatch = category.toLowerCase() === top.toLowerCase();
                      const CatIcon = resolveTopicIcon(top, topicIcons?.[top]);
                      return (
                        <button
                          key={top}
                          type="button"
                          onClick={() => setCategory(top)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                            isMatch
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                          }`}
                        >
                          <CatIcon className={`w-3.5 h-3.5 ${isMatch ? 'text-white' : 'text-indigo-600'}`} />
                          <span>{top}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder="Digite o nome do novo módulo (ex: Alfaiataria)"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600"
                  />
                )}
              </div>

              {/* 3. Se for Serviço: Duração, Preço, Modo de Atendimento e Agendamentos Múltiplos */}
              {isServiceItem ? (
                <div className="space-y-3.5 pt-1">
                  {/* Duração Estimada do Procedimento */}
                  <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-sky-700" />
                        <span>Duração Estimada do Procedimento *</span>
                      </label>
                      <span className="text-[10px] text-sky-700">Tempo reservado na agenda</span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[
                        { label: '15 min', val: '15' },
                        { label: '30 min', val: '30' },
                        { label: '45 min', val: '45' },
                        { label: '1 hora', val: '60' },
                        { label: '1h 30m', val: '90' },
                        { label: '2 horas', val: '120' },
                        { label: '3 horas', val: '180' },
                      ].map((d) => (
                        <button
                          key={d.val}
                          type="button"
                          onClick={() => {
                            setDurationMinutes(d.val);
                            setDurationFormatted(d.label);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                            durationMinutes === d.val
                              ? 'bg-sky-600 text-white font-bold shadow-2xs'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-sky-100 hover:border-sky-300'
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                          Texto Exibido na Vitrine
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: 45 min, 1h 30m, etc."
                          value={durationFormatted}
                          onChange={(e) => setDurationFormatted(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                          Minutos Totais de Bloqueio
                        </label>
                        <input
                          type="number"
                          min="5"
                          step="5"
                          placeholder="Ex: 45"
                          value={durationMinutes}
                          onChange={(e) => setDurationMinutes(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900 text-xs bg-white font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tipo de Preço e Valores */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-800">
                        Tipo de Cobrança / Preço
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-xs">
                        {[
                          { id: 'fixed', label: 'Preço Fixo' },
                          { id: 'starting_at', label: 'A partir de' },
                          { id: 'hourly', label: 'Por Hora' },
                          { id: 'daily', label: 'Por Diária' },
                          { id: 'quote', label: 'Sob Consulta' },
                        ].map((type) => (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() => setServicePriceType(type.id as any)}
                            className={`p-2 rounded-lg font-semibold text-center transition-all border ${
                              servicePriceType === type.id
                                ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-2xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {type.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          {servicePriceType === 'starting_at'
                            ? 'Valor Inicial (A partir de R$) *'
                            : servicePriceType === 'quote'
                            ? 'Valor Base / Estimado (R$)'
                            : 'Valor do Serviço (R$) *'}
                        </label>
                        <input
                          type="text"
                          required={servicePriceType !== 'quote'}
                          placeholder="120,00"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          Preço Promocional (R$)
                        </label>
                        <input
                          type="text"
                          placeholder="99,00 (opcional)"
                          value={discountPrice}
                          onChange={(e) => setDiscountPrice(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-emerald-700 font-bold focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 text-sm"
                        />
                      </div>
                    </div>

                    {/* Condições de Pagamento e Parcelamento (Opcional) */}
                    <div className="pt-3 border-t border-slate-200/80 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Condições de Pagamento & Parcelamento (Opcional)</span>
                        </label>
                        <span className="text-[10px] text-slate-400">Só aparece se configurado</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Selo / Destaque de Pagamento */}
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Selo de Pagamento na Vitrine
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: PIX ou Cartão, 5% OFF no PIX"
                            value={paymentBadge}
                            onChange={(e) => setPaymentBadge(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900 text-xs bg-white placeholder:text-slate-400"
                          />
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {['PIX ou Cartão', '5% OFF no PIX', 'Cartão em até 12x', 'À Vista'].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => setPaymentBadge(paymentBadge === preset ? '' : preset)}
                                className={`text-[10px] px-2 py-0.5 rounded-md border transition-all ${
                                  paymentBadge === preset
                                    ? 'bg-indigo-100 text-indigo-800 border-indigo-300 font-bold'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {preset}
                              </button>
                            ))}
                            {paymentBadge && (
                              <button
                                type="button"
                                onClick={() => setPaymentBadge('')}
                                className="text-[10px] px-1.5 py-0.5 text-rose-500 hover:text-rose-700 underline"
                              >
                                Limpar
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Parcelamento no Cartão */}
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Parcelamento no Cartão
                          </label>
                          <div className="flex items-center gap-2">
                            <select
                              value={maxInstallments}
                              onChange={(e) => setMaxInstallments(e.target.value)}
                              className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900 text-xs bg-white font-medium"
                            >
                              <option value="">Não exibir parcelamento</option>
                              <option value="2">Até 2x</option>
                              <option value="3">Até 3x</option>
                              <option value="4">Até 4x</option>
                              <option value="5">Até 5x</option>
                              <option value="6">Até 6x</option>
                              <option value="10">Até 10x</option>
                              <option value="12">Até 12x</option>
                            </select>

                            {parseInt(maxInstallments) > 1 && (
                              <label className="flex items-center gap-1.5 text-[11px] text-slate-700 cursor-pointer select-none shrink-0 bg-white px-2 py-1.5 rounded-lg border border-slate-300">
                                <input
                                  type="checkbox"
                                  checked={installmentWithoutInterest}
                                  onChange={(e) => setInstallmentWithoutInterest(e.target.checked)}
                                  className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="font-semibold">Sem juros</span>
                              </label>
                            )}
                          </div>

                          {parseInt(maxInstallments) > 1 && (
                            <p className="text-[10.5px] text-emerald-700 font-medium mt-1.5 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                              <span>✓</span>
                              <span>
                                Exibirá:{' '}
                                <strong>
                                  Em até {maxInstallments}x{' '}
                                  {installmentWithoutInterest ? 'sem juros' : ''} de{' '}
                                  {((parseFloat(price.replace(',', '.')) || 99) / parseInt(maxInstallments)).toLocaleString('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                  })}
                                </strong>
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Modo de Atendimento (Horário Marcado vs Ordem de Chegada) */}
                  <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-purple-700" />
                        <span>Modo de Atendimento Deste Serviço *</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setBookingMode('appointment')}
                        className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                          bookingMode === 'appointment'
                            ? 'bg-purple-100/80 border-purple-400 text-purple-950 font-bold ring-2 ring-purple-500/20 shadow-2xs'
                            : 'bg-white border-purple-200/70 text-slate-700 hover:bg-purple-50/50'
                        }`}
                      >
                        <Clock className={`w-4 h-4 mt-0.5 shrink-0 ${bookingMode === 'appointment' ? 'text-purple-700' : 'text-slate-400'}`} />
                        <div>
                          <span className="text-xs font-bold block">Horário Marcado</span>
                          <span className="text-[10px] text-purple-900/80 block mt-0.5 leading-snug">
                            Exibe a grade de horários disponíveis para o cliente escolher o melhor horário.
                          </span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setBookingMode('queue')}
                        className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                          bookingMode === 'queue'
                            ? 'bg-amber-100/90 border-amber-400 text-amber-950 font-bold ring-2 ring-amber-500/20 shadow-2xs'
                            : 'bg-white border-amber-200/70 text-slate-700 hover:bg-amber-50/50'
                        }`}
                      >
                        <Users className={`w-4 h-4 mt-0.5 shrink-0 ${bookingMode === 'queue' ? 'text-amber-700' : 'text-slate-400'}`} />
                        <div>
                          <span className="text-xs font-bold block">Ordem de Chegada</span>
                          <span className="text-[10px] text-amber-900/80 block mt-0.5 leading-snug">
                            <strong>NÃO mostra horários</strong>. O cliente escolhe o dia e comparece por ordem de chegada no horário de atendimento.
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Configuração de Horário de Início e Grade de Atendimento */}
                  {bookingMode === 'appointment' && (
                    <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200/80 space-y-3">
                      <div>
                        <label className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-purple-700" />
                          <span>Grade e Horário de Início do Atendimento *</span>
                        </label>
                        <p className="text-[11px] text-purple-800/80 mt-0.5">
                          Defina se este serviço está disponível ao longo de todo o expediente ou a partir de um horário específico.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setScheduleType('store_hours')}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            scheduleType === 'store_hours'
                              ? 'bg-purple-100/90 border-purple-400 text-purple-950 font-bold ring-2 ring-purple-500/20 shadow-2xs'
                              : 'bg-white border-purple-200/60 text-slate-700 hover:bg-purple-50/50'
                          }`}
                        >
                          <span className="text-xs font-bold flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-purple-600 inline-block"></span>
                            Seguir Horário da Loja
                          </span>
                          <span className="text-[10px] text-purple-900/80 block mt-1 leading-snug">
                            Gera os horários no expediente completo ({schedulingConfig?.openTime || '09:00'} às {schedulingConfig?.closeTime || '18:00'}), respeitando pausa de almoço.
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setScheduleType('custom_start')}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            scheduleType === 'custom_start'
                              ? 'bg-purple-100/90 border-purple-400 text-purple-950 font-bold ring-2 ring-purple-500/20 shadow-2xs'
                              : 'bg-white border-purple-200/60 text-slate-700 hover:bg-purple-50/50'
                          }`}
                        >
                          <span className="text-xs font-bold flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block"></span>
                            A partir de Horário Específico
                          </span>
                          <span className="text-[10px] text-purple-900/80 block mt-1 leading-snug">
                            Ideal para procedimentos que só começam à tarde ou em turno específico (ex: a partir das 14:00).
                          </span>
                        </button>
                      </div>

                      {/* Inputs de Horário Específico */}
                      {scheduleType === 'custom_start' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1.5 bg-white/90 p-3 rounded-xl border border-purple-200/70">
                          <div>
                            <label className="block text-[11px] font-bold text-purple-950 mb-1">
                              Começar a partir das *
                            </label>
                            <input
                              type="time"
                              value={customStartTime}
                              onChange={(e) => setCustomStartTime(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-purple-200 text-slate-800 text-xs font-bold bg-white focus:ring-2 focus:ring-purple-400"
                            />
                            <span className="text-[10px] text-slate-500 block mt-0.5">
                              Primeiro horário liberado para agendamento.
                            </span>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-purple-950 mb-1">
                              Até as (Opcional)
                            </label>
                            <input
                              type="time"
                              placeholder={schedulingConfig?.closeTime || '18:00'}
                              value={customEndTime}
                              onChange={(e) => setCustomEndTime(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-purple-200 text-slate-800 text-xs font-bold bg-white focus:ring-2 focus:ring-purple-400"
                            />
                            <span className="text-[10px] text-slate-500 block mt-0.5">
                              Deixe em branco para ir até o encerramento ({schedulingConfig?.closeTime || '18:00'}).
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Preview em Tempo Real dos Horários Gerados */}
                      <div className="bg-white/90 p-3 rounded-xl border border-purple-200/70">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-purple-600" />
                            Grade no Catálogo ({previewServiceSlots.length} horários válidos)
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold">
                            Passo de {durationMinutes || 15} min
                          </span>
                        </div>

                        {previewServiceSlots.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                            {previewServiceSlots.map((slot) => (
                              <span
                                key={slot}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-50 text-purple-900 border border-purple-200/60 shadow-2xs"
                              >
                                {slot}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="p-2 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-[11px]">
                            Nenhum horário gerado dentro do expediente da loja ({schedulingConfig?.openTime || '09:00'} - {schedulingConfig?.closeTime || '18:00'}). Verifique a duração ou horário de início.
                          </div>
                        )}

                        {schedulingConfig?.hasBreak && (
                          <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                            <span>☕</span>
                            Pausa para almoço ({schedulingConfig.breakStartTime || '12:00'} - {schedulingConfig.breakEndTime || '13:00'}) excluída automaticamente.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Agendamentos Múltiplos */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">
                          Permitir Agendamentos Múltiplos
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          Cliente pode combinar este serviço com outros no mesmo agendamento (ex: Corte + Barba ou Unha + Cabelo)
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={allowMultiple}
                      onChange={(e) => setAllowMultiple(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              ) : (
                <>
                  {/* 3. Preços e Estoque para Produtos Físicos */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Preço de Varejo (R$) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="189,90"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Preço Promocional (R$)
                      </label>
                      <input
                        type="text"
                        placeholder="149,90 (opcional)"
                        value={discountPrice}
                        onChange={(e) => setDiscountPrice(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-emerald-700 font-bold focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Estoque Disponível
                      </label>
                      <input
                        type="text"
                        disabled={isUniquePiece || isInfiniteStock}
                        value={isInfiniteStock ? 'Infinito (Ilimitado)' : isUniquePiece ? '1' : stock}
                        onChange={(e) => setStock(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 text-sm disabled:bg-slate-100 disabled:text-slate-600"
                      />
                    </div>
                  </div>

                  {/* Condições de Pagamento e Parcelamento para Produtos Físicos (Opcional) */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Condições de Pagamento & Parcelamento (Opcional)</span>
                      </label>
                      <span className="text-[10px] text-slate-400">Só aparece se configurado</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Selo / Destaque de Pagamento */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Selo de Pagamento na Vitrine
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: PIX ou Cartão, 5% OFF no PIX"
                          value={paymentBadge}
                          onChange={(e) => setPaymentBadge(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900 text-xs bg-white placeholder:text-slate-400"
                        />
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {['PIX ou Cartão', '5% OFF no PIX', 'Cartão em até 12x', 'À Vista'].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setPaymentBadge(paymentBadge === preset ? '' : preset)}
                              className={`text-[10px] px-2 py-0.5 rounded-md border transition-all ${
                                paymentBadge === preset
                                  ? 'bg-indigo-100 text-indigo-800 border-indigo-300 font-bold'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {preset}
                            </button>
                          ))}
                          {paymentBadge && (
                            <button
                              type="button"
                              onClick={() => setPaymentBadge('')}
                              className="text-[10px] px-1.5 py-0.5 text-rose-500 hover:text-rose-700 underline"
                            >
                              Limpar
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Parcelamento no Cartão */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Parcelamento no Cartão
                        </label>
                        <div className="flex items-center gap-2">
                          <select
                            value={maxInstallments}
                            onChange={(e) => setMaxInstallments(e.target.value)}
                            className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900 text-xs bg-white font-medium"
                          >
                            <option value="">Não exibir parcelamento</option>
                            <option value="2">Até 2x</option>
                            <option value="3">Até 3x</option>
                            <option value="4">Até 4x</option>
                            <option value="5">Até 5x</option>
                            <option value="6">Até 6x</option>
                            <option value="10">Até 10x</option>
                            <option value="12">Até 12x</option>
                          </select>

                          {parseInt(maxInstallments) > 1 && (
                            <label className="flex items-center gap-1.5 text-[11px] text-slate-700 cursor-pointer select-none shrink-0 bg-white px-2 py-1.5 rounded-lg border border-slate-300">
                              <input
                                type="checkbox"
                                checked={installmentWithoutInterest}
                                onChange={(e) => setInstallmentWithoutInterest(e.target.checked)}
                                className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="font-semibold">Sem juros</span>
                            </label>
                          )}
                        </div>

                        {parseInt(maxInstallments) > 1 && (
                          <p className="text-[10.5px] text-emerald-700 font-medium mt-1.5 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                            <span>✓</span>
                            <span>
                              Exibirá:{' '}
                              <strong>
                                Em até {maxInstallments}x{' '}
                                {installmentWithoutInterest ? 'sem juros' : ''} de{' '}
                                {((parseFloat(price.replace(',', '.')) || 99) / parseInt(maxInstallments)).toLocaleString('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                })}
                              </strong>
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 4. Opções Rápidas de Tipo de Estoque */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const next = !isInfiniteStock;
                        setIsInfiniteStock(next);
                        if (next) setIsUniquePiece(false);
                      }}
                      className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                        isInfiniteStock
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold ring-2 ring-emerald-400/20 shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <InfinityIcon className={`w-4 h-4 ${isInfiniteStock ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <div>
                          <span className="text-xs font-bold block">Estoque Infinito</span>
                          <span className="text-[10px] text-slate-500 block">Nunca esgota (sob encomenda / contínuo)</span>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                        isInfiniteStock ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                      }`}>
                        {isInfiniteStock && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const next = !isUniquePiece;
                        setIsUniquePiece(next);
                        if (next) setIsInfiniteStock(false);
                      }}
                      className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                        isUniquePiece
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-950 font-bold ring-2 ring-indigo-400/20 shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Package className={`w-4 h-4 ${isUniquePiece ? 'text-indigo-600' : 'text-slate-400'}`} />
                        <div>
                          <span className="text-xs font-bold block">Peça Única</span>
                          <span className="text-[10px] text-slate-500 block">Apenas 1 unidade exclusiva</span>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                        isUniquePiece ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                      }`}>
                        {isUniquePiece && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>
                  </div>

                  {/* Regra de Esgotamento Direta Deste Produto */}
                  {!isInfiniteStock && (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-wrap items-center justify-between gap-2.5">
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">
                          Se o estoque zerar:
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          Ação automática na vitrine ao acabar as peças
                        </span>
                      </div>

                      <div className="inline-flex p-0.5 rounded-lg bg-white border border-slate-200 text-xs">
                        <button
                          type="button"
                          onClick={() => setOutOfStockAction('badge-sold-out')}
                          className={`px-3 py-1 rounded-md font-semibold transition-all ${
                            outOfStockAction === 'badge-sold-out' || outOfStockAction === 'default'
                              ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Manter com Selo "Esgotado"
                        </button>
                        <button
                          type="button"
                          onClick={() => setOutOfStockAction('hide')}
                          className={`px-3 py-1 rounded-md font-semibold transition-all ${
                            outOfStockAction === 'hide'
                              ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Ocultar da Vitrine
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* 5. Fotos da Peça ou Portfólio do Serviço */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    {isServiceItem ? 'Fotos do Portfólio / Resultados do Procedimento' : 'Fotos do Produto'}
                  </label>
                  <button
                    type="button"
                    onClick={addImageField}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Adicionar outra foto</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {images.map((imgUrl, imgIdx) => (
                    <div key={imgIdx} className="flex gap-2.5 items-center">
                      {/* Thumbnail Preview */}
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
                        {imgUrl.trim() ? (
                          <img
                            src={imgUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <Camera className="w-4 h-4 text-slate-400" />
                        )}
                      </div>

                      <input
                        type="url"
                        placeholder="Cole o link da foto (https://...)"
                        value={imgUrl}
                        onChange={(e) => updateImageField(imgIdx, e.target.value)}
                        className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs sm:text-sm font-medium"
                      />

                      {images.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeImageField(imgIdx)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Remover foto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 6 e 7. Tamanhos e Cores apenas para Produtos Físicos */}
              {!isServiceItem && (
                <>
                  {/* Tamanhos Rápidos (1 clique) */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Ruler className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Tamanhos Disponíveis</span>
                      </label>
                      {currentSelectedSizes.length > 0 && (
                        <button
                          type="button"
                          onClick={clearSizes}
                          className="text-[11px] font-semibold text-rose-600 hover:underline"
                        >
                          Limpar
                        </button>
                      )}
                    </div>

                    {/* Atalhos Rápidos */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-semibold text-slate-400">Atalhos rápidos:</span>
                      {[
                        { label: 'P, M, G', list: ['P', 'M', 'G'] },
                        { label: 'P ao GG', list: ['P', 'M', 'G', 'GG'] },
                        { label: '36 ao 44', list: ['36', '38', '40', '42', '44'] },
                        { label: 'Tamanho Único', list: ['Único'] },
                      ].map((pack) => (
                        <button
                          key={pack.label}
                          type="button"
                          onClick={() => applySizePack(pack.list)}
                          className="px-2 py-0.5 rounded text-[11px] font-medium bg-white text-slate-700 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                        >
                          + {pack.label}
                        </button>
                      ))}
                    </div>

                    {/* Chips de tamanhos rápidos */}
                    <div className="flex flex-wrap gap-1">
                      {['PP', 'P', 'M', 'G', 'GG', 'XG', 'Único', '36', '38', '40', '42', '44', '46'].map((sz) => {
                        const isSelected = currentSelectedSizes.some((s) => s.toLowerCase() === sz.toLowerCase());
                        return (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => toggleSize(sz)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                              isSelected
                                ? 'bg-indigo-600 text-white shadow-2xs'
                                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {sz}
                          </button>
                        );
                      })}
                    </div>

                    {/* Input de visualização/edição */}
                    <input
                      type="text"
                      placeholder="Ex: P, M, G ou digite tamanhos livres"
                      value={sizesInput}
                      onChange={(e) => setSizesInput(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900 text-xs bg-white font-medium focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Cores Rápidas */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Palette className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Cores Disponíveis</span>
                      </label>
                      {currentSelectedColors.length > 0 && (
                        <button
                          type="button"
                          onClick={clearColors}
                          className="text-[11px] font-semibold text-rose-600 hover:underline"
                        >
                          Limpar
                        </button>
                      )}
                    </div>

                    {/* Chips de cores populares */}
                    <div className="flex flex-wrap gap-1.5">
                      {COLOR_PRESETS.slice(0, 11).map((col) => {
                        const isSelected = currentSelectedColors.some((c) => c.toLowerCase() === col.name.toLowerCase());
                        return (
                          <button
                            key={col.name}
                            type="button"
                            onClick={() => toggleColor(col.name)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-black/15 shrink-0"
                              style={{ background: col.hex }}
                            />
                            <span>{col.name}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Input de cores */}
                    <input
                      type="text"
                      placeholder="Ex: Preto, Off-White ou digite cores personalizadas"
                      value={colorsInput}
                      onChange={(e) => setColorsInput(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900 text-xs bg-white font-medium focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </>
              )}

              {/* 8. Mais Opções (Colapsável / Opcional) */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                  className="w-full py-2.5 px-3.5 rounded-xl border border-dashed border-slate-300 hover:border-indigo-300 bg-slate-50 hover:bg-indigo-50/50 text-slate-700 hover:text-indigo-700 text-xs font-bold flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
                    <span>
                      {isAdvancedOpen
                        ? 'Recolher opções adicionais'
                        : '+ Mais opções (Descrição, Atacado, Selo de Destaque, Promoção, Indicações)'}
                    </span>
                  </div>
                  {isAdvancedOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {isAdvancedOpen && (
                  <div className="mt-3 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                    {/* Descrição */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        {isServiceItem ? 'Descrição e Detalhes do Serviço' : 'Descrição e Detalhes da Peça'}
                      </label>
                      <textarea
                        rows={3}
                        placeholder={
                          isServiceItem
                            ? 'O que está incluso no procedimento, produtos utilizados, cuidados pré e pós...'
                            : 'Tecido, modelagem, caimento, instruções de lavagem...'
                        }
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600"
                      />
                    </div>

                    {/* Badge de Destaque */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-800">
                          Selo de Destaque (Fixa no topo da vitrine)
                        </label>
                        {badge && (
                          <button
                            type="button"
                            onClick={() => setBadge('')}
                            className="text-[10px] text-rose-600 hover:underline font-semibold"
                          >
                            Remover selo
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {['Mais Vendido', 'Novidade', 'Destaque', 'Lançamento', 'Últimas Peças'].map((b) => (
                          <button
                            key={b}
                            type="button"
                            onClick={() => setBadge(badge === b ? '' : b)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                              badge === b
                                ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold shadow-2xs'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {b}
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        placeholder="Ou digite outro selo personalizado..."
                        value={badge}
                        onChange={(e) => setBadge(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900 text-xs bg-white font-medium"
                      />
                    </div>

                    {/* Preço de Atacado (Revenda) apenas para Produtos Físicos */}
                    {!isServiceItem && (
                      <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5 text-amber-700" />
                            Preço Especial de Atacado (Revenda)
                          </span>
                          <span className="text-[10px] text-amber-800">
                            Opcional (padrão da loja: {wholesaleConfig?.defaultDiscountPercent || 35}% OFF)
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-semibold text-amber-900 mb-0.5">
                              Preço Unitário de Atacado (R$)
                            </label>
                            <input
                              type="text"
                              placeholder="Ex: 99,90"
                              value={wholesalePrice}
                              onChange={(e) => setWholesalePrice(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg border border-amber-300 text-amber-950 font-bold text-xs bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-amber-900 mb-0.5">
                              Qtd Mínima Desta Peça (Opcional)
                            </label>
                            <input
                              type="number"
                              min="1"
                              placeholder={`Padrão (${wholesaleConfig?.minPieces || 6} un)`}
                              value={wholesaleMinQty}
                              onChange={(e) => setWholesaleMinQty(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg border border-amber-300 text-amber-950 text-xs bg-white"
                            />
                          </div>
                        </div>

                        <p className="text-[10px] text-amber-800/90 leading-tight">
                          Se a loja estiver com a regra <strong>Por Item</strong>, a cliente libera este preço de atacado ao escolher esta quantidade ou mais desta peça.
                        </p>

                        {price && (
                          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                            <span className="text-[10px] text-amber-800 font-semibold">Calcular desconto:</span>
                            {[30, 40, 50].map((pct) => {
                              const base = parseFloat(price.replace(',', '.')) || 0;
                              const calcVal = (base * (1 - pct / 100)).toFixed(2);
                              return (
                                <button
                                  key={pct}
                                  type="button"
                                  onClick={() => setWholesalePrice(calcVal.replace('.', ','))}
                                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-amber-900 border border-amber-300 hover:bg-amber-100 transition-colors"
                                >
                                  {pct}% OFF (R$ {calcVal})
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}


                    {/* Oferta Relâmpago / Contagem Regressiva */}
                    <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-2.5">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hasScheduledDiscount}
                          onChange={(e) => setHasScheduledDiscount(e.target.checked)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                        />
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-rose-600" />
                          Ativar Promoção com Cronômetro
                        </span>
                      </label>

                      {hasScheduledDiscount && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                              Título da Ação
                            </label>
                            <input
                              type="text"
                              placeholder="Ex: Flash Sale de Quinta"
                              value={scheduledTitle}
                              onChange={(e) => setScheduledTitle(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                              Término da Promoção
                            </label>
                            <input
                              type="datetime-local"
                              value={scheduledEndsAt}
                              onChange={(e) => setScheduledEndsAt(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Indicações & Cross-Sell / Serviços Combinados ("Combine Com") */}
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={hasRecommendations}
                            onChange={(e) => setHasRecommendations(e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                          />
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                            {isServiceItem
                              ? 'Ativar Procedimentos / Serviços Combinados ("Combine este procedimento com...")'
                              : 'Ativar Indicações para esta Peça ("Combine Com")'}
                          </span>
                        </label>
                        {hasRecommendations && (
                          <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                            {recommendationMode === 'fixed'
                              ? `${recommendationProductIds.length} selecionados`
                              : recommendationMode === 'random_selected'
                              ? `${recommendationProductIds.length} sorteados`
                              : `Categoria: ${recommendationTopic === 'CURRENT' ? (category || 'Atual') : recommendationTopic}`}
                          </span>
                        )}
                      </div>

                      {hasRecommendations && (
                        <div className="space-y-3 pt-2 border-t border-slate-100">
                          {/* Título da Seção */}
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              {isServiceItem
                                ? 'Título da Seção de Procedimentos Combinados (Visível ao cliente)'
                                : 'Título da Seção de Indicação (Visível ao cliente)'}
                            </label>
                            <input
                              type="text"
                              placeholder={
                                isServiceItem
                                  ? 'Ex: Combine este procedimento com, Complete seu atendimento com, Adicione também'
                                  : 'Ex: Combine com, Complete o look, Você também pode gostar'
                              }
                              value={recommendationTitle}
                              onChange={(e) => setRecommendationTitle(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900 text-xs bg-white font-medium"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">
                              {isServiceItem
                                ? 'Aparece na página do serviço sugerindo procedimentos adicionais para o cliente agendar juntos.'
                                : 'Aparece na página da peça sugerindo outros produtos para compor o look.'}
                            </p>
                          </div>

                          {/* Seletor de Modo (Forma de Indicação) */}
                          <div className="space-y-1.5">
                            <label className="block text-[11px] font-semibold text-slate-600">
                              {isServiceItem
                                ? 'Como selecionar os procedimentos combinados:'
                                : 'Forma de Indicação ao Cliente:'}
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <button
                                type="button"
                                onClick={() => setRecommendationMode('fixed')}
                                className={`p-2.5 rounded-xl border text-left transition-all ${
                                  recommendationMode === 'fixed'
                                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold shadow-2xs'
                                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                <div className="text-xs">Sempre os mesmos</div>
                                <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                                  {isServiceItem ? 'Serviços fixos escolhidos' : 'Produtos fixos escolhidos'}
                                </div>
                              </button>

                              <button
                                type="button"
                                onClick={() => setRecommendationMode('random_selected')}
                                className={`p-2.5 rounded-xl border text-left transition-all ${
                                  recommendationMode === 'random_selected'
                                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold shadow-2xs'
                                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                <div className="text-xs">Ordem aleatória</div>
                                <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                                  {isServiceItem ? 'Sorteia entre os serviços' : 'Sorteia entre os escolhidos'}
                                </div>
                              </button>

                              <button
                                type="button"
                                onClick={() => setRecommendationMode('topic')}
                                className={`p-2.5 rounded-xl border text-left transition-all ${
                                  recommendationMode === 'topic'
                                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold shadow-2xs'
                                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                <div className="text-xs">{isServiceItem ? 'Da mesma categoria' : 'Do tópico'}</div>
                                <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                                  {isServiceItem ? 'Todos da mesma categoria' : 'Todas as peças do tópico'}
                                </div>
                              </button>
                            </div>
                          </div>

                          {/* Se for 'topic' */}
                          {recommendationMode === 'topic' && (
                            <div className="space-y-1.5 pt-1">
                              <label className="block text-[11px] font-semibold text-slate-600">
                                {isServiceItem
                                  ? 'Selecione qual categoria de serviço indicar ao cliente:'
                                  : 'Selecione qual tópico indicar ao cliente:'}
                              </label>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => setRecommendationTopic('CURRENT')}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                    recommendationTopic === 'CURRENT'
                                      ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                                  }`}
                                >
                                  {isServiceItem
                                    ? `Mesma Categoria do Serviço (${category || 'Atual'})`
                                    : `Mesmo Tópico da Peça (${category || 'Atual'})`}
                                </button>
                                {effectiveTopics.map((top) => (
                                  <button
                                    key={top}
                                    type="button"
                                    onClick={() => setRecommendationTopic(top)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                      recommendationTopic === top
                                        ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                                    }`}
                                  >
                                    {top}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Se for 'fixed' ou 'random_selected' */}
                          {recommendationMode !== 'topic' && (
                            <div className="space-y-2 pt-1">
                              <div className="flex items-center justify-between gap-2">
                                <label className="block text-[11px] font-semibold text-slate-600">
                                  {isServiceItem
                                    ? `Escolha os serviços para combinar (${recommendationProductIds.length} selecionados):`
                                    : `Escolha os produtos para indicar (${recommendationProductIds.length} selecionados):`}
                                </label>
                                {recommendationProductIds.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => setRecommendationProductIds([])}
                                    className="text-[10px] text-rose-600 hover:underline font-semibold cursor-pointer"
                                  >
                                    Limpar seleção
                                  </button>
                                )}
                              </div>

                              {/* Barra de busca rápida */}
                              {availableProductsToRecommend.length > 5 && (
                                <input
                                  type="text"
                                  placeholder={isServiceItem ? "Filtrar serviço por nome ou categoria..." : "Filtrar por nome ou categoria..."}
                                  value={recommendationSearch}
                                  onChange={(e) => setRecommendationSearch(e.target.value)}
                                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900 text-xs bg-white"
                                />
                              )}

                              {/* Lista de seleção com scroll */}
                              <div className="max-h-52 overflow-y-auto space-y-1.5 p-2 rounded-xl border border-slate-200 bg-slate-50/60 divide-y divide-slate-100">
                                {filteredRecommendationProducts.length === 0 ? (
                                  <div className="py-4 text-center text-slate-400 text-xs">
                                    {isServiceItem
                                      ? 'Nenhum outro serviço disponível no catálogo.'
                                      : 'Nenhum outro produto disponível no catálogo.'}
                                  </div>
                                ) : (
                                  filteredRecommendationProducts.map((prod) => {
                                    const isSelected = recommendationProductIds.includes(prod.id);
                                    const isProdService = Boolean(prod.isService || isServicesCatalog);

                                    return (
                                      <div
                                        key={prod.id}
                                        onClick={() => {
                                          if (isSelected) {
                                            setRecommendationProductIds(
                                              recommendationProductIds.filter((id) => id !== prod.id)
                                            );
                                          } else {
                                            setRecommendationProductIds([
                                              ...recommendationProductIds,
                                              prod.id,
                                            ]);
                                          }
                                        }}
                                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${
                                          isSelected
                                            ? 'bg-indigo-50/90 border border-indigo-200 text-indigo-950 font-medium shadow-2xs'
                                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                          <img
                                            src={
                                              prod.images?.[0] ||
                                              'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80'
                                            }
                                            alt={prod.name}
                                            className="w-9 h-9 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-200"
                                          />
                                          <div className="min-w-0">
                                            <p className="text-xs font-semibold truncate text-slate-900">
                                              {prod.name}
                                            </p>
                                            <div className="text-[10px] text-slate-400 flex items-center gap-1.5 flex-wrap">
                                              <span>{prod.category || 'Geral'}</span>
                                              {isProdService && (prod.durationFormatted || prod.durationMinutes) && (
                                                <>
                                                  <span>•</span>
                                                  <span className="text-sky-700 font-semibold flex items-center gap-0.5">
                                                    <Clock className="w-2.5 h-2.5" />
                                                    {prod.durationFormatted || `${prod.durationMinutes} min`}
                                                  </span>
                                                </>
                                              )}
                                              <span>•</span>
                                              <span className="font-semibold text-slate-700">
                                                {isProdService && prod.servicePriceType === 'quote'
                                                  ? 'Sob Orçamento'
                                                  : `R$ ${prod.price.toFixed(2)}`}
                                              </span>
                                            </div>
                                          </div>
                                        </div>

                                        <div
                                          className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ml-2 border transition-all ${
                                            isSelected
                                              ? 'bg-indigo-600 border-indigo-600 text-white'
                                              : 'border-slate-300 bg-white'
                                          }`}
                                        >
                                          {isSelected && <Check className="w-3.5 h-3.5" />}
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Rodapé do Modal */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5 sticky bottom-0 bg-white">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  {editingIndex !== null
                    ? 'Salvar Alterações'
                    : isServiceItem
                    ? 'Cadastrar Serviço'
                    : 'Cadastrar Peça'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Modal de Criação / Edição de Tópico */}
      {isTopicModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-indigo-600" />
                <span>
                  {topicModalMode === 'create'
                    ? 'Criar Novo Tópico / Módulo'
                    : `Renomear Tópico "${editingTopicOldName}"`}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setIsTopicModalOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTopic} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome do Tópico / Módulo *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Ex: Roupa Masculina, Vestidos, Semi Joias..."
                  value={topicInputName}
                  onChange={(e) => setTopicInputName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 text-sm"
                />
              </div>

              {topicModalMode === 'create' && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-500 block">
                    Sugestões populares (clique para preencher):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {TOPIC_SUGGESTIONS.map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => {
                          setTopicInputName(sug);
                          setSelectedTopicIcon(suggestIconForTopic(sug));
                        }}
                        className="px-2 py-1 rounded-lg text-[11px] font-medium bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 transition-colors"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Seletor Visual de Ícones */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    Ícone do Módulo / Categoria
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Já vem pré-configurado
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 max-h-40 overflow-y-auto p-1.5 bg-slate-50 rounded-xl border border-slate-200 scrollbar-thin">
                  {AVAILABLE_TOPIC_ICONS.map((opt) => {
                    const IconComponent = opt.icon;
                    const isSelected = selectedTopicIcon === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedTopicIcon(opt.id)}
                        className={`p-2 rounded-lg text-[11px] font-medium flex flex-col items-center justify-center gap-1 transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-xs font-bold ring-2 ring-indigo-400/30'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                        title={opt.label}
                      >
                        <IconComponent className="w-4 h-4 shrink-0" />
                        <span className="truncate w-full text-center text-[10px]">{opt.label.split('/')[0].split('&')[0].trim()}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                {topicModalMode === 'create'
                  ? 'Ao criar o tópico, você poderá selecioná-lo e cadastrar produtos diretamente dentro dele. Ele também será exibido como filtro na vitrine pública.'
                  : 'Ao renomear este tópico, todas as peças vinculadas a ele serão atualizadas automaticamente.'}
              </p>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsTopicModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  {topicModalMode === 'create' ? 'Criar Tópico' : 'Salvar Alteração'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
