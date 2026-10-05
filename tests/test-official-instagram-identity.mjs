import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = 'http://localhost:3000';

async function callOrchestrator(messageText, buyerUsername = 'Ana Késia Rodrigues', buyerId = `buyer_${Date.now()}_${Math.random().toString(36).substring(7)}`) {
  const res = await fetch(`${BASE_URL}/api/ai/orchestrator`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messageText,
      buyerUsername,
      buyerId,
      catalogSlug: 'minha-loja',
    }),
  });
  return res.json();
}

test('Apresentação Oficial com Nome e @username do Instagram', async (t) => {
  await t.test('1. Saudação inicial apresenta a loja com nome oficial Quota (@app_quota)', async () => {
    const data = await callOrchestrator('Olá, bom dia!');

    assert.equal(data.success, true);
    assert.equal(data.shouldReply, true);
    assert.match(data.replyText, /Olá, Ana!/);
    assert.match(data.replyText, /assistente virtual da \*Quota\* \(@app_quota\)!/);
    assert.doesNotMatch(data.replyText, /Minha Loja/i);
    assert.doesNotMatch(data.replyText, /Vitryne Boutique/i);
  });

  await t.test('2. Pergunta sobre funcionamento apresenta a loja com nome oficial Quota (@app_quota)', async () => {
    const data = await callOrchestrator('Como funciona o atendimento de vocês?', 'Carlos');

    assert.equal(data.success, true);
    assert.equal(data.shouldReply, true);
    assert.match(data.replyText, /assistente virtual da \*Quota\* \(@app_quota\)!/);
    assert.doesNotMatch(data.replyText, /Minha Loja/i);
  });

  await t.test('3. Turno 2 com o mesmo cliente não repete a apresentação formal', async () => {
    const buyerId = `buyer_repeat_${Date.now()}`;
    const firstTurn = await callOrchestrator('Olá!', 'Luciana', buyerId);
    assert.match(firstTurn.replyText, /assistente virtual da \*Quota\* \(@app_quota\)!/);

    const secondTurn = await callOrchestrator('Vocês entregam?', 'Luciana', buyerId);
    assert.equal(secondTurn.shouldReply, true);
    assert.doesNotMatch(secondTurn.replyText, /assistente virtual/i);
    assert.doesNotMatch(secondTurn.replyText, /Minha Loja/i);
  });
});
