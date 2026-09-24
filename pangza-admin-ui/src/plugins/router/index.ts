import type { App } from "vue";
import router from '@/router';
import guard from "./guard";

export function setupRouter(app: App) {
    app.use(router);
    guard(router);
}