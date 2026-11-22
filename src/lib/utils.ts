import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Join class names; later Tailwind classes win over earlier ones (used by src/components/ui). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
