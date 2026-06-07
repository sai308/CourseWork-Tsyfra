<script setup>
import { onMounted, watch } from 'vue'
import { useProductsStore } from '@/stores/products'
import SidebarFilter from '@/components/catalog/SidebarFilter.vue'
import MobilePills from '@/components/catalog/MobilePills.vue'
import ProductGrid from '@/components/catalog/ProductGrid.vue'

const productsStore = useProductsStore()

onMounted(async () => {
  await Promise.all([
    productsStore.fetchCategories(),
    productsStore.fetchProducts()
  ])
})

function onPageChange(page) {
  productsStore.filters.page = page
  productsStore.fetchProducts()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

    <!-- Page header -->
    <div class="mb-8">
      <div class="inline-flex items-center gap-2 mb-2">
        <div class="w-6 h-px bg-accent"></div>
        <span class="text-xs font-semibold text-accent uppercase tracking-[0.2em]">Маркетплейс</span>
      </div>
      <h1 class="font-brand text-4xl sm:text-5xl italic text-cream">Каталог виробів</h1>
      <p class="text-cream-muted mt-2">
        <span v-if="!productsStore.loading">
          Знайдено {{ productsStore.total }} виробів
        </span>
        <span v-else class="inline-block w-32 h-4 bg-bg-surface rounded animate-pulse"></span>
      </p>
    </div>

    <!-- Mobile Pills -->
    <MobilePills class="mb-6" />

    <!-- Layout -->
    <div class="flex gap-8">
      <!-- Sidebar -->
      <SidebarFilter class="w-64 shrink-0" />

      <!-- Main Content -->
      <div class="flex-1 min-w-0">
        <!-- Product Grid -->
        <ProductGrid
          :products="productsStore.products"
          :loading="productsStore.loading"
        />

        <!-- Pagination -->
        <div
          v-if="productsStore.totalPages > 1 && !productsStore.loading"
          class="flex items-center justify-center gap-2 mt-10"
        >
          <button
            @click="onPageChange(productsStore.filters.page - 1)"
            :disabled="productsStore.filters.page <= 1"
            class="w-10 h-10 flex items-center justify-center rounded-lg border border-border text-cream-muted hover:border-accent hover:text-accent transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>

          <div class="flex gap-1">
            <button
              v-for="page in productsStore.totalPages"
              :key="page"
              @click="onPageChange(page)"
              :class="[
                'w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200',
                productsStore.filters.page === page
                  ? 'bg-accent text-bg-primary'
                  : 'border border-border text-cream-muted hover:border-accent hover:text-accent'
              ]"
            >
              {{ page }}
            </button>
          </div>

          <button
            @click="onPageChange(productsStore.filters.page + 1)"
            :disabled="productsStore.filters.page >= productsStore.totalPages"
            class="w-10 h-10 flex items-center justify-center rounded-lg border border-border text-cream-muted hover:border-accent hover:text-accent transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
