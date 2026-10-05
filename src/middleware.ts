import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Rate Limiter em Memória para Proteção contra DDoS e Brute-Force
// ---------------------------------------------------------------------------
interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

// Limpeza periódica do mapa a cada 5 minutos
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function checkRateLimit(ip: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();

  if (now - lastCleanup > CLEANUP_INTERVAL) {
    for (const [key, record] of rateLimitMap.entries()) {
      if (record.resetAt <= now) {
        rateLimitMap.delete(key);
      }
    }
    lastCleanup = now;
  }

  const record = rateLimitMap.get(ip);
  if (!record || record.resetAt <= now) {
    rateLimitMap.set(ip, {
      count: 1,
      resetAt: now + windowMs,
    });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count += 1;
  return true;
}

// ---------------------------------------------------------------------------
// Lista Negra de Scanners e Ferramentas Automatizadas de Pentest / Ataque
// ---------------------------------------------------------------------------
const MALICIOUS_USER_AGENTS = [
  'sqlmap',
  'nikto',
  'masscan',
  'acunetix',
  'zgrab',
  'gobuster',
  'dirbuster',
  'wpscan',
  'havij',
];

// Caminhos proibidos frequentemente sondados por bots maliciosos
const FORBIDDEN_PATHS = [
  '/.env',
  '/.git',
  '/wp-admin',
  '/wp-login',
  '/xmlrpc.php',
  '/phpmyadmin',
  '/.aws',
  '/server-status',
];

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname.toLowerCase();
  const userAgent = (request.headers.get('user-agent') || '').toLowerCase();
  const clientIp =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    '127.0.0.1';

  // 1. Bloqueio Imediato de Scanners Maliciosos de Pentest
  if (MALICIOUS_USER_AGENTS.some((bot) => userAgent.includes(bot))) {
    console.warn(`🚨 [Firewall] Bot malicioso bloqueado: ${userAgent} (IP: ${clientIp})`);
    return new NextResponse('Access Denied', { status: 403 });
  }

  // 2. Bloqueio de Sondagem de Arquivos Sensíveis (.env, .git, etc.)
  if (FORBIDDEN_PATHS.some((forbidden) => path.startsWith(forbidden))) {
    console.warn(`🚨 [Firewall] Tentativa de acesso a arquivo protegido: ${path} (IP: ${clientIp})`);
    return new NextResponse('Not Found', { status: 404 });
  }

  // 3. Proteção contra Path Traversal
  if (path.includes('..') || path.includes('%2e%2e')) {
    console.warn(`🚨 [Firewall] Tentativa de Directory Traversal detectada: ${path} (IP: ${clientIp})`);
    return new NextResponse('Bad Request', { status: 400 });
  }

  // 4. Rate Limiting Específico por Categoria de Rota
  if (path.startsWith('/api/')) {
    // Endpoints sensíveis da API (limite de 120 req/min por IP)
    const isAllowed = checkRateLimit(clientIp, 120, 60 * 1000);
    if (!isAllowed) {
      console.warn(`🛑 [Rate Limit DDoS] IP excedeu limite na API: ${clientIp} em ${path}`);
      return new NextResponse(
        JSON.stringify({
          error: 'Muitas requisições. Limite de segurança excedido.',
          retryAfterSeconds: 60,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
          },
        }
      );
    }
  }

  const response = NextResponse.next();
  return response;
}

export const config = {
  matcher: [
    /*
     * Aplica middleware em todas as requisições exceto assets estáticos:
     * - _next/static (arquivos estáticos)
     * - _next/image (otimização de imagens)
     * - favicon.ico, etc.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
