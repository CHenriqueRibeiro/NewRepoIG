export interface WholesaleConfig {
  enabled: boolean; // Ativa modalidade de atacado na loja
  ruleType?: 'per_item' | 'cart_value' | 'cart_pieces'; // 'per_item': Por item (quantidade mínima da peça) | 'cart_value': Valor mínimo do pedido (R$) | 'cart_pieces': Qtd total de peças sortidas
  minPieces: number; // Quantidade mínima de peças no carrinho ou por item (ex: 6 ou 3)
  minValue?: number; // Valor mínimo total em R$ no carrinho para atacado (ex: 300)
  defaultDiscountPercent?: number; // % de desconto automático caso o produto não tenha preço fixo de atacado
  requireMinPieces?: boolean; // Se exige atingir a regra mínima para validar o atacado
}

export interface ProductItem {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number; // Preço normal de Varejo / "De"
  discountPrice?: number; // Preço promocional de Varejo / "Por"
  wholesalePrice?: number; // Preço unitário exclusivo de Atacado (Revenda)
  wholesaleMinQty?: number; // Mínimo de unidades desta peça para atacado (opcional)
  images: string[];
  stock: number;
  isUniquePiece?: boolean;
  isInfiniteStock?: boolean; // Peça com estoque infinito / sob encomenda (nunca esgota)
  badge?: string; // ex: "Mais Vendido", "Novidade", "Peça Única", "Oferta Relâmpago"
  sizes?: string[]; // ex: ['P', 'M', 'G'] ou ['36', '38', '40']
  colors?: string[]; // ex: ['Preto', 'Off-White', 'Terracota']
  scheduledDiscount?: {
    enabled: boolean;
    discountPercent: number;
    startsAt: string; // ISO date string
    endsAt: string; // ISO date string
    title: string; // ex: "Flash Sale de Quinta", "Liquidação Especial"
  };
  customShipping?: {
    freeShipping?: boolean;
    fixedPrice?: number;
  };
  outOfStockAction?: 'default' | 'badge-sold-out' | 'hide' | 'infinite'; // Comportamento quando o estoque zerar
  recommendations?: ProductRecommendationConfig; // Indicações / "Combine com"
  // Campos dedicados para Serviços & Agendamentos
  isService?: boolean; // Se é um serviço (ex: corte de cabelo, lavagem, manicure)
  durationMinutes?: number; // Duração estimada em minutos (ex: 30, 45, 60, 90)
  durationFormatted?: string; // Duração formatada amigável (ex: "45 min", "1h 30m", "Diária")
  servicePriceType?: 'fixed' | 'starting_at' | 'hourly' | 'daily' | 'quote'; // 'fixed': R$ X | 'starting_at': A partir de | 'quote': Sob Orçamento
  availableTimeSlots?: string[]; // Grade de horários sugeridos (ex: ['09:00', '10:30', '14:00', '16:00'])
  bookingMode?: 'appointment' | 'queue'; // 'appointment': Horário Marcado | 'queue': Ordem de Chegada (não mostra horários)
  allowMultiple?: boolean; // Permite agendamento múltiplo deste serviço ou pessoas
  scheduleType?: 'store_hours' | 'custom_start'; // 'store_hours': Segue horário geral da loja | 'custom_start': Começa a partir de horário específico
  customStartTime?: string; // Horário específico de início (ex: "14:00")
  customEndTime?: string; // Horário limite de término (ex: "18:00")
  // Condições de Pagamento e Parcelamento (Opcional - só aparece se cadastrado)
  paymentBadge?: string; // Selo de pagamento (ex: "PIX ou Cartão", "5% OFF no PIX")
  maxInstallments?: number; // Máximo de parcelas (ex: 3, 6, 10, 12)
  installmentWithoutInterest?: boolean; // Se as parcelas são sem juros (true por padrão se maxInstallments > 1)
}

export interface ProductRecommendationConfig {
  enabled?: boolean;
  title?: string; // ex: "Combine com", "Você também pode gostar"
  mode: 'fixed' | 'random_selected' | 'topic'; // 'fixed': sempre o mesmo produto | 'random_selected': ordem aleatória dos produtos selecionados | 'topic': do tópico selecionado
  targetTopic?: string; // Nome do tópico quando mode === 'topic' (ou 'CURRENT' para o mesmo tópico)
  productIds?: string[]; // IDs dos produtos selecionados quando mode === 'fixed' ou 'random_selected'
}

