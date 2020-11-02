import Vue from 'vue'
import VueRouter from 'vue-router'
import Generator from '../views/Generator.vue'
import Analytics from '../views/Analytics.vue'
import Redirect from '../views/Redirect.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Generator',
    component: Generator
  },
  {
    path: '/analytics/:analyticsID',
    name: 'About',
    component: Analytics
  },
  {
    path: '/:shortID',
    name: 'Redirect',
    component: Redirect
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
