import type { ConversationContextEntity } from '../catalog/intelligent-types';

export type CustomerPrimaryIntent =
  | 'greeting'
  | 'price_inquiry'
  | 'size_inquiry'
  | 'purchase_intent'
  | 'product_inquiry'
  | 'catalog_inquiry'
  | 'service_inquiry'
  | 'shipping_inquiry'
  | 'story_interaction'
  | 'closing'
  | 'off_topic';

export type CustomerConversationStage =
  | 'initial_contact'     // Turno 1 (ex: "Oi", "Boa noite")
  | 'needs_discovery'    // Cliente quer algo genérico ("estou procurando uma roupa")
  | 'preference_shared'  // Cliente já informou o que quer ("quero um vestido pra festa", "tem blusa?")
  | 'negotiating'        // Perguntando preço/tamanho de uma peça
  | 'closing_sale';      // Pronto para comprar / receber link de checkout

export type CommercialAction =
  | 'greet_warmly'            // Cumprimentar e acolher (sem link)
  | 'ask_qualifying_question' // Fazer pergunta consultiva para entender o gosto
  | 'recommend_products'      // Apresentar produtos relevantes com fotos/links
  | 'send_catalog_link'       // Enviar vitrine completa
  | 'send_product_checkout'   // Enviar link direto de checkout
  | 'explain_out_of_stock'    // Explicar ausência do item no estoque e sugerir alternativas
  | 'answer_shipping'         // Responder sobre entrega/CEP
  | 'answer_service'          // Responder sobre agendamento
  | 'stay_silent';            // Ficar em silêncio (off-topic ou encerramento)

/**
 * Análise Estruturada produzida pelo Agente Exclusivo de Intenção e Descoberta
 */
export interface CustomerIntentAnalysis {
  shouldReply: boolean;
  primaryIntent: CustomerPrimaryIntent;
  conversationStage: CustomerConversationStage;
  entities: {
    category?: string;          // Ex: "vestido", "blusa", "tenis", "calca", "sapato", etc.
    occasionOrStyle?: string;   // Ex: "festa", "casamento", "trabalho", "casual", "sair"
    attributes: string[];      // Ex: ["amarela", "manga curta", "gola v", "estampado", "preto"]
    size?: string;              // Ex: "M", "38", "G"
    specificQuery?: string;     // Ex: "vestido midi floral"
    isContinuityOfPreviousProduct: boolean; // Se a pergunta refere-se ao produto que estava em discussão
    isExplicitCatalogRequest: boolean;      // Se pediu o link da vitrine/catálogo
  };
  confidence: number;
  reasoning: string;
  suggestedCommercialAction: CommercialAction;
}

export interface IntentDiscoveryInput {
  messageText: string;
  conversationContext?: ConversationContextEntity | null;
  hasStoryContext?: boolean;
  storyUrl?: string;
  storyMediaId?: string;
  openAiApiKey?: string;
}

/**
/**
 * Normaliza abreviações e gírias comuns da internet brasileira (Instagram / WhatsApp)
 */
export function expandInternetSlang(text: string): string {
  return text
    .replace(/\bvcs\b/gi, 'voces')
    .replace(/\bvc\b/gi, 'voce')
    .replace(/\boq\b/gi, 'o que')
    .replace(/\bo q\b/gi, 'o que')
    .replace(/\boque\b/gi, 'o que')
    .replace(/\bpq\b/gi, 'porque')
    .replace(/\bp q\b/gi, 'porque')
    .replace(/\btbm\b/gi, 'tambem')
    .replace(/\btb\b/gi, 'tambem')
    .replace(/\bqto\b/gi, 'quanto')
    .replace(/\bqnt\b/gi, 'quanto')
    .replace(/\bqdo\b/gi, 'quando')
    .replace(/\bhj\b/gi, 'hoje')
    .replace(/\bpfv\b/gi, 'por favor')
    .replace(/\bpf\b/gi, 'por favor')
    .replace(/\bblz\b/gi, 'beleza')
    .replace(/\bvlw\b/gi, 'valeu')
    .replace(/\bobg\b/gi, 'obrigado')
    .replace(/\bp\/\b/gi, 'para')
    .replace(/\bpr\b/gi, 'para')
    .replace(/\bpra\b/gi, 'para')
    .replace(/\bpro\b/gi, 'para o')
    .replace(/\btah\b/gi, 'esta')
    .replace(/\btá\b/gi, 'esta')
    .replace(/\bta\b/gi, 'esta')
    .replace(/\btm\b/gi, 'tem')
    .replace(/\bqria\b/gi, 'queria')
    .replace(/\bagr\b/gi, 'agora')
    .replace(/\bdps\b/gi, 'depois')
    .replace(/\bdnv\b/gi, 'de novo');
}

