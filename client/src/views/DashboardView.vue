<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import axios from 'axios'

const auth = useAuthStore()
const toast = useToastStore()

const analytics = ref(null)
const orders = ref([])
const myProducts = ref([])
const loadingAnalytics = ref(true)
const loadingOrders = ref(true)
const loadingProducts = ref(true)

// ─── Add product modal ───────────────────────────────────────
const showAddProductModal = ref(false)
const addingProduct = ref(false)
const newProduct = reactive({ name: '', description: '', price: '', stock: '', categoryId: '' })
const imageFile = ref(null)
const imagePreview = ref(null)
const categories = ref([])

// ─── Edit product modal ──────────────────────────────────────
const showEditModal = ref(false)
const savingEdit = ref(false)
const editProduct = reactive({ id: '', name: '', description: '', price: '', stock: '', categoryId: '' })
const editImageFile = ref(null)
const editImagePreview = ref(null)

const shortId = (id) => id ? `#${id.slice(-8).toUpperCase()}` : '—'

onMounted(async () => {
  await Promise.all([fetchAnalytics(), fetchOrders(), fetchMyProducts(), fetchCategories()])
})

async function fetchAnalytics() {
  loadingAnalytics.value = true
  try {
    const { data } = await axios.get('/api/analytics/dashboard')
    analytics.value = data
  } catch {
    analytics.value = { totalProducts: 0, totalOrders: 0, totalRevenue: 0, pendingOrders: 0 }
  } finally {
    loadingAnalytics.value = false
  }
}

async function fetchOrders() {
  loadingOrders.value = true
  try {
    const { data } = await axios.get('/api/orders/maker')
    orders.value = data.orders || data
  } catch {
    orders.value = []
  } finally {
    loadingOrders.value = false
  }
}

async function fetchMyProducts() {
  loadingProducts.value = true
  try {
    const { data } = await axios.get('/api/products/my')
    myProducts.value = Array.isArray(data) ? data.map(p => ({ ...p, price: parseFloat(p.price) })) : []
  } catch {
    myProducts.value = []
  } finally {
    loadingProducts.value = false
  }
}

async function fetchCategories() {
  try {
    const { data } = await axios.get('/api/products/categories')
    categories.value = data
  } catch { /* ignore */ }
}

async function updateOrderStatus(orderId, status) {
  try {
    await axios.patch(`/api/orders/${orderId}/status`, { status })
    const order = orders.value.find(o => o.id === orderId)
    if (order) order.status = status
    toast.success('Статус замовлення оновлено')
  } catch (err) {
    toast.error(err.response?.data?.error || 'Помилка оновлення статусу')
  }
}

// ─── Image helpers ───────────────────────────────────────────
function handleImageFile(file, previewRef, fileRef) {
  if (!file) return
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
    toast.error('Підтримуються лише JPG, PNG, WebP або GIF')
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    toast.error('Розмір файлу не може перевищувати 5 МБ')
    return
  }
  fileRef.value = file
  const reader = new FileReader()
  reader.onload = (ev) => { previewRef.value = ev.target.result }
  reader.readAsDataURL(file)
}

function onImageChange(e) { handleImageFile(e.target.files[0], imagePreview, imageFile) }
function onEditImageChange(e) { handleImageFile(e.target.files[0], editImagePreview, editImageFile) }
function clearImage() { imageFile.value = null; imagePreview.value = null }
function clearEditImage() { editImageFile.value = null; editImagePreview.value = null }

// ─── Add product ─────────────────────────────────────────────
async function addProduct() {
  if (!newProduct.name || !newProduct.price || !newProduct.stock) {
    toast.error("Заповніть обов'язкові поля: назва, ціна, кількість")
    return
  }
  if (!newProduct.categoryId) {
    toast.error('Оберіть категорію')
    return
  }
  addingProduct.value = true
  try {
    const { data } = await axios.post('/api/products', {
      name: newProduct.name,
      description: newProduct.description || newProduct.name,
      price: parseFloat(newProduct.price),
      stock: parseInt(newProduct.stock),
      imageUrl: imagePreview.value || null,
      categoryId: newProduct.categoryId
    })
    const product = data.product || data
    myProducts.value.unshift({ ...product, price: parseFloat(product.price) })
    toast.success('Товар успішно додано та відправлено на модерацію!')
    showAddProductModal.value = false
    Object.assign(newProduct, { name: '', description: '', price: '', stock: '', categoryId: '' })
    imageFile.value = null; imagePreview.value = null
    await fetchAnalytics()
  } catch (err) {
    toast.error(err.response?.data?.error || 'Помилка додавання товару')
  } finally {
    addingProduct.value = false
  }
}

