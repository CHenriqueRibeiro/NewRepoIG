/**
 * Cliente oficial e tipado para a API TypeSafe AI (System One / Jev)
 * Documentação: https://docs.typesafe.ai/introduction e https://docs.typesafe.ai/api
 */
import fs from 'node:fs';
import path from 'node:path';

export type JevQuestionType = 'choice' | 'score' | 'noul';

export interface JevQuestionChoice {
  type: 'choice';
  instructions: string | Record<string, any>;
  criteria: Record<string, string | null>;
}

export interface JevQuestionScore {
  type: 'score';
  instructions: string | Record<string, any>;
  criteria: string[];
}

export interface JevQuestionNoul {
  type: 'noul';
  instructions: string | Record<string, any>;
  criteria?: {
    true?: string;
    false?: string;
  };
}

export type JevQuestion = JevQuestionChoice | JevQuestionScore | JevQuestionNoul;

export interface JevSystemOneRequest {
  state: string | Record<string, any> | any[];
  model?: string; // default: 'jev-latest'
  questions: Record<string, JevQuestion>;
}

export interface JevChoiceAnswer {
  type: 'choice';
  choice: string;
  confidence: number;
  probabilities: Record<string, number>;
}

export interface JevScoreAnswer {
  type: 'score';
  score: number;
  confidence: number;
  legend: Record<string, string>;
  probabilities: Record<string, number>;
}

export interface JevNoulAnswer {
  type: 'noul';
  noul: number;
}

export type JevAnswer = JevChoiceAnswer | JevScoreAnswer | JevNoulAnswer;

export interface JevSystemOneResponse {
  model: string;
  answers: Record<string, JevAnswer>;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

const TYPESAFE_API_ENDPOINT = 'https://api.typesafe.ai/v1/systemone';

/**
 * Obtém a chave do TypeSafe AI configurada no ambiente
 */
export function getTypeSafeApiKey(): string | undefined {
  if (process.env.TYPESAFE_API_KEY) return process.env.TYPESAFE_API_KEY;
  if (process.env.NEXT_PUBLIC_TYPESAFE_API_KEY) return process.env.NEXT_PUBLIC_TYPESAFE_API_KEY;
  if ((global as any).__activeTypeSafeKey) return (global as any).__activeTypeSafeKey;

  // Carrega dinamicamente de .env.local se o servidor iniciou antes da adição da chave
  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/TYPESAFE_API_KEY=(.*)/);
      if (match && match[1]) {
        const key = match[1].trim();
        process.env.TYPESAFE_API_KEY = key;
        return key;
      }
    }
  } catch {}

  return undefined;
}

/**
 * Verifica se a API do TypeSafe está habilitada com chave
 */
export function isTypeSafeConfigured(customKey?: string): boolean {
  const key = customKey || getTypeSafeApiKey();
  return Boolean(key && key.trim().length > 10);
}

/**
 * Executa uma chamada de avaliação com o modelo Jev
 */
export async function callJevSystemOne(
  request: JevSystemOneRequest,
  apiKey?: string,
  timeoutMs: number = 6000
): Promise<JevSystemOneResponse> {
  const resolvedKey = apiKey || getTypeSafeApiKey();
  if (!resolvedKey) {
    throw new Error('Chave de API do TypeSafe (TYPESAFE_API_KEY) não configurada.');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const payload = {
      state: request.state,
      model: request.model || 'jev-latest',
      questions: request.questions,
    };

    const response = await fetch(TYPESAFE_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resolvedKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`TypeSafe API erro [HTTP ${response.status}]: ${errText || response.statusText}`);
    }

    const data: JevSystemOneResponse = await response.json();
    return data;
  } finally {
    clearTimeout(timer);
  }
}
