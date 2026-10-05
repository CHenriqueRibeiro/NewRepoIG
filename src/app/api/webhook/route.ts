import { NextRequest, NextResponse } from 'next/server';
import { verifyMetaWebhookSignature } from '@/lib/crypto/encryption';
import { dispatchTask } from '@/lib/qstash/client';
import { setPublicAppUrl } from '@/lib/catalog/url-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

declare global {
  var __webhookLogHistory: Array<{
    id: string;
    timestamp: string;
    method: string;
    sourceIp: string;
    userAgent: string;
    signaturePresent: boolean;
    payloadPreview: any;
    status: string;
    details?: string;
  }> | undefined;
}

if (!global.__webhookLogHistory) {
  global.__webhookLogHistory = [];
}

function recordLog(entry: {
  method: string;
  sourceIp: string;
  userAgent: string;
  signaturePresent: boolean;
  payloadPreview: any;
  status: string;
  details?: string;
}) {
  const history = global.__webhookLogHistory || [];
  history.unshift({
    id: `ev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toLocaleTimeString('pt-BR'),
    ...entry,
  });
  if (history.length > 30) history.pop();
  global.__webhookLogHistory = history;
}

/**
 * Verificação do Webhook da Meta (GET) ou Consulta de Status via Navegador
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('cf-connecting-ip') || 'desconhecido';
  const userAgent = request.headers.get('user-agent') || 'desconhecido';
  const rawHost = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') || (rawHost?.includes('localhost') ? 'http' : 'https');
  if (rawHost && !rawHost.includes('localhost') && !rawHost.includes('127.0.0.1')) {
    setPublicAppUrl(`${proto}://${rawHost}`);
  }

  // Se for a verificação oficial da Meta
  if (mode === 'subscribe') {
    const expectedToken = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || 'vitryne_meta_webhook_verify_token_secure';

    console.log('\n==================== [WEBHOOK GET CHALLENGE] ====================');
    console.log(`⏰ Horário: ${new Date().toLocaleTimeString('pt-BR')}`);
    console.log(`🌐 Origem: IP ${clientIp} | User-Agent: ${userAgent}`);
    console.log(`🔑 Token recebido: "${token}" | Esperado: "${expectedToken}"`);
    console.log(`🎯 Challenge: ${challenge}`);

    if (token === expectedToken) {
      console.log('✅ Verificação do Webhook autorizada com sucesso! Respondendo challenge.');
      console.log('=================================================================\n');

      recordLog({
        method: 'GET',
        sourceIp: clientIp,
        userAgent,
        signaturePresent: false,
        payloadPreview: { mode, challenge },
        status: 'CHALLENGE_APPROVED_200',
        details: 'Handshake inicial da Meta aprovado com sucesso',
      });

      return new Response(challenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    console.warn('❌ Verificação recusada: Verify Token incorreto.');
    console.log('=================================================================\n');

    recordLog({
      method: 'GET',
      sourceIp: clientIp,
      userAgent,
      signaturePresent: false,
      payloadPreview: { mode, tokenReceived: token },
      status: 'CHALLENGE_REJECTED_403',
      details: 'Token de verificação inválido',
    });

    return new Response('Verificação recusada: Token inválido', { status: 403 });
  }

  // Se um desenvolvedor abrir a URL no navegador diretamente:
  return NextResponse.json({
    status: 'ONLINE',
    endpoint: '/api/webhook',
    message: 'Webhook da Meta está ativo e pronto para receber notificações de eventos do Instagram.',
    serverTime: new Date().toISOString(),
    verifyTokenConfigured: Boolean(process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN),
    totalRecentEvents: global.__webhookLogHistory?.length || 0,
    recentEvents: global.__webhookLogHistory || [],
  });
}

if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

/**
 * Recepção de Eventos do Instagram (POST):
 * Notificações em tempo real enviadas pela Meta quando alguém comenta ou manda DM.
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('cf-connecting-ip') || 'desconhecido';
  const userAgent = request.headers.get('user-agent') || 'desconhecido';
  const signature = request.headers.get('x-hub-signature-256');
  const rawHost = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') || (rawHost?.includes('localhost') ? 'http' : 'https');
  if (rawHost && !rawHost.includes('localhost') && !rawHost.includes('127.0.0.1')) {
    setPublicAppUrl(`${proto}://${rawHost}`);
  }

  console.log('\n🔔 ==================== [META WEBHOOK EVENTO RECEBIDO] ====================');
  console.log(`⏰ Horário: ${new Date().toLocaleTimeString('pt-BR')} (timestamp: ${Date.now()})`);
  console.log(`🌐 IP de Origem: ${clientIp}`);
  console.log(`📡 User-Agent: ${userAgent}`);
  console.log(`🔐 Assinatura HMAC (x-hub-signature-256): ${signature || 'NÃO ENVIADA'}`);

  // 1. Leitura do raw payload
  const rawBody = await request.text();

  if (!rawBody || rawBody.trim().length === 0) {
    console.warn('⚠️ Payload vazio recebido no Webhook');
    console.log('==========================================================================\n');
    return NextResponse.json({ error: 'Body vazio' }, { status: 400 });
  }

  // 2. Validação da assinatura em produção
  const appSecret = process.env.INSTAGRAM_APP_SECRET || 'dev-secret';
  if (process.env.NODE_ENV === 'production' && appSecret !== 'dev-secret') {
    const isValid = verifyMetaWebhookSignature(rawBody, signature, appSecret);
    if (!isValid) {
      console.error('❌ [Segurança] Assinatura HMAC inválida para o webhook da Meta');
      console.log('==========================================================================\n');
      return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 });
    }
    console.log('✅ Assinatura HMAC validada com sucesso');
  }

  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch (parseErr) {
    console.error('❌ Erro ao converter JSON do payload:', parseErr);
    console.log('==========================================================================\n');
    return NextResponse.json({ error: 'JSON malformado' }, { status: 400 });
  }

  console.log('📦 Conteúdo do Evento:', JSON.stringify(body, null, 2));

  // 3. Despacho assíncrono para o Worker
  const workerUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/worker`;
  console.log(`🚀 Despachando evento para processamento no Worker: ${workerUrl}`);

  dispatchTask({
    destinationUrl: workerUrl,
    body,
  })
    .then((res) => {
      console.log(`✅ [Worker Dispatch] Despachado com sucesso. Status:`, res);
    })
    .catch((err) => {
      console.error(`❌ [Worker Dispatch Error]:`, err);
    });

  const elapsedMs = Date.now() - startTime;
  console.log(`⚡ Resposta rápida 200 EVENT_RECEIVED emitida em ${elapsedMs}ms`);
  console.log('==========================================================================\n');

  recordLog({
    method: 'POST',
    sourceIp: clientIp,
    userAgent,
    signaturePresent: Boolean(signature),
    payloadPreview: body,
    status: 'EVENT_RECEIVED_200',
    details: `Despachado em ${elapsedMs}ms`,
  });

  return new NextResponse('EVENT_RECEIVED', { status: 200 });
}
