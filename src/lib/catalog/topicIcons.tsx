import React from 'react';
import {
  Shirt,
  Sparkles,
  Scissors,
  ShoppingBag,
  Footprints,
  Gem,
  Glasses,
  HeartPulse,
  Activity,
  Flower2,
  Home,
  Smartphone,
  Headphones,
  UtensilsCrossed,
  Coffee,
  Baby,
  Flame,
  Tag,
  LayoutGrid,
  Crown,
  Watch,
  Package,
  Layers,
  Smile,
  ShieldCheck,
  Truck,
  Star,
  Sun,
  Snowflake,
  Umbrella,
  Heart,
  Palette,
  Car,
  Wrench,
  Clock,
  Calendar,
  Armchair,
  Cake,
  Sofa,
} from 'lucide-react';

export type IconComponentType = React.ComponentType<{
  className?: string;
  size?: string | number;
  strokeWidth?: string | number;
  [key: string]: any;
}>;

export interface TopicIconOption {
  id: string;
  label: string;
  icon: IconComponentType;
}

export interface CustomIconProps extends React.SVGProps<SVGSVGElement> {
  size?: string | number;
  strokeWidth?: string | number;
}

function createSvgIcon(
  paths: string[],
  extra?: React.ReactNode | React.ReactNode[]
): React.FC<CustomIconProps> {
  return ({ size = 24, strokeWidth = 2, className, ...props }) =>
    React.createElement(
      'svg',
      {
        xmlns: 'http://www.w3.org/2000/svg',
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        className,
        ...props,
      },
      ...paths.map((d, i) => React.createElement('path', { key: `p-${i}`, d })),
      ...(Array.isArray(extra) ? extra : extra ? [extra] : [])
    );
}

// -------------------------------------------------------------
// 1. Ícones Especializados de Moda, Vestuário e Categorias
// -------------------------------------------------------------

/** Shorts & Bermudas */
export const IconShorts = createSvgIcon([
  'M4 6h16l1 12h-6.5l-2.5-5.5-2.5 5.5H3L4 6z',
  'M4 9h16',
  'M12 6v3',
]);

/** Camisetas Básicas / T-Shirts */
export const IconTShirt = createSvgIcon([
  'M6 4h12l3.5 5.5-3 2.5-1.5-1.5V20H7V10.5L5.5 12l-3-2.5L6 4z',
  'M9 4a3 3 0 0 0 6 0',
]);

/** Regatas & Tops */
export const IconTankTop = createSvgIcon([
  'M7 4h3a2 2 0 0 0 4 0h3l1 6v10H6V10L7 4z',
  'M6 10c2-1 3-3 3-6',
  'M18 10c-2-1-3-3-3-6',
]);

/** Bonés & Viseiras */
export const IconCap = createSvgIcon(
  [
    'M5 15a7 7 0 0 1 14 0H5z',
    'M17 15h4.5a1.5 1.5 0 0 1 1.5 1.5c0 .8-.7 1.5-1.5 1.5H8',
    'M12 9v6',
  ],
  React.createElement('circle', { key: 'btn', cx: '12', cy: '8', r: '1', fill: 'currentColor' })
);

/** Gorros, Toucas & Boinas */
export const IconBeanie = createSvgIcon(
  [
    'M6 15c0-5.5 2.5-9.5 6-9.5s6 4 6 9.5',
    'M8 15v5',
    'M12 15v5',
    'M16 15v5',
  ],
  [
    React.createElement('circle', { key: 'pom', cx: '12', cy: '4', r: '1.5' }),
    React.createElement('rect', { key: 'cuff', x: '4', y: '15', width: '16', height: '5', rx: '1.5' }),
  ]
);

/** Casacos, Jaquetas, Moletons & Blazers */
export const IconCoat = createSvgIcon([
  'M4 6L2 16l4 1 1-11',
  'M20 6l2 16-4 1-1-11',
  'M7 6h10v14a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V6z',
  'M12 6v15',
  'M7 6l5 4 5-4',
  'M9 15h2',
  'M13 15h2',
]);

