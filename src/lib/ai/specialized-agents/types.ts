/**
 * Definições de Tipos para os Agentes Especializados de Tarefa Única
 */

import type { ProductEntity } from '../../catalog/intelligent-types.ts';

export interface SpecializedAgentContext {
  storeId: string;
  storeName: string;
  storeHandle?: string;
  catalogSlug: string;
  buyerUsername: string;
  buyerId?: string;
  messageText: string;
  appUrl: string;
  storyUrl?: string;
  storyMediaId?: string;
  isFirstContact?: boolean;
  turnCount?: number;
  conversationContext?: any;
}

export type SpecializedAgentType =
  | 'product_identification'
  | 'catalog_link'
  | 'store_address'
  | 'checkout_pix'
  | 'faq_general'
  | 'human_handoff'
  | 'silence_ignore';

export interface SpecializedAgentResult {
  agentType: SpecializedAgentType;
  agentName: string;
  shouldReply: boolean;
  replyText: string;
  product?: ProductEntity;
  productLink?: string;
  confidence: number;
  metadata?: Record<string, any>;
}

export interface ISpecializedAgent {
  readonly type: SpecializedAgentType;
  readonly name: string;
  readonly description: string;
  execute(ctx: SpecializedAgentContext): Promise<SpecializedAgentResult>;
}
