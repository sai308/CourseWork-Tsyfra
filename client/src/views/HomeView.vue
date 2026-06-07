<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useProductsStore } from '@/stores/products'

const router = useRouter()
const productsStore = useProductsStore()

const featuredCategories = ref([
  { name: 'Кераміка', icon: '🏺', description: 'Авторський посуд та декор' },
  { name: 'Ювелірні прикраси', icon: '💎', description: 'Ексклюзивні прикраси' },
  { name: 'Текстиль', icon: '🧶', description: 'В\'язані та ткані вироби' },
  { name: 'Шкіряні вироби', icon: '👜', description: 'Сумки та аксесуари' },
  { name: 'Дерево', icon: '🪵', description: 'Вироби з дерева' },
])

const features = ref([
  { icon: '✦', title: 'Унікальність', desc: 'Кожен виріб виготовляється в єдиному екземплярі або малими серіями. Ви отримаєте щось справді особливе.' },
  { icon: '♦', title: 'Якість', desc: 'Всі майстри проходять верифікацію. Ми гарантуємо автентичність та якість кожного виробу.' },
  { icon: '❈', title: 'Підтримка майстрів', desc: 'Купуючи у нас, ви підтримуєте українських ремісників та сприяєте розвитку народних традицій.' },
])

const values = ref([
  { icon: '🛡️', title: 'Перевірена якість', desc: 'Кожен майстер проходить верифікацію. Кожен товар перевіряється модераторами перед публікацією.' },
  { icon: '🇺🇦', title: 'Зроблено в Україні', desc: 'Ми пишаємось тим, що підтримуємо виключно українських майстрів та вітчизняне виробництво.' },
  { icon: '💚', title: 'Eco-friendly підхід', desc: 'Більшість майстрів використовують натуральні матеріали та екологічно чисті технології виробництва.' },
  { icon: '🤝', title: 'Спільнота з відгуками', desc: 'Покупці можуть залишати відгуки з рейтингом, а майстри отримують чесний зворотній зв\'язок.' },
])

const stats = ref([
  { value: '500+', label: 'Унікальних товарів' },
  { value: '120+', label: 'Майстрів на платформі' },
  { value: '2000+', label: 'Задоволених покупців' },
  { value: '5', label: 'Категорій ремесла' },
])

function goToCatalog(categoryName) {
  router.push('/catalog')
}

function goToCatalogSearch(name) {
  productsStore.filters.search = name
  productsStore.filters.page = 1
  router.push('/catalog')
}
</script>

