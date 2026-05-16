import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import es from './locales/es.json'

const savedLanguage = localStorage.getItem('fq_lang') || 'es'

const i18n = createI18n({
  legacy: false,
  locale: savedLanguage,
  fallbackLocale: 'es',
  messages: { es, en },
})

export default i18n
