import { NextRequest, NextResponse } from 'next/server';
import { clearActiveInstagramSession } from '@/lib/instagram/auth';

export async function POST(request: NextRequest) {
  try {
    clearActiveInstagramSession();
    return NextResponse.json({
      success: true,
      message: 'Conta do Instagram desconectada com sucesso.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao desconectar conta' },
      { status: 500 }
    );
  }
}
