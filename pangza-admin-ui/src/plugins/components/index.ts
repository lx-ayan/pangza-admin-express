import type { App } from "vue";
import 'md-editor-v3/lib/style.css';
const components = import.meta.glob("../../components/**/*[.vue, .tsx]", {
  eager: true,
});
import ProComponents from '@/components/ProComponents';

/**
 * @description 系统自动注册全局组件
 */
export function setupComponents(app: App) {
  app.use(ProComponents);
  Object.entries(components).forEach(([_, module]: [string, any]) => {
    const component = module.default;
    if (component && component.name && component.globalComponent) {
      app.component(component.name, component);
    }
  });
}