export interface ProgressiveDiscountRule {
  minItems: number; // ex: 2
  discountPercent: number; // ex: 10
  label?: string; // ex: "Leve 2 peças e ganhe 10% OFF"
}

export type ShippingMethod = 'motoboy' | 'sedex' | 'pickup' | 'uber_flash';

export interface ShippingConfig {
  pickupEnabled: boolean;
  pickupLabel: string;
  pickupAddress: string;
  motoboyEnabled: boolean;
  motoboyPrice: number;
  motoboyEstimate: string;
  // Horário de corte para entrega no mesmo dia
  motoboySameDayCutoffEnabled?: boolean;
  motoboyCutoffTime?: string; // ex: '14:00'
  motoboyCutoffNotice?: string;
  // Retirada por Moto Uber / 99 Moto (Uber Flash / 99 Moto)
  uberFlashEnabled?: boolean;
  uberFlashLabel?: string; // ex: 'Retirada por Moto Uber / 99'
  uberFlashAddress?: string; // Endereço onde o motoboy do app deve coletar
  uberFlashNotice?: string; // Observação explícita de que o frete/corrida é pago pelo cliente
  sedexEnabled: boolean;
  sedexPrice: number;
  sedexEstimate: string;
  freeShippingAbove?: number; // Frete grátis acima de R$ X
}

export interface SchedulingConfig {
  enabled: boolean;
  bookingMode?: 'appointment' | 'queue'; // 'appointment': Horário marcado (com grade de horários) | 'queue': Ordem de chegada (NÃO mostra horários)
  allowMultipleBookings?: boolean; // Permite agendamentos múltiplos de serviços ou de pessoas
  allowDirectBooking?: boolean; // Permite escolher data e horário direto na vitrine
  slotDurationMinutes?: number; // Duração padrão em minutos (ex: 45 ou 60)
  openTime?: string; // Horário de abertura (ex: "09:00")
  closeTime?: string; // Horário de fechamento (ex: "18:00")
  hasBreak?: boolean; // Se possui pausa para almoço ou intervalo
  breakStartTime?: string; // Início do almoço/intervalo (ex: "12:00")
  breakEndTime?: string; // Fim do almoço/intervalo (ex: "13:00")
  slotIntervalMinutes?: number; // Intervalo em minutos entre horários gerados (ex: 15, 30, 45, 60)
  businessHours?: string; // Horário de atendimento (ex: "Seg a Sáb: 09:00 às 18:00")
  workingDays?: string[]; // Dias de atendimento (ex: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'])
  timeSlots?: string[]; // Grade de horários calculada ou personalizada (ex: ['09:00', '09:15', '09:30', ...])
  serviceNotice?: string; // Aviso prévio (ex: "Chegar com 10 minutos de antecedência")
}

export interface CatalogTheme {
  primaryColor: string; // Cor de destaque dos botões e acentos
  accentColor: string;
  backgroundColor: string; // Cor de fundo da página
  cardBackground: string; // Cor dos cards dos produtos
  textColor: string; // Cor dos textos principais
  mutedTextColor: string; // Cor de textos secundários
  buttonTextColor: string;
  fontFamily: string; // ID do modelo de tipografia ou fallback
  typographyPresetId?: string;
  layoutStyle: 'grid-2' | 'feed-1' | 'compact-list';
  badgeStyle: 'pill' | 'rounded' | 'flat';
  enableGlassmorphism?: boolean;
  heroCardBackground?: string; // Cor de fundo do card de boas-vindas do topo
  heroCardTextColor?: string; // Cor do texto do card do topo
  heroCardBorderColor?: string; // Cor da borda do card do topo
}

export function isColorDark(hexColor?: string): boolean {
  if (!hexColor) return false;
  const cleanHex = hexColor.replace('#', '').trim();
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return (r * 299 + g * 587 + b * 114) / 1000 < 140;
  }
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 < 140;
  }
  return false;
}

export type PixKeyType = 'cpf' | 'cnpj' | 'phone' | 'email' | 'random';

export interface StorePaymentConfig {
  pixEnabled: boolean; // Se o pagamento direto com chave PIX está ativado
  pixKeyType: PixKeyType; // 'cpf' | 'cnpj' | 'phone' | 'email' | 'random'
  pixKey: string; // Chave PIX cadastrada pelo lojista
  pixBeneficiaryName?: string; // Nome do titular / Razão Social
  pixBeneficiaryCity?: string; // Cidade do titular (opcional, padrão São Paulo)
  allowWhatsAppDirectCheckout?: boolean; // Opção de finalizar pedido direto pelo WhatsApp
  showPixScreenWithProof?: boolean; // Opção de mostrar chave PIX na tela e pedir envio de comprovante no WhatsApp
}

