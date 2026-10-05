import { encryptAES256GCM, decryptAES256GCM } from '@/lib/crypto/encryption';

export interface InstagramAccountProfile {
  id: string;
  username: string;
  name: string;
  profilePictureUrl?: string;
  accountType?: string;
  connectedAt: string;
  tokenExpiresAt: string;
  isSandbox?: boolean;
}

export interface InstagramSession {
  account: InstagramAccountProfile;
  accessTokenEncrypted: string;
}

declare global {
  var __activeInstagramSession: InstagramSession | null;
  var __explicitlyDisconnected: boolean | undefined;
}

const DEFAULT_SANDBOX_ACCOUNT: InstagramAccountProfile = {
  id: 'ig_17841400000000001',
  username: 'vitryne.oficial',
  name: 'Vitryne Boutique',
  profilePictureUrl: '',
  accountType: 'BUSINESS',
  connectedAt: new Date().toISOString(),
  tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
  isSandbox: true,
};

// Sessão padrão inicial para desenvolvimento
if (global.__activeInstagramSession === undefined) {
  const envToken = process.env.INSTAGRAM_ACCESS_TOKEN?.trim();
  if (envToken && !envToken.includes('mock') && envToken.startsWith('IGA')) {
    global.__activeInstagramSession = {
      account: {
        id: process.env.INSTAGRAM_ACCOUNT_ID || 'ig_default_account',
        username: process.env.INSTAGRAM_ACCOUNT_USERNAME || 'instagram',
        name: process.env.INSTAGRAM_ACCOUNT_NAME || 'Minha Loja',
        profilePictureUrl: '',
        accountType: 'BUSINESS',
        connectedAt: new Date().toISOString(),
        tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        isSandbox: false,
      },
      accessTokenEncrypted: encryptAES256GCM(envToken),
    };
  } else {
    global.__activeInstagramSession = {
      account: DEFAULT_SANDBOX_ACCOUNT,
      accessTokenEncrypted: encryptAES256GCM('mock_instagram_access_token_super_secure'),
    };
  }
}

const GRAPH_API_VERSION = 'v21.0';
const GRAPH_API_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

/**
 * Retorna a URL base oficial da aplicação (sempre permanente)
 * 1. Prioriza domínio oficial de produção na Vercel (VERCEL_PROJECT_PRODUCTION_URL)
 * 2. Em seguida NEXT_PUBLIC_APP_URL configurado (se não for túnel temporário morto)
 * 3. Se estiver em requisição local ou preview, utiliza a origem da requisição atual
 */