<template>
  <div class="min-h-screen">

    <!-- Hero Section -->
    <section class="relative overflow-hidden min-h-[90vh] flex items-center">
      <!-- Background gradients -->
      <div class="absolute inset-0 bg-bg-primary">
        <div class="absolute top-0 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl"></div>
        <div class="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/8 rounded-full blur-3xl"></div>
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/3 rounded-full blur-3xl"></div>
      </div>

      <!-- Decorative lines -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute top-20 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent opacity-40"></div>
        <div class="absolute bottom-20 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent opacity-40"></div>
      </div>

      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div class="max-w-3xl">
          <!-- Pre-heading label -->
          <div class="inline-flex items-center gap-2 mb-6">
            <div class="w-8 h-px bg-accent"></div>
            <span class="text-xs font-semibold text-accent uppercase tracking-[0.2em]">Маркетплейс ручної роботи</span>
            <div class="w-8 h-px bg-accent"></div>
          </div>

          <!-- Main Headline -->
          <h1 class="font-brand text-6xl sm:text-7xl lg:text-8xl font-semibold text-cream leading-none mb-4">
            <span class="italic text-accent">Handmade</span><br/>
            <span class="text-cream/90">з душею</span>
          </h1>

          <!-- Subtitle -->
          <p class="text-lg sm:text-xl text-cream-muted font-light leading-relaxed mb-10 max-w-xl">
            Відкрийте світ унікальних виробів ручної роботи від талановитих майстрів України. 
            Кожна річ — це маленький шедевр, створений з любов'ю та майстерністю.
          </p>

          <!-- CTA Buttons -->
          <div class="flex flex-wrap items-center gap-4">
            <RouterLink to="/catalog" class="btn-primary text-base px-8 py-3 inline-flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
              </svg>
              Переглянути каталог
            </RouterLink>
            <a href="#categories" class="btn-ghost text-base px-8 py-3 inline-flex items-center gap-2">
              Дізнатися більше
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </a>
          </div>

          <!-- Stats -->
          <div class="flex flex-wrap gap-8 mt-16 pt-10 border-t border-border">
            <div>
              <p class="text-3xl font-brand font-semibold italic text-accent">500+</p>
              <p class="text-xs text-cream-faint uppercase tracking-wider mt-1">Унікальних виробів</p>
            </div>
            <div>
              <p class="text-3xl font-brand font-semibold italic text-accent">120+</p>
              <p class="text-xs text-cream-faint uppercase tracking-wider mt-1">Майстрів</p>
            </div>
            <div>
              <p class="text-3xl font-brand font-semibold italic text-accent">98%</p>
              <p class="text-xs text-cream-faint uppercase tracking-wider mt-1">Задоволених клієнтів</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Scroll indicator -->
      <div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
        <span class="text-xs text-cream-faint">Прокрутіть вниз</span>
        <svg class="w-4 h-4 text-cream-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </div>
    </section>

    <!-- Categories Section -->
    <section id="categories" class="py-20 bg-bg-surface">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <div class="inline-flex items-center gap-2 mb-4">
            <div class="w-8 h-px bg-accent"></div>
            <span class="text-xs font-semibold text-accent uppercase tracking-[0.2em]">Категорії</span>
            <div class="w-8 h-px bg-accent"></div>
          </div>
          <h2 class="font-brand text-4xl sm:text-5xl italic text-cream mb-4">Оберіть свій стиль</h2>
          <p class="text-cream-muted max-w-md mx-auto">Від кераміки до ювелірних прикрас — знайдіть щось особливе саме для вас</p>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <button
            v-for="(category, index) in featuredCategories"
            :key="index"
            @click="goToCatalogSearch(category.name)"
            class="group flex flex-col items-center gap-3 p-6 bg-bg-card border border-border rounded-2xl hover:border-accent/50 hover:bg-accent/5 transition-all duration-300 text-center cursor-pointer"
            :style="{ animationDelay: `${index * 100}ms` }"
          >
            <span class="text-4xl group-hover:scale-110 transition-transform duration-300">{{ category.icon }}</span>
            <div>
              <p class="text-sm font-semibold text-cream group-hover:text-accent transition-colors duration-200">{{ category.name }}</p>
              <p class="text-xs text-cream-faint mt-0.5">{{ category.description }}</p>
            </div>
          </button>
        </div>

        <div class="text-center mt-10">
          <RouterLink to="/catalog" class="btn-ghost inline-flex items-center gap-2">
            Всі категорії
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="py-20 bg-bg-primary">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div v-for="feature in features" :key="feature.title"
            class="text-center p-8 bg-bg-surface border border-border rounded-2xl hover:border-accent/40 transition-all duration-300 group"
          >
            <div class="w-12 h-12 mx-auto mb-4 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center text-accent text-xl group-hover:bg-accent/20 transition-all duration-300">
              {{ feature.icon }}
            </div>
            <h3 class="text-lg font-semibold text-cream mb-3">{{ feature.title }}</h3>
            <p class="text-sm text-cream-muted leading-relaxed">{{ feature.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- About Section -->
    <section id="about" class="py-24 bg-bg-surface">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <!-- Header -->
        <div class="text-center mb-16">
          <div class="inline-flex items-center gap-2 mb-4">
            <div class="w-8 h-px bg-accent"></div>
            <span class="text-xs font-semibold text-accent uppercase tracking-[0.2em]">Про нас</span>
            <div class="w-8 h-px bg-accent"></div>
          </div>
          <h2 class="font-brand text-4xl sm:text-5xl italic text-cream mb-6">Ми — про справжнє</h2>
          <p class="text-cream-muted text-lg max-w-2xl mx-auto leading-relaxed">
            HANDMADE — це більше ніж маркетплейс. Це простір, де традиційне українське
            ремесло зустрічається з сучасними людьми, які цінують автентичність та якість.
          </p>
        </div>

        <!-- Story + Values grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">
          <!-- Story -->
          <div class="bg-bg-card border border-border rounded-2xl p-8">
            <div class="text-3xl mb-4">🏺</div>
            <h3 class="font-brand text-2xl italic text-cream mb-4">Наша історія</h3>
            <p class="text-cream-muted leading-relaxed mb-4">
              У 2024 році ми зібрали команду людей, закоханих у ручну роботу, і поставили
              перед собою просту мету: дати майстрам зручний інструмент для продажу, а
              покупцям — місце, де кожна річ унікальна.
            </p>
            <p class="text-cream-muted leading-relaxed mb-4">
              Сьогодні на платформі представлені сотні виробів — від традиційних вишиванок і
              гончарного посуду до сучасних прикрас та дизайнерських іграшок. Кожен товар
              проходить перевірку нашою командою модерації.
            </p>
            <p class="text-cream-muted leading-relaxed">
              Ми пишаємось тим, що підтримуємо українських майстрів і допомагаємо зберігати
              культурну спадщину через ремесло.
            </p>
          </div>

          <!-- Values -->
          <div class="space-y-4">
            <div v-for="(val, i) in values" :key="i"
              class="flex items-start gap-4 p-5 bg-bg-card border border-border rounded-xl hover:border-accent/30 transition-colors duration-200"
            >
              <span class="text-2xl flex-shrink-0 mt-0.5">{{ val.icon }}</span>
              <div>
                <h4 class="font-semibold text-cream mb-1">{{ val.title }}</h4>
                <p class="text-sm text-cream-muted leading-relaxed">{{ val.desc }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          <div v-for="stat in stats" :key="stat.label"
            class="text-center p-6 bg-bg-card border border-border rounded-2xl"
          >
            <p class="font-brand text-4xl italic text-accent mb-2">{{ stat.value }}</p>
            <p class="text-xs text-cream-faint uppercase tracking-wider">{{ stat.label }}</p>
          </div>
        </div>

        <!-- CTA for makers -->
        <div class="bg-gradient-to-r from-accent/10 via-accent/5 to-transparent border border-accent/20 rounded-2xl p-8 md:p-12 text-center">
          <div class="inline-flex items-center gap-2 mb-4">
            <div class="w-6 h-px bg-accent"></div>
            <span class="text-xs font-semibold text-accent uppercase tracking-[0.2em]">Для майстрів</span>
            <div class="w-6 h-px bg-accent"></div>
          </div>
          <h3 class="font-brand text-3xl italic text-cream mb-4">Поділіться своїм мистецтвом</h3>
          <p class="text-cream-muted max-w-xl mx-auto mb-8 leading-relaxed">
            Ви майстер ручної роботи? Зареєструйтесь як продавець і представте свої вироби
            тисячам покупців по всій Україні. Це безкоштовно і просто.
          </p>
          <div class="flex flex-wrap justify-center gap-4">
            <RouterLink to="/catalog" class="btn-primary text-base px-8 py-3 inline-flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
              </svg>
              Стати майстром
            </RouterLink>
            <RouterLink to="/catalog" class="btn-ghost text-base px-8 py-3">
              Переглянути каталог
            </RouterLink>
          </div>
        </div>

      </div>
    </section>

    <!-- Contact Section -->
    <section id="contact" class="py-16 bg-bg-primary border-t border-border">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <span class="font-brand text-3xl italic text-accent tracking-widest">HANDMADE</span>
            <p class="text-sm text-cream-faint mt-2 max-w-sm">
              Маркетплейс унікальних виробів ручної роботи від талановитих майстрів України
            </p>
          </div>
          <div class="flex flex-col sm:flex-row gap-4 text-sm text-cream-muted">
            <a href="mailto:hello@handmade.ua" class="hover:text-accent transition-colors duration-200">
              hello@handmade.ua
            </a>
            <span class="hidden sm:block text-border">|</span>
            <a href="tel:+380441234567" class="hover:text-accent transition-colors duration-200">
              +38 (044) 123-45-67
            </a>
          </div>
        </div>
        <div class="mt-8 pt-6 border-t border-border text-center">
          <p class="text-xs text-cream-faint">© {{ new Date().getFullYear() }} HANDMADE. Усі права захищено.</p>
        </div>
      </div>
    </section>

  </div>
</template>