// ─── Edit product ─────────────────────────────────────────────
function openEdit(product) {
  Object.assign(editProduct, {
    id: product.id,
    name: product.name,
    description: product.description || '',
    price: product.price,
    stock: product.stock,
    categoryId: product.categoryId || ''
  })
  editImageFile.value = null
  editImagePreview.value = product.imageUrl || null
  showEditModal.value = true
}

async function saveEdit() {
  if (!editProduct.name.trim()) { toast.error('Назва не може бути порожньою'); return }
  if (!editProduct.price || parseFloat(editProduct.price) <= 0) { toast.error('Невірна ціна'); return }
  if (editProduct.stock === '' || parseInt(editProduct.stock) < 0) { toast.error('Невірна кількість'); return }

  savingEdit.value = true
  try {
    const { data } = await axios.patch(`/api/products/${editProduct.id}`, {
      name: editProduct.name.trim(),
      description: editProduct.description.trim(),
      price: parseFloat(editProduct.price),
      stock: parseInt(editProduct.stock),
      categoryId: editProduct.categoryId || undefined,
      imageUrl: editImagePreview.value || null
    })
    const updated = data.product || data
    const idx = myProducts.value.findIndex(p => p.id === editProduct.id)
    if (idx !== -1) myProducts.value[idx] = { ...updated, price: parseFloat(updated.price) }
    toast.success('Товар оновлено!')
    showEditModal.value = false
    await fetchAnalytics()
  } catch (err) {
    toast.error(err.response?.data?.error || 'Помилка збереження товару')
  } finally {
    savingEdit.value = false
  }
}

// ─── Delete product ───────────────────────────────────────────
async function deleteProduct(productId) {
  if (!confirm('Ви впевнені що хочете видалити цей товар?')) return
  try {
    await axios.delete(`/api/products/${productId}`)
    myProducts.value = myProducts.value.filter(p => p.id !== productId)
    toast.success('Товар видалено')
    await fetchAnalytics()
  } catch (err) {
    toast.error(err.response?.data?.error || 'Помилка видалення товару')
  }
}

const statusLabel = (s) => ({ PENDING: 'Нове', PROCESSING: 'В обробці', DELIVERED: 'Доставлено', CANCELLED: 'Скасовано' }[s] || s)
const statusColor = (s) => ({
  PENDING: 'text-status-warning bg-status-warning/10 border-status-warning/30',
  PROCESSING: 'text-status-info bg-status-info/10 border-status-info/30',
  DELIVERED: 'text-status-success bg-status-success/10 border-status-success/30',
  CANCELLED: 'text-status-error bg-status-error/10 border-status-error/30'
}[s] || 'text-cream-muted')

const productStatusLabel = (s) => ({ PENDING: 'На модерації', APPROVED: 'Опубліковано', REJECTED: 'Відхилено' }[s] || s)
const productStatusColor = (s) => ({
  PENDING: 'text-status-warning bg-status-warning/10 border-status-warning/30',
  APPROVED: 'text-status-success bg-status-success/10 border-status-success/30',
  REJECTED: 'text-status-error bg-status-error/10 border-status-error/30'
}[s] || '')

