import {
  CandidateProductMatch,
  MatchDecisionResult,
  ProductDynamicAttributes,
  ProductEntity,
} from '../catalog/intelligent-types';

export interface AttributeComparisonDetail {
  categoryMatch: boolean;
  colorMatch: boolean;
  specificsScore: number;
  visualSimilarity: number;
  totalScore: number;
  matchedAttributes: string[];
  divergentAttributes: string[];
  reason: string;
}

/**
 * Normaliza strings para comparação flexível (remove acentos e espaços extras)
 */
function normalize(str?: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Compara atributos dinâmicos extraídos pela visão computacional
 * contra os atributos do produto cadastrado no catálogo.
 */
export function compareProductAttributes(
  extracted: ProductDynamicAttributes,
  product: ProductEntity,
  visualSimilarity: number
): AttributeComparisonDetail {
  const pAttrs = product.attributes || {};
  const matched: string[] = [];
  const divergent: string[] = [];

  // 1. Categoria (Peso 25%)
  const extractedCat = normalize(extracted.categoria);
  const prodCat = normalize(product.category || pAttrs.categoria);
  const categoryMatch = Boolean(
    extractedCat && prodCat && (extractedCat.includes(prodCat) || prodCat.includes(extractedCat))
  );

  if (categoryMatch) {
    matched.push(`Categoria igual: ${extracted.categoria}`);
  } else if (extractedCat && prodCat) {
    divergent.push(`Categoria diferente (${extractedCat} vs ${prodCat})`);
  }

  // 2. Cor Principal (Peso 25%)
  const extractedColor = normalize(extracted.cor_principal);
  const prodColor = normalize(pAttrs.cor_principal);
  const colorMatch = Boolean(
    extractedColor && prodColor && (extractedColor.includes(prodColor) || prodColor.includes(extractedColor))
  );

  if (colorMatch) {
    matched.push(`Cor principal igual: ${extracted.cor_principal}`);
  } else if (extractedColor && prodColor) {
    divergent.push(`Cor diferente (${extracted.cor_principal} vs ${pAttrs.cor_principal})`);
  }

  // 3. Características específicas: Gola, Manga, Detalhes, Modelagem, Estampa (Peso 20%)
  let specificMatches = 0;
  let specificChecks = 0;

  // Gola
  if (extracted.gola || pAttrs.gola) {
    specificChecks++;
    if (normalize(extracted.gola) === normalize(pAttrs.gola)) {
      specificMatches++;
      matched.push(`Gola igual: ${extracted.gola}`);
    } else if (extracted.gola && pAttrs.gola) {
      divergent.push(`Gola diferente (${extracted.gola} vs ${pAttrs.gola})`);
    }
  }

  // Manga
  if (extracted.manga || pAttrs.manga) {
    specificChecks++;
    if (normalize(extracted.manga) === normalize(pAttrs.manga)) {
      specificMatches++;
      matched.push(`Manga igual: ${extracted.manga}`);
    } else if (extracted.manga && pAttrs.manga) {
      divergent.push(`Manga diferente (${extracted.manga} vs ${pAttrs.manga})`);
    }
  }

  // Estampa
  if (extracted.estampa || pAttrs.estampa) {
    specificChecks++;
    if (normalize(extracted.estampa) === normalize(pAttrs.estampa)) {
      specificMatches++;
      matched.push(`Estampa igual: ${extracted.estampa}`);
    } else if (extracted.estampa && pAttrs.estampa) {
      divergent.push(`Estampa diferente (${extracted.estampa} vs ${pAttrs.estampa})`);
    }
  }

  // Modelagem
  if (extracted.modelagem || pAttrs.modelagem) {
    specificChecks++;
    if (normalize(extracted.modelagem) === normalize(pAttrs.modelagem)) {
      specificMatches++;
      matched.push(`Modelagem igual: ${extracted.modelagem}`);
    }
  }

  const specificsScore = specificChecks > 0 ? specificMatches / specificChecks : 0.8;

  // 4. Cálculo ponderado da confiança final:
  // - Similaridade Visual / Vetorial (HNSW): 30%
  // - Categoria: 25%
  // - Cor: 25%
  // - Especificidades (Gola, Manga, Estampa, etc.): 20%
  const visualWeight = 0.30;
  const categoryWeight = 0.25;
  const colorWeight = 0.25;
  const specificsWeight = 0.20;

  let totalScore =
    visualSimilarity * visualWeight +
    (categoryMatch ? 1.0 : 0.0) * categoryWeight +
    (colorMatch ? 1.0 : 0.0) * colorWeight +
    specificsScore * specificsWeight;

  // Penalidade severa se a categoria for expressamente conflitante (ex: tênis vs vestido)
  if (!categoryMatch && extractedCat && prodCat && visualSimilarity < 0.90) {
    totalScore = totalScore * 0.4;
  }

  // Se a similaridade de imagem/vetor for altíssima (mesma foto já cadastrada no catálogo)
  if (visualSimilarity >= 0.90) {
    totalScore = Math.max(totalScore, 0.92);
  }

  // Construção da justificativa amigável
  const reason = [
    `Similaridade visual: ${(visualSimilarity * 100).toFixed(0)}%`,
    categoryMatch ? 'categoria: igual' : 'categoria: diferente',
    colorMatch ? 'cor: igual' : 'cor: divergente',
    specificMatches > 0 ? `${specificMatches} detalhes coincidentes` : null,
  ]
    .filter(Boolean)
    .join(' | ');

  return {
    categoryMatch,
    colorMatch,
    specificsScore,
    visualSimilarity,
    totalScore: Math.min(1, Math.max(0, totalScore)),
    matchedAttributes: matched,
    divergentAttributes: divergent,
    reason,
  };
}

/**
 * Avalia candidatos retornados pelo HNSW e toma a decisão estrita:
 * 1. Match Forte (>= 0.85): auto_matched
 * 2. Match Duvidoso (0.50 a 0.84): pending_confirmation (solicita confirmação da dona)
 * 3. Nenhum Match (< 0.50): suggested_new (sugere cadastro, NUNCA auto-cria em dúvida)
 */
export function evaluateProductMatches(params: {
  extractedAttributes: ProductDynamicAttributes;
  canonicalDescription: string;
  candidateProductsWithSimilarity: Array<{
    product: ProductEntity;
    similarity: number;
  }>;
  isServicesCatalog?: boolean;
}): MatchDecisionResult {
  const { extractedAttributes, canonicalDescription, candidateProductsWithSimilarity, isServicesCatalog } = params;

  // Detecta se qualquer um dos produtos candidatos é um serviço ou se o catálogo é de serviços
  const isServices = Boolean(
    isServicesCatalog ||
    candidateProductsWithSimilarity.some(
      (c) => c.product.attributes?.isService || (c.product as any).isService
    )
  );

  const rankedCandidates: CandidateProductMatch[] = [];

  for (const item of candidateProductsWithSimilarity) {
    const comparison = compareProductAttributes(
      extractedAttributes,
      item.product,
      item.similarity
    );

    rankedCandidates.push({
      product_id: item.product.id,
      title: item.product.title,
      category: item.product.category,
      price_cents: item.product.price_cents,
      image_url: item.product.image_url,
      confidence: Number(comparison.totalScore.toFixed(3)),
      similarity: Number(item.similarity.toFixed(3)),
      reason: comparison.reason,
      matchedAttributes: comparison.matchedAttributes,
      divergentAttributes: comparison.divergentAttributes,
    });
  }

  // Ordena por confiança decrescente
  rankedCandidates.sort((a, b) => b.confidence - a.confidence);

  const top = rankedCandidates[0];

  // =========================================================================
  // REGRA DE NEGÓCIO CRÍTICA PARA SERVIÇOS:
  // Em serviços (barbearias, estética, unhas, salões, estofados, etc.), posts,
  // reels e stories divulgam o resultado do trabalho. Eles NÃO devem criar novos
  // itens no catálogo! Devem identificar o serviço existente e exibir para o cliente
  // a facilidade do agendamento online, suporte a múltiplos agendamentos e ordem de chegada.
  // =========================================================================
  if (isServices) {
    if (top && top.confidence >= 0.35) {
      const matchedProduct = candidateProductsWithSimilarity.find(
        (c) => c.product.id === top.product_id
      )?.product;

      return {
        decision: 'strong_match',
        match_status: 'auto_matched',
        confidence: Math.max(top.confidence, 0.88),
        matched_product: matchedProduct,
        candidates: rankedCandidates.slice(0, 3),
        extracted_attributes: extractedAttributes,
        canonical_description: canonicalDescription,
        explanation: `Demonstração visual identificada para o serviço "${top.title}". Em catálogo de serviços, publicações e reels destacam a facilidade de agendamento online sem inflar a grade de serviços.`,
      };
    }

    if (top) {
      return {
        decision: 'doubtful_match',
        match_status: 'pending_confirmation',
        confidence: top.confidence,
        matched_product: undefined,
        candidates: rankedCandidates.slice(0, 3),
        extracted_attributes: extractedAttributes,
        canonical_description: canonicalDescription,
        explanation: `Publicação de portfólio visual. Confirmar se refere-se a "${top.title}" para direcionar clientes diretamente para a agenda online deste serviço.`,
      };
    }

    // Se nenhum candidato estiver cadastrado ainda
    return {
      decision: 'no_match',
      match_status: 'pending_confirmation',
      confidence: 0,
      matched_product: undefined,
      candidates: [],
      extracted_attributes: extractedAttributes,
      canonical_description: canonicalDescription,
      explanation:
        'Publicação de divulgação institucional. Para serviços, novos posts não criam produtos automaticamente para manter a lista de procedimentos limpa.',
    };
  }

  // =========================================================================
  // FLUXO PARA PRODUTOS FÍSICOS:
  // =========================================================================

  // Caso 1: Match Forte (Confiança >= 0.85)
  if (top && top.confidence >= 0.85) {
    const bestProduct = candidateProductsWithSimilarity.find(
      (c) => c.product.id === top.product_id
    )?.product;

    return {
      decision: 'strong_match',
      match_status: 'auto_matched',
      confidence: top.confidence,
      matched_product: bestProduct,
      candidates: rankedCandidates.slice(0, 3),
      extracted_attributes: extractedAttributes,
      canonical_description: canonicalDescription,
      explanation: `Match forte detectado com "${top.title}" (${(top.confidence * 100).toFixed(0)}% de certeza). Associação automática concluída.`,
    };
  }

  // Caso 2: Match Duvidoso (0.50 <= Confiança < 0.85)
  if (top && top.confidence >= 0.50) {
    return {
      decision: 'doubtful_match',
      match_status: 'pending_confirmation',
      confidence: top.confidence,
      matched_product: undefined,
      candidates: rankedCandidates.slice(0, 3),
      extracted_attributes: extractedAttributes,
      canonical_description: canonicalDescription,
      explanation: `Dúvida visual entre ${rankedCandidates.length > 1 ? rankedCandidates.slice(0, 2).map((c) => `"${c.title}"`).join(' e ') : `"${top.title}"`}. Aguardando confirmação rápida da dona da loja.`,
    };
  }

  // Caso 3: Nenhum Match (< 0.50) -> Sugerir novo produto
  return {
    decision: 'no_match',
    match_status: 'suggested_new',
    confidence: top?.confidence || 0,
    matched_product: undefined,
    candidates: rankedCandidates.slice(0, 3),
    extracted_attributes: extractedAttributes,
    canonical_description: canonicalDescription,
    explanation:
      'Nenhum produto existente no catálogo coincide com as características desta publicação. Sugerindo cadastro de nova peça.',
  };
}
