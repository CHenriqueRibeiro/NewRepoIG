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
    if (isMock) return false;

    // Remove produtos corrompidos com nomes incorretos (ex: "Novidades preto")
    const name = String(p.name || p.title || '').trim().toLowerCase();
    if (name === 'novidades preto' || name === 'novidade preto' || name.startsWith('novidades preto')) {
      return false;
    }

    // REGRA DO LOJISTA: Produtos só entram na vitrine pública se tiverem valor cadastrado (> 0)
    if (!p.price || p.price <= 0) {
      return false;
    }

    return true;
  });
}

import { getActiveInstagramSession } from '@/lib/instagram/auth';

// Memória global para o servidor Next.js durante a execução
declare global {
  var __vitryneCatalogStore: Record<string, CatalogConfig> | undefined;
  var __vitryneCatalogUserCustomized: Set<string> | undefined;
  var __vitryneActiveStoreSlug: string | undefined;
  var __vitryneStoreProfiles: Record<string, { accountId?: string; storeName: string; slug: string; instagramUsername?: string }> | undefined;
}

if (!global.__vitryneCatalogStore) {
  global.__vitryneCatalogStore = {};
}
if (!global.__vitryneCatalogUserCustomized) {
  global.__vitryneCatalogUserCustomized = new Set();
}
if (!global.__vitryneStoreProfiles) {
  global.__vitryneStoreProfiles = {};
}

/**
 * Converte um nome ou @handle do Instagram em um slug seguro para URLs
 */
