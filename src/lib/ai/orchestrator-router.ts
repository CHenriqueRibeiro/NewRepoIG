/**
 * Agente Orquestrador Central com Roteamento por TypeSafe AI (Modelo Jev - System One)
 *
 * Princípio Arquitetural:
 * - O Jev atua como o "Cérebro Decisório Rápido" (System One): avalia em uma única passagem paralela
 *   a mensagem do cliente e escolhe o Agente Especialista de Tarefa Única mais adequado.
 * - Cada Agente Especialista executa uma única responsabilidade com perfeição.
 * - Inclui fallback resiliente caso o serviço de IA externa sofra instabilidade de rede.
 */

import { callJevSystemOne, isTypeSafeConfigured } from './typesafe-jev-client.ts';
import {
  ISpecializedAgent,
  SpecializedAgentContext,
  SpecializedAgentResult,
  SpecializedAgentType,
} from './specialized-agents/types.ts';
import { productIdentificationAgent } from './specialized-agents/product-identification-agent.ts';
import { catalogLinkAgent } from './specialized-agents/catalog-link-agent.ts';
import { storeAddressAgent } from './specialized-agents/store-address-agent.ts';
import { checkoutPixAgent } from './specialized-agents/checkout-pix-agent.ts';
import { faqAgent } from './specialized-agents/faq-agent.ts';
import { humanHandoffAgent } from './specialized-agents/human-handoff-agent.ts';
import { generateEmbedding, cosineSimilarity } from './embedding-service.ts';
import { intelligentCatalogService } from '../catalog/intelligent-service.ts';

export const AGENT_SEMANTIC_PROTOTYPES: Record<
  SpecializedAgentType,
  {
    title: string;
    description: string;
    semanticContext: string;
  }
> = {
  checkout_pix: {
    title: 'Pagamento & PIX',
    description: 'Chave pix, transferência bancária, pagamento de pedido, como pagar, finalizar compra e comprovante financeiro',
    semanticContext: 'pagamento pix transferência bancária transferir transfiro transferindo chave bancaria dados para pagar valor quantia montante custo preco finalizar pedido efetuar quitacao comprovante emitido comprovante pago fechar compra fechar encomenda dinheiro qr code copia e cola pagar agora quitar',
  },
  store_address: {
    title: 'Endereço & Retirada Presencial',
    description: 'Localização geográfica da loja física, endereço completo, ponto de retirada presencial ou coleta por motoboy Uber 99 e horário de funcionamento',
    semanticContext: 'endereco onde fica localizacao loja fisica ponto de retirada retirar presencialmente buscar no local como chegar rua avenida bairro horario funcionamento expediente motoboy uber flash',
  },
  catalog_link: {
    title: 'Catálogo & Vitrine Virtual',
    description: 'Acesso à vitrine online, link do catálogo de produtos e serviços, site da loja para ver todas as opções e novidades',
    semanticContext: 'catalogo vitrine virtual link site loja online ver todas as opcoes produtos servicos modelos novidades colecao completa olhar as novidades navegar na loja ver fotos',
  },
  human_handoff: {
    title: 'Atendente Humano & Suporte',
    description: 'Solicitação de suporte pessoal, falar com pessoa real, atendente humano, registrar reclamação ou insatisfação com atendimento',
    semanticContext: 'atendente humano falar com alguem atendente real pessoa fisica suporte equipe ajuda especializada reclamacao insatisfacao problema no pedido procon falar com atendente',
  },
  product_identification: {
    title: 'Identificação de Produto, Serviço & Estoque',
    description: 'Consulta sobre produto ou serviço específico, opções, tamanhos, cores, procedimento, agendamento, valor e disponibilidade',
    semanticContext: 'produto servico peca item corte barba unha manicure procedimento vestido blusa calca celular relogio tamanho cor modelo especificacao quanto custa valor preco tem disponivel pronta entrega agendamento horario estoque reserve para mim foto story',
  },
  faq_general: {
    title: 'FAQ, Frete & Saudações Gerais',
    description: 'Dúvidas sobre frete, envio, entrega para o CEP, correios, sedex, pac, transportadora, prazos de entrega, saudações de boas-vindas e funcionamento geral',
    semanticContext: 'frete envio envia enviam entrega entregam entregas correios sedex pac transportadora cep meu cep calcula frete calculo de frete prazo de entrega entrega para meu cep entrega para todo brasil taxa de entrega saudacao cordial ola oi oie bom dia boa tarde boa noite como funciona tudo bem tudo joia duvida geral atendimento',
  },
  silence_ignore: {
    title: 'Silêncio Comercial',
    description: 'Spam, mensagens desconexas, tentativas de golpe, ofensas, flerte pessoal ou encerramento formal',
    semanticContext: 'spam golpe flerte pessoal propaganda desconexo cripto parceria seguidores tchau obrigado valeu encerrar conversa',
  },
};

