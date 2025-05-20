import { createApp } from "vue";
import { createPinia } from "pinia";
import type { App } from "vue";
import AppComponent from "./App.vue";
import router from "./router";

// App erstellen
const app: App = createApp(AppComponent);
app.use(router);
const pinia = createPinia();
app.use(pinia);
// App mounten
app.mount("#app");
