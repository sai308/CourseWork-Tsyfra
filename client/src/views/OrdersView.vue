<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'

const orders = ref([])
const loading = ref(true)

onMounted(async () => {
  await fetchOrders()
})

async function fetchOrders() {
  loading.value = true
  try {
    const { data } = await axios.get('/api/orders/my')
    orders.value = data.orders || data || []
  } catch {
    orders.value = []
  } finally {
    loading.value = false
  }
}

const statusLabel = (status) => ({
  PENDING: 'Очікує',
  PROCESSING: 'В обробці',
  DELIVERED: 'Доставлено',
  CANCELLED: 'Скасовано'
}[status] || status)

const statusColor = (status) => ({
  PENDING: 'text-status-warning bg-status-warning/10 border-status-warning/30',
  PROCESSING: 'text-status-info bg-status-info/10 border-status-info/30',
  DELIVERED: 'text-status-success bg-status-success/10 border-status-success/30',
  CANCELLED: 'text-status-error bg-status-error/10 border-status-error/30'
}[status] || 'text-cream-muted border-border')

function formattedTotal(order) {
  const total = order.items?.reduce((sum, i) => sum + (parseFloat(i.price) * i.quantity), 0) || 0
  return new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', minimumFractionDigits: 0 }).format(total)
}

function formattedDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

    <!-- Page Header -->
    <div class="mb-8">
      <div class="inline-flex items-center gap-2 mb-2">
        <div class="w-6 h-px bg-accent"></div>
        <span class="text-xs font-semibold text-accent uppercase tracking-[0.2em]">Мої покупки</span>
      </div>
      <h1 class="font-brand text-4xl sm:text-5xl italic text-cream">Замовлення</h1>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-4">
      <div v-for="n in 3" :key="n" class="h-32 bg-bg-card border border-border rounded-xl animate-pulse"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!orders.length" class="flex flex-col items-center justify-center py-24 text-center">
      <div class="w-20 h-20 rounded-2xl bg-bg-surface border border-border flex items-center justify-center mb-6">
        <svg class="w-10 h-10 text-cream-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
        </svg>
      </div>
      <h2 class="text-xl font-semibold text-cream mb-2">Замовлень ще немає</h2>
      <p class="text-cream-muted mb-8">Перейдіть до каталогу та зробіть перше замовлення</p>
      <RouterLink to="/catalog" class="btn-primary">До каталогу</RouterLink>
    </div>

    <!-- Orders List -->
    <div v-else class="space-y-4">
      <div
        v-for="order in orders"
        :key="order.id"
        class="bg-bg-card border border-border rounded-xl overflow-hidden hover:border-accent/30 transition-all duration-300"
      >
        <!-- Order Header -->
        <div class="flex items-center justify-between gap-4 px-6 py-4 border-b border-border bg-bg-surface/50">
          <div class="flex items-center gap-4 flex-wrap">
            <div>
              <p class="text-xs text-cream-faint uppercase tracking-wider mb-0.5">Замовлення</p>
              <p class="text-sm font-semibold text-cream">#{{ order.id }}</p>
            </div>
            <div class="w-px h-8 bg-border hidden sm:block"></div>
            <div>
              <p class="text-xs text-cream-faint uppercase tracking-wider mb-0.5">Дата</p>
              <p class="text-sm text-cream">{{ formattedDate(order.createdAt) }}</p>
            </div>
            <div class="w-px h-8 bg-border hidden sm:block"></div>
            <div>
              <p class="text-xs text-cream-faint uppercase tracking-wider mb-0.5">Сума</p>
              <p class="text-sm font-bold text-accent">{{ formattedTotal(order) }}</p>
            </div>
          </div>
          <span :class="['text-xs font-medium border px-3 py-1 rounded-full flex-shrink-0', statusColor(order.status)]">
            {{ statusLabel(order.status) }}
          </span>
        </div>

        <!-- Order Items -->
        <div class="px-6 py-4 space-y-3">
          <div
            v-for="item in order.items"
            :key="item.id"
            class="flex items-center gap-3"
          >
            <div class="w-10 h-10 rounded-lg overflow-hidden bg-bg-surface border border-border flex-shrink-0">
              <img
                v-if="item.product?.imageUrl"
                :src="item.product.imageUrl"
                :alt="item.product.name"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-sm">📦</div>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-cream truncate">
                {{ item.product?.name || 'Товар видалено' }}
              </p>
              <p class="text-xs text-cream-faint">
                {{ item.quantity }} шт. ×
                {{ new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', minimumFractionDigits: 0 }).format(parseFloat(item.price)) }}
              </p>
            </div>
            <p class="text-sm font-semibold text-cream flex-shrink-0">
              {{ new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', minimumFractionDigits: 0 }).format(parseFloat(item.price) * item.quantity) }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
