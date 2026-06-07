<script setup>
import { ref, computed, watch } from 'vue'
import { useProductsStore } from '@/stores/products'

const productsStore = useProductsStore()

const minPriceInput = ref(productsStore.filters.minPrice)
const maxPriceInput = ref(productsStore.filters.maxPrice)

let priceDebounce = null

function onPriceChange() {
  clearTimeout(priceDebounce)
  priceDebounce = setTimeout(() => {
    productsStore.filters.minPrice = minPriceInput.value
    productsStore.filters.maxPrice = maxPriceInput.value
    productsStore.filters.page = 1
    productsStore.fetchProducts()
  }, 500)
}

function clearFilters() {
  minPriceInput.value = ''
  maxPriceInput.value = ''
  productsStore.clearFilters()
}

const activeFilterCount = computed(() => {
  let count = 0
  if (productsStore.filters.categoryIds.length) count += productsStore.filters.categoryIds.length
  if (productsStore.filters.minPrice) count++
  if (productsStore.filters.maxPrice) count++
  return count
})
</script>

<template>
  <aside class="hidden lg:block space-y-6">
    <!-- Filter Header -->
    <div class="flex items-center justify-between">
      <h2 class="text-base font-semibold text-cream flex items-center gap-2">
        Фільтри
        <span
          v-if="activeFilterCount > 0"
          class="inline-flex items-center justify-center w-5 h-5 bg-accent text-bg-primary text-xs font-bold rounded-full"
        >
          {{ activeFilterCount }}
        </span>
      </h2>
      <button
        v-if="activeFilterCount > 0"
        @click="clearFilters"
        class="text-xs text-accent hover:text-accent-light transition-colors duration-200"
      >
        Скинути
      </button>
    </div>

    <!-- Categories -->
    <div class="space-y-3">
      <h3 class="text-xs font-semibold text-cream-faint uppercase tracking-wider">Категорії</h3>
      <div class="space-y-1">
        <label
          v-for="category in productsStore.categories"
          :key="category.id"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 hover:bg-bg-surface group"
          :class="{ 'bg-accent/10': productsStore.filters.categoryIds.includes(category.id) }"
        >
          <div
            class="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all duration-200"
            :class="productsStore.filters.categoryIds.includes(category.id)
              ? 'bg-accent border-accent'
              : 'border-border group-hover:border-accent/60'"
          >
            <svg
              v-if="productsStore.filters.categoryIds.includes(category.id)"
              class="w-2.5 h-2.5 text-bg-primary"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
          </div>
          <input
            type="checkbox"
            class="sr-only"
            :checked="productsStore.filters.categoryIds.includes(category.id)"
            @change="productsStore.toggleCategory(category.id)"
          />
          <span
            class="text-sm transition-colors duration-200"
            :class="productsStore.filters.categoryIds.includes(category.id) ? 'text-accent font-medium' : 'text-cream-muted group-hover:text-cream'"
          >
            {{ category.name }}
          </span>
          <span v-if="category._count?.products" class="ml-auto text-xs text-cream-faint">
            {{ category._count.products }}
          </span>
        </label>
      </div>
      <div v-if="!productsStore.categories.length" class="text-xs text-cream-faint italic px-3">
        Категорії недоступні
      </div>
    </div>

    <!-- Divider -->
    <div class="border-t border-border"></div>

    <!-- Price Range -->
    <div class="space-y-3">
      <h3 class="text-xs font-semibold text-cream-faint uppercase tracking-wider">Ціна (грн)</h3>
      <div class="flex gap-2">
        <div class="flex-1">
          <label class="block text-xs text-cream-faint mb-1">Від</label>
          <input
            v-model="minPriceInput"
            @input="onPriceChange"
            type="number"
            placeholder="0"
            min="0"
            class="input-field text-sm py-2"
          />
        </div>
        <div class="flex-1">
          <label class="block text-xs text-cream-faint mb-1">До</label>
          <input
            v-model="maxPriceInput"
            @input="onPriceChange"
            type="number"
            placeholder="∞"
            min="0"
            class="input-field text-sm py-2"
          />
        </div>
      </div>
    </div>

    <!-- Divider -->
    <div class="border-t border-border"></div>

    <!-- Clear Button -->
    <button
      v-if="activeFilterCount > 0"
      @click="clearFilters"
      class="w-full btn-ghost text-sm py-2"
    >
      Скинути всі фільтри
    </button>
  </aside>
</template>
