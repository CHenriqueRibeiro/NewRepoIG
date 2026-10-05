import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { validateAndEncryptApiKey } from '@/lib/ai/byok-orchestrator';

export async function POST(request: NextRequest) {
  try {
    const { provider = 'openai', apiKey } = await request.json();

    if (!apiKey) {
      return NextResponse.json({ error: 'Chave de API não informada' }, { status: 400 });
    }

    const result = await validateAndEncryptApiKey(provider, apiKey);

    const cleanKey = apiKey.trim();
    // Salva a chave ativa para uso imediato pelo orquestrador e visão computacional
    (global as any).__activeAiKey = { provider: result.provider, key: cleanKey };
    if (result.provider === 'gemini') {
      (global as any).__activeGeminiKey = cleanKey;
      process.env.GEMINI_API_KEY = cleanKey;
      try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        if (fs.existsSync(envPath)) {
          let envContent = fs.readFileSync(envPath, 'utf8');
          if (envContent.includes('GEMINI_API_KEY=')) {
            envContent = envContent.replace(/GEMINI_API_KEY=.*/g, `GEMINI_API_KEY=${cleanKey}`);
          } else {
            envContent += `\nGEMINI_API_KEY=${cleanKey}\n`;
          }
          fs.writeFileSync(envPath, envContent, 'utf8');
        }
      } catch (e) {
        console.warn('Could not persist GEMINI_API_KEY to .env.local', e);
      }
    } else if (result.provider === 'openai') {
      (global as any).__activeOpenAiKey = cleanKey;
      process.env.OPENAI_API_KEY = cleanKey;
      try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        if (fs.existsSync(envPath)) {
          let envContent = fs.readFileSync(envPath, 'utf8');
          if (envContent.includes('OPENAI_API_KEY=')) {
            envContent = envContent.replace(/OPENAI_API_KEY=.*/g, `OPENAI_API_KEY=${cleanKey}`);
          } else {
            envContent += `\nOPENAI_API_KEY=${cleanKey}\n`;
          }
          fs.writeFileSync(envPath, envContent, 'utf8');
        }
      } catch (e) {
        console.warn('Could not persist OPENAI_API_KEY to .env.local', e);
      }
    } else if (result.provider === 'typesafe') {
      (global as any).__activeTypeSafeKey = cleanKey;
      process.env.TYPESAFE_API_KEY = cleanKey;
      try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        if (fs.existsSync(envPath)) {
          let envContent = fs.readFileSync(envPath, 'utf8');
          if (envContent.includes('TYPESAFE_API_KEY=')) {
            envContent = envContent.replace(/TYPESAFE_API_KEY=.*/g, `TYPESAFE_API_KEY=${cleanKey}`);
          } else {
            envContent += `\nTYPESAFE_API_KEY=${cleanKey}\n`;
          }
          fs.writeFileSync(envPath, envContent, 'utf8');
        }
      } catch (e) {
        console.warn('Could not persist TYPESAFE_API_KEY to .env.local', e);
      }
    }

    return NextResponse.json({
      success: true,
      provider: result.provider,
      maskedKey: result.maskedKey,
      encryptedKey: result.encryptedKey,
      message: 'Chave de API validada com sucesso via teste de 1 token e criptografada com AES-256-GCM!',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao validar chave de IA' }, { status: 400 });
  }
}
