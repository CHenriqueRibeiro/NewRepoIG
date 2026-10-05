import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = 'http://localhost:3000';

test('1. Endpoint /api/catalog/[slug] para loja única (ex: quota-28405571815802519) retorna catálogo limpo', async () => {
  const uniqueSlug = 'quota-28405571815802519';
  const res = await fetch(`${BASE_URL}/api/catalog/${uniqueSlug}`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.catalog);
  assert.equal(data.catalog.slug, uniqueSlug);
  assert.equal(data.catalog.products.length, 0, 'Loja nova única não deve ter produtos mockados');
});

test('2. Endpoint /api/catalog/app_quota NÃO retorna joias mockadas e carrega limpo', async () => {
  const res = await fetch(`${BASE_URL}/api/catalog/app_quota`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.catalog);
  
  // Confirma que não tem joias mockadas (prod-j1, etc.)
  const hasMockJewelry = (data.catalog.products || []).some(
    (p) => p.id && String(p.id).startsWith('prod-j')
  );
  assert.equal(hasMockJewelry, false, 'Não deve conter joias mockadas');
});

test('3. Criação de catálogo personalizado com slug customizado', async () => {
  const customSlug = `loja-teste-${Date.now()}`;
  const payload = {
    storeName: 'Loja Exclusiva de Teste',
    slug: customSlug,
    products: [],
  };

  const postRes = await fetch(`${BASE_URL}/api/catalog`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  assert.equal(postRes.status, 200);
  const postData = await postRes.json();
  assert.equal(postData.success, true);
  assert.equal(postData.catalog.slug, customSlug);

  // Agora busca esse catálogo recém-criado
  const getRes = await fetch(`${BASE_URL}/api/catalog/${customSlug}`);
  assert.equal(getRes.status, 200);
  const getData = await getRes.json();
  assert.equal(getData.catalog.storeName, 'Loja Exclusiva de Teste');
  assert.equal(getData.catalog.slug, customSlug);
});

test('4. Rota pública /[storeSlug] renderiza com HTTP 200 para loja única', async () => {
  const uniqueSlug = 'quota-28405571815802519';
  const res = await fetch(`${BASE_URL}/${uniqueSlug}`);
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.ok(html.includes('<!DOCTYPE html>'));
  // Não deve conter títulos mockados de semijoias
  assert.ok(!html.includes('Joias &amp; Semijoias') && !html.includes('Brinco Argola Banhada'));
});
