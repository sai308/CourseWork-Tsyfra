import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useToastStore } from './toast'
import { useAuthStore } from './auth'

// Cart key is per-user so each user has a separate cart
function getCartKey() {
  try {
    const auth = useAuthStore()
    return auth.user?.id ? `handmade_cart_${auth.user.id}` : 'handmade_cart_guest'
  } catch {
    return 'handmade_cart_guest'
  }
}

export const useCartStore = defineStore('cart', () => {
  const items = ref([])
  const isOpen = ref(false)

  function loadCart() {
    const key = getCartKey()
    items.value = JSON.parse(localStorage.getItem(key) || '[]')
  }

  function saveToStorage() {
    const key = getCartKey()
    localStorage.setItem(key, JSON.stringify(items.value))
  }

  // Load cart immediately
  loadCart()

  const itemCount = computed(() => items.value.reduce((sum, i) => sum + i.quantity, 0))
  const total = computed(() => items.value.reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0))

  function addItem(product, quantity = 1) {
    const toast = useToastStore()
    if (product.stock === 0) {
      toast.error('Товар відсутній в наявності')
      return
    }
    const existing = items.value.find(i => i.productId === product.id)
    if (existing) {
      if (existing.quantity + quantity > product.stock) {
        toast.warning(`Максимальна кількість: ${product.stock} шт.`)
        return
      }
      existing.quantity += quantity
    } else {
      items.value.push({
        productId: product.id,
        name: product.name,
        price: parseFloat(product.price),
        imageUrl: product.imageUrl,
        quantity,
        stock: product.stock
      })
    }
    saveToStorage()
    toast.success(`"${product.name}" додано до кошика`)
    isOpen.value = true
  }

  function removeItem(productId) {
    items.value = items.value.filter(i => i.productId !== productId)
    saveToStorage()
  }

  function updateQuantity(productId, quantity) {
    const item = items.value.find(i => i.productId === productId)
    if (item) {
      if (quantity <= 0) removeItem(productId)
      else item.quantity = Math.min(quantity, item.stock)
      saveToStorage()
    }
  }

  function clear() {
    items.value = []
    const key = getCartKey()
    localStorage.removeItem(key)
  }

  // Called after login/logout to reload the correct user's cart
  function reloadForUser() {
    loadCart()
  }

  return { items, isOpen, itemCount, total, addItem, removeItem, updateQuantity, clear, reloadForUser }
})
