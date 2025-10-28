<script setup>
import { ref } from 'vue'
import { Home, BarChart3, Users, DollarSign, Settings, FileText, LogOut, GraduationCap } from 'lucide-vue-next'

// Get auth data
const { user, profile, logout, isLoading } = useAuth()

// Navigation items - computed to include role-based items
const navigationItems = computed(() => {
  const baseItems = [
    { name: 'Dashboard', href: '/', icon: 'home' },
    // { name: 'Analytics', href: '/analytics', icon: 'chart' },
  ]
  
  // Add superadmin-only items
  if (profile.value?.role === 'superadmin') {
    baseItems.push(
      { name: 'Users', href: '/users', icon: 'users' },
      { name: 'Tariffs', href: '/tariffs', icon: 'dollar-sign' }
    )
  }
  
  // Add sales-related items
  if (profile.value?.role === 'sales' || profile.value?.role === 'head_sales') {
    baseItems.push(
      { name: 'Sales', href: '/sales', icon: 'graduation-cap' }
    )
  }
  
  return baseItems
})

// Mobile sidebar state
const isSidebarOpen = ref(false)

// Get icon component based on icon name
const getIconComponent = (iconName) => {
  const iconMap = {
    home: Home,
    chart: BarChart3,
    users: Users,
    'dollar-sign': DollarSign,
    'graduation-cap': GraduationCap,
    settings: Settings,
    'file-text': FileText
  }
  return iconMap[iconName] || Home
}

// Handle logout
const handleLogout = async () => {
  await logout()
}
</script>

<template>
  <div class="flex h-screen bg-gray-50">
    <!-- Sidebar -->
    <div class="hidden md:flex md:w-64 md:flex-col">
      <div class="flex flex-col flex-grow pt-5 overflow-y-auto bg-white border-r border-gray-200">
        <!-- Logo Section -->
        <div class="flex items-center flex-shrink-0 px-4">
          <img class="h-8 w-auto" src="/favicon.png" alt="Company Logo" />
          <span class="ml-2 text-xl font-semibold text-gray-900">Razgovor</span>
        </div>
        
        <!-- Divider -->
        <div class="mt-5 border-t border-gray-200"></div>
        
        <!-- Navigation Items -->
        <div class="mt-5 flex-1 flex flex-col">
          <nav class="flex-1 px-2 pb-4 space-y-1">
            <NuxtLink
              v-for="item in navigationItems"
              :key="item.name"
              :to="item.href"
              class="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-150"
              active-class="bg-gray-100 text-gray-900"
            >
              <component
                :is="getIconComponent(item.icon)"
                class="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500"
              />
              {{ item.name }}
            </NuxtLink>
          </nav>
        </div>
        
        <!-- Profile Section -->
        <div class="flex-shrink-0 border-t border-gray-200 p-4">
          <div class="flex items-center space-x-3">
            <div class="flex-shrink-0">
              <div class="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                <span class="text-sm font-medium text-gray-700">
                  {{ profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'U') }}
                </span>
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">
                {{ profile?.full_name || user?.email || 'User' }}
              </p>
              <p class="text-xs text-gray-500 truncate">{{ user?.email }}</p>
              <p v-if="profile?.role" class="text-xs text-blue-600 truncate capitalize">{{ profile.role.replace('_', ' ') }}</p>
            </div>
          </div>
          <button 
            @click="handleLogout"
            :disabled="isLoading"
            class="mt-3 w-full flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <svg class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {{ isLoading ? 'Logging out...' : 'Logout' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile sidebar overlay -->
    <div v-if="isSidebarOpen" class="fixed inset-0 z-40 flex md:hidden">
      <div class="fixed inset-0 bg-gray-600 bg-opacity-75" @click="isSidebarOpen = false"></div>
      <div class="relative flex-1 flex flex-col max-w-xs w-full bg-white">
        <div class="absolute top-0 right-0 -mr-12 pt-2">
          <button
            class="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            @click="isSidebarOpen = false"
          >
            <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <!-- Mobile sidebar content (same as desktop) -->
        <div class="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
          <div class="flex items-center flex-shrink-0 px-4">
            <img class="h-8 w-auto" src="/logo.svg" alt="Company Logo" />
            <span class="ml-2 text-xl font-semibold text-gray-900">Razgovor</span>
          </div>
          <div class="mt-5 border-t border-gray-200"></div>
          <div class="mt-5 flex-1 flex flex-col">
            <nav class="flex-1 px-2 space-y-1">
              <NuxtLink
                v-for="item in navigationItems"
                :key="item.name"
                :to="item.href"
                class="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                active-class="bg-gray-100 text-gray-900"
                @click="isSidebarOpen = false"
              >
                <component
                  :is="getIconComponent(item.icon)"
                  class="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500"
                />
                {{ item.name }}
              </NuxtLink>
            </nav>
          </div>
          <div class="flex-shrink-0 border-t border-gray-200 p-4">
            <div class="flex items-center space-x-3">
              <div class="flex-shrink-0">
                <div class="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                  <span class="text-sm font-medium text-gray-700">
                    {{ profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'U') }}
                  </span>
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">
                  {{ profile?.full_name || user?.email || 'User' }}
                </p>
                <p class="text-xs text-gray-500 truncate">{{ user?.email }}</p>
                <p v-if="profile?.role" class="text-xs text-blue-600 truncate capitalize">{{ profile.role.replace('_', ' ') }}</p>
              </div>
            </div>
            <button 
              @click="handleLogout"
              :disabled="isLoading"
              class="mt-3 w-full flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <LogOut class="mr-2 h-4 w-4" />
              {{ isLoading ? 'Logging out...' : 'Logout' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Main content area -->
    <div class="flex flex-col flex-1 overflow-hidden">
      <!-- Mobile header -->
      <div class="md:hidden bg-white shadow-sm border-b border-gray-200">
        <div class="px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            <div class="flex items-center">
              <button
                class="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                @click="isSidebarOpen = true"
              >
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <img class="ml-2 h-8 w-auto" src="/logo.svg" alt="Company Logo" />
            </div>
          </div>
        </div>
      </div>

      <!-- Page content -->
      <main class="flex-1 overflow-y-auto bg-gray-50">
        <div class="py-6">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <slot />
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
/* Custom styles if needed */
</style>
