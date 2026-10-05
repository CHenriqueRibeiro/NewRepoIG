'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Redirecionador para a rota limpa e moderna:
 * /c/[slug] -> /[slug]
 * /c/[slug]?p=xyz -> /[slug]/[xyz]
 */
export default function LegacyPublicCatalogPage({
  params,
}: {
  params: { slug: string };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const storeSlug = params.slug || 'minha-loja';
    const targetProduct = searchParams.get('p') || searchParams.get('product');

    if (targetProduct) {
      router.replace(`/${storeSlug}/${targetProduct}`);
    } else {
      router.replace(`/${storeSlug}`);
    }
  }, [params.slug, searchParams, router]);

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="text-stone-400 text-sm font-medium animate-pulse">
        Carregando boutique...
      </div>
    </div>
  );
}
