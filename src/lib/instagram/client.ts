/**
 * Cliente da Meta Graph API para Instagram Direct e Private Replies
 * Custo de envio/recebimento: R$ 0,00 (Totalmente Gratuito pela Meta)
 */

export interface SendDirectMessageParams {
  recipientId: string;
  messageText: string;
  quickReplies?: Array<{ title: string; payload: string }>;
  ctaButton?: { title: string; url: string };
  accessToken?: string;
}

export interface SendPrivateReplyParams {
  commentId: string;
  messageText: string;
  accessToken?: string;
}

declare global {
  var __igUserProfileCache: Map<string, { username: string; name?: string; profilePic?: string }> | undefined;
}

export class InstagramClient {
  private graphApiVersion = 'v21.0';
  private instagramGraphUrl = 'https://graph.instagram.com/v21.0';
  private facebookGraphUrl = 'https://graph.facebook.com/v21.0';

  /**
   * Obtém o perfil público (Nome, @username, Foto) do cliente que enviou Direct
   * usando a Meta Graph API. Armazena em cache para consultas instantâneas.
   */
  async getUserProfile(userId: string, accessToken?: string): Promise<{ username: string; name?: string; profilePic?: string } | null> {
    if (!userId || !accessToken || accessToken.includes('mock')) return null;

    if (!global.__igUserProfileCache) {
      global.__igUserProfileCache = new Map();
    }

    if (global.__igUserProfileCache.has(userId)) {
      return global.__igUserProfileCache.get(userId)!;
    }

    try {
      const isInstagramToken = accessToken.startsWith('IGAA');
      const baseUrl = isInstagramToken ? this.instagramGraphUrl : this.facebookGraphUrl;
      const res = await fetch(
        `${baseUrl}/${userId}?fields=name,username,profile_pic&access_token=${encodeURIComponent(accessToken)}`
      );

      if (res.ok) {
        const data = await res.json();
        const profile = {
          username: data.username ? `@${data.username.replace(/^@/, '')}` : `@${userId}`,
          name: data.name || data.username,
          profilePic: data.profile_pic,
        };
        global.__igUserProfileCache.set(userId, profile);
        return profile;
      }
    } catch (e: any) {
      console.warn('[Instagram Profile Fetch Warn]:', e.message);
    }
    return null;
  }

  /**
   * Obtém detalhes da publicação/Reels (legenda, link e mídias) via Meta Graph API
   */
  async getMediaDetails(
    mediaId: string,
    accessToken?: string
  ): Promise<{ id: string; caption?: string; media_type?: string; media_url?: string; permalink?: string } | null> {
    if (!mediaId || !accessToken || accessToken.includes('mock')) return null;

    try {
      const isInstagramToken = accessToken.startsWith('IGAA');
      const primaryUrl = isInstagramToken ? this.instagramGraphUrl : this.facebookGraphUrl;
      const secondaryUrl = isInstagramToken ? this.facebookGraphUrl : this.instagramGraphUrl;

      let res = await fetch(
        `${primaryUrl}/${mediaId}?fields=id,caption,media_type,media_url,permalink&access_token=${encodeURIComponent(accessToken)}`
      );
      if (!res.ok) {
        res = await fetch(
          `${secondaryUrl}/${mediaId}?fields=id,caption,media_type,media_url,permalink&access_token=${encodeURIComponent(accessToken)}`
        );
      }
      if (res.ok) {
        return await res.json();
      }
    } catch (e: any) {
      console.warn('[Instagram Media Fetch Warn]:', e.message);
    }
    return null;
  }

