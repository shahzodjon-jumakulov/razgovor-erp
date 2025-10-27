<script setup lang="ts">
// Set page meta
definePageMeta({
  layout: 'default'
})

useHead({
  title: 'Pending Approval'
})

const { user, profile, logout, isApproved } = useAuth()

// Redirect approved users away from this page
if (process.client && profile.value && isApproved.value) {
  await navigateTo('/')
}

// Redirect unauthenticated users to login
if (process.client && !user.value) {
  await navigateTo('/auth/login')
}

const handleLogout = async () => {
  await logout()
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <!-- Pending Icon -->
        <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-6">
          <svg class="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h2 class="text-3xl font-bold text-gray-900 mb-2">
          Account Pending Approval
        </h2>

        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div class="ml-3">
            <h3 class="text-sm font-medium text-yellow-800">
              Your account is not yet approved
            </h3>
            <div class="mt-2 text-sm text-yellow-700">
              <p>
                Your account has been created successfully, but it requires approval from an administrator before you
                can access the system.
              </p>
            </div>
          </div>
        </div>

        <div class="space-y-4">
          <div class="text-sm text-gray-600">
            <p><strong>Account:</strong> {{ profile?.email }}</p>
            <p><strong>Role:</strong> {{profile?.role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}}</p>
          </div>

          <button @click="handleLogout"
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors">
            Sign Out
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
