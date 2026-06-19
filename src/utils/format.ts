import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO, isToday, isTomorrow, addDays, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, pattern: string = 'yyyy-MM-dd') {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, pattern, { locale: zhCN });
}

export function formatDateTime(date: string | Date) {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MM月dd日 HH:mm', { locale: zhCN });
}

export function formatTime(date: string | Date) {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'HH:mm');
}

export function formatRelativeDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const now = new Date();
  
  if (isToday(d)) return '今天';
  if (isTomorrow(d)) return '明天';
  
  const diff = differenceInDays(d, now);
  if (diff === -1) return '昨天';
  if (diff > 0 && diff < 7) return `${diff}天后`;
  if (diff < 0 && diff > -7) return `${Math.abs(diff)}天前`;
  
  return formatDate(d, 'MM月dd日');
}

export function formatCountdown(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const now = new Date();
  const future = d > now;
  const absD = future ? d : now;
  const absN = future ? now : d;
  
  const days = differenceInDays(absD, absN);
  const hours = differenceInHours(absD, absN) % 24;
  const minutes = differenceInMinutes(absD, absN) % 60;
  
  const prefix = future ? '' : '已超';
  const suffix = future ? '' : '期';
  
  if (days > 0) return `${prefix}${days}天${hours}小时${suffix}`;
  if (hours > 0) return `${prefix}${hours}小时${minutes}分${suffix}`;
  if (minutes > 0) return `${prefix}${minutes}分钟${suffix}`;
  return future ? '即将开始' : '到期';
}

export function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function getAvatarEmoji(species: string): string {
  switch (species) {
    case '犬': return '🐕';
    case '猫': return '🐱';
    case '兔': return '🐰';
    case '鸟': return '🐦';
    default: return '🐾';
  }
}

export function getInitials(name: string): string {
  return name.slice(0, 1).toUpperCase();
}

export function statusText(status: string): string {
  const map: Record<string, string> = {
    scheduled: '待确认', confirmed: '已确认', completed: '已完成',
    cancelled: '已取消', waitlist: '候补中',
    pending: '待处理', in_progress: '进行中',
    sent: '已发送', overdue: '已逾期',
    paid: '已支付', refunded: '已退款',
  };
  return map[status] || status;
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    scheduled: 'bg-info-100 text-info-700',
    confirmed: 'bg-brand-100 text-brand-700',
    completed: 'bg-gray-100 text-gray-700',
    cancelled: 'bg-red-100 text-red-700',
    waitlist: 'bg-accent-100 text-accent-700',
    pending: 'bg-accent-100 text-accent-700',
    in_progress: 'bg-info-100 text-info-700',
    sent: 'bg-brand-100 text-brand-700',
    overdue: 'bg-red-100 text-red-700',
    paid: 'bg-brand-100 text-brand-700',
    refunded: 'bg-gray-100 text-gray-700',
  };
  return map[status] || 'bg-gray-100 text-gray-700';
}
