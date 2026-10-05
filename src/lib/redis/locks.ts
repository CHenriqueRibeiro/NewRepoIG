import { redis } from './client';
export { redis };

/**
 * Script Lua Oficial para Trava de Peça Única:
 * Executado atomicamente no Redis para evitar condições de corrida (race conditions)
 * quando múltiplos clientes clicam no link de compra simultaneamente.
 */
export const ATOMIC_RESERVATION_LUA = `
local stock = tonumber(redis.call('get', KEYS[1]) or 0)
if stock > 0 then
  redis.call('decr', KEYS[1])
  redis.call('set', KEYS[2], ARGV[1], 'EX', ARGV[2])
  return 1 -- Reserva garantida por 15 minutos (900s)
else
  return 0 -- Esgotado ou reservado por outro cliente
end
`;

export const RELEASE_RESERVATION_LUA = `
if redis.call('get', KEYS[2]) == ARGV[1] then
  redis.call('del', KEYS[2])
  redis.call('incr', KEYS[1])
  return 1 -- Trava liberada e estoque restaurado
else
  return 0 -- Não era o detentor da trava
end
`;

/**
 * Tenta reservar a peça por 15 minutos (900 segundos).
 * Retorna true se a reserva foi obtida com sucesso.
 */
export async function reserveUniquePiece(
  productId: string,
  buyerIdOrHandle: string,
  ttlSeconds: number = 900
): Promise<boolean> {
  const stockKey = `stock:${productId}`;
  const reservationKey = `reservation:${productId}`;

  // Garante que o estoque inicial existe se for a primeira checagem
  const currentStock = await redis.get(stockKey);
  if (currentStock === null) {
    await redis.set(stockKey, 1);
  }

  const result = await redis.eval(
    ATOMIC_RESERVATION_LUA,
    [stockKey, reservationKey],
    [buyerIdOrHandle, ttlSeconds]
  );

  return Number(result) === 1;
}

/**
 * Libera a reserva da peça (ex: cliente cancelou ou tempo expirou).
 */
export async function releaseReservation(
  productId: string,
  buyerIdOrHandle: string
): Promise<boolean> {
  const stockKey = `stock:${productId}`;
  const reservationKey = `reservation:${productId}`;

  const result = await redis.eval(
    RELEASE_RESERVATION_LUA,
    [stockKey, reservationKey],
    [buyerIdOrHandle]
  );

  return Number(result) === 1;
}

/**
 * Consulta quem detém a reserva atual de uma peça.
 */
export async function getReservationHolder(productId: string): Promise<string | null> {
  const reservationKey = `reservation:${productId}`;
  return await redis.get<string>(reservationKey);
}

/**
 * Gerenciamento da Fila FIFO de Espera:
 * Caso a peça esteja reservada, novos interessados entram na fila.
 */
export async function enterWaitlist(productId: string, buyerHandle: string): Promise<number> {
  const waitlistKey = `waitlist:${productId}`;
  // LPUSH insere no início, RPOP retira do final (FIFO)
  const position = await redis.lpush(waitlistKey, buyerHandle);
  return position;
}

/**
 * Retira o próximo cliente da fila de espera quando a reserva expira.
 */
export async function popNextFromWaitlist(productId: string): Promise<string | null> {
  const waitlistKey = `waitlist:${productId}`;
  return await redis.rpop(waitlistKey);
}

/**
 * Idempotência de Webhooks da Meta (Anti-Replay Attack):
 * Armazena o hash SHA-256 do payload no Redis com expiração de 24 horas (86400s).
 * Se já existir, retorna false indicando requisição duplicada.
 */
export async function checkAndSetWebhookIdempotency(payloadHash: string): Promise<boolean> {
  const idempotencyKey = `webhook:idempotency:${payloadHash}`;
  const isNew = await redis.setnx(idempotencyKey, 'PROCESSED');
  if (isNew === 1) {
    // Expira em 24 horas
    if ('expire' in redis) {
      await (redis as any).expire(idempotencyKey, 86400);
    }
    return true; // Primeira vez processando
  }
  return false; // Repetição detectada
}
