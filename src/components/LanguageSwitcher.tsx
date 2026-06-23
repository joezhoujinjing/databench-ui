import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES, type Language } from '../i18n'

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const current = (i18n.resolvedLanguage ?? 'en') as Language

  return (
    <div className="lang-switch" role="group" aria-label={t('language.label')}>
      {SUPPORTED_LANGUAGES.map((lng) => (
        <button
          key={lng}
          className={`lang-btn ${current === lng ? 'active' : ''}`}
          onClick={() => i18n.changeLanguage(lng)}
          aria-pressed={current === lng}
        >
          {t(`language.${lng}`)}
        </button>
      ))}
    </div>
  )
}
