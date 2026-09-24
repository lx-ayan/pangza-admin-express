import type { App } from "vue";
import getDirectiveList from "./util";

export default function setupDirective(app: App) {
    const directiveList = getDirectiveList();
    directiveList.forEach(directive => {
        app.directive(directive.name, directive);
    })
}