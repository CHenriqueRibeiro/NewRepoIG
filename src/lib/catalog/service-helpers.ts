import { ProductItem, SchedulingConfig } from './types';

export interface BookingSelection {
  service: ProductItem;
  quantity?: number; // Para agendamento de mais de 1 pessoa (se múltiplos ativado)
}

export interface BookingDetails {
  storeName: string;
  whatsappNumber: string;
  items: BookingSelection[];
  selectedDate: string; // Ex: "Terça-feira, 29/09"
  selectedTimeSlot?: string; // Ex: "14:30" (somente se horário marcado)
  isQueueMode: boolean; // Se for ordem de chegada
  customerNotes?: string;
  businessHours?: string;
}

/**
 * Gera mensagem estruturada e profissional para confirmação do agendamento no WhatsApp
 */
export function formatWhatsAppBookingMessage(details: BookingDetails): string {
  const {
    storeName,
    items,
    selectedDate,
    selectedTimeSlot,
    isQueueMode,
    customerNotes,
    businessHours,
  } = details;

  const totalValue = items.reduce((sum, item) => {
    const qty = item.quantity || 1;
    const price = item.service.discountPrice || item.service.price || 0;
    return sum + price * qty;
  }, 0);

  const totalMinutes = items.reduce((sum, item) => {
    const qty = item.quantity || 1;
    const mins = item.service.durationMinutes || 45;
    return sum + mins * qty;
  }, 0);

  const durationFormatted =
    totalMinutes >= 60
      ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60 > 0 ? `${totalMinutes % 60}min` : ''}`.trim()
      : `${totalMinutes} min`;

  let servicesList = '';
  items.forEach((item) => {
    const qty = item.quantity || 1;
    const price = (item.service.discountPrice || item.service.price || 0) * qty;
    const duration = item.service.durationFormatted || (item.service.durationMinutes ? `${item.service.durationMinutes} min` : '');
    const durationStr = duration ? ` [⏱️ ${duration}]` : '';
    const qtyStr = qty > 1 ? ` (${qty} pessoas)` : '';
    servicesList += `• *${item.service.name}*${qtyStr}${durationStr} - R$ ${price.toFixed(2)}\n`;
  });

  const modeLine = isQueueMode
    ? `🚶 *MODALIDADE:* Atendimento por Ordem de Chegada\n🕒 *HORÁRIO DE FUNCIONAMENTO:* ${businessHours || 'Seg a Sáb das 08h às 19h'}\n`
    : `⏰ *HORÁRIO ESCOLHIDO:* ${selectedTimeSlot || 'A combinar'}\n`;

  const notesLine = customerNotes ? `💬 *OBSERVAÇÕES:* ${customerNotes}\n` : '';

  const message =
    `Olá! Gostaria de confirmar meu agendamento na *${storeName}*:\n\n` +
    `🗓️ *SOLICITAÇÃO DE AGENDAMENTO:*\n` +
    `${servicesList}\n` +
    `📅 *DATA PREFERIDA:* ${selectedDate}\n` +
    `${modeLine}` +
    `⏱️ *DURAÇÃO ESTIMADA TOTAL:* ${durationFormatted}\n` +
    `💰 *VALOR TOTAL DO SERVIÇO:* R$ ${totalValue.toFixed(2)} (Sem frete)\n` +
    `${notesLine}\n` +
    `Por favor, confirmem se está disponível para reservar! ✨`;

  return message;
}

/**
 * Converte string de horário "HH:mm" em minutos desde meia-noite
 */
export function timeToMinutes(timeStr?: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

/**
 * Converte minutos desde meia-noite em formato "HH:mm"
 */
export function minutesToTime(totalMinutes: number): string {
  const safe = Math.max(0, Math.min(24 * 60 - 1, totalMinutes));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export const WEEKDAYS_MAP = [
  { key: 'Dom', label: 'Domingo', dayIndex: 0 },
  { key: 'Seg', label: 'Segunda-feira', dayIndex: 1 },
  { key: 'Ter', label: 'Terça-feira', dayIndex: 2 },
  { key: 'Qua', label: 'Quarta-feira', dayIndex: 3 },
  { key: 'Qui', label: 'Quinta-feira', dayIndex: 4 },
  { key: 'Sex', label: 'Sexta-feira', dayIndex: 5 },
  { key: 'Sáb', label: 'Sábado', dayIndex: 6 },
];

/**
 * Verifica se um dia específico da semana está aberto
 */
export function isDayOpen(dayIndex: number, workingDays?: string[]): boolean {
  if (!workingDays || workingDays.length === 0) return true; // Se não configurado, considera aberto
  const dayKey = WEEKDAYS_MAP.find((w) => w.dayIndex === dayIndex)?.key;
  if (!dayKey) return true;
  return workingDays.includes(dayKey);
}

/**
 * Resume os dias de funcionamento (ex: "Terça a Sábado" ou "Segunda a Sexta")
 */
export function formatWorkingDaysSummary(workingDays?: string[]): string {
  if (!workingDays || workingDays.length === 0) return 'Segunda a Sábado';
  if (workingDays.length === 7) return 'Todos os dias (Segunda a Domingo)';
  if (workingDays.length === 5 && !workingDays.includes('Dom') && !workingDays.includes('Sáb')) {
    return 'Segunda a Sexta-feira';
  }
  if (workingDays.length === 6 && !workingDays.includes('Dom')) {
    return 'Segunda a Sábado';
  }
  return workingDays.join(', ');
}

/**
 * Calcula a grade exata de horários disponíveis considerando:
 * - Horário de Abertura (openTime)
 * - Horário de Fechamento (closeTime)
 * - Pausa de Almoço / Intervalo (hasBreak, breakStartTime, breakEndTime)
 * - Intervalo de Minutos (slotIntervalMinutes, ex: 15, 30, 45, 60 ou duração do serviço)
 */
export function calculateAvailableTimeSlots(
  config?: SchedulingConfig,
  customIntervalMins?: number,
  customStart?: string,
  customEnd?: string
): string[] {
  const openMinutes = timeToMinutes(customStart || config?.openTime || '09:00');
  const closeMinutes = timeToMinutes(customEnd || config?.closeTime || '18:00');

  // Intervalo do agendamento (ex: 15 min, 30 min, 45 min, 60 min)
  const interval = Math.max(
    10,
    customIntervalMins || config?.slotIntervalMinutes || 30
  );

  const hasBreak = config?.hasBreak ?? true;
  const breakStart = timeToMinutes(config?.breakStartTime || '12:00');
  const breakEnd = timeToMinutes(config?.breakEndTime || '13:00');

  const slots: string[] = [];
  let current = openMinutes;

  while (current <= closeMinutes) {
    // Se o horário estiver dentro da pausa para almoço, avança diretamente para o fim da pausa
    if (hasBreak && current >= breakStart && current < breakEnd) {
      current = breakEnd;
      continue;
    }

    // Se a sessão exceder o fechamento da loja, interrompe
    if (current > closeMinutes) {
      break;
    }

    // Adiciona o horário
    slots.push(minutesToTime(current));
    current += interval;
  }

  return slots;
}

/**
 * Gera as próximas datas disponíveis para agendamento (Hoje, Amanhã e próximos 6 dias),
 * respeitando os dias de funcionamento (workingDays)
 */
export function getUpcomingBookingDates(
  workingDays?: string[]
): Array<{
  dateFormatted: string;
  label: string;
  weekday: string;
  dayIndex: number;
  isOpen: boolean;
  dayKey: string;
  isoDate: string;
}> {
  const dates: Array<{
    dateFormatted: string;
    label: string;
    weekday: string;
    dayIndex: number;
    isOpen: boolean;
    dayKey: string;
    isoDate: string;
  }> = [];

  const daysOfWeek = [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
  ];

  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);

    const dayIndex = d.getDay();
    const dayName = daysOfWeek[dayIndex];
    const dayKey = WEEKDAYS_MAP.find((w) => w.dayIndex === dayIndex)?.key || 'Seg';
    const dayMonth = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    const open = isDayOpen(dayIndex, workingDays);

    let label = '';
    if (i === 0) label = `Hoje (${dayMonth})`;
    else if (i === 1) label = `Amanhã (${dayMonth})`;
    else label = `${dayName.split('-')[0]} (${dayMonth})`;

    dates.push({
      dateFormatted: `${dayName}, ${dayMonth}`,
      label,
      weekday: dayName,
      dayIndex,
      isOpen: open,
      dayKey,
      isoDate: d.toISOString().slice(0, 10),
    });
  }

  return dates;
}

export const DEFAULT_SERVICE_TIMESLOTS = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '13:30',
  '14:30',
  '15:30',
  '16:30',
  '17:30',
  '18:30',
];
