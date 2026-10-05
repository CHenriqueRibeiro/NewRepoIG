import { intentDiscoveryAgent } from './intent-discovery-agent.ts';
import type { CustomerIntentAnalysis, CustomerPrimaryIntent } from './intent-discovery-agent.ts';

/**
 * Filtro de Intenção de Venda e Serviços (Sales Intent Filter)
 * 
 * Papel:
 * - Delega ao Agente Exclusivo de Intenção e Descoberta (`CustomerIntentDiscoveryAgent`).
 * - A IA só responde se houver intenção de compra/serviço da jornada comercial.
 * - Mensagens fora do assunto (spam, pessoal, encerramentos) recebem silêncio absoluto.
 */

export type SalesIntentType = CustomerPrimaryIntent;

export interface SalesIntentResult {
  shouldReply: boolean;
  intent: SalesIntentType;
  confidence: number;
  reason: string;
  analysis?: CustomerIntentAnalysis;
}

/**
 * Avalia se a mensagem possui real intenção de compra, venda ou contratação de serviço.
 * Apenas mensagens da jornada comercial (do "Oi" até o "Quero comprar/agendar") recebem resposta.
 * Mensagens de encerramento ou fora do escopo são silenciadas.
 */
export function classifySalesIntent(params: {
  messageText: string;
  hasStoryContext?: boolean;
}): SalesIntentResult {
  const analysis = intentDiscoveryAgent.analyzeSync({
    messageText: params.messageText,
    hasStoryContext: params.hasStoryContext,
  });

  return {
    shouldReply: analysis.shouldReply,
    intent: analysis.primaryIntent,
    confidence: analysis.confidence,
    reason: analysis.reasoning,
    analysis,
  };
}
