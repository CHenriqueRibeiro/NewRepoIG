import type { ProductDynamicAttributes } from '../catalog/intelligent-types.ts';

export interface VisionAnalysisResult {
  attributes: ProductDynamicAttributes;
  canonicalDescription: string;
  confidence: number;
  detectedCategory: string;
  suggestedTitle?: string;
  estimatedPriceCents?: number;
}

/**
 * Constrói a descrição canônica a partir dos atributos dinâmicos extraídos.
 */
export function buildCanonicalDescription(attrs: ProductDynamicAttributes): string {
  const parts: string[] = [];

  const isService =
    attrs.tipo_item === 'servico' ||
    attrs.tipo_item === 'serviço' ||
    Boolean(attrs.procedimento || attrs.duracao);

  if (isService) {
    const rawCat = attrs.categoria || attrs.procedimento || 'Serviço';
    const cat = /^(geral|novidades|produto)$/i.test(rawCat) ? 'Serviço' : rawCat;
    const sub = attrs.subcategoria ? ` (${attrs.subcategoria})` : '';
    parts.push(`Serviço de ${cat}${sub}`);
    if (attrs.procedimento && attrs.procedimento.toLowerCase() !== cat.toLowerCase()) {
      parts.push(`procedimento ${attrs.procedimento}`);
    }
    if (attrs.duracao) parts.push(`duração média ${attrs.duracao}`);
    if (attrs.detalhes && attrs.detalhes.length > 0) {
      parts.push(`com ${attrs.detalhes.join(', ')}`);
    }
    if (attrs.estilo) parts.push(`estilo ${attrs.estilo}`);
    return parts.join(', ') + '.';
  }

  const rawCat = attrs.categoria || 'Peça';
  const cat = /^(geral|novidades|produto)$/i.test(rawCat) ? 'Peça' : rawCat;
  const sub = attrs.subcategoria ? ` (${attrs.subcategoria})` : '';
  const genero = attrs.genero ? ` ${attrs.genero}` : '';
  const cor = attrs.cor_principal ? ` cor ${attrs.cor_principal}` : '';

  parts.push(`${cat}${sub}${genero}${cor}`);

  if (attrs.marca) parts.push(`marca ${attrs.marca}`);
  if (attrs.volumetria) parts.push(`volume ${attrs.volumetria}`);
  if (attrs.gola) parts.push(`gola ${attrs.gola}`);
  if (attrs.manga) parts.push(`manga ${attrs.manga}`);
  if (attrs.estampa && attrs.estampa !== 'lisa') parts.push(`estampa ${attrs.estampa}`);
  if (attrs.modelagem) parts.push(`modelagem ${attrs.modelagem}`);
  if (attrs.material) parts.push(`tecido/material ${attrs.material}`);
  if (attrs.detalhes && attrs.detalhes.length > 0) {
    parts.push(`com detalhes em ${attrs.detalhes.join(', ')}`);
  }
  if (attrs.estilo) parts.push(`estilo ${attrs.estilo}`);

  return parts.join(', ') + '.';
}

/**
 * Chamada multimodal Google Gemini 1.5 Flash (Gratuito / BYOK)
 */
