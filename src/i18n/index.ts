import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import en from './locales/en.json'
import zh from './locales/zh.json'

export const SUPPORTED_LANGUAGES = ['en', 'zh'] as const
export type Language = (typeof SUPPORTED_LANGUAGES)[number]

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      zh: { translation: zh },
    },
    fallbackLng: 'zh',
    supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
    // Map e.g. zh-CN / zh-TW -> zh, en-US -> en.
    load: 'languageOnly',
    nonExplicitSupportedLngs: true,
    interpolation: { escapeValue: false },
    detection: {
      // Persisted choice wins; otherwise fall back to zh. Browser locale is
      // intentionally not consulted so non-Chinese browsers still default to zh.
      order: ['localStorage'],
      lookupLocalStorage: 'databench.lang',
      caches: ['localStorage'],
    },
  })

export default i18n
