'use client';

import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  UploadCloud,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Download,
  Copy,
  Check,
  X,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ProductItem } from '@/lib/catalog/types';
import {
  parseExcelOrCsv,
  parseMarkdown,
  getSampleCsvTemplate,
  getSampleMarkdownTemplate,
  ImportValidationResult,
} from '@/lib/catalog/bulk-importer';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (importedProducts: ProductItem[]) => void;
  defaultCategory?: string;
  catalogSlug?: string;
}

export default function BulkImportModal({
  isOpen,
  onClose,
  onImportSuccess,
  defaultCategory,
  catalogSlug = 'minha-loja',
}: BulkImportModalProps) {
  const [activeMode, setActiveMode] = useState<'upload' | 'paste'>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [validationResult, setValidationResult] = useState<ImportValidationResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState<'csv' | 'md' | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Processa arquivo enviado via input ou drop
  const handleFile = async (file: File) => {
    try {
      setFeedbackError(null);
      setSelectedFileName(file.name);
      const buffer = await file.arrayBuffer();
      const fileName = file.name.toLowerCase();

      let res: ImportValidationResult;
      if (fileName.endsWith('.md') || fileName.endsWith('.txt')) {
        const text = new TextDecoder('utf-8').decode(buffer);
        res = parseMarkdown(text, defaultCategory);
      } else {
        res = parseExcelOrCsv(buffer, defaultCategory);
      }

      setValidationResult(res);
    } catch (err: any) {
      console.error('Erro ao ler arquivo:', err);
      setFeedbackError('Erro ao processar arquivo. Verifique se o formato é CSV, Excel ou Markdown válido.');
      setValidationResult(null);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Processa texto colado (detecta se é Markdown ou CSV)
  const handlePastedTextChange = (text: string) => {
    setPastedText(text);
    setFeedbackError(null);

    if (!text.trim()) {
      setValidationResult(null);
      return;
    }

    try {
      let res: ImportValidationResult;
      if (text.includes('|') && text.includes('\n')) {
        res = parseMarkdown(text, defaultCategory);
      } else {
        res = parseExcelOrCsv(text, defaultCategory);
      }
      setValidationResult(res);
    } catch (err) {
      setValidationResult(null);
    }
  };

  // Copia modelo para o clipboard
  const copyTemplate = (type: 'csv' | 'md') => {
    const content = type === 'csv' ? getSampleCsvTemplate() : getSampleMarkdownTemplate();
    navigator.clipboard.writeText(content);
    setCopiedTemplate(type);
    setTimeout(() => setCopiedTemplate(null), 2500);
  };

  // Download do arquivo modelo .csv
  const downloadSampleCsv = () => {
    const csvContent = getSampleCsvTemplate();
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'modelo_produtos_vitryne.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Salva os produtos válidos
  const handleConfirmImport = async () => {
    if (!validationResult || validationResult.validProducts.length === 0) return;

    try {
      setIsSubmitting(true);
      setFeedbackError(null);

      const res = await fetch('/api/catalog/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          catalogSlug,
          products: validationResult.validProducts,
          defaultCategory,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || 'Erro ao importar produtos.');
      }

      onImportSuccess(validationResult.validProducts);
      onClose();
    } catch (err: any) {
      console.error('Falha na importação:', err);
      setFeedbackError(err.message || 'Erro ao salvar produtos no catálogo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const validCount = validationResult?.validProducts.length || 0;
  const rejectedCount = validationResult?.rejectedRows.length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Importação em Massa de Produtos
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  CSV • Excel • Markdown
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Preencha seu catálogo automaticamente com validação estrita de dados obrigatórios.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo Scrollável */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Alerta de Regra Rigorosa */}
          <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-xl flex items-start gap-3 text-xs text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="font-semibold text-amber-950">
                Regra do Catálogo: Todos os dados são obrigatórios
              </strong>
              <p className="text-amber-800 leading-relaxed">
                Para manter a integridade da vitrine e da IA de vendas, o item <strong>NÃO SOBE</strong> se faltar qualquer um destes dados: <strong>Nome, Preço oficial (&gt; 0), Categoria, Descrição e Foto/Imagem</strong>.
              </p>
            </div>
          </div>

          {/* Seleção de Modo (Upload vs Colar) + Atalhos de Modelo */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setActiveMode('upload')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeMode === 'upload'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5 text-indigo-600" />
                Upload de Arquivo
              </button>
              <button
                type="button"
                onClick={() => setActiveMode('paste')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeMode === 'paste'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                Colar Texto / Markdown
              </button>
            </div>

            {/* Modelos e Download */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={downloadSampleCsv}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors"
                title="Baixar planilha de exemplo pronta (.csv)"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Planilha Modelo (.csv)</span>
              </button>

              <button
                type="button"
                onClick={() => copyTemplate('md')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors"
                title="Copiar tabela Markdown de exemplo para área de transferência"
              >
                {copiedTemplate === 'md' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Exemplo Markdown</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Área de Entrada: Modo Upload */}
          {activeMode === 'upload' && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv, .xlsx, .xls, .tsv, .md, .txt"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFile(e.target.files[0]);
                  }
                }}
              />

              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]'
                    : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                  {selectedFileName ? selectedFileName : 'Arraste seu arquivo aqui ou clique para selecionar'}
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Formatos suportados: <strong>Excel (.xlsx, .xls)</strong>, <strong>CSV (.csv)</strong> ou <strong>Markdown (.md)</strong>.
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200/70 text-slate-700 text-[11px] font-semibold">
                  <span>Colunas: Nome, Preço, Categoria, Estoque, Descrição, Imagem</span>
                </div>
              </div>
            </div>
          )}

          {/* Área de Entrada: Modo Colar Texto */}
          {activeMode === 'paste' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Cole sua tabela CSV ou Markdown abaixo:</span>
                <span className="text-[11px] font-normal text-slate-400">
                  Validação instantânea a cada alteração
                </span>
              </label>
              <textarea
                rows={6}
                value={pastedText}
                onChange={(e) => handlePastedTextChange(e.target.value)}
                placeholder={`Cole aqui no formato CSV ou Markdown:\nNome,Preço,Categoria,Estoque,Descrição,Imagem\nVestido Floral,189.90,Vestidos,5,Vestido midi caimento perfeito,https://exemplo.com/foto.jpg`}
                className="w-full font-mono text-xs p-3.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/30"
              />
            </div>
          )}

          {/* Mensagem de Erro de Processamento */}
          {feedbackError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{feedbackError}</span>
            </div>
          )}

          {/* Painel de Resultados da Validação (Preview) */}
          {validationResult && (
            <div className="space-y-4 pt-2 border-t border-slate-200">
              {/* Badges de Resumo */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <span className="text-[11px] text-slate-500 font-semibold block">Total de Linhas Lidas</span>
                  <span className="text-lg font-extrabold text-slate-800">{validationResult.totalParsed}</span>
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                  <span className="text-[11px] text-emerald-700 font-semibold block flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Prontos para Subir
                  </span>
                  <span className="text-lg font-extrabold text-emerald-800">{validCount}</span>
                </div>

                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-center">
                  <span className="text-[11px] text-rose-700 font-semibold block flex items-center justify-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> Rejeitados (Incompletos)
                  </span>
                  <span className="text-lg font-extrabold text-rose-800">{rejectedCount}</span>
                </div>
              </div>

              {/* Tabela 1: Linhas Rejeitadas (Transparência Total) */}
              {rejectedCount > 0 && (
                <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-900">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>{rejectedCount} item(ns) NÃO vão subir porque faltam dados obrigatórios:</span>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 text-xs text-rose-800 divide-y divide-rose-200/50">
                    {validationResult.rejectedRows.map((rej, i) => (
                      <div key={i} className="pt-1.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
                        <div>
                          <strong>Linha {rej.rowIndex}:</strong> "{String(rej.raw.name || rej.raw.nome || rej.raw.titulo || 'Item sem nome')}"
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {rej.reasons.map((r, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tabela 2: Itens Válidos Aprovados */}
              {validCount > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-emerald-600" />
                      Pré-visualização dos {validCount} Produtos Válidos:
                    </span>
                    <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-100/80 px-2 py-0.5 rounded-md">
                      Ficha técnica completa ✓
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/80 text-slate-600 font-bold sticky top-0 border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">Foto</th>
                          <th className="p-2.5">Nome do Produto</th>
                          <th className="p-2.5">Categoria</th>
                          <th className="p-2.5">Preço</th>
                          <th className="p-2.5">Estoque</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800">
                        {validationResult.validProducts.map((p, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="p-2.5">
                              <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                                <img
                                  src={p.images?.[0] || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400'}
                                  alt={p.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            </td>
                            <td className="p-2.5 font-semibold text-slate-900">{p.name}</td>
                            <td className="p-2.5">
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                                {p.category}
                              </span>
                            </td>
                            <td className="p-2.5 font-extrabold text-emerald-700">
                              R$ {p.price.toFixed(2).replace('.', ',')}
                            </td>
                            <td className="p-2.5 text-slate-600 font-medium">{p.stock} un.</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rodapé com Botões de Ação */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900"
          >
            Cancelar
          </Button>

          <Button
            variant="primary"
            size="sm"
            disabled={validCount === 0 || isSubmitting}
            isLoading={isSubmitting}
            onClick={handleConfirmImport}
            leftIcon={<Sparkles className="w-4 h-4 text-emerald-300" />}
            className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs font-bold"
          >
            {validCount > 0
              ? `Confirmar e Importar ${validCount} Produto(s)`
              : 'Selecione ou Cole uma Planilha Válida'}
          </Button>
        </div>
      </div>
    </div>
  );
}