/** Vestidos & Longos */
export const IconDress = createSvgIcon([
  'M9 4l-1 6 2 2-5 9h14l-5-9 2-2-1-6h-2l-2 2.5-2-2.5H9z',
  'M10 12h4',
]);

/** Chinelos, Sandálias & Rasteirinhas */
export const IconFlipFlops = createSvgIcon(
  [
    'M6.5 9L4 13',
    'M6.5 9L9 13',
    'M17.5 9L15 13',
    'M17.5 9L20 13',
  ],
  [
    React.createElement('rect', { key: 'fl', x: '3', y: '5', width: '7', height: '15', rx: '3.5' }),
    React.createElement('circle', { key: 'fl-c', cx: '6.5', cy: '9', r: '0.75', fill: 'currentColor' }),
    React.createElement('rect', { key: 'fr', x: '14', y: '5', width: '7', height: '15', rx: '3.5' }),
    React.createElement('circle', { key: 'fr-c', cx: '17.5', cy: '9', r: '0.75', fill: 'currentColor' }),
  ]
);

/** Sutiãs & Tops Íntimos */
export const IconBra = createSvgIcon([
  'M6 5v6',
  'M18 5v6',
  'M2.5 15a4 4 0 0 0 8 0c0-2.5-2-4-4-4s-4 1.5-4 4z',
  'M13.5 15a4 4 0 0 0 8 0c0-2.5-2-4-4-4s-4 1.5-4 4z',
  'M10.5 15h3',
]);

/** Calcinhas & Lingerie */
export const IconPanties = createSvgIcon(
  [
    'M4 8h16',
    'M4 8l1.5 4.5c2 4 4.5 5.5 6.5 5.5s4.5-1.5 6.5-5.5L20 8',
    'M10 18h4',
  ],
  React.createElement('circle', { key: 'bow', cx: '12', cy: '8', r: '0.75', fill: 'currentColor' })
);

/** Cuecas & Moda Íntima Masculina */
export const IconBoxers = createSvgIcon([
  'M4 7h16l-.8 10-4-.5-3.2 2-3.2-2-4 .5L4 7z',
  'M4 10h16',
  'M12 10v4.5',
  'M9.5 14.5h5',
]);

/** Biquínis & Moda Praia */
export const IconBikini = createSvgIcon([
  'M4 9l3-5 3 5H4z',
  'M14 9l3-5 3 5h-6z',
  'M10 9h4',
  'M6 14h12l-1.5 3c-1.5 2-3 3-4.5 3s-3-1-4.5-3L6 14z',
  'M6 14l-2 1.5',
  'M18 14l2 1.5',
]);

/** Calças & Jeans */
export const IconPants = createSvgIcon([
  'M5 4h14l1 17h-5.5L12 11l-2.5 10H4L5 4z',
  'M5 7h14',
  'M12 4v3.5',
  'M6 9l2 2',
  'M18 9l-2 2',
]);

/** Saias & Midis */
export const IconSkirt = createSvgIcon([
  'M8 5h8l3.5 14H4.5L8 5z',
  'M8 8h8',
  'M10.5 8l-1 11',
  'M13.5 8l1 11',
]);

/** Meias & Soquetes */
export const IconSocks = createSvgIcon([
  'M6 3h5v8l3.5 3.5a2.5 2.5 0 0 1-3.5 3.5l-5-5V3z',
  'M6 6h5',
  'M13 5h5v7l3.5 3.5a2.5 2.5 0 0 1-3.5 3.5l-5-5V5z',
  'M13 8h5',
]);

/** Smartwatches / Relógios Inteligentes */
export const IconSmartwatch = createSvgIcon(
  [
    'M9 4V2h6v2',
    'M9 20v2h6v-2',
    'M18 10h1',
    'M10 12h4',
  ],
  React.createElement('rect', { key: 'screen', x: '6', y: '4', width: '12', height: '16', rx: '4' })
);

