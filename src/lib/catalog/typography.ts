export interface TypographyPreset {
  id: string;
  name: string;
  segment: string;
  tagline: string;
  titleFont: string;
  bodyFont: string;
  sampleText: string;
  letterSpacing: string;
  titleTransform: 'uppercase' | 'none' | 'capitalize';
  description: string;
}

export const TYPOGRAPHY_PRESETS: TypographyPreset[] = [
  // 1. Semi Joias & Luxo (Cormorant Garamond)
  {
    id: 'semijoias-cormorant',
    name: 'Cormorant Luxury',
    segment: 'Semi Joias & Alta Joalheria',
    tagline: 'Serifas delgadas, românticas e refinamento parisiense',
    titleFont: '"Cormorant Garamond", Georgia, serif',
    bodyFont: 'Inter, sans-serif',
    sampleText: 'As semijoias certas para você brilhar',
    letterSpacing: '0.02em',
    titleTransform: 'none',
    description: 'A escolha definitiva para semi joias, folheados de luxo e peças banhadas a ouro. Transmite delicadeza e altíssimo valor.',
  },

  // 2. Boutique Editorial (Playfair Display)
  {
    id: 'boutique-playfair',
    name: 'Playfair Editorial',
    segment: 'Boutique & Alfaiataria Fina',
    tagline: 'Alto contraste clássico no estilo Vogue e alta costura',
    titleFont: '"Playfair Display", Georgia, serif',
    bodyFont: 'Inter, sans-serif',
    sampleText: 'A elegância certa para o seu estilo',
    letterSpacing: 'normal',
    titleTransform: 'none',
    description: 'Imponente e glamourosa, perfeita para lojas de roupas elegantes, alfaiataria em linho e vestidos de festa.',
  },

  // 3. Clean Scandinavian (Outfit)
  {
    id: 'clean-outfit',
    name: 'Outfit Minimalist',
    segment: 'Moda Minimalista & Contemporânea',
    tagline: 'Geometria limpa, arejada e estética estilo Zara/COS',
    titleFont: 'Outfit, sans-serif',
    bodyFont: 'Inter, sans-serif',
    sampleText: 'Design puro e atemporal para você',
    letterSpacing: '-0.02em',
    titleTransform: 'none',
    description: 'Moderna e minimalista, ótima para marcas com conceito clean, monocromático e produtos de alta qualidade.',
  },

  // 4. Trendy Y2K (Syne)
  {
    id: 'trendy-syne',
    name: 'Syne Fashion Wave',
    segment: 'Roupas Modinhas & TikTok Trends',
    tagline: 'Curvas arrojadas, estética fashion week e energia jovem',
    titleFont: 'Syne, sans-serif',
    bodyFont: 'Inter, sans-serif',
    sampleText: 'Os looks mais desejados para você arrasar',
    letterSpacing: '-0.03em',
    titleTransform: 'none',
    description: 'Super chamativa e contemporânea, perfeita para lojas de roupas modinhas, croppeds e tendências virais das redes sociais.',
  },

  // 5. Activewear & Fitness (Oswald)
  {
    id: 'fitness-oswald',
    name: 'Oswald High Performance',
    segment: 'Roupas de Academia & Moda Fitness',
    tagline: 'Condensada, atlética, impactante e cheia de atitude',
    titleFont: 'Oswald, sans-serif',
    bodyFont: 'Inter, sans-serif',
    sampleText: 'A PERFORMANCE E O SUPORTE PARA SE SUPERAR',
    letterSpacing: '0.04em',
    titleTransform: 'uppercase',
    description: 'Transmite força, energia e movimento. Ideal para activewear, moda esportiva e roupas de compressão.',
  },

  // 6. Streetwear & Raw (Space Grotesk)
  {
    id: 'street-space',
    name: 'Space Grotesk Urban',
    segment: 'Streetwear, Skate & Heavy Drops',
    tagline: 'Técnica brutalista, estética industrial e cultural',
    titleFont: '"Space Grotesk", monospace, sans-serif',
    bodyFont: '"JetBrains Mono", monospace',
    sampleText: 'O AUTÊNTICO STREETWEAR OVERSIZED',
    letterSpacing: '0.01em',
    titleTransform: 'uppercase',
    description: 'Inspirada na cultura urbana e estética cyberpunk, ideal para moletons pesados, camisetas boxy e drops exclusivos.',
  },

  // 7. Moda Praia & Resort (Cinzel)
  {
    id: 'praia-cinzel',
    name: 'Cinzel Roman Resort',
    segment: 'Moda Praia & Beachwear de Luxo',
    tagline: 'Inspiração clássica romana lapidar, solar e aristocrática',
    titleFont: 'Cinzel, serif',
    bodyFont: 'Inter, sans-serif',
    sampleText: 'A MODELAGEM PERFEITA PARA O SEU VERÃO',
    letterSpacing: '0.12em',
    titleTransform: 'uppercase',
    description: 'Imprime uma sensação de balneário europeu chique, resort e sofisticação à beira-mar.',
  },

  // 8. Clean Beauty (DM Serif Display)
  {
    id: 'beauty-dmserif',
    name: 'DM Serif Organic',
    segment: 'Cosméticos, Skincare & Bem-Estar',
    tagline: 'Curvas botânicas acolhedoras, suaves e naturais',
    titleFont: '"DM Serif Display", Georgia, serif',
    bodyFont: 'Inter, sans-serif',
    sampleText: 'O cuidado certo para a sua pele radiar',
    letterSpacing: 'normal',
    titleTransform: 'none',
    description: 'Transmite carinho, pureza e eficácia dermatológica. Ideal para produtos de beleza, estética e óleos naturais.',
  },

  // 9. Sensual Noir (Prata)
  {
    id: 'sensual-prata',
    name: 'Prata Velvet Noir',
    segment: 'Lingerie Fina & Homewear Sensual',
    tagline: 'Linhas sensuais, acabamentos em gota e clima intimista',
    titleFont: 'Prata, Georgia, serif',
    bodyFont: 'Inter, sans-serif',
    sampleText: 'A lingerie perfeita para você se apaixonar',
    letterSpacing: '0.02em',
    titleTransform: 'none',
    description: 'Rica em detalhes delicados e curvas sensuais, ideal para lingeries rendadas, bodies de seda e peças íntimas.',
  },

  // 10. Hype Contemporary (Epilogue)
  {
    id: 'hype-epilogue',
    name: 'Epilogue Hypewear',
    segment: 'Calçados, Sneakers & Acessórios',
    tagline: 'Moderna, encorpada e com excelente legibilidade comercial',
    titleFont: 'Epilogue, sans-serif',
    bodyFont: 'Inter, sans-serif',
    sampleText: 'Os pares mais cobiçados para o seu dia',
    letterSpacing: '-0.02em',
    titleTransform: 'none',
    description: 'Visual moderno de galeria e boutique urbana, ideal para calçados de couro, sneakers e bolsas estruturadas.',
  },
];

