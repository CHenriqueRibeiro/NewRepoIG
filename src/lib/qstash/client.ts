import { Client } from '@upstash/qstash';

export function getQStashClient() {
  const token = process.env.QSTASH_TOKEN;
  if (token && !token.includes('your-upstash')) {
    const baseUrl = process.env.QSTASH_URL || 'https://qstash-us-east-1.upstash.io';
    return new Client({ token, baseUrl });
  }
  return null;
}

/**
 * Despacha uma mensagem assíncrona para um endpoint via chamada direta ou Upstash QStash.
 * - Mensagens em tempo real (delaySeconds === 0): Despacho direto sub-segundo para o Worker
 * - Tarefas agendadas (delaySeconds > 0): QStash com suporte a atraso (ex: 15min Guarda-Costas)
 */
export async function dispatchTask(params: {
  destinationUrl: string;
  body: Record<string, any>;
  delaySeconds?: number;
  deduplicationId?: string;
}) {
  const { destinationUrl, body, delaySeconds = 0, deduplicationId } = params;

  // 1. Tarefas com atraso agendado (ex: Guarda-costas 15 minutos): DEVE usar o QStash
  if (delaySeconds > 0) {
    const client = getQStashClient();
    if (client) {
      try {
        const response = await client.publishJSON({
          url: destinationUrl,
          body,
          delay: delaySeconds,
          deduplicationId,
          retries: 3,
        });
        console.log(`[QStash Delayed Task] Agendado com sucesso para ${delaySeconds}s (msgId: ${response.messageId})`);
        return { success: true, messageId: response.messageId };
      } catch (err: any) {
        console.warn('[QStash Publish Error on delayed task]:', err.message);
      }
    }
  }

  // 2. Mensagens em tempo real (delaySeconds === 0): Despacho direto e imediato para o Worker
  try {
    const res = await fetch(destinationUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    console.log(`[Direct Task Dispatch] Despachado diretamente para o Worker: ${destinationUrl} - Status: ${res.status}`);
    return { success: res.ok, status: res.status, messageId: `direct-msg-${Date.now()}` };
  } catch (directErr: any) {
    console.warn(`[Direct Task Dispatch Warn - tentando fallback QStash]:`, directErr.message);

    // Se o envio direto falhar (ex: rede temporária), tenta QStash como fila de garantia
    const client = getQStashClient();
    if (client) {
      try {
        const response = await client.publishJSON({
          url: destinationUrl,
          body,
          delay: 0,
          deduplicationId,
          retries: 3,
        });
        console.log(`[QStash Fallback] Mensagem entregue via QStash: ${response.messageId}`);
        return { success: true, messageId: response.messageId };
      } catch (qstashErr: any) {
        console.error('[QStash Fallback Error]:', qstashErr.message);
      }
    }

    return { success: false, error: directErr.message };
  }
}
