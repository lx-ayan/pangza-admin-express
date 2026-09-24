import type { App } from "vue";
import ContextMenu from 'v-contextmenu';
import "v-contextmenu/dist/themes/default.css";

export function setupContextMenu(app: App) {
    app.use(ContextMenu)
}