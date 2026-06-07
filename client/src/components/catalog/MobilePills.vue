<script setup>
import { useProductsStore } from '@/stores/products'

const productsStore = useProductsStore()
</script>

<template>
  <div class="lg:hidden overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
    <div class="flex gap-2 min-w-max">
      <!-- "All" pill -->
      <button
        @click="productsStore.clearFilters()"
        :class="['pill', productsStore.filters.categoryIds.length === 0 ? 'pill-active' : '']"
      >
        Всі
      </button>

      <!-- Category pills -->
      <button
        v-for="category in productsStore.categories"
        :key="category.id"
        @click="productsStore.setCategory(category.id)"
        :class="['pill', productsStore.filters.categoryIds.includes(category.id) ? 'pill-active' : '']"
      >
        {{ category.name }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
