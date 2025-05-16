import { createApp } from "vue";
import { createPinia } from "pinia";
import { createRouter, createWebHistory } from "vue-router";
import App from "./App.vue";

// Router-Konfiguration (anpassen nach deinen Routen)
const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('./views/Home.vue')
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

app.mount("#vue-app");
