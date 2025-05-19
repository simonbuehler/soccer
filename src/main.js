import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";

// App erstellen
const app = createApp(App);

// Pinia vor allen anderen Plugins initialisieren
const pinia = createPinia();
app.use(pinia);

// Router hinzufügen
app.use(router);

// App mounten
app.mount("#app");
