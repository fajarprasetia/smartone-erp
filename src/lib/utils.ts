import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as Indonesian Rupiah (IDR) with suffixes
 * @param amount - The amount to format
 * @param showDecimals - Whether to show decimal places (default: false)
 * @returns Formatted string with Rp prefix and appropriate suffix (K, JT, M)
 */
export function formatCurrency(amount: number, showDecimals = false): string {
  // Handle null or undefined values
  if (amount === null || amount === undefined) {
    return "Rp 0";
  }

  // Format with suffixes
  if (Math.abs(amount) >= 1000000000) {
    // Billions - M suffix
    return `Rp ${(amount / 1000000000).toFixed(showDecimals ? 2 : 1)}M`;
  } else if (Math.abs(amount) >= 1000000) {
    // Millions - JT suffix
    return `Rp ${(amount / 1000000).toFixed(showDecimals ? 2 : 1)}JT`;
  } else if (Math.abs(amount) >= 1000) {
    // Thousands - K suffix
    return `Rp ${(amount / 1000).toFixed(showDecimals ? 2 : 1)}K`;
  } else {
    // Regular formatting for small numbers
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: showDecimals ? 2 : 0,
      maximumFractionDigits: showDecimals ? 2 : 0,
    }).format(amount);
  }
}

/**
 * Format a date as DD-MM-YYYY
 * @param date - The date to format (Date object or string)
 * @returns Formatted date string in DD-MM-YYYY format
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}-${month}-${year}`;
}

/**
 * Format a date with time as DD-MM-YYYY HH:MM
 * @param date - The date to format (Date object or string)
 * @returns Formatted date and time string
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${day}-${month}-${year} ${hours}:${minutes}`;
}