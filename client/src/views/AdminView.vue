<script setup>
import { ref, onMounted } from 'vue'
import { useToastStore } from '@/stores/toast'
import axios from 'axios'

const toast = useToastStore()
const activeTab = ref('overview')
const loading = ref(false)

// Overview stats
const stats = ref(null)

// User reports/complaints
const complaints = ref([])
const loadingComplaints = ref(false)

// Categories
const categories = ref([])
const showAddCat = ref(false)
const newCat = ref({ name: '', slug: '' })
const addingCat = ref(false)

// Users
const users = ref([])
const loadingUsers = ref(false)

// Product Moderation
const pendingProducts = ref([])
const moderating = ref({})

const tabs = [
  { key: 'overview',    label: 'Огляд',      icon: '📊' },
  { key: 'moderation',  label: 'Модерація',  icon: '🔍' },
  { key: 'complaints',  label: 'Скарги',     icon: '⚠️' },
  { key: 'categories',  label: 'Категорії',  icon: '🏷️' },
  { key: 'users',       label: 'Користувачі', icon: '👥' },
]

const shortId = (id) => id ? `#${id.slice(-6).toUpperCase()}` : '—'

onMounted(async () => {
  await Promise.all([fetchStats(), fetchCategories(), fetchUsers(), fetchPendingProducts(), fetchComplaints()])
})

async function fetchStats() {
  loading.value = true
  try {
    const { data } = await axios.get('/api/admin/reports')
    stats.value = data
  } catch {
    stats.value = null
  } finally {
    loading.value = false
  }
}

async function fetchComplaints() {
  loadingComplaints.value = true
  try {
    const { data } = await axios.get('/api/reports')
    complaints.value = Array.isArray(data) ? data : []
  } catch {
    complaints.value = []
  } finally {
    loadingComplaints.value = false
  }
}

async function updateComplaintStatus(id, status) {
  try {
    await axios.patch(`/api/reports/${id}/status`, { status })
    const c = complaints.value.find(r => r.id === id)
    if (c) c.status = status
    toast.success(status === 'RESOLVED' ? 'Скаргу вирішено' : 'Скаргу відхилено')
  } catch (err) {
    toast.error(err.response?.data?.error || 'Помилка оновлення')
  }
}

async function fetchPendingProducts() {
  try {
    const { data } = await axios.get('/api/admin/products/pending')
    pendingProducts.value = data
  } catch { /* ignore */ }
}

async function fetchCategories() {
  try {
    const { data } = await axios.get('/api/admin/categories')
    categories.value = data
  } catch { /* ignore */ }
}

async function fetchUsers() {
  loadingUsers.value = true
  try {
    const { data } = await axios.get('/api/admin/users')
    users.value = data
  } catch { /* ignore */ } finally {
    loadingUsers.value = false
  }
}

