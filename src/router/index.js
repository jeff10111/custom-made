import Vue from 'vue'
import VueRouter from 'vue-router'
import About from '../views/About.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'About',
    component: About
  },
  {
    path: '/simulation',
    name: 'Simulation',
    component: () => import('../views/Simulation.vue')
  },
]

const router = new VueRouter({
  routes: routes,
})

export default router
