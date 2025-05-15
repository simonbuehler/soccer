import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    name: "Home",
    component: () => import("@/views/Home.vue")
  },
  {
    path: "/sample",
    name: "Sample",
    component: () => import("@/views/Sample.vue")
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
