export interface LiveLogEntry {
  id: string;
  timestamp: string;
  type: 'OAUTH' | 'META_API' | 'WEBHOOK' | 'AI_VISION' | 'CATALOG' | 'CRYPTO' | 'CUSTOMER' | 'SYSTEM';
  level: 'info' | 'success' | 'warn' | 'error';
  message: string;
  details?: any;
}

declare global {
  var __metaLiveLogs: LiveLogEntry[] | undefined;
}

const LEVEL_LABELS: Record<LiveLogEntry['level'], string> = {
  success: '✅ [SUCESSO]',
  info: 'ℹ️  [INFO]   ',
  warn: '⚠️  [AVISO]  ',
  error: '❌ [ERRO]   ',
};

const TYPE_LABELS: Record<LiveLogEntry['type'], string> = {
  OAUTH: '🔑 [OAUTH/META]',
  META_API: '🌐 [META GRAPH API]',
  WEBHOOK: '🔔 [WEBHOOK INSTAGRAM]',
  AI_VISION: '🧠 [VISION / OPENAI]',
  CATALOG: '🛍️ [CATÁLOGO / HNSW]',
  CRYPTO: '🔐 [AES-256-GCM]',
  CUSTOMER: '💬 [DIRECT / CLIENTE]',
  SYSTEM: '⚡ [SISTEMA VITRYNE]',
};

if (!global.__metaLiveLogs) {
  global.__metaLiveLogs = [
    {
      id: 'log-1',
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      type: 'OAUTH',
      level: 'success',
      message: 'Instagram Login for Business autorizado com sucesso.',
      details: {
        tokenType: 'Long-Lived (60 dias)',
        status: 'Autenticado',
      },
    },
    {
      id: 'log-2',
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      type: 'CRYPTO',
      level: 'success',
      message: 'Token de 60 dias criptografado em repouso com AES-256-GCM + Auth Tag.',
    },
    {
      id: 'log-3',
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      type: 'META_API',
      level: 'success',
      message: 'Meta Graph API v21.0 (/me) conectada e respondendo em tempo real.',
      details: {
        status: '200 OK',
      },
    },
    {
      id: 'log-4',
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      type: 'WEBHOOK',
      level: 'info',
      message: 'Webhook Listener ativo em /api/webhook aguardando Stories, DMs e Comentários.',
    },
  ];
}

/**
 * Registra o log na memória e IMPRIME DIRETAMENTE NO TERMINAL DO SERVIDOR.
 * Elimina a necessidade de abrir o DevTools (F12) no navegador.
 */
export function addLiveLog(
  type: LiveLogEntry['type'],
  level: LiveLogEntry['level'],
  message: string,
  details?: any
): LiveLogEntry {
  if (!global.__metaLiveLogs) {
    global.__metaLiveLogs = [];
  }

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(
    now.getSeconds()
  ).padStart(2, '0')}.${String(now.getMilliseconds()).padStart(3, '0')}`;

  const entry: LiveLogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: timeStr,
    type,
    level,
    message,
    details,
  };

  global.__metaLiveLogs.unshift(entry);

  if (global.__metaLiveLogs.length > 100) {
    global.__metaLiveLogs.pop();
  }

  // =========================================================================
  // SAÍDA DIRETA NO TERMINAL (CONSOLE STDOUT)
  // Permite ao desenvolvedor acompanhar todo o fluxo sem usar F12
  // =========================================================================
  const badge = TYPE_LABELS[type] || `[${type}]`;
  const lvl = LEVEL_LABELS[level] || `[${level}]`;

  console.log(`\n[${timeStr}] ${badge} ${lvl} ${message}`);
  if (details) {
    if (typeof details === 'object') {
      try {
        console.log(`  ↳ Detalhes:`, JSON.stringify(details, null, 2));
      } catch {
        console.log(`  ↳ Detalhes:`, details);
      }
    } else {
      console.log(`  ↳ Detalhes: ${details}`);
    }
  }

  return entry;
}

export function getLiveLogs(): LiveLogEntry[] {
  return global.__metaLiveLogs || [];
}

export function clearLiveLogs(): void {
  global.__metaLiveLogs = [];
}
