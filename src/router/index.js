import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/about',
    name: 'About',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/About.vue')
  },
  {
    path: '/selection',
    name: 'SelectionInterface',
    component: () => import('../views/SelectionInterface.vue')
  },
  {
    path: '/simulation',
    name: 'Simulation',
    component: () => import('../views/Simulation.vue')
  },
  {
    path: '/leaderboard',
    name: 'Leaderboard',
    component: () => import('../views/Leaderboard.vue')
  },
]

const router = new VueRouter({
  routes: routes,
  mode: 'abstract'
})

export default router
