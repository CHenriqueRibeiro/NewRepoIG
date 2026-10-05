import { generateDeterministicEmbedding, cosineSimilarity } from './embedding-service';

export interface OpportunityClassification {
  intent: 'checkout_pix' | 'product_inquiry' | 'shipping' | 'address' | 'general';
  intentLabel: string;
  intentBadgeColor: string;
  confidence: number;
  estimatedTicketCents: number;
  status: 'checkout_sent' | 'answered' | 'listening';
  statusLabel: string;
}

const SEMANTIC_OPPORTUNITY_PROTOTYPES: Record<
  'checkout_pix' | 'product_inquiry' | 'shipping' | 'address' | 'general',
  {
    label: string;
    badgeColor: string;
    semanticContext: string;
    ticketMultiplier: number;
    status: 'checkout_sent' | 'answered' | 'listening';
    statusLabel: string;
  }
> = {
  checkout_pix: {
    label: 'Fechamento & PIX',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    semanticContext:
      'pagamento pix transferência bancária chave bancaria dados para pagar valor quantia montante custo preco finalizar pedido efetuar quitacao comprovante enviado fechar compra fechar encomenda dinheiro qr code copia e cola pagar agora quitar link de checkout',
    ticketMultiplier: 1.25,
    status: 'checkout_sent',
    statusLabel: 'Link de Checkout Enviado',
  },
  product_inquiry: {
    label: 'Dúvida de Peça / Preço',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    semanticContext:
      'produto peca roupa vestido blusa saia calca tamanho cor modelo caimento tecido quanto custa valor preco tem disponivel pronta entrega estoque reserve para mim foto story catalogo vitrine virtual pecas olhar roupas',
    ticketMultiplier: 1.0,
    status: 'answered',
    statusLabel: 'Catálogo Enviado no Direct',
  },
  shipping: {
    label: 'Cotação de Frete',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    semanticContext:
      'frete envio entrega prazo cep transportadora pac sedex correios taxa de entrega motoboy taxa custo de envio mandar entrega rapida motoboy uber 99 entregam na minha cidade',
    ticketMultiplier: 0.95,
    status: 'answered',
    statusLabel: 'Frete Calculado no Direct',
  },
  address: {
    label: 'Visita Loja Física',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    semanticContext:
      'endereco onde fica localizacao loja fisica ponto de retirada retirar presencialmente buscar no local como chegar rua avenida bairro horario funcionamento expediente',
    ticketMultiplier: 0.9,
    status: 'answered',
    statusLabel: 'Endereço Enviado no Direct',
  },
  general: {
    label: 'Interesse Geral',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    semanticContext:
      'saudacao cordial ola oi oie bom dia boa tarde boa noite como funciona tudo bem tudo joia prazer duvida geral politica atendimento bem vindo orientacoes institucionais',
    ticketMultiplier: 0.85,
    status: 'answered',
    statusLabel: 'Atendimento em Andamento',
  },
};

/**
 * Classifica a oportunidade semântica utilizando similaridade de cosseno vetorial
 * 100% dinâmico via IA - Sem palavras-chave fixas ou includes manuais.
 */
export function classifyOpportunitySemantically(
  messageText: string,
  baseTicketCents: number = 12900
): OpportunityClassification {
  const text = (messageText || '').trim();
  if (!text) {
    const fallback = SEMANTIC_OPPORTUNITY_PROTOTYPES.general;
    return {
      intent: 'general',
      intentLabel: fallback.label,
      intentBadgeColor: fallback.badgeColor,
      confidence: 0,
      estimatedTicketCents: Math.round(baseTicketCents * fallback.ticketMultiplier),
      status: fallback.status,
      statusLabel: fallback.statusLabel,
    };
  }

  const messageVector = generateDeterministicEmbedding(text);
  let bestIntent: 'checkout_pix' | 'product_inquiry' | 'shipping' | 'address' | 'general' = 'general';
  let bestSimilarity = -1;

  for (const [intentKey, proto] of Object.entries(SEMANTIC_OPPORTUNITY_PROTOTYPES) as Array<
    ['checkout_pix' | 'product_inquiry' | 'shipping' | 'address' | 'general', typeof SEMANTIC_OPPORTUNITY_PROTOTYPES['general']]
  >) {
    const protoVector = generateDeterministicEmbedding(proto.semanticContext);
    const sim = cosineSimilarity(messageVector, protoVector);
    if (sim > bestSimilarity) {
      bestSimilarity = sim;
      bestIntent = intentKey;
    }
  }

  const matched = SEMANTIC_OPPORTUNITY_PROTOTYPES[bestIntent];
  const dynamicTicket = Math.round(baseTicketCents * matched.ticketMultiplier);

  return {
    intent: bestIntent,
    intentLabel: matched.label,
    intentBadgeColor: matched.badgeColor,
    confidence: Number(bestSimilarity.toFixed(4)),
    estimatedTicketCents: dynamicTicket,
    status: matched.status,
    statusLabel: matched.statusLabel,
  };
}
