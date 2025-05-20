import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";

// App erstellen
const app = createApp(App);
app.use(router);
const pinia = createPinia();
app.use(pinia);
// App mounten
app.mount("#app");
