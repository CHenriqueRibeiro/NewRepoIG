import { CatalogConfig } from './types';
import { getDefaultCatalog, TEMPLATES } from './templates';

const STORAGE_KEY = 'vitryne_catalog_config';

function cleanMockProducts(products?: any[]): any[] {
  if (!Array.isArray(products)) return [];
  return products.filter((p) => {
    if (!p || !p.id) return false;
    const id = String(p.id);
    const isMock =
      id.startsWith('prod-watch') ||
      id.startsWith('prod-smart') ||
      id.startsWith('prod-phone') ||
      id.startsWith('prod-fone') ||
      id.startsWith('prod-pulseira') ||
      id.startsWith('prod-j') ||
      id.startsWith('prod-b') ||
      id.startsWith('prod-f') ||
      id.startsWith('prod-m') ||
      id.startsWith('prod-s') ||
      id.startsWith('prod-p') ||
      id.startsWith('prod-c') ||
      id.startsWith('prod-a') ||
      id.startsWith('prod-l') ||
      id.startsWith('prod-k') ||
      id.startsWith('tech-');
    return !isMock;
  });
}

// Memória global para o servidor Next.js durante a execução
declare global {
  var __vitryneCatalogStore: Record<string, CatalogConfig> | undefined;
  var __vitryneCatalogUserCustomized: Set<string> | undefined;
  var __vitryneActiveStoreSlug: string | undefined;
}

if (!global.__vitryneCatalogStore) {
  global.__vitryneCatalogStore = {};
}
if (!global.__vitryneCatalogUserCustomized) {
  global.__vitryneCatalogUserCustomized = new Set();
}

// Sincroniza templates definidos em código com a store global (sem produtos mockados)
TEMPLATES.forEach((template) => {
  if (!global.__vitryneCatalogUserCustomized!.has(template.config.slug)) {
    global.__vitryneCatalogStore![template.config.slug] = JSON.parse(
      JSON.stringify({
        ...template.config,
        products: [],
      })
    );
  }
});

// Se minha-loja não foi customizado pelo usuário, atualiza com getDefaultCatalog()
if (!global.__vitryneCatalogUserCustomized!.has('minha-loja')) {
  const defaultCat = getDefaultCatalog();
  global.__vitryneCatalogStore!['minha-loja'] = {
    ...defaultCat,
    slug: 'minha-loja',
    storeName: process.env.INSTAGRAM_ACCOUNT_NAME || 'Quota',
    products: [],
  };
}

export interface ActiveStoreIdentity {
  storeId: string;
  storeName: string;
  slug: string;
}

/**
 * Resolve a identidade única da loja para envio de links ao cliente.
 * 1. Se o lojista criou/customizou um catálogo no sistema, usa o link criado por ele.
 * 2. Se ainda não criou, gera um identificador único com [nome]-[id] da conta conectada.
 */
export function resolveActiveStoreIdentity(sessionAccount?: {
  id?: string;
  name?: string;
  username?: string;
}): ActiveStoreIdentity {
  // 1. Catálogo explicitamente ativo ou customizado pelo lojista
  if (
    global.__vitryneActiveStoreSlug &&
    global.__vitryneCatalogStore?.[global.__vitryneActiveStoreSlug]
  ) {
    const custom = global.__vitryneCatalogStore[global.__vitryneActiveStoreSlug];
    return {
      storeId: custom.slug,
      storeName: custom.storeName || 'Minha Loja',
      slug: custom.slug,
    };
  }

  // Se houver algum catálogo no Set de customizados
  const customSlugs = Array.from(global.__vitryneCatalogUserCustomized || []);
  if (customSlugs.length > 0 && global.__vitryneCatalogStore?.[customSlugs[0]]) {
    const custom = global.__vitryneCatalogStore[customSlugs[0]];
    return {
      storeId: custom.slug,
      storeName: custom.storeName || 'Minha Loja',
      slug: custom.slug,
    };
  }

  // 2. Se ainda não criou o catálogo personalizado, gera um identificador único [nome]-[id]
  const rawName = sessionAccount?.name || 'loja';
  const rawId = sessionAccount?.id || 'demo';

  const cleanName = rawName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'loja';

  const uniqueSlug = `${cleanName}-${rawId}`;

  // Registra automaticamente a loja única na memória com catálogo limpo
  if (!global.__vitryneCatalogStore![uniqueSlug]) {
    global.__vitryneCatalogStore![uniqueSlug] = {
      ...getDefaultCatalog(),
      slug: uniqueSlug,
      storeName: sessionAccount?.name || process.env.INSTAGRAM_ACCOUNT_NAME || 'Quota',
      products: [],
    };
  }

  return {
    storeId: rawId,
    storeName: sessionAccount?.name || process.env.INSTAGRAM_ACCOUNT_NAME || 'Quota',
    slug: uniqueSlug,
  };
}

