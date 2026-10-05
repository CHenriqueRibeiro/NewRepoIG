import { notFound } from 'next/navigation';
import PublicCatalogView from '@/components/catalog/PublicCatalogView';
import { getServerCatalog } from '@/lib/catalog/storage';

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
 * Rota Limpa da Loja: /[storeSlug]
 * Exemplo: vitryne.com.br/minha-loja ou vitryne.com.br/loja-exemplo
 * Renderizado no Servidor com Zero Delay e Zero Loja Mocada.
 */
export default function StoreCatalogPage({
  params,
}: {
  params: { storeSlug: string };
}) {
  const storeSlug = params.storeSlug;
  if (RESERVED_SLUGS.has(storeSlug.toLowerCase())) {
    notFound();
  }

  const initialCatalog = getServerCatalog(storeSlug);

  return (
    <PublicCatalogView
      storeSlug={storeSlug}
      initialCatalog={initialCatalog}
    />
  );
}
