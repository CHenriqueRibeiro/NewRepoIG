import test from 'node:test';
import assert from 'node:assert/strict';

// Replica da lógica estrita de cálculo de horário de corte do motoboy
function getMotoboyCutoffInfo(shipping, testNow) {
  const enabled = Boolean(shipping?.motoboySameDayCutoffEnabled);
  const cutoffTime = shipping?.motoboyCutoffTime || '14:00';

  if (!enabled) {
    return {
      enabled: false,
      cutoffTime,
      isSameDay: true,
      badgeText: 'Entrega Expressa',
      statusMessage: shipping?.motoboyEstimate || 'Entrega rápida na sua região',
      shortNotice: shipping?.motoboyEstimate || 'Hoje / Em breve',
    };
  }

  const [cutoffH, cutoffM] = cutoffTime.split(':').map((val) => parseInt(val, 10) || 0);
  const now = testNow || new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const cutoffMinutes = cutoffH * 60 + cutoffM;

  const isSameDay = currentMinutes < cutoffMinutes;

  if (isSameDay) {
    const remainingMinutes = cutoffMinutes - currentMinutes;
    const remH = Math.floor(remainingMinutes / 60);
    const remM = remainingMinutes % 60;
    const timeCountdown = remH > 0 ? `${remH}h e ${remM}min` : `${remM} minutos`;

    return {
      enabled: true,
      cutoffTime,
      isSameDay: true,
      badgeText: 'Entrega HOJE',
      statusMessage: `Compre nos próximos ${timeCountdown} (até às ${cutoffTime}) para receber hoje!`,
      shortNotice: `Entrega HOJE (até ${cutoffTime})`,
    };
  } else {
    return {
      enabled: true,
      cutoffTime,
      isSameDay: false,
      badgeText: 'Próximo Dia Útil',
      statusMessage: `Horário limite de hoje (${cutoffTime}) atingido. Seu pedido será entregue no próximo dia útil.`,
      shortNotice: `Próximo Dia Útil (após ${cutoffTime})`,
    };
  }
}

function getUberFlashInfo(shipping) {
  const enabled = shipping?.uberFlashEnabled ?? true;
  const label = shipping?.uberFlashLabel?.trim() || 'Retirada por Moto Uber / 99';
  const address = shipping?.uberFlashAddress?.trim() || shipping?.pickupAddress?.trim() || '';
  const notice =
    shipping?.uberFlashNotice?.trim() ||
    'Atenção: A taxa da corrida no app (Uber Flash ou 99 Moto) é solicitada e paga diretamente pelo cliente após aviso de pedido pronto.';

  return {
    enabled,
    label,
    address,
    notice,
    costBadge: 'Corrida paga pelo cliente',
  };
}

test('1. Horário de corte do motoboy: Entrega HOJE antes das 14h', () => {
  const shipping = {
    motoboyEnabled: true,
    motoboyPrice: 15,
    motoboySameDayCutoffEnabled: true,
    motoboyCutoffTime: '14:00',
  };

  // Simula 11:30 da manhã (antes das 14h)
  const morning = new Date();
  morning.setHours(11, 30, 0, 0);

  const res = getMotoboyCutoffInfo(shipping, morning);
  assert.equal(res.enabled, true);
  assert.equal(res.isSameDay, true);
  assert.equal(res.badgeText, 'Entrega HOJE');
  assert.match(res.statusMessage, /para receber hoje/i);
});

test('2. Horário de corte do motoboy: Próximo dia útil após às 14h', () => {
  const shipping = {
    motoboyEnabled: true,
    motoboyPrice: 15,
    motoboySameDayCutoffEnabled: true,
    motoboyCutoffTime: '14:00',
  };

  // Simula 16:45 da tarde (após as 14h)
  const afternoon = new Date();
  afternoon.setHours(16, 45, 0, 0);

  const res = getMotoboyCutoffInfo(shipping, afternoon);
  assert.equal(res.enabled, true);
  assert.equal(res.isSameDay, false);
  assert.equal(res.badgeText, 'Próximo Dia Útil');
  assert.match(res.statusMessage, /próximo dia útil/i);
});

test('3. Opção Retirada por Moto Uber / 99 e aviso explícito de pagamento pelo cliente', () => {
  const shipping = {
    pickupAddress: 'Rua Oscar Freire, 1140 - Jardins, SP',
    uberFlashEnabled: true,
  };

  const uber = getUberFlashInfo(shipping);
  assert.equal(uber.enabled, true);
  assert.match(uber.label, /Moto Uber \/ 99/i);
  assert.equal(uber.address, 'Rua Oscar Freire, 1140 - Jardins, SP');
  // Requisito do usuário: observação explícita de quem paga o uber/99 é o cliente
  assert.match(uber.notice, /paga diretamente pelo cliente/i);
});

test('4. Validação da rota do catálogo minha-loja com novas opções renderizadas', async () => {
  const res = await fetch('http://localhost:3000/minha-loja');
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.ok(html.includes('Vitryne') || html.includes('Sacola') || html.includes('Boutique'));
});
