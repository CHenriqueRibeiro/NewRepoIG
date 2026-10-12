'use client';

import React, { useState } from 'react';
import {
  CatalogConfig,
  StorePaymentConfig,
  ShippingConfig,
  DeliveryRegionRule,
  DEFAULT_DELIVERY_REGIONS,
} from '@/lib/catalog/types';
import {
  CreditCard,
  Truck,
  MapPin,
  Save,
  Check,
  CheckCircle2,
  Clock,
  Bike,
  Package,
  AlertCircle,
  QrCode,
  DollarSign,
  Info,
  Plus,
  Edit2,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

interface PaymentAndShippingTabProps {
  config: CatalogConfig;
  onChangeConfig: (newConfig: CatalogConfig) => void;
  onSave?: (updatedConfig?: CatalogConfig) => void;
}

export default function PaymentAndShippingTab({
  config,
  onChangeConfig,
  onSave,
}: PaymentAndShippingTabProps) {
  const [saveSuccess, setSaveSuccess] = useState(false);
  const isServices = config.businessType === 'services';

  const payment: StorePaymentConfig = config.paymentConfig || {
    pixEnabled: true,
    pixKeyType: 'phone',
    pixKey: config.whatsapp || '',
    pixBeneficiaryName: config.storeName || '',
    pixBeneficiaryCity: 'São Paulo',
    allowWhatsAppDirectCheckout: true,
    showPixScreenWithProof: true,
  };

  const shipping: ShippingConfig = config.shipping || {
    pickupEnabled: true,
    pickupLabel: 'Retirada no Local',
    pickupAddress: '',
    motoboyEnabled: true,
    motoboyPrice: 15,
    motoboyEstimate: 'Entrega hoje',
    motoboySameDayCutoffEnabled: true,
    motoboyCutoffTime: '14:00',
    motoboyCutoffNotice: 'Pedidos confirmados até as 14:00 saem para entrega no mesmo dia.',
    uberFlashEnabled: true,
    uberFlashLabel: 'Retirada por Moto Uber / 99',
    uberFlashAddress: '',
    uberFlashNotice: 'Solicite a corrida pelo seu app e informe o código ao motoboy. O custo do frete é pago pelo cliente diretamente no app.',
    sedexEnabled: true,
    sedexPrice: 28,
    sedexEstimate: '2 a 5 dias úteis',
    freeShippingAbove: undefined,
  };

  const deliveryRegions: DeliveryRegionRule[] =
    shipping.deliveryRegions && shipping.deliveryRegions.length > 0
      ? shipping.deliveryRegions
      : DEFAULT_DELIVERY_REGIONS;

  // Modal State para Adicionar/Editar Região
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Campos do Formulário
  const [formCidade, setFormCidade] = useState('');
  const [formUf, setFormUf] = useState('SP');
  const [formCepInicial, setFormCepInicial] = useState('');
  const [formCepFinal, setFormCepFinal] = useState('');
  const [formValor, setFormValor] = useState('15.00');
  const [formPrazo, setFormPrazo] = useState('1 a 2 dias úteis');

  const updatePayment = (fields: Partial<StorePaymentConfig>) => {
    const updatedPayment = { ...payment, ...fields };
    onChangeConfig({
      ...config,
      paymentConfig: updatedPayment,
    });
  };

  const updateShipping = (fields: Partial<ShippingConfig>) => {
    const updatedShipping = { ...shipping, ...fields };
    onChangeConfig({
      ...config,
      shipping: updatedShipping,
    });
  };

  const updateRegions = (newRegions: DeliveryRegionRule[]) => {
    updateShipping({
      deliveryRegions: newRegions,
    });
  };

  const handleToggleRegion = (id: string) => {
    const updated = deliveryRegions.map((r) =>
      r.id === id ? { ...r, ativo: !r.ativo } : r
    );
    updateRegions(updated);
  };

  const handleDeleteRegion = (id: string, name: string) => {
    if (confirm(`Tem certeza de que deseja excluir o frete para "${name}"?`)) {
      const updated = deliveryRegions.filter((r) => r.id !== id);
      updateRegions(updated);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormCidade('');
    setFormUf('SP');
    setFormCepInicial('');
    setFormCepFinal('');
    setFormValor('15.00');
    setFormPrazo('1 a 2 dias úteis');
    setIsModalOpen(true);
  };

  const openEditModal = (rule: DeliveryRegionRule) => {
    setEditingId(rule.id);
    setFormCidade(rule.cidade);
    setFormUf(rule.uf);
    setFormCepInicial(rule.cepInicial);
    setFormCepFinal(rule.cepFinal);
    setFormValor(rule.valor.toFixed(2));
    setFormPrazo(rule.prazo);
    setIsModalOpen(true);
  };

  const handleSaveRegionModal = () => {
    if (!formCidade.trim() || !formCepInicial.trim()) {
      alert('Preencha o nome da cidade e o CEP inicial.');
      return;
    }

    if (editingId) {
      const updated = deliveryRegions.map((r) =>
        r.id === editingId
          ? {
              ...r,
              cidade: formCidade.trim(),
              uf: formUf.trim().toUpperCase(),
              cepInicial: formCepInicial.trim(),
              cepFinal: formCepFinal.trim() || formCepInicial.trim(),
              valor: parseFloat(formValor) || 0,
              prazo: formPrazo.trim(),
            }
          : r
      );
      updateRegions(updated);
    } else {
      const newRule: DeliveryRegionRule = {
        id: `c_${Date.now()}`,
        cidade: formCidade.trim(),
        uf: formUf.trim().toUpperCase(),
        cepInicial: formCepInicial.trim(),
        cepFinal: formCepFinal.trim() || formCepInicial.trim(),
        valor: parseFloat(formValor) || 0,
        prazo: formPrazo.trim(),
        ativo: true,
      };
      updateRegions([...deliveryRegions, newRule]);
    }

    setIsModalOpen(false);
  };

  const handleSave = () => {
    // Garante que deliveryRegions seja persistido ao salvar caso ainda não esteja em shipping
    const updatedShipping: ShippingConfig = {
      ...shipping,
      deliveryRegions,
    };
    const updatedConfig: CatalogConfig = {
      ...config,
      shipping: updatedShipping,
    };
    onChangeConfig(updatedConfig);
    onSave?.(updatedConfig);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-7 pb-12 animate-in fade-in duration-200">
      {/* Header da Aba com Ação de Salvar */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-linear-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-600/20">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-heading font-black text-xl text-slate-900 tracking-tight flex items-center gap-2">
              <span>Pagamento e Frete</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure chave PIX direta no checkout, dados de recebimento, cobertura de envio e modalidades de frete.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={handleSave}
          leftIcon={saveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          className={`font-bold text-xs px-5 shadow-md ${
            saveSuccess
              ? 'bg-emerald-600 hover:bg-emerald-700'
              : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
          }`}
        >
          {saveSuccess ? 'Salvo com Sucesso!' : 'Salvar Alterações'}
        </Button>
      </div>

      {/* 1. FORMAS DE PAGAMENTO & CHAVE PIX DIRETA */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-black text-slate-900 text-base">
                Pagamento com PIX no Checkout
              </h3>
              <p className="text-xs text-slate-500">
                Gere QR Code e código Copia e Cola automático no padrão BACEN para recebimento imediato
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={payment.pixEnabled}
              onChange={(e) => updatePayment({ pixEnabled: e.target.checked })}
              className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
            />
            <span className="text-xs font-bold text-slate-800">
              {payment.pixEnabled ? 'PIX Ativado no Checkout' : 'PIX Desativado'}
            </span>
          </label>
        </div>

        {payment.pixEnabled ? (
          <div className="space-y-5 max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tipo de Chave PIX */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Tipo de Chave PIX *
                </label>
                <select
                  value={payment.pixKeyType || 'phone'}
                  onChange={(e) => updatePayment({ pixKeyType: e.target.value as any })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs sm:text-sm font-semibold focus:outline-none focus:border-teal-600 bg-white"
                >
                  <option value="phone">Telefone / Celular</option>
                  <option value="cpf">CPF / CNPJ</option>
                  <option value="email">E-mail</option>
                  <option value="random">Chave Aleatória (EVP)</option>
                </select>
              </div>

              {/* Chave PIX */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Chave PIX Cadastrada *
                </label>
                <input
                  type="text"
                  value={payment.pixKey || ''}
                  onChange={(e) => updatePayment({ pixKey: e.target.value })}
                  placeholder="Ex: 11987654321 ou chave@email.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-mono font-bold text-xs sm:text-sm focus:outline-none focus:border-teal-600"
                />
              </div>

              {/* Titular / Favorecido */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Nome do Titular / Razão Social
                </label>
                <input
                  type="text"
                  value={payment.pixBeneficiaryName || ''}
                  onChange={(e) => updatePayment({ pixBeneficiaryName: e.target.value })}
                  placeholder="Ex: Maria Joaquina Silva"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs sm:text-sm font-semibold focus:outline-none focus:border-teal-600"
                />
                <p className="text-[11px] text-slate-500">
                  Exibido na tela de pagamento e no QR Code do cliente.
                </p>
              </div>

              {/* Cidade do Favorecido */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Cidade do Titular (Padrão BACEN)
                </label>
                <input
                  type="text"
                  value={payment.pixBeneficiaryCity || 'São Paulo'}
                  onChange={(e) => updatePayment({ pixBeneficiaryCity: e.target.value })}
                  placeholder="Ex: São Paulo"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs sm:text-sm font-semibold focus:outline-none focus:border-teal-600"
                />
              </div>
            </div>

            {/* Opções de Fluxo de Checkout */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={payment.showPixScreenWithProof ?? true}
                  onChange={(e) => updatePayment({ showPixScreenWithProof: e.target.checked })}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                />
                <span className="text-xs font-bold text-slate-800">
                  Exibir tela do PIX com botão para copiar chave e botão de enviar comprovante no WhatsApp
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={payment.allowWhatsAppDirectCheckout ?? true}
                  onChange={(e) => updatePayment({ allowWhatsAppDirectCheckout: e.target.checked })}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                />
                <span className="text-xs font-bold text-slate-800">
                  Permitir também que o cliente finalize o pedido direto pelo WhatsApp com o carrinho montado
                </span>
              </label>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
            Pagamentos por PIX no checkout estão temporariamente desativados. Os clientes finalizarão o pedido combinando o pagamento direto pelo WhatsApp.
          </div>
        )}
      </div>

      {/* 2. CIDADE BASE & COBERTURA DE ENVIO */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-heading font-black text-slate-900 text-base">
              Cidade Base & Cobertura do Envio
            </h3>
            <p className="text-xs text-slate-500">
              Informe a cidade de onde seus produtos saem e as regiões atendidas pela sua loja
            </p>
          </div>
        </div>

        <div className="max-w-xl space-y-2">
          <label className="block text-xs font-bold text-slate-800">
            Texto de Cobertura e Localização (Exibido na Vitrine e Checkout)
          </label>
          <input
            type="text"
            value={config.locationText || ''}
            onChange={(e) =>
              onChangeConfig({
                ...config,
                locationText: e.target.value,
              })
            }
            placeholder="Ex: São Paulo, SP • Atendimento em toda região metropolitana e envio nacional"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs sm:text-sm font-semibold focus:outline-none focus:border-indigo-600"
          />
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Seus clientes verão esta informação no topo do catálogo e na simulação de entrega.
          </p>
        </div>
      </div>

      {/* 3. MODALIDADES DE FRETE & ENTREGA */}
      {isServices ? (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-black text-slate-900 text-base">
                Atendimento de Serviços & Deslocamento
              </h3>
              <p className="text-xs text-slate-500">
                Seu catálogo está configurado no modelo de Serviços & Procedimentos
              </p>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/80 text-xs text-purple-950 space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-purple-900">
              <Info className="w-4 h-4" />
              <span>Agendamento de Horários e Atendimento</span>
            </p>
            <p className="text-slate-600 leading-relaxed">
              Para serviços presenciais, o cliente escolhe a data e horário desejados. Caso você faça atendimentos a domicílio (home care ou delivery de serviços), utilize a mensagem de orientação e combine a taxa de deslocamento diretamente com o cliente.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-7">
          {/* 3. CIDADES E REGIÕES DE ENTREGA (POR FAIXA DE CEP) */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-slate-900 text-base">
                    Cidades e Regiões de Entrega Cadastradas
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    O sistema calcula o frete automaticamente quando o cliente informa o CEP da entrega
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto flex-wrap">
                <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                  {deliveryRegions.filter((r) => r.ativo).length} ativas de {deliveryRegions.length} regiões
                </span>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  onClick={openAddModal}
                  className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700 shadow-xs"
                >
                  Cadastrar Nova Cidade por CEP
                </Button>
              </div>
            </div>

            {/* Tabela de Regiões */}
            <div className="rounded-2xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="px-5 py-3.5">Cidade / Região</th>
                      <th className="px-4 py-3.5 text-center">UF</th>
                      <th className="px-5 py-3.5">Faixa de CEP Atendida</th>
                      <th className="px-5 py-3.5 text-right">Taxa de Frete</th>
                      <th className="px-5 py-3.5">Prazo Estimado</th>
                      <th className="px-4 py-3.5 text-center">Status</th>
                      <th className="px-5 py-3.5 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {deliveryRegions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-5 py-10 text-center text-slate-400 text-xs">
                          Nenhuma cidade cadastrada ainda. Clique em &quot;Cadastrar Nova Cidade por CEP&quot; acima para começar.
                        </td>
                      </tr>
                    ) : (
                      deliveryRegions.map((rule) => (
                        <tr key={rule.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-5 py-4 font-semibold text-slate-900 whitespace-nowrap">
                            {rule.cidade}
                          </td>
                          <td className="px-4 py-4 text-center whitespace-nowrap">
                            <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                              {rule.uf}
                            </span>
                          </td>
                          <td className="px-5 py-4 font-mono text-xs text-slate-600 whitespace-nowrap">
                            {rule.cepInicial} até {rule.cepFinal}
                          </td>
                          <td className="px-5 py-4 text-right font-bold text-slate-900 whitespace-nowrap">
                            R$ {rule.valor.toFixed(2).replace('.', ',')}
                          </td>
                          <td className="px-5 py-4 text-xs text-slate-600 whitespace-nowrap">
                            {rule.prazo}
                          </td>
                          <td className="px-4 py-4 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleToggleRegion(rule.id)}
                              className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                                rule.ativo
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                              }`}
                            >
                              {rule.ativo ? 'Ativo' : 'Pausado'}
                            </button>
                          </td>
                          <td className="px-5 py-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditModal(rule)}
                                title="Editar cidade"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRegion(rule.id, rule.cidade)}
                                title="Excluir cidade"
                                className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 4. OUTRAS MODALIDADES DE FRETE & RETIRADA */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-heading font-black text-slate-900 text-base">
                  Outras Modalidades de Frete e Retirada
                </h3>
                <p className="text-xs text-slate-500">
                  Configure frete grátis, entregas expressas e opções de retirada no balcão
                </p>
              </div>
            </div>

            <div className="space-y-5 max-w-3xl">
              {/* Frete Grátis Acima de um Valor */}
              <div className="p-4.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-xs text-slate-800">
                    Frete Grátis Acima de um Valor
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Ofereça entrega gratuita para compras acima deste valor. Deixe zerado ou em branco para desativar.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-slate-600">R$</span>
                  <input
                    type="number"
                    value={shipping.freeShippingAbove || ''}
                    onChange={(e) =>
                      updateShipping({
                        freeShippingAbove: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    placeholder="299,00"
                    className="w-28 px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              {/* Motoboy Express */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-4">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shipping.motoboyEnabled}
                      onChange={(e) => updateShipping({ motoboyEnabled: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Bike className="w-4 h-4 text-indigo-600" />
                      <span>Entrega Expressa por Motoboy</span>
                    </span>
                  </label>
                  {shipping.motoboyEnabled && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Ativo
                    </span>
                  )}
                </div>

                {shipping.motoboyEnabled && (
                  <div className="space-y-4 pt-1 animate-in fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-slate-600">
                          Taxa Fixa do Motoboy (R$)
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          value={shipping.motoboyPrice}
                          onChange={(e) => updateShipping({ motoboyPrice: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50 text-slate-900 focus:bg-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-slate-600">
                          Prazo Estimado
                        </label>
                        <input
                          type="text"
                          value={shipping.motoboyEstimate}
                          onChange={(e) => updateShipping({ motoboyEstimate: e.target.value })}
                          placeholder="Ex: Entrega hoje ou em até 3 horas"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-slate-50 text-slate-900 focus:bg-white"
                        />
                      </div>
                    </div>

                    {/* Horário de Corte do Motoboy */}
                    <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-200/80 space-y-2.5">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={shipping.motoboySameDayCutoffEnabled ?? true}
                          onChange={(e) => updateShipping({ motoboySameDayCutoffEnabled: e.target.checked })}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-xs font-bold text-indigo-950 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Definir horário de corte para entrega no mesmo dia</span>
                        </span>
                      </label>

                      {shipping.motoboySameDayCutoffEnabled && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                          <div>
                            <label className="block text-[10px] font-bold text-indigo-900 uppercase">
                              Horário Limite (Corte):
                            </label>
                            <input
                              type="time"
                              value={shipping.motoboyCutoffTime || '14:00'}
                              onChange={(e) => updateShipping({ motoboyCutoffTime: e.target.value })}
                              className="w-full px-3 py-1.5 rounded-lg border border-indigo-300 text-xs font-bold bg-white text-indigo-950"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-bold text-indigo-900 uppercase">
                              Aviso ao Cliente:
                            </label>
                            <input
                              type="text"
                              value={shipping.motoboyCutoffNotice || ''}
                              onChange={(e) => updateShipping({ motoboyCutoffNotice: e.target.value })}
                              placeholder="Pedidos após às 14:00 serão entregues no próximo dia útil."
                              className="w-full px-3 py-1.5 rounded-lg border border-indigo-300 text-xs font-medium bg-white text-indigo-950"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Retirada por Moto Uber / 99 Moto (Uber Flash) */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-4">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shipping.uberFlashEnabled ?? true}
                      onChange={(e) => updateShipping({ uberFlashEnabled: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Bike className="w-4 h-4 text-purple-600" />
                      <span>Retirada por Moto Uber / 99 Moto (Uber Flash)</span>
                    </span>
                  </label>
                  {shipping.uberFlashEnabled && (
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                      Ativo
                    </span>
                  )}
                </div>

                {shipping.uberFlashEnabled && (
                  <div className="space-y-3 pt-1 animate-in fade-in">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-slate-600">
                        Endereço onde o motoboy do app deve coletar o pacote:
                      </label>
                      <input
                        type="text"
                        value={shipping.uberFlashAddress || ''}
                        onChange={(e) => updateShipping({ uberFlashAddress: e.target.value })}
                        placeholder="Ex: Rua Oscar Freire, 1200 - Aos cuidados de Maria"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-slate-50 text-slate-900 focus:bg-white"
                      />
                    </div>
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-950 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <p className="leading-relaxed">
                        <strong>Aviso automático ao cliente:</strong> O cliente solicita a corrida pelo próprio app (Uber Flash ou 99 Moto) e paga o frete diretamente no aplicativo. Você apenas entrega a peça embalada ao motoboy.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Envio por Correios / Sedex */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-4">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shipping.sedexEnabled}
                      onChange={(e) => updateShipping({ sedexEnabled: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-sky-600" />
                      <span>Envio Nacional por Correios (Sedex / PAC)</span>
                    </span>
                  </label>
                  {shipping.sedexEnabled && (
                    <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                      Ativo
                    </span>
                  )}
                </div>

                {shipping.sedexEnabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 animate-in fade-in">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-slate-600">
                        Valor Padrão de Envio (R$)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={shipping.sedexPrice}
                        onChange={(e) => updateShipping({ sedexPrice: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50 text-slate-900 focus:bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-slate-600">
                        Prazo Estimado de Entrega
                      </label>
                      <input
                        type="text"
                        value={shipping.sedexEstimate}
                        onChange={(e) => updateShipping({ sedexEstimate: e.target.value })}
                        placeholder="Ex: 2 a 5 dias úteis"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-slate-50 text-slate-900 focus:bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Retirada no Local / Balcão */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-4">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shipping.pickupEnabled}
                      onChange={(e) => updateShipping({ pickupEnabled: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      <span>Retirada no Local / Loja Física (Sem Custo de Frete)</span>
                    </span>
                  </label>
                  {shipping.pickupEnabled && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Ativo
                    </span>
                  )}
                </div>

                {shipping.pickupEnabled && (
                  <div className="space-y-1 pt-1 animate-in fade-in">
                    <label className="block text-[11px] font-semibold text-slate-600">
                      Endereço Completo para Retirada dos Clientes:
                    </label>
                    <input
                      type="text"
                      value={shipping.pickupAddress || ''}
                      onChange={(e) => updateShipping({ pickupAddress: e.target.value })}
                      placeholder="Ex: Av. Paulista, 1500 - Sala 42, Bela Vista, São Paulo - SP"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-slate-50 text-slate-900 focus:bg-white"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Cadastrar / Editar Cidade por CEP */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Editar Cidade / Região de Entrega' : 'Cadastrar Cidade por CEP'}
        description="Defina o nome da região, faixa de CEP e a taxa cobrada do cliente."
        maxWidth="md"
      >
        <div className="space-y-4 my-2">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Input
                label="Nome da Cidade / Região:"
                placeholder="Ex: Santos e Baixada Santista"
                value={formCidade}
                onChange={(e) => setFormCidade(e.target.value)}
              />
            </div>
            <div>
              <Input
                label="UF:"
                placeholder="SP"
                maxLength={2}
                value={formUf}
                onChange={(e) => setFormUf(e.target.value.toUpperCase())}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="CEP Inicial:"
              placeholder="01000-000"
              value={formCepInicial}
              onChange={(e) => setFormCepInicial(e.target.value)}
            />
            <Input
              label="CEP Final:"
              placeholder="05999-999"
              value={formCepFinal}
              onChange={(e) => setFormCepFinal(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Valor do Frete (R$):"
              type="number"
              step="0.50"
              placeholder="15.00"
              value={formValor}
              onChange={(e) => setFormValor(e.target.value)}
            />
            <Input
              label="Prazo Estimado:"
              placeholder="Ex: Mesmo dia até 18h"
              value={formPrazo}
              onChange={(e) => setFormPrazo(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <Button variant="secondary" size="md" onClick={() => setIsModalOpen(false)}>
            Cancelar
          </Button>
          <Button variant="primary" size="md" onClick={handleSaveRegionModal}>
            {editingId ? 'Salvar Alterações' : 'Cadastrar Cidade'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
