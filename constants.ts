
import { Language } from './types';

export const SITE_LANGUAGE: Language = { code: 'en', name: 'English' };

export const LANGUAGES: Language[] = [
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'nl', name: 'Dutch' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Mandarin' },
  { code: 'ru', name: 'Russian' },
];

export const EXAMPLE_WORDS: { [key: string]: string } = {
  es: 'hola',
  fr: 'bonjour',
  de: 'hallo',
  it: 'ciao',
  pt: 'olá',
  nl: 'hallo',
  ja: 'こんにちは',
  ko: '안녕하세요',
  zh: '你好',
  ru: 'привет',
};