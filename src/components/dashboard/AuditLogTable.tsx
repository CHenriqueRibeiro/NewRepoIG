'use client';

import React, { useState } from 'react';
import { Search, Sparkles, ExternalLink, ShieldCheck, CheckCircle2, MessageCircle, Instagram } from 'lucide-react';

interface RealCommentItem {
  id: string;
  text: string;
  username: string;
  timestamp: string;
  media_caption?: string;
  media_permalink?: string;
  media_url?: string;
}

interface AuditLogTableProps {
  realComments?: RealCommentItem[];
  accountHandle?: string;
  totalMonitored?: number;
}

export default function AuditLogTable({
  realComments = [],
  accountHandle = 'instagram',
  totalMonitored = 0,
}: AuditLogTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredComments = realComments.filter((c) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (c.username && c.username.toLowerCase().includes(term)) ||
      (c.text && c.text.toLowerCase().includes(term)) ||
      (c.media_caption && c.media_caption.toLowerCase().includes(term))
    );
  });

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="w-full rounded-2xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden space-y-0">
      {/* Top Header */}
      <div className="p-5 sm:p-6 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Auditoria de Mensagens &amp; Interações no Instagram
            </h3>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Ao Vivo
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Rastreamento em tempo real de comentários e DMs recebidos em @{accountHandle}.
          </p>
        </div>

      </div>

      {realComments.length > 0 ? (
        <>
          {/* Search Toolbar */}
          <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por @usuário ou palavra..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 placeholder:text-slate-400"
              />
            </div>

            <span className="text-xs text-slate-500 font-mono">
              {filteredComments.length} interações
            </span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-5 py-3">Horário</th>
                  <th className="px-5 py-3">Seguidor</th>
                  <th className="px-5 py-3">Comentário / Dúvida</th>
                  <th className="px-5 py-3">Post de Origem</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredComments.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-500 whitespace-nowrap">
                      {formatDate(item.timestamp)}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-900 whitespace-nowrap">
                      @{item.username}
                    </td>
                    <td className="px-5 py-3.5 max-w-sm text-slate-700 text-xs">
                      &ldquo;{item.text}&rdquo;
                    </td>
                    <td className="px-5 py-3.5 max-w-xs text-slate-500 text-xs truncate">
                      {item.media_caption || 'Publicação'}
                    </td>
                    <td className="px-5 py-3.5 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        Processado
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      {item.media_permalink && (
                        <a
                          href={item.media_permalink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          <span>Ver no Instagram</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* Real Live Empty State */
        <div className="p-8 sm:p-10 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-2xs">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div className="space-y-1.5 max-w-md mx-auto">
            <h4 className="font-bold text-base text-slate-900">
              Nenhuma pendência ou dúvida no vácuo!
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Todas as {totalMonitored} publicações da conta <strong>@{accountHandle}</strong> estão sendo monitoradas em tempo real. Assim que um seguidor comentar ou enviar uma mensagem direta, a IA responderá instantaneamente e o registro aparecerá aqui.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <a
              href={`https://www.instagram.com/${accountHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors shadow-xs"
            >
              <span>Abrir @{accountHandle} no Instagram</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