/** Pulseiras, Berloques & Riviera */
export const IconBracelet = createSvgIcon(
  [
    'M12 15.5v3',
  ],
  [
    React.createElement('ellipse', { key: 'band', cx: '12', cy: '10', rx: '8', ry: '5.5' }),
    React.createElement('circle', { key: 'charm', cx: '12', cy: '20.5', r: '2' }),
    React.createElement('circle', { key: 'b1', cx: '4', cy: '10', r: '1', fill: 'currentColor' }),
    React.createElement('circle', { key: 'b2', cx: '20', cy: '10', r: '1', fill: 'currentColor' }),
    React.createElement('circle', { key: 'b3', cx: '12', cy: '4.5', r: '1', fill: 'currentColor' }),
    React.createElement('circle', { key: 'b4', cx: '6.5', cy: '13.8', r: '1', fill: 'currentColor' }),
    React.createElement('circle', { key: 'b5', cx: '17.5', cy: '13.8', r: '1', fill: 'currentColor' }),
  ]
);

/** Braceletes, Bracelete Rígido & Cuffs */
export const IconBangle = createSvgIcon(
  [
    'M6.5 16a8 7 0 1 1 11 0',
  ],
  [
    React.createElement('circle', { key: 'end1', cx: '6.5', cy: '16.5', r: '2', fill: 'currentColor' }),
    React.createElement('circle', { key: 'end2', cx: '17.5', cy: '16.5', r: '2', fill: 'currentColor' }),
  ]
);

// -------------------------------------------------------------
// 2. Mapeamento Geral de IDs para Componentes
// -------------------------------------------------------------

export const TOPIC_ICON_MAP: Record<string, IconComponentType> = {
  // Modelos e Categorias Especializadas de Roupas
  'shorts': IconShorts,
  't-shirt': IconTShirt,
  'tank-top': IconTankTop,
  'cap': IconCap,
  'beanie': IconBeanie,
  'coat': IconCoat,
  'dress': IconDress,
  'flip-flops': IconFlipFlops,
  'bra': IconBra,
  'panties': IconPanties,
  'boxers': IconBoxers,
  'bikini': IconBikini,
  'pants': IconPants,
  'skirt': IconSkirt,
  'socks': IconSocks,
  'smartwatch': IconSmartwatch,
  'bracelet': IconBracelet,
  'bangle': IconBangle,

  // Ícones Lucide
  'shirt': Shirt,
  'sparkles': Sparkles,
  'scissors': Scissors,
  'shopping-bag': ShoppingBag,
  'footprints': Footprints,
  'gem': Gem,
  'glasses': Glasses,
  'heart-pulse': HeartPulse,
  'activity': Activity,
  'flower2': Flower2,
  'home': Home,
  'smartphone': Smartphone,
  'headphones': Headphones,
  'utensils': UtensilsCrossed,
  'coffee': Coffee,
  'baby': Baby,
  'flame': Flame,
  'tag': Tag,
  'layout-grid': LayoutGrid,
  'crown': Crown,
  'watch': Watch,
  'package': Package,
  'layers': Layers,
  'smile': Smile,
  'heart': Heart,
  'sun': Sun,
  'snowflake': Snowflake,
  'umbrella': Umbrella,
  'palette': Palette,
  'car': Car,
  'wrench': Wrench,
  'clock': Clock,
  'calendar': Calendar,
  'armchair': Armchair,
  'cake': Cake,
  'sofa': Sofa,
};

// -------------------------------------------------------------
// 3. Lista para o Seletor Visual de Ícones no Painel
// -------------------------------------------------------------

