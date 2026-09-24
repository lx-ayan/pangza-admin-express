import { createApp } from 'vue';
import App from './App.vue';
import { setupPlugins } from './plugins';
import { loadEncryptConfig } from '@/utils/core/encryptTransport';

const app = createApp(App);
setupPlugins(app);

loadEncryptConfig().finally(() => {
    app.mount('#app');
});
