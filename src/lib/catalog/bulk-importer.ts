import * as XLSX from 'xlsx';
import type { ProductItem } from './types.ts';

export interface RawProductRow {
  name?: string;
  price?: string | number;
  category?: string;
  stock?: string | number;
  description?: string;
  images?: string | string[];
  sizes?: string;
  colors?: string;
  badge?: string;
  [key: string]: any;
}

export interface RejectedRow {
  rowIndex: number;
  raw: Record<string, any>;
  reasons: string[];
}

export interface ImportValidationResult {
  validProducts: ProductItem[];
  rejectedRows: RejectedRow[];
  totalParsed: number;
}

/**
 * Normaliza chaves de objetos para facilitar o mapeamento de colunas em português e inglês
 */
export function normalizeRowKeys(row: Record<string, any>): Record<string, any> {
  const normalized: Record<string, any> = {};

  for (const [key, value] of Object.entries(row)) {
    const cleanKey = key
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove acentos
      .trim();

    if (/^(nome|name|titulo|title|produto)$/.test(cleanKey)) {
      normalized.name = value;
    } else if (/^(preco|price|valor|custo)$/.test(cleanKey)) {
      normalized.price = value;
    } else if (/^(categoria|category|topico|modulo|departamento)$/.test(cleanKey)) {
      normalized.category = value;
    } else if (/^(descricao|description|detalhes|resumo)$/.test(cleanKey)) {
      normalized.description = value;
    } else if (/^(estoque|stock|qtd|quantidade|unidades)$/.test(cleanKey)) {
      normalized.stock = value;
    } else if (/^(imagem|image|foto|fotos|imagens|image_url|url)$/.test(cleanKey)) {
      normalized.images = value;
    } else if (/^(tamanhos|tamanho|sizes|size)$/.test(cleanKey)) {
      normalized.sizes = value;
    } else if (/^(cores|cor|colors|color)$/.test(cleanKey)) {
      normalized.colors = value;
    } else if (/^(etiqueta|selo|badge|tag)$/.test(cleanKey)) {
      normalized.badge = value;
    } else {
      normalized[cleanKey] = value;
    }
  }

  return normalized;
}

/**
 * Validação rigorosa de cada linha de produto:
 * Conforme instrução do usuário: "tem que ter todos os dados senao o item nao sobe"
 */
