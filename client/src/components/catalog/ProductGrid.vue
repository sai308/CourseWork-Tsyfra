<script setup>
import ProductCard from '@/components/catalog/ProductCard.vue'

defineProps({
  products: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})
</script>

<template>
  <div>
    <!-- Loading Skeleton -->
    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <div
        v-for="n in 8"
        :key="n"
        class="bg-bg-card border border-border rounded-xl overflow-hidden animate-pulse"
      >
        <div class="h-48 bg-bg-surface"></div>
        <div class="p-4 space-y-3">
          <div class="h-4 bg-bg-surface rounded w-3/4"></div>
          <div class="h-3 bg-bg-surface rounded w-1/2"></div>
          <div class="flex justify-between items-center pt-1">
            <div class="h-6 bg-bg-surface rounded w-20"></div>
            <div class="h-8 bg-bg-surface rounded w-24"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="!products.length"
      class="flex flex-col items-center justify-center py-24 text-center"
    >
      <div class="w-20 h-20 rounded-2xl bg-bg-surface border border-border flex items-center justify-center mb-6">
        <svg class="w-10 h-10 text-cream-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </div>
      <h3 class="text-xl font-semibold text-cream mb-2">Нічого не знайдено</h3>
      <p class="text-cream-muted max-w-sm">
        Спробуйте змінити фільтри або пошуковий запит, щоб знайти потрібні вироби
      </p>
    </div>

    <!-- Product Grid -->
    <div
      v-else
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
    >
      <ProductCard
        v-for="product in products"
        :key="product.id"
        :product="product"
      />
    </div>
  </div>
</template>