  /**
   * Resposta Privada ao Comentário (Private Reply):
   * Quando um seguidor comenta no Reels ou Feed, a Meta autoriza 1 mensagem privada
   * no Direct daquele perfil dentro de uma janela de até 7 dias.
   */
  async sendPrivateReply(params: SendPrivateReplyParams) {
    const { commentId, messageText, accessToken } = params;

    if (!accessToken || accessToken.includes('mock')) {
      console.log(`[Instagram Mock Private Reply] Comentário ID: ${commentId} | Resposta: "${messageText}"`);
      return { success: true, id: `pr_mock_${Date.now()}` };
    }

    const isInstagramToken = accessToken.startsWith('IGAA');

    // No Instagram Login for Business, Private Reply é disparada via /me/messages com recipient: { comment_id }
    let response = await fetch(
      `${this.instagramGraphUrl}/me/messages?access_token=${encodeURIComponent(accessToken)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { comment_id: commentId },
          message: { text: messageText },
        }),
      }
    );

    if (!response.ok && !isInstagramToken) {
      // Fallback para o endpoint clássico do Facebook apenas se for Page Token
      response = await fetch(
        `${this.facebookGraphUrl}/${commentId}/private_replies?message=${encodeURIComponent(
          messageText
        )}&access_token=${encodeURIComponent(accessToken)}`,
        { method: 'POST' }
      );
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'Erro desconhecido na resposta da Meta' }));
      console.error('[Instagram Private Reply Failure]:', err);
      throw new Error(`Erro na Private Reply Meta: ${JSON.stringify(err)}`);
    }

    return await response.json();
  }

  /**
   * Resposta Pública ao Comentário no Post:
   * Responde diretamente abaixo do comentário do seguidor no Feed ou Reels.
   */
  async sendCommentReply(params: { commentId: string; messageText: string; accessToken?: string }) {
    const { commentId, messageText, accessToken } = params;

    if (!accessToken || accessToken.includes('mock')) {
      console.log(`[Instagram Mock Comment Reply] Comentário ID: ${commentId} | Resposta: "${messageText}"`);
      return { success: true, id: `cr_mock_${Date.now()}` };
    }

    let response = await fetch(
      `${this.instagramGraphUrl}/${commentId}/replies?message=${encodeURIComponent(
        messageText
      )}&access_token=${encodeURIComponent(accessToken)}`,
      { method: 'POST' }
    );

    const isInstagramToken = accessToken.startsWith('IGAA');

    if (!response.ok && !isInstagramToken) {
      response = await fetch(
        `${this.facebookGraphUrl}/${commentId}/replies?message=${encodeURIComponent(
          messageText
        )}&access_token=${encodeURIComponent(accessToken)}`,
        { method: 'POST' }
      );
    }

    if (!response.ok) {
      const err = await response.json();
      throw new Error(`Erro na resposta pública do comentário: ${JSON.stringify(err)}`);
    }

    return await response.json();
  }

  /**
   * Mensagem Direta dentro da Janela Oficial de 24 Horas:
   * Disparo padrão via Instagram Graph API v21.0 (/me/messages).
   */
  async sendDirectMessage(params: SendDirectMessageParams) {
    const { recipientId, messageText, quickReplies, ctaButton, accessToken } = params;

    if (!accessToken || accessToken.includes('mock')) {
      console.log(`[Instagram Mock Direct] Destinatário: ${recipientId} | Mensagem: "${messageText}"`);
      return { success: true, message_id: `mid_mock_${Date.now()}` };
    }

    const payload: any = {
      recipient: { id: recipientId },
      message: { text: messageText },
    };

    if (quickReplies && quickReplies.length > 0) {
      payload.message.quick_replies = quickReplies.map((qr) => ({
        content_type: 'text',
        title: qr.title,
        payload: qr.payload,
      }));
    }

    if (ctaButton) {
      payload.message.attachment = {
        type: 'template',
        payload: {
          template_type: 'button',
          text: messageText,
          buttons: [
            {
              type: 'web_url',
              url: ctaButton.url,
              title: ctaButton.title,
            },
          ],
        },
      };
      delete payload.message.text;
    }

    let response = await fetch(
      `${this.instagramGraphUrl}/me/messages?access_token=${encodeURIComponent(accessToken)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      response = await fetch(
        `${this.facebookGraphUrl}/me/messages?access_token=${encodeURIComponent(accessToken)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
    }

    if (!response.ok) {
      const err = await response.json();
      throw new Error(`Erro no Direct Meta: ${JSON.stringify(err)}`);
    }

    return await response.json();
  }

  /**
   * Renovação Perpétua de Long-Lived Token (60 dias):
   * Renovado automaticamente por um cron semanal no QStash para contas > 30 dias de uso.
   */
  async refreshLongLivedToken(longLivedToken: string) {
    const response = await fetch(
      `${this.instagramGraphUrl}/refresh_access_token?grant_type=ig_refresh_token&access_token=${longLivedToken}`
    );
    if (!response.ok) {
      throw new Error('Falha ao renovar token de longa duração do Instagram');
    }
    const data = await response.json();
    return {
      accessToken: data.access_token,
      expiresInSeconds: data.expires_in,
    };
  }
}

export const instagramClient = new InstagramClient();
