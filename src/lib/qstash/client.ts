import { Client } from '@upstash/qstash';

export function getQStashClient() {
  const token = process.env.QSTASH_TOKEN;
  if (token && !token.includes('your-upstash')) {
    return new Client({ token });
  }
  return null;
}

/**
 * Despacha uma mensagem assíncrona para um endpoint via Upstash QStash.
 * Suporta delayed tasks (ex: 15 minutos para o Modo Guarda-Costas).
 */
export async function dispatchTask(params: {
  destinationUrl: string;
  body: Record<string, any>;
  delaySeconds?: number;
  deduplicationId?: string;
}) {
  const client = getQStashClient();
  const { destinationUrl, body, delaySeconds = 0, deduplicationId } = params;

  // Se a URL for loopback/localhost, não envia para o QStash na nuvem (o servidor da Upstash não alcança seu computador local)
  const isLoopback =
    destinationUrl.includes('localhost') ||
    destinationUrl.includes('127.0.0.1') ||
    destinationUrl.includes('::1');

  if (client && !isLoopback) {
    try {
      const response = await client.publishJSON({
        url: destinationUrl,
        body,
        delay: delaySeconds,
        deduplicationId,
        retries: 3,
      });
      return { success: true, messageId: response.messageId };
    } catch (err: any) {
      console.warn('[QStash Publish Warn - executando via fallback local]:', err.message);
    }
  }

  // Fallback e Desenvolvimento Local: invoca diretamente o endpoint local do Worker
  try {
    const localTarget = isLoopback ? destinationUrl : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/worker`;
    const localRes = await fetch(localTarget, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    console.log(`[Local Task Dispatch] Despachado diretamente para o Worker local: ${localTarget} - Status: ${localRes.status}`);
    return { success: true, messageId: `local-msg-${Date.now()}` };
  } catch (err: any) {
    console.error(`[Local Task Dispatch Error]:`, err.message);
    return { success: false, error: err.message };
  }
}