export const AVAILABLE_TOPIC_ICONS: TopicIconOption[] = [
  // 1. Roupas e Vestuário
  { id: 'shorts', label: 'Shorts & Bermudas', icon: IconShorts },
  { id: 't-shirt', label: 'Camisetas & T-Shirts', icon: IconTShirt },
  { id: 'shirt', label: 'Camisas & Blusas', icon: Shirt },
  { id: 'tank-top', label: 'Regatas & Tops', icon: IconTankTop },
  { id: 'dress', label: 'Vestidos & Longos', icon: IconDress },
  { id: 'coat', label: 'Casacos & Jaquetas', icon: IconCoat },
  { id: 'pants', label: 'Calças & Jeans', icon: IconPants },
  { id: 'skirt', label: 'Saias & Midis', icon: IconSkirt },

  // 2. Moda Íntima & Lingerie
  { id: 'bra', label: 'Sutiãs & Tops Íntimos', icon: IconBra },
  { id: 'panties', label: 'Calcinhas & Lingerie', icon: IconPanties },
  { id: 'boxers', label: 'Cuecas & Moda Íntima', icon: IconBoxers },
  { id: 'bikini', label: 'Biquínis & Praia', icon: IconBikini },
  { id: 'socks', label: 'Meias & Underwear', icon: IconSocks },

  // 3. Calçados & Acessórios de Cabeça
  { id: 'flip-flops', label: 'Chinelos & Sandálias', icon: IconFlipFlops },
  { id: 'footprints', label: 'Calçados & Tênis', icon: Footprints },
  { id: 'cap', label: 'Bonés & Chapéus', icon: IconCap },
  { id: 'beanie', label: 'Gorros & Toucas', icon: IconBeanie },

  // 4. Acessórios, Joias & Bolsas
  { id: 'bracelet', label: 'Pulseiras & Berloques', icon: IconBracelet },
  { id: 'bangle', label: 'Braceletes & Rígidas', icon: IconBangle },
  { id: 'gem', label: 'Joias & Pedrarias', icon: Gem },
  { id: 'glasses', label: 'Óculos & Armações', icon: Glasses },
  { id: 'shopping-bag', label: 'Bolsas & Couro', icon: ShoppingBag },
  { id: 'scissors', label: 'Alfaiataria, Salão & Tesoura', icon: Scissors },

  // 5. Relógios & Smart Tech
  { id: 'watch', label: 'Relógios Tradicionais', icon: Watch },
  { id: 'smartwatch', label: 'Smartwatches', icon: IconSmartwatch },
  { id: 'smartphone', label: 'Telefones & Celulares', icon: Smartphone },
  { id: 'headphones', label: 'Fones de Ouvido & Áudio', icon: Headphones },

  // 6. Serviços, Agendamentos & Gastronomia
  { id: 'car', label: 'Estética Automotiva & Carros', icon: Car },
  { id: 'armchair', label: 'Higienização de Estofados & Sofás', icon: Armchair },
  { id: 'cake', label: 'Bolos, Doces & Confeitaria', icon: Cake },
  { id: 'calendar', label: 'Agendamentos & Horários', icon: Calendar },
  { id: 'clock', label: 'Tempo & Duração de Serviço', icon: Clock },
  { id: 'wrench', label: 'Serviços & Detailing', icon: Wrench },

  // 7. Categorias Especiais e Destaques
  { id: 'crown', label: 'Luxo & Noivas', icon: Crown },
  { id: 'sparkles', label: 'Destaques, Unhas & Make', icon: Sparkles },
  { id: 'palette', label: 'Cores & Nail Art', icon: Palette },
  { id: 'flame', label: 'Ofertas & Queima', icon: Flame },
  { id: 'heart', label: 'Favoritos & Amor', icon: Heart },
  { id: 'baby', label: 'Moda Infantil & Kids', icon: Baby },
  { id: 'flower2', label: 'Beleza & Cosméticos', icon: Flower2 },
  { id: 'activity', label: 'Fitness & Academia', icon: Activity },
  { id: 'sun', label: 'Verão & Resort', icon: Sun },
  { id: 'snowflake', label: 'Inverno & Tricô', icon: Snowflake },
  { id: 'umbrella', label: 'Outono & Chuva', icon: Umbrella },
  { id: 'layers', label: 'Básicos & Segunda Pele', icon: Layers },
  { id: 'package', label: 'Atacado & Kits', icon: Package },
  { id: 'home', label: 'Casa & Decoração', icon: Home },
  { id: 'coffee', label: 'Café & Bebidas', icon: Coffee },
  { id: 'utensils', label: 'Alimentos & Gastronomia', icon: UtensilsCrossed },
  { id: 'tag', label: 'Etiqueta Geral', icon: Tag },
];

