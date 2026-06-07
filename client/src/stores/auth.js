import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('handmade_token') || null)

  const isAuthenticated = computed(() => !!token.value)
  const isMaker = computed(() => user.value?.role === 'MAKER')
  const isAdmin = computed(() => user.value?.role === 'ADMIN')
  const isBuyer = computed(() => user.value?.role === 'BUYER')

  if (token.value) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
  }

  async function hydrateSession() {
    if (!token.value) return
    try {
      const { data } = await axios.get('/api/auth/me')
      // /me now returns user directly (not wrapped)
      user.value = data.user || data
    } catch {
      logout()
    }
  }

  async function login(email, password) {
    const { data } = await axios.post('/api/auth/login', { email, password })
    token.value = data.token
    user.value = data.user
    localStorage.setItem('handmade_token', data.token)
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
    // Reload cart for this user
    const { useCartStore } = await import('./cart')
    useCartStore().reloadForUser()
  }

  async function register(name, email, password, role = 'BUYER') {
    const { data } = await axios.post('/api/auth/register', { name, email, password, role })
    token.value = data.token
    user.value = data.user
    localStorage.setItem('handmade_token', data.token)
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
    const { useCartStore } = await import('./cart')
    useCartStore().reloadForUser()
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('handmade_token')
    delete axios.defaults.headers.common['Authorization']
    // Clear reactive cart and reload guest cart
    import('./cart').then(({ useCartStore }) => useCartStore().reloadForUser())
  }

  return { user, token, isAuthenticated, isMaker, isAdmin, isBuyer, hydrateSession, login, register, logout }
})