export interface CatalogConfig {
  storeName: string;
  slug: string; // ex: "minha-loja"
  bio: string;
  heroTagline?: string; // ex: "SEMIJOIAS & FOLHEADOS"
  heroTitle?: string; // ex: "As semijoias certas para você"
  heroHighlightWord?: string; // ex: "brilhar"
  heroSubtitle?: string; // ex: "Encontre o acessório que combina com você. Escolha suas peças e finalize pelo WhatsApp"
  headerStyle?: 'minimal-centered' | 'banner-cover';
  avatarUrl: string;
  bannerUrl: string;
  instagram: string; // ex: "@vitryne.oficial"
  whatsapp: string; // ex: "5511999998888"
  locationText: string; // ex: "São Paulo, SP • Envio para todo o Brasil"
  templateId: string;
  templateChosen?: boolean; // Se o cliente já selecionou explicitamente o tipo/template do catálogo
  isPublished?: boolean; // Se o catálogo foi explicitamente publicado/aprovado pelo lojista para divulgação pública
  businessType?: 'products' | 'services' | 'hybrid'; // Segmento operacional do catálogo
  actionButtonLabel?: string; // Rótulo da ação principal (ex: "Agendar Horário", "Pedir no WhatsApp", "Adicionar")
  scheduling?: SchedulingConfig; // Alias para configuração de agendamentos e serviços
  schedulingConfig?: SchedulingConfig; // Configuração para serviços e agendamentos
  theme: CatalogTheme;
  progressiveDiscounts: ProgressiveDiscountRule[];
  shipping: ShippingConfig;
  paymentConfig?: StorePaymentConfig; // Configurações de PIX e Checkout do Lojista
  globalScheduledDiscount?: GlobalScheduledDiscount;
  topics?: string[]; // Tópicos / Módulos de produtos (ex: ['Roupa Masculina', 'Vestidos', 'Alfaiataria'])
  topicIcons?: Record<string, string>; // Mapeamento de tópicos para ícones (ex: { 'Vestidos': 'sparkles', 'Roupas': 'shirt' })
  outOfStockBehavior?: 'badge-sold-out' | 'hide' | 'infinite'; // 'badge-sold-out': Selo Esgotado | 'hide': Sair da vitrine | 'infinite': Estoque Infinito
  wholesaleConfig?: WholesaleConfig; // Configuração da modalidade Atacado & Varejo
  pinBadgedProductsToTop?: boolean; // Se verdadeiro (padrão), produtos com badge/selo ficam fixados no topo da vitrine
  products: ProductItem[];
}

export interface GlobalScheduledDiscount {
  enabled: boolean;
  bannerTitle: string;
  discountPercent: number;
  endsAt: string; // ISO string
  applyTo?: 'all' | 'topic' | 'products'; // 'all': Todos os produtos | 'topic': Peças do tópico | 'products': Produtos selecionados
  targetTopic?: string; // Nome do tópico quando applyTo === 'topic'
  targetProductIds?: string[]; // IDs dos produtos selecionados quando applyTo === 'products'
}

export function isProductInScheduledDiscount(
  product: ProductItem,
  discount?: GlobalScheduledDiscount
): boolean {
  if (!discount || !discount.enabled) return false;
  if (discount.endsAt) {
    const diff = new Date(discount.endsAt).getTime() - Date.now();
    if (diff <= 0) return false;
  }
  const applyTo = discount.applyTo || 'all';
  if (applyTo === 'all') return true;
  if (applyTo === 'topic') {
    const target = (discount.targetTopic || '').trim().toUpperCase();
    const prodCat = (product.category || 'GERAL').trim().toUpperCase();
    return Boolean(target && target === prodCat);
  }
  if (applyTo === 'products') {
    return Boolean(discount.targetProductIds && discount.targetProductIds.includes(product.id));
  }
  return false;
}

export interface CatalogTemplate {
  id: string;
  name: string;
  categoryName: string;
  tagline: string;
  description: string;
  thumbnail: string;
  segment?: 'products' | 'services'; // Segmento para filtro: 'products' ou 'services'
  config: CatalogConfig;
}
