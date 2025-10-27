<script setup lang="ts">
import { ShieldX, Home, ArrowLeft } from 'lucide-vue-next'

const props = defineProps<{
  error: {
    statusCode: number
    statusMessage: string
    message?: string
  }
}>()

const { userRole } = useAuth()

// Clear the error when navigating away
const handleClearError = () => clearError()

// Get appropriate redirect path based on user role
const getRedirectPath = () => {
  if (!userRole.value) return '/auth/login'
  return '/' // Dashboard
}

const handleGoBack = () => {
  if (window.history.length > 1) {
    window.history.back()
  } else {
    navigateTo(getRedirectPath())
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <!-- Error Icon -->
        <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
          <ShieldX class="h-8 w-8 text-red-600" />
        </div>

        <!-- Error Content -->
        <div class="text-center">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">
            {{ error.statusCode }}
          </h1>
          
          <h2 class="text-xl font-semibold text-gray-700 mb-4">
            {{ error.statusCode === 403 ? 'Access Denied' : 'Something went wrong' }}
          </h2>
          
          <p class="text-gray-600 mb-8">
            {{ error.statusMessage || error.message || 'An unexpected error occurred.' }}
          </p>

          <!-- Action Buttons -->
          <div class="space-y-3">
            <!-- Go Back Button -->
            <button
              @click="handleGoBack"
              class="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <ArrowLeft class="h-4 w-4 mr-2" />
              Go Back
            </button>

            <!-- Home Button -->
            <NuxtLink
              :to="getRedirectPath()"
              class="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <Home class="h-4 w-4 mr-2" />
              {{ userRole ? 'Go to Dashboard' : 'Go to Login' }}
            </NuxtLink>
          </div>

          <!-- Additional Help for 403 Errors -->
          <div v-if="error.statusCode === 403" class="mt-8 p-4 bg-blue-50 rounded-md">
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
        If this problem persists, please contact support.
      </p>
    </div>
  </div>
</template>

<style scoped>
/* Additional styles if needed */
</style>