/**
 * Distância de edição Levenshtein para tolerância extrema a erros de digitação
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length, n = b.length;
  const d: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
    }
  }
  return d[m][n];
}

const KNOWN_CATEGORIES = [
  'vestido', 'vestidos', 'blusa', 'blusas', 'calca', 'calcas', 'saia', 'saias',
  'cropped', 'conjunto', 'conjuntos', 'short', 'shorts', 'camisa', 'camisas',
  'lingerie', 'biquini', 'biquinis', 'semijoia', 'semijoias', 'brinco', 'brincos',
  'colar', 'colares', 'pulseira', 'pulseiras', 'anel', 'aneis', 'bolsa', 'bolsas',
  'sapato', 'sapatos', 'sandalia', 'sandalias', 'tenis', 'bota', 'botas',
  'rasteirinha', 'salto', 'macacao', 'macacoes', 'jaqueta', 'jaquetas', 'moletom',
  'relogio', 'relogios', 'oculos', 'calcado', 'calcados', 'bone', 'bones',
  'chapeu', 'chapeus', 'cinto', 'cintos', 'carteira', 'carteiras',
  'maquiagem', 'maquiagens', 'perfume', 'perfumes', 'roupa', 'roupas', 'look', 'looks'
];

const GREETING_OR_STOP_WORDS = new Set([
  'boa', 'bom', 'dia', 'tarde', 'noite', 'ola', 'oie', 'tudo', 'bem',
  'aqui', 'para', 'com', 'sem', 'como', 'onde', 'qual', 'quem', 'mais',
  'menos', 'voce', 'voces', 'loja', 'sim', 'nao', 'ver', 'dar', 'tem', 'ter'
]);

/**
 * Encontra categoria mesmo com erro de digitação (ex: "vestdo" -> "vestido", "relojo" -> "relogio")
 */
export function findFuzzyCategoryMatch(word: string): string | undefined {
  const clean = word.toLowerCase().trim();
  if (clean.length < 3 || GREETING_OR_STOP_WORDS.has(clean)) return undefined;
  let bestMatch: string | undefined;
  let bestDist = Infinity;

  for (const cat of KNOWN_CATEGORIES) {
    if (clean === cat) return cat;
    // Para fuzzy match aproximado (typos), exige que a palavra tenha pelo menos 4 caracteres
    if (clean.length >= 4) {
      const maxDist = cat.length >= 6 ? 2 : 1;
      const dist = levenshteinDistance(clean, cat);
      if (dist <= maxDist && dist < bestDist) {
        bestDist = dist;
        bestMatch = cat;
      }
    }
  }
  return bestMatch;
}

/**
 * Normaliza o texto removendo acentos, caracteres especiais e expandindo gírias
 */
