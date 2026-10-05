import { ShippingConfig } from './types';

export interface MotoboyCutoffInfo {
  enabled: boolean;
  cutoffTime: string;
  isSameDay: boolean;
  badgeText: string;
  statusMessage: string;
  shortNotice: string;
}

/**
 * Calcula se no momento atual o pedido com motoboy se qualifica para entrega no mesmo dia
 * de acordo com o horário de corte configurado pelo lojista.
 */
export function getMotoboyCutoffInfo(shipping?: ShippingConfig): MotoboyCutoffInfo {
  const enabled = Boolean(shipping?.motoboySameDayCutoffEnabled);
  const cutoffTime = shipping?.motoboyCutoffTime || '14:00';

  if (!enabled) {
    return {
      enabled: false,
      cutoffTime,
      isSameDay: true,
      badgeText: 'Entrega Expressa',
      statusMessage: shipping?.motoboyEstimate || 'Entrega rápida na sua região',
      shortNotice: shipping?.motoboyEstimate || 'Hoje / Em breve',
    };
  }

  // Analisa horas e minutos do corte (formato HH:mm)
  const [cutoffH, cutoffM] = cutoffTime.split(':').map((val) => parseInt(val, 10) || 0);

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const cutoffMinutes = cutoffH * 60 + cutoffM;

  const isSameDay = currentMinutes < cutoffMinutes;

  if (isSameDay) {
    const remainingMinutes = cutoffMinutes - currentMinutes;
    const remH = Math.floor(remainingMinutes / 60);
    const remM = remainingMinutes % 60;
    const timeCountdown = remH > 0 ? `${remH}h e ${remM}min` : `${remM} minutos`;

    return {
      enabled: true,
      cutoffTime,
      isSameDay: true,
      badgeText: 'Entrega HOJE',
      statusMessage: `Compre nos próximos ${timeCountdown} (até às ${cutoffTime}) para receber hoje!`,
      shortNotice: `Entrega HOJE (até ${cutoffTime})`,
    };
  } else {
    return {
      enabled: true,
      cutoffTime,
      isSameDay: false,
      badgeText: 'Próximo Dia Útil',
      statusMessage: `Horário limite de hoje (${cutoffTime}) atingido. Seu pedido será entregue no próximo dia útil.`,
      shortNotice: `Próximo Dia Útil (após ${cutoffTime})`,
    };
  }
}

export const UBER_FLASH_DEFAULT_LABEL = 'Retirada por Moto Uber / 99';
export const UBER_FLASH_DEFAULT_NOTICE =
  'Atenção: A taxa da corrida no app (Uber Flash ou 99 Moto) é solicitada e paga diretamente pelo cliente após aviso de pedido pronto.';

/**
 * Retorna as configurações e mensagens padronizadas para Retirada por Moto Uber / 99
 */
export function getUberFlashInfo(shipping?: ShippingConfig) {
  const enabled = shipping?.uberFlashEnabled ?? true;
  const label = shipping?.uberFlashLabel?.trim() || UBER_FLASH_DEFAULT_LABEL;
  const address = shipping?.uberFlashAddress?.trim() || shipping?.pickupAddress?.trim() || '';
  const notice = shipping?.uberFlashNotice?.trim() || UBER_FLASH_DEFAULT_NOTICE;

  return {
    enabled,
    label,
    address,
    notice,
    costBadge: 'Corrida paga pelo cliente',
  };
}
