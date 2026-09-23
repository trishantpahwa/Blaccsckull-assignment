export type Lang = 'en' | 'hi';

export interface LocalizedText {
  en: string;
  hi?: string | null;
}

export function parseLang(value: unknown): Lang {
  return value === 'hi' ? 'hi' : 'en';
}

export function localize(text: LocalizedText | undefined, lang: Lang): string {
  if (!text) return '';
  return (lang === 'hi' && text.hi) || text.en;
}