function normalizeText(text: string): string {
  const expanded = expandInternetSlang(text);
  return expanded
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function stripPunctuation(text: string): string {
  return text
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?!]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extrai tamanho mencionado ('P', 'M', 'G', 'GG', '38', '40', etc.)
 */
export function extractMentionedSize(text: string): string | undefined {
  const upper = text.toUpperCase();
  const tokens = upper.split(/[\s,?.!]+/);
  const directSizes = ['PP', 'P', 'M', 'G', 'GG', 'XG', '36', '38', '40', '42', '44', '46'];
  for (const size of directSizes) {
    if (tokens.includes(size) || upper.includes(`TAMANHO ${size}`) || upper.includes(`TEM ${size}`)) {
      return size;
    }
  }
}

/**
 * Extrai dinamicamente o produto ou item consultado a partir de perguntas estruturais de disponibilidade:
 * Ex: "Queria saber se tem óculos", "Gostaria de saber se vocês vendem relógio", "Tem tênis?", "Vocês trabalham com bolsas?", "e relógio?"
 */
export function extractQueriedItemFromQuestion(cleanWords: string): string | undefined {
  const clean = cleanWords.trim();
  if (/\b(horario|horarios|agendar|agendamento|vaga|vagas|marcar|procedimento|servico|servicos)\b/i.test(clean)) {
    return undefined;
  }
  const availabilityPatterns = [
    // "queria saber se tem óculos", "gostaria de saber se vocês vendem relógio", "sabe me dizer se tem vestido"
    /(?:queria|gostaria de|sabe me dizer se|poderia me informar se|queria ver se|gostaria de ver se)?\s*(?:saber se)?\s*(?:voces?|loja)?\s*\b(?:tem|vendem?|trabalham?\s+com|fazem?|disponibilizam?)\b\s*(?:\b(?:algum|alguma|os|as|um|uma|uns|umas|de|o|a)\b\s*)?(.+?)(?:\s+(?:no estoque|em estoque|pronta entrega|disponivel|disponiveis|pra vender|para vender|ai))?$/i,
    // "tem óculos?", "e tem biquíni?", "vendem tênis?", "trabalha com calçados?"
    /^(?:e\s+)?\b(?:tem\s+tambem|tem|vendem?|trabalham?\s+com|fazem?)\b\s*(?:\b(?:algum|alguma|os|as|um|uma|uns|umas|de|o|a)\b\s*)?(.+?)(?:\s+(?:no estoque|em estoque|pronta entrega|disponivel|disponiveis|pra vender|para vender|ai))?$/i,
    // "estou procurando óculos", "procurando relógio", "estou atrás de bolsa", "buscando vestido"
    /^(?:estou procurando|procurando|buscando|estou buscando|estou atras de|atras de)\s*(?:\b(?:algum|alguma|os|as|um|uma|uns|umas|de|o|a)\b\s*)?(.+?)(?:\s+(?:no estoque|em estoque|pronta entrega|disponivel|disponiveis))?$/i,
    // "quero comprar óculos", "queria ver vestidos"
    /^(?:quero|queria|gostaria de)\s+(?:comprar|ver|saber se tem|encontrar)\s*(?:\b(?:algum|alguma|os|as|um|uma|uns|umas|de|o|a)\b\s*)?(.+?)(?:\s+(?:no estoque|em estoque|pronta entrega|disponivel|disponiveis))?$/i,
  ];

  for (const pattern of availabilityPatterns) {
    const match = clean.match(pattern);
    if (match && match[1]) {
      const extracted = match[1].trim();
      if (extracted.length >= 2 && !/^(se|que|qual|quais|o que|como|quando|onde|quanto|valor|preco|ai|mesmo|entao|foto|fotos|print)$/i.test(extracted)) {
        return extracted;
      }
    }
  }

  return undefined;
}

/**
 * Agente Exclusivo de Intenção e Descoberta (Customer Intent & Discovery Agent)
 * 
 * Papel Exclusivo:
 * - Analisa a mensagem do usuário e o histórico multi-turno.
 * - Desvenda a real intenção sem depender de matches rígidos de palavras.
 * - Extrai entidades comerciais (categoria, estilo, ocasião, atributos, tamanho).
 * - Passa o contexto qualificado para o Agente Comercial realizar a venda.
 */
export class CustomerIntentDiscoveryAgent {
  /**
   * Executa a análise cognitiva assíncrona (com suporte a LLM caso API key esteja disponível)
   */
  async analyze(input: IntentDiscoveryInput): Promise<CustomerIntentAnalysis> {
    const {
      messageText,
      conversationContext,
      hasStoryContext = false,
      openAiApiKey,
    } = input;

    const raw = (messageText || '').trim();
    const normalized = normalizeText(raw);
    const cleanWords = stripPunctuation(normalized);

    // Se houver chave OpenAI configurada (via painel ou .env.local), invoca a IA para análise semântica pura
    const resolvedApiKey = openAiApiKey || process.env.OPENAI_API_KEY;
    if (resolvedApiKey && resolvedApiKey.startsWith('sk-') && !resolvedApiKey.includes('mock')) {
      try {
        const aiAnalysis = await this.analyzeWithLLM(raw, conversationContext, hasStoryContext, resolvedApiKey);
        if (aiAnalysis) return aiAnalysis;
      } catch (err) {
        console.warn('⚠️ [IntentAgent LLM Warning] Fallback para analisador semântico estruturado:', err);
      }
    }

    // Analisador Semântico Estruturado (Rápido, determinístico e com zero latência)
    return this.analyzeStructured(raw, normalized, cleanWords, conversationContext, hasStoryContext);
  }

  /**
   * Execução síncrona com zero latência (usada no pipeline de verificação imediata)
   */
  analyzeSync(input: Omit<IntentDiscoveryInput, 'openAiApiKey'>): CustomerIntentAnalysis {
    const { messageText, conversationContext, hasStoryContext = false } = input;
    const raw = (messageText || '').trim();
    const normalized = normalizeText(raw);
    const cleanWords = stripPunctuation(normalized);
    return this.analyzeStructured(raw, normalized, cleanWords, conversationContext, hasStoryContext);
  }

  /**
   * Análise Semântica Estruturada com Consciência de Turno e Estágio da Conversa
   */
  private analyzeStructured(
    raw: string,
    normalized: string,
    cleanWords: string,
    conversationContext?: ConversationContextEntity | null,
    hasStoryContext: boolean = false
  ): CustomerIntentAnalysis {
    const currentTurn = (conversationContext?.metadata?.turn_count || 0) + 1;
    const greetingAlreadySent = Boolean(conversationContext?.metadata?.greeting_sent);
    const demandInquiryAlreadySent = Boolean(conversationContext?.metadata?.demand_inquiry_sent) || currentTurn >= 3;
    const hasPreviousProduct = Boolean(conversationContext?.current_product_id);

    // 1. Mensagem vazia
    if (!raw) {
      return {
        shouldReply: false,
        primaryIntent: 'off_topic',
        conversationStage: 'initial_contact',
        entities: { attributes: [], isContinuityOfPreviousProduct: false, isExplicitCatalogRequest: false },
        confidence: 1,
        reasoning: 'Mensagem vazia recebida.',
        suggestedCommercialAction: 'stay_silent',
      };
    }

    // 2. Encerramento / Agradecimento ("Ok", "Valeu", "Show", "Obrigada", "👍") -> Silêncio
    const isShortMessage = raw.length <= 60 && !raw.includes('?');
    const closingRegex = /^(ok|okay|beleza|blz|ta bom|ta bem|ta|ah sim|entendi|compreendi|valeu|vlw|obrigado|obrigada|obg|show|show de bola|perfeito|maravilha|combinado|depois eu vejo|vou ver|vou ver aqui|vou dar uma olhada|vou pensar|qualquer coisa chamo|vou ver qualquer coisa chamo|vou ver aqui qualquer coisa chamo|so olhando|so dando uma olhada|so curiosidade|boa noite entao|bom descanso|tchau|ate mais|abraco|valeu mesmo|top|arrasou|muito bom|gratidao|amem|tmj|entendi obrigado|entendi obrigada|beleza valeu|ok obrigado|ok obrigada|valeu obrigado|obrigado valeu|👍|❤️|🙏|👏|😊|😍|✨|🔥|🙌|kkk+|hahaha+|rsrs+)$/i;
    if (isShortMessage && (closingRegex.test(cleanWords) || closingRegex.test(normalized))) {
      return {
        shouldReply: false,
        primaryIntent: 'closing',
        conversationStage: 'closing_sale',
        entities: { attributes: [], isContinuityOfPreviousProduct: false, isExplicitCatalogRequest: false },
        confidence: 0.98,
        reasoning: 'Cliente finalizou o diálogo com agradecimento/confirmação. IA em silêncio.',
        suggestedCommercialAction: 'stay_silent',
      };
    }

    // 3. Assunto fora do escopo comercial (Spam, Flerte, Propostas de terceiros) -> Silêncio
    const offTopicStrictRegex = /\b(namorar|solteir[ao]|linda|gatinha|casa comigo|te acho bonit[ao]|passa (seu|o) (zap|whats|telefone|celular)|manda foto sua|sua idade|quantos anos voce tem|voce e (um robo|uma ia|bot|humano|homem|mulher)|voce torce|futebol|eleicao|politica|parceria de marketing|gestao de trafego|trafego pago|ganhar seguidores|vender seguidores|cripto|bitcoins|renda extra|trabalhe de casa|compre comigo)\b/i;
    if (offTopicStrictRegex.test(cleanWords)) {
      return {
        shouldReply: false,
        primaryIntent: 'off_topic',
        conversationStage: 'initial_contact',
        entities: { attributes: [], isContinuityOfPreviousProduct: false, isExplicitCatalogRequest: false },
        confidence: 0.99,
        reasoning: 'Conteúdo fora de vendas (spam, pessoal ou flerte). IA em silêncio.',
        suggestedCommercialAction: 'stay_silent',
      };
    }

    // 4. Extração Cognitiva de Entidades Comerciais
    const detectedSize = extractMentionedSize(raw);

    // Identificação de nova categoria ou produto com tolerância extrema a erros de digitação
    const rawQueried = extractQueriedItemFromQuestion(cleanWords);
    const queriedItem = rawQueried ? (findFuzzyCategoryMatch(rawQueried) || rawQueried) : undefined;
    const productNounRegex = /\b(vestido|vestidos|blusa|blusas|calca|calcas|saia|saias|cropped|t-shirt|conjunto|conjuntos|short|shorts|camisa|camisas|lingerie|biquini|biquinis|semijoia|semijoias|brinco|brincos|colar|colares|pulseira|pulseiras|anel|aneis|bolsa|bolsas|sapato|sapatos|sandalia|sandalias|tenis|bota|botas|rasteirinha|salto|macacao|macacoes|jaqueta|jaquetas|moletom|relogio|relogios|oculos|calcado|calcados|bone|bones|chapeu|chapeus|cinto|cintos|carteira|carteiras|maquiagem|maquiagens|perfume|perfumes|look|looks|roupa|roupas|moda|acessorio|acessorios|peca|pecas|modelo|modelos)\b/i;
    const catMatch = cleanWords.match(productNounRegex);
    let category = queriedItem || (catMatch ? catMatch[1].toLowerCase() : undefined);

    // Se nenhuma categoria foi encontrada por regex exato, tenta fuzzy match em cada palavra da mensagem
    if (!category) {
      const tokens = cleanWords.split(/\s+/);
      for (const token of tokens) {
        const fuzzyCat = findFuzzyCategoryMatch(token);
        if (fuzzyCat) {
          category = fuzzyCat;
          break;
        }
      }
    }

    // Identificação de ocasião ou estilo
    const occasionRegex = /\b(festa|festas|casamento|casamentos|balada|baladas|aniversario|formatura|trabalho|trabalhar|passeio|evento|eventos|sair|casual|elegante|elegantes|basico|basica|basicos|basicas|chique|moderno|moderna|confortavel|verao|inverno|social|tendencia|tendencias)\b/i;
    const occMatch = cleanWords.match(occasionRegex);
    const occasionOrStyle = occMatch ? occMatch[1].toLowerCase() : undefined;

    // Identificação de cores e atributos
    const attributes: string[] = [];
    const colorRegex = /\b(amarelo|amarela|preto|preta|branco|branca|vermelho|vermelha|azul|verde|rosa|nude|dourado|prateado|estampa|estampado|manga curta|manga longa|bufante|gola v|midi|curto|curta|longo|longa)\b/gi;
    let attrMatch;
    while ((attrMatch = colorRegex.exec(cleanWords)) !== null) {
      attributes.push(attrMatch[0].toLowerCase());
    }

    // Continuidade de produto anterior?
    const mentionsNewProduct = Boolean(category || /outro|outra|outros|outras|alem|novidade/i.test(cleanWords));
    const continuityKeywords = /\b(esse|essa|dessa|desse|dele|dela|este|esta|levar|fechar|reserva|reservar|quero|comprar)\b/i.test(cleanWords);
    const isContinuityOfPreviousProduct = hasPreviousProduct && !mentionsNewProduct && (Boolean(detectedSize) || continuityKeywords || /quanto|preco|valor|custa|custam|frete|entrega|envio|tem|ainda tem|disponivel|disponiveis|fotos|detalhes|medida|medidas/i.test(cleanWords));

    // Pedido explícito de catálogo / vitrine / site / fotos
    const catalogKeywords = /\b(catalogo|vitrine|colecao|novidade|novidades|ver as pecas|todas as pecas|manda o catalogo|ver o catalogo|ver a vitrine|tem fotos|mais fotos|manda fotos|tem site|qual o site|o que tem|o que voces tem|o que voce tem|quais pecas|quais modelos|ver os modelos|ver os produtos|ver o que tem|conferir as pecas|conferir os produtos|mostrar os produtos|mostrar as pecas|como posso ver|quais sao os produtos|o que tem disponivel|ver fotos|mostrar fotos|opcoes disponiveis)\b/i;
    const isExplicitCatalogRequest = catalogKeywords.test(cleanWords);

    // Preço / Valores
    const priceRegex = /\b(quanto|preco|precos|valor|valores|custa|custam|sai por quanto|ta quanto|qual o valor|qual o preco|desconto|promocao|pix|cartao|parcela|parcelas|divide em|divide no cartao|forma de pagamento|aceita cartao|aceita pix)\b/i;
    const hasPriceInquiry = priceRegex.test(cleanWords);

    // Tamanho / Medidas
    const sizeRegex = /\b(tamanho|tamanhos|veste|medida|medidas|comprimento|largura|forma grande|forma pequena|qual a numeracao|veste que tamanho|tem (no|o|na|a)? (pp|p|m|g|gg|xg|36|38|40|42|44|46))\b/i;
    const hasSizeInquiry = sizeRegex.test(cleanWords) || detectedSize !== undefined;

    // Compra / Reserva
    const purchaseRegex = /\b(quero|comprar|reserva|reservar|levar|fechar|passa o link|link de compra|manda o link|link|como compro|como comprar|como faco pra comprar|disponivel|disponiveis|tem estoque|ainda tem|tem pronta entrega|quero pedir|fazer pedido|separar pra mim|procurando|busca|buscando|interesse|tenho interesse|voces vendem|vende online|vendem online|ajuda (a|pra|para)? ?escolher|preciso de|estou atras de|queria comprar|gostaria de comprar|quero ver|queria ver|gostaria de ver|gostaria de saber mais)\b/i;
    const hasPurchaseInquiry = purchaseRegex.test(cleanWords) || Boolean(queriedItem);

    // 5. Interação Direta com Stories ou Publicações (com ou sem pergunta específica)
    if (hasStoryContext) {
      if (hasSizeInquiry) {
        return {
          shouldReply: true,
          primaryIntent: 'size_inquiry',
          conversationStage: 'negotiating',
          entities: { category, occasionOrStyle, attributes, size: detectedSize, specificQuery: cleanWords, isContinuityOfPreviousProduct: true, isExplicitCatalogRequest: false },
          confidence: 0.98,
          reasoning: 'Cliente consultando disponibilidade de tamanho de peça em Story.',
          suggestedCommercialAction: 'recommend_products',
        };
      }
      if (hasPriceInquiry) {
        return {
          shouldReply: true,
          primaryIntent: 'price_inquiry',
          conversationStage: 'negotiating',
          entities: { category, occasionOrStyle, attributes, size: detectedSize, specificQuery: cleanWords, isContinuityOfPreviousProduct: true, isExplicitCatalogRequest: false },
          confidence: 0.98,
          reasoning: 'Cliente consultando valor de peça em Story.',
          suggestedCommercialAction: 'recommend_products',
        };
      }
      if (hasPurchaseInquiry) {
        return {
          shouldReply: true,
          primaryIntent: 'purchase_intent',
          conversationStage: 'closing_sale',
          entities: { category, occasionOrStyle, attributes, size: detectedSize, specificQuery: cleanWords, isContinuityOfPreviousProduct: true, isExplicitCatalogRequest: false },
          confidence: 0.98,
          reasoning: 'Cliente querendo comprar/fechar peça em Story.',
          suggestedCommercialAction: 'send_product_checkout',
        };
      }
      return {
        shouldReply: true,
        primaryIntent: 'story_interaction',
        conversationStage: 'needs_discovery',
        entities: { category, occasionOrStyle, attributes, size: detectedSize, specificQuery: cleanWords, isContinuityOfPreviousProduct: false, isExplicitCatalogRequest: false },
        confidence: 0.95,
        reasoning: 'Cliente interagiu com publicação ou Story da vitrine.',
        suggestedCommercialAction: 'recommend_products',
      };
    }

    // 6. Preço / Valores / Formas de Pagamento
    if (hasPriceInquiry) {
      return {
        shouldReply: true,
        primaryIntent: 'price_inquiry',
        conversationStage: 'negotiating',
        entities: { category, occasionOrStyle, attributes, size: detectedSize, specificQuery: cleanWords, isContinuityOfPreviousProduct, isExplicitCatalogRequest: false },
        confidence: 0.98,
        reasoning: 'Cliente consultando valores, parcelamento ou formas de pagamento.',
        suggestedCommercialAction: hasPreviousProduct || category ? 'recommend_products' : 'send_catalog_link',
      };
    }

    // 7. Tamanho / Medidas / Caimento
    if (hasSizeInquiry) {
      return {
        shouldReply: true,
        primaryIntent: 'size_inquiry',
        conversationStage: 'negotiating',
        entities: { category, occasionOrStyle, attributes, size: detectedSize, specificQuery: cleanWords, isContinuityOfPreviousProduct, isExplicitCatalogRequest: false },
        confidence: 0.96,
        reasoning: 'Cliente consultando modelagem, medidas ou disponibilidade de tamanho.',
        suggestedCommercialAction: 'recommend_products',
      };
    }

    // 8. Pedido explícito do catálogo
    if (isExplicitCatalogRequest) {
      return {
        shouldReply: true,
        primaryIntent: 'catalog_inquiry',
        conversationStage: 'needs_discovery',
        entities: { category, occasionOrStyle, attributes, size: detectedSize, specificQuery: cleanWords, isContinuityOfPreviousProduct: false, isExplicitCatalogRequest: true },
        confidence: 0.96,
        reasoning: 'Cliente pediu expressamente o link do catálogo/vitrine.',
        suggestedCommercialAction: 'send_catalog_link',
      };
    }

    // 9. Intenção de compra / reserva / fechamento
    if (hasPurchaseInquiry) {
      const isDirectCheckout = /\b(quero comprar|manda o link|passa o link|link de compra|reserva|reservar|fechar|levar|fazer pedido|separar pra mim|como compro|como comprar|como faco pra comprar)\b/i.test(cleanWords);
      const genericNouns = new Set(['roupa', 'roupas', 'peca', 'pecas', 'look', 'looks', 'moda', 'produto', 'produtos', 'item', 'itens', 'modelo', 'modelos']);
      const isSpecificCategory = Boolean(category && !genericNouns.has(category));
      const hasSpecificProduct = isSpecificCategory || Boolean(occasionOrStyle || attributes.length > 0);

      // Se o cliente perguntou por uma peça/categoria específica (ex: "vocês vendem relógio", "tem vestido?", "vocês vendem blusa?")
      // isso é uma consulta de produto/estoque (product_inquiry), NUNCA uma qualificação aberta genérica!
      if (hasSpecificProduct && !isDirectCheckout) {
        return {
          shouldReply: true,
          primaryIntent: 'product_inquiry',
          conversationStage: 'preference_shared',
          entities: { category, occasionOrStyle, attributes, size: detectedSize, specificQuery: cleanWords, isContinuityOfPreviousProduct, isExplicitCatalogRequest: false },
          confidence: 0.98,
          reasoning: `Cliente consultando disponibilidade da peça/categoria "${category || 'específica'}".`,
          suggestedCommercialAction: 'recommend_products',
        };
      }


      const stage = (demandInquiryAlreadySent || isDirectCheckout) ? 'closing_sale' : 'needs_discovery';
      return {
        shouldReply: true,
        primaryIntent: 'purchase_intent',
        conversationStage: stage,
        entities: { category, occasionOrStyle, attributes, size: detectedSize, specificQuery: cleanWords, isContinuityOfPreviousProduct, isExplicitCatalogRequest: false },
        confidence: 0.98,
        reasoning: isDirectCheckout ? 'Cliente pronto para checkout/reserva.' : 'Cliente iniciando jornada de compra.',
        suggestedCommercialAction: isDirectCheckout ? 'send_product_checkout' : (demandInquiryAlreadySent ? 'recommend_products' : 'ask_qualifying_question'),
      };
    }



    // 10. Dúvida sobre serviços / procedimentos / agendamento
    const serviceRegex = /\b(agendar|agendamento|horario|horarios|marcar|atende|atendimento|procedimento|servico|servicos|corte|cabelo|barba|unha|manicure|pedicure|limpeza de pele|massagem|designer|sobrancelha|lash|depilacao|make|maquiagem|horario livre|tem vaga|vaga amanha|vaga hoje|qual horario tem)\b/i;
    if (serviceRegex.test(cleanWords)) {
      return {
        shouldReply: true,
        primaryIntent: 'service_inquiry',
        conversationStage: 'negotiating',
        entities: { category, occasionOrStyle, attributes, size: detectedSize, specificQuery: cleanWords, isContinuityOfPreviousProduct, isExplicitCatalogRequest: false },
        confidence: 0.97,
        reasoning: 'Interesse em agendar ou consultar disponibilidade de serviços.',
        suggestedCommercialAction: 'answer_service',
      };
    }

    // 11. Dúvida sobre frete / entrega / motoboy / retirada / CEP
    const shippingRegex = /\b(entrega|entregam|entregas|envia|enviam|envio|frete|motoboy|uber|sedex|pac|correio|correios|transportadora|cep|retirada|retirar|buscar|onde fica|endereco|loja fisica|localizacao|bairro|cidade|aberto|abrem?|horario de funcionamento|horario de atendimento|funciona (hoje|sabado|domingo|feriado)|que horas|ate que horas)\b/i;
    if (shippingRegex.test(cleanWords) || /\b\d{5}-?\d{3}\b/.test(raw)) {
      return {
        shouldReply: true,
        primaryIntent: 'shipping_inquiry',
        conversationStage: 'negotiating',
        entities: { category, occasionOrStyle, attributes, size: detectedSize, specificQuery: cleanWords, isContinuityOfPreviousProduct, isExplicitCatalogRequest: false },
        confidence: 0.95,
        reasoning: 'Cliente tem dúvida sobre envio, frete, localização ou prazo de entrega.',
        suggestedCommercialAction: 'answer_shipping',
      };
    }

    // 12. Saudação Inicial ("Oi", "Olá", "Bom dia", "Boa tarde", "Boa noite", "Tudo bem?")
    const greetingRegex = /^(oi|ola|oie|oii|oiii|bom dia|boa tarde|boa noite|tudo bem|opa|hello|hey|como funciona|tudo joia|tudo bom|e ai|eai|atende aqui)\b/i;
    if (greetingRegex.test(cleanWords) && !category && !occasionOrStyle && !detectedSize) {
      return {
        shouldReply: true,
        primaryIntent: 'greeting',
        conversationStage: greetingAlreadySent ? 'needs_discovery' : 'initial_contact',
        entities: { attributes, isContinuityOfPreviousProduct: false, isExplicitCatalogRequest: false },
        confidence: 0.98,
        reasoning: 'Saudação cordial inicial do cliente.',
        suggestedCommercialAction: greetingAlreadySent ? 'ask_qualifying_question' : 'greet_warmly',
      };
    }

    // 13. Peças do Catálogo / Categorias / Ocasião / Estilo
    if (category || occasionOrStyle || attributes.length > 0) {
      return {
        shouldReply: true,
        primaryIntent: 'product_inquiry',
        conversationStage: 'preference_shared',
        entities: { category, occasionOrStyle, attributes, size: detectedSize, specificQuery: cleanWords, isContinuityOfPreviousProduct, isExplicitCatalogRequest: false },
        confidence: 0.95,
        reasoning: `Cliente indicou preferência concreta: categoria=${category || 'não informada'}, ocasião/estilo=${occasionOrStyle || 'não informada'}.`,
        suggestedCommercialAction: 'recommend_products',
      };
    }

    // 14. Dúvidas abertas sobre o catálogo / produtos
    if (!category && /^(gostaria de saber|queria saber|uma duvida|tirar uma duvida|queria uma informacao|gostaria de uma informacao|o que voces tem|o que tem)\b/i.test(cleanWords)) {
      return {
        shouldReply: true,
        primaryIntent: 'catalog_inquiry',
        conversationStage: 'needs_discovery',
        entities: { attributes: [], isContinuityOfPreviousProduct: false, isExplicitCatalogRequest: false },
        confidence: 0.91,
        reasoning: 'Dúvida aberta comercial direcionada aos produtos da loja.',
        suggestedCommercialAction: demandInquiryAlreadySent ? 'recommend_products' : 'ask_qualifying_question',
      };
    }

    // 15. Diálogo multi-turno em andamento
    if (demandInquiryAlreadySent) {
      return {
        shouldReply: true,
        primaryIntent: 'product_inquiry',
        conversationStage: 'preference_shared',
        entities: { specificQuery: cleanWords, attributes: [], isContinuityOfPreviousProduct: false, isExplicitCatalogRequest: false },
        confidence: 0.88,
        reasoning: 'Resposta livre do cliente em diálogo de qualificação já iniciado.',
        suggestedCommercialAction: 'recommend_products',
      };
    }

    // 16. Caso não se encaixe em nenhuma jornada comercial
    return {
      shouldReply: false,
      primaryIntent: 'off_topic',
      conversationStage: 'initial_contact',
      entities: { attributes: [], isContinuityOfPreviousProduct: false, isExplicitCatalogRequest: false },
      confidence: 0.85,
      reasoning: 'Mensagem fora da jornada comercial.',
      suggestedCommercialAction: 'stay_silent',
    };
  }

  /**
   * Chamada ao modelo de linguagem multimodal / LLM quando chave de API fornecida
   */
  private async analyzeWithLLM(
    rawMessage: string,
    conversationContext?: ConversationContextEntity | null,
    hasStoryContext: boolean = false,
    apiKey?: string
  ): Promise<CustomerIntentAnalysis | null> {
    const currentTurn = (conversationContext?.metadata?.turn_count || 0) + 1;
    const prevProductTitle = conversationContext?.current_product?.title || 'nenhum';

    const systemPrompt = `Você é o Agente de Inteligência e Qualificação Comercial de uma loja online.
Seu ÚNICO papel é analisar mensagens de clientes no Instagram Direct/WhatsApp e extrair com precisão a intenção, entidades e a próxima ação comercial recomendada.

DIRETRIZES DE QUALIFICAÇÃO HUMANA:
1. Em saudações iniciais ('Oi', 'Olá', 'Bom dia', 'Boa tarde', 'Boa noite'), a ação deve ser SEMPRE 'greet_warmly' (NUNCA mandar links no início).
2. Se o cliente disser de forma ampla que procura uma roupa/peça mas sem especificar, a ação é 'ask_qualifying_question' (para entender estilo/tamanho/ocasião).
3. Se o cliente especificou o que quer (ex: vestido de festa, blusa, calça, tamanho M), a ação é 'recommend_products'.
4. Se o cliente pedir expressamente o link ou catálogo ('manda o site', 'onde vejo as fotos'), a ação é 'send_catalog_link'.
5. Se for dúvida de frete/motoboy, a ação é 'answer_shipping'.
6. Se for encerramento ou spam/flerte, shouldReply deve ser false e a ação 'stay_silent'.

Responda ESTRITAMENTE em formato JSON com o schema:
{
  "shouldReply": boolean,
  "primaryIntent": "greeting" | "price_inquiry" | "size_inquiry" | "purchase_intent" | "product_inquiry" | "catalog_inquiry" | "service_inquiry" | "shipping_inquiry" | "story_interaction" | "closing" | "off_topic",
  "conversationStage": "initial_contact" | "needs_discovery" | "preference_shared" | "negotiating" | "closing_sale",
  "entities": {
    "category": string | null,
    "occasionOrStyle": string | null,
    "attributes": string[],
    "size": string | null,
    "specificQuery": string | null,
    "isContinuityOfPreviousProduct": boolean,
    "isExplicitCatalogRequest": boolean
  },
  "confidence": number,
  "reasoning": string,
  "suggestedCommercialAction": "greet_warmly" | "ask_qualifying_question" | "recommend_products" | "send_catalog_link" | "send_product_checkout" | "explain_out_of_stock" | "answer_shipping" | "answer_service" | "stay_silent"
}`;

    const userPrompt = `Contexto da Conversa:
- Turno Atual: ${currentTurn}
- Último Produto Visto: ${prevProductTitle}
- Resposta a Story: ${hasStoryContext}

Mensagem do Cliente:
"${rawMessage}"`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-6-luna',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 300,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        return {
          shouldReply: Boolean(parsed.shouldReply),
          primaryIntent: parsed.primaryIntent || 'product_inquiry',
          conversationStage: parsed.conversationStage || 'needs_discovery',
          entities: {
            category: parsed.entities?.category || undefined,
            occasionOrStyle: parsed.entities?.occasionOrStyle || undefined,
            attributes: Array.isArray(parsed.entities?.attributes) ? parsed.entities.attributes : [],
            size: parsed.entities?.size || undefined,
            specificQuery: parsed.entities?.specificQuery || undefined,
            isContinuityOfPreviousProduct: Boolean(parsed.entities?.isContinuityOfPreviousProduct),
            isExplicitCatalogRequest: Boolean(parsed.entities?.isExplicitCatalogRequest),
          },
          confidence: Number(parsed.confidence || 0.95),
          reasoning: parsed.reasoning || '',
          suggestedCommercialAction: parsed.suggestedCommercialAction || 'recommend_products',
        };
      }
    }
    return null;
  }
}

export const intentDiscoveryAgent = new CustomerIntentDiscoveryAgent();