export interface OrchestrationResult {
  shouldReply: boolean;
  selectedAgentType: SpecializedAgentType;
  selectedAgentName: string;
  jevConfidence: number;
  jevRoutingSource: 'typesafe_jev' | 'vector_semantic_ai' | 'heuristic_fallback' | 'contextual_continuation';
  executionResult?: SpecializedAgentResult;
  reason?: string;
}

export class JevAgentOrchestrator {
  private agents: Map<SpecializedAgentType, ISpecializedAgent> = new Map();

  constructor() {
    this.registerAgent(productIdentificationAgent);
    this.registerAgent(catalogLinkAgent);
    this.registerAgent(storeAddressAgent);
    this.registerAgent(checkoutPixAgent);
    this.registerAgent(faqAgent);
    this.registerAgent(humanHandoffAgent);
  }

  public registerAgent(agent: ISpecializedAgent) {
    this.agents.set(agent.type, agent);
  }

  /**
   * Orquestra a mensagem do cliente, decidindo via Jev qual especialista atenderá
   */
  async routeAndExecute(
    ctx: SpecializedAgentContext,
    customApiKey?: string
  ): Promise<OrchestrationResult> {
    const text = (ctx.messageText || '').trim();
    if (!text) {
      return {
        shouldReply: false,
        selectedAgentType: 'silence_ignore',
        selectedAgentName: 'Silêncio',
        jevConfidence: 1.0,
        jevRoutingSource: 'heuristic_fallback',
        reason: 'Mensagem vazia recebida',
      };
    }

    // Contexto de conversação multi-turno
    const convContext = ctx.buyerId && ctx.storeId
      ? await intelligentCatalogService.getConversationContext(ctx.storeId, ctx.buyerId)
      : null;
    const isFirstContact = ctx.isFirstContact ?? (!convContext?.metadata?.greeting_sent && (convContext?.metadata?.turn_count || 0) === 0);
    const turnCount = ctx.turnCount ?? ((convContext?.metadata?.turn_count || 0) + 1);

    ctx.isFirstContact = isFirstContact;
    ctx.turnCount = turnCount;
    ctx.conversationContext = convContext;

    // Se o cliente respondeu "não tenho" / "não" a um pedido de foto/print feito pela loja no turno anterior
    const isNegationToPrint = /^(não|nao|não tenho|nao tenho|não tirei|nao tirei|não tenho print|nao tenho print|sem print|não tenho foto|nao tenho foto|perdi|não achei|nao achei)\b/i.test(text);
    if (isNegationToPrint && !isFirstContact) {
      const specialist = this.agents.get('product_identification')!;
      const execResult = await specialist.execute(ctx);
      if (ctx.buyerId && ctx.storeId) {
        await intelligentCatalogService.updateConversationContext(
          ctx.storeId,
          ctx.buyerId,
          execResult.product?.id,
          ctx.storyMediaId,
          ctx.buyerUsername,
          {
            greeting_sent: true,
            turn_count: turnCount,
            last_customer_text: text,
            last_reply_text: execResult.replyText,
            last_agent_type: 'product_identification',
          }
        );
      }
      return {
        shouldReply: true,
        selectedAgentType: 'product_identification',
        selectedAgentName: specialist.name,
        jevConfidence: 0.95,
        jevRoutingSource: 'contextual_continuation',
        executionResult: execResult,
      };
    }

    const norm = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

    // 0. Fast-Path Heurístico Instantâneo (< 2ms): economiza ~600ms de chamada externa quando a intenção é evidente
    let fastPathType: SpecializedAgentType | null = null;
    let fastPathConfidence = 0.98;

    // A. Saudações puras ou saudações curtas
    if (/^(oi|ola|oie|oii|oiii|bom dia|boa tarde|boa noite|e ai|e aí|tudo bem|tudo bom|opa)$/i.test(norm)) {
      fastPathType = 'faq_general';
    }
    // B. Perguntas explícitas sobre promoção / desconto / liquidação
    else if (/^(tem promocao|tem desconto|queria saber se tem promocao|tem liquidacao|tem pecas em promocao|tem peca em promocao|esta na promocao|tem saldao|quais as promocoes|promocao|promocoes|desconto|descontos)$/i.test(norm)) {
      fastPathType = 'faq_general';
    }
    // C. Pedido direto do link / catálogo / site da loja
    else if (/^(catalogo|link|site|vitrine|manda o link|me manda o link|manda o catalogo|passa o link|ver catalogo|ver vitrine|qual o link|qual o site|onde vejo os produtos)$/i.test(norm)) {
      fastPathType = 'catalog_link';
    }
    // D. Dúvidas diretas de endereço / retirada / localização
    else if (/^(onde fica|qual o endereco|qual o ponto de retirada|onde e a loja|como chegar|onde retirar|endereco|localizacao)$/i.test(norm)) {
      fastPathType = 'store_address';
    }
    // E. Dúvidas diretas de pagamento / PIX
    else if (/^(qual o pix|chave pix|passa o pix|manda o pix|dados para pagar|dados do pix|como pagar|pagar no pix)$/i.test(norm)) {
      fastPathType = 'checkout_pix';
    }
    // F. Dúvidas diretas de frete, envio, entrega ou CEP
    else if (/\b(frete|envio|envia|enviam|entrega|entregam|entregas|correios|sedex|pac|transportadora|cep)\b/i.test(norm) || /\b\d{5}-?\d{3}\b/.test(text)) {
      fastPathType = 'faq_general';
    }

    if (fastPathType) {
      const specialist = this.agents.get(fastPathType)!;
      const execResult = await specialist.execute(ctx);
      if (ctx.buyerId && ctx.storeId) {
        await intelligentCatalogService.updateConversationContext(
          ctx.storeId,
          ctx.buyerId,
          execResult.product?.id,
          ctx.storyMediaId,
          ctx.buyerUsername,
          {
            greeting_sent: true,
            turn_count: turnCount,
            last_customer_text: text,
            last_reply_text: execResult.replyText,
            last_agent_type: fastPathType,
          }
        );
      }
      return {
        shouldReply: true,
        selectedAgentType: fastPathType,
        selectedAgentName: specialist.name,
        jevConfidence: fastPathConfidence,
        jevRoutingSource: 'heuristic_fallback',
        executionResult: execResult,
      };
    }

    // 1. Tenta rotear via TypeSafe AI (Jev)
    if (isTypeSafeConfigured(customApiKey)) {
      try {
        console.log(`🤖 [Jev Orchestrator] Enviando mensagem para decisão com TypeSafe Jev (Turno ${turnCount})...`);

        const lastReplyText = convContext?.metadata?.last_reply_text;
        const historySummary = lastReplyText
          ? `\nHistórico Recente da Conversa (Turno ${turnCount}):\n- Última fala da Loja: "${lastReplyText.slice(0, 140)}"\n- Resposta do Cliente agora: "${text}"`
          : `\nNovo Contato (Turno 1)`;

        const stateDescription = `Mensagem do Cliente: "${text}"\nLoja: ${ctx.storeName || 'Loja'}${
          ctx.storyUrl || ctx.storyMediaId ? ' (Contexto: Story do Instagram)' : ''
        }${historySummary}`;

        const jevResponse = await callJevSystemOne(
          {
            state: stateDescription,
            model: 'jev-latest',
            questions: {
              target_agent: {
                type: 'choice',
                instructions: 'Qual agente especializado deve atender esta mensagem do cliente da loja?',
                criteria: {
                  product_identification:
                    'Cliente perguntando sobre um produto ou serviço específico (ex: corte, manicure, estética, eletrônico, vestido, perfume), disponibilidade, agendamento, tamanho, cor, opções ou valor de um item.',
                  catalog_link:
                    'Cliente pedindo link da loja, catálogo virtual, site ou querendo ver todas as opções, produtos e serviços disponíveis.',
                  store_address:
                    'Cliente perguntando onde fica a loja física, endereço, ponto de retirada no local, como chegar ou horário de funcionamento.',
                  checkout_pix:
                    'Cliente querendo pagar, pedindo chave PIX, dados bancários para transferência ou confirmando pagamento com comprovante. NUNCA selecione para dúvidas de frete, envio, entrega ou CEP.',
                  faq_general:
                    'Dúvidas sobre frete, cálculo de envio, entrega, Correios, Sedex, PAC, prazos de entrega, envio para o CEP do cliente, ou saudações de boas-vindas e funcionamento geral.',
                  human_handoff:
                    'Cliente bravo, com reclamação de pedido, problema de entrega, insatisfeito ou pedindo explicitamente atendente humano.',
                  silence_ignore:
                    'Spam, flerte/cantadas, mensagem desconexa sem nenhuma relação comercial ou encerramento final definitivo ("obrigado, tchau", "valeu, até mais"). Respostas curtas de continuação (ex: "não tenho", "não tenho print", "não", "sim") NÃO são silêncio e devem ser atendidas.',
                },
              },
              should_reply: {
                type: 'noul',
                instructions: 'A loja deve responder a esta mensagem do cliente?',
                criteria: {
                  true: 'Mensagem legítima do cliente com dúvida, interesse em produto, pedido, resposta a pergunta da loja (ex: "não tenho", "não"), reclamação ou solicitação de atendimento.',
                  false: 'Spam, cantada, encerramento final sem nova pergunta ou texto desconexo.',
                },
              },
            },
          },
          customApiKey
        );

        const targetAgentAnswer = jevResponse.answers['target_agent'];
        const shouldReplyAnswer = jevResponse.answers['should_reply'];

        if (targetAgentAnswer && targetAgentAnswer.type === 'choice') {
          const selectedChoice = targetAgentAnswer.choice as SpecializedAgentType;
          const confidence = targetAgentAnswer.confidence || 1.0;
          const shouldReplyNoul = shouldReplyAnswer?.type === 'noul' ? shouldReplyAnswer.noul : 1.0;

          console.log(
            `🎯 [Jev Decisão] Agente Escolhido: "${selectedChoice}" | Confiança: ${(confidence * 100).toFixed(0)}% | ShouldReply: ${shouldReplyNoul}`
          );

          // Se o Jev decidiu por silêncio ou probabilidade de resposta muito baixa
          if (selectedChoice === 'silence_ignore' || shouldReplyNoul < 0.4) {
            return {
              shouldReply: false,
              selectedAgentType: 'silence_ignore',
              selectedAgentName: 'Silêncio Comercial',
              jevConfidence: confidence,
              jevRoutingSource: 'typesafe_jev',
              reason: 'Decisão do Jev: Mensagem fora do escopo ou sem intenção comercial.',
            };
          }

          // Executa o agente especialista selecionado
          const specialist = this.agents.get(selectedChoice);
          if (specialist) {
            const execResult = await specialist.execute(ctx);
            if (ctx.buyerId && ctx.storeId) {
              await intelligentCatalogService.updateConversationContext(
                ctx.storeId,
                ctx.buyerId,
                execResult.product?.id,
                ctx.storyMediaId,
                ctx.buyerUsername,
                {
                  greeting_sent: true,
                  turn_count: turnCount,
                  last_customer_text: text,
                  last_reply_text: execResult.replyText,
                  last_agent_type: selectedChoice,
                }
              );
            }
            return {
              shouldReply: execResult.shouldReply,
              selectedAgentType: selectedChoice,
              selectedAgentName: specialist.name,
              jevConfidence: confidence,
              jevRoutingSource: 'typesafe_jev',
              executionResult: execResult,
            };
          }
        }
      } catch (jevErr: any) {
        console.warn(`⚠️ [Jev Orchestrator Aviso]: Falha ao consultar TypeSafe Jev (${jevErr.message}). Acionando fallback heurístico local...`);
      }
    }

    // 2. Motor de IA Vetorial Semântico (Embeddings & Similaridade de Cosseno)
    // 100% IA mesmo offline ou sem chave externa: opera no hiperespaço semântico vetorial sem palavras-chave
    console.log(`🧠 [IA Vetorial Semântica] Classificando intenção e roteando por similaridade vetorial densa...`);

    const hasStoryContext = Boolean(ctx.storyUrl || ctx.storyMediaId);
    const inputEmbedding = await generateEmbedding(text);

    let selectedAgentType: SpecializedAgentType = hasStoryContext ? 'product_identification' : 'faq_general';
    let highestSimilarity = -1;

    for (const [agentKey, prototype] of Object.entries(AGENT_SEMANTIC_PROTOTYPES)) {
      const protoEmbedding = await generateEmbedding(prototype.semanticContext);
      let sim = cosineSimilarity(inputEmbedding, protoEmbedding);

      // Story do Instagram é interação visual direta com peça/produto
      if (agentKey === 'product_identification' && hasStoryContext) {
        sim += 0.35;
      }

      if (sim > highestSimilarity) {
        highestSimilarity = sim;
        selectedAgentType = agentKey as SpecializedAgentType;
      }
    }

    if (selectedAgentType === 'silence_ignore') {
      return {
        shouldReply: false,
        selectedAgentType: 'silence_ignore',
        selectedAgentName: 'Silêncio Comercial',
        jevConfidence: Math.max(0.85, highestSimilarity),
        jevRoutingSource: 'vector_semantic_ai',
        reason: 'Classificado pelo modelo vetorial de IA como fora de escopo ou encerramento.',
      };
    }

    const specialist = this.agents.get(selectedAgentType) || this.agents.get('faq_general')!;
    const execResult = await specialist.execute(ctx);

    if (ctx.buyerId && ctx.storeId) {
      await intelligentCatalogService.updateConversationContext(
        ctx.storeId,
        ctx.buyerId,
        execResult.product?.id,
        ctx.storyMediaId,
        ctx.buyerUsername,
        {
          greeting_sent: true,
          turn_count: turnCount,
          last_customer_text: text,
          last_reply_text: execResult.replyText,
          last_agent_type: selectedAgentType,
        }
      );
    }

    return {
      shouldReply: execResult.shouldReply,
      selectedAgentType,
      selectedAgentName: specialist.name,
      jevConfidence: Math.min(1.0, Math.max(0.7, highestSimilarity)),
      jevRoutingSource: 'vector_semantic_ai',
      executionResult: execResult,
    };
  }
}

export const jevAgentOrchestrator = new JevAgentOrchestrator();