function autoSlug() {
  newCat.value.slug = newCat.value.name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

async function addCategory() {
  if (!newCat.value.name.trim() || !newCat.value.slug.trim()) {
    toast.error("Назва та slug обов'язкові")
    return
  }
  addingCat.value = true
  try {
    const { data } = await axios.post('/api/admin/categories', newCat.value)
    categories.value.push(data)
    newCat.value = { name: '', slug: '' }
    showAddCat.value = false
    toast.success('Категорію додано')
  } catch (err) {
    toast.error(err.response?.data?.error || 'Помилка додавання категорії')
  } finally {
    addingCat.value = false
  }
}

async function deleteCategory(id, name) {
  if (!confirm(`Видалити категорію "${name}"?`)) return
  try {
    await axios.delete(`/api/admin/categories/${id}`)
    categories.value = categories.value.filter(c => c.id !== id)
    toast.success('Категорію видалено')
  } catch (err) {
    toast.error(err.response?.data?.error || 'Помилка видалення')
  }
}

async function toggleUserActive(user) {
  try {
    const { data } = await axios.patch(`/api/admin/users/${user.id}/toggle-active`)
    const idx = users.value.findIndex(u => u.id === user.id)
    if (idx !== -1) users.value[idx] = { ...users.value[idx], isActive: data.isActive }
    toast.success(data.isActive ? `${user.name} розблоковано` : `${user.name} заблоковано`)
  } catch (err) {
    toast.error(err.response?.data?.error || 'Помилка')
  }
}

async function deleteUser(user) {
  if (!confirm(`Видалити користувача "${user.name}"? Всі його дані буде видалено!`)) return
  try {
    await axios.delete(`/api/admin/users/${user.id}`)
    users.value = users.value.filter(u => u.id !== user.id)
    toast.success('Користувача видалено')
  } catch (err) {
    toast.error(err.response?.data?.error || 'Помилка видалення')
  }
}

async function moderateProduct(id, status) {
  moderating.value[id] = status
  try {
    await axios.patch(`/api/admin/products/${id}/status`, { status })
    pendingProducts.value = pendingProducts.value.filter(p => p.id !== id)
    toast.success(status === 'APPROVED' ? 'Товар схвалено і додано до каталогу' : 'Товар відхилено')
  } catch (err) {
    toast.error(err.response?.data?.error || 'Помилка модерації')
  } finally {
    delete moderating.value[id]
  }
}

const roleLabel = (role) => ({ BUYER: 'Покупець', MAKER: 'Майстер', ADMIN: 'Адмін' })[role] || role
const roleColor = (role) => ({
  BUYER: 'text-cream-muted bg-bg-surface border-border',
  MAKER: 'text-accent bg-accent/10 border-accent/30',
  ADMIN: 'text-status-error bg-status-error/10 border-status-error/30'
})[role] || 'text-cream-muted'

const complaintStatusLabel = (s) => ({ OPEN: 'Відкрита', RESOLVED: 'Вирішено', DISMISSED: 'Відхилено' })[s] || s
const complaintStatusColor = (s) => ({
  OPEN: 'text-status-warning bg-status-warning/10 border-status-warning/30',
  RESOLVED: 'text-status-success bg-status-success/10 border-status-success/30',
  DISMISSED: 'text-cream-faint bg-bg-surface border-border'
})[s] || ''

const fmtMoney = (v) => new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', minimumFractionDigits: 0 }).format(v || 0)
const fmtDate = (d) => new Date(d).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' })
const fmtPrice = (v) => new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', minimumFractionDigits: 0 }).format(parseFloat(v) || 0)
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

    <!-- Header -->
    <div class="mb-8">
      <div class="inline-flex items-center gap-2 mb-2">
        <div class="w-6 h-px bg-accent"></div>
        <span class="text-xs font-semibold text-accent uppercase tracking-[0.2em]">Адміністратор</span>
      </div>
      <h1 class="font-brand text-4xl italic text-cream">Адмін-панель</h1>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 mb-8 border-b border-border pb-1 overflow-x-auto">
      <button
        v-for="tab in tabs" :key="tab.key"
        type="button"
        @click="activeTab = tab.key"
        :class="['flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium transition-all duration-200 -mb-px border-b-2 whitespace-nowrap', activeTab === tab.key ? 'text-accent border-accent bg-accent/5' : 'text-cream-muted border-transparent hover:text-cream hover:border-border']"
      >
        <span>{{ tab.icon }}</span> {{ tab.label }}
        <span v-if="tab.key === 'moderation' && pendingProducts.length > 0"
          class="ml-0.5 bg-accent text-bg-primary text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
          {{ pendingProducts.length }}
        </span>
        <span v-if="tab.key === 'complaints' && complaints.filter(c => c.status === 'OPEN').length > 0"
          class="ml-0.5 bg-status-warning text-bg-primary text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
          {{ complaints.filter(c => c.status === 'OPEN').length }}
        </span>
      </button>
    </div>

    <!-- ─── OVERVIEW TAB ─── -->
    <div v-if="activeTab === 'overview'">
      <div v-if="loading" class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div v-for="n in 4" :key="n" class="h-28 bg-bg-card border border-border rounded-xl animate-pulse"></div>
      </div>
      <template v-else-if="stats">

        <!-- KPI Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div v-for="stat in [
            { label: 'Всього замовлень', value: stats.orders?.total ?? '—', sub: `${stats.orders?.pending ?? 0} очікують`, icon: '🛒', color: 'text-status-info' },
            { label: 'Загальний дохід', value: fmtMoney(stats.totalRevenue), sub: `${stats.orders?.delivered ?? 0} виконано`, icon: '💰', color: 'text-status-success' },
            { label: 'Користувачів', value: stats.users?.total ?? '—', sub: `${stats.users?.makers ?? 0} майстрів`, icon: '👥', color: 'text-accent' },
            { label: 'Товарів', value: stats.products ?? '—', sub: 'опубліковано', icon: '📦', color: 'text-cream' },
          ]" :key="stat.label"
            class="bg-bg-card border border-border rounded-xl p-5"
          >
            <div class="flex items-start justify-between mb-3">
              <span class="text-xs font-semibold text-cream-faint uppercase tracking-wider">{{ stat.label }}</span>
              <span class="text-xl">{{ stat.icon }}</span>
            </div>
            <p :class="['text-2xl font-bold', stat.color]">{{ stat.value }}</p>
            <p class="text-xs text-cream-faint mt-1">{{ stat.sub }}</p>
          </div>
        </div>

        <!-- Orders Funnel -->
        <div class="bg-bg-card border border-border rounded-2xl p-6 mb-6">
          <h3 class="text-sm font-semibold text-cream-muted uppercase tracking-wider mb-4">Розподіл замовлень</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div v-for="item in [
              { label: 'Нові', val: stats.orders?.pending, color: 'text-status-warning', bg: 'bg-status-warning/10 border-status-warning/30' },
              { label: 'В обробці', val: stats.orders?.processing, color: 'text-status-info', bg: 'bg-status-info/10 border-status-info/30' },
              { label: 'Доставлено', val: stats.orders?.delivered, color: 'text-status-success', bg: 'bg-status-success/10 border-status-success/30' },
              { label: 'Скасовано', val: stats.orders?.cancelled, color: 'text-status-error', bg: 'bg-status-error/10 border-status-error/30' },
            ]" :key="item.label"
              :class="['rounded-xl border p-4 text-center', item.bg]"
            >
              <p :class="['text-3xl font-bold', item.color]">{{ item.val ?? 0 }}</p>
              <p class="text-xs text-cream-faint mt-1">{{ item.label }}</p>
            </div>
          </div>
        </div>

        <!-- Users breakdown -->
        <div class="bg-bg-card border border-border rounded-2xl p-6">
          <h3 class="text-sm font-semibold text-cream-muted uppercase tracking-wider mb-4">Аудиторія платформи</h3>
          <div class="grid grid-cols-3 gap-4">
            <div v-for="item in [
              { label: 'Всього', val: stats.users?.total, color: 'text-cream' },
              { label: 'Майстрів', val: stats.users?.makers, color: 'text-accent' },
              { label: 'Покупців', val: stats.users?.buyers, color: 'text-status-info' },
            ]" :key="item.label" class="text-center p-4 bg-bg-surface border border-border rounded-xl">
              <p :class="['text-3xl font-bold', item.color]">{{ item.val ?? 0 }}</p>
              <p class="text-xs text-cream-faint mt-1">{{ item.label }}</p>
            </div>
          </div>
        </div>
      </template>
      <div v-else class="text-center py-16 text-cream-faint">Помилка завантаження статистики</div>
    </div>

    <!-- ─── MODERATION TAB ─── -->
    <div v-if="activeTab === 'moderation'">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-lg font-semibold text-cream">Модерація товарів</h2>
          <p class="text-sm text-cream-faint mt-1">Перевірте товари майстрів перед публікацією в каталозі</p>
        </div>
        <span class="text-sm font-medium text-accent bg-accent/10 border border-accent/30 px-3 py-1 rounded-full">
          {{ pendingProducts.length }} на розгляді
        </span>
      </div>

      <div v-if="pendingProducts.length === 0" class="text-center py-16 bg-bg-card border border-border rounded-2xl">
        <div class="text-4xl mb-4">✅</div>
        <h3 class="text-lg font-semibold text-cream mb-2">Немає товарів на модерації</h3>
        <p class="text-cream-faint text-sm">Усі товари перевірено</p>
      </div>

      <div v-else class="space-y-4">
        <div v-for="product in pendingProducts" :key="product.id"
          class="bg-bg-card border border-border rounded-2xl p-5 flex gap-5">
          <div class="w-24 h-24 rounded-xl overflow-hidden bg-bg-surface flex-shrink-0">
            <img v-if="product.imageUrl" :src="product.imageUrl" :alt="product.name" class="w-full h-full object-cover"/>
            <div v-else class="w-full h-full flex items-center justify-center text-3xl">📦</div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-4">
              <div>
                <h3 class="font-semibold text-cream mb-1">{{ product.name }}</h3>
                <p class="text-xs text-cream-faint mb-2 line-clamp-2">{{ product.description }}</p>
                <div class="flex items-center gap-3 text-xs">
                  <span class="text-accent font-bold">{{ fmtPrice(product.price) }}</span>
                  <span class="text-cream-faint">•</span>
                  <span class="text-cream-muted">{{ product.category?.name }}</span>
                  <span class="text-cream-faint">•</span>
                  <span class="text-cream-muted">{{ product.maker?.name }}</span>
                </div>
              </div>
              <div class="flex gap-2 flex-shrink-0">
                <button type="button" @click="moderateProduct(product.id, 'APPROVED')" :disabled="!!moderating[product.id]"
                  class="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-status-success border border-status-success/40 bg-status-success/10 rounded-xl hover:bg-status-success/20 transition-all duration-200 disabled:opacity-50">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                  Схвалити
                </button>
                <button type="button" @click="moderateProduct(product.id, 'REJECTED')" :disabled="!!moderating[product.id]"
                  class="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-status-error border border-status-error/40 bg-status-error/10 rounded-xl hover:bg-status-error/20 transition-all duration-200 disabled:opacity-50">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                  Відхилити
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ─── COMPLAINTS TAB ─── -->
    <div v-if="activeTab === 'complaints'">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-lg font-semibold text-cream">Скарги користувачів</h2>
          <p class="text-sm text-cream-faint mt-1">Розгляньте скарги та вживайте заходів</p>
        </div>
        <button type="button" @click="fetchComplaints" class="btn-ghost text-sm">Оновити</button>
      </div>

      <div v-if="loadingComplaints" class="space-y-3">
        <div v-for="n in 3" :key="n" class="h-20 bg-bg-card border border-border rounded-xl animate-pulse"></div>
      </div>

      <div v-else-if="complaints.length === 0" class="text-center py-16 bg-bg-card border border-border rounded-2xl">
        <div class="text-4xl mb-4">🕊️</div>
        <h3 class="text-lg font-semibold text-cream mb-2">Скарг немає</h3>
        <p class="text-cream-faint text-sm">Всі користувачі поводяться добре 👍</p>
      </div>

      <div v-else class="space-y-3">
        <div v-for="c in complaints" :key="c.id"
          class="bg-bg-card border border-border rounded-xl p-5">
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-3 mb-2">
                <span :class="['text-xs font-medium border px-2 py-0.5 rounded-full', complaintStatusColor(c.status)]">
                  {{ complaintStatusLabel(c.status) }}
                </span>
                <span class="text-xs text-cream-faint uppercase">{{ c.targetType === 'product' ? '📦 Товар' : '👤 Користувач' }}</span>
                <span class="text-xs text-cream-faint">{{ fmtDate(c.createdAt) }}</span>
              </div>
              <p class="text-sm font-semibold text-cream mb-1">{{ c.reason }}</p>
              <p v-if="c.description" class="text-xs text-cream-muted mb-2">{{ c.description }}</p>
              <div class="flex items-center gap-2 text-xs text-cream-faint">
                <span>Від: <span class="text-cream-muted">{{ c.reporter?.name }}</span> ({{ c.reporter?.email }})</span>
                <span>•</span>
                <span>Ціль: <span class="font-mono text-cream-muted">{{ shortId(c.targetId) }}</span></span>
              </div>
            </div>
            <div v-if="c.status === 'OPEN'" class="flex gap-2 flex-shrink-0">
              <button type="button" @click="updateComplaintStatus(c.id, 'RESOLVED')"
                class="text-xs px-3 py-1.5 text-status-success border border-status-success/30 bg-status-success/10 rounded-lg hover:bg-status-success/20 transition-all duration-200">
                Вирішено
              </button>
              <button type="button" @click="updateComplaintStatus(c.id, 'DISMISSED')"
                class="text-xs px-3 py-1.5 text-cream-muted border border-border rounded-lg hover:bg-bg-surface transition-all duration-200">
                Відхилити
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ─── CATEGORIES TAB ─── -->
    <div v-if="activeTab === 'categories'">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-lg font-semibold text-cream">Категорії товарів</h2>
        <button type="button" @click="showAddCat = !showAddCat" class="btn-primary text-sm flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Нова категорія
        </button>
      </div>

      <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 -translate-y-2" enter-to-class="opacity-100 translate-y-0">
        <div v-if="showAddCat" class="bg-bg-card border border-accent/30 rounded-2xl p-5 mb-6">
          <h3 class="text-sm font-semibold text-cream mb-4">Нова категорія</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-xs font-medium text-cream-muted mb-1.5">Назва <span class="text-status-error">*</span></label>
              <input v-model="newCat.name" @input="autoSlug" type="text" placeholder="Наприклад: Кераміка" class="input-field"/>
            </div>
            <div>
              <label class="block text-xs font-medium text-cream-muted mb-1.5">Slug (URL) <span class="text-status-error">*</span></label>
              <input v-model="newCat.slug" type="text" placeholder="keramika" class="input-field font-mono"/>
            </div>
          </div>
          <div class="flex gap-3">
            <button type="button" @click="addCategory" :disabled="addingCat" class="btn-primary text-sm">
              {{ addingCat ? 'Збереження...' : 'Додати' }}
            </button>
            <button type="button" @click="showAddCat = false; newCat = { name: '', slug: '' }" class="btn-ghost text-sm">Скасувати</button>
          </div>
        </div>
      </Transition>

      <div class="bg-bg-card border border-border rounded-2xl overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border">
              <th class="text-left px-6 py-3 text-xs font-semibold text-cream-faint uppercase tracking-wider">Назва</th>
              <th class="text-left px-6 py-3 text-xs font-semibold text-cream-faint uppercase tracking-wider">Slug</th>
              <th class="text-left px-6 py-3 text-xs font-semibold text-cream-faint uppercase tracking-wider">Товарів</th>
              <th class="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cat in categories" :key="cat.id" class="border-b border-border/50 hover:bg-bg-surface/50 transition-colors">
              <td class="px-6 py-3 font-medium text-cream">{{ cat.name }}</td>
              <td class="px-6 py-3 font-mono text-xs text-cream-faint">{{ cat.slug }}</td>
              <td class="px-6 py-3 text-cream-muted">{{ cat._count?.products ?? 0 }}</td>
              <td class="px-6 py-3 text-right">
                <button type="button" @click="deleteCategory(cat.id, cat.name)"
                  class="text-xs px-3 py-1.5 text-status-error hover:bg-status-error/10 border border-status-error/30 rounded-lg transition-all duration-200">
                  Видалити
                </button>
              </td>
            </tr>
            <tr v-if="!categories.length">
              <td colspan="4" class="px-6 py-8 text-center text-cream-faint">Категорій ще немає</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ─── USERS TAB ─── -->
    <div v-if="activeTab === 'users'">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-lg font-semibold text-cream">Управління користувачами</h2>
        <button type="button" @click="fetchUsers" class="btn-ghost text-sm flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Оновити
        </button>
      </div>

      <div v-if="loadingUsers" class="space-y-3">
        <div v-for="n in 5" :key="n" class="h-16 bg-bg-card border border-border rounded-xl animate-pulse"></div>
      </div>

      <div v-else class="bg-bg-card border border-border rounded-2xl overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border">
              <th class="text-left px-6 py-3 text-xs font-semibold text-cream-faint uppercase tracking-wider">ID</th>
              <th class="text-left px-6 py-3 text-xs font-semibold text-cream-faint uppercase tracking-wider">Користувач</th>
              <th class="text-left px-6 py-3 text-xs font-semibold text-cream-faint uppercase tracking-wider">Роль</th>
              <th class="text-left px-6 py-3 text-xs font-semibold text-cream-faint uppercase tracking-wider">Статус</th>
              <th class="text-left px-6 py-3 text-xs font-semibold text-cream-faint uppercase tracking-wider">Дата реєстрації</th>
              <th class="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id" class="border-b border-border/50 hover:bg-bg-surface/50 transition-colors">
              <td class="px-6 py-3 font-mono text-xs text-cream-faint">{{ shortId(user.id) }}</td>
              <td class="px-6 py-3">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <img v-if="user.avatarUrl" :src="user.avatarUrl" class="w-full h-full object-cover" @error="(e) => e.target.style.display = 'none'"/>
                    <span class="text-sm font-bold text-accent">{{ user.name?.charAt(0)?.toUpperCase() }}</span>
                  </div>
                  <div>
                    <p class="font-medium text-cream">{{ user.name }}</p>
                    <p class="text-xs text-cream-faint">{{ user.email }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-3">
                <span :class="['text-xs font-medium border px-2 py-0.5 rounded-full', roleColor(user.role)]">
                  {{ roleLabel(user.role) }}
                </span>
              </td>
              <td class="px-6 py-3">
                <span :class="['text-xs font-medium', user.isActive !== false ? 'text-status-success' : 'text-status-error']">
                  {{ user.isActive !== false ? '● Активний' : '● Заблоковано' }}
                </span>
              </td>
              <td class="px-6 py-3 text-cream-faint text-xs">{{ fmtDate(user.createdAt) }}</td>
              <td class="px-6 py-3">
                <div v-if="user.role !== 'ADMIN'" class="flex items-center gap-2 justify-end">
                  <button type="button" @click="toggleUserActive(user)"
                    :class="['text-xs px-3 py-1.5 rounded-lg border transition-all duration-200', user.isActive !== false ? 'text-status-warning border-status-warning/30 hover:bg-status-warning/10' : 'text-status-success border-status-success/30 hover:bg-status-success/10']">
                    {{ user.isActive !== false ? 'Заблокувати' : 'Розблокувати' }}
                  </button>
                  <button type="button" @click="deleteUser(user)"
                    class="text-xs px-3 py-1.5 text-status-error border border-status-error/30 rounded-lg hover:bg-status-error/10 transition-all duration-200">
                    Видалити
                  </button>
                </div>
                <span v-else class="text-xs text-cream-faint px-3">—</span>
              </td>
            </tr>
            <tr v-if="!users.length">
              <td colspan="6" class="px-6 py-8 text-center text-cream-faint">Користувачів не знайдено</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>
