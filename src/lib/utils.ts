import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/**
 * Format a number as Indonesian Rupiah
 * @param amount The amount to format
 * @param options Options for formatting
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number | string,
  options: { 
    locale?: string, 
    currency?: string,
    minimumFractionDigits?: number,
    maximumFractionDigits?: number
  } = {}
): string {
  const {
    locale = 'id-ID',
    currency = 'IDR',
    minimumFractionDigits = 0,
    maximumFractionDigits = 0
  } = options;

  // Convert string to number if needed
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Handle NaN or invalid values
  if (isNaN(numAmount)) {
    return `${currency} 0`;
  }

  try {
    // Format using Intl.NumberFormat
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits,
      maximumFractionDigits
    }).format(numAmount);
  } catch (error) {
    // Fallback formatting if Intl.NumberFormat fails
    console.error('Error formatting currency:', error);
    return `${currency} ${numAmount.toFixed(minimumFractionDigits).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
  }
}

export function formatNumber(amount: number): string {
  if (amount >= 1000000000) {
    const value = (amount / 1000000000).toFixed(2);
    return `Rp. ${value.endsWith('.00') ? value.slice(0, -3) : value.replace(/\.?0+$/, '')}M`;
  } else if (amount >= 1000000) {
    const value = (amount / 1000000).toFixed(2);
    return `Rp. ${value.endsWith('.00') ? value.slice(0, -3) : value.replace(/\.?0+$/, '')}Jt`;
  } else if (amount >= 1000) {
    const value = (amount / 1000).toFixed(2);
    return `Rp. ${value.endsWith('.00') ? value.slice(0, -3) : value.replace(/\.?0+$/, '')}K`;
  }
  const value = amount.toFixed(2);
  return `Rp. ${value.endsWith('.00') ? value.slice(0, -3) : value.replace(/\.?0+$/, '')}`;
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function BigInt(value: string | number | null | undefined): bigint | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }
  
  try {
    return globalThis.BigInt(value);
  } catch (error) {
    console.error(`Error converting value to BigInt: ${value}`, error);
    return undefined;
  }
}

// Custom serializer for BigInt values
export function bigIntSerializer(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }
  
  if (typeof data === 'bigint') {
    return data.toString(); // Convert BigInt to string for serialization
  }
  
  if (Array.isArray(data)) {
    return data.map(item => bigIntSerializer(item));
  }
  
  if (typeof data === 'object') {
    const result: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        result[key] = bigIntSerializer(data[key]);
      }
    }
    return result;
  }
  
  return data;
}
