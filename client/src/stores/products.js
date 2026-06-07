import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import axios from 'axios'

export const useProductsStore = defineStore('products', () => {
  const products = ref([])
  const categories = ref([])
  const total = ref(0)
  const totalPages = ref(0)
  const loading = ref(false)

  const filters = reactive({
    search: '',
    categoryIds: [],
    minPrice: '',
    maxPrice: '',
    page: 1,
    limit: 12
  })

  async function fetchProducts() {
    loading.value = true
    try {
      const params = {}
      if (filters.search) params.search = filters.search
      if (filters.categoryIds.length) params.categoryIds = filters.categoryIds.join(',')
      if (filters.minPrice) params.minPrice = filters.minPrice
      if (filters.maxPrice) params.maxPrice = filters.maxPrice
      params.page = filters.page
      params.limit = filters.limit

      const { data } = await axios.get('/api/products', { params })
      products.value = data.products
      total.value = data.total
      totalPages.value = data.totalPages
    } catch (err) {
      console.error('Failed to fetch products:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchCategories() {
    try {
      const { data } = await axios.get('/api/products/categories')
      categories.value = data
    } catch (err) {
      console.error('Failed to fetch categories:', err)
    }
  }

  function toggleCategory(id) {
    const idx = filters.categoryIds.indexOf(id)
    if (idx === -1) filters.categoryIds.push(id)
    else filters.categoryIds.splice(idx, 1)
    filters.page = 1
    fetchProducts()
  }

  function setCategory(id) {
    if (filters.categoryIds.length === 1 && filters.categoryIds[0] === id) {
      filters.categoryIds = []
    } else {
      filters.categoryIds = [id]
    }
    filters.page = 1
    fetchProducts()
  }

  function clearFilters() {
    filters.search = ''
    filters.categoryIds = []
    filters.minPrice = ''
    filters.maxPrice = ''
    filters.page = 1
    fetchProducts()
  }

  return {
    products, categories, total, totalPages, loading, filters,
    fetchProducts, fetchCategories, toggleCategory, setCategory, clearFilters
  }
})
