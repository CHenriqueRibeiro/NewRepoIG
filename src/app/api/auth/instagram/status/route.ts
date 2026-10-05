import { NextRequest, NextResponse } from 'next/server';
import { getActiveInstagramSession } from '@/lib/instagram/auth';
import { addLiveLog } from '@/lib/logger/live-logs';

export async function GET(request: NextRequest) {
  try {
    const session = getActiveInstagramSession();

    if (!session) {
      addLiveLog('OAUTH', 'warn', 'Consulta de status: Nenhuma conta conectada.');
      return NextResponse.json({
        connected: false,
        account: null,
      });
    }

    addLiveLog(
      'OAUTH',
      'success',
      `Sessão do Instagram ativa: @${session.account.username} (${session.account.name})`,
      {
        id: session.account.id,
        accountType: session.account.accountType,
        tokenExpiresAt: session.account.tokenExpiresAt,
        isSandbox: Boolean(session.account.isSandbox),
      }
    );

    return NextResponse.json({
      connected: true,
      account: session.account,
      hasToken: Boolean(session.accessTokenEncrypted),
    });
  } catch (error: any) {
    addLiveLog('OAUTH', 'error', `Erro ao consultar status da conexão: ${error.message}`);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao consultar status da conexão' },
      { status: 500 }
    );
  }
}