const formattedRevenue = computed(() => {
  if (!analytics.value) return '—'
  return new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', minimumFractionDigits: 0 }).format(analytics.value.totalRevenue || 0)
})
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

    <!-- Page Header -->
    <div class="mb-8">
      <div class="inline-flex items-center gap-2 mb-2">
        <div class="w-6 h-px bg-accent"></div>
        <span class="text-xs font-semibold text-accent uppercase tracking-[0.2em]">Панель управління</span>
      </div>
      <h1 class="font-brand text-4xl sm:text-5xl italic text-cream">Мій дашборд</h1>
      <p class="text-cream-muted mt-2">Вітаємо, <span class="text-cream font-medium">{{ auth.user?.name }}</span> 👋</p>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
      <div
        v-for="stat in [
          { label: 'Товари', value: analytics?.totalProducts ?? '—', icon: '📦', color: 'text-accent' },
          { label: 'Замовлення', value: analytics?.totalOrders ?? '—', icon: '🛒', color: 'text-status-info' },
          { label: 'Очікують', value: analytics?.pendingOrders ?? '—', icon: '⏳', color: 'text-status-warning' },
          { label: 'Дохід', value: formattedRevenue, icon: '💰', color: 'text-status-success' },
        ]"
        :key="stat.label"
        class="bg-bg-card border border-border rounded-xl p-5"
      >
        <div v-if="loadingAnalytics" class="animate-pulse space-y-2">
          <div class="h-3 bg-bg-surface rounded w-1/2"></div>
          <div class="h-8 bg-bg-surface rounded w-2/3"></div>
        </div>
        <div v-else>
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs text-cream-faint font-medium uppercase tracking-wider">{{ stat.label }}</span>
            <span class="text-lg">{{ stat.icon }}</span>
          </div>
          <p :class="['text-2xl font-bold', stat.color]">{{ stat.value }}</p>
        </div>
      </div>
    </div>

    <!-- Two Column Layout -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">

      <!-- ── My Products ── -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-cream">Мої товари</h2>
          <button type="button" @click="showAddProductModal = true" class="btn-primary text-sm px-4 py-2 flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Додати товар
          </button>
        </div>

        <div v-if="loadingProducts" class="space-y-3">
          <div v-for="n in 4" :key="n" class="h-16 bg-bg-card border border-border rounded-xl animate-pulse"></div>
        </div>

        <div v-else-if="!myProducts.length" class="bg-bg-card border border-border rounded-xl p-8 text-center">
          <p class="text-cream-muted text-sm">У вас ще немає товарів</p>
          <button type="button" @click="showAddProductModal = true" class="btn-primary mt-4 text-sm">Додати перший товар</button>
        </div>

        <div v-else class="space-y-2 max-h-[520px] overflow-y-auto pr-1">
          <div
            v-for="product in myProducts"
            :key="product.id"
            class="flex items-center gap-3 p-3 bg-bg-card border border-border rounded-xl hover:border-accent/40 transition-all duration-200 group"
          >
            <!-- Thumbnail -->
            <div class="w-12 h-12 rounded-lg overflow-hidden bg-bg-surface flex-shrink-0">
              <img v-if="product.imageUrl" :src="product.imageUrl" :alt="product.name" class="w-full h-full object-cover"/>
              <div v-else class="w-full h-full flex items-center justify-center text-cream-faint text-lg">📦</div>
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-cream truncate">{{ product.name }}</p>
              <div class="flex items-center gap-2 mt-0.5 flex-wrap">
                <span class="text-xs text-accent font-semibold">
                  {{ new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', minimumFractionDigits: 0 }).format(product.price) }}
                </span>
                <span v-if="product.stock === 0" class="badge-error text-xs">Немає</span>
                <span v-else-if="product.stock <= 5" class="badge-warning text-xs">⚡ {{ product.stock }} шт.</span>
                <span v-else class="text-xs text-cream-faint">{{ product.stock }} шт.</span>
                <span v-if="product.status" :class="['text-xs border px-1.5 py-0.5 rounded-full', productStatusColor(product.status)]">
                  {{ productStatusLabel(product.status) }}
                </span>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <!-- Edit -->
              <button
                type="button"
                @click="openEdit(product)"
                class="w-7 h-7 flex items-center justify-center rounded-lg text-cream-faint hover:text-accent hover:bg-accent/10 transition-all duration-200"
                title="Редагувати"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
              </button>
              <!-- Delete -->
              <button
                type="button"
                @click="deleteProduct(product.id)"
                class="w-7 h-7 flex items-center justify-center rounded-lg text-cream-faint hover:text-status-error hover:bg-status-error/10 transition-all duration-200"
                title="Видалити"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Orders ── -->
      <div class="space-y-4">
        <h2 class="text-lg font-semibold text-cream">Замовлення</h2>

        <div v-if="loadingOrders" class="space-y-3">
          <div v-for="n in 4" :key="n" class="h-20 bg-bg-card border border-border rounded-xl animate-pulse"></div>
        </div>

        <div v-else-if="!orders.length" class="bg-bg-card border border-border rounded-xl p-8 text-center">
          <p class="text-cream-muted text-sm">Замовлень поки немає</p>
        </div>

        <div v-else class="space-y-2 max-h-[520px] overflow-y-auto pr-1">
          <div
            v-for="order in orders"
            :key="order.id"
            class="p-4 bg-bg-card border border-border rounded-xl hover:border-accent/30 transition-all duration-200"
          >
            <div class="flex items-start justify-between gap-3 mb-2">
              <div>
                <p class="text-sm font-medium text-cream font-mono">
                  Замовлення {{ shortId(order.id) }}
                </p>
                <p class="text-xs text-cream-faint">
                  {{ order.buyer?.name }} · {{ new Date(order.createdAt).toLocaleDateString('uk-UA') }}
                </p>
              </div>
              <span :class="['text-xs font-medium border px-2 py-0.5 rounded-full flex-shrink-0', statusColor(order.status)]">
                {{ statusLabel(order.status) }}
              </span>
            </div>

            <p class="text-xs text-cream-faint mb-3">
              {{ order.items?.map(i => i.product?.name || 'Товар').join(', ') }}
            </p>

            <!-- Action Buttons — правильні переходи: PENDING→PROCESSING, PENDING→CANCELLED, PROCESSING→DELIVERED -->
            <div class="flex gap-2">
              <button
                v-if="order.status === 'PENDING'"
                type="button"
                @click="updateOrderStatus(order.id, 'PROCESSING')"
                class="text-xs px-3 py-1.5 bg-status-info/10 text-status-info border border-status-info/30 rounded-lg hover:bg-status-info/20 transition-all duration-200"
              >
                Прийняти
              </button>
              <button
                v-if="order.status === 'PROCESSING'"
                type="button"
                @click="updateOrderStatus(order.id, 'DELIVERED')"
                class="text-xs px-3 py-1.5 bg-status-success/10 text-status-success border border-status-success/30 rounded-lg hover:bg-status-success/20 transition-all duration-200"
              >
                Доставлено
              </button>
              <!-- Скасувати ТІЛЬКИ для PENDING (не для PROCESSING) -->
              <button
                v-if="order.status === 'PENDING'"
                type="button"
                @click="updateOrderStatus(order.id, 'CANCELLED')"
                class="text-xs px-3 py-1.5 bg-status-error/10 text-status-error border border-status-error/30 rounded-lg hover:bg-status-error/20 transition-all duration-200"
              >
                Скасувати
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ══ ADD PRODUCT MODAL ══ -->
    <Teleport to="body">
      <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition duration-150" leave-from-class="opacity-100" leave-to-class="opacity-0">
        <div v-if="showAddProductModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click.self="showAddProductModal = false">
          <div class="w-full max-w-lg bg-bg-card border border-border rounded-2xl shadow-2xl animate-slide-up overflow-hidden">
            <div class="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 class="text-lg font-semibold text-cream">Новий товар</h3>
              <button type="button" @click="showAddProductModal = false" class="w-8 h-8 flex items-center justify-center rounded-lg text-cream-faint hover:text-cream hover:bg-bg-surface transition-all duration-200">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <form @submit.prevent="addProduct" class="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label class="block text-xs font-medium text-cream-muted mb-1.5">Назва <span class="text-status-error">*</span></label>
                <input v-model="newProduct.name" type="text" placeholder="Назва товару" class="input-field" required/>
              </div>
              <div>
                <label class="block text-xs font-medium text-cream-muted mb-1.5">Опис</label>
                <textarea v-model="newProduct.description" placeholder="Опис товару..." rows="3" class="input-field resize-none"></textarea>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-medium text-cream-muted mb-1.5">Ціна (грн) <span class="text-status-error">*</span></label>
                  <input v-model="newProduct.price" type="number" min="1" step="0.01" placeholder="0.00" class="input-field" required/>
                </div>
                <div>
                  <label class="block text-xs font-medium text-cream-muted mb-1.5">Кількість <span class="text-status-error">*</span></label>
                  <input v-model="newProduct.stock" type="number" min="0" placeholder="0" class="input-field" required/>
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-cream-muted mb-2">Фото товару</label>
                <div v-if="!imagePreview" class="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-accent/50 transition-colors duration-200 cursor-pointer relative">
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" @change="onImageChange"/>
                  <div class="text-3xl mb-2">🖼️</div>
                  <p class="text-sm text-cream-muted">Натисніть або перетягніть фото</p>
                  <p class="text-xs text-cream-faint mt-1">JPG, PNG, WebP · До 5 МБ</p>
                </div>
                <div v-else class="relative">
                  <img :src="imagePreview" alt="Прев'ю" class="w-full h-40 object-cover rounded-xl border border-border"/>
                  <button type="button" @click="clearImage" class="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-all duration-200">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-cream-muted mb-1.5">Категорія <span class="text-status-error">*</span></label>
                <select v-model="newProduct.categoryId" class="input-field">
                  <option value="">Оберіть категорію</option>
                  <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                </select>
              </div>
              <div class="flex gap-3 pt-2">
                <button type="button" @click="showAddProductModal = false" class="btn-ghost flex-1">Скасувати</button>
                <button type="submit" :disabled="addingProduct" class="btn-primary flex-1 flex items-center justify-center gap-2">
                  <svg v-if="addingProduct" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  {{ addingProduct ? 'Збереження...' : 'Додати товар' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ══ EDIT PRODUCT MODAL ══ -->
    <Teleport to="body">
      <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition duration-150" leave-from-class="opacity-100" leave-to-class="opacity-0">
        <div v-if="showEditModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click.self="showEditModal = false">
          <div class="w-full max-w-lg bg-bg-card border border-border rounded-2xl shadow-2xl animate-slide-up overflow-hidden">
            <div class="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h3 class="text-lg font-semibold text-cream">Редагувати товар</h3>
                <p class="text-xs text-cream-faint mt-0.5 font-mono">{{ shortId(editProduct.id) }}</p>
              </div>
              <button type="button" @click="showEditModal = false" class="w-8 h-8 flex items-center justify-center rounded-lg text-cream-faint hover:text-cream hover:bg-bg-surface transition-all duration-200">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <form @submit.prevent="saveEdit" class="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label class="block text-xs font-medium text-cream-muted mb-1.5">Назва <span class="text-status-error">*</span></label>
                <input v-model="editProduct.name" type="text" placeholder="Назва товару" class="input-field" required/>
              </div>
              <div>
                <label class="block text-xs font-medium text-cream-muted mb-1.5">Опис</label>
                <textarea v-model="editProduct.description" placeholder="Опис товару..." rows="3" class="input-field resize-none"></textarea>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-medium text-cream-muted mb-1.5">Ціна (грн) <span class="text-status-error">*</span></label>
                  <input v-model="editProduct.price" type="number" min="1" step="0.01" placeholder="0.00" class="input-field" required/>
                </div>
                <div>
                  <label class="block text-xs font-medium text-cream-muted mb-1.5">Кількість <span class="text-status-error">*</span></label>
                  <input v-model="editProduct.stock" type="number" min="0" placeholder="0" class="input-field" required/>
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-cream-muted mb-2">Фото товару</label>
                <div v-if="!editImagePreview" class="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-accent/50 transition-colors duration-200 cursor-pointer relative">
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" @change="onEditImageChange"/>
                  <div class="text-3xl mb-2">🖼️</div>
                  <p class="text-sm text-cream-muted">Натисніть або перетягніть нове фото</p>
                  <p class="text-xs text-cream-faint mt-1">JPG, PNG, WebP · До 5 МБ</p>
                </div>
                <div v-else class="relative">
                  <img :src="editImagePreview" alt="Прев'ю" class="w-full h-40 object-cover rounded-xl border border-border"/>
                  <button type="button" @click="clearEditImage" class="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-all duration-200">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-cream-muted mb-1.5">Категорія</label>
                <select v-model="editProduct.categoryId" class="input-field">
                  <option value="">Без категорії</option>
                  <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                </select>
              </div>
              <div class="flex gap-3 pt-2">
                <button type="button" @click="showEditModal = false" class="btn-ghost flex-1">Скасувати</button>
                <button type="submit" :disabled="savingEdit" class="btn-primary flex-1 flex items-center justify-center gap-2">
                  <svg v-if="savingEdit" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  {{ savingEdit ? 'Збереження...' : 'Зберегти зміни' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>
