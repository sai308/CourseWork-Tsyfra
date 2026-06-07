<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'

const props = defineProps({
  product: {
    type: Object,
    required: true
  }
})

const router = useRouter()
const cart = useCartStore()

function goToProduct() {
  router.push({ name: 'product', params: { id: props.product.id } })
}

function addToCart(event) {
  event.stopPropagation()
  cart.addItem(props.product)
}

const stockStatus = computed(() => {
  if (props.product.stock === 0) return 'out'
  if (props.product.stock <= 5) return 'low'
  return 'ok'
})

const formattedPrice = computed(() => {
  return new Intl.NumberFormat('uk-UA', {
    style: 'currency',
    currency: 'UAH',
    minimumFractionDigits: 0
  }).format(props.product.price)
})
</script>

<template>
  <div
    class="card group cursor-pointer animate-fade-in"
    @click="goToProduct"
  >
    <!-- Image -->
    <div class="relative overflow-hidden h-48 bg-bg-surface">
      <img
        v-if="product.imageUrl"
        :src="product.imageUrl"
        :alt="product.name"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
      />
      <div v-else class="w-full h-full flex items-center justify-center">
        <svg class="w-12 h-12 text-cream-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
      </div>

      <!-- Stock badge overlay -->
      <div class="absolute top-2 left-2">
        <span v-if="stockStatus === 'low'" class="badge-warning">
          ⚡ Скоро закінчиться
        </span>
        <span v-else-if="stockStatus === 'out'" class="badge-error">
          Немає в наявності
        </span>
      </div>

      <!-- Category badge -->
      <div v-if="product.category" class="absolute top-2 right-2">
        <span class="text-xs font-medium bg-bg-primary/70 backdrop-blur-sm text-cream-muted border border-border/50 px-2 py-0.5 rounded-full">
          {{ product.category.name }}
        </span>
      </div>
    </div>

    <!-- Content -->
    <div class="p-4 flex flex-col gap-2">
      <h3 class="text-sm font-semibold text-cream line-clamp-2 leading-snug group-hover:text-accent transition-colors duration-200">
        {{ product.name }}
      </h3>

      <p v-if="product.maker" class="text-xs text-cream-faint">
        від {{ product.maker.name }}
      </p>

      <div class="flex items-center justify-between gap-2 mt-1">
        <span class="text-lg font-bold text-accent">{{ formattedPrice }}</span>

        <button
          @click="addToCart"
          :disabled="stockStatus === 'out'"
          class="btn-primary text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          В кошик
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
