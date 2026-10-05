import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { checkAndSetWebhookIdempotency, redis } from '@/lib/redis/locks';
import { processCustomerInteractionWithAI } from '@/lib/ai/byok-orchestrator';
import { processCustomerMessage, searchMatchingProducts } from '@/lib/ai/customer-agent';
import { classifySalesIntent } from '@/lib/ai/sales-intent-filter';
import { jevAgentOrchestrator } from '@/lib/ai/orchestrator-router';
import { instagramClient } from '@/lib/instagram/client';
import { dispatchTask } from '@/lib/qstash/client';
import { getServerSupabase, isSupabaseConfigured, ensureStoreInSupabase, supabase } from '@/lib/supabase/client';
import { getActiveInstagramSession, getValidAccessToken } from '@/lib/instagram/auth';
import { decryptAES256GCM } from '@/lib/crypto/encryption';
import { getServerCatalog, resolveActiveStoreIdentity, isCatalogPublishable } from '@/lib/catalog/storage';
import { getPublicAppUrl, buildProductCleanUrl } from '@/lib/catalog/url-helpers';
import { intelligentCatalogService } from '@/lib/catalog/intelligent-service';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
    }

    // 1. Checagem de Idempotência no Redis (Prevenção Anti-Replay)
    const payloadHash = crypto.createHash('sha256').update(rawBody).digest('hex');
    const isNew = await checkAndSetWebhookIdempotency(payloadHash);
    if (!isNew) {
      console.log(`[Worker] Evento duplicado descartado por idempotência: ${payloadHash.slice(0, 10)}`);
      return NextResponse.json({ status: 'ignored_duplicate' });
    }

    // Processa cada entrada do webhook do Instagram
    const entries = payload.entry || [];
    for (const entry of entries) {
      // Cenário A: Comentários em Feed / Reels
      if (entry.changes) {
        for (const change of entry.changes) {
          if (change.field === 'comments') {
            await handleCommentChange(change.value);
          }
        }
      }

      // Cenário B: Direct Messages / Respostas a Stories
      if (entry.messaging) {
        for (const msgEvent of entry.messaging) {
          await handleMessagingEvent(msgEvent);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Worker Fatal Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handleCommentChange(value: any) {
  const commentId = value.id;
  const text = value.text || '';
  const fromHandle = value.from?.username || '@cliente';
  const fromId = value.from?.id || 'unknown';
  const parentId = value.parent_id;

  console.log(`\n💬 ==================== [WORKER COMENTÁRIO RECEBIDO] ====================`);
  console.log(`⏰ Horário: ${new Date().toLocaleTimeString('pt-BR')}`);
  console.log(`👤 Autor: ${fromHandle} (ID: ${fromId})`);
  console.log(`📝 Comentário ID: ${commentId}`);
  console.log(`💬 Texto: "${text}"`);
  if (parentId) console.log(`↩️ Parent ID: ${parentId} (Resposta a outro comentário)`);

  // 0. Identidade da Loja e Conexão Instagram
  const session = getActiveInstagramSession();
  const storeId = session?.account?.id;
  const storeUsername = session?.account?.username?.toLowerCase().replace('@', '');
  const cleanFromHandle = fromHandle.toLowerCase().replace('@', '');

  // Apenas considera eco da própria loja se o autor da resposta for comprovadamente a conta da própria loja
  const isSelfReply =
    Boolean(parentId) &&
    ((storeId && fromId === storeId) ||
      (storeUsername && cleanFromHandle === storeUsername && cleanFromHandle !== 'test' && cleanFromHandle !== 'cliente'));

  if (isSelfReply) {
    const pendingKey = `bodyguard:pending:${parentId}`;
    await redis.set(pendingKey, 'RESPONDIDO_HUMANO');
    console.log(`↩️ [Worker Eco] Resposta manual da própria loja detectada para comentário ${parentId}. Ignorando IA.`);
    console.log(`========================================================================\n`);
    return;
  }

  // 1. Módulo Zero: Registrar interação para Auditoria de Vácuo & Telemetria
  if (isSupabaseConfigured) {
    try {
      const dbStoreId = await ensureStoreInSupabase({
        id: storeId,
        username: storeUsername,
        name: session?.account?.name,
      });

      if (dbStoreId) {
        const db = getServerSupabase();
        await db.from('interactions').insert([
          {
            store_id: dbStoreId,
            buyer_username: fromHandle,
            buyer_id: fromId,
            origin: 'feed',
            intent_detected: 'Dúvida sobre peça',
            comment_text: text,
            status: 'aguardando',
            wait_time_seconds: 0,
            created_at: new Date().toISOString(),
          },
        ]);
      }
    } catch (dbErr) {
      console.warn('[Supabase Interaction Warn]:', dbErr);
    }
  }

  // 2. Filtro Estrito de Intenção de Venda / Compra / Serviços para comentários
  const commentIntent = classifySalesIntent({ messageText: text });
  if (!commentIntent.shouldReply) {
    console.log(`🔇 [Worker Comentário Silenciado] Comentário de @${fromHandle} sem intenção de venda/serviço (${commentIntent.intent}): "${text}". Motivo: ${commentIntent.reason}`);
    console.log(`========================================================================\n`);
    return;
  }

  // 3. Identidade da Loja e Conexão Instagram
  const token = getValidAccessToken();
  const storeProfile = await instagramClient.getStoreProfile(token);
  const instagramName = storeProfile?.name || session?.account?.name;
  const instagramHandle = storeProfile?.username || session?.account?.username || 'app_quota';

  const activeStore = resolveActiveStoreIdentity(session?.account);
  const activeCatalog = getServerCatalog(activeStore.slug);
  const canShareCatalog = isCatalogPublishable(activeCatalog);
  const storeName = (instagramName && instagramName !== 'Minha Loja')
    ? instagramName
    : (activeCatalog.storeName && activeCatalog.storeName !== 'Minha Loja' ? activeCatalog.storeName : 'Quota');
  const resolvedSlug = activeCatalog.slug || activeStore.slug;
  const resolvedStoreId = storeProfile?.id || activeStore.storeId;
  const publicUrl = getPublicAppUrl();
  const generalCatalogLink = canShareCatalog ? `${publicUrl}/${resolvedSlug}` : undefined;

  console.log(`🏪 Loja: ${storeName} (@${instagramHandle})`);
  console.log(`🔑 Token presente: ${token ? 'SIM (válido)' : 'NÃO (ausente)'}`);
  console.log(`📦 Catálogo Aprovado/Publicável: ${canShareCatalog ? 'SIM (link ativo)' : 'NÃO (sem link público)'}`);

  // Extração do ID de mídia do post/Reels
  const rawMediaId = value.media?.id || (value.post_id ? (value.post_id.includes('_') ? value.post_id.split('_')[1] : value.post_id) : undefined) || value.object_id || value.media_id;
  const mediaId = rawMediaId ? String(rawMediaId) : '';

  // Modo padrão: Resposta autônoma imediata (24/7)
  let storeMode: string = 'total_24_7';

  if (storeMode === 'total_24_7') {
    try {
      console.log(`🧠 [Worker IA] Analisando contexto da publicação e intenção do seguidor @${fromHandle}...`);

      // 1. Busca detalhes do post/Reels na Meta Graph API (legenda, link e mídias)
      let mediaCaption = '';
      let mediaPermalink = '';
      let mediaUrl = '';
      if (mediaId && token) {
        try {
          const mediaDetails = await instagramClient.getMediaDetails(mediaId, token);
          if (mediaDetails) {
            mediaCaption = mediaDetails.caption || '';
            mediaPermalink = mediaDetails.permalink || '';
            mediaUrl = mediaDetails.media_url || '';
            console.log(`📸 [Worker Post Contexto] Mídia ID: ${mediaId} | Legenda: "${mediaCaption.slice(0, 100)}..."`);
          }
        } catch (err: any) {
          console.warn(`[Worker Media Fetch Warn]:`, err.message);
        }
      }

      // 2. Localiza o produto no catálogo vinculado a esta publicação
      const allProducts = await intelligentCatalogService.listProducts(resolvedStoreId, resolvedSlug);
      let targetProduct: any;

      if (mediaId) {
        const relation = await intelligentCatalogService.getRelationByMediaId(mediaId);
        if (relation?.product_id) {
          targetProduct = allProducts.find((p) => p.id === relation.product_id);
        }
        if (!targetProduct) {
          targetProduct = allProducts.find((p) => p.images?.some((img) => img.source_media_id === mediaId));
        }
      }

      if (!targetProduct && (mediaCaption || text)) {
        const searchQuery = [mediaCaption, text].filter(Boolean).join(' ');
        const searchResult = searchMatchingProducts(searchQuery, allProducts);
        if (searchResult.bestMatch) {
          targetProduct = searchResult.bestMatch;
        }
      }

      if (!targetProduct && allProducts.length === 1) {
        targetProduct = allProducts[0];
      }

      const cleanHandle = fromHandle.replace(/^@+/, '');
      const isGenericHandle = !cleanHandle || cleanHandle.toLowerCase() === 'cliente';
      const greetingName = isGenericHandle ? 'Oie' : `Oie, ${cleanHandle}`;

      let replyText = '';

      if (targetProduct) {
        if (!targetProduct.price_cents || targetProduct.price_cents <= 0) {
          replyText = `${greetingName}! Vi sua mensagem sobre essa peça! ✨ Ela é uma novidade que acabou de chegar e ainda não está no catálogo com valor oficial, mas em breve vai ser colocada!\nNossa equipe já está finalizando o cadastro. Se quiser, assim que o valor for liberado eu te aviso por aqui! 💖`;
        } else {
          const productLink = canShareCatalog ? buildProductCleanUrl(publicUrl, resolvedSlug, targetProduct) : undefined;
          const priceFormatted = (targetProduct.price_cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

          const availableVariants = targetProduct.variants
            ?.filter((v: any) => v.stock_quantity > 0)
            .map((v: any) => v.name);

          const sizesText = availableVariants && availableVariants.length > 0
            ? `Tamanhos: ${availableVariants.join(', ')}`
            : undefined;

          const detailsParts: string[] = [];
          if (priceFormatted) detailsParts.push(`Valor: ${priceFormatted}`);
          if (sizesText) detailsParts.push(sizesText);
          const detailsStr = detailsParts.length > 0 ? ` (${detailsParts.join(' | ')})` : '';

          if (productLink) {
            replyText = `${greetingName}! Vi seu comentário no nosso post sobre o(a) **${targetProduct.title}**! ✨\n\nEssa peça está disponível${detailsStr}.\n\nVocê pode conferir mais fotos, detalhes e garantir o seu direto na nossa vitrine:\n🔗 ${productLink}\n\nSe tiver qualquer dúvida sobre medidas ou entrega, pode me chamar aqui! 💖`;
          } else {
            replyText = `${greetingName}! Vi seu comentário no nosso post sobre o(a) **${targetProduct.title}**! ✨\n\nEssa peça está disponível${detailsStr}.\n\nSe quiser garantir a sua unidade ou tiver dúvidas sobre tamanhos ou entrega, pode me chamar aqui no direct que te passo todos os detalhes! 💖`;
          }
        }

        // 3. PERSISTE O CONTEXTO DA CONVERSA:
        // Vincula o produto ao cliente para que as próximas mensagens no Direct saibam de qual peça se trata
        await intelligentCatalogService.updateConversationContext(
          resolvedStoreId,
          fromId,
          targetProduct.id,
          mediaId,
          cleanHandle,
          {
            greeting_sent: true,
            demand_inquiry_sent: true,
            turn_count: 1,
            origin: 'post_comment',
            last_product_title: targetProduct.title,
            last_post_media_id: mediaId,
          }
        );
        console.log(`📌 [Worker Contexto Salvo] Cliente @${cleanHandle} vinculado a "${targetProduct.title}" (ID: ${targetProduct.id})`);
      } else {
        const postSnippet = mediaCaption ? ` sobre "${mediaCaption.slice(0, 50).trim()}..."` : '';
        if (canShareCatalog && generalCatalogLink) {
          replyText = `${greetingName}! Vi seu comentário na nossa publicação recente${postSnippet}! ✨ Que bom ter você por aqui!\n\nVocê pode conferir todas as nossas peças disponíveis, fotos e valores direto na nossa vitrine oficial:\n🔗 ${generalCatalogLink}\n\nSe você procura alguma peça, cor ou tamanho específico, me conta aqui que eu te ajudo com o maior carinho! 💖`;
        } else {
          replyText = `${greetingName}! Vi seu comentário na nossa publicação recente${postSnippet}! ✨ Que bom ter você por aqui!\n\nSe você procura alguma peça, cor ou tamanho específico (ou viu algo que amou nos nossos posts e stories), me conta aqui no direct que eu te ajudo com o maior carinho! 💖`;
        }

        await intelligentCatalogService.updateConversationContext(
          resolvedStoreId,
          fromId,
          undefined,
          mediaId,
          cleanHandle,
          {
            greeting_sent: true,
            demand_inquiry_sent: true,
            turn_count: 1,
            origin: 'post_comment',
            last_post_media_id: mediaId,
          }
        );
      }

      console.log(`💡 [Worker IA Resposta Comentário] Produto: "${targetProduct?.title || 'Vitrine Geral'}"`);
      console.log(`✉️ Texto da Resposta: "${replyText}"`);

      // 4. Envia resposta privada no Direct do cliente (se o comentário permitir)
      try {
        console.log(`📤 [Worker Direct] Enviando Private Reply no Direct de @${cleanHandle}...`);
        const prRes = await instagramClient.sendPrivateReply({
          commentId,
          messageText: replyText,
          accessToken: token,
        });
        console.log(`🎉 [Worker SUCESSO] Private Reply enviada no Direct para @${cleanHandle}! Resposta Meta:`, prRes);
      } catch (privateErr: any) {
        console.warn(`⚠️ [Worker] Private Reply não autorizada pela Meta: ${privateErr.message}`);
        console.log(`📢 [Worker Fallback] Tentando responder publicamente no comentário do post...`);
        // Fallback: Envia resposta pública no comentário do post
        const crRes = await instagramClient.sendCommentReply({
          commentId,
          messageText: replyText,
          accessToken: token,
        });
        console.log(`🎉 [Worker SUCESSO] Resposta pública enviada no post para @${cleanHandle}! Resposta Meta:`, crRes);
      }

      if (isSupabaseConfigured) {
        await supabase.from('interactions').insert([
          {
            store_id: resolvedStoreId,
            buyer_username: fromHandle,
            buyer_id: fromId,
            origin: 'feed',
            intent_detected: targetProduct ? `Post: ${targetProduct.title}` : 'Comentário no Post',
            comment_text: text,
            store_reply_text: replyText,
            status: 'respondido',
            ai_handled: true,
            created_at: new Date().toISOString(),
            replied_at: new Date().toISOString(),
          },
        ]);
      }
    } catch (aiErr: any) {
      console.error(`❌ [Worker IA Error]:`, aiErr.message);
    }
  } else if (storeMode === 'guarda_costas') {
    const storeDelayMinutes = 15;
    const pendingKey = `bodyguard:pending:${commentId}`;
    await redis.set(pendingKey, 'PENDENTE_HUMANO', { ex: 3600 });

    const bodyguardEndpoint = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/worker/bodyguard-check`;
    await dispatchTask({
      destinationUrl: bodyguardEndpoint,
      body: {
        commentId,
        fromHandle,
        text,
        pendingKey,
      },
      delaySeconds: storeDelayMinutes * 60,
    });

    console.log(`[Worker Guarda-Costas] Delayed Task agendada no QStash para ${storeDelayMinutes} min (comentário ${commentId})`);
  }
}
async function handleMessagingEvent(msgEvent: any) {
  const senderId = msgEvent.sender?.id;
  const isEcho = Boolean(msgEvent.message?.is_echo);
  const text = msgEvent.message?.text || '';
  const storyUrl = msgEvent.message?.reply_to?.story?.url || msgEvent.reaction?.reply_to?.story?.url;
  const reaction = msgEvent.reaction;

  console.log(`\n✉️ ==================== [WORKER DIRECT EVENTO RECEBIDO] ====================`);
  console.log(`⏰ Horário: ${new Date().toLocaleTimeString('pt-BR')}`);
  console.log(`👤 Remetente ID: ${senderId}`);
  console.log(`💬 Texto da Mensagem: "${text}"`);
  console.log(`🔄 É resposta automática/eco: ${isEcho}`);
  if (reaction) console.log(`❤️ Reação recebida: ${reaction.emoji || reaction.action}`);
  if (storyUrl) console.log(`📸 Story relacionado: ${storyUrl}`);

  // Se for eco (loja respondeu manualmente pelo app do Instagram)
  if (isEcho) {
    console.log(`↩️ [Worker Eco Direct] Mensagem enviada pela própria loja no app. Ignorando resposta de IA.`);
    console.log(`========================================================================\n`);
    return;
  }

  const session = getActiveInstagramSession();
  const token = getValidAccessToken();

  // Busca perfil oficial da loja na Meta (/me)
  const storeProfile = await instagramClient.getStoreProfile(token);
  const instagramName = storeProfile?.name || session?.account?.name;
  const instagramHandle = storeProfile?.username || session?.account?.username || 'app_quota';

  // Busca perfil real do cliente na Meta (Nome oficial e @username)
  const clientProfile = await instagramClient.getUserProfile(senderId, token);
  const buyerHandle = clientProfile?.username ? `@${clientProfile.username.replace(/^@+/, '')}` : `@${senderId}`;
  const buyerDisplayName = clientProfile?.name || clientProfile?.username?.replace(/^@+/, '') || 'Cliente';
  console.log(`👤 Cliente Identificado na Meta: ${buyerDisplayName} (${buyerHandle}) | Loja: ${instagramName} (@${instagramHandle})`);

  // 1. Canal: Reações a Stories (Emoji: 🔥, ❤️, etc.)
  if (reaction && reaction.action === 'react') {
    const emoji = reaction.emoji || '❤️';
    console.log(`❤️ [Worker Story Reaction] De: ${buyerHandle} | Emoji: ${emoji}`);

    const welcomeMsg = `Oie, ${buyerDisplayName}! Ficamos muito felizes que você curtiu esse look no Story da *${instagramName || 'loja'}*! ✨ Deseja saber os tamanhos disponíveis ou valores com frete para sua região?`;
    console.log(`📤 [Worker Direct] Enviando resposta a reação de Story para ${buyerHandle}...`);
    const dmRes = await instagramClient.sendDirectMessage({
      recipientId: senderId,
      messageText: welcomeMsg,
      quickReplies: [
        { title: 'Ver Tamanhos', payload: 'VER_TAMANHOS' },
        { title: 'Consultar Valor', payload: 'CONSULTAR_VALOR' },
      ],
      accessToken: token,
    });
    console.log(`🎉 [Worker SUCESSO] Direct enviado para ${buyerHandle}! Resposta Meta:`, dmRes);
    console.log(`========================================================================\n`);
    return;
  }

  // 2. Canal: Respostas a Stories ou DMs com Story relacionado
  if (storyUrl) {
    const storyMediaId = msgEvent.message?.reply_to?.story?.id;
    console.log(`📸 [Worker Story Reply] De: ${buyerHandle} | Pergunta: "${text}" | Story URL: ${storyUrl}`);

    const activeStore = resolveActiveStoreIdentity(session?.account);
    const activeCatalog = getServerCatalog(activeStore.slug);
    const resolvedStoreName = (instagramName && instagramName !== 'Minha Loja')
      ? instagramName
      : (activeCatalog.storeName && activeCatalog.storeName !== 'Minha Loja' ? activeCatalog.storeName : 'Quota');
    const resolvedSlug = activeCatalog.slug || activeStore.slug;
    const resolvedStoreId = storeProfile?.id || activeStore.storeId;
    const publicUrl = getPublicAppUrl();

    const customerRes = await processCustomerMessage({
      storeId: resolvedStoreId,
      storeName: resolvedStoreName,
      storeHandle: instagramHandle,
      catalogSlug: resolvedSlug,
      buyerId: senderId,
      buyerUsername: buyerDisplayName,
      messageText: text || 'Gostei dessa peça, quanto custa?',
      storyUrl,
      storyMediaId,
      appUrl: publicUrl,
    });

    console.log(`💡 [Worker Story Resposta] Origem: ${customerRes.processingSource} (IA Poupada: ${customerRes.cachedAvoidedAiExecution})`);

    if (!customerRes.shouldReply) {
      console.log(`🔇 [Worker Story Silenciado] Mensagem sem intenção de venda/serviço (${customerRes.intent}). IA não enviará Direct.`);
      console.log(`========================================================================\n`);
      return;
    }

    console.log(`📤 [Worker Direct] Enviando resposta para ${buyerHandle}...`);

    const dmRes = await instagramClient.sendDirectMessage({
      recipientId: senderId,
      messageText: customerRes.replyText,
      accessToken: token,
    });
    console.log(`🎉 [Worker SUCESSO] Direct enviado para ${buyerHandle}! Resposta Meta:`, dmRes);

    if (isSupabaseConfigured) {
      try {
        const dbStoreId = await ensureStoreInSupabase({
          id: resolvedStoreId,
          username: session?.account?.username,
          name: resolvedStoreName,
        });

        if (dbStoreId) {
          const db = getServerSupabase();
          await db.from('interactions').insert([
            {
              store_id: dbStoreId,
              buyer_username: buyerHandle,
              buyer_id: senderId,
              origin: 'story',
              intent_detected: customerRes.productTitle ? `Story: ${customerRes.productTitle}` : 'Dúvida no Story',
              comment_text: text || 'Resposta ao Story',
              store_reply_text: customerRes.replyText,
              status: 'respondido',
              ai_handled: true,
              created_at: new Date().toISOString(),
              replied_at: new Date().toISOString(),
            },
          ]);

          await db.from('conversations').upsert(
            {
              store_id: dbStoreId,
              buyer_id: senderId,
              buyer_username: buyerHandle,
              metadata: {
                last_story_url: storyUrl,
                last_reply: customerRes.replyText,
                detected_product: customerRes.productTitle || null,
              },
              last_interaction_at: new Date().toISOString(),
            },
            { onConflict: 'store_id,buyer_id' }
          );
        }
      } catch (dbErr) {
        console.warn('[Supabase Story Interaction Warn]:', dbErr);
      }
    }

    console.log(`========================================================================\n`);
    return;
  }

  // 3. Canal: Mensagens Diretas (DMs / Dúvidas no Inbox com Contexto de Conversa & HNSW)
  if (text) {
    console.log(`💬 [Worker Direct] Processando dúvida com o Orquestrador Jev (TypeSafe AI) para ${buyerHandle}...`);

    const activeStore = resolveActiveStoreIdentity(session?.account);
    const activeCatalog = getServerCatalog(activeStore.slug);
    const resolvedStoreName = (instagramName && instagramName !== 'Minha Loja')
      ? instagramName
      : (activeCatalog.storeName && activeCatalog.storeName !== 'Minha Loja' ? activeCatalog.storeName : 'Quota');
    const resolvedSlug = activeCatalog.slug || activeStore.slug;
    const resolvedStoreId = storeProfile?.id || activeStore.storeId;
    const publicUrl = getPublicAppUrl();

    const orchestration = await jevAgentOrchestrator.routeAndExecute({
      storeId: resolvedStoreId,
      storeName: resolvedStoreName,
      storeHandle: instagramHandle,
      catalogSlug: resolvedSlug,
      buyerId: senderId,
      buyerUsername: buyerDisplayName,
      messageText: text,
      appUrl: publicUrl,
    });

    if (!orchestration.shouldReply) {
      console.log(`🔇 [Worker Direct Silenciado] Cliente ${buyerHandle} mensagem sem intenção de venda/serviço (${orchestration.selectedAgentName}). A IA permanecerá em silêncio.`);
      console.log(`========================================================================\n`);
      return;
    }

    const replyText = orchestration.executionResult?.replyText;
    if (!replyText) {
      console.log(`⚠️ [Worker Direct] Agente ${orchestration.selectedAgentName} não gerou texto de resposta.`);
      return;
    }

    console.log(`🎯 [Worker Jev Roteamento] Especialista: ${orchestration.selectedAgentName} (${orchestration.selectedAgentType}) | Confiança: ${(orchestration.jevConfidence * 100).toFixed(0)}% | Origem: ${orchestration.jevRoutingSource}`);
    console.log(`✉️ Texto: "${replyText}"`);
    console.log(`📤 [Worker Direct] Disparando envio via Meta Graph API para destinatário ${buyerHandle} (${senderId})...`);

    try {
      const dmRes = await instagramClient.sendDirectMessage({
        recipientId: senderId,
        messageText: replyText,
        accessToken: token,
      });
      console.log(`🎉 [Worker SUCESSO] Direct entregue com sucesso pela Meta para ${buyerHandle}! Resposta Meta:`, dmRes);

      if (isSupabaseConfigured) {
        try {
          const dbStoreId = await ensureStoreInSupabase({
            id: resolvedStoreId,
            username: session?.account?.username,
            name: resolvedStoreName,
          });

          if (dbStoreId) {
            const db = getServerSupabase();
            await db.from('interactions').insert([
              {
                store_id: dbStoreId,
                buyer_username: buyerHandle,
                buyer_id: senderId,
                origin: 'direct',
                intent_detected: orchestration.selectedAgentName,
                comment_text: text,
                store_reply_text: replyText,
                status: 'respondido',
                ai_handled: true,
                created_at: new Date().toISOString(),
                replied_at: new Date().toISOString(),
              },
            ]);

            await db.from('conversations').upsert(
              {
                store_id: dbStoreId,
                buyer_id: senderId,
                buyer_username: buyerHandle,
                metadata: {
                  last_message: text,
                  last_reply: replyText,
                  agent: orchestration.selectedAgentName,
                },
                last_interaction_at: new Date().toISOString(),
              },
              { onConflict: 'store_id,buyer_id' }
            );
          }
        } catch (dbErr) {
          console.warn('[Supabase Direct Interaction Warn]:', dbErr);
        }
      }
    } catch (err: any) {
      console.error(`❌ [Worker Direct Erro]:`, err.message);
    }
  }
  console.log(`========================================================================\n`);
}
