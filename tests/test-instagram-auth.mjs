import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = 'http://localhost:3000';

test('Meta OAuth URL e Status de Configuração', async () => {
  const res = await fetch(`${BASE_URL}/api/auth/instagram/url`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.redirectUri.includes('/api/auth/instagram/callback'));
});

test('Conectar Conta do Instagram via API', async () => {
  const res = await fetch(`${BASE_URL}/api/auth/instagram/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'sandbox',
      customHandle: '@minha_loja_boutique',
      customStoreName: 'Minha Boutique Real',
    }),
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.account.username, 'minha_loja_boutique');
  assert.equal(data.account.name, 'Minha Boutique Real');
});

test('Consultar Status da Sessão Ativa do Instagram', async () => {
  const res = await fetch(`${BASE_URL}/api/auth/instagram/status`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.connected, true);
  assert.equal(data.account.username, 'minha_loja_boutique');
});

test('Executar Teste de Diagnóstico em Tempo Real com a Meta Graph API', async () => {
  const res = await fetch(`${BASE_URL}/api/auth/instagram/diagnostics`, {
    method: 'POST',
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(typeof data.latencyMs === 'number');
  assert.ok(data.permissionsVerified.includes('instagram_manage_messages'));
  assert.ok(data.permissionsVerified.includes('instagram_manage_comments'));
  assert.ok(data.cryptoStatus.includes('AES-256-GCM'));
});

test('Desconectar Conta e Restaurar Sessão Padrão', async () => {
  // Desconecta
  const resDisc = await fetch(`${BASE_URL}/api/auth/instagram/disconnect`, {
    method: 'POST',
  });
  assert.equal(resDisc.status, 200);

  const resStatus = await fetch(`${BASE_URL}/api/auth/instagram/status`);
  const statusData = await resStatus.json();
  assert.equal(statusData.connected, false);

  // Reconecta padrão para ambiente do usuário
  await fetch(`${BASE_URL}/api/auth/instagram/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'sandbox',
      customHandle: 'vitryne.oficial',
      customStoreName: 'Vitryne Boutique',
    }),
  });
});
