import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format currency for India (INR)
export function formatCurrencyINR(value: number, options?: Intl.NumberFormatOptions) {
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0, ...options }).format(value)
  } catch {
    // Fallback if Intl is unavailable
    return `₹${Math.round(value).toLocaleString('en-IN')}`
  }
}
