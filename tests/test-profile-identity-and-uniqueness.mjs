import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = 'http://localhost:3000';

test('Identidade Dinâmica do Perfil e Validação de Unicidade sem Repetição', async (t) => {
  await t.test('1. API /api/catalog retorna nome real do perfil e não a string genérica "Minha Loja"', async () => {
    const res = await fetch(`${BASE_URL}/api/catalog`);
    const data = await res.json();

    assert.equal(data.success, true);
    assert.ok(data.catalog);
    assert.notEqual(data.catalog.storeName, 'Minha Loja', 'Não deve retornar "Minha Loja" genérico');
    assert.ok(data.catalog.storeName.length > 0);
  });

  await t.test('2. API /api/catalog/validate-slug valida link livre sem conflito', async () => {
    const uniqueSlug = `minha-marca-exclusiva-${Date.now()}`;
    const res = await fetch(`${BASE_URL}/api/catalog/validate-slug?name=Minha+Marca+Exclusiva&slug=${uniqueSlug}`);
    const data = await res.json();

    assert.equal(data.success, true);
    assert.equal(data.isSlugDuplicate, false);
    assert.equal(data.isValid, true);
    assert.match(data.message, /exclusivos disponíveis/i);
  });

  await t.test('3. API /api/catalog/validate-slug detecta duplicidade e gera sugestão única com -2 para não repetir', async () => {
    // 1º: Salva uma loja de teste
    const testSlug = `boutique-teste-${Date.now()}`;
    await fetch(`${BASE_URL}/api/catalog`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeName: 'Boutique Teste Unicidade',
        slug: testSlug,
      }),
    });

    // 2º: Tenta validar o mesmo nome e mesmo slug como se fosse outra loja
    const res = await fetch(`${BASE_URL}/api/catalog/validate-slug?name=Boutique+Teste+Unicidade&slug=${testSlug}&currentSlug=outra-loja`);
    const data = await res.json();

    assert.equal(data.success, true);
    assert.equal(data.isSlugDuplicate, true);
    assert.equal(data.isValid, false);
    assert.match(data.suggestedSlug, new RegExp(`${testSlug}-2`));
    assert.match(data.suggestedName, /Boutique Teste Unicidade 2/);
    assert.match(data.message, /outro perfil/i);
  });

  await t.test('4. Quando o próprio usuário edita seu próprio perfil, não gera falso positivo de colisão consigo mesmo', async () => {
    const ownSlug = `minha-propria-loja-${Date.now()}`;
    await fetch(`${BASE_URL}/api/catalog`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeName: 'Minha Própria Loja',
        slug: ownSlug,
      }),
    });

    // Valida passando currentSlug = ownSlug
    const res = await fetch(`${BASE_URL}/api/catalog/validate-slug?name=Minha+Própria+Loja&slug=${ownSlug}&currentSlug=${ownSlug}`);
    const data = await res.json();

    assert.equal(data.success, true);
    assert.equal(data.isSlugDuplicate, false);
    assert.equal(data.isValid, true);
  });
});