export function getAppBaseUrl(request?: { url: string; headers: { get(name: string): string | null } }): string {
  // 1. URL pública explícita configurada no .env (se não for localhost ou túnel temporário morto)
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (envUrl && !envUrl.includes('trycloudflare.com') && !envUrl.includes('ngrok-free.app') && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl.replace(/\/$/, '');
  }

  // 2. Se a requisição veio do navegador (ex: vitryne-ig.vercel.app ou localhost:3000)
  if (request) {
    try {
      const url = new URL(request.url);
      const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || url.host;
      const proto = request.headers.get('x-forwarded-proto') || (url.protocol.replace(':', '') || (host?.includes('localhost') ? 'http' : 'https'));
      if (host && !host.includes('trycloudflare.com') && !host.includes('ngrok-free.app')) {
        return `${proto}://${host}`.replace(/\/$/, '');
      }
    } catch {
      // fallback
    }
  }

  // 3. Domínio de Produção Oficial na Vercel (fallback de infraestrutura)
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`.replace(/\/$/, '');
  }

  // 4. Fallback de preview da Vercel
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/$/, '');
  }

  return envUrl || 'http://localhost:3000';
}

/**
 * Gera a URL oficial de autorização 100% no domínio do Instagram (Instagram Login for Business)
 * Elimina totalmente a tela do Facebook e abre diretamente o login e consentimento do Instagram.
 */
export function getMetaOAuthUrl(redirectUri: string): { url: string; configured: boolean } {
  const appId = process.env.INSTAGRAM_APP_ID;
  if (!appId || appId.includes('your-meta-app-id')) {
    return {
      url: '',
      configured: false,
    };
  }

  // Scopes oficiais do Instagram Login for Business
  const scopes = [
    'instagram_business_basic',
    'instagram_business_manage_messages',
    'instagram_business_manage_comments',
  ].join(',');

  // Endpoint 100% Instagram (Login for Business)
  const url = `https://www.instagram.com/oauth/authorize?client_id=${encodeURIComponent(
    appId
  )}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=${encodeURIComponent(
    scopes
  )}`;

  return { url, configured: true };
}

/**
 * Troca código OAuth por token de curta duração e em seguida token de 60 dias (Long-Lived)
 * Suporta Instagram Business API e Graph API com fallback
 */
export async function exchangeCodeForTokens(code: string, redirectUri: string) {
  const appId = process.env.INSTAGRAM_APP_ID;
  const appSecret = process.env.INSTAGRAM_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error('INSTAGRAM_APP_ID e INSTAGRAM_APP_SECRET devem estar configurados no .env');
  }

  // Meta costuma anexar '#_' no final do código de redirecionamento do Instagram
  const cleanCode = code.replace(/#_$/, '');

  let shortLivedToken = '';

  // 1. Tentar obter Short-Lived Token via Instagram OAuth endpoint (POST form-urlencoded)
  try {
    const params = new URLSearchParams();
    params.append('client_id', appId);
    params.append('client_secret', appSecret);
    params.append('grant_type', 'authorization_code');
    params.append('redirect_uri', redirectUri);
    params.append('code', cleanCode);

    const igRes = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (igRes.ok) {
      const igData = await igRes.json();
      shortLivedToken = igData.access_token;
    }
  } catch (e) {
    console.warn('[Instagram OAuth POST failed, falling back to Graph API]', e);
  }

  // Fallback para Graph API caso não tenha retornado pelo endpoint direto
  if (!shortLivedToken) {
    const tokenUrl = `${GRAPH_API_URL}/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&code=${encodeURIComponent(cleanCode)}`;

    const res = await fetch(tokenUrl);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(`Falha ao obter token da Meta: ${JSON.stringify(errorData)}`);
    }

    const shortTokenData = await res.json();
    shortLivedToken = shortTokenData.access_token;
  }

  // 2. Trocar por Long-Lived Token (60 dias)
  let longLivedToken = shortLivedToken;
  let expiresInSeconds = 60 * 24 * 60 * 60;

  try {
    // Tenta trocar via Instagram Graph API
    const igLongTokenUrl = `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${appSecret}&access_token=${shortLivedToken}`;
    const igLongRes = await fetch(igLongTokenUrl);
    if (igLongRes.ok) {
      const igLongData = await igLongRes.json();
      longLivedToken = igLongData.access_token || longLivedToken;
      expiresInSeconds = igLongData.expires_in || expiresInSeconds;
    } else {
      // Fallback Facebook Graph API
      const longTokenUrl = `${GRAPH_API_URL}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`;
      const longRes = await fetch(longTokenUrl);
      if (longRes.ok) {
        const longTokenData = await longRes.json();
        longLivedToken = longTokenData.access_token || longLivedToken;
        expiresInSeconds = longTokenData.expires_in || expiresInSeconds;
      }
    }
  } catch (err) {
    console.warn('[Long lived exchange warn]', err);
  }

  return {
    accessToken: longLivedToken,
    expiresInSeconds,
  };
}

/**
 * Valida um token de acesso diretamente contra a Meta Graph API (/me)
 * e retorna os detalhes reais da conta conectada.
 */
export async function validateInstagramTokenWithMeta(token: string): Promise<{
  isValid: boolean;
  account?: InstagramAccountProfile;
  error?: string;
  latencyMs?: number;
}> {
  const startTime = Date.now();

  // Tratamento para tokens de sandbox / mock
  if (token.startsWith('mock_') || token === 'sandbox' || token === 'demo') {
    return {
      isValid: true,
      latencyMs: 12,
      account: {
        ...DEFAULT_SANDBOX_ACCOUNT,
        connectedAt: new Date().toISOString(),
      },
    };
  }

  try {
    // Consulta inicial para pegar dados do perfil direto do Instagram ou via páginas do Facebook
    let instagramAccount: any = null;

    // 1. Tentar diretamente na Graph API do Instagram (padrão para Instagram Business Login)
    try {
      const igDirectUrl = `https://graph.instagram.com/${GRAPH_API_VERSION}/me?fields=id,username,name,account_type,profile_picture_url&access_token=${encodeURIComponent(
        token
      )}`;
      const igRes = await fetch(igDirectUrl);
      if (igRes.ok) {
        const igData = await igRes.json();
        if (igData.username || igData.id) {
          instagramAccount = igData;
        }
      }
    } catch (e) {
      console.warn('[graph.instagram.com direct query error]', e);
    }

    // 2. Se não conseguiu direto, tentar via Facebook Graph API
    if (!instagramAccount) {
      const meUrl = `${GRAPH_API_URL}/me?fields=id,name,accounts{id,name,access_token,instagram_business_account{id,username,name,profile_picture_url}}&access_token=${encodeURIComponent(
        token
      )}`;

      const res = await fetch(meUrl);
      if (res.ok) {
        const data = await res.json();
        if (data.accounts?.data && data.accounts.data.length > 0) {
          for (const page of data.accounts.data) {
            if (page.instagram_business_account) {
              instagramAccount = page.instagram_business_account;
              break;
            }
          }
        }
        if (!instagramAccount) {
          instagramAccount = { id: data.id, name: data.name, username: data.name?.toLowerCase().replace(/\s+/g, '_') };
        }
      }
    }

    const latencyMs = Date.now() - startTime;

    if (!instagramAccount) {
      return {
        isValid: false,
        error: 'Não foi possível obter os dados do perfil do Instagram.',
        latencyMs,
      };
    }

    const accountId = instagramAccount.id;
    const accountUsername = instagramAccount.username || 'loja_instagram';
    const accountName = instagramAccount.name || accountUsername;
    const profilePictureUrl = instagramAccount.profile_picture_url || '';

    const profile: InstagramAccountProfile = {
      id: accountId,
      username: accountUsername.startsWith('@') ? accountUsername.slice(1) : accountUsername,
      name: accountName,
      profilePictureUrl,
      accountType: 'BUSINESS',
      connectedAt: new Date().toISOString(),
      tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      isSandbox: false,
    };

    return {
      isValid: true,
      account: profile,
      latencyMs,
    };
  } catch (err: any) {
    return {
      isValid: false,
      error: err.message || 'Falha de conexão com os servidores da Meta',
      latencyMs: Date.now() - startTime,
    };
  }
}

/**
 * Salva a sessão ativa na memória global
 */
export function setActiveInstagramSession(account: InstagramAccountProfile, plainAccessToken: string) {
  global.__explicitlyDisconnected = false;
  const encrypted = encryptAES256GCM(plainAccessToken);
  global.__activeInstagramSession = {
    account,
    accessTokenEncrypted: encrypted,
  };
}

/**
 * Retorna a sessão ativa atual
 */
export function getActiveInstagramSession(): InstagramSession | null {
  if (global.__explicitlyDisconnected) {
    return null;
  }

  const envToken = process.env.INSTAGRAM_ACCESS_TOKEN?.trim();
  if (
    (!global.__activeInstagramSession || global.__activeInstagramSession.account.isSandbox) &&
    envToken &&
    !envToken.includes('mock') &&
    envToken.startsWith('IGA')
  ) {
    global.__activeInstagramSession = {
      account: {
        id: process.env.INSTAGRAM_ACCOUNT_ID || 'ig_default_account',
        username: process.env.INSTAGRAM_ACCOUNT_USERNAME || 'instagram',
        name: process.env.INSTAGRAM_ACCOUNT_NAME || 'Minha Loja',
        profilePictureUrl: '',
        accountType: 'BUSINESS',
        connectedAt: new Date().toISOString(),
        tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        isSandbox: false,
      },
      accessTokenEncrypted: encryptAES256GCM(envToken),
    };
  }
  return global.__activeInstagramSession;
}

/**
 * Desconecta a conta ativa
 */
export function clearActiveInstagramSession() {
  global.__activeInstagramSession = null;
  global.__explicitlyDisconnected = true;
}

/**
 * Retorna o access token descriptografado e pronto para chamadas na Meta Graph API
 */
export function getValidAccessToken(): string | undefined {
  const session = getActiveInstagramSession();
  if (!session) return undefined;
  try {
    return decryptAES256GCM(session.accessTokenEncrypted);
  } catch {
    return undefined;
  }
}

