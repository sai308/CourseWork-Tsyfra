import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  { path: '/', component: () => import('@/views/HomeView.vue'), name: 'home' },
  { path: '/catalog', component: () => import('@/views/CatalogView.vue'), name: 'catalog' },
  { path: '/product/:id', component: () => import('@/views/ProductView.vue'), name: 'product' },
  { path: '/dashboard', component: () => import('@/views/DashboardView.vue'), name: 'dashboard', meta: { requiresAuth: true, roles: ['MAKER'] } },
  {
    path: '/admin',
    component: () => import('@/views/AdminView.vue'),
    name: 'admin',
    meta: { requiresAuth: true, roles: ['ADMIN'] }
  },
  {
    path: '/orders',
    component: () => import('@/views/OrdersView.vue'),
    name: 'orders',
    meta: { requiresAuth: true }
  },
  {
    path: '/checkout',
    component: () => import('@/views/CheckoutView.vue'),
    name: 'checkout'
  },
  {
    path: '/settings',
    component: () => import('@/views/SettingsView.vue'),
    name: 'settings',
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

router.beforeEach((to, from, next) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return next('/')
  }
  if (to.meta.roles && !to.meta.roles.includes(auth.user?.role)) {
    return next('/')
  }
  next()
})

export default router
