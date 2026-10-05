/**
 * Helper para URLs Amigáveis e Limpas no Catálogo Vitryne
 * Transforma URLs técnicas (/c/loja?p=123) em URLs elegantes de e-commerce:
 * Exemplo: vitryne.com.br/minha-loja/blusas/blusa-amarela
 */

declare global {
  var __publicBaseUrl: string | undefined;
}

export function getPublicAppUrl(): string {
  if (global.__publicBaseUrl && !global.__publicBaseUrl.includes('localhost') && !global.__publicBaseUrl.includes('127.0.0.1')) {
    return global.__publicBaseUrl;
  }
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }
  return global.__publicBaseUrl || envUrl || 'http://localhost:3000';
}

export function setPublicAppUrl(url: string) {
  if (url && !url.includes('localhost') && !url.includes('127.0.0.1')) {
    global.__publicBaseUrl = url.replace(/\/$/, '');
  }
}

export function slugify(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // substitui caracteres especiais por hífen
    .replace(/^-+|-+$/g, ''); // remove hífens no início e fim
}

export function buildProductCleanUrl(
  baseUrl: string,
  storeSlug: string,
  product: { title: string; category?: string; id: string }
): string {
  const cleanBase = baseUrl.replace(/\/$/, '');
  const cleanStore = slugify(storeSlug || 'minha-loja');
  const cleanCat = product.category ? slugify(product.category) : '';
  const cleanProd = slugify(product.title) || slugify(product.id);

  if (cleanCat) {
    return `${cleanBase}/${cleanStore}/${cleanCat}/${cleanProd}`;
  }
  return `${cleanBase}/${cleanStore}/${cleanProd}`;
}

export function matchProductBySlug(
  products: any[],
  slugOrId: string
): any | undefined {
  if (!slugOrId) return undefined;
  const cleanTarget = slugify(slugOrId);

  return products.find((p) => {
    const idSlug = slugify(p.id || '');
    const titleSlug = slugify(p.title || p.name || '');
    return (
      idSlug === cleanTarget ||
      titleSlug === cleanTarget ||
      idSlug.includes(cleanTarget) ||
      cleanTarget.includes(idSlug) ||
      titleSlug.includes(cleanTarget) ||
      cleanTarget.includes(titleSlug)
    );
  });
}

export function matchCategoryBySlug(
  categories: string[],
  categorySlug: string
): string | undefined {
  if (!categorySlug) return undefined;
  const cleanTarget = slugify(categorySlug);

  return categories.find((cat) => {
    const cSlug = slugify(cat);
    return cSlug === cleanTarget || cSlug.includes(cleanTarget) || cleanTarget.includes(cSlug);
  });
}
