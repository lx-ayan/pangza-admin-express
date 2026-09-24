import type { App } from 'vue';
import { setupRouter } from './router';
import { setupComponents } from './components';
import { setupTailwindcss } from './tailwindcss';
import { setupTdesign } from './tdesign';
import { setupPinia } from './pinia';
import setupDirective from '@/directive';
import { setupContextMenu } from "./contextmenu";

export function setupPlugins(app: App) {
    setupPinia(app);
    setupDirective(app);
    setupRouter(app);
    setupTdesign(app);
    setupTailwindcss();
    setupComponents(app);
    setupContextMenu(app);
}