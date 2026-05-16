import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router.js'
import i18n from './i18n.js'
import { installAutoTranslate } from './shared/utils/autoTranslate.js'

createApp(App)
  .use(createPinia())
  .use(router)
  .use(i18n)
  .mount('#app')

installAutoTranslate(i18n, router)
