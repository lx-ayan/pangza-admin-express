import type { App } from "vue";
import TDesign from 'tdesign-vue-next';
import 'tdesign-vue-next/es/style/index.css';

export function setupTdesign(app: App) {
    app.use(TDesign);
}