export function getServerCatalog(slug?: string): CatalogConfig {
  if (!global.__vitryneCatalogStore) {
    global.__vitryneCatalogStore = {};
  }

  // Se nenhum slug for especificado, busca o catálogo ativo do lojista
  const targetSlug =
    slug ||
    global.__vitryneActiveStoreSlug ||
    Array.from(global.__vitryneCatalogUserCustomized || [])[0] ||
    'minha-loja';
  const cleanSlug = targetSlug.toLowerCase().trim();
  let result: CatalogConfig;

  if (global.__vitryneCatalogStore[cleanSlug]) {
    result = global.__vitryneCatalogStore[cleanSlug];
  } else {
    const template = TEMPLATES.find((t) => t.id === cleanSlug || t.config.slug === cleanSlug);
    if (template && !global.__vitryneCatalogUserCustomized?.has(template.config.slug)) {
      result = JSON.parse(JSON.stringify(template.config));
    } else {
      const parts = cleanSlug.split('-');
      const formattedStoreName =
        parts.length > 1 && /^\d+$/.test(parts[parts.length - 1])
          ? parts
              .slice(0, -1)
              .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
              .join(' ')
          : cleanSlug === 'minha-loja'
          ? (process.env.INSTAGRAM_ACCOUNT_NAME || 'Quota')
          : cleanSlug.charAt(0).toUpperCase() + cleanSlug.slice(1);

      result = {
        ...getDefaultCatalog(),
        slug: cleanSlug,
        storeName: formattedStoreName,
        products: [],
      };
      global.__vitryneCatalogStore[cleanSlug] = result;
    }
  }

  result.products = cleanMockProducts(result.products);
  if (!result.shipping) {
    result.shipping = { ...getDefaultCatalog().shipping };
  }
  return result;
}

export function saveServerCatalog(catalog: CatalogConfig): void {
  if (!global.__vitryneCatalogStore) {
    global.__vitryneCatalogStore = {};
  }
  if (!global.__vitryneCatalogUserCustomized) {
    global.__vitryneCatalogUserCustomized = new Set();
  }
  const cleanSlug = (catalog.slug || 'minha-loja').toLowerCase().trim();
  const existing = global.__vitryneCatalogStore[cleanSlug] || getDefaultCatalog();
  const merged: CatalogConfig = {
    ...getDefaultCatalog(),
    ...existing,
    ...catalog,
    slug: cleanSlug,
  };
  merged.products = cleanMockProducts(merged.products);
  if (!merged.shipping) {
    merged.shipping = { ...getDefaultCatalog().shipping };
  }
  global.__vitryneCatalogStore[cleanSlug] = merged;
  global.__vitryneCatalogUserCustomized.add(cleanSlug);
  global.__vitryneActiveStoreSlug = cleanSlug;
}

export function clearServerCatalogStore(): void {
  global.__vitryneCatalogStore = {};
  global.__vitryneCatalogUserCustomized = new Set();
  global.__vitryneCatalogStore['minha-loja'] = {
    ...getDefaultCatalog(),
    slug: 'minha-loja',
    storeName: process.env.INSTAGRAM_ACCOUNT_NAME || 'Quota',
    products: [],
  };
}

/**
 * Determina se o catálogo foi criado/aprovado pelo lojista e possui produtos válidos
 * para ter seu link compartilhado publicamente com clientes.
 * Se o catálogo estiver vazio (0 produtos) ou não tiver sido configurado, NENHUM link deve ser enviado.
 */
export function isCatalogPublishable(catalog?: CatalogConfig | null): boolean {
  if (!catalog) return false;
  const products = (catalog.products || []).filter((p) => {
    const id = String(p?.id || '');
    return !id.startsWith('prod-') && !id.startsWith('tech-');
  });

  // Se não há produtos cadastrados na vitrine, não deve ter link
  if (products.length === 0) return false;

  const isCustomized = Boolean(
    catalog.templateChosen ||
    catalog.isPublished ||
    (global.__vitryneCatalogUserCustomized && global.__vitryneCatalogUserCustomized.has(catalog.slug))
  );

  return isCustomized && products.length > 0;
}

// Client-side helpers
export function getClientCatalog(): CatalogConfig {
  if (typeof window === 'undefined') {
    return getDefaultCatalog();
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed: CatalogConfig = JSON.parse(saved);
      parsed.products = cleanMockProducts(parsed.products);
      if (!parsed.topics || parsed.topics.length === 0) {
        parsed.topics = Array.from(
          new Set((parsed.products || []).map((p) => p.category).filter(Boolean))
        );
      }
      if (parsed.topicIcons) {
        if (parsed.topicIcons['PULSEIRAS'] === 'gem') parsed.topicIcons['PULSEIRAS'] = 'bracelet';
        if (parsed.topicIcons['BRACELETES'] === 'gem') parsed.topicIcons['BRACELETES'] = 'bangle';
        if (parsed.topicIcons['Pulseiras'] === 'gem') parsed.topicIcons['Pulseiras'] = 'bracelet';
        if (parsed.topicIcons['Braceletes'] === 'gem') parsed.topicIcons['Braceletes'] = 'bangle';
        if (parsed.topicIcons['Pulseiras & Braceletes'] === 'gem') parsed.topicIcons['Pulseiras & Braceletes'] = 'bracelet';
      }
      return parsed;
    }
  } catch (e) {
    console.error('Erro ao ler localStorage do catálogo:', e);
  }

  return getDefaultCatalog();
}

export function saveClientCatalog(config: CatalogConfig): void {
  if (typeof window === 'undefined') return;

  try {
    config.products = cleanMockProducts(config.products);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Erro ao salvar no localStorage:', e);
  }
}
