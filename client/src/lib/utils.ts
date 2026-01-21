import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCompactNumber(value: number | string | null | undefined, options?: { 
  currency?: string, 
  includeSymbol?: boolean 
}): string {
  const numValue = parseFloat(String(value || 0));
  
  if (isNaN(numValue)) return '0';
  
  const { currency = 'PKR', includeSymbol = true } = options || {};
  
  let formatted: string;
  const absValue = Math.abs(numValue);
  
  if (absValue >= 1_000_000) {
    formatted = (numValue / 1_000_000).toFixed(1) + 'M';
  } else if (absValue >= 1_000) {
    formatted = (numValue / 1_000).toFixed(1) + 'K';
  } else {
    formatted = numValue.toLocaleString('en-US', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 2 
    });
  }
  
  // Remove trailing .0
  formatted = formatted.replace(/\.0([KM])$/, '$1');
  
  if (includeSymbol) {
    const symbol = currency === 'PKR' ? '₨' : currency === 'USD' ? '$' : currency;
    return `${symbol}${formatted}`;
  }
  
  return formatted;
}

export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function formatDateCompact(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: '2-digit'
  });
}

export function toISODate(d: Date | string | undefined | null): string {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function inISODateRange(dateISO: string, fromISO: string, toISO: string): boolean {
  if (!dateISO || !fromISO || !toISO) return false;
  return dateISO >= fromISO && dateISO <= toISO;
}
