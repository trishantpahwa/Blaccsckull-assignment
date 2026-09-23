import { en, type Dictionary } from './en';
import { hi } from './hi';

export type Lang = 'en' | 'hi';
export type { Dictionary };

export const dictionaries: Record<Lang, Dictionary> = { en, hi };

export function format(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}
