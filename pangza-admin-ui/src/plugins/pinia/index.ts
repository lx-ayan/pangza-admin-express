import type { App } from "vue";
import { createPinia } from 'pinia';
import persistedstate from 'pinia-plugin-persistedstate'

export function setupPinia(app: App) {
    const pinia = createPinia();
    pinia.use(persistedstate);
    app.use(pinia);
}