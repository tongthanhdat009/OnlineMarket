import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index.js'
import './assets/css/global.css'
import * as LucideIcons from 'lucide-vue-next'

// Tạo app
const app = createApp(App)

// Đăng ký toàn bộ icon toàn cục
for (const [key, component] of Object.entries(LucideIcons)) {
  app.component(key, component)
}

// Dùng router
app.use(router)

// Mount app
app.mount('#app')
