import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = 'http://localhost:3000';

async function callOrchestratorFallback(messageText, extra = {}) {
  const res = await fetch(`${BASE_URL}/api/ai/orchestrator`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messageText,
      buyerUsername: 'Mariana',
      storeName: 'Vitryne Boutique',
      catalogSlug: 'minha-loja',
      apiKey: 'apikey_invalid_key_to_force_vector_semantic_fallback',
      ...extra,
    }),
  });
  return res.json();
}

test('Vector Semantic AI Offline Fallback Suite (Zero Keywords, 100% Vector Cosine Similarity)', async (t) => {
  await t.test('1. Pagamento / Checkout via Similaridade Vetorial sem palavra-chave "pix"', async () => {
    // Frase sem "pix", sem "chave", sem "pagar"
    const data = await callOrchestratorFallback('como eu transfiro a quantia pra fechar essa encomenda?');

    assert.equal(data.success, true);
    assert.equal(data.shouldReply, true);
    assert.equal(data.selectedAgentType, 'checkout_pix', 'Deve rotear para checkout_pix por proximidade vetorial');
    assert.equal(data.routingSource, 'vector_semantic_ai', 'Fonte deve ser vector_semantic_ai');
  });

  await t.test('2. Endereço e Retirada Presencial via Similaridade Vetorial', async () => {
    const data = await callOrchestratorFallback('qual a localidade do ponto fisico de retirada presencial de vcs?');

    assert.equal(data.success, true);
    assert.equal(data.shouldReply, true);
    assert.equal(data.selectedAgentType, 'store_address');
    assert.equal(data.routingSource, 'vector_semantic_ai');
  });

  await t.test('3. Link do Catálogo e Vitrine via Similaridade Vetorial', async () => {
    const data = await callOrchestratorFallback('poderia me enviar a vitrine virtual para eu ver as novidades?');

    assert.equal(data.success, true);
    assert.equal(data.shouldReply, true);
    assert.equal(data.selectedAgentType, 'catalog_link');
    assert.equal(data.routingSource, 'vector_semantic_ai');
  });

  await t.test('4. Atendente Humano / Suporte via Similaridade Vetorial', async () => {
    const data = await callOrchestratorFallback('estou muito insatisfeita com o atraso, quero falar com alguem da equipe urgente');

    assert.equal(data.success, true);
    assert.equal(data.shouldReply, true);
    assert.equal(data.selectedAgentType, 'human_handoff');
    assert.equal(data.routingSource, 'vector_semantic_ai');
  });

  await t.test('5. Identificação de Peça e Estoque via Similaridade Vetorial', async () => {
    const data = await callOrchestratorFallback('esse vestido midi floral rosa no tamanho M tem caimento bom?');

    assert.equal(data.success, true);
    assert.equal(data.shouldReply, true);
    assert.equal(data.selectedAgentType, 'product_identification');
    assert.equal(data.routingSource, 'vector_semantic_ai');
  });

  await t.test('6. Silenciamento de Spam / Fora de Escopo via Similaridade Vetorial', async () => {
    const data = await callOrchestratorFallback('compre seguidores cripto renda extra rapida zap zap');

    assert.equal(data.success, true);
    assert.equal(data.shouldReply, false);
    assert.equal(data.selectedAgentType, 'silence_ignore');
  });
});