// -------------------------------------------------------------
// 4. Sugestor Inteligente de Ícones por Palavra-Chave
// -------------------------------------------------------------

export function suggestIconForTopic(topicName: string): string {
  const norm = topicName.toLowerCase().trim();

  if (norm.includes('todas') || norm.includes('todos') || norm === 'all') return 'layout-grid';

  // Serviços: Estética Automotiva / Lava Rápido
  if (
    norm.includes('carro') ||
    norm.includes('automóvel') ||
    norm.includes('automovel') ||
    norm.includes('veículo') ||
    norm.includes('veiculo') ||
    norm.includes('lavagem') ||
    norm.includes('polimento') ||
    norm.includes('vitrificação') ||
    norm.includes('vitrificacao') ||
    norm.includes('cristalização') ||
    norm.includes('cristalizacao') ||
    norm.includes('detalhamento') ||
    norm.includes('detalhada') ||
    norm.includes('estética automotiva') ||
    norm.includes('estetica automotiva') ||
    norm.includes('lava-rápido') ||
    norm.includes('lava rapido') ||
    norm.includes('lava jato')
  ) {
    return 'car';
  }

  // Serviços: Higienização de Estofados & Sofás
  if (
    norm.includes('estofado') ||
    norm.includes('estofados') ||
    norm.includes('sofá') ||
    norm.includes('sofa') ||
    norm.includes('colchão') ||
    norm.includes('colchao') ||
    norm.includes('poltrona') ||
    norm.includes('cadeira') ||
    norm.includes('tapete') ||
    norm.includes('carpete') ||
    norm.includes('impermeabilização') ||
    norm.includes('impermeabilizacao') ||
    norm.includes('higienização') ||
    norm.includes('higienizacao')
  ) {
    return 'armchair';
  }

  // Alimentos: Gastronomia, Bolos, Doces & Sobremesas
  if (
    norm.includes('bolo') ||
    norm.includes('doce') ||
    norm.includes('confeitaria') ||
    norm.includes('torta') ||
    norm.includes('brigadeiro') ||
    norm.includes('sobremesa') ||
    norm.includes('salgado') ||
    norm.includes('gastronomia') ||
    norm.includes('artesanal') ||
    norm.includes('festa') && (norm.includes('combo') || norm.includes('doce'))
  ) {
    return 'cake';
  }

  // Serviços: Cabelo, Hair Studio & Barbearia
  if (
    norm.includes('cabelo') ||
    norm.includes('corte') ||
    norm.includes('mecha') ||
    norm.includes('morena iluminada') ||
    norm.includes('visagismo') ||
    norm.includes('escova') ||
    norm.includes('penteado') ||
    norm.includes('cronograma') ||
    norm.includes('botox') ||
    norm.includes('alisamento') ||
    norm.includes('barba') ||
    norm.includes('barbeiro') ||
    norm.includes('barbearia') ||
    norm.includes('navalha') ||
    norm.includes('toalha quente') ||
    norm.includes('degradê') ||
    norm.includes('degrade')
  ) {
    return 'scissors';
  }

  // Serviços: Unhas & Nail Designer
  if (
    norm.includes('unha') ||
    norm.includes('nail') ||
    norm.includes('manicure') ||
    norm.includes('pedicure') ||
    norm.includes('alongamento') ||
    norm.includes('gel') ||
    norm.includes('fibra de vidro') ||
    norm.includes('blindagem') ||
    norm.includes('esmaltação') ||
    norm.includes('esmaltacao')
  ) {
    return 'sparkles';
  }

  // Serviços: Maquiagem & Studio de Noivas
  if (
    norm.includes('maquiagem') ||
    norm.includes('make') ||
    norm.includes('noiva') ||
    norm.includes('madrinha') ||
    norm.includes('formanda') ||
    norm.includes('pré-wedding') ||
    norm.includes('pre-wedding') ||
    norm.includes('cílios') ||
    norm.includes('cilios') ||
    norm.includes('sobrancelha')
  ) {
    return 'sparkles';
  }

  // Aluguel de Roupas & Trajes de Festa
  if (
    norm.includes('aluguel') ||
    norm.includes('locação') ||
    norm.includes('locacao') ||
    norm.includes('traje') ||
    norm.includes('smoking') ||
    norm.includes('terno') ||
    norm.includes('debutante')
  ) {
    return 'dress';
  }

  // Agendamento & Horários
  if (norm.includes('agendamento') || norm.includes('horário') || norm.includes('horario') || norm.includes('sessão') || norm.includes('sessao')) {
    return 'calendar';
  }

  // 1. Shorts e Bermudas
  if (norm.includes('short') || norm.includes('bermuda')) return 'shorts';

  // 2. Camisetas e T-Shirts
  if (norm.includes('camiseta') || norm.includes('t-shirt') || norm.includes('tshirt') || norm.includes('camiset')) return 't-shirt';

  // 3. Regatas e Tops
  if (norm.includes('regata') || norm.includes('tank') || norm.includes('cropped') || norm.includes('top fit')) return 'tank-top';

  // 4. Bonés e Viseiras
  if (norm.includes('boné') || norm.includes('bone') || norm.includes('chapéu') || norm.includes('chapeu') || norm.includes('viseira')) return 'cap';

  // 5. Gorros, Toucas e Boinas
  if (norm.includes('gorro') || norm.includes('touca') || norm.includes('boina')) return 'beanie';

  // 6. Casacos, Jaquetas e Moletons
  if (norm.includes('casaco') || norm.includes('jaqueta') || norm.includes('moletom') || norm.includes('blazer') || norm.includes('cardigan') || norm.includes('sobretudo') || norm.includes('parka') || norm.includes('corta vento')) return 'coat';

  // 7. Vestidos e Longos
  if (norm.includes('vestido') || norm.includes('festa') || norm.includes('longo') || norm.includes('macaquinho') || norm.includes('macacão')) return 'dress';

  // 8. Chinelos, Sandálias e Rasteiras
  if (norm.includes('chinelo') || norm.includes('sandália') || norm.includes('sandalia') || norm.includes('rasteira') || norm.includes('rasteirinha') || norm.includes('havaiana') || norm.includes('slide') || norm.includes('tamanco')) return 'flip-flops';

  // 9. Sutiãs e Tops Íntimos
  if (norm.includes('sutiã') || norm.includes('sutia') || norm.includes('sutiãs') || norm.includes('bojo') || norm.includes('strappy')) return 'bra';

  // 10. Calcinhas, Peças Íntimas e Lingerie Feminina
  if (norm.includes('calcinha') || norm.includes('lingerie') || norm.includes('peça íntima') || norm.includes('peças íntimas') || norm.includes('pecas intimas') || norm.includes('tanga') || norm.includes('fio dental')) return 'panties';

  // 11. Cuecas e Boxers
  if (norm.includes('cueca') || norm.includes('boxer') || norm.includes('samba canção') || norm.includes('samba cancao') || norm.includes('slip')) return 'boxers';

  // 12. Biquínis e Moda Praia
  if (norm.includes('biquíni') || norm.includes('biquini') || norm.includes('maiô') || norm.includes('maio') || norm.includes('praia') || norm.includes('beachwear') || norm.includes('sunga')) return 'bikini';

  // 13. Calças e Jeans
  if (norm.includes('calça') || norm.includes('calca') || norm.includes('jeans') || norm.includes('pantalona') || norm.includes('legging') || norm.includes('jogger')) return 'pants';

  // 14. Saias
  if (norm.includes('saia') || norm.includes('mini saia') || norm.includes('midi')) return 'skirt';

  // 15. Meias
  if (norm.includes('meia') || norm.includes('soquete')) return 'socks';

  // 16. Calçados em Geral, Sapatos e Tênis
  if (norm.includes('calçado') || norm.includes('calcado') || norm.includes('sapato') || norm.includes('tênis') || norm.includes('tenis') || norm.includes('salto') || norm.includes('sneaker') || norm.includes('bota') || norm.includes('coturno')) return 'footprints';

  // 17. Camisas Sociais e Blusas
  if (norm.includes('camisa') || norm.includes('social') || norm.includes('blusa') || norm.includes('linho') || norm.includes('polo')) return 'shirt';

  // 18. Alfaiataria e Costura
  if (norm.includes('alfaiataria') || norm.includes('costura')) return 'scissors';

  // 19. Bolsas, Mochilas e Couro
  if (norm.includes('bolsa') || norm.includes('mochila') || norm.includes('carteira') || norm.includes('couro') || norm.includes('necessaire') || norm.includes('mala')) return 'shopping-bag';

  // 20. Pulseiras, Berloques & Riviera
  if (norm.includes('pulseira') || norm.includes('berloque') || norm.includes('riviera') || norm.includes('corrente de pulso')) return 'bracelet';

  // 21. Braceletes & Rígidas
  if (norm.includes('bracelete') || norm.includes('bangle') || norm.includes('cuff')) return 'bangle';

  // 22. Joias em Geral, Brincos, Anéis e Colares
  if (norm.includes('joia') || norm.includes('semijoia') || norm.includes('folheado') || norm.includes('anel') || norm.includes('brinco') || norm.includes('colar') || norm.includes('ouro') || norm.includes('prata') || norm.includes('aliança') || norm.includes('choker') || norm.includes('diamante') || norm.includes('pedra')) return 'gem';

  // 23. Óculos
  if (norm.includes('óculos') || norm.includes('oculos') || norm.includes('lente') || norm.includes('armação') || norm.includes('armacao')) return 'glasses';

  // 24. Smartwatches & Conectados
  if (norm.includes('smartwatch') || norm.includes('smart watch') || norm.includes('smart-watch') || norm.includes('sartchawat') || norm.includes('sartchwat') || norm.includes('smartw')) return 'smartwatch';

  // 23. Relógios Tradicionais
  if (norm.includes('relógio') || norm.includes('relogio') || norm.includes('cronógrafo') || norm.includes('cronografo')) return 'watch';

  // 24. Fones de Ouvido e Áudio
  if (norm.includes('fone') || norm.includes('headphone') || norm.includes('airpod') || norm.includes('earbud') || norm.includes('áudio') || norm.includes('audio') || norm.includes('som')) return 'headphones';

  // 25. Telefones e Celulares
  if (norm.includes('telefone') || norm.includes('celular') || norm.includes('smartphone') || norm.includes('iphone') || norm.includes('xiaomi') || norm.includes('samsung') || norm.includes('tecnologia')) return 'smartphone';

  // 31. Novidades e Promoções
  if (norm.includes('novidade') || norm.includes('lançamento') || norm.includes('oferta') || norm.includes('fogo') || norm.includes('queima') || norm.includes('promoção') || norm.includes('liquid')) return 'flame';
  if (norm.includes('destaque') || norm.includes('festa') || norm.includes('brilho')) return 'sparkles';
  if (norm.includes('luxo') || norm.includes('premium') || norm.includes('vip') || norm.includes('gold') || norm.includes('exclusiv')) return 'crown';
  if (norm.includes('íntim') || norm.includes('intim') || norm.includes('amor') || norm.includes('sensual')) return 'heart';

  // 32. Genéricos de Moda
  if (norm.includes('roupa') || norm.includes('moda') || norm.includes('feminino') || norm.includes('masculino')) return 'shirt';

  return 'tag';
}

/**
 * Resolve o componente de ícone apropriado para um tópico
 */
export function resolveTopicIcon(topicName: string, explicitIconId?: string): IconComponentType {
  if (explicitIconId && TOPIC_ICON_MAP[explicitIconId]) {
    return TOPIC_ICON_MAP[explicitIconId];
  }
  const autoId = suggestIconForTopic(topicName);
  return TOPIC_ICON_MAP[autoId] || Tag;
}