export function slugifyStoreName(nameOrHandle: string): string {
  return (nameOrHandle || '')
    .toLowerCase()
    .trim()
    .replace(/^@+/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'vitrine';
}

/**
 * Gera um slug único garantido. Caso já exista outra loja/perfil com o mesmo nome/slug,
 * adiciona um discriminador sequencial (-2, -3) ou sufixo do ID para nunca colidir.
 */
export function generateUniqueStoreSlug(
  baseNameOrSlug: string,
  currentSlug?: string,
  accountId?: string
): string {
  const base = slugifyStoreName(baseNameOrSlug);
  const cleanCurrent = currentSlug ? currentSlug.toLowerCase().trim() : undefined;

  // Se o próprio slug atual já for igual, não há conflito com ele mesmo
  if (cleanCurrent && base === cleanCurrent) {
    return cleanCurrent;
  }

  // Lista de todos os slugs já registrados
  const existingSlugs = new Set<string>();
  if (global.__vitryneCatalogStore) {
    Object.keys(global.__vitryneCatalogStore).forEach((s) => existingSlugs.add(s.toLowerCase()));
  }
  if (global.__vitryneStoreProfiles) {
    Object.keys(global.__vitryneStoreProfiles).forEach((s) => existingSlugs.add(s.toLowerCase()));
  }
  // Templates protegidos
  TEMPLATES.forEach((t) => existingSlugs.add(t.config.slug.toLowerCase()));

  // Se o slug base não estiver em uso (ou for o próprio atual), usa ele
  if (!existingSlugs.has(base) || base === cleanCurrent) {
    return base;
  }

  // Se o slug pertence a outra loja, adiciona sufixo numérico
  let counter = 2;
  let candidate = `${base}-${counter}`;
  while (existingSlugs.has(candidate) && candidate !== cleanCurrent) {
    counter++;
    candidate = `${base}-${counter}`;
  }

  return candidate;
}

/**
 * Gera um nome de exibição de loja único caso já exista outra com o mesmo nome
 */
export function generateUniqueStoreName(
  baseName: string,
  currentSlug?: string,
  accountId?: string
): string {
  const trimmed = (baseName || '').trim();
  if (!trimmed || trimmed.toLowerCase() === 'minha loja') {
    // Resolve com o nome real do perfil conectado
    const session = getActiveInstagramSession();
    if (session?.account?.name) return session.account.name;
    if (session?.account?.username) return session.account.username;
    return process.env.INSTAGRAM_ACCOUNT_NAME || 'Quota';
  }

  const cleanCurrent = currentSlug ? currentSlug.toLowerCase().trim() : undefined;
  const existingNames = new Map<string, string>(); // lowercase -> slug

  if (global.__vitryneCatalogStore) {
    Object.entries(global.__vitryneCatalogStore).forEach(([s, cat]) => {
      if (cat.storeName) existingNames.set(cat.storeName.toLowerCase().trim(), s);
    });
  }
  if (global.__vitryneStoreProfiles) {
    Object.values(global.__vitryneStoreProfiles).forEach((p) => {
      if (p.storeName) existingNames.set(p.storeName.toLowerCase().trim(), p.slug);
    });
  }

  const existingSlug = existingNames.get(trimmed.toLowerCase());
  // Se não existe ou pertence à mesma loja, está liberado
  if (!existingSlug || existingSlug === cleanCurrent) {
    return trimmed;
  }

  // Se já existe outra loja com esse exato nome, gera discriminador amigável
  let counter = 2;
  let candidate = `${trimmed} ${counter}`;
  while (existingNames.has(candidate.toLowerCase()) && existingNames.get(candidate.toLowerCase()) !== cleanCurrent) {
    counter++;
    candidate = `${trimmed} ${counter}`;
  }

  return candidate;
}

/**
 * Validação para edição e evento blur na tela de customização da loja
 */
export function validateStoreUniqueness(
  name: string,
  slug: string,
  currentSlug?: string,
  accountId?: string
): {
  isValid: boolean;
  isNameDuplicate: boolean;
  isSlugDuplicate: boolean;
  suggestedName: string;
  suggestedSlug: string;
  message?: string;
} {
  const cleanCurrent = currentSlug ? currentSlug.toLowerCase().trim() : undefined;
  const targetName = (name || '').trim();
  const targetSlug = slugifyStoreName(slug || name);

  let isNameDuplicate = false;
  let isSlugDuplicate = false;

  // 1. Verifica duplicidade de Slug
  const existingSlugs = new Set<string>();
  if (global.__vitryneCatalogStore) {
    Object.keys(global.__vitryneCatalogStore).forEach((s) => existingSlugs.add(s.toLowerCase()));
  }
  if (global.__vitryneStoreProfiles) {
    Object.keys(global.__vitryneStoreProfiles).forEach((s) => existingSlugs.add(s.toLowerCase()));
  }
  if (existingSlugs.has(targetSlug) && targetSlug !== cleanCurrent && targetSlug !== 'minha-loja') {
    isSlugDuplicate = true;
  }

  // 2. Verifica duplicidade de Nome
  const existingNames = new Map<string, string>();
  if (global.__vitryneCatalogStore) {
    Object.entries(global.__vitryneCatalogStore).forEach(([s, cat]) => {
      if (cat.storeName) existingNames.set(cat.storeName.toLowerCase().trim(), s);
    });
  }
  if (global.__vitryneStoreProfiles) {
    Object.values(global.__vitryneStoreProfiles).forEach((p) => {
      if (p.storeName) existingNames.set(p.storeName.toLowerCase().trim(), p.slug);
    });
  }
  const registeredSlugForName = existingNames.get(targetName.toLowerCase());
  if (
    registeredSlugForName &&
    registeredSlugForName !== cleanCurrent &&
    targetName.toLowerCase() !== 'minha loja'
  ) {
    isNameDuplicate = true;
  }

  const suggestedName = generateUniqueStoreName(targetName, cleanCurrent, accountId);
  const suggestedSlug = generateUniqueStoreSlug(targetSlug, cleanCurrent, accountId);

  const isValid = !isNameDuplicate && !isSlugDuplicate;
  let message = 'Nome e link exclusivos disponíveis.';
  if (isNameDuplicate && isSlugDuplicate) {
    message = `Já existe outro perfil com este nome e link. Sugerimos "${suggestedName}" (${suggestedSlug}) para não haver repetição.`;
  } else if (isNameDuplicate) {
    message = `Já existe outro perfil com este nome. Sugerimos "${suggestedName}" para não haver repetição.`;
  } else if (isSlugDuplicate) {
    message = `Este link vitryne.com/${targetSlug} já está em uso por outro perfil. Sugerimos vitryne.com/${suggestedSlug}.`;
  }

  return {
    isValid,
    isNameDuplicate,
    isSlugDuplicate,
    suggestedName,
    suggestedSlug,
    message,
  };
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

// Inicializa catálogo padrão inicial vinculado ao perfil ativo do Instagram
const initialSession = getActiveInstagramSession();
const resolvedInitialName =
  initialSession?.account?.name ||
  initialSession?.account?.username ||
  process.env.INSTAGRAM_ACCOUNT_NAME ||
  'Quota';
const resolvedInitialHandle = initialSession?.account?.username
  ? `@${initialSession.account.username.replace(/^@/, '')}`
  : '@app_quota';
const resolvedInitialSlug = generateUniqueStoreSlug(resolvedInitialName, undefined, initialSession?.account?.id);

// Garante que 'minha-loja' sempre responda com o nome do perfil ativo em vez de 'Minha Loja'
if (!global.__vitryneCatalogUserCustomized!.has('minha-loja')) {
  const defaultCat = getDefaultCatalog();
  global.__vitryneCatalogStore!['minha-loja'] = {
    ...defaultCat,
    slug: 'minha-loja',
    storeName: resolvedInitialName,
    instagram: resolvedInitialHandle,
    products: [],
  };
}

// Registra também o slug oficial baseado no perfil
if (!global.__vitryneCatalogStore![resolvedInitialSlug]) {
  const defaultCat = getDefaultCatalog();
  global.__vitryneCatalogStore![resolvedInitialSlug] = {
    ...defaultCat,
    slug: resolvedInitialSlug,
    storeName: resolvedInitialName,
    instagram: resolvedInitialHandle,
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
 * Sempre utiliza o nome e @handle real do perfil conectado (sem fallback para 'Minha Loja').
 */
export function resolveActiveStoreIdentity(sessionAccount?: {
  id?: string;
  name?: string;
  username?: string;
}): ActiveStoreIdentity {
  const activeSession = getActiveInstagramSession();
  const account = sessionAccount || activeSession?.account;

  // 1. Catálogo explicitamente ativo ou customizado pelo lojista
  if (
    global.__vitryneActiveStoreSlug &&
    global.__vitryneCatalogStore?.[global.__vitryneActiveStoreSlug]
  ) {
    const custom = global.__vitryneCatalogStore[global.__vitryneActiveStoreSlug];
    const profileName = (custom.storeName && custom.storeName !== 'Minha Loja')
      ? custom.storeName
      : (account?.name || account?.username || process.env.INSTAGRAM_ACCOUNT_NAME || 'Quota');

    return {
      storeId: custom.slug,
      storeName: profileName,
      slug: custom.slug,
    };
  }

  // Se houver algum catálogo no Set de customizados
  const customSlugs = Array.from(global.__vitryneCatalogUserCustomized || []);
  if (customSlugs.length > 0 && global.__vitryneCatalogStore?.[customSlugs[0]]) {
    const custom = global.__vitryneCatalogStore[customSlugs[0]];
    const profileName = (custom.storeName && custom.storeName !== 'Minha Loja')
      ? custom.storeName
      : (account?.name || account?.username || process.env.INSTAGRAM_ACCOUNT_NAME || 'Quota');

    return {
      storeId: custom.slug,
      storeName: profileName,
      slug: custom.slug,
    };
  }

  // 2. Se ainda não customizou, gera identificador único baseado no perfil conectado
  const rawName = account?.name || account?.username || process.env.INSTAGRAM_ACCOUNT_NAME || 'Quota';
  const rawId = account?.id || 'demo';
  const uniqueStoreName = generateUniqueStoreName(rawName, undefined, rawId);
  const uniqueSlug = generateUniqueStoreSlug(rawName, undefined, rawId);

  // Registra automaticamente a loja única na memória com catálogo limpo
  if (!global.__vitryneCatalogStore![uniqueSlug]) {
    global.__vitryneCatalogStore![uniqueSlug] = {
      ...getDefaultCatalog(),
      slug: uniqueSlug,
      storeName: uniqueStoreName,
      instagram: account?.username ? `@${account.username.replace(/^@/, '')}` : '@app_quota',
      products: [],
    };
  }

  return {
    storeId: rawId,
    storeName: uniqueStoreName,
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
  if (!global.__vitryneStoreProfiles) {
    global.__vitryneStoreProfiles = {};
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

  // Mantém registro atualizado no StoreProfiles
  global.__vitryneStoreProfiles[cleanSlug] = {
    slug: cleanSlug,
    storeName: merged.storeName,
    instagramUsername: merged.instagram?.replace(/^@/, ''),
  };
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