async function callGeminiVision(
  imageUrl: string,
  caption?: string,
  geminiKey?: string
): Promise<VisionAnalysisResult | null> {
  const key =
    geminiKey ||
    process.env.GEMINI_API_KEY ||
    (global as any).__activeGeminiKey ||
    ((global as any).__activeAiKey?.provider === 'gemini' ? (global as any).__activeAiKey?.key : undefined);

  if (!key || (!key.startsWith('AIza') && !key.startsWith('test-'))) return null;

  try {
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) return null;
    const arrayBuffer = await imgRes.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = (imgRes.headers.get('content-type') || 'image/jpeg').split(';')[0];

    const promptText = `Você é um catalogador comercial e analista visual de produtos e serviços.
Analise a imagem fornecida (e a legenda '${caption || ''}') e extraia informações REAIS vistas na foto em formato JSON:
{
  "tipo_item": "produto" ou "servico",
  "categoria": string,
  "subcategoria": string ou null,
  "titulo_sugerido": string,
  "preco_estimado_reais": number ou null, // APENAS se houver valor explícito e visível na imagem ou na legenda. Se NÃO houver preço, retorne null.
  "cor_principal": string ou null,
  "marca": string ou null,
  "detalhes": string[],
  "genero": string ou null,
  "material": string ou null,
  "estilo": string ou null,
  "descricao_canonica": string
}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: promptText },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            response_mime_type: 'application/json',
            temperature: 0.1,
          },
        }),
      }
    );

    if (res.ok) {
      const data = await res.json();
      const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawJson) {
        const parsed = JSON.parse(rawJson);
        const canonical = parsed.descricao_canonica || buildCanonicalDescription(parsed);
        return {
          attributes: parsed,
          canonicalDescription: canonical,
          confidence: 0.96,
          detectedCategory: parsed.categoria || 'Geral',
          suggestedTitle: parsed.titulo_sugerido,
          estimatedPriceCents: parsed.preco_estimado_reais && parsed.preco_estimado_reais > 0
            ? Math.round(parsed.preco_estimado_reais * 100)
            : 0,
        };
      }
    }
  } catch (err) {
    console.warn('[Gemini Vision API Warning]', err);
  }
  return null;
}

/**
 * OpenAI / Gemini Vision: Analisa imagem e extrai atributos dinâmicos em formato JSON estrito
 */
export async function analyzeMediaWithVision(params: {
  imageUrl: string;
  caption?: string;
  apiKey?: string;
}): Promise<VisionAnalysisResult> {
  const { imageUrl, caption, apiKey } = params;

  // 1. Tenta Gemini Vision primeiro se chave estiver disponível
  const geminiResult = await callGeminiVision(imageUrl, caption, apiKey);
  if (geminiResult) {
    return geminiResult;
  }

  // 2. Se houver chave OpenAI real
  const resolvedApiKey =
    apiKey ||
    process.env.OPENAI_API_KEY ||
    ((global as any).__activeAiKey?.provider === 'openai' ? (global as any).__activeAiKey?.key : undefined);

  if (resolvedApiKey && resolvedApiKey.startsWith('sk-') && !resolvedApiKey.includes('mock')) {
    try {
      const systemPrompt = `Você é um especialista em visão computacional e catálogo comercial para e-commerce, comércio local e serviços.
Sua missão é inspecionar minuciosamente a imagem fornecida (e a legenda opcional) e extrair os atributos estruturados do item principal em formato JSON.
NUNCA invente preços fictícios. O campo preco_estimado_reais só deve ser preenchido se houver valor explícito e visível na imagem ou na legenda.

Retorne RIGOROSAMENTE no formato JSON:
{
  "tipo_item": "produto" ou "servico",
  "categoria": string,
  "subcategoria": string ou null,
  "titulo_sugerido": string,
  "preco_estimado_reais": number ou null,
  "cor_principal": string ou null,
  "cores_secundarias": string[],
  "detalhes": string[],
  "estampa": string ou null,
  "modelagem": string ou null,
  "material": string ou null,
  "duracao": string ou null,
  "procedimento": string ou null,
  "marca": string ou null,
  "volumetria": string ou null,
  "genero": string ou null,
  "estilo": string ou null
}`;

      const userContent: any[] = [
        {
          type: 'text',
          text: `Analise o item exibido nesta imagem.${caption ? ` Legenda informada na postagem: "${caption}"` : ''} Extraia os atributos reais visíveis.`,
        },
        {
          type: 'image_url',
          image_url: { url: imageUrl, detail: 'high' },
        },
      ];

      const requestBody: Record<string, any> = {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 800,
      };

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resolvedApiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices[0]?.message?.content;
        const parsed = JSON.parse(content);
        const canonical = buildCanonicalDescription(parsed);

        return {
          attributes: parsed,
          canonicalDescription: canonical,
          confidence: 0.95,
          detectedCategory: parsed.categoria || 'Geral',
          suggestedTitle: parsed.titulo_sugerido,
          estimatedPriceCents: parsed.preco_estimado_reais && parsed.preco_estimado_reais > 0
            ? Math.round(parsed.preco_estimado_reais * 100)
            : 0,
        };
      } else {
        const errText = await res.text();
        console.warn(`[Vision API Error ${res.status}]`, errText);
      }
    } catch (err) {
      console.warn('[Vision API Warning, using dynamic analyzer]', err);
    }
  }

  // 3. Processamento puramente dinâmico quando não houver chave de IA
  return generateHeuristicAttributes(imageUrl, caption);
}

/**
 * Processamento 100% dinâmico: extrai dados exclusivamente da legenda do lojista (zero dados mockados/fixos)
 */
function generateHeuristicAttributes(imageUrl: string, caption?: string): VisionAnalysisResult {
  const text = (caption || '').trim();
  const lowerText = text.toLowerCase();

  // 1. TÍTULO REAL: extraído exclusivamente da primeira linha da legenda do lojista (se existir)
  let suggestedTitle: string | undefined = undefined;
  if (text) {
    const firstLine = text.split('\n')[0].replace(/[#@][\w.-]+/g, '').replace(/https?:\/\/\S+/g, '').trim();
    if (firstLine.length >= 3 && firstLine.length <= 80) {
      suggestedTitle = firstLine.charAt(0).toUpperCase() + firstLine.slice(1);
    }
  }
  if (!suggestedTitle) {
    suggestedTitle = 'Peça em Lançamento';
  }

  // 2. PREÇO REAL: extraído EXCLUSIVAMENTE se houver valor explícito na legenda (ex: R$ 90 ou 90 reais)
  // NUNCA inventa preço padrão ou mockado. Se não houver preço explícito, é rigorosamente 0.
  let estimatedPriceCents = 0;
  const priceRegex = /(?:r\$\s*|valor:?\s*|por\s*|apenas\s*)(\d+(?:[.,]\d{2})?)/i;
  const priceRegex2 = /(\d+(?:[.,]\d{2})?)\s*(?:reais|no pix)/i;
  const pMatch = text.match(priceRegex) || text.match(priceRegex2);
  if (pMatch) {
    const rawNum = pMatch[1].replace(',', '.');
    const parsedNum = parseFloat(rawNum);
    if (!isNaN(parsedNum) && parsedNum > 0) {
      estimatedPriceCents = Math.round(parsedNum * 100);
    }
  }

  // 3. CATEGORIA REAL: apenas se mencionada na legenda do lojista
  let categoria = 'Geral';
  let subcategoria: string | undefined = undefined;
  const isService = /\b(corte|barba|cabelo|manicure|pedicure|unha|unhas|lash|sobrancelha|estetica|estética|detailing|polimento|lavagem|agendamento|serviço|servico)\b/i.test(lowerText);

  if (isService) {
    categoria = 'Serviço';
  } else if (/\b(vestido|vestidos)\b/i.test(lowerText)) {
    categoria = 'Vestido';
  } else if (/\b(blusa|blusas|camisa|camisas|cropped|t-shirt)\b/i.test(lowerText)) {
    categoria = 'Blusa';
  } else if (/\b(calça|calças|shorts|saia|saias|bermuda)\b/i.test(lowerText)) {
    categoria = 'Vestuário';
  } else if (/\b(relogio|relógio|smartwatch)\b/i.test(lowerText)) {
    categoria = 'Relógio';
  } else if (/\b(perfume|colonia|colônia|fragrancia|fragrância)\b/i.test(lowerText)) {
    categoria = 'Perfumaria';
  } else if (/\b(brinco|pulseira|colar|anel|joia|semijoia)\b/i.test(lowerText)) {
    categoria = 'Acessórios';
  } else if (/\b(celular|smartphone|notebook|fone)\b/i.test(lowerText)) {
    categoria = 'Eletrônicos';
  }

  // 4. COR PRINCIPAL: apenas se o lojista mencionou explicitamente na legenda
  let cor_principal: string | undefined = undefined;
  const coresComuns = ['preto', 'branco', 'azul', 'vermelho', 'verde', 'amarelo', 'rosa', 'bege', 'marrom', 'dourado', 'prata', 'cinza', 'roxo', 'laranja'];
  for (const c of coresComuns) {
    if (new RegExp(`\\b${c}\\b`, 'i').test(lowerText)) {
      cor_principal = c;
      break;
    }
  }

  const attrs: ProductDynamicAttributes = {
    tipo_item: isService ? 'servico' : 'produto',
    categoria: categoria.toLowerCase(),
    subcategoria,
    cor_principal,
    detalhes: [], // ZERO detalhes inventados
    estampa: /\b(estampad[ao]|floral|listrad[ao]|xadrez)\b/i.test(lowerText) ? 'estampado' : undefined,
  };

  const canonicalDescription = buildCanonicalDescription(attrs);

  return {
    attributes: attrs,
    canonicalDescription,
    confidence: 0.90,
    detectedCategory: categoria,
    suggestedTitle,
    estimatedPriceCents,
  };
}