export function getTypographyPreset(
  idOrPreset?: string,
  fallbackFontFamily?: string
): TypographyPreset {
  const target = idOrPreset || fallbackFontFamily;
  if (!target) return TYPOGRAPHY_PRESETS[0];

  // 1. Direct ID match
  const foundById = TYPOGRAPHY_PRESETS.find(
    (p) => p.id.toLowerCase() === target.toLowerCase()
  );
  if (foundById) return foundById;

  // 2. Fallback ID match
  if (fallbackFontFamily) {
    const foundByFallback = TYPOGRAPHY_PRESETS.find(
      (p) => p.id.toLowerCase() === fallbackFontFamily.toLowerCase()
    );
    if (foundByFallback) return foundByFallback;
  }

  // 3. Name or Keyword match
  const lower = target.toLowerCase();
  const foundByName = TYPOGRAPHY_PRESETS.find((p) =>
    p.name.toLowerCase().includes(lower)
  );
  if (foundByName) return foundByName;

  if (lower.includes('cormorant')) return TYPOGRAPHY_PRESETS[0];
  if (lower.includes('playfair')) return TYPOGRAPHY_PRESETS[1];
  if (lower.includes('outfit')) return TYPOGRAPHY_PRESETS[2];
  if (lower.includes('syne')) return TYPOGRAPHY_PRESETS[3];
  if (lower.includes('oswald')) return TYPOGRAPHY_PRESETS[4];
  if (lower.includes('space') || lower.includes('grotesk')) return TYPOGRAPHY_PRESETS[5];
  if (lower.includes('cinzel')) return TYPOGRAPHY_PRESETS[6];
  if (lower.includes('dm serif') || lower.includes('dmserif')) return TYPOGRAPHY_PRESETS[7];
  if (lower.includes('prata')) return TYPOGRAPHY_PRESETS[8];
  if (lower.includes('epilogue')) return TYPOGRAPHY_PRESETS[9];

  // 4. Old legacy keywords
  if (lower === 'serif') return TYPOGRAPHY_PRESETS[1]; // Playfair
  if (lower === 'mono') return TYPOGRAPHY_PRESETS[5]; // Space Grotesk
  if (lower === 'sans') return TYPOGRAPHY_PRESETS[2]; // Outfit

  return TYPOGRAPHY_PRESETS[0];
}
