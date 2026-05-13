import { createI18n } from "vue-i18n";
import en from "./locales/en.json";
import es from "./locales/es.json";
const i18n = createI18n({
    legacy: false, // Usa la Composition API (no la Options API)
    locale: 'en', // Idioma inicial
    fallbackLocale: 'en', // Si falta una clave, usa inglés
    messages: { en, es } // Carga los dos idiomas
});
export default i18n;