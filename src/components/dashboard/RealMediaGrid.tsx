'use client';

import React from 'react';
import { ExternalLink, Heart, MessageCircle, Sparkles, CheckCircle2 } from 'lucide-react';

export interface InstagramMediaItem {
  id: string;
  caption?: string;
  media_type: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
  comments_count: number;
  like_count: number;
}

interface RealMediaGridProps {
  mediaList: InstagramMediaItem[];
  accountHandle?: string;
}

export default function RealMediaGrid({ mediaList, accountHandle = 'instagram' }: RealMediaGridProps) {
  if (!mediaList || mediaList.length === 0) {
    return null;
  }

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    } catch {
      return '';
    }
  };

  return (
    <div className="w-full rounded-2xl bg-white border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-heading font-bold text-base text-slate-900 tracking-tight">
              Publicações Oficiais Monitoradas em Tempo Real
            </h3>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {mediaList.length} Posts Ativos no Feed
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            A IA está escutando comentários e intenções de compra em todas essas postagens de @{accountHandle}.
          </p>
        </div>

        <a
          href={`https://www.instagram.com/${accountHandle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          <span>Abrir Perfil no Instagram</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Grid of Real Instagram Posts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mediaList.map((media) => {
          const imgUrl = media.media_url || media.thumbnail_url;
          const cleanCaption = media.caption ? media.caption.replace(/#\w+/g, '').trim() : '';

          return (
            <div
              key={media.id}
              className="rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300 hover:shadow-sm transition-all overflow-hidden flex flex-col justify-between group"
            >
              {/* Media Preview */}
              <div className="relative aspect-square w-full bg-slate-100 overflow-hidden">
                {imgUrl ? (
                  <img
                    src={imgUrl}
                    alt={media.caption || 'Post Instagram'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-mono">
                    Post de Vídeo / Carrossel
                  </div>
                )}

                {/* Badge AI Status */}
                <div className="absolute top-2.5 left-2.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-medium border border-white/10 shadow-xs">
                    <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                    IA de Plantão
                  </span>
                </div>

                {/* Date */}
                <div className="absolute top-2.5 right-2.5">
                  <span className="px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-md text-slate-700 text-[10px] font-mono shadow-xs">
                    {formatDate(media.timestamp)}
                  </span>
                </div>
              </div>

              {/* Caption & Stats */}
              <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                <p className="text-xs text-slate-700 line-clamp-3 leading-relaxed">
                  {cleanCaption || 'Publicação oficial no Instagram da loja.'}
                </p>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-[11px] font-mono text-slate-600">
                      <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" />
                      {media.like_count || 0}
                    </span>

                    <span className="flex items-center gap-1 text-[11px] font-mono text-slate-600">
                      <MessageCircle className="w-3.5 h-3.5 text-indigo-500" />
                      {media.comments_count || 0}
                    </span>
                  </div>

                  <a
                    href={media.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-900 font-medium transition-colors"
                  >
                    <span>Ver Post</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