export function validateAndSanitizeProductRow(
  rawRow: Record<string, any>,
  rowIndex: number,
  defaultCategory?: string
): { product: ProductItem | null; reasons: string[] } {
  const raw = normalizeRowKeys(rawRow);
  const reasons: string[] = [];

  // 1. NOME
  const rawName = String(raw.name || '').trim();
  if (!rawName || rawName.length < 2) {
    reasons.push('Nome/Título obrigatório (mínimo 2 caracteres)');
  }

  // 2. PREÇO (Obrigatório > 0)
  const rawPrice = raw.price;
  let parsedPrice = 0;
  if (typeof rawPrice === 'number') {
    parsedPrice = rawPrice;
  } else if (typeof rawPrice === 'string') {
    const cleaned = rawPrice.replace(/[R$\s]/gi, '').trim();
    if (cleaned.includes(',') && !cleaned.includes('.')) {
      parsedPrice = parseFloat(cleaned.replace(',', '.'));
    } else if (cleaned.includes('.') && cleaned.includes(',')) {
      parsedPrice = parseFloat(cleaned.replace(/\./g, '').replace(',', '.'));
    } else {
      parsedPrice = parseFloat(cleaned);
    }
  }

  if (isNaN(parsedPrice) || parsedPrice <= 0) {
    reasons.push('Preço obrigatório maior que zero (itens sem valor não podem ser cadastrados)');
  }

  // 3. CATEGORIA
  const rawCat = String(raw.category || defaultCategory || '').trim();
  if (!rawCat || rawCat.length < 2) {
    reasons.push('Categoria/Tópico obrigatório');
  }

  // 4. DESCRIÇÃO
  const rawDesc = String(raw.description || '').trim();
  if (!rawDesc || rawDesc.length < 2) {
    reasons.push('Descrição obrigatória');
  }

  // 5. IMAGEM
  let parsedImages: string[] = [];
  const rawImg = raw.images;
  if (Array.isArray(rawImg)) {
    parsedImages = rawImg.map(String).filter((s) => s.startsWith('http') || s.startsWith('/'));
  } else if (typeof rawImg === 'string' && rawImg.trim()) {
    parsedImages = rawImg
      .split(/[,;\n|]/)
      .map((s) => s.trim())
      .filter((s) => s.startsWith('http') || s.startsWith('/'));
  }

  if (parsedImages.length === 0) {
    reasons.push('Link de Foto/Imagem obrigatório (URL válida iniciando com http ou /)');
  }

  // 6. ESTOQUE
  const rawStock = raw.stock;
  let parsedStock = 1;
  if (rawStock !== undefined && rawStock !== null && String(rawStock).trim() !== '') {
    const s = parseInt(String(rawStock));
    if (isNaN(s) || s < 1) {
      reasons.push('Estoque inválido (deve ser no mínimo 1 unidade)');
    } else {
      parsedStock = s;
    }
  }

  if (reasons.length > 0) {
    return { product: null, reasons };
  }

  // Campos complementares opcionais
  const sizes = raw.sizes
    ? String(raw.sizes).split(/[,;/]/).map((s) => s.trim()).filter(Boolean)
    : undefined;

  const colors = raw.colors
    ? String(raw.colors).split(/[,;/]/).map((s) => s.trim()).filter(Boolean)
    : undefined;

  const badge = raw.badge ? String(raw.badge).trim() : undefined;

  const product: ProductItem = {
    id: `prod_bulk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: rawName,
    price: parsedPrice,
    category: rawCat,
    description: rawDesc,
    images: parsedImages,
    stock: parsedStock,
    sizes,
    colors,
    badge,
    isUniquePiece: parsedStock === 1,
    paymentBadge: 'PIX ou Cartão',
    maxInstallments: 3,
    installmentWithoutInterest: true,
  };

  return { product, reasons: [] };
}

/**
 * Faz o parse de arquivo Excel (.xlsx, .xls) ou CSV via buffer ou string
 */
export function parseExcelOrCsv(data: ArrayBuffer | Uint8Array | string, defaultCategory?: string): ImportValidationResult {
  const workbook = typeof data === 'string'
    ? XLSX.read(data, { type: 'string' })
    : XLSX.read(data, { type: 'array' });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    return { validProducts: [], rejectedRows: [], totalParsed: 0 };
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  const validProducts: ProductItem[] = [];
  const rejectedRows: RejectedRow[] = [];

  rawRows.forEach((row, idx) => {
    // Ignora linhas totalmente vazias
    const hasAnyValue = Object.values(row).some((val) => String(val).trim() !== '');
    if (!hasAnyValue) return;

    const { product, reasons } = validateAndSanitizeProductRow(row, idx + 1, defaultCategory);
    if (product) {
      validProducts.push(product);
    } else {
      rejectedRows.push({
        rowIndex: idx + 1,
        raw: row,
        reasons,
      });
    }
  });

  return {
    validProducts,
    rejectedRows,
    totalParsed: rawRows.length,
  };
}

/**
 * Faz o parse de tabelas ou blocos em Markdown
 */
export function parseMarkdown(markdownText: string, defaultCategory?: string): ImportValidationResult {
  const lines = markdownText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const validProducts: ProductItem[] = [];
  const rejectedRows: RejectedRow[] = [];
  let totalParsed = 0;

  // 1. Tenta identificar Tabela Markdown (| Col1 | Col2 | ...)
  const tableLines = lines.filter((l) => l.startsWith('|') && l.endsWith('|'));

  if (tableLines.length >= 2) {
    // Linha 0: cabeçalho
    const headerCells = tableLines[0]
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim());

    // Se a linha 1 for separador markdown (|---|---|), os dados começam na linha 2
    const dataStartIndex = tableLines[1].replace(/[\s\-|:]/g, '') === '' ? 2 : 1;

    for (let i = dataStartIndex; i < tableLines.length; i++) {
      totalParsed++;
      const cells = tableLines[i]
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim());

      const rowObj: Record<string, any> = {};
      headerCells.forEach((header, colIdx) => {
        rowObj[header] = cells[colIdx] || '';
      });

      const { product, reasons } = validateAndSanitizeProductRow(rowObj, i + 1, defaultCategory);
      if (product) {
        validProducts.push(product);
      } else {
        rejectedRows.push({
          rowIndex: i + 1,
          raw: rowObj,
          reasons,
        });
      }
    }

    return { validProducts, rejectedRows, totalParsed };
  }

  // 2. Formato de Bloco Markdown:
  // ### Nome do Produto
  // - Preço: 149.90
  // - Categoria: Vestidos
  // - Estoque: 5
  // - Descrição: Vestido fluido maravilhoso
  // - Imagem: https://...
  const blocks: Record<string, any>[] = [];
  let currentBlock: Record<string, any> | null = null;

  for (const line of lines) {
    if (line.startsWith('#') || line.startsWith('**Nome:**') || line.startsWith('Nome:')) {
      if (currentBlock && Object.keys(currentBlock).length > 0) {
        blocks.push(currentBlock);
      }
      const rawTitle = line.replace(/^#+\s*/, '').replace(/^\*\*Nome:\*\*\s*/i, '').replace(/^Nome:\s*/i, '').trim();
      currentBlock = { name: rawTitle };
    } else if (currentBlock) {
      const match = line.match(/^[-*•]?\s*\*?([a-zA-Záàâãéèêíïóôõöúçñ\s]+)\*?:\s*(.+)$/i);
      if (match) {
        const key = match[1].trim();
        const val = match[2].trim();
        currentBlock[key] = val;
      }
    }
  }

  if (currentBlock && Object.keys(currentBlock).length > 0) {
    blocks.push(currentBlock);
  }

  blocks.forEach((block, idx) => {
    totalParsed++;
    const { product, reasons } = validateAndSanitizeProductRow(block, idx + 1, defaultCategory);
    if (product) {
      validProducts.push(product);
    } else {
      rejectedRows.push({
        rowIndex: idx + 1,
        raw: block,
        reasons,
      });
    }
  });

  return {
    validProducts,
    rejectedRows,
    totalParsed,
  };
}

/**
 * Gera exemplo de modelo CSV pronto para download ou cópia
 */
export function getSampleCsvTemplate(): string {
  return `Nome,Preço,Categoria,Estoque,Descrição,Imagem,Tamanhos,Cores
Vestido Floral Midi,189.90,Vestidos,4,Vestido floral com modelagem evasê e caimento fluido,https://images.unsplash.com/photo-1572804013309-8472506b3a04?w=800,P; M; G,Vermelho
Blusa Viscose Amarela,89.90,Blusas,6,Blusa feminina confeccionada em viscose premium gola V,https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800,P; M,Amarelo
Colônia O Boticário Vintage 115ml,149.90,Perfumaria,2,Fragrância clássica original de colecionador tampa azul,https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800,115ml,Âmbar`;
}

/**
 * Gera exemplo de modelo Markdown pronto para cópia
 */
export function getSampleMarkdownTemplate(): string {
  return `| Nome | Preço | Categoria | Estoque | Descrição | Imagem |
| --- | --- | --- | --- | --- | --- |
| Vestido Floral Midi | 189,90 | Vestidos | 4 | Vestido floral com caimento fluido elegante | https://images.unsplash.com/photo-1572804013309-8472506b3a04?w=800 |
| Blusa Manga Curta Viscose | 89,90 | Blusas | 6 | Blusa amarela gola V em viscose premium | https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800 |
| Relógio Casio G-Shock All Black | 389,90 | Relógios | 2 | Relógio resistente à água 200m com display anadigi | https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800 |`;
}
