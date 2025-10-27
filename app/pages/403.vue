<script setup lang="ts">
import { ShieldX, Home, ArrowLeft, Users, BookOpen, Target, BarChart3 } from 'lucide-vue-next'

definePageMeta({
  layout: false
})

const { userRole, profile } = useAuth()
const route = useRoute()

// Get user-friendly role name
const getRoleName = (role: string) => {
  const roleNames = {
    'superadmin': 'Super Administrator',
    'head_teaching': 'Head of Teaching',
    'head_sales': 'Head of Sales',
    'teacher': 'Teacher',
    'sales': 'Sales Representative'
  }
  return roleNames[role as keyof typeof roleNames] || role
}

// Get suggested pages based on user role
const getSuggestedPages = () => {
  if (!userRole.value) return []
  
  const suggestions = []
  
  // Teaching staff suggestions
  if (['teacher', 'head_teaching'].includes(userRole.value)) {
    suggestions.push(
      { name: 'Students', path: '/students', icon: Users, description: 'Manage student information' },
      { name: 'Lessons', path: '/lessons', icon: BookOpen, description: 'Plan and track lessons' }
    )
  }
  
  // Sales staff suggestions
  if (['sales', 'head_sales'].includes(userRole.value)) {
    suggestions.push(
      { name: 'Leads', path: '/leads', icon: Target, description: 'Manage sales leads' }
    )
  }
  
  // Management suggestions
  if (['head_teaching', 'head_sales', 'superadmin'].includes(userRole.value)) {
    suggestions.push(
      { name: 'Reports', path: '/reports', icon: BarChart3, description: 'View analytics and reports' }
    )
  }
  
  return suggestions
}

const suggestions = getSuggestedPages()

const handleGoBack = () => {
  if (window.history.length > 1) {
    window.history.back()
  } else {
    navigateTo('/')
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-2xl">
      <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <!-- Error Icon -->
        <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
          <ShieldX class="h-8 w-8 text-red-600" />
        </div>

        <!-- Error Content -->
        <div class="text-center">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">
            403 - Access Denied
          </h1>
          
          <p class="text-gray-600 mb-2">
            You don't have permission to access this page.
          </p>
          
          <div v-if="profile" class="text-sm text-gray-500 mb-8">
            Current role: <span class="font-medium">{{ getRoleName(profile.role) }}</span>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <!-- Go Back Button -->
            <button
              @click="handleGoBack"
              class="flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <ArrowLeft class="h-4 w-4 mr-2" />
              Go Back
            </button>

            <!-- Dashboard Button -->
            <NuxtLink
              to="/"
              class="flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <Home class="h-4 w-4 mr-2" />
              Go to Dashboard
            </NuxtLink>
          </div>

          <!-- Suggested Pages -->
          <div v-if="suggestions.length > 0" class="border-t pt-8">
            <h3 class="text-lg font-medium text-gray-900 mb-4">
              Pages you can access:
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <NuxtLink
                v-for="suggestion in suggestions"
                :key="suggestion.path"
                :to="suggestion.path"
                class="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors duration-200 text-left"
              >
                <div class="flex items-start">
                  <component :is="suggestion.icon" class="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h4 class="text-sm font-medium text-gray-900">{{ suggestion.name }}</h4>
                    <p class="text-xs text-gray-500 mt-1">{{ suggestion.description }}</p>
                  </div>
                </div>
              </NuxtLink>
            </div>
          </div>

          <!-- Help Section -->
          <div class="mt-8 p-4 bg-blue-50 rounded-md">
            <div class="text-sm text-blue-800">
              <p class="font-medium mb-2">Need access to this page?</p>
              <p>Contact your administrator to request the necessary permissions for your role.</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="mt-8 text-center">
      <p class="text-sm text-gray-500">
        If you believe this is an error, please contact support.
      </p>
    </div>
  </div>
</template>
