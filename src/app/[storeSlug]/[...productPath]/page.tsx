'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { notFound } from 'next/navigation';
import PublicCatalogView from '@/components/catalog/PublicCatalogView';
import DedicatedProductPage from '@/components/catalog/DedicatedProductPage';
import { getTemplateById, getDefaultCatalog } from '@/lib/catalog/templates';
import { matchProductBySlug, matchCategoryBySlug } from '@/lib/catalog/url-helpers';
import { CatalogConfig, ProductItem } from '@/lib/catalog/types';

const RESERVED_SLUGS = new Set([
  'api',
  'c',
  'catalogo',
  'checkout',
  'dashboard',
  'login',
  'planos',
  'settings',
  'favicon.ico',
  '_next',
]);

/**
 * Rota Limpa para Categoria e Produto: /[storeSlug]/[...productPath]
 * Exemplos:
 * - Produto com Categoria: vitryne.com.br/minha-loja/blusas/blusa-amarela -> Abre DedicatedProductPage (PDP)
 * - Produto Direto: vitryne.com.br/minha-loja/blusa-amarela -> Abre DedicatedProductPage (PDP)
 * - Categoria: vitryne.com.br/minha-loja/blusas -> Abre Catálogo filtrado por blusas
 */
export default function StoreProductPage({
  params,
}: {
  params: { storeSlug: string; productPath: string[] };
}) {
  const storeSlug = params.storeSlug;
  const productPath = params.productPath || [];

  if (RESERVED_SLUGS.has(storeSlug.toLowerCase())) {
    notFound();
  }

  const initialCatalog = useMemo(() => {
    const tmpl = getTemplateById(storeSlug);
    if (tmpl) return tmpl.config;
    const def = getDefaultCatalog();
    return {
      ...def,
      slug: storeSlug,
      storeName: storeSlug === 'minha-loja' ? 'Minha Loja' : storeSlug,
      products: [],
    };
  }, [storeSlug]);

  const [catalog, setCatalog] = useState<CatalogConfig>(initialCatalog);

  useEffect(() => {
    async function loadFreshCatalog() {
      try {
        const res = await fetch(`/api/catalog/${storeSlug}`);
        if (res.ok) {
          const data = await res.json();
          if (data.catalog) {
            setCatalog(data.catalog);
          }
        }
      } catch (err) {
        console.warn('Erro ao atualizar catálogo em StoreProductPage:', err);
      }
    }
    loadFreshCatalog();
  }, [storeSlug]);

  // Resolução inteligente: se a rota aponta para um produto específico, abre a Página Dedicada (PDP)
  const matchedProduct: ProductItem | undefined = useMemo(() => {
    const products = catalog.products || [];
    if (!productPath.length || !products.length) return undefined;

    // Caso 1: Rota com categoria + produto (ex: ['blusas', 'produto-slug'])
    if (productPath.length >= 2) {
      const productSlugCandidate = productPath[productPath.length - 1];
      const found = matchProductBySlug(products, productSlugCandidate);
      if (found) return found;
    }

    // Caso 2: Rota direta com 1 segmento (ex: ['produto-slug'] ou ['blusas'])
    if (productPath.length === 1) {
      const segment = productPath[0];
      const allCategories =
        catalog.topics ||
        Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
      const isCategory = matchCategoryBySlug(allCategories, segment);

      // Se for estritamente uma categoria da loja, prioriza exibição da vitrine filtrada
      if (isCategory) {
        return undefined;
      }

      // Senão, tenta encontrar o produto pelo slug ou id
      const found = matchProductBySlug(products, segment);
      if (found) return found;
    }

    return undefined;
  }, [catalog, productPath]);

  // Se encontrou um produto específico no link recebido pelo cliente (IA / bio / compartilhamento),
  // renderiza a Página Dedicada do Produto (PDP) para facilitar a visualização e compra!
  if (matchedProduct) {
    const categorySlug = productPath.length > 1 ? productPath[0] : undefined;
    return (
      <DedicatedProductPage
        storeSlug={storeSlug}
        product={matchedProduct}
        categorySlug={categorySlug}
        catalog={catalog}
      />
    );
  }

  // Se for uma categoria ou visualização geral, renderiza a vitrine filtrada
  return (
    <PublicCatalogView
      storeSlug={storeSlug}
      productPath={productPath}
    />
  );
}